# FOF Phase 0 — Preliminary Repository Audit

Audit date: 10 October 2026  
Source: uploaded `FOF-main.zip` (GitHub main branch archive)  
Scope: static source/configuration inspection and available dependency-free validation checks. This is not yet a full browser/runtime audit.

## Executive summary

Phase 0 is **partially complete**. The uploaded source was extracted and inspected. The project has React + TypeScript + Vite, a fighting simulation in `src/components/fof/FofStageCanvas.tsx` and engine utilities including `src/utils/fightingEngine.ts` and `src/utils/battleEngine.ts`, a Three.js combat renderer at `src/components/fof/CombatRenderer.tsx`, and a character animation controller at `src/game/CharacterAnimationController.ts`.

The combat graphics harness passed 4/4 checks. Asset validation passed, and animation asset validation passed for its sample set. Source validation could not run because dependencies were not installed in the extracted working copy (`typescript` module missing). Lint/build were not run. No live browser test was performed.

## Architecture map

- `src/main.tsx` — application entry point.
- `src/App.tsx` — top-level UI and game composition; imports `FofStageCanvas`.
- `src/context/GameContext.tsx` — shared game context/state.
- `src/components/fof/FofStageCanvas.tsx` — main fight screen/orchestration, input/game loop, state updates, overlays and rendering composition.
- `src/components/fof/CombatRenderer.tsx` — Three.js-based stage/fighter rendering implementation.
- `src/components/fof/FofStage25DView.tsx` — thin wrapper forwarding props/ref to `CombatRenderer`.
- `src/components/fof/FofHumanFighterSprite.tsx` — image/sprite-based fighter presentation also used in replay, roster, codex and training UI.
- `src/game/CharacterAnimationController.ts` — maps entity states to animation actions and frame selection.
- `src/utils/fightingEngine.ts`, `src/utils/battleEngine.ts`, `src/utils/fofPhysics.ts` — combat/physics logic candidates requiring deeper function-by-function trace.
- `src/utils/keyboardControls.ts`, `src/utils/gamepad.ts` — input handling.
- `src/data/fightingMoves.ts`, `src/data/characters.ts`, `src/data/stageBackgrounds.ts` — move, roster and stage data.
- `src/utils/characterAssetLoader.ts`, `src/utils/CharacterLoader.ts`, `src/components/fof/CharacterLoader.ts` — multiple character-loading modules; overlap/duplication should be reviewed.
- `src/tests/CombatGraphicsTestHarness.ts`, `scripts/validate_source.mjs`, `scripts/validate_assets.mjs`, `scripts/validate_animation_assets.py` — test and validation tools.
- `FOF_character_specs.json`, `FOF_special_move_matrix.csv` — character/move specification inputs for generated assets.

## Actual gameplay flow (initially traced)

1. `src/main.tsx` mounts the React application.
2. `src/App.tsx` composes the UI and renders `FofStageCanvas` for the fighting experience.
3. `FofStageCanvas.tsx` owns much of the live match orchestration: it has a `requestAnimationFrame` loop, updates entity `stateFrame`, and handles combat state updates and hitstun/recovery paths.
4. Input handling is supported by keyboard and gamepad utilities.
5. The stage view delegates to `FofStage25DView`, which forwards to `CombatRenderer`.
6. Character animation selection is handled by `CharacterAnimationController`; `FofHumanFighterSprite` is also used by non-live-match screens and replay rendering.

This trace is based on imports and code searches; a complete function-level trace of every input-to-hit path remains pending.

## Validation baseline

| Check | Result | Notes |
|---|---|---|
| `node scripts/validate_source.mjs` | BLOCKED | Failed with `ERR_MODULE_NOT_FOUND: Cannot find package 'typescript'`; the extracted copy has no installed dependencies. This is an environment/dependency precondition failure, not proof of source syntax errors. |
| `node scripts/validate_assets.mjs` | PASS | All listed sample fighter cutouts, stages and action manifests passed. |
| `python3 scripts/validate_animation_assets.py` | PASS | 3 sample characters and 18 actions/character validated. |
| `node --experimental-strip-types src/tests/CombatGraphicsTestHarness.ts` | PASS | 4/4: Z separation, ground shadow anchoring, animation state transitions, lighting/material compliance. Node emitted an experimental type-stripping warning. |
| `npm run lint` | NOT RUN | Dependencies not installed; run after `npm ci`. |
| `npm run build` | NOT RUN | Dependencies not installed; run after `npm ci`. |
| Browser/gameplay smoke test | NOT RUN | Requires launch and visual interaction. |

