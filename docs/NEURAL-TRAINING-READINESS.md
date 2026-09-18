# Neural training readiness — 2026-09-18

## Selected model and data

Use the full supplied FAFB v783-derived leaky integrate-and-fire network at
upstream commit a3db62f9436074e485c0278290c2164ed6150808. This matches the FAFB
v783 snapshot supported by [Codex](https://codex.flywire.ai/faq). Codex provides
connectome data and annotations, not a pretrained dinosaur controller. Newer
BANC and other datasets are not substituted into a simulator built for these
FAFB inputs.

The existing fetch command downloaded the upstream processed files and verified
all five provenance checksums. The model has 138,639 neurons and 15,091,983
weighted connection rows; those rows are not individual synapses. This derivative
is not asserted identical to Codex's current filtered display or raw exports.
No new filtering, connectivity training, paid compute or dataset redistribution
was performed. Data and environments remain in ignored research/.

Codex's [official FAQ](https://codex.flywire.ai/faq) recommends static downloads,
with a Codex token from the account page for programmatic download resources.
The download portal returned the sign-in page here. No credentials were supplied
and no access controls were bypassed. This run used the project's already chosen
public upstream derivative, not a direct authenticated Codex export.

## Experiments performed

services/brain/readiness.py builds the full verified model in isolated workers,
uses dt=0.1ms and the existing documented reset correction, and separates setup,
one cold 50ms window, and three subsequent 50ms execution windows. Per-window
timing still includes Brian runtime preparation and Python scheduling; it is a
measured repeated-window cost, not an isolated kernel time or online latency.
Two seeds (7/23) test sugar GRNs at 0/200Hz and P9 at 0/100Hz.

The pinned upstream example notebook labels the selected downstream P9_oDN1
neurons as forward-associated and MN9 as proboscis feeding motor neurons. The
notebook is independently checksum-verified by readout-mapping.json. Outputs are
disjoint from directly stimulated cells, checked at runtime; no readout is chosen
after observing results. These attributions remain candidate biological mappings,
not independently verified dinosaur steering or game-action evidence.

The fixed candidate decoder pools bilateral forward counts into a bounded speed
using an explicitly engineered 100Hz scale; turn remains zero. Feeding spikes
activate a candidate interaction. Nothing learns. Numerical response does not
validate that engineered scale or establish a sensory navigation decoder.

### NumPy full-network results

24 repeated windows: median 1.061s, minimum 0.814s, maximum 11.265s per 50ms of
simulation. The median is about 21.2 wall seconds per simulated second. Large
wall-time outliers are retained; this is shared hardware, not a dedicated-host
guarantee. Approximately 2.58GiB peak process RSS was observed. All no-stimulation
readouts were zero.

| Intervention | Seed | Feeding spikes in three windows | Forward spikes in three windows |
|---|---:|---|---|
| Sugar 200Hz | 7 | 8,6,7 | 0,0,0 |
| Sugar 200Hz | 23 | 7,7,5 | 0,0,0 |
| P9 100Hz | 7 | 0,0,0 | 1,2,1 |
| P9 100Hz | 23 | 0,0,0 | 1,1,1 |

All eight conditions passed in-process replay: after Network.store/restore with
random-state restoration, an additional window reproduced neuron voltage,
conductance, all spike counts and simulation time exactly. This tests continuation
within one process, not cross-restart persistence, atomic world/neural storage,
server reconnect, public sessions or checkpoint file safety.

Machine-readable results: neural-readiness-numpy.json. Earlier workers omit the
backend field; they ran the explicitly NumPy-only/default NumPy code. The added
backend option does not change the equations or input/readout definitions.

### Food-feedback trace

Four additional conditions use sugar at 0/200Hz with both seeds. The toy world
starts with one food object. Feeding readout consumption removes it; subsequent
observations disable the sugar inputs. This deliberately simplified food-presence
to gustatory-drive mapping is engineered, not a complete biological sensor model.

With stimulation, both seeds consume once in the first window. Subsequent feeding
counts are 3 then 0 (seed 7), and 2 then 0 (seed 23); residual activity is retained
and reported. Controls never consume. Each trace logs food observation, applied
stimulus rate, neural output, candidate action and resulting food availability.
All four also pass in-process neural replay. This is an offline feeding loop, not
a networked service or cue-choice training. Results: neural-feeding-feedback.json.

## Reproduce

```sh
python -m venv research/venv
research/venv/bin/python -m pip install -r services/brain/requirements.txt
research/venv/bin/python services/brain/fetch.py
research/venv/bin/python services/brain/readiness.py --check-restore
research/venv/bin/python services/brain/readiness.py --feeding-feedback --check-restore --output research/feeding-feedback.json

python -m venv research/compiled-venv
research/compiled-venv/bin/python -m pip install -r services/brain/requirements-compiled.txt
CC=gcc CXX=g++ research/compiled-venv/bin/python services/brain/readiness.py --backend cython --check-restore --output research/readiness-cython.json
```

The baseline clean venv's NumPy import terminated with SIGBUS in this workspace.
The successful baseline used a system-site-packages venv with the installed
NumPy/Pandas/SciPy versions matching the pinned core dependencies, adding missing
Brian2/PyArrow/SymPy tooling separately. Actual core versions accompany each result.
The compiled profile is separate; it leaves the baseline pins untouched.

Brian2's [runtime documentation](https://brian2.readthedocs.io/en/2.8.0/user/computation.html)
explains explicit NumPy/Cython selection, compiled caching and runtime overhead.
Compilation initially failed because Python's configured clang++ was unavailable;
explicit GCC/G++ resolves compiler selection. A NumPy 2.3.5 / Cython 3.3.0 attempt
then failed with an NPY_OWNDATA attribute error, with no usable timing results.
requirements-compiled.txt instead pins NumPy 1.26.4 and Cython 3.0.12.

## Compiled profile result and gate

All eight compiled conditions completed with exact in-process replay. The 24
repeated 50ms windows have median 0.390s, minimum
0.309s and maximum 0.788s. Peak RSS is
2753.0MiB. The entire final spike-count
vector SHA-256 matches the corresponding NumPy condition in all eight cases
after 250ms of simulation; this checks counts for these short interventions,
not spike-time equality, biological accuracy or long-horizon backend equivalence.
Machine-readable results: neural-readiness-cython.json.

These are different dependency profiles as well as code-generation targets;
the comparison is not a pure isolated compiler speedup. The median compiled
window is about 7.8 times the 50ms wall-time
budget before networking, rendering or world processing. **Interactive 20Hz
full-model gate remains NO-GO on both tested CPU profiles.**

Candidate downstream response and toy food feedback have positive evidence.
Interactive performance, validated environment cue/steering mappings and an
authoritative service with cross-restart neural/world/RNG persistence remain
open. Association training was not executed, and no trained checkpoint exists.
The next compute experiment should assess an optimized standalone/GPU backend
with preserved model fidelity and a usable state/control boundary, or evaluate
an explicitly labeled reduced model separately. No paid compute is provisioned
and no reduced model is silently substituted.

## Training protocol and remaining prerequisites

services/brain/training-protocol.json predeclares training seeds 101–104 and
held-out seeds 201–208, balanced cue positions, acquisition and reversal budgets,
frozen evaluation, trained/learning-disabled/random/fixed-cue baselines, parameter
hashes, latency, restart retention and a paired improvement criterion.
It is a planned protocol, not an executed experiment or a trained checkpoint.
Two distinct cue populations remain unselected until their sensory mappings are
validated; neither reward identity nor correct target location may leak into
policy observations. No seed or phase is exposed to the policy.

The explicit adapter would learn; imported connectome weights would stay fixed.
No biological synaptic learning, retained fly memories, sentience or improved
choice accuracy is claimed. Before executing association training, resolve
interactive compute, validated cue/navigation mappings, an authoritative local
service with session protections and cross-restart neural/world/RNG restoration.
Code/data usage and redistribution decisions remain open; no public service or
commercial approval is inferred from a public GitHub checkout.
