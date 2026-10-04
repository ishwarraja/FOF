# FOFv3 — Review, Root Cause & Fix Report

## What was actually broken

The screenshot exposed a failure that a code-only review was not sufficient to catch: the default **2.5D path rendered procedural Three.js mannequin geometry instead of the supplied character artwork**. The result was a face/head + primitive body appearance rather than a production fighting-game character.

A second visual defect was the stage compositor: the 2D fallback stacked the **same background bitmap five times** at different opacity/scale values. That creates ghosting, blur and an incorrect parallax impression instead of real depth layers.

There was also a concrete asset-data error: `arjun_battle.jpg` was artwork of other fighters (REN/KAI), not Arjun. It was referenced by the Arjun combat renderer and asset loaders.

## Changes made

1. Replaced the default 2.5D procedural fighter renderer with a deterministic **2.5D billboard compositor** using real full-body character artwork.
2. Added new high-resolution Arjun combat artwork and extracted the fighter from the background into an RGBA cutout.
3. Added a new David Vance combat render and extracted the fighter into an RGBA cutout.
4. Added a cleaned General Jonas Steele full-body cutout.
5. Updated Arjun, David and Steele character records and loaders to use the new visual assets.
6. Removed runtime dependence on the incorrect Arjun `arjun_battle.jpg` combat artwork.
7. Reworked the stage renderer to use one crisp background plate plus atmospheric depth, perspective floor, lighting, shadows, hit effects and camera shake.
8. Added stage-ID mapping to the four verified local stage PNGs so missing JPEG/GIF references do not blank the arena.
9. Fixed the classic 2D background fallback so it no longer composites the same bitmap five times.
10. Added an Arjun combat-preview GIF and sprite/action sheet.
11. Added source/asset validation scripts.

## What this fixes visually

- No more blank/mannequin/box fighters in the default 2.5D path.
- Characters have a recognizable human silhouette, face, clothing, equipment and full body.
- Fighters remain grounded with contact shadows.
- Attacks, kicks, hitstun, jump, crouch and knockdown states now produce visible motion through camera-space transforms and effects.
- Stage remains sharp instead of being produced from five translucent copies of the same image.
- Existing projectiles, sparks, super callouts and camera shake remain supported.

## Important production limitation

This is a **developer-budget vertical-slice graphics solution**, not a replacement for a full AAA animation team. A real Street Fighter-scale production should eventually replace the billboard cutouts with either:

- 2D hand-drawn/raster sprite atlases (preferred for a sprite fighter), or
- fully rigged 3D characters with authored animation clips.

The new compositor deliberately keeps the gameplay engine independent from that future art upgrade.
