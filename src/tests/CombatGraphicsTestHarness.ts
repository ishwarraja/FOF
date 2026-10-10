import assert from 'node:assert/strict';
import { CharacterAnimationController } from '../game/CharacterAnimationController.ts';
import { getCharacterAssetPaths } from '../utils/CharacterLoader.ts';
import {
  COMBAT_RENDERER_CONFIG,
  COMBAT_RENDERER_MATERIAL_POLICY,
  combatPlaneZ,
  combatRenderOrder,
  contactShadowState,
} from '../game/CombatGraphicsMath.ts';

interface TestResult { name: string; pass: boolean; detail: string; }
const results: TestResult[] = [];

function run(name: string, fn: () => void): void {
  try { fn(); results.push({ name, pass: true, detail: 'PASS' }); }
  catch (error) { results.push({ name, pass: false, detail: error instanceof Error ? error.message : String(error) }); }
}

export function test_character_z_separation(): void {
  const p1z = combatPlaneZ(true);
  const p2z = combatPlaneZ(false);
  assert.equal(p1z, 0.05, 'Player 1 base depth plane changed');
  assert.equal(p2z, -0.05, 'Player 2 base depth plane changed');
  assert.ok(Math.abs(p1z - p2z) >= COMBAT_RENDERER_CONFIG.minimumCombatPlaneDelta);
  const p1StrikeZ = combatPlaneZ(true, true);
  const p2StrikeZ = combatPlaneZ(false, true);
  assert.ok(p1StrikeZ > p2z, 'Player 1 striker did not move in front of Player 2');
  assert.ok(p2StrikeZ > p1z, 'Player 2 striker did not move in front of Player 1');
  const defender = combatRenderOrder(false, false);
  for (const striker of [combatRenderOrder(true, true), combatRenderOrder(false, true)]) {
    assert.ok(striker > defender, `active striker renderOrder ${striker} did not exceed defender ${defender}`);
  }
}

export function test_ground_shadow_anchoring(): void {
  for (const y of [0, 10, 75, 160, 300, 600]) {
    const shadow = contactShadowState(y);
    assert.equal(shadow.y, 0, `shadow y drifted at fighter y=${y}`);
    assert.ok(shadow.scale <= 1 && shadow.scale >= 0.42, `invalid shadow scale at y=${y}`);
    assert.ok(shadow.opacity <= 0.72 && shadow.opacity >= 0.16, `invalid opacity at y=${y}`);
  }
  assert.ok(contactShadowState(200).opacity < contactShadowState(0).opacity, 'shadow opacity did not decrease with altitude');
}

export function test_character_asset_pipeline_paths(): void {
  const assets = getCharacterAssetPaths('General Jonas Steele');
  assert.equal(assets.glb, '/assets/characters/steele/model.glb');
  assert.equal(assets.gltf, '/assets/characters/steele/model.gltf');
  assert.ok(assets.albedoCandidates.includes('/assets/characters/steele/texture_albedo.png'));
  assert.ok(assets.normalCandidates.includes('/assets/characters/steele/texture_normal.png'));
  assert.ok(assets.roughnessCandidates.includes('/assets/characters/steele/texture_roughness.png'));
  assert.ok(assets.spriteCandidates.includes('/assets/characters/steele/fighter_cutout.png'));
}

export function test_animation_state_transitions(): void {
  const controller = new CharacterAnimationController();
  controller.trigger('heavy_punch');
  assert.equal(controller.getAction(), 'heavy_punch');
  assert.equal(controller.getFrame(), 0);
  controller.update(1000 / 60);
  assert.ok(controller.getFrame() > 0, 'heavy punch playhead did not advance');
  let sawActive = controller.isActiveFrame();
  for (let i = 0; i < 20; i++) { controller.update(1000 / 60); sawActive ||= controller.isActiveFrame(); }
  assert.ok(sawActive, 'heavy punch never entered active hitbox frames');
  assert.equal(controller.getAction(), 'idle', 'completed one-shot did not return to idle');

  controller.trigger('heavy_punch');
  controller.update(1000 / 60);
  assert.equal(controller.getAction(), 'heavy_punch');
  controller.interruptWith('hurt_high');
  assert.equal(controller.getAction(), 'hurt_high', 'damage did not interrupt startup');
  assert.equal(controller.getFrame(), 0, 'hurt reaction did not reset frame playhead');
}

export function test_lighting_and_material_compliance(): void {
  assert.equal(COMBAT_RENDERER_CONFIG.shadowMapEnabled, true);
  assert.equal(COMBAT_RENDERER_CONFIG.shadowMapType, 'PCFSoftShadowMap');
  assert.equal(COMBAT_RENDERER_CONFIG.toneMapping, 'ACESFilmicToneMapping');
  assert.equal(COMBAT_RENDERER_CONFIG.toneMappingExposure, 1.15);
  assert.equal(COMBAT_RENDERER_MATERIAL_POLICY.characterCastShadow, true);
  assert.equal(COMBAT_RENDERER_MATERIAL_POLICY.floorReceiveShadow, true);
  assert.equal(COMBAT_RENDERER_MATERIAL_POLICY.characterDepthWrite, true);
  assert.equal(COMBAT_RENDERER_MATERIAL_POLICY.characterPolygonOffset, true);
  assert.equal(COMBAT_RENDERER_MATERIAL_POLICY.characterAlphaTest, 0.5);
}

run('test_character_z_separation()', test_character_z_separation);
run('test_character_asset_pipeline_paths()', test_character_asset_pipeline_paths);
run('test_ground_shadow_anchoring()', test_ground_shadow_anchoring);
run('test_animation_state_transitions()', test_animation_state_transitions);
run('test_lighting_and_material_compliance()', test_lighting_and_material_compliance);

const failed = results.filter(r => !r.pass);
console.log('\n=== FOF Combat Graphics Test Run Log ===');
for (const result of results) console.log(`${result.pass ? 'PASS' : 'FAIL'} | ${result.name} | ${result.detail}`);
console.log(`RESULT: ${results.length - failed.length}/${results.length} passed`);
if (failed.length) process.exitCode = 1;

export const testSummary = { total: results.length, passed: results.length - failed.length, failed: failed.length, results };
