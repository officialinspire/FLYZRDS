# Phase 04 asset contract (before generation)

Pet: one original jade armored sci-fi long-neck, clean cartoon source art normalized to pixel-sized gameplay frames.
Raptor is reserved, not part of this delivery. Fixed 64×64 logical frames, 4px
transparent safe border, ground pivot (32,60). Art faces right; mirror around
pivot for left. No shadows extending outside the cell, no labels in sprites.

Source sheet: 4 columns × 4 rows, 16 poses in row-major order, two poses per
animation. Target normalized atlas: 256×256 PNG with true alpha. All frames use
one uniform scale and ground alignment; no non-uniform stretching.

| Animation | Frames | Duration per frame | Purpose |
|---|---|---|---|
| idle | 0,1 | 500ms | Stand/blink |
| walk | 2,3 | 200ms | Opposing foot positions |
| eat | 4,5 | 300ms | Nibble berries |
| play | 6,7 | 250ms | Toy interaction |
| rest | 8,9 | 800ms | Curled sleeping |
| cast | 10,11 | 220ms | Bioelectric charge/breath, preview only |
| ward | 12,13 | 300ms | Geometric energy barrier, preview only |
| celebrate | 14,15 | 300ms | Joyful pose |

Props source: separate 4×4 sheet; 32px normalized cells, 2px border. First row:
berry bowl, star toy, nest, egg. Second: grass tile, dirt tile, mushroom, rune stone.
Third: spark, ward, bloom, star effect. Fourth: feed, play, rest, habitat UI icons.
Opaque ground tiles allowed; other cells alpha. Garden tiles assembled into scene.

App icon: generated pet idle frame on code-native violet/gold backdrop, 192 and
512 PNGs plus 180 Apple icon; these are asset deliverables only, not PWA install.

Preview: /sprites.html shows every frame, animation, props and app icon at integer
scales 1×, 2×, 3×. Runtime uses nearest-neighbor sampling. Reduced motion freezes
animation on first frame without stopping care progression.

Validation: inspect generated source before cropping; fixed-cell boundary checks,
alpha and dimensions, all named keys, pivot/edge margins, output sizes and hashes.
Source prompts, originals and normalization recipe are committed with attribution.

## Delivered normalization

The generator returned 1254×1254 source sheets and some art crossed the requested
equal-cell boundaries. Sources were visually inspected; custom source rectangles
in manifest.json and scripts/normalize-assets.py preserve full objects. Sources
are retained unchanged. Alpha threshold 128 removes faint fringes, one uniform
scale per sheet preserves aspect ratios, and frames are centered on a common
ground pivot. Actual bounds and source rectangles are recorded per frame.

Normalized pet 256×256, props 128×128; 16 frames each; runtime PNG total 95,872
bytes including 180/192/512 icons. All eight animation keys are wired. Cast and
Ward are preview-only, not functional combat. Preview at sprites.html includes
all frames, all props, all animations, and icon. The raptor remains reserved.

Passed alpha-safe margins, hashes, and nearest-neighbor 1×/2×/3× bounds checks.
Montage visually inspected for full silhouettes and consistent character identity.
These checks do not establish physical-device DPR or browser-layout acceptance;
real iPhone/Android visual checks remain pending.

## Sci-fi redesign — 2026-09-18

Replacement source: art/source/longneck-scifi-generated.png, 1254×1254 RGBA.
Inspected x boundaries: 0,330,640,950,1254; y: 0,335,645,925,1254.
All 16 complete silhouettes clear these crop boundaries. Same runtime filename,
64px cells, 4px safe border, pivot, animation mapping and frame durations.
App icons regenerated from new idle frame. Original wizard source remains archived.
No hat, cape or staff appears on the new creature. Existing garden props retained.
