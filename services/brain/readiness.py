"""Bounded, offline prerequisite experiments; no training or public service.

Uses the full pinned FlyWire-derived network. Reports negative readout results
and runtime limits without replacing the model or choosing outputs post hoc.
"""
import argparse
import hashlib
import importlib.metadata
import json
import math
import os
from pathlib import Path
import platform
import resource
import subprocess
import sys
import time

from fetch import MANIFEST, verify

MAPPING = Path(__file__).with_name('readout-mapping.json')


def validate_budget(window_ms, windows):
    if not math.isfinite(window_ms) or not 10 <= window_ms <= 100:
        raise ValueError('window-ms must be finite and between 10 and 100')
    if type(windows) is not int or not 2 <= windows <= 10:
        raise ValueError('windows must be an integer between 2 and 10')


def decode_candidate(counts, seconds):
    """Fixed engineered scale, not learned/biological dinosaur kinematics.

    No steering is inferred from bilateral names. Directly stimulated neurons
    are never members of these downstream readouts.
    """
    if not math.isfinite(seconds) or seconds <= 0:
        raise ValueError('Invalid window duration')
    if set(counts) != {'forward', 'feeding'}:
        raise ValueError('Unknown readout')
    if any(type(v) is not int or not 0 <= v <= 100000 for v in counts.values()):
        raise ValueError('Invalid readout count')
    return {'speed': min(1.0, counts['forward'] / (2 * seconds * 100)),
            'turn': 0.0, 'interact': counts['feeding'] > 0}


