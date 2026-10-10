/**
 * Fate of Fighters (FOF) - Character Asset Manager & 3D Model Loader
 * 
 * Production-ready centralized asset pipeline:
 * 1. Supports 3D Models (.glb / .gltf) via Three.js GLTFLoader.
 * 2. Initializes AnimationMixer with action clipping.
 * 3. Dynamic PBR Material Texture Mapping: binds available albedo, normal, and
 *    roughness maps to physically based character materials.
 * 4. Automated Textured Card / 2.5D Quad Fallback:
 *    When no external .glb is present, projects 2D concept art onto an oriented
 *    billboard quad with alpha cutout and PBR lighting, eliminating procedural
 *    mannequin primitives.
 * 5. Ground contact shadows (PCFSoftShadowMap) and elemental auras.
 */

import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import type { FightingEntity } from '../types/fighting';
import { normalizeCharacterId } from './characterAssetLoader.ts';

export interface CharacterAssetPaths {
  dir: string;
  glb: string;
  gltf: string;
  albedoCandidates: string[];
  roughnessCandidates: string[];
  normalCandidates: string[];
  portraitCandidates: string[];
  spriteCandidates: string[];
}

export interface Fighter3DRigInstance {
  characterId: string;
  isPlayer1: boolean;
  group: THREE.Group;
  mainMesh: THREE.Object3D;
  shadowMesh: THREE.Mesh;
  auraMesh: THREE.Mesh;
  pointLight?: THREE.PointLight;
  is3DModel: boolean;
  mixer?: THREE.AnimationMixer;
  animations?: THREE.AnimationClip[];
  actions?: Map<string, THREE.AnimationAction>;
  materials: THREE.Material[];
  updatePose: (entity: FightingEntity, delta: number, isHitstun: boolean) => void;
  dispose: () => void;
}

// Known static files that actually exist in the project filesystem to bypass unnecessary HTTP roundtrips
const KNOWN_STATIC_ASSETS = new Set<string>([
  // Steele
  '/assets/characters/steele/portrait.jpeg',
  '/assets/characters/steele/portrait.png',
  '/assets/characters/steele/texture_albedo.jpeg',
  '/assets/characters/steele/fighter_cutout.png',
  '/characters/General_Jonas_Steele_02.jpeg',
  // Meghananda
  '/assets/characters/meghananda/portrait.jpeg',
  '/assets/characters/meghananda/portrait.png',
  '/assets/characters/meghananda/texture_albedo.jpeg',
  '/characters/Meghananda_01.jpeg',
  '/characters/Meghananda_02.jpeg',
  // Arjun
  '/assets/characters/arjun/portrait.jpeg',
  '/assets/characters/arjun/portrait.jpg',
  '/assets/characters/arjun/portrait.png',
  '/assets/characters/arjun/texture_albedo.jpg',
  '/assets/characters/arjun/fighter_cutout.png',
  '/characters/arjun.jpg',
  // Valeria
  '/assets/characters/valeria/portrait.svg',
  '/assets/characters/valeria/portrait.png',
  '/assets/characters/valeria/texture_albedo.svg',
  '/characters/valeria_portrait.svg',
  // Maya
  '/assets/characters/maya/portrait.svg',
  '/assets/characters/maya/texture_albedo.svg',
  '/characters/maya_portrait.svg',
  '/characters/maya.svg',
  // David
  '/assets/characters/david/portrait.svg',
  '/assets/characters/david/texture_albedo.svg',
  '/characters/david_portrait.svg',
  '/characters/david.svg',
  // Elena
  '/assets/characters/elena/portrait.svg',
  '/assets/characters/elena/texture_albedo.svg',
  '/characters/elena_portrait.svg',
  '/characters/elena.svg',
  // Roster
  '/characters/team_roster.jpg',
]);

// Global cached asset availability to avoid redundant network hits
const assetAvailabilityCache = new Map<string, boolean>();
const textureCache = new Map<string, THREE.Texture>();

/**
 * Checks if a static file exists on the server.
 * Critical: In Vite / Express SPA mode, nonexistent routes return HTTP 200 with index.html (text/html).
 * We check that the response is NOT text/html so that nonexistent .glb or .png files aren't treated as existing.
 */