## Confirmed findings / risks

1. **Multiple fighter presentation paths exist.** `CombatRenderer.tsx` is the main 2.5D renderer, while `FofHumanFighterSprite.tsx` is imported by live-stage overlays/trails and several other screens. Audit whether any live-match path still displays a static cutout instead of action frames.
2. **Multiple character loader implementations exist.** `src/utils/characterAssetLoader.ts`, `src/utils/CharacterLoader.ts`, and `src/components/fof/CharacterLoader.ts` warrant consolidation/ownership review. Their existence alone does not prove a bug.
3. **The main game loop is concentrated in a large component.** `FofStageCanvas.tsx` includes an animation loop and many state updates. This increases the risk of timing and responsibility coupling; exact defects require tracing and tests.
4. **Hardcoded fighter cutout paths remain in move data.** `src/data/fightingMoves.ts` references `/assets/characters/arjun/fighter_cutout.png`, `/assets/characters/steele/fighter_cutout.png`, and `/assets/characters/david/fighter_cutout.png`. Verify that these are intended for portraits/metadata and are not overriding action-specific animation assets.
5. **Sample validation is not full-roster validation.** The animation validator reports 3 characters and 18 actions per character; the project has a broader character roster. Full roster asset coverage remains unproven.
6. **Source validation has an undeclared runtime precondition.** `validate_source.mjs` imports `typescript`, so it cannot run until dependencies are installed (`npm ci` or equivalent).
7. **The archive includes macOS metadata files** (`.DS_Store`, `__MACOSX` entries). These are repository hygiene noise, not a gameplay defect.

## Not yet confirmed

- Whether all attacks, hitboxes, damage, hitstun, recovery, jumping and facing use one consistent deterministic clock.
- Whether the jump bug is fixed in actual gameplay.
- Whether camera framing and stage scaling avoid cropping at common aspect ratios.
- Whether all characters map to the correct action sprite sheets.
- Whether there are stale generated files or invalid dependency versions.
- Whether the game builds and launches successfully after a clean dependency installation.

## Prioritized next steps

1. Install from lockfile using `npm ci` in a clean working copy; capture Node/npm versions and complete output.
2. Run `npm run validate:source`, `npm run validate:assets`, `npm run test:combat-graphics`, `npm run validate:animation`, `npm run lint`, and `npm run build` individually and record exit codes.
3. Trace `FofStageCanvas.tsx` input -> state transition -> engine/collision -> stateFrame -> renderer, documenting exact function names and frame semantics.
4. Audit `CombatRenderer.tsx`, `CharacterAnimationController.ts`, and `FofHumanFighterSprite.tsx` for the live fighter rendering path and any fallback image rendering.
5. Cross-check every character in `FOF_character_specs.json` and every required action in `FOF_special_move_matrix.csv` against `public/assets/characters/**/actions/` and manifests.
6. Run browser smoke tests: idle, walk both directions, jump/land, light/heavy attacks, hit reaction, knockdown/recovery, facing swap, close-contact overlap, stage framing at 16:9 and narrower viewport.
7. Only after the above, create the final defect register with severity, file/line references, reproduction steps and acceptance tests.

## Phase 0 status

- [x] ZIP received and source/configuration tree inspected.
- [x] Initial architecture map created.
- [x] Initial gameplay path identified.
- [x] Asset validation passed.
- [x] Combat graphics harness passed 4/4.
- [x] Sample animation validation passed.
- [ ] Source validation after dependency installation.
- [ ] TypeScript lint and production build.
- [ ] Complete input-to-hit function trace and simulation-clock audit.
- [ ] Full-roster asset/mapping audit.
- [ ] Browser gameplay and camera/stage visual verification.
- [ ] Final confirmed-defect list with exact source locations.

**Conclusion:** Phase 0 has progressed beyond the initial documentation-only review, but remains **partially complete**. Do not start a broad rewrite yet. The next gating task is a clean dependency install and complete baseline, followed by a detailed combat/rendering trace and browser smoke test.
