# FOF stage assets

## Add a stage background and 3D model

1. Put the preview/background image in `public/stages/png/`.
2. Put the model in `public/stages/glb/`. Both `.glb` and `.gltf` are supported.
3. Add one entry to `public/stages/stage_manifest.json`:

```json
{
  "id": "stage_my_new_stage",
  "image": "/stages/png/stage_my_new_stage.png",
  "glb": "/stages/glb/stage_my_new_stage.glb",
  "artworkIsSingleImage": true,
  "camera": { "minX": -10.2, "maxX": 10.2, "defaultZoom": 1 }
}
```

Use a `.gltf` URL instead when the model is a GLTF file. Keep its referenced `.bin` and texture files beside it under `public/stages/glb/`.

4. Add a matching stage record to `FOF_STAGES` in `src/data/fightingMoves.ts` and a visual record to `STAGE_VISUAL_ASSETS` in `src/data/stageBackgrounds.ts`. The `id` must match in all three places.

The running app loads the manifest at `/stages/stage_manifest.json`, loads the model with Three.js `GLTFLoader`, and falls back to the image when a model is missing.

## Add a character picture or model

For a character ID such as `arjun`, use this folder:

```text
public/assets/characters/arjun/
  portrait.png       # HUD/select image
  model.glb          # optional 3D model
  model.gltf         # optional alternative to model.glb
  texture_albedo.png # optional model texture
  texture_normal.png # optional normal map
```

The runtime looks for `model.glb` first, then `model.gltf`. If neither exists, it uses the portrait as a 2.5D fallback. Legacy standalone images can still go in `public/characters/`, but the standardized folder above is preferred.
