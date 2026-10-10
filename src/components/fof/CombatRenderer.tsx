import React, { useEffect, useImperativeHandle, useRef } from 'react';
import * as THREE from 'three';
import { CharacterAnimationController, actionForState, type AnimationAction, type AnimationClip } from '../../game/CharacterAnimationController';
import type { FightingEntity, FightingProjectile } from '../../types/fighting';
import { characterLoader, type Fighter3DRigInstance } from '../../utils/CharacterLoader';

export type CameraPreset = 'DYNAMIC' | 'TOURNAMENT' | 'CINEMATIC';

export interface FofStage25DViewHandle { triggerImpactCameraShake: (intensity?: number) => void; }

export interface CombatRendererProps {
  p1Entity: FightingEntity;
  p2Entity: FightingEntity;
  projectiles: FightingProjectile[];
  hitSparks: Array<{ id: string; x: number; y: number; color: string; text?: string }>;
  hitShockwaves: Array<{ id: string; x: number; y: number; color?: string }>;
  punchFlash?: { x: number; color: string } | null;
  superCutIn?: { fighterName: string; moveName: string; color: string } | null;
  finisherState?: { active: boolean } | null;
  postMatchState?: { active: boolean } | null;
  screenShake?: boolean;
  stageId?: string;
  stageBg?: string;
  stageBgUrl?: string;
  cameraPreset?: CameraPreset;
  p1HitstunActive?: boolean;
  p2HitstunActive?: boolean;
  debugMode?: boolean;
}

const ARENA_WIDTH = 1400;
const STAGE_ASSETS: Record<string, string> = {
  stage_metro_rain: '/stages/png/stage_metro_rain.png',
  stage_riverfront_sunset: '/stages/png/stage_riverfront_sunset.png',
  stage_sky_observatory: '/stages/png/stage_sky_observatory.png',
  stage_bioluminescent_ruins: '/stages/png/stage_bioluminescent_ruins.png',
  location1: '/stages/png/stage_sky_observatory.png',
  location2: '/stages/png/stage_sky_observatory.png',
  location3: '/stages/png/stage_bioluminescent_ruins.png',
  location4: '/stages/png/stage_metro_rain.png',
  location5: '/stages/png/stage_bioluminescent_ruins.png',
};

const DEFAULT_STAGE = '/stages/png/stage_riverfront_sunset.png';

import { COMBAT_RENDERER_CONFIG, COMBAT_RENDERER_MATERIAL_POLICY, combatPlaneZ, combatRenderOrder, contactShadowState } from '../../game/CombatGraphicsMath';

const ACTIONS: AnimationAction[] = [
  'idle','walk_forward','walk_backward','crouch','light_punch','heavy_punch','light_kick','heavy_kick',
  'special_1','special_2','special_3','special_4','jump','block','hurt_high','hurt_low','knockdown','ko',
];

interface RuntimeFighter {
  entityId: string;
  characterId: string;
  group: THREE.Group;
  sprite: THREE.Mesh<THREE.PlaneGeometry, THREE.MeshStandardMaterial>;
  shadow: THREE.Mesh<THREE.CircleGeometry, THREE.MeshBasicMaterial>;
  controller: CharacterAnimationController;
  clipsLoaded: Set<AnimationAction>;
  clipPromises: Map<AnimationAction, Promise<void>>;
  textures: Map<AnimationAction, THREE.Texture>;
  width: number;
  height: number;
  manifest: Record<string, any> | null;
  rig: Fighter3DRigInstance | null;
  rigLoadStarted: boolean;
}

function characterId(entity: FightingEntity): string {
  return entity.character?.id || (entity.isPlayer1 ? 'arjun' : 'david');
}

function actionUrl(id: string, action: AnimationAction): string {
  return `/assets/characters/${id}/actions/${action}.png`;
}
function metadataUrl(id: string): string { return `/assets/characters/${id}/actions/actions.json`; }

function safeWorldX(x: number): number { return THREE.MathUtils.clamp((x / ARENA_WIDTH - 0.5) * 12.0, -5.8, 5.8); }
function safeWorldY(y: number): number { return Math.max(0, y / 105); }

function warmLight(hex: number): THREE.Color { return new THREE.Color(hex); }