async function fileExists(url: string): Promise<boolean> {
  if (!url) return false;
  if (KNOWN_STATIC_ASSETS.has(url)) {
    return true;
  }
  if (assetAvailabilityCache.has(url)) {
    return assetAvailabilityCache.get(url)!;
  }
  try {
    const res = await fetch(url, { method: 'HEAD' });
    if (!res.ok) {
      assetAvailabilityCache.set(url, false);
      return false;
    }
    const contentType = (res.headers.get('content-type') || '').toLowerCase();
    if (contentType.includes('text/html')) {
      // Returned Vite SPA index.html fallback, file does not exist
      assetAvailabilityCache.set(url, false);
      return false;
    }
    assetAvailabilityCache.set(url, true);
    return true;
  } catch {
    assetAvailabilityCache.set(url, false);
    return false;
  }
}

/**
 * Returns candidate file paths following the standardized directory structure:
 * public/assets/characters/[character_id]/
 * ├── model.glb (or model.gltf)
 * ├── texture_albedo.jpg (or .png / .jpeg)
 * ├── texture_roughness.jpg (or .png / .jpeg)
 * ├── texture_normal.png
 * └── portrait.png (for HUD and character select)
 */
export function getCharacterAssetPaths(rawId: string): CharacterAssetPaths {
  const id = normalizeCharacterId(rawId);
  const dir = `/assets/characters/${id}`;

  return {
    dir,
    glb: `${dir}/model.glb`,
    gltf: `${dir}/model.gltf`,
    albedoCandidates: [
      `${dir}/texture_albedo.png`,
      `${dir}/texture_albedo.jpg`,
      `${dir}/texture_albedo.jpeg`,
      `${dir}/texture_albedo.svg`,
      `${dir}/portrait.png`,
      `${dir}/portrait.jpeg`,
      `${dir}/portrait.jpg`,
      `${dir}/portrait.svg`,
      `/characters/${id}_battle.jpg`,
      `/characters/${id}.jpg`,
      `/characters/${id}.png`,
      `/characters/${id}_portrait.svg`,
      `/characters/${id}.svg`,
      // Steele & Meghananda legacy mappings
      id === 'steele' ? '/characters/General_Jonas_Steele_02.jpeg' : '',
      id === 'meghananda' ? '/characters/Meghananda_02.jpeg' : '',
      id === 'arjun' ? '/assets/characters/arjun/fighter_cutout.png' : '',
    ].filter(Boolean),
    roughnessCandidates: [
      `${dir}/texture_roughness.png`,
      `${dir}/texture_roughness.jpg`,
      `${dir}/texture_roughness.jpeg`,
    ],
    normalCandidates: [
      `${dir}/texture_normal.png`,
      `${dir}/texture_normal.jpg`,
      `${dir}/texture_normal.jpeg`,
    ],
    spriteCandidates: [
      `${dir}/fighter_cutout.png`,
      `${dir}/actions/idle.png`,
      `${dir}/generated_source.png`,
      `${dir}/portrait.png`,
      `${dir}/portrait.jpg`,
      `${dir}/portrait.jpeg`,
      `${dir}/portrait.svg`,
      `/characters/${id}_battle.jpg`,
      `/characters/${id}.jpg`,
      `/characters/${id}.png`,
      `/characters/${id}_portrait.svg`,
      `/characters/${id}.svg`,
      id === 'steele' ? '/characters/General_Jonas_Steele_02.jpeg' : '',
      id === 'meghananda' ? '/characters/Meghananda_01.jpeg' : '',
    ].filter(Boolean),
    portraitCandidates: [
      `${dir}/portrait.png`,
      `${dir}/portrait.jpg`,
      `${dir}/portrait.jpeg`,
      `${dir}/portrait.svg`,
      `/characters/${id}_portrait.svg`,
      `/characters/${id}.jpg`,
      `/characters/${id}.png`,
      `/characters/${id}.svg`,
      id === 'steele' ? '/assets/characters/steele/fighter_cutout.png' : '',
      id === 'meghananda' ? '/characters/Meghananda_01.jpeg' : '',
      id === 'arjun' ? '/assets/characters/arjun/fighter_cutout.png' : '',
    ].filter(Boolean),
  };
}

