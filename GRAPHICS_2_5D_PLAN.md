# FOFv3 — Practical 2.5D Graphics Plan

## Target

Build a modern fighting-game presentation without requiring investor-scale art production.

## Architecture

**Gameplay plane**: existing deterministic 2D fighting simulation (x/y, hitboxes, frame data).

**Presentation plane**: 2.5D camera/compositor. Characters are full-body RGBA billboards today; the same anchor points can later host animated sprite atlases or 3D rigs.

**Stage**: one high-resolution backplate + depth haze + perspective floor + foreground silhouettes/props + dynamic lighting. Do not duplicate the same background image as fake parallax.

## Character production pipeline

1. Character concept/reference.
2. Full-body hero render with transparent/removed background.
3. Action set: idle, walk, crouch, jump, LP, HP, LK, HK, hit, knockdown, special 1/2/3, super, victory, defeat.
4. Convert actions into a sprite atlas or animation clips.
5. Author hitbox/hurtbox data separately from artwork.
6. Add VFX and camera events.
7. Validate every action at 60 Hz and at slow-motion/debug speed.

## Budget-conscious order

### Phase 1 — Vertical slice
Arjun + David + one stage + all core normals/specials.

### Phase 2 — Core roster
Add Steele, Elena, Maya and the remaining story characters using the same asset contract.

### Phase 3 — Premium animation
Replace billboard transforms with sprite atlases or GLB animation clips one character at a time.

### Phase 4 — Production polish
Lighting, material passes, crowd animation, destruction, stage transitions, cinematic supers and online/replay polish.

## Technology roles

- **React + TypeScript**: UI, HUD, menus and orchestration.
- **Vite**: local development and production bundling.
- **Three.js**: retained for future true 3D/GLB stages and characters; the default visual path now uses a simpler deterministic compositor.
- **CSS transforms/effects**: low-cost 2.5D camera, depth and character motion.
- **PNG/WebP RGBA**: character cutouts.
- **GIF**: preview/demo only; runtime should use sprite sheets/WebP/APNG/animation clips for quality and performance.
- **Existing fighting engine**: frame data, collisions, meter, projectiles, hitstun and CPU logic.