function makeShadow(): THREE.Mesh<THREE.CircleGeometry, THREE.MeshBasicMaterial> {
  const geo = new THREE.CircleGeometry(0.78, 48);
  const mat = new THREE.MeshBasicMaterial({ color: 0x160f0b, transparent: true, opacity: 0.62, depthWrite: false, depthTest: true });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.rotation.x = -Math.PI / 2;
  mesh.position.y = 0.018;
  mesh.scale.set(1.15, 0.48, 1);
  mesh.renderOrder = 20;
  return mesh;
}

async function loadJson(url: string): Promise<Record<string, any> | null> {
  try {
    const response = await fetch(url);
    if (!response.ok) return null;
    return await response.json();
  } catch { return null; }
}

function buildFallbackTexture(loader: THREE.TextureLoader, id: string): THREE.Texture {
  const known = id === 'arjun' ? '/assets/characters/arjun/fighter_cutout.png'
    : id === 'david' ? '/assets/characters/david/fighter_cutout.png'
    : id === 'steele' ? '/assets/characters/steele/fighter_cutout.png'
    : id === 'valeria' ? '/assets/characters/valeria/portrait.png'
    : '/assets/characters/arjun/fighter_cutout.png';
  return loader.load(known);
}

function applyClipTexture(
  runtime: RuntimeFighter,
  texture: THREE.Texture,
  clipMeta: any,
  frame: number,
): void {
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.generateMipmaps = false;
  texture.wrapS = THREE.ClampToEdgeWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;

  const sheetWidth = Number(clipMeta?.sheetWidth ?? (texture.image as any)?.width ?? 1);
  const sheetHeight = Number(clipMeta?.sheetHeight ?? (texture.image as any)?.height ?? 1);
  const frames = Array.isArray(clipMeta?.frames) ? clipMeta.frames : [];
  const meta = frames[Math.max(0, Math.min(frame, frames.length - 1))];
  const fw = Number(meta?.width ?? sheetWidth);
  const fh = Number(meta?.height ?? sheetHeight);
  const fx = Number(meta?.x ?? 0);
  const fy = Number(meta?.y ?? 0);

  texture.repeat.set(fw / sheetWidth, fh / sheetHeight);
  texture.offset.set(fx / sheetWidth, 1 - ((fy + fh) / sheetHeight));
  texture.needsUpdate = true;
  runtime.sprite.material.map = texture;
  runtime.sprite.material.needsUpdate = true;
  runtime.width = Number(clipMeta?.displayWidth ?? 1.45);
  runtime.height = Number(clipMeta?.displayHeight ?? 2.7);
  runtime.sprite.scale.set(runtime.width, runtime.height, 1);
}

async function loadAction(runtime: RuntimeFighter, id: string, action: AnimationAction, loader: THREE.TextureLoader): Promise<void> {
  if (runtime.clipsLoaded.has(action)) return;
  const existing = runtime.clipPromises.get(action);
  if (existing) return existing;

  const promise = (async () => {
    if (!runtime.manifest) runtime.manifest = await loadJson(metadataUrl(id));
    const manifest = runtime.manifest;
    const clipMeta = manifest?.actions?.[action];
    const url = clipMeta?.image ? clipMeta.image : actionUrl(id, action);
    const texture = await new Promise<THREE.Texture>((resolve) => {
      loader.load(url, resolve, undefined, () => resolve(buildFallbackTexture(loader, id)));
    });
    runtime.textures.set(action, texture);
    runtime.controller.registerClip({
      action,
      loop: Boolean(clipMeta?.loop),
      frames: (clipMeta?.frames ?? []).map((f: any, i: number) => ({
        frame: i, x: f.x, y: f.y, width: f.width, height: f.height,
        durationMs: f.durationMs ?? 16.667, phase: f.phase ?? 'loop', hitbox: f.hitbox,
      })),
      defaultFrameDurationMs: clipMeta?.defaultFrameDurationMs ?? 16.667,
      activeStartFrame: clipMeta?.activeStartFrame,
      activeEndFrameExclusive: clipMeta?.activeEndFrameExclusive,
    } as AnimationClip);
    runtime.clipsLoaded.add(action);
    if (runtime.controller.getAction() === action) applyClipTexture(runtime, texture, clipMeta, runtime.controller.getFrame());
  })();
  runtime.clipPromises.set(action, promise);
  await promise;
}