export class CharacterLoader {
  private static instance: CharacterLoader;
  private gltfLoader: GLTFLoader;
  private textureLoader: THREE.TextureLoader;

  private constructor() {
    this.gltfLoader = new GLTFLoader();
    this.textureLoader = new THREE.TextureLoader();
  }

  public static getInstance(): CharacterLoader {
    if (!CharacterLoader.instance) {
      CharacterLoader.instance = new CharacterLoader();
    }
    return CharacterLoader.instance;
  }

  /**
   * Helper to load and cache a texture with the requested color space.
   */
  public async loadTexture(
    url: string,
    colorSpace: THREE.ColorSpace = THREE.SRGBColorSpace
  ): Promise<THREE.Texture> {
    const cacheKey = `${url}|${colorSpace}`;
    if (textureCache.has(cacheKey)) {
      return textureCache.get(cacheKey)!;
    }
    return new Promise((resolve, reject) => {
      this.textureLoader.load(
        url,
        (texture) => {
          texture.colorSpace = colorSpace;
          texture.generateMipmaps = true;
          texture.minFilter = THREE.LinearMipmapLinearFilter;
          texture.magFilter = THREE.LinearFilter;
          textureCache.set(cacheKey, texture);
          resolve(texture);
        },
        undefined,
        (err) => {
          reject(err instanceof Error ? err : new Error(`Could not load character texture "${url}".`));
        }
      );
    });
  }

  /**
   * Finds the first existing URL from a list of candidate paths
   */
  public async resolveFirstExisting(candidates: string[]): Promise<string | null> {
    for (const url of candidates) {
      if (await fileExists(url)) {
        return url;
      }
    }
    return null;
  }

  /**
   * Main entry point: Loads a 3D fighter rig.
   * If a .glb or .gltf exists in public/assets/characters/[id]/, loads it.
   * Otherwise, instantiates an automated Textured Card / 2.5D Quad fallback
   * with PBR shading, soft contact shadows, and kinetic combat animations.
   */
  public async loadCharacter(
    characterId: string,
    isPlayer1: boolean,
    options?: { accentColor?: string }
  ): Promise<Fighter3DRigInstance> {
    const paths = getCharacterAssetPaths(characterId);
    const accentColor = options?.accentColor || (isPlayer1 ? '#f59e0b' : '#06b6d4');
    const modelRig = await this.loadCharacterModel(characterId, isPlayer1, { accentColor });
    if (modelRig) return modelRig;
    return this.buildTexturedQuadRig(characterId, isPlayer1, paths, accentColor);
  }

  /**
   * Loads only an authored GLB/GLTF model. Returns null when the character has
   * no model or parsing fails, allowing the combat renderer to keep its animated
   * sprite-sheet quad fallback.
   */
  public async loadCharacterModel(
    characterId: string,
    isPlayer1: boolean,
    options?: { accentColor?: string }
  ): Promise<Fighter3DRigInstance | null> {
    const paths = getCharacterAssetPaths(characterId);
    const modelUrl = await fileExists(paths.glb) ? paths.glb : await fileExists(paths.gltf) ? paths.gltf : null;
    if (!modelUrl) return null;

    try {
      return await this.build3DGlbRig(
        modelUrl,
        characterId,
        isPlayer1,
        paths,
        options?.accentColor || (isPlayer1 ? '#f59e0b' : '#06b6d4')
      );
    } catch (error) {
      console.warn(`[CharacterLoader] Failed to load model "${modelUrl}"; using the sprite quad fallback.`, error);
      return null;
    }
  }

