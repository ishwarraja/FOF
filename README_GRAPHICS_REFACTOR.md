# FOF v0.4 — Graphics Refactor Quick Start

## Run

```bash
cd FOFv0.4_26Sep
npm ci
npm run lint
npm run test:combat-graphics
npm run validate:animation
npm run dev
```

Open the Vite URL shown by the terminal (normally `http://localhost:3000`).

## Graphics architecture

- React + TypeScript: game UI and orchestration.
- Vite: development and production bundling.
- Three.js/WebGL2: 2.5D combat renderer, depth planes, stage, lighting, shadows and VFX foundations.
- PNG sprite sheets + JSON: deterministic action playback.
- GIF: preview/export fallback, not the preferred runtime format.
- Pillow: reproducible development asset generation.
- Existing FOF fighting engine: movement, frame data, collisions, meter, CPU and projectiles.

## Developer commands

```bash
npm run lint
npm run test:combat-graphics
npm run validate:animation
python3 scripts/generate_action_sprites.py --clean --zip
```

For a fast subset:

```bash
python3 scripts/generate_action_sprites.py --characters arjun david valeria
```

## Production animation workflow

1. Replace generated action PNGs with hand-authored sprite frames or exported animation renders.
2. Keep the same `actions.json` contract.
3. Preserve startup/active/recovery frame metadata.
4. Keep hitboxes separate from artwork.
5. Validate at 60 Hz and in slow-motion training mode.
