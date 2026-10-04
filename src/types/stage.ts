export interface FofStageAsset {
  id: string;
  glbUrl?: string;
  skyUrl?: string;
  farUrl?: string;
  midUrl?: string;
  crowdUrl?: string;
  foregroundUrl?: string;
  floorUrl?: string;
  worldWidth: number;
  bounds: { minX: number; maxX: number };
}

const GENERATED_STAGE_GLB_URLS: Record<string, string> = {
  stage_metro_rain: '/stages/glb/stage_metro_rain.glb',
  stage_riverfront_sunset: '/stages/glb/stage_riverfront_sunset.glb',
  stage_sky_observatory: '/stages/glb/stage_sky_observatory.glb',
  stage_bioluminescent_ruins: '/stages/glb/stage_bioluminescent_ruins.glb',
};

export function getFofStageAsset(id: string, fallbackImage: string): FofStageAsset {
  return {
    id,
    glbUrl: GENERATED_STAGE_GLB_URLS[id],
    skyUrl: fallbackImage,
    farUrl: fallbackImage,
    midUrl: fallbackImage,
    crowdUrl: fallbackImage,
    foregroundUrl: fallbackImage,
    floorUrl: fallbackImage,
    worldWidth: 1400,
    bounds: { minX: 0, maxX: 1400 },
  };
}

export interface FofStageManifestEntry {
  id: string;
  image?: string;
  glb?: string;
  artworkIsSingleImage?: boolean;
  camera?: { minX?: number; maxX?: number; defaultZoom?: number };
}

let stageManifestPromise: Promise<FofStageManifestEntry[]> | null = null;

export function loadFofStageManifest(): Promise<FofStageManifestEntry[]> {
  if (!stageManifestPromise) {
    stageManifestPromise = fetch('/stages/stage_manifest.json')
      .then(response => (response.ok ? response.json() : []))
      .catch(() => []);
  }
  return stageManifestPromise;
}

export function getFofStageAssetFromManifest(
  entry: FofStageManifestEntry,
  fallbackImage: string
): FofStageAsset {
  const minX = entry.camera?.minX ?? -10.2;
  const maxX = entry.camera?.maxX ?? 10.2;
  return {
    id: entry.id,
    glbUrl: entry.glb,
    skyUrl: entry.image || fallbackImage,
    farUrl: entry.image || fallbackImage,
    midUrl: entry.image || fallbackImage,
    crowdUrl: entry.image || fallbackImage,
    foregroundUrl: entry.image || fallbackImage,
    floorUrl: entry.image || fallbackImage,
    worldWidth: 1400,
    bounds: { minX: minX * 70 + 700, maxX: maxX * 70 + 700 },
  };
}