  /**
   * Builds a full 3D GLTF/GLB character rig with animation mixer and PBR material texture binding.
   */
  private async build3DGlbRig(
    modelUrl: string,
    characterId: string,
    isPlayer1: boolean,
    paths: CharacterAssetPaths,
    accentColor: string
  ): Promise<Fighter3DRigInstance> {
    return new Promise((resolve, reject) => {
      this.gltfLoader.load(
        modelUrl,
        async (gltf) => {
          try {
            const group = new THREE.Group();
            group.name = `Fighter_${characterId}_${isPlayer1 ? 'P1' : 'P2'}`;

          const model = gltf.scene;
          group.add(model);

          // Find available concept textures to bind
          const albedoUrl = await this.resolveFirstExisting(paths.albedoCandidates);
          const normalUrl = await this.resolveFirstExisting(paths.normalCandidates);
          const roughnessUrl = await this.resolveFirstExisting(paths.roughnessCandidates);

          let albedoTex: THREE.Texture | null = null;
          let normalTex: THREE.Texture | null = null;
          let roughnessTex: THREE.Texture | null = null;

          if (albedoUrl) {
            try {
              albedoTex = await this.loadTexture(albedoUrl);
              albedoTex.flipY = false;
            } catch (e) {
              console.warn(`[CharacterLoader] Could not load albedo texture "${albedoUrl}".`, e);
            }
          }

          if (normalUrl) {
            try {
              normalTex = await this.loadTexture(normalUrl, THREE.NoColorSpace);
              normalTex.flipY = false;
            } catch (e) {
              console.warn(`[CharacterLoader] Could not load normal texture "${normalUrl}".`, e);
            }
          }

          if (roughnessUrl) {
            try {
              roughnessTex = await this.loadTexture(roughnessUrl, THREE.NoColorSpace);
              roughnessTex.flipY = false;
            } catch (e) {
              console.warn(`[CharacterLoader] Could not load roughness texture "${roughnessUrl}".`, e);
            }
          }

          // Measure bounding box to normalize scale to ~2.35m height
          const bbox = new THREE.Box3().setFromObject(model);
          const size = bbox.getSize(new THREE.Vector3());
          const targetHeight = 2.35;
          const scaleFactor = size.y > 0.1 ? targetHeight / size.y : 1.0;
          model.scale.set(scaleFactor, scaleFactor, scaleFactor);

          // Center horizontally and plant bottom at y = 0
          bbox.setFromObject(model);
          const center = bbox.getCenter(new THREE.Vector3());
          model.position.x = -center.x;
          model.position.z = -center.z;
          model.position.y = -bbox.min.y;

          const materials: THREE.Material[] = [];

          // Traverse meshes: enable shadows, clone materials, bind PBR textures
          model.traverse((child) => {
            if ((child as THREE.Mesh).isMesh) {
              const mesh = child as THREE.Mesh;
              mesh.castShadow = true;
              mesh.receiveShadow = true;

              if (Array.isArray(mesh.material)) {
                mesh.material = mesh.material.map((mat) => this.toPbrMaterial(mat));
                mesh.material.forEach((mat) => {
                  materials.push(mat);
                  this.applyTexturesToPBRMaterial(mat, albedoTex, normalTex, roughnessTex);
                });
              } else if (mesh.material) {
                mesh.material = this.toPbrMaterial(mesh.material);
                materials.push(mesh.material);
                this.applyTexturesToPBRMaterial(mesh.material, albedoTex, normalTex, roughnessTex);
              }
            }
          });

          // Animation Mixer setup
          let mixer: THREE.AnimationMixer | undefined;
          const actions = new Map<string, THREE.AnimationAction>();
          let activeAction: THREE.AnimationAction | undefined;

          if (gltf.animations && gltf.animations.length > 0) {
            mixer = new THREE.AnimationMixer(model);
            gltf.animations.forEach((clip) => {
              const action = mixer!.clipAction(clip);
              actions.set(clip.name.toLowerCase().replace(/[^a-z0-9]/g, ''), action);
            });

            // Start with idle or first animation
            const idleAction = actions.get('idle') || actions.values().next().value;
            if (idleAction) {
              idleAction.play();
              activeAction = idleAction;
            }
          }

          // Ground Contact Shadow & Aura
          const shadowMesh = createGroundShadow();
          const auraMesh = createAuraMesh(accentColor);
          group.add(shadowMesh);
          group.add(auraMesh);

          let animTimer = 0;

          const updatePose = (entity: FightingEntity, delta: number, isHitstun: boolean) => {
            animTimer += delta;

            if (mixer) {
              const animationName = this.animationForState(entity.state, actions);
              const nextAction = animationName ? actions.get(animationName) : undefined;
              if (nextAction && nextAction !== activeAction) {
                activeAction?.fadeOut(0.12);
                nextAction.reset().fadeIn(0.12).play();
                activeAction = nextAction;
              }
              mixer.update(delta);
            }

            // Facing rotation: 2.5D fighting plane orientation
            const targetRotY = entity.facing === 1 ? 0.28 : Math.PI - 0.28;
            group.rotation.y = THREE.MathUtils.lerp(group.rotation.y, targetRotY, 0.25);

            // Hit reaction & Cel-flash
            if (isHitstun || entity.state.startsWith('HIT_')) {
              materials.forEach((mat) => {
                if ('emissive' in mat) {
                  (mat as THREE.MeshStandardMaterial).emissive.setHex(0xffffff);
                  (mat as THREE.MeshStandardMaterial).emissiveIntensity = 0.85;
                }
              });
              model.rotation.z = entity.facing === 1 ? -0.15 : 0.15;
            } else {
              materials.forEach((mat) => {
                if ('emissive' in mat) {
                  (mat as THREE.MeshStandardMaterial).emissive.setHex(0x000000);
                  (mat as THREE.MeshStandardMaterial).emissiveIntensity = 0;
                }
              });
              model.rotation.z = THREE.MathUtils.lerp(model.rotation.z, 0, 0.15);
            }

            // Ground shadow tracking
            const isAirborne = entity.y > 10;
            shadowMesh.position.y = 0.02;
            const shadowScale = isAirborne ? Math.max(0.4, 1.0 - (entity.y / 350) * 0.5) : 1.0;
            shadowMesh.scale.set(shadowScale, shadowScale, shadowScale);
            (shadowMesh.material as THREE.MeshBasicMaterial).opacity = isAirborne ? 0.35 : 0.7;

            // Aura intensity
            auraMesh.rotation.z += delta * 1.5;
            auraMesh.visible = (entity.superMeter ?? 0) >= 100 || entity.state === 'SUPER' || entity.state === 'CLIMAX' || !!entity.isMaxMode;
          };

          const dispose = () => {
            const ownedGeometries = new Set<THREE.BufferGeometry>();
            const ownedTextures = new Set<THREE.Texture>();
            const sharedTextures = new Set([albedoTex, normalTex, roughnessTex].filter(
              (texture): texture is THREE.Texture => texture !== null
            ));
            model.traverse((child) => {
              if ((child as THREE.Mesh).isMesh) {
                ownedGeometries.add((child as THREE.Mesh).geometry);
              }
            });
            for (const material of materials) {
              const pbr = material as THREE.MeshStandardMaterial;
              const materialTextures = [
                pbr.map, pbr.alphaMap, pbr.normalMap, pbr.roughnessMap, pbr.metalnessMap,
                pbr.emissiveMap, pbr.aoMap, pbr.bumpMap, pbr.displacementMap, pbr.envMap, pbr.lightMap,
              ];
              materialTextures.forEach((texture) => {
                if (texture && !sharedTextures.has(texture)) ownedTextures.add(texture);
              });
            }
            mixer?.stopAllAction();
            if (mixer) mixer.uncacheRoot(model);
            materials.forEach((m) => m.dispose());
            ownedGeometries.forEach((geometry) => geometry.dispose());
            ownedTextures.forEach((texture) => texture.dispose());
            shadowMesh.geometry.dispose();
            (shadowMesh.material as THREE.MeshBasicMaterial).map?.dispose();
            (shadowMesh.material as THREE.Material).dispose();
            auraMesh.geometry.dispose();
            (auraMesh.material as THREE.MeshBasicMaterial).map?.dispose();
            (auraMesh.material as THREE.Material).dispose();
          };

            resolve({
              characterId,
              isPlayer1,
              group,
              mainMesh: model,
              shadowMesh,
              auraMesh,
              is3DModel: true,
              mixer,
              animations: gltf.animations,
              actions,
              materials,
              updatePose,
              dispose,
            });
          } catch (innerErr) {
            reject(innerErr instanceof Error ? innerErr : new Error(String(innerErr)));
          }
        },
        undefined,
        (error) => {
          const errObj = error instanceof Error ? error : new Error(`Failed to load GLTF from ${modelUrl}`);
          reject(errObj);
        }
      );
    });
  }

