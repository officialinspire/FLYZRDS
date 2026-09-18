# Prompt 05 prerequisite review

Reviewed 2026-09-18 against the supplied development prompt pack and committed
research evidence. **BLOCKED — live neural service not implemented.**

Prompt 05 requires Prompt 01 to have succeeded. The pack also directs:
“If a research gate fails, record the evidence and stop dependent neural work.”
The headless propagation smoke passed, but the interactive-controller gate did
not. A smoke-test success does not satisfy the documented live-controller gate.

| Required evidence | Current evidence | Status |
|---|---|---|
| Real pinned model and inputs | provenance.json pins upstream commit, input hashes and supplied full network | Smoke passed |
| Measured interactive execution | Four cold 0.1s runs take 2.214–2.312 wall seconds; preparation included; no warmed continuous measurements | Open |
| Documented sensory/action mapping | Sugar population tested; P9 forward-walking candidates only proposed; no evidenced steering decoder | Open |
| Closed-loop neural influence | Downstream spikes differ under stimulation; no world stimulus/action/feedback trace | Open |
| Consistent neural/world restoration | Existing saves persist the demo controller; no full neural checkpoint restoration evidence | Not implemented |
| Local service safety | No service exposed; server session isolation, ownership, sequencing, idempotency, origins and rate limits unimplemented | Not implemented |
| Model/data licensing decision | GPL-2.0 code noted; separate data terms and preprocessing provenance unresolved | Open |

Evidence: [feasibility](BRAIN-FEASIBILITY.md), [measurements](brain-benchmark.json),
[licensing](LICENSING.md), services/brain/provenance.json, and
services/brain/benchmark.py. These are existing September 17 measurements, not
a new benchmark. The current workspace has no fetched upstream research checkout;
no new simulation or end-to-end latency measurement was performed in this review.

## Work needed to unblock

1. Measure warmed continuous execution on the pinned model, separating setup from
   per-window execution. Report actual latency and whether interactive speed is viable.
2. Validate a documented output population with stimulated/control conditions and
   repeatable seeds; document the engineered body/action mapping and its limits.
   Do not treat left/right names as steering evidence.
3. Record the applicable model/data usage decision and preprocessing provenance.
4. Reassess the gate with this evidence. A reduced model is a separate explicitly
   labeled option, not an automatic replacement for the full model.
5. Only after a positive gate, implement Prompt 05's local-only authoritative
   service, session protections, atomic checkpoints, reconnect semantics, tests,
   stimulus/action/feedback traces and end-to-end measurements.

The frontend remains a labeled scripted demo. Prompt 06 association learning is
also blocked until genuine closed-loop control works. No service deployment,
brain reset, silent mode switch, data redistribution or neural release is claimed.
