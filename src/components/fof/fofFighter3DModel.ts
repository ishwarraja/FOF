import * as THREE from 'three';
import { FightingEntity } from '../../types/fighting';

export interface Fighter3DRig {
  group: THREE.Group;
  shadowMesh: THREE.Mesh;
  auraMesh: THREE.Mesh;
  pointLight: THREE.PointLight;
  characterId: string;
  isPlayer1: boolean;

  // Key articulated body parts for animation
  torsoGroup: THREE.Group;
  chestMesh: THREE.Mesh;
  headGroup: THREE.Group;
  neckMesh: THREE.Mesh;
  hairGroup: THREE.Group;
  headbandRibbons?: THREE.Group;
  ponytailGroup?: THREE.Group;

  leftShoulder: THREE.Group;
  leftElbow: THREE.Group;
  leftFist: THREE.Mesh;
  rightShoulder: THREE.Group;
  rightElbow: THREE.Group;
  rightFist: THREE.Mesh;

  leftHip: THREE.Group;
  leftKnee: THREE.Group;
  leftFoot: THREE.Mesh;
  rightHip: THREE.Group;
  rightKnee: THREE.Group;
  rightFoot: THREE.Mesh;

  // Character signature weapon or accessory
  weaponMesh?: THREE.Mesh | THREE.Group;
  cyberArmGlow?: THREE.Mesh;

  // Materials for dynamic hitstun/super effects
  materials: {
    skin: THREE.MeshStandardMaterial;
    outfit: THREE.MeshStandardMaterial;
    accent: THREE.MeshStandardMaterial;
    hair: THREE.MeshStandardMaterial;
    leather: THREE.MeshStandardMaterial;
    metal: THREE.MeshStandardMaterial;
    eyes: THREE.MeshStandardMaterial;
    glow: THREE.MeshBasicMaterial;
  };
}

// Procedural texture for cloth weave
function createClothTexture(baseColorHex: string, weaveColorHex: string): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.fillStyle = baseColorHex;
    ctx.fillRect(0, 0, 128, 128);

    ctx.strokeStyle = weaveColorHex;
    ctx.lineWidth = 1;
    for (let x = 0; x < 128; x += 4) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, 128);
      ctx.stroke();
    }
    for (let y = 0; y < 128; y += 4) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(128, y);
      ctx.stroke();
    }
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(4, 4);
  return tex;
}

// Procedural leather grain texture
function createLeatherTexture(baseColorHex: string): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.fillStyle = baseColorHex;
    ctx.fillRect(0, 0, 128, 128);
    for (let i = 0; i < 400; i++) {
      const x = Math.random() * 128;
      const y = Math.random() * 128;
      ctx.fillStyle = Math.random() > 0.5 ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.12)';
      ctx.fillRect(x, y, 2, 2);
    }
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(3, 3);
  return tex;
}

