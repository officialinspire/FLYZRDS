"""Independent harness invoking pinned upstream model. No app/backend integration."""
import argparse
import hashlib
import importlib.metadata
import json
import os
from pathlib import Path
import platform
import resource
import subprocess
import sys
import time
from fetch import verify, MANIFEST

def worker(root, rate, seed_value, duration):
    started = time.perf_counter()
    manifest = json.loads(MANIFEST.read_text())
    verify(root, manifest)
    # Upstream's benchmark module name conflicts with this harness name only when
    # imported as a library; the worker is executed as __main__.
    sys.path.insert(0, str(root / 'code'))
    from brian2 import Network, prefs, seed, defaultclock, ms, Hz
    from run_brian2_cuda import create_network, add_poisson_inputs, default_params
    import pandas as pd
    prefs.codegen.target = 'numpy'
    defaultclock.dt = 0.1 * ms
    seed(seed_value)
    params = dict(default_params)
    params['eq_rst'] = 'v = v_rst; g = 0 * mV'
    params['r_poi'] = rate * Hz
    params['t_run'] = duration * 1000 * ms
    neurons, synapses, monitor, ids, timings = create_network(root/'data/2025_Completeness_783.csv', root/'data/2025_Connectivity_783.parquet', params)
    # Read declared upstream population without inventing IDs.
    from benchmark import get_experiment
    population = get_experiment('sugar')['neu_exc']
    indices = [int(ids.index.get_loc(i)) for i in population]
    pois = add_poisson_inputs(neurons, indices, [], params)
    net = Network(neurons, synapses, monitor, *pois)
    setup_s = time.perf_counter() - started
    run_start = time.perf_counter()
    net.run(duration * 1000 * ms)
    run_s = time.perf_counter() - run_start
    counts = monitor.count[:]
    stimulated = set(indices)
    downstream = sum(int(n) for i, n in enumerate(counts) if i not in stimulated)
    digest = hashlib.sha256(counts.tobytes()).hexdigest()
    active = [(str(ids.index[i]), int(n)) for i, n in enumerate(counts) if n]
    active.sort(key=lambda pair: pair[1], reverse=True)
    result = {'rate_hz': rate, 'seed': seed_value, 'simulated_s': duration, 'setup_s': setup_s,
              'run_s_including_brian_prepare': run_s, 'wall_s_per_simulated_s': run_s/duration,
              'peak_rss_mib': resource.getrusage(resource.RUSAGE_SELF).ru_maxrss/1024,
              'neurons': len(ids), 'weighted_connection_rows': len(synapses),
              'total_spikes': int(sum(counts)), 'downstream_spikes': downstream,
              'active_neurons': len(active), 'spike_counts_sha256': digest,
              'top_active_flywire_ids': active[:10], 'upstream_timings_s': timings,
              'data_bytes': sum((root/n).stat().st_size for n in manifest['files'] if n.startswith('data/')),
              'python': platform.python_version(), 'platform': platform.platform(),
              'cpu_count': os.cpu_count(), 'cpu': next((line.split(':',1)[1].strip() for line in Path('/proc/cpuinfo').read_text().splitlines() if line.startswith('model name')), 'unknown'),
              'packages': {n: importlib.metadata.version(n) for n in ['brian2','numpy','pandas','pyarrow','sympy','scipy','joblib']}}
    print('RESULT_JSON=' + json.dumps(result), flush=True)

def main():
    p = argparse.ArgumentParser()
    p.add_argument('--upstream', type=Path, default=Path('research/fly-brain'))
    p.add_argument('--seconds', type=float, default=0.1)
    p.add_argument('--output', type=Path, default=Path('research/benchmark.json'))
    p.add_argument('--worker', action='store_true')
    p.add_argument('--rate', type=float, default=200)
    p.add_argument('--seed', type=int, default=7)
    args = p.parse_args()
    if not 0 < args.seconds <= 1:
        p.error('Use a bounded smoke duration: 0 < seconds <= 1')
    if args.worker:
        worker(args.upstream.resolve(), args.rate, args.seed, args.seconds)
        return
    results = []
    for rate, seed_value in [(0,7),(200,7),(0,23),(200,23)]:
        cmd = [sys.executable, str(Path(__file__).resolve()), '--worker', '--upstream', str(args.upstream.resolve()), '--seconds', str(args.seconds), '--rate', str(rate), '--seed', str(seed_value)]
        run = subprocess.run(cmd, text=True, capture_output=True, timeout=300)
        if run.returncode:
            raise RuntimeError(run.stdout + run.stderr)
        line = next(line for line in run.stdout.splitlines() if line.startswith('RESULT_JSON='))
        result = json.loads(line.split('=',1)[1]); results.append(result)
        args.output.parent.mkdir(parents=True, exist_ok=True)
        args.output.write_text(json.dumps({'complete': len(results)==4, 'results': results}, indent=2)+'\n')
        print(f"rate={rate} seed={seed_value}: spikes={result['total_spikes']} downstream={result['downstream_spikes']} wall/sim={result['wall_s_per_simulated_s']:.2f}", flush=True)

if __name__ == '__main__':
    main()