function createRuntimeFighter(entity: FightingEntity): RuntimeFighter {
  const id = characterId(entity);
  const group = new THREE.Group();
  group.name = `Fighter_${id}_${entity.isPlayer1 ? 'P1' : 'P2'}`;
  const material = new THREE.MeshStandardMaterial({
    transparent: true,
    alphaTest: 0.5,
    roughness: 0.58,
    metalness: 0.08,
    side: THREE.DoubleSide,
    depthWrite: true,
    polygonOffset: true,
    polygonOffsetFactor: entity.isPlayer1 ? -1 : 1,
    polygonOffsetUnits: entity.isPlayer1 ? -1 : 1,
  });
  const geometry = new THREE.PlaneGeometry(1.45, 2.7);
  geometry.translate(0, 1.35, 0);
  const sprite = new THREE.Mesh(geometry, material);
  sprite.castShadow = true;
  sprite.receiveShadow = false;
  sprite.renderOrder = entity.isPlayer1 ? 31 : 30;
  group.add(sprite);

  const shadow = makeShadow();
  group.add(shadow);

  return {
    entityId: entity.id,
    characterId: id,
    group,
    sprite,
    shadow,
    controller: new CharacterAnimationController(),
    clipsLoaded: new Set(),
    clipPromises: new Map(),
    textures: new Map(),
    width: 1.45,
    height: 2.7,
    manifest: null,
    rig: null,
    rigLoadStarted: false,
  };
}

function disposeRuntimeFighter(fighter: RuntimeFighter): void {
  fighter.rig?.dispose();
  fighter.sprite.geometry.dispose();
  fighter.sprite.material.dispose();
  fighter.shadow.geometry.dispose();
  fighter.shadow.material.dispose();
  for (const texture of fighter.textures.values()) texture.dispose();
}