  /**
   * Builds an automated Textured Card / 2.5D Quad fallback.
   * Eliminates untextured procedural mannequins by projecting available 2D concept art
   * onto an oriented quad with PBR shading, proper alpha cutout, soft contact shadow,
   * and kinetic fighting animations (breathing, action tilts, strike lunges, hit flashes).
   */
  private async buildTexturedQuadRig(
    characterId: string,
    isPlayer1: boolean,
    paths: CharacterAssetPaths,
    accentColor: string
  ): Promise<Fighter3DRigInstance> {
    const group = new THREE.Group();
    group.name = `FighterQuad_${characterId}_${isPlayer1 ? 'P1' : 'P2'}`;

    // Resolve best concept texture
    const textureUrl = await this.resolveFirstExisting(paths.spriteCandidates);
    if (!textureUrl) {
      throw new Error(`[CharacterLoader] No GLTF model or sprite image found for "${characterId}".`);
    }
    const texture = await this.loadTexture(textureUrl);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.minFilter = THREE.LinearFilter;
    texture.magFilter = THREE.LinearFilter;
    texture.generateMipmaps = false;
    texture.needsUpdate = true;

    // Dimensions for balanced fighting game proportions (~2.35m height)
    const quadHeight = 2.45;
    const quadWidth = 2.15;

    // Plane geometry with bottom anchor at y = 0
    const planeGeo = new THREE.PlaneGeometry(quadWidth, quadHeight);
    planeGeo.translate(0, quadHeight / 2, 0);

    // PBR Standard Material with arcade-scale alpha cutout and shadow support
    const cardMaterial = new THREE.MeshStandardMaterial({
      map: texture,
      transparent: true,
      alphaTest: 0.5,
      roughness: 0.42,
      metalness: 0.22,
      side: THREE.DoubleSide,
      shadowSide: THREE.DoubleSide,
      depthWrite: true,
      polygonOffset: true,
      polygonOffsetFactor: 1,
      polygonOffsetUnits: 1,
    });

    const cardMesh = new THREE.Mesh(planeGeo, cardMaterial);
    cardMesh.castShadow = true;
    cardMesh.receiveShadow = true;
    group.add(cardMesh);

    // Soft ground contact shadow & elemental aura
    const shadowMesh = createGroundShadow();
    const auraMesh = createAuraMesh(accentColor);
    group.add(shadowMesh);
    group.add(auraMesh);

    const materials: THREE.Material[] = [cardMaterial];

    let animTime = 0;

    const updatePose = (entity: FightingEntity, delta: number, isHitstun: boolean) => {
      animTime += delta;
      const { state = 'IDLE', facing = 1, y = 0 } = entity;

      // Facing orientation (flips X-scale or rotates towards opponent)
      cardMesh.scale.x = facing === 1 ? 1.0 : -1.0;

      // Organic breathing & kinetic movement physics
      const breathingPulse = Math.sin(animTime * 3.5) * 0.02;
      const isAirborne = y > 8;

      let targetRotZ = 0;
      let targetScaleY = 1.0 + breathingPulse;
      let targetScaleX = 1.0;

      switch (state) {
        case 'IDLE':
          targetScaleY = 1.0 + breathingPulse;
          targetRotZ = Math.sin(animTime * 2.0) * 0.02;
          break;

        case 'WALK_FWD':
          targetRotZ = -0.12 * facing;
          targetScaleY = 0.98 + Math.abs(Math.sin(animTime * 8.0)) * 0.05;
          break;

        case 'WALK_BACK':
          targetRotZ = 0.08 * facing;
          targetScaleY = 0.98 + Math.abs(Math.sin(animTime * 7.0)) * 0.04;
          break;

        case 'JUMP':
          targetScaleY = 1.08;
          targetScaleX = 0.92;
          targetRotZ = entity.vx ? -0.15 * Math.sign(entity.vx) : 0;
          break;

        case 'CROUCH':
          targetScaleY = 0.72;
          targetScaleX = 1.15;
          break;

        case 'GUARD':
          targetRotZ = 0.16 * facing;
          targetScaleX = 1.05;
          break;

        case 'ATTACK_LP':
        case 'ATTACK_HP':
        case 'ATTACK_LK':
        case 'ATTACK_HK':
        case 'BLOWBACK':
          targetRotZ = -0.18 * facing;
          targetScaleX = 1.12;
          break;

        case 'SPECIAL_1':
        case 'SPECIAL_2':
        case 'SPECIAL_3':
        case 'SUPER':
        case 'CLIMAX':
          targetRotZ = -0.25 * facing;
          targetScaleY = 1.15;
          targetScaleX = 1.18;
          break;

        case 'HIT_LIGHT':
        case 'HIT_HEAVY':
        case 'KNOCKDOWN':
          targetRotZ = 0.28 * facing;
          targetScaleX = 0.95;
          break;

        default:
          break;
      }

      // Smooth kinematic interpolation
      cardMesh.scale.y = THREE.MathUtils.lerp(cardMesh.scale.y, targetScaleY, 0.25);
      cardMesh.rotation.z = THREE.MathUtils.lerp(cardMesh.rotation.z, targetRotZ, 0.25);

      // Hitstun cel-flash & emissive reaction
      if (isHitstun || state.startsWith('HIT_')) {
        cardMaterial.emissive.setHex(0xffffff);
        cardMaterial.emissiveIntensity = 0.9;
        // Jitter shake on impact
        cardMesh.position.x = (Math.random() - 0.5) * 0.08;
      } else {
        cardMaterial.emissive.setHex(0x000000);
        cardMaterial.emissiveIntensity = 0;
        cardMesh.position.x = THREE.MathUtils.lerp(cardMesh.position.x, 0, 0.3);
      }

      // Ground contact shadow follows character grounded projection
      shadowMesh.position.y = 0.02;
      const shadowScale = isAirborne ? Math.max(0.4, 1.0 - (y / 350) * 0.5) : 1.0;
      shadowMesh.scale.set(shadowScale, shadowScale, shadowScale);
      (shadowMesh.material as THREE.MeshBasicMaterial).opacity = isAirborne ? 0.3 : 0.75;

      // Aura disc rotation and super state visibility
      auraMesh.rotation.z += delta * 1.8;
      auraMesh.visible = (entity.superMeter ?? 0) >= 100 || state === 'SUPER' || state === 'CLIMAX' || !!entity.isMaxMode;
    };

    const dispose = () => {
      materials.forEach((m) => m.dispose());
      planeGeo.dispose();
      shadowMesh.geometry.dispose();
      (shadowMesh.material as THREE.MeshBasicMaterial).map?.dispose();
      (shadowMesh.material as THREE.Material).dispose();
      auraMesh.geometry.dispose();
      (auraMesh.material as THREE.MeshBasicMaterial).map?.dispose();
      (auraMesh.material as THREE.Material).dispose();
    };

    return {
      characterId,
      isPlayer1,
      group,
      mainMesh: cardMesh,
      shadowMesh,
      auraMesh,
      is3DModel: false,
      materials,
      updatePose,
      dispose,
    };
  }