export function buildFighter3DRig(
  charId: string = 'arjun',
  accentColorHex?: string,
  isPlayer1: boolean = true
): Fighter3DRig {
  const group = new THREE.Group();
  const safeId = (charId || (isPlayer1 ? 'arjun' : 'david')).toLowerCase();

  // Character Palette Configurations
  let skinHex = isPlayer1 ? 0xe2a876 : 0xd89c67;
  let hairHex = 0x18181b;
  let outfitHex = isPlayer1 ? 0xb45309 : 0x1e3a8a;
  let secondaryHex = isPlayer1 ? 0x292524 : 0x111827;
  let accentHex = accentColorHex ? parseInt(accentColorHex.replace('#', ''), 16) : (isPlayer1 ? 0xf59e0b : 0x3b82f6);
  let gloveHex = isPlayer1 ? 0xdc2626 : 0x2563eb;
  let leatherHex = 0x3e2723;
  let metalHex = 0x94a3b8;

  // Customize based on character identity
  if (safeId === 'arjun') {
    skinHex = 0xd97706; // Sun-bronzed warm skin
    hairHex = 0x171717; // Jet black spiky warrior hair
    outfitHex = 0xb45309; // Industrial burnt ochre work vest
    secondaryHex = 0x292524; // Heavy reinforced dark work slacks
    accentHex = 0xf59e0b; // Amber hazard yellow
    gloveHex = 0xd97706; // Ochre & leather work wraps
    leatherHex = 0x451a03; // Heavy combat boots
    metalHex = 0xa3a3a3; // Heavy steel wrench
  } else if (safeId === 'steele') {
    skinHex = 0xf5d0b5; // Sovereign Commander weathered skin tone
    hairHex = 0xd1d5db; // Silver military cut
    outfitHex = 0x18181b; // Sovereign military charcoal coat
    secondaryHex = 0x27272a; // Tactical dark carbon slacks
    accentHex = 0x38bdf8; // Cybernetic blue LED
    gloveHex = 0x52525b; // Reinforced carbon tactical gloves
    metalHex = 0xe2e8f0; // Heavy steel cybernetic shoulder & arm
    leatherHex = 0x09090b; // Combat boots
  } else if (safeId === 'david') {
    skinHex = 0x8d5524; // Deep bronze boxer tone
    hairHex = 0x0a0a0a; // Clean fade
    outfitHex = 0x1e1b4b; // Boxer trunks navy
    secondaryHex = 0xfacc15; // Golden side stripe
    accentHex = 0xef4444; // Pro boxer red
    gloveHex = 0xdc2626; // High gloss boxing gloves
    leatherHex = 0x18181b;
  } else if (safeId === 'elena' || safeId === 'maya') {
    skinHex = 0xfcd34d;
    hairHex = 0x1e1b4b;
    outfitHex = 0x7c3aed; // Mystical violet tunic
    secondaryHex = 0x4c1d95;
    accentHex = 0xa855f7;
    gloveHex = 0xec4899;
  } else if (safeId === 'valeria') {
    skinHex = 0xf8fafc; // Porcelain android finish
    hairHex = 0xe2e8f0; // Platinum silver bob
    outfitHex = 0x090d16; // Stealth carbon chassis
    secondaryHex = 0x1e293b; // Titanium carbon weave
    accentHex = 0x22d3ee; // Neon cyan plasma glow
    gloveHex = 0x06b6d4; // Cyan plasma gauntlet
    metalHex = 0x94a3b8; // Polished chrome & titanium
    leatherHex = 0x020617;
  }

  // Textures
  const clothTex = createClothTexture('#333333', '#444444');
  const leatherTex = createLeatherTexture('#261b14');

  // Materials with PBR specular shading & rim highlight readiness (DoubleSide ensures zero triangle culling)
  const skinMat = new THREE.MeshStandardMaterial({
    color: skinHex,
    roughness: 0.55,
    metalness: 0.05,
    bumpScale: 0.02,
    side: THREE.DoubleSide,
  });

  const outfitMat = new THREE.MeshStandardMaterial({
    color: outfitHex,
    roughness: 0.65,
    metalness: 0.15,
    map: clothTex,
    side: THREE.DoubleSide,
  });

  const secondaryOutfitMat = new THREE.MeshStandardMaterial({
    color: secondaryHex,
    roughness: 0.7,
    metalness: 0.1,
    side: THREE.DoubleSide,
  });

  const accentMat = new THREE.MeshStandardMaterial({
    color: accentHex,
    emissive: accentHex,
    emissiveIntensity: 0.5,
    roughness: 0.3,
    metalness: 0.4,
    side: THREE.DoubleSide,
  });

  const hairMat = new THREE.MeshStandardMaterial({
    color: hairHex,
    roughness: 0.45,
    metalness: 0.15,
    side: THREE.DoubleSide,
  });

  const leatherMat = new THREE.MeshStandardMaterial({
    color: leatherHex,
    roughness: 0.4,
    metalness: 0.25,
    map: leatherTex,
    side: THREE.DoubleSide,
  });

  const metalMat = new THREE.MeshStandardMaterial({
    color: metalHex,
    roughness: 0.2,
    metalness: 0.9,
    side: THREE.DoubleSide,
  });

  const gloveMat = new THREE.MeshStandardMaterial({
    color: gloveHex,
    roughness: 0.3,
    metalness: 0.35,
    side: THREE.DoubleSide,
  });

  const eyeMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    emissive: accentHex,
    emissiveIntensity: 0.85,
    roughness: 0.1,
    side: THREE.DoubleSide,
  });

  const glowMat = new THREE.MeshBasicMaterial({
    color: accentHex,
    transparent: true,
    opacity: 0.85,
    side: THREE.DoubleSide,
  });

  // ==========================================
  // 1. TORSO & CORE ANATOMY (Sculpted Musculature)
  // ==========================================
  const torsoGroup = new THREE.Group();
  torsoGroup.position.y = 1.35;

  // Upper Chest Core / Ribcage (Tapered trapezoid form)
  const chestGeom = new THREE.CylinderGeometry(0.42, 0.34, 0.65, 16);
  const chestMesh = new THREE.Mesh(chestGeom, outfitMat);
  chestMesh.castShadow = true;
  chestMesh.receiveShadow = true;
  torsoGroup.add(chestMesh);

  // Left Pectoral Muscle (Rounded anatomical sphere-cap)
  const pecGeom = new THREE.SphereGeometry(0.24, 16, 12);
  pecGeom.scale(1.1, 0.75, 0.6);
  const leftPec = new THREE.Mesh(pecGeom, safeId === 'david' ? skinMat : outfitMat);
  leftPec.position.set(-0.16, 0.12, 0.22);
  leftPec.castShadow = true;
  torsoGroup.add(leftPec);

  // Right Pectoral Muscle
  const rightPec = new THREE.Mesh(pecGeom, safeId === 'david' ? skinMat : outfitMat);
  rightPec.position.set(0.16, 0.12, 0.22);
  rightPec.castShadow = true;
  torsoGroup.add(rightPec);

  // Abdominal Six-Pack Muscular Cut (Lower Torso)
  const absCoreGeom = new THREE.CylinderGeometry(0.33, 0.31, 0.42, 14);
  const absCore = new THREE.Mesh(absCoreGeom, safeId === 'david' ? skinMat : outfitMat);
  absCore.position.set(0, -0.42, 0);
  absCore.castShadow = true;
  torsoGroup.add(absCore);

  // Abdominal Segments (Upper & Lower Abs Definition)
  const abSegmentGeom = new THREE.BoxGeometry(0.12, 0.1, 0.08);
  [-0.08, 0.08].forEach(x => {
    [-0.32, -0.44].forEach(y => {
      const abTile = new THREE.Mesh(abSegmentGeom, safeId === 'david' ? skinMat : secondaryOutfitMat);
      abTile.position.set(x, y, 0.24);
      torsoGroup.add(abTile);
    });
  });

  // Combat Waist Belt with Metallic Heavy Buckle
  const beltGeom = new THREE.CylinderGeometry(0.35, 0.35, 0.14, 18);
  const belt = new THREE.Mesh(beltGeom, leatherMat);
  belt.position.set(0, -0.62, 0);
  belt.castShadow = true;
  torsoGroup.add(belt);

  const buckleGeom = new THREE.BoxGeometry(0.18, 0.12, 0.06);
  const buckle = new THREE.Mesh(buckleGeom, metalMat);
  buckle.position.set(0, -0.62, 0.34);
  buckle.castShadow = true;
  torsoGroup.add(buckle);

  // Martial Arts Gi / Vest Lapels (for Arjun & martial fighters)
  if (safeId === 'arjun' || safeId === 'elena') {
    const lapelGeom = new THREE.BoxGeometry(0.12, 0.65, 0.08);
    const leftLapel = new THREE.Mesh(lapelGeom, accentMat);
    leftLapel.position.set(-0.22, 0.05, 0.24);
    leftLapel.rotation.z = -0.15;
    torsoGroup.add(leftLapel);

    const rightLapel = new THREE.Mesh(lapelGeom, accentMat);
    rightLapel.position.set(0.22, 0.05, 0.24);
    rightLapel.rotation.z = 0.15;
    torsoGroup.add(rightLapel);
  }

  group.add(torsoGroup);

  // ==========================================
  // 2. NECK, HEAD & CHARACTER HAIR / VISAGE
  // ==========================================
  const neckGeom = new THREE.CylinderGeometry(0.15, 0.18, 0.22, 14);
  const neckMesh = new THREE.Mesh(neckGeom, skinMat);
  neckMesh.position.y = 0.38;
  neckMesh.castShadow = true;
  torsoGroup.add(neckMesh);

  const headGroup = new THREE.Group();
  headGroup.position.set(0, 0.62, 0.02);

  // Sculpted Cranium (Spherical cranial dome)
  const skullGeom = new THREE.SphereGeometry(0.26, 18, 16);
  skullGeom.scale(0.9, 1.05, 1.0);
  const skull = new THREE.Mesh(skullGeom, skinMat);
  skull.castShadow = true;
  headGroup.add(skull);

  // Defined Jawline & Chin
  const jawGeom = new THREE.CylinderGeometry(0.18, 0.1, 0.24, 12);
  jawGeom.scale(1.0, 1.0, 1.15);
  const jaw = new THREE.Mesh(jawGeom, skinMat);
  jaw.position.set(0, -0.14, 0.08);
  jaw.rotation.x = 0.2;
  jaw.castShadow = true;
  headGroup.add(jaw);

  // Stylized Fighting Eyes (High-contrast warrior gaze)
  const eyeGeom = new THREE.BoxGeometry(0.09, 0.04, 0.05);
  const leftEye = new THREE.Mesh(eyeGeom, eyeMat);
  leftEye.position.set(-0.09, 0.02, 0.24);
  headGroup.add(leftEye);

  const rightEye = new THREE.Mesh(eyeGeom, eyeMat);
  rightEye.position.set(0.09, 0.02, 0.24);
  headGroup.add(rightEye);

  // Sculpted Nose Bridge
  const noseGeom = new THREE.ConeGeometry(0.04, 0.1, 4);
  const nose = new THREE.Mesh(noseGeom, skinMat);
  nose.position.set(0, -0.02, 0.26);
  nose.rotation.x = -0.2;
  headGroup.add(nose);

  // Character-Specific 3D Hair & Headgear
  const hairGroup = new THREE.Group();
  let headbandRibbons: THREE.Group | undefined;
  let ponytailGroup: THREE.Group | undefined;

  if (safeId === 'arjun') {
    // Spiky dynamic warrior hair
    const spikeGeom = new THREE.ConeGeometry(0.09, 0.32, 6);
    const spikePositions = [
      [0, 0.28, 0, 0.2, 0, 0],
      [-0.14, 0.26, -0.05, 0.3, 0, -0.35],
      [0.14, 0.26, -0.05, 0.3, 0, 0.35],
      [0, 0.24, -0.16, -0.4, 0, 0],
      [-0.18, 0.15, 0.08, 0.1, 0, -0.4],
      [0.18, 0.15, 0.08, 0.1, 0, 0.4],
      [0, 0.25, 0.15, 0.45, 0, 0],
    ];
    spikePositions.forEach(([x, y, z, rx, ry, rz]) => {
      const spike = new THREE.Mesh(spikeGeom, hairMat);
      spike.position.set(x, y, z);
      spike.rotation.set(rx, ry, rz);
      spike.castShadow = true;
      hairGroup.add(spike);
    });

    // Signature Fighter Headband Wrapped Around Forehead
    const headbandGeom = new THREE.TorusGeometry(0.27, 0.04, 8, 20);
    const headband = new THREE.Mesh(headbandGeom, accentMat);
    headband.rotation.x = Math.PI / 2 + 0.1;
    headband.position.set(0, 0.08, 0.02);
    headGroup.add(headband);

    // Flowing Headband Ribbons trailing behind
    headbandRibbons = new THREE.Group();
    headbandRibbons.position.set(0, 0.08, -0.26);
    const ribbonGeom = new THREE.BoxGeometry(0.05, 0.45, 0.02);
    const ribbon1 = new THREE.Mesh(ribbonGeom, accentMat);
    ribbon1.position.set(-0.06, -0.18, 0);
    ribbon1.rotation.z = -0.15;
    ribbon1.rotation.x = -0.25;
    headbandRibbons.add(ribbon1);

    const ribbon2 = new THREE.Mesh(ribbonGeom, accentMat);
    ribbon2.position.set(0.06, -0.18, 0);
    ribbon2.rotation.z = 0.18;
    ribbon2.rotation.x = -0.2;
    headbandRibbons.add(ribbon2);
    headGroup.add(headbandRibbons);
  } else if (safeId === 'steele') {
    // Slick Commander Military Hair
    const slickHairGeom = new THREE.SphereGeometry(0.28, 14, 12);
    slickHairGeom.scale(0.95, 0.9, 1.1);
    const slickHair = new THREE.Mesh(slickHairGeom, hairMat);
    slickHair.position.set(0, 0.12, -0.04);
    slickHair.castShadow = true;
    hairGroup.add(slickHair);

    // Tactical Eye Visor
    const visorGeom = new THREE.BoxGeometry(0.26, 0.06, 0.08);
    const visor = new THREE.Mesh(visorGeom, accentMat);
    visor.position.set(0, 0.02, 0.24);
    headGroup.add(visor);
  } else if (safeId === 'valeria') {
    // Sharp Asymmetric Cybernetic Bob with Cyan Streaks
    const bobGeom = new THREE.SphereGeometry(0.28, 14, 12);
    bobGeom.scale(0.92, 0.95, 1.15);
    const bobHair = new THREE.Mesh(bobGeom, hairMat);
    bobHair.position.set(0, 0.1, -0.04);
    bobHair.castShadow = true;
    hairGroup.add(bobHair);

    // Angular Cyber Bangs (Left & Right)
    const bangGeom = new THREE.BoxGeometry(0.06, 0.32, 0.12);
    const leftBang = new THREE.Mesh(bangGeom, hairMat);
    leftBang.position.set(-0.2, -0.04, 0.14);
    leftBang.rotation.z = -0.2;
    hairGroup.add(leftBang);

    const rightBang = new THREE.Mesh(bangGeom, hairMat);
    rightBang.position.set(0.2, -0.04, 0.14);
    rightBang.rotation.z = 0.2;
    hairGroup.add(rightBang);

    // Glowing Neon Cyan Hair Highlight Streak
    const streakGeom = new THREE.BoxGeometry(0.03, 0.3, 0.04);
    const cyanStreak = new THREE.Mesh(streakGeom, glowMat);
    cyanStreak.position.set(-0.21, -0.06, 0.16);
    hairGroup.add(cyanStreak);

    // Cybernetic Holographic Headset / Comms Reticle
    const commsGeom = new THREE.CylinderGeometry(0.05, 0.05, 0.08, 12);
    commsGeom.rotateZ(Math.PI / 2);
    const commsMesh = new THREE.Mesh(commsGeom, metalMat);
    commsMesh.position.set(-0.27, 0.04, 0);
    headGroup.add(commsMesh);

    const commsGlow = new THREE.Mesh(new THREE.SphereGeometry(0.025, 8, 8), glowMat);
    commsGlow.position.set(-0.31, 0.04, 0);
    headGroup.add(commsGlow);
  } else if (safeId === 'david') {
    // Clean fade crop
    const fadeGeom = new THREE.SphereGeometry(0.27, 14, 12);
    fadeGeom.scale(0.92, 0.85, 0.95);
    const fade = new THREE.Mesh(fadeGeom, hairMat);
    fade.position.set(0, 0.1, -0.02);
    fade.castShadow = true;
    hairGroup.add(fade);
  } else if (safeId === 'elena' || safeId === 'maya') {
    // High Ponytail / Assassin Braids
    const crownHair = new THREE.Mesh(new THREE.SphereGeometry(0.27, 14, 12), hairMat);
    crownHair.position.set(0, 0.1, -0.02);
    hairGroup.add(crownHair);

    ponytailGroup = new THREE.Group();
    ponytailGroup.position.set(0, 0.18, -0.24);
    const tailGeom = new THREE.CylinderGeometry(0.06, 0.02, 0.6, 8);
    const ponytail = new THREE.Mesh(tailGeom, hairMat);
    ponytail.position.y = -0.25;
    ponytail.rotation.x = -0.3;
    ponytail.castShadow = true;
    ponytailGroup.add(ponytail);
    headGroup.add(ponytailGroup);
  } else {
    // Default stylized warrior crop
    const defHair = new THREE.Mesh(new THREE.SphereGeometry(0.28, 14, 12), hairMat);
    defHair.position.set(0, 0.12, -0.02);
    hairGroup.add(defHair);
  }

  headGroup.add(hairGroup);
  torsoGroup.add(headGroup);

  // ==========================================
  // 3. ARMS & COMBAT FISTS (Sculpted Deltoids & Gloves)
  // ==========================================
  const deltoidGeom = new THREE.SphereGeometry(0.18, 14, 12);
  const bicepGeom = new THREE.CylinderGeometry(0.13, 0.11, 0.44, 14);
  const forearmGeom = new THREE.CylinderGeometry(0.12, 0.14, 0.42, 14);
  const gloveFistGeom = new THREE.BoxGeometry(0.22, 0.24, 0.22);
  const knucklePadGeom = new THREE.CylinderGeometry(0.05, 0.05, 0.18, 8);
  knucklePadGeom.rotateZ(Math.PI / 2);

  // --- Left Arm (Back Arm) ---
  const leftShoulder = new THREE.Group();
  leftShoulder.position.set(-0.52, 0.24, -0.02);

  // Deltoid Shoulder Cap
  const leftDeltoid = new THREE.Mesh(deltoidGeom, safeId === 'steele' ? metalMat : outfitMat);
  leftDeltoid.castShadow = true;
  leftShoulder.add(leftDeltoid);

  // Upper Arm (Bicep/Tricep)
  const leftBicep = new THREE.Mesh(bicepGeom, safeId === 'david' ? skinMat : outfitMat);
  leftBicep.position.y = -0.22;
  leftBicep.castShadow = true;
  leftShoulder.add(leftBicep);

  // Left Elbow & Forearm
  const leftElbow = new THREE.Group();
  leftElbow.position.y = -0.44;

  const leftForearm = new THREE.Mesh(forearmGeom, safeId === 'david' ? skinMat : secondaryOutfitMat);
  leftForearm.position.y = -0.21;
  leftForearm.castShadow = true;
  leftElbow.add(leftForearm);

  // Valeria Unit-0 Concealed Arm Blade (Left)
  if (safeId === 'valeria') {
    const bladeGeom = new THREE.BoxGeometry(0.03, 0.42, 0.06);
    const leftBlade = new THREE.Mesh(bladeGeom, glowMat);
    leftBlade.position.set(-0.1, -0.22, 0.05);
    leftElbow.add(leftBlade);
  }

  // Left Fist with Knuckle Guard
  const leftFist = new THREE.Mesh(gloveFistGeom, gloveMat);
  leftFist.position.y = -0.48;
  leftFist.castShadow = true;
  const leftKnuckles = new THREE.Mesh(knucklePadGeom, accentMat);
  leftKnuckles.position.set(0, -0.06, 0.11);
  leftFist.add(leftKnuckles);
  leftElbow.add(leftFist);

  leftShoulder.add(leftElbow);
  torsoGroup.add(leftShoulder);

  // --- Right Arm (Front Lead Arm) ---
  const rightShoulder = new THREE.Group();
  rightShoulder.position.set(0.52, 0.24, 0.02);

  const isSteeleCyber = safeId === 'steele';
  const rightDeltoid = new THREE.Mesh(deltoidGeom, isSteeleCyber ? metalMat : outfitMat);
  rightDeltoid.castShadow = true;
  rightShoulder.add(rightDeltoid);

  const rightBicep = new THREE.Mesh(bicepGeom, isSteeleCyber ? metalMat : (safeId === 'david' ? skinMat : outfitMat));
  rightBicep.position.y = -0.22;
  rightBicep.castShadow = true;
  rightShoulder.add(rightBicep);

  const rightElbow = new THREE.Group();
  rightElbow.position.y = -0.44;

  const rightForearm = new THREE.Mesh(forearmGeom, isSteeleCyber ? metalMat : (safeId === 'david' ? skinMat : secondaryOutfitMat));
  rightForearm.position.y = -0.21;
  rightForearm.castShadow = true;
  rightElbow.add(rightForearm);

  // Cybernetic Energy Conduit Strip on Steele's Arm
  let cyberArmGlow: THREE.Mesh | undefined;
  if (isSteeleCyber) {
    const stripGeom = new THREE.BoxGeometry(0.04, 0.38, 0.04);
    cyberArmGlow = new THREE.Mesh(stripGeom, glowMat);
    cyberArmGlow.position.set(0.12, -0.21, 0.06);
    rightElbow.add(cyberArmGlow);
  }

  // Valeria Unit-0 Concealed Arm Blade (Right)
  if (safeId === 'valeria') {
    const rightBladeGeom = new THREE.BoxGeometry(0.03, 0.42, 0.06);
    const rightBlade = new THREE.Mesh(rightBladeGeom, glowMat);
    rightBlade.position.set(0.1, -0.22, 0.05);
    rightElbow.add(rightBlade);
  }

  const rightFist = new THREE.Mesh(gloveFistGeom, isSteeleCyber ? metalMat : gloveMat);
  rightFist.position.y = -0.48;
  rightFist.castShadow = true;
  const rightKnuckles = new THREE.Mesh(knucklePadGeom, accentMat);
  rightKnuckles.position.set(0, -0.06, 0.11);
  rightFist.add(rightKnuckles);
  rightElbow.add(rightFist);

  // Character Weapon: Arjun's Heavy Titan Steel Wrench
  let weaponMesh: THREE.Mesh | THREE.Group | undefined;
  if (safeId === 'arjun') {
    const wrenchGroup = new THREE.Group();
    // Heavy Steel Shaft
    const handleGeom = new THREE.CylinderGeometry(0.035, 0.035, 0.75, 10);
    const handle = new THREE.Mesh(handleGeom, metalMat);
    handle.position.y = -0.15;
    handle.castShadow = true;
    wrenchGroup.add(handle);

    // Heavy Industrial Wrench Jaw Head
    const headBaseGeom = new THREE.BoxGeometry(0.18, 0.16, 0.08);
    const headBase = new THREE.Mesh(headBaseGeom, metalMat);
    headBase.position.y = 0.24;
    headBase.castShadow = true;
    wrenchGroup.add(headBase);

    // Glowing Power Core on Wrench
    const coreGeom = new THREE.SphereGeometry(0.04, 10, 10);
    const core = new THREE.Mesh(coreGeom, accentMat);
    core.position.set(0, 0.24, 0.05);
    wrenchGroup.add(core);

    wrenchGroup.position.set(0, -0.08, 0.15);
    wrenchGroup.rotation.x = Math.PI / 2;
    wrenchGroup.rotation.z = 0.2;
    rightFist.add(wrenchGroup);
    weaponMesh = wrenchGroup;
  }

  rightShoulder.add(rightElbow);
  torsoGroup.add(rightShoulder);

  // ==========================================
  // 4. LEGS, KNEES & COMBAT BOOTS
  // ==========================================
  const thighGeom = new THREE.CylinderGeometry(0.18, 0.14, 0.58, 14);
  const kneeCapGeom = new THREE.SphereGeometry(0.13, 12, 10);
  const calfGeom = new THREE.CylinderGeometry(0.14, 0.16, 0.52, 14);
  const bootFootGeom = new THREE.BoxGeometry(0.22, 0.18, 0.42);
  const bootSoleGeom = new THREE.BoxGeometry(0.24, 0.06, 0.44);

  // --- Left Leg (Back Leg) ---
  const leftHip = new THREE.Group();
  leftHip.position.set(-0.25, -0.68, -0.03);

  const leftThigh = new THREE.Mesh(thighGeom, secondaryOutfitMat);
  leftThigh.position.y = -0.28;
  leftThigh.castShadow = true;
  leftHip.add(leftThigh);

  const leftKnee = new THREE.Group();
  leftKnee.position.y = -0.56;

  // Knee Guard / Armor Plate
  const leftKneeCap = new THREE.Mesh(kneeCapGeom, accentMat);
  leftKneeCap.position.set(0, 0, 0.12);
  leftKneeCap.castShadow = true;
  leftKnee.add(leftKneeCap);

  const leftCalf = new THREE.Mesh(calfGeom, secondaryOutfitMat);
  leftCalf.position.y = -0.26;
  leftCalf.castShadow = true;
  leftKnee.add(leftCalf);

  // Combat Boot with Reinforced Tread Sole
  const leftFoot = new THREE.Mesh(bootFootGeom, leatherMat);
  leftFoot.position.set(0.02, -0.54, 0.1);
  leftFoot.castShadow = true;

  const leftSole = new THREE.Mesh(bootSoleGeom, metalMat);
  leftSole.position.set(0, -0.09, 0);
  leftFoot.add(leftSole);

  leftKnee.add(leftFoot);
  leftHip.add(leftKnee);
  torsoGroup.add(leftHip);

  // --- Right Leg (Front Lead Leg) ---
  const rightHip = new THREE.Group();
  rightHip.position.set(0.25, -0.68, 0.03);

  const rightThigh = new THREE.Mesh(thighGeom, secondaryOutfitMat);
  rightThigh.position.y = -0.28;
  rightThigh.castShadow = true;
  rightHip.add(rightThigh);

  const rightKnee = new THREE.Group();
  rightKnee.position.y = -0.56;

  const rightKneeCap = new THREE.Mesh(kneeCapGeom, accentMat);
  rightKneeCap.position.set(0, 0, 0.12);
  rightKneeCap.castShadow = true;
  rightKnee.add(rightKneeCap);

  const rightCalf = new THREE.Mesh(calfGeom, secondaryOutfitMat);
  rightCalf.position.y = -0.26;
  rightCalf.castShadow = true;
  rightKnee.add(rightCalf);

  const rightFoot = new THREE.Mesh(bootFootGeom, leatherMat);
  rightFoot.position.set(0.02, -0.54, 0.1);
  rightFoot.castShadow = true;

  const rightSole = new THREE.Mesh(bootSoleGeom, metalMat);
  rightSole.position.set(0, -0.09, 0);
  rightFoot.add(rightSole);

  rightKnee.add(rightFoot);
  rightHip.add(rightKnee);
  torsoGroup.add(rightHip);

  // ==========================================
  // 5. GROUND CONTACT SHADOW & ENERGY AURA
  // ==========================================
  // Realistic multi-ring soft contact shadow disc
  const shadowGeom = new THREE.RingGeometry(0.01, 0.95, 24);
  shadowGeom.rotateX(-Math.PI / 2);
  const shadowMat = new THREE.MeshBasicMaterial({
    color: 0x000000,
    transparent: true,
    opacity: 0.72,
    depthWrite: false,
  });
  const shadowMesh = new THREE.Mesh(shadowGeom, shadowMat);
  shadowMesh.position.y = 0.02;

  // Kinetic Martial Energy Ground Aura Ring
  const auraGeom = new THREE.RingGeometry(0.92, 1.28, 32);
  auraGeom.rotateX(-Math.PI / 2);
  const auraMat = new THREE.MeshBasicMaterial({
    color: accentHex,
    transparent: true,
    opacity: 0.35,
    side: THREE.DoubleSide,
    depthWrite: false,
  });
  const auraMesh = new THREE.Mesh(auraGeom, auraMat);
  auraMesh.position.y = 0.035;

  // Elemental Point Light from fighter core
  const pointLight = new THREE.PointLight(accentHex, 2.2, 7);
  pointLight.position.set(0, 1.45, 0.35);
  group.add(pointLight);

  return {
    group,
    shadowMesh,
    auraMesh,
    pointLight,
    characterId: safeId,
    isPlayer1,
    torsoGroup,
    chestMesh,
    headGroup,
    neckMesh,
    hairGroup,
    headbandRibbons,
    ponytailGroup,
    leftShoulder,
    leftElbow,
    leftFist,
    rightShoulder,
    rightElbow,
    rightFist,
    leftHip,
    leftKnee,
    leftFoot,
    rightHip,
    rightKnee,
    rightFoot,
    weaponMesh,
    cyberArmGlow,
    materials: {
      skin: skinMat,
      outfit: outfitMat,
      accent: accentMat,
      hair: hairMat,
      leather: leatherMat,
      metal: metalMat,
      eyes: eyeMat,
      glow: glowMat,
    },
  };
}