export const CombatRenderer = React.forwardRef<FofStage25DViewHandle, CombatRendererProps>(function CombatRenderer(props, ref) {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const runtimeRef = useRef<{
    renderer: THREE.WebGLRenderer;
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    stage: THREE.Mesh<THREE.PlaneGeometry, THREE.MeshBasicMaterial>;
    floor: THREE.Mesh<THREE.PlaneGeometry, THREE.MeshStandardMaterial>;
    fighters: Map<string, RuntimeFighter>;
    textureLoader: THREE.TextureLoader;
    clock: THREE.Clock;
    frameId: number;
    cameraShake: number;
    stageLoadingUrl: string | null;
  } | null>(null);
  const latestProps = useRef(props);
  latestProps.current = props;

  useImperativeHandle(ref, () => ({
    triggerImpactCameraShake(intensity = 1) {
      if (runtimeRef.current) runtimeRef.current.cameraShake = THREE.MathUtils.clamp(intensity, 0, 2);
    },
  }), []);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x120d0a);
    const camera = new THREE.PerspectiveCamera(34, 16 / 9, 0.1, 100);
    camera.position.set(0, 3.0, 10.5);
    camera.lookAt(0, 1.75, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.shadowMap.enabled = COMBAT_RENDERER_CONFIG.shadowMapEnabled;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = COMBAT_RENDERER_CONFIG.toneMappingExposure;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.setClearColor(0x120d0a, 1);
    host.appendChild(renderer.domElement);

    const hemi = new THREE.HemisphereLight(warmLight(0xffc27a), warmLight(0x1b2433), 1.65);
    scene.add(hemi);
    const sun = new THREE.DirectionalLight(0xffd3a1, 2.15);
    sun.position.set(-4.5, 8, 5.5);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    sun.shadow.camera.left = -8;
    sun.shadow.camera.right = 8;
    sun.shadow.camera.top = 7;
    sun.shadow.camera.bottom = -1;
    sun.shadow.bias = -0.0004;
    scene.add(sun);

    const stageMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: false });
    const stage = new THREE.Mesh(new THREE.PlaneGeometry(16, 9), stageMaterial);
    stage.position.set(0, 4.05, -3.8);
    stage.receiveShadow = false;
    stage.renderOrder = 0;
    scene.add(stage);

    const floorMaterial = new THREE.MeshStandardMaterial({ color: 0x7a4e38, roughness: 0.94, metalness: 0.02, transparent: true, opacity: 0.24 });
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(18, 8), floorMaterial);
    floor.rotation.x = -Math.PI / 2;
    floor.position.set(0, 0, 0.2);
    floor.receiveShadow = true;
    floor.renderOrder = 10;
    scene.add(floor);

    const textureLoader = new THREE.TextureLoader();
    const fighters = new Map<string, RuntimeFighter>();
    const clock = new THREE.Clock();
    const state = { renderer, scene, camera, stage, floor, fighters, textureLoader, clock, frameId: 0, cameraShake: 0, stageLoadingUrl: null };
    runtimeRef.current = state;

    const resize = () => {
      const width = Math.max(1, host.clientWidth);
      const height = Math.max(1, host.clientHeight);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height, false);
    };
    resize();
    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(host);

    const animate = () => {
      const rt = runtimeRef.current;
      if (!rt) return;
      const p = latestProps.current;
      const dt = Math.min(0.05, rt.clock.getDelta());
      const entities = [p.p1Entity, p.p2Entity];

      // Keep exactly two distinct combat planes whenever fighters are close.
      entities.forEach((entity, index) => {
        let fighter = rt.fighters.get(entity.id);
        const id = characterId(entity);
        if (fighter && fighter.characterId !== id) {
          rt.scene.remove(fighter.group);
          disposeRuntimeFighter(fighter);
          rt.fighters.delete(entity.id);
          fighter = undefined;
        }
        if (!fighter) {
          fighter = createRuntimeFighter(entity);
          rt.fighters.set(entity.id, fighter);
          rt.scene.add(fighter.group);
        }
        if (!fighter.rigLoadStarted) {
          fighter.rigLoadStarted = true;
          void characterLoader.loadCharacterModel(id, entity.isPlayer1, {
            accentColor: entity.character?.accentColor,
          }).then((rig) => {
            if (!rig) return;
            if (runtimeRef.current?.fighters.get(entity.id) !== fighter) {
              rig.dispose();
              return;
            }
            fighter.rig = rig;
            fighter.sprite.visible = false;
            fighter.shadow.visible = false;
            fighter.group.add(rig.group);
          }).catch((error: unknown) => {
            console.error(`[CombatRenderer] Could not load 3D model for "${id}".`, error);
          });
        }
        const action = actionForState(entity.state);
        if (!fighter.rig) void loadAction(fighter, id, action, rt.textureLoader);
        fighter.controller.syncFromEntity(entity);
        const loadedTexture = fighter.textures.get(action);
        if (loadedTexture) {
          applyClipTexture(fighter, loadedTexture, fighter.manifest?.actions?.[action], fighter.controller.getFrame());
        }

        const attackPriority = entity.currentMove || entity.state.startsWith('SPECIAL') || entity.state === 'SUPER' || entity.state === 'CLIMAX';
        const depthPlane = combatPlaneZ(entity.isPlayer1, !!attackPriority);
        fighter.group.position.set(safeWorldX(entity.x), safeWorldY(entity.y), depthPlane);
        fighter.group.scale.set(fighter.rig ? 1 : entity.facing === 1 ? 1 : -1, 1, 1);
        fighter.group.renderOrder = combatRenderOrder(entity.isPlayer1, !!attackPriority);
        fighter.sprite.renderOrder = fighter.group.renderOrder + 1;
        if (fighter.rig) {
          fighter.rig.group.renderOrder = fighter.group.renderOrder + 1;
          fighter.rig.mainMesh.traverse((object) => {
            if ((object as THREE.Mesh).isMesh) object.renderOrder = fighter.group.renderOrder + 2;
          });
          fighter.rig.updatePose(entity, dt, index === 0 ? !!p.p1HitstunActive : !!p.p2HitstunActive);
          const rigShadowState = contactShadowState(entity.y);
          fighter.rig.shadowMesh.position.set(0, -safeWorldY(entity.y) + 0.018, 0.02);
          fighter.rig.shadowMesh.scale.set(rigShadowState.scale, rigShadowState.scale, rigShadowState.scale);
          (fighter.rig.shadowMesh.material as THREE.MeshBasicMaterial).opacity = rigShadowState.opacity;
        }

        const altitude = Math.max(0, entity.y);
        const shadow = contactShadowState(altitude);
        fighter.shadow.position.set(0, -safeWorldY(entity.y) - 0.018, 0.02);
        fighter.shadow.scale.set(1.15 * shadow.scale, 0.48 * shadow.scale, 1);
        fighter.shadow.material.opacity = shadow.opacity;

        // Active frames get a small visual anticipation/extension without replacing the artwork.
        const active = fighter.controller.isActiveFrame();
        fighter.sprite.position.x = active ? entity.facing * 0.08 : 0;
        fighter.sprite.rotation.z = active ? entity.facing * -0.025 : 0;
        fighter.sprite.material.emissive.setHex(p.p1HitstunActive && index === 0 || p.p2HitstunActive && index === 1 ? 0xffffff : 0x000000);
        fighter.sprite.material.emissiveIntensity = (p.p1HitstunActive && index === 0 || p.p2HitstunActive && index === 1) ? 0.8 : 0;
      });

      // Remove fighters that are no longer in the match.
      const activeIds = new Set(entities.map(e => e.id));
      for (const [id, fighter] of rt.fighters) {
        if (!activeIds.has(id)) {
          rt.scene.remove(fighter.group);
          disposeRuntimeFighter(fighter);
          rt.fighters.delete(id);
        }
      }

      const spread = Math.abs(p.p1Entity.x - p.p2Entity.x);
      const targetX = safeWorldX((p.p1Entity.x + p.p2Entity.x) / 2);
      const targetZ = 10.5;
      const zoom = p.cameraPreset === 'TOURNAMENT' ? 1.0 : p.cameraPreset === 'CINEMATIC' ? 0.94 : THREE.MathUtils.clamp(1.0 - (spread - 450) / 2800, 0.9, 1.04);
      const shake = rt.cameraShake;
      rt.cameraShake = Math.max(0, rt.cameraShake - dt * 6);
      camera.position.x = THREE.MathUtils.lerp(camera.position.x, targetX + (Math.random() - 0.5) * shake * 0.12, 0.16);
      camera.position.y = THREE.MathUtils.lerp(camera.position.y, 3.0 + (Math.random() - 0.5) * shake * 0.06, 0.16);
      camera.position.z = THREE.MathUtils.lerp(camera.position.z, targetZ / zoom, 0.12);
      camera.lookAt(targetX, 1.75, 0);

      // Stage image is never scaled from fighter movement; only camera framing changes.
      const stageTexture = (rt.stage.material as THREE.MeshBasicMaterial).map;
      const stageUrl = STAGE_ASSETS[p.stageId || ''] || p.stageBgUrl || DEFAULT_STAGE;
      if ((!stageTexture || (stageTexture as any).userData?.sourceUrl !== stageUrl) && rt.stageLoadingUrl !== stageUrl) {
        const url = stageUrl;
        rt.stageLoadingUrl = url;
        textureLoader.load(url, (tex) => {
          tex.colorSpace = THREE.SRGBColorSpace;
          tex.minFilter = THREE.LinearFilter;
          tex.magFilter = THREE.LinearFilter;
          tex.userData.sourceUrl = url;
          (rt.stage.material as THREE.MeshBasicMaterial).map = tex;
          (rt.stage.material as THREE.MeshBasicMaterial).needsUpdate = true;
          rt.stageLoadingUrl = null;
        }, undefined, () => { rt.stageLoadingUrl = null; });
      }

      // Small projectile representation remains in WebGL so it respects depth planes.
      rt.scene.children.filter(o => o.userData.fofProjectile).forEach(o => rt.scene.remove(o));
      p.projectiles.forEach(proj => {
        const geo = new THREE.SphereGeometry(Math.max(0.045, proj.radius / 110), 16, 12);
        const mat = new THREE.MeshStandardMaterial({ color: proj.color, emissive: proj.color, emissiveIntensity: 1.8, transparent: true, opacity: 0.95 });
        const mesh = new THREE.Mesh(geo, mat);
        mesh.userData.fofProjectile = true;
        mesh.position.set(safeWorldX(proj.x), safeWorldY(proj.y) + 0.1, proj.isPlayer1 ? 0.08 : -0.08);
        mesh.castShadow = true;
        mesh.renderOrder = 60;
        rt.scene.add(mesh);
      });

      rt.renderer.render(rt.scene, rt.camera);
      rt.frameId = requestAnimationFrame(animate);
    };

    state.frameId = requestAnimationFrame(animate);
    return () => {
      resizeObserver.disconnect();
      cancelAnimationFrame(state.frameId);
      for (const fighter of fighters.values()) {
        disposeRuntimeFighter(fighter);
      }
      stage.geometry.dispose(); stageMaterial.dispose(); floor.geometry.dispose(); floorMaterial.dispose();
      renderer.dispose();
      if (renderer.domElement.parentElement === host) host.removeChild(renderer.domElement);
      runtimeRef.current = null;
    };
  }, []);

  return <div ref={hostRef} className="absolute inset-0 overflow-hidden" aria-label="FOF WebGL 2.5D combat renderer" />;
});

export default CombatRenderer;