def worker(root, experiment, rate, seed_value, window_ms, windows, restore, backend,
           feedback=False):
    validate_budget(window_ms, windows)
    started = time.perf_counter()
    provenance = json.loads(MANIFEST.read_text())
    mapping = json.loads(MAPPING.read_text())
    verify(root, provenance)
    verify(root, {'files': mapping['evidence_files']})
    # The harness has no module named benchmark, so upstream imports resolve.
    sys.path.insert(0, str(root / 'code'))
    from brian2 import Network, prefs, seed, defaultclock, ms, Hz
    from run_brian2_cuda import create_network, add_poisson_inputs, default_params
    from benchmark import get_experiment
    import numpy as np
    prefs.codegen.target = backend
    defaultclock.dt = 0.1 * ms
    seed(seed_value)
    params = dict(default_params)
    params['eq_rst'] = 'v = v_rst; g = 0 * mV'
    params['r_poi'] = rate * Hz
    neurons, synapses, monitor, ids, timings = create_network(
        root / 'data/2025_Completeness_783.csv',
        root / 'data/2025_Connectivity_783.parquet', params)
    inputs = [int(ids.index.get_loc(i)) for i in get_experiment(experiment)['neu_exc']]
    readouts = {k: [int(ids.index.get_loc(int(i))) for i in v]
                for k, v in mapping['readouts'].items()}
    if any(set(indices) & set(inputs) for indices in readouts.values()):
        raise ValueError('Direct stimulation leaks into readout')
    pois = add_poisson_inputs(neurons, inputs, [], params)
    net = Network(neurons, synapses, monitor, *pois)
    setup_s = time.perf_counter() - started
    before = time.perf_counter()
    net.run(window_ms * ms)
    cold_window_s = time.perf_counter() - before
    records = []
    food_available = True
    for index in range(windows):
        observed_food = food_available
        if feedback:
            for population in pois:
                population.active = observed_food
        previous = monitor.count[:].copy()
        before = time.perf_counter()
        net.run(window_ms * ms)
        wall_s = time.perf_counter() - before
        delta = monitor.count[:] - previous
        counts = {k: int(sum(delta[i] for i in indices))
                  for k, indices in readouts.items()}
        action = decode_candidate(counts, window_ms / 1000)
        if feedback and action['interact']:
            food_available = False
        records.append({'window': index, 'wall_s_including_runtime_prepare': wall_s,
                        'total_spikes': int(sum(delta)),
                        'downstream_spikes': int(sum(delta) - sum(delta[i] for i in inputs)),
                        'readout_spikes': counts, 'candidate_action': action,
                        'feedback': {'food_before': observed_food,
                                     'applied_rate_hz': rate if observed_food else 0,
                                     'food_after': food_available} if feedback else None})
    restored = None
    if restore:
        # In-process replay only; not a cross-restart, cloud or atomic world save.
        net.store('probe')
        net.run(window_ms * ms)
        expected_counts = monitor.count[:].copy()
        expected_v = neurons.v[:].copy()
        expected_g = neurons.g[:].copy()
        expected_time = float(net.t / ms)
        net.restore('probe', restore_random_state=True)
        net.run(window_ms * ms)
        restored = bool(np.array_equal(monitor.count[:], expected_counts)
                        and np.array_equal(neurons.v[:], expected_v)
                        and np.array_equal(neurons.g[:], expected_g)
                        and float(net.t / ms) == expected_time)
    result = {'experiment': experiment, 'rate_hz': rate, 'seed': seed_value,
              'model_mode': 'full-pinned-network-offline-research', 'backend': backend,
              'feedback_enabled': feedback,
              'window_ms': window_ms, 'windows': records,
              'setup_s': setup_s, 'cold_window_s': cold_window_s,
              'upstream_timings_s': timings,
              'in_process_restore_exact': restored,
              'neurons': len(ids), 'weighted_connection_rows': len(synapses),
              'peak_rss_mib': resource.getrusage(resource.RUSAGE_SELF).ru_maxrss / 1024,
              'spike_counts_sha256': hashlib.sha256(monitor.count[:].tobytes()).hexdigest(),
              'upstream_commit': provenance['commit'],
              'mapping_sha256': hashlib.sha256(MAPPING.read_bytes()).hexdigest(),
              'python': platform.python_version(), 'platform': platform.platform(),
              'cpu_count': os.cpu_count(),
              'packages': {n: importlib.metadata.version(n) for n in
                           ['brian2', 'numpy', 'pandas', 'pyarrow', 'sympy', 'scipy', 'joblib']}}
    print('RESULT_JSON=' + json.dumps(result), flush=True)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--upstream', type=Path, default=Path('research/fly-brain'))
    parser.add_argument('--output', type=Path, default=Path('research/readiness.json'))
    parser.add_argument('--window-ms', type=float, default=50)
    parser.add_argument('--windows', type=int, default=3)
    parser.add_argument('--check-restore', action='store_true')
    parser.add_argument('--backend', choices=['numpy', 'cython'], default='numpy')
    parser.add_argument('--feeding-feedback', action='store_true',
                        help='Offline toy feedback: consuming food disables sugar input')
    parser.add_argument('--worker', action='store_true')
    parser.add_argument('--experiment', choices=['sugar', 'p9'], default='sugar')
    parser.add_argument('--rate', type=float, default=200)
    parser.add_argument('--seed', type=int, default=7)
    args = parser.parse_args()
    try:
        validate_budget(args.window_ms, args.windows)
        if not math.isfinite(args.rate) or not 0 <= args.rate <= 200:
            raise ValueError('rate must be finite and between 0 and 200 Hz')
        if not 0 <= args.seed <= 2**32 - 1:
            raise ValueError('seed must be uint32')
    except ValueError as error:
        parser.error(str(error))
    if args.worker:
        if args.feeding_feedback and args.experiment != 'sugar':
            parser.error('feeding feedback requires sugar experiment')
        worker(args.upstream.resolve(), args.experiment, args.rate, args.seed,
               args.window_ms, args.windows, args.check_restore, args.backend,
               args.feeding_feedback)
        return
    # Predeclared controls and two independent seeds; isolated subprocesses.
    results = []
    for experiment, rate in [('sugar', 0), ('sugar', 200), ('p9', 0), ('p9', 100)]:
        if args.feeding_feedback and experiment != 'sugar':
            continue
        for seed_value in [7, 23]:
            command = [sys.executable, str(Path(__file__).resolve()), '--worker',
                       '--upstream', str(args.upstream.resolve()), '--experiment', experiment,
                       '--rate', str(rate), '--seed', str(seed_value),
                       '--window-ms', str(args.window_ms), '--windows', str(args.windows),
                       '--backend', args.backend]
            if args.check_restore:
                command.append('--check-restore')
            if args.feeding_feedback:
                command.append('--feeding-feedback')
            run = subprocess.run(command, text=True, capture_output=True, timeout=300)
            if run.returncode:
                raise RuntimeError(f'{experiment}/{rate}/{seed_value}:\n{run.stdout}\n{run.stderr}')
            line = next(line for line in run.stdout.splitlines() if line.startswith('RESULT_JSON='))
            result = json.loads(line.split('=', 1)[1])
            results.append(result)
            args.output.parent.mkdir(parents=True, exist_ok=True)
            args.output.write_text(json.dumps({'complete': len(results) == (4 if args.feeding_feedback else 8),
                                              'results': results}, indent=2) + '\n')
            print(f'{experiment} {rate}Hz seed={seed_value}: '
                  f"windows={[round(w['wall_s_including_runtime_prepare'], 3) for w in result['windows']]} "
                  f"readouts={[w['readout_spikes'] for w in result['windows']]} "
                  f"restore={result['in_process_restore_exact']}", flush=True)


if __name__ == '__main__':
    main()