  private applyTexturesToPBRMaterial(
    mat: THREE.Material,
    albedoTex: THREE.Texture | null,
    normalTex: THREE.Texture | null,
    roughnessTex: THREE.Texture | null
  ) {
    if (mat instanceof THREE.MeshStandardMaterial || mat instanceof THREE.MeshPhysicalMaterial) {
      if (albedoTex) {
        mat.map = albedoTex;
      }
      if (normalTex) {
        mat.normalMap = normalTex;
      }
      if (roughnessTex) {
        mat.roughnessMap = roughnessTex;
      }
      mat.roughness = THREE.MathUtils.clamp(mat.roughness ?? 0.45, 0.3, 0.8);
      mat.metalness = THREE.MathUtils.clamp(mat.metalness ?? 0.2, 0.1, 0.6);
      mat.needsUpdate = true;
    }
  }

  private toPbrMaterial(material: THREE.Material): THREE.MeshStandardMaterial {
    if (material instanceof THREE.MeshStandardMaterial) return material.clone();

    const source = material as THREE.Material & {
      color?: THREE.Color;
      map?: THREE.Texture | null;
      alphaMap?: THREE.Texture | null;
      normalMap?: THREE.Texture | null;
      roughnessMap?: THREE.Texture | null;
      roughness?: number;
      metalness?: number;
    };
    const pbr = new THREE.MeshStandardMaterial({
      color: source.color?.clone() || new THREE.Color(0xffffff),
      map: source.map || null,
      alphaMap: source.alphaMap || null,
      normalMap: source.normalMap || null,
      roughnessMap: source.roughnessMap || null,
      roughness: source.roughness ?? 0.58,
      metalness: source.metalness ?? 0.08,
      transparent: material.transparent,
      opacity: material.opacity,
      alphaTest: material.alphaTest,
      side: material.side,
      depthWrite: material.depthWrite,
      vertexColors: 'vertexColors' in material ? material.vertexColors : false,
    });
    pbr.name = material.name;
    return pbr;
  }

