# FOFv3 — Fixed 2.5D Developer Build

## Quick start

Requirements:
- Node.js 20 or newer
- npm 10 or newer
- A modern Chrome/Edge/Firefox/Safari browser

From the project directory:

```bash
./run_local.sh
```

Or manually:

```bash
npm ci
npm run validate:source
npm run validate:assets
npm run dev
```

Open the URL printed by Vite (normally `http://localhost:3000`).

## Validation

```bash
npm run validate:source
npm run validate:assets
```

`validate:source` performs a TypeScript/TSX transpilation/syntax scan. `validate:assets` checks the production character/stage assets used by the fixed 2.5D path.

A full `npm run build` should be run on the developer machine after `npm ci`, because the supplied environment did not contain a complete dependency installation and could not finish an external npm install.

## What changed

See:
- `REVIEW_AND_FIX_REPORT.md`
- `GRAPHICS_2_5D_PLAN.md`

The default 2.5D renderer no longer displays primitive mannequin geometry. It uses human-form full-body combat artwork and a deterministic 2.5D compositor.

## Technology stack

| Technology | Purpose |
|---|---|
| React 19 | Application/UI components |
| TypeScript | Strongly typed game/application code |
| Vite | Dev server and production bundler |
| Three.js | Future/optional true 3D rendering and GLB pipeline |
| CSS transforms | 2.5D camera and low-cost character motion |
| PNG RGBA | Full-body fighter cutouts |
| Existing FOF combat engine | Frame data, movement, attacks, hitstun, projectiles, meter and CPU |
| Lucide React | UI icons |
| Motion | UI transitions/animation utilities |
| canvas-confetti | Victory presentation |

## Character graphics

Production-ready sample visuals included for:
- Arjun
- David Vance
- General Jonas Steele

Arjun also includes:
- `public/assets/characters/arjun/arjun_combat_preview.gif`
- `public/assets/characters/arjun/arjun_combat_preview_sheet.jpg`

The GIF is a demonstration asset. The runtime should use the RGBA PNG and later a real animation atlas for production.

## Recommended next milestone

Do not build all characters simultaneously. Finish a polished vertical slice first:

**Arjun vs David + one stage + 8 normals/actions + 3 specials + super + hit/hurt boxes + CPU + complete HUD + VFX.**

Once that slice is visually and mechanically stable, duplicate the asset/animation contract across the roster.
