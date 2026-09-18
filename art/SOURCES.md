# Artwork provenance

Created for FLYZRDS with the built-in OpenAI image generator on 2026-09-18.
No external reference images or third-party character assets were used. Exact
prompts and tool attribution are in prompts.json. The originals are retained:

- source/longneck-generated.png — 16 original long-neck wizard poses (archived, no longer consumed).
- source/longneck-scifi-generated.png — 16 replacement sci-fi dinosaur poses.
  Redesign prompt and boundary revision are recorded in redesign-prompts.json.
  Generated without external character references; Pokemon is a style influence.
- source/garden-generated.png — 16 props, tiles, spell effects and UI icons.

Runtime outputs: apps/web/public/assets/longneck.png, garden.png, icon-180.png,
icon-192.png and icon-512.png. Manifest records bounds, source crops, animation
mapping, byte sizes and SHA-256 hashes. normalize-assets.py produces these from
the originals using the normalization explicitly requested by prompt 04. Derived
icons use the idle sprite over a simple code-native background. longneck-review.png
is an integer-scale review montage, not a game dependency.

This record is attribution/provenance; it does not select a blanket project license
or assert exclusive copyright in AI-generated material. See docs/LICENSING.md.