  private animationForState(state: string, actions: Map<string, THREE.AnimationAction>): string | null {
    const normalized = state.toLowerCase();
    const candidates = normalized.includes('hit') || normalized.includes('hurt')
      ? ['hurt', 'hit', 'damage']
      : normalized.includes('jump')
        ? ['jump', 'air']
        : normalized.includes('crouch')
          ? ['crouch', 'duck']
          : normalized.includes('block') || normalized.includes('guard')
            ? ['block', 'guard', 'defend']
            : normalized.includes('walk')
              ? [normalized.includes('back') ? 'walk_backward' : 'walk_forward', 'walk', 'run']
              : normalized.includes('kick')
                ? ['kick', normalized.includes('heavy') ? 'heavy_kick' : 'light_kick']
                : normalized.includes('punch') || normalized.includes('attack') || normalized.includes('special')
                  ? ['attack', normalized.includes('heavy') ? 'heavy_punch' : 'light_punch', 'punch']
                  : normalized.includes('ko') || normalized.includes('knock')
                    ? ['ko', 'knockdown', 'fall']
                    : ['idle', 'stand'];
    const candidateKeys = candidates.map((candidate) => candidate.replace(/[^a-z0-9]/g, ''));
    return candidateKeys.find((candidate) => actions.has(candidate))
      || [...actions.keys()].find((name) => candidateKeys.some((candidate) => name.includes(candidate)))
      || null;
  }
}

