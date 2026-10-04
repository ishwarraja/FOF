# FOF v0.4 — Combat Graphics Refactor & Validation Report

## Scope

Audited the supplied `FOFv0.4_26Sep` repository and the 53.87-second 60 FPS gameplay recording supplied with the review request.

### Recording observations

- Player 1 and Player 2 visually interpenetrate during close combat; the old renderer has no independent Z combat planes and uses DOM stacking rather than WebGL depth.
- Fighter contact shadows are CSS ellipses attached to the fighter card instead of a floor-anchored WebGL shadow system.
- The sunset stage is rendered through an `object-cover` image path with additional scaling/parallax transforms. That can crop/enlarge the stage and is not a stable full-stage camera model.
- Combat states exist in the gameplay engine, but the visual path reduces them to broad buckets (`attack`, `kick`, `hit`, `jump`, etc.) and applies transforms to one static image. Therefore light punch, heavy punch, specials and recovery do not have independent frame sequences.
- `stateFrame` is incremented from the browser animation loop rather than from a deterministic simulation accumulator, so visual/combat frame timing can vary with display refresh rate.

## Root causes

1. **Single-card renderer** — `FofStage25DView.tsx` and `FofHumanFighterSprite.tsx` used a single `fighter_cutout.png` per fighter.
2. **State collapsing** — multiple gameplay states were mapped to one visual action bucket and never selected frame metadata.
3. **No explicit depth planes** — P1/P2 were DOM siblings; there was no WebGL Z separation or depth policy.
4. **Grounding was cosmetic** — shadow blobs followed the card instead of being clamped to Y=0.
5. **Stage framing was unstable** — `object-cover`, 115% image sizing and camera transforms could enlarge/crop the background.
6. **Lighting was not unified** — the 2D fighter cards were not receiving the same 3D stage lighting model.

## Implemented refactor

### `src/components/fof/CombatRenderer.tsx`

- Three.js WebGL2-compatible renderer path.
- Perspective 2.5D camera with a fixed stage backplate.
- Complete stage texture is never scaled based on fighter positions; camera framing changes instead.
- P1 combat plane: `Z = +0.05`.
- P2 combat plane: `Z = -0.05`.
- Minimum plane separation: `0.10` world units, exceeding the required `0.08`.
- Dynamic `renderOrder`: active striker receives priority.
- Character material: `depthWrite=true`, `DoubleSide`, `alphaTest=0.5`, polygon offset.
- Character meshes cast shadows.
- Stage floor receives directional shadows.
- Contact shadow blob remains on the floor plane and only changes scale/opacity with jump altitude.
- `PCFSoftShadowMap` enabled.
- `ACESFilmicToneMapping` enabled.
- Exposure set to `1.15`.
- Warm sunset hemisphere + directional key lighting.
- WebGL projectile depth planes.

### `src/game/CharacterAnimationController.ts`

- Deterministic action state mapping.
- Looping actions: idle, walk forward/back, crouch.
- One-shot actions: punch/kick/special/hurt/knockdown/KO.
- Explicit startup / active / recovery metadata.
- Active-frame hitbox metadata.
- One-shot completion returns to idle.
- Damage can interrupt startup immediately.
- Gameplay `stateFrame` remains authoritative for deterministic playback.

### `scripts/generate_action_sprites.py`

- Reads `FOF_character_specs.json` and `FOF_special_move_matrix.csv`.
- Generates action PNG sprite sheets, GIF previews and JSON frame metadata.
- Generates distinct frame sequences using controlled pose transforms, anticipation/recovery timing and action-specific VFX accents.
- Supports complete roster generation with `--characters` for faster development subsets.
- Current bundle includes complete generated sample sets for Arjun, David and Valeria.
- Run without `--characters` to generate the full roster.

### `src/tests/CombatGraphicsTestHarness.ts`

Automated tests:

1. `test_character_z_separation()`
2. `test_ground_shadow_anchoring()`
3. `test_animation_state_transitions()`
4. `test_lighting_and_material_compliance()`

## Test Run Log

```text
=== FOF Combat Graphics Test Run Log ===
PASS | test_character_z_separation() | PASS
PASS | test_ground_shadow_anchoring() | PASS
PASS | test_animation_state_transitions() | PASS
PASS | test_lighting_and_material_compliance() | PASS
RESULT: 4/4 passed
```

### Source validation

```text
npm run lint
TypeScript diagnostics: 0
PASS
```

### Animation asset validation

The sample runtime contract is validated for:

- Arjun
- David
- Valeria

across all 18 required actions.

## Important qualification

The procedural Pillow generator is a **development/asset-pipeline scaffold**. It produces real multi-frame atlases and deterministic action timing from supplied artwork, but it is not equivalent to hand-authored AAA keyframe animation or motion-captured 3D animation. The engine is deliberately decoupled from the artwork so higher-quality authored frames can replace generated frames without changing combat logic.

## Build environment note

The supplied archive contains platform-specific `node_modules`. TypeScript validation and the combat graphics test suite pass. A production Vite build in this Linux validation environment is blocked by the archive's copied macOS native optional dependencies (`@rollup/rollup-darwin-arm64` / `@esbuild/darwin-arm64`). On the target development Mac, run `npm ci` to restore native dependencies before `npm run build`.
