export const COMBAT_RENDERER_CONFIG = {
  p1Z: 0.05,
  p2Z: -0.05,
  minimumCombatPlaneDelta: 0.08,
  toneMappingExposure: 1.15,
  shadowMapEnabled: true,
  shadowMapType: 'PCFSoftShadowMap' as const,
  toneMapping: 'ACESFilmicToneMapping' as const,
};

export const COMBAT_RENDERER_MATERIAL_POLICY = {
  characterCastShadow: true,
  floorReceiveShadow: true,
  characterDepthWrite: true,
  characterPolygonOffset: true,
  characterAlphaTest: 0.5,
};

export function combatPlaneZ(isPlayer1: boolean, activeStriker = false): number {
  if (activeStriker) {
    return Math.max(COMBAT_RENDERER_CONFIG.p1Z, COMBAT_RENDERER_CONFIG.p2Z)
      + COMBAT_RENDERER_CONFIG.minimumCombatPlaneDelta;
  }
  return isPlayer1 ? COMBAT_RENDERER_CONFIG.p1Z : COMBAT_RENDERER_CONFIG.p2Z;
}

export function combatRenderOrder(isPlayer1: boolean, activeStriker: boolean): number {
  if (activeStriker) return isPlayer1 ? 41 : 40;
  return isPlayer1 ? 31 : 30;
}

export function contactShadowState(verticalY: number): { y: number; scale: number; opacity: number } {
  const altitude = Math.max(0, verticalY);
  const scale = Math.max(0.42, Math.min(1, 1 - altitude / 320));
  const opacity = Math.max(0.16, Math.min(0.72, 0.72 - altitude / 380));
  return { y: 0, scale, opacity };
}
