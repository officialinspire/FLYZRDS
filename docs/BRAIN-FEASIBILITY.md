# Brain feasibility — measured smoke result

**Headless propagation: PASS. Interactive pet deployment: NO-GO on the tested path.**

Measured on September 17, 2026 using Python 3.12.14, Brian2 2.8.0 / NumPy runtime, Linux AMD EPYC 9V74. Runtime reported 9 logical CPUs; this is not a dedicated-hardware performance guarantee. Package versions and individual measurements are in [brain-benchmark.json](brain-benchmark.json).

## Data and provenance

Public upstream: https://github.com/eonsystemspbc/fly-brain at `a3db62f9436074e485c0278290c2164ed6150808`.
Data source reference: https://codex.flywire.ai/?dataset=fafb.
Exact hashes and assumptions: `services/brain/provenance.json`.

Downloaded upstream processed FAFB v783 tables: 138,639 neuron rows; 15,091,983 weighted connection rows; summed Connectivity = 54,492,922 synapses. Two input files total 104,270,629 bytes. These counts were inspected from the files, not inferred from the README. This is not asserted equivalent to the current interactive Codex display or an untouched biological brain. Upstream processing accounts for differences and needs additional documentation before scientific comparisons.

No extra connection filtering was applied. Presynaptic/postsynaptic index bounds are 0–138638. Upstream signed connectivity weights are used as supplied. The model uses simplified leaky integrate-and-fire dynamics, homogeneous parameters and transmitter-derived signs; biological completeness is not established.

## Experiment

The pinned upstream `sugar` definition supplies 21 gustatory receptor neuron IDs. Each condition runs in a separate process, with explicit dt=0.1ms, seeds 7/23, 0.1 simulated seconds, and either 0Hz or 200Hz Poisson stimulation. Neurons start at rest. Same population/refractory configuration is retained for the no-stimulation control.

A documented compatibility correction removes `w = 0` from the reset expression because w belongs to Synapses, not the NeuronGroup. Remaining reset behavior and connectivity parameters are unchanged. Upstream code is imported from the verified checkout. NumPy runtime is selected explicitly rather than claiming optimized C++/GPU performance.

| Condition | Seed | Total spikes | Downstream spikes (excludes input population) | Active neurons | Run wall seconds | Peak RSS MiB |
|---|---:|---:|---:|---:|---:|---:|
| No stimulation | 7 | 0 | 0 | 0 | 2.264 | 2637.6 |
| Sugar 200Hz | 7 | 1471 | 1092 | 326 | 2.305 | 2628.5 |
| No stimulation | 23 | 0 | 0 | 0 | 2.214 | 2640.1 |
| Sugar 200Hz | 23 | 1541 | 1129 | 328 | 2.312 | 2634.5 |

Startup including imports/checksum/data/network construction: 3.60–5.24 seconds. `net.run` timing includes Brian's preparation overhead; dividing by this short 0.1s trial gives 22.1–23.1 wall seconds per simulated second. **This is a cold short-run ratio, not a steady-state throughput benchmark.** Peak RSS is Linux process high-water memory. No GPU, browser, phone, concurrent-pet or production billing benchmark was performed.

This establishes that stimulation changes downstream activity in this model. It does not establish perception, learning, consciousness, a retained original fly memory, or useful dinosaur behavior.

## Proposed bounded decoder — not implemented or validated

For a later navigation experiment, upstream labels P9 left/right IDs `720575940627652358` and `720575940635872101` as forward-walking candidates. Verify their functional roles and readout suitability from primary evidence before use. A candidate game decoder could map a 50ms output window's aggregate rate through `speed=clamp(rate/scale,0,1)`, then require a separately supported steering population before allowing signed turn values. Scale/window/body motion are engineered mappings, not biological facts. Do not infer left/right steering from names alone. The sugar smoke test does not validate this decoder.

## Gate and next steps

- PASS: data accessible without private credentials; pinned source and checksums; full supplied network executes; two seeds plus controls; bounded runtime and memory evidence.
- OPEN: direct data redistribution terms and detailed upstream preprocessing provenance.
- NO-GO for live pet: no validated sensory/action adapter, no continuous latency measurement, no learning and no persistent neural service. The tested cold CPU path is unsuitable for synchronous 20Hz app interaction.
- Next research: measure warmed continuous execution/optimized backend, test a documented motor readout with controls, then evaluate a bounded reduced-model option if needed and label it accurately. No paid compute is provisioned.

The UI/controller/save phases are independent and proceed in explicit demo mode. Prompt 05 remains blocked; do not mark a neural release ready based on this report.
