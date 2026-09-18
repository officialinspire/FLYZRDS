# Art direction

Cartoon 16-bit-style chibi fantasy. Warm, kind, curious. Cream type on midnight violet, mint primary action, gold accents. Short pixel-like identity labels; readable system font for longer UI text. No external fonts/network artwork required.

First companion: oversized-head mint long-neck, tiny feet, crooked purple wizard hat, cape and glowing staff. Night garden with mushrooms, moon and rune stones. The generated source sheets now live in art/source; checked runtime atlases live in apps/web/public/assets. render.ts composes the garden using these assets.

Phase 04 must define frame geometry/pivots before raster generation. Planned states: idle, walk, eat, play, rest, cast, ward, celebrate. Keep tail/hat in bounds, consistent logical pixels and nearest-neighbor scale. Original assets only; no borrowed Pokémon/Tamagotchi characters.

Phase 04 source cells were imperfectly aligned at 1254×1254, so inspected custom crop boundaries replace the requested exact source grid. A single uniform scale per atlas, bottom-ground alignment, crisp alpha, and nearest-neighbor resizing produce consistent 64px pet / 32px prop cells. No hats/tails/effects touch final cell boundaries. See ASSET-MANIFEST.md and art/SOURCES.md.