/**
 * Creates soft ground contact shadow disc with radial transparency falloff
 */
function createGroundShadow(): THREE.Mesh {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    const gradient = ctx.createRadialGradient(64, 64, 4, 64, 64, 60);
    gradient.addColorStop(0, 'rgba(0, 0, 0, 0.85)');
    gradient.addColorStop(0.5, 'rgba(0, 0, 0, 0.55)');
    gradient.addColorStop(0.85, 'rgba(0, 0, 0, 0.18)');
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 128, 128);
  }

  const texture = new THREE.CanvasTexture(canvas);
  const geo = new THREE.PlaneGeometry(1.6, 0.8);
  geo.rotateX(-Math.PI / 2);

  const mat = new THREE.MeshBasicMaterial({
    map: texture,
    transparent: true,
    opacity: 0.75,
    depthWrite: false,
  });

  const mesh = new THREE.Mesh(geo, mat);
  mesh.renderOrder = 1;
  return mesh;
}

/**
 * Creates elemental aura circle at ground level for Super/Max Mode
 */
function createAuraMesh(accentColor: string): THREE.Mesh {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    const gradient = ctx.createRadialGradient(64, 64, 30, 64, 64, 60);
    gradient.addColorStop(0, 'rgba(0, 0, 0, 0)');
    gradient.addColorStop(0.65, `${accentColor}88`);
    gradient.addColorStop(0.9, `${accentColor}44`);
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 128, 128);
  }

  const texture = new THREE.CanvasTexture(canvas);
  const geo = new THREE.PlaneGeometry(2.4, 2.4);
  geo.rotateX(-Math.PI / 2);

  const mat = new THREE.MeshBasicMaterial({
    map: texture,
    transparent: true,
    opacity: 0.85,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });

  const mesh = new THREE.Mesh(geo, mat);
  mesh.visible = false;
  mesh.renderOrder = 2;
  return mesh;
}

export const characterLoader = CharacterLoader.getInstance();