// Animate 3D Humanoid Rig with fluid Street Fighter 6 kinematics
export function animateFighter3DPose(
  rig: Fighter3DRig,
  entity: FightingEntity,
  isHitstun: boolean
) {
  const { state, stateFrame = 0 } = entity;
  const t = stateFrame * 0.22;

  // Base rotation reset
  let torsoRotX = 0;
  let torsoRotY = 0;
  let torsoRotZ = 0;
  let headRotX = 0;
  let headRotY = 0;

  let leftArmRotX = 0.2;
  let leftArmRotZ = -0.3;
  let rightArmRotX = -0.4;
  let rightArmRotZ = 0.4;
  let leftElbowFlex = 0.4;
  let rightElbowFlex = 0.6;

  let leftLegRotX = 0;
  let rightLegRotX = 0;

  // Dynamic ribbon/ponytail sway
  if (rig.headbandRibbons) {
    rig.headbandRibbons.rotation.x = Math.sin(t * 1.5) * 0.2 - 0.2;
    rig.headbandRibbons.rotation.y = Math.cos(t * 1.2) * 0.15;
  }
  if (rig.ponytailGroup) {
    rig.ponytailGroup.rotation.x = Math.sin(t * 1.5) * 0.2 - 0.25;
  }

  // Hit reaction & Cel-Flash
  if (isHitstun || state === 'HIT_LIGHT' || state === 'HIT_HEAVY') {
    rig.materials.outfit.emissive.setHex(0xffffff);
    rig.materials.outfit.emissiveIntensity = 0.95;
    rig.materials.skin.emissive.setHex(0xffffff);
    rig.materials.skin.emissiveIntensity = 0.7;

    torsoRotX = -0.55;
    torsoRotZ = entity.facing === 1 ? -0.2 : 0.2;
    headRotX = -0.45;
    leftArmRotX = -0.9;
    rightArmRotX = -1.1;
  } else {
    rig.materials.outfit.emissive.setHex(0x000000);
    rig.materials.outfit.emissiveIntensity = 0;
    rig.materials.skin.emissive.setHex(0x000000);
    rig.materials.skin.emissiveIntensity = 0;
  }

  switch (state) {
    case 'IDLE':
      torsoRotX = Math.sin(t) * 0.05;
      headRotX = -Math.sin(t) * 0.04;
      rightArmRotX = -0.5 + Math.sin(t) * 0.08;
      leftArmRotX = 0.35 - Math.sin(t) * 0.08;
      rightElbowFlex = 0.8 + Math.sin(t) * 0.1;
      leftElbowFlex = 0.6 - Math.sin(t) * 0.1;
      break;

    case 'CROUCH':
      torsoRotX = 0.45;
      headRotX = -0.3;
      leftLegRotX = 0.8;
      rightLegRotX = 0.9;
      rightArmRotX = -0.8;
      leftArmRotX = -0.2;
      break;

    case 'WALK_FWD':
      torsoRotX = 0.18;
      torsoRotZ = Math.sin(t * 1.5) * 0.06;
      rightLegRotX = Math.sin(t * 1.5) * 0.65;
      leftLegRotX = -Math.sin(t * 1.5) * 0.65;
      rightArmRotX = -Math.sin(t * 1.5) * 0.7;
      leftArmRotX = Math.sin(t * 1.5) * 0.7;
      break;

    case 'WALK_BACK':
      torsoRotX = -0.15;
      rightLegRotX = -Math.sin(t * 1.3) * 0.55;
      leftLegRotX = Math.sin(t * 1.3) * 0.55;
      rightArmRotX = Math.sin(t * 1.3) * 0.5;
      leftArmRotX = -Math.sin(t * 1.3) * 0.5;
      break;

    case 'JUMP':
      torsoRotX = -0.25;
      rightLegRotX = 0.85;
      leftLegRotX = 0.65;
      rightArmRotX = -1.2;
      leftArmRotX = -0.8;
      break;

    case 'DASH':
    case 'ROLL_FWD':
      torsoRotX = 0.45;
      rightLegRotX = 0.6;
      leftLegRotX = -0.5;
      rightArmRotX = -0.9;
      leftArmRotX = 0.7;
      break;

    case 'BACKDASH':
    case 'ROLL_BACK':
      torsoRotX = -0.3;
      rightLegRotX = -0.6;
      leftLegRotX = 0.5;
      rightArmRotX = 0.6;
      leftArmRotX = -0.7;
      break;

    case 'ATTACK_LP':
      torsoRotX = 0.12;
      torsoRotY = 0.35;
      rightArmRotX = -1.55; // Snappy straight jab
      rightArmRotZ = 0.05;
      rightElbowFlex = 0.05;
      leftArmRotX = 0.4;
      break;

    case 'ATTACK_HP':
    case 'BLOWBACK':
      torsoRotX = 0.3;
      torsoRotY = 0.55;
      rightArmRotX = -1.65; // Heavy haymaker thrust
      rightArmRotZ = -0.15;
      rightElbowFlex = 0.15;
      leftArmRotX = 0.65;
      break;

    case 'ATTACK_LK':
      torsoRotX = -0.2;
      rightLegRotX = 1.3; // Snappy mid kick
      leftLegRotX = -0.25;
      rightArmRotX = -0.6;
      leftArmRotX = -0.4;
      break;

    case 'ATTACK_HK':
      torsoRotX = -0.45;
      torsoRotZ = -0.25;
      rightLegRotX = 1.85; // High roundhouse kick
      leftLegRotX = -0.3;
      rightArmRotX = -0.8;
      leftArmRotX = 0.4;
      break;

    case 'SPECIAL_1':
    case 'SPECIAL_2':
      torsoRotX = 0.35;
      torsoRotY = 0.45;
      rightArmRotX = -1.9; // Dragon punch / wrench uppercut arc
      rightElbowFlex = 0.2;
      leftArmRotX = -0.5;
      break;

    case 'SUPER':
    case 'CLIMAX':
      torsoRotX = 0.2;
      rightArmRotX = -2.2; // Skyward power release
      leftArmRotX = -1.8;
      rig.pointLight.intensity = 5.5;
      break;

    case 'VICTORY':
      torsoRotX = -0.15;
      headRotX = -0.2;
      if (rig.characterId === 'arjun') {
        rightArmRotX = -2.5; // Skyward triumphant wrench
        rightArmRotZ = 0.2;
        leftArmRotX = -0.6;
      } else {
        rightArmRotX = -2.3;
        leftArmRotX = -0.8;
      }
      rig.pointLight.intensity = 4.0;
      break;

    case 'DEFEAT':
      torsoRotX = 0.9;
      headRotX = 0.6;
      rightArmRotX = 0.4;
      leftArmRotX = 0.4;
      rightLegRotX = 0.8;
      leftLegRotX = -0.3;
      rig.pointLight.intensity = 0.3;
      break;

    default:
      break;
  }

  // Apply rotations to bone hierarchies
  rig.torsoGroup.rotation.set(torsoRotX, torsoRotY, torsoRotZ);
  rig.headGroup.rotation.set(headRotX, headRotY, 0);

  rig.leftShoulder.rotation.set(leftArmRotX, 0, leftArmRotZ);
  rig.leftElbow.rotation.set(leftElbowFlex, 0, 0);

  rig.rightShoulder.rotation.set(rightArmRotX, 0, rightArmRotZ);
  rig.rightElbow.rotation.set(rightElbowFlex, 0, 0);

  rig.leftHip.rotation.set(leftLegRotX, 0, 0);
  rig.rightHip.rotation.set(rightLegRotX, 0, 0);
}
