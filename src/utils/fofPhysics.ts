import { FightingEntity, FighterActionState } from '../types/fighting';

export const GROUND_Y = 0;
export const MAX_JUMP_HEIGHT = 300;
export const PHYSICS_FRAME_RATE = 60;

export function isJumpState(state: FighterActionState): boolean {
  return state === 'JUMP' || state === 'JUMP_NEUTRAL' || state === 'JUMP_FWD' || state === 'JUMP_BACK';
}

export function resetFighterToGround(entity: FightingEntity): void {
  entity.y = GROUND_Y;
  entity.vy = 0;
  entity.isGrounded = true;
  if (isJumpState(entity.state)) entity.state = 'IDLE';
}

export function stepFighterVertical(entity: FightingEntity, gravity: number, dtSeconds: number): void {
  if (entity.isGrounded) return;

  const frameScale = Math.min(3, Math.max(0, dtSeconds * PHYSICS_FRAME_RATE));
  entity.vy -= gravity * frameScale;
  entity.y += entity.vy * frameScale;

  if (!Number.isFinite(entity.y) || !Number.isFinite(entity.vy) || entity.y < GROUND_Y - 100 || entity.y > MAX_JUMP_HEIGHT + 100) {
    resetFighterToGround(entity);
    return;
  }

  if (entity.y <= GROUND_Y) {
    resetFighterToGround(entity);
  }
}

export function startFighterJump(entity: FightingEntity, jumpVelocity: number, state: FighterActionState = 'JUMP'): boolean {
  if (!entity.isGrounded) return false;
  entity.vy = jumpVelocity;
  entity.isGrounded = false;
  entity.state = state;
  entity.stateFrame = 0;
  return true;
}