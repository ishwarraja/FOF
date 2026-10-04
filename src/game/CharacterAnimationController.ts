import type { FightingEntity, FighterActionState } from '../types/fighting';

export type AnimationAction =
  | 'idle' | 'walk_forward' | 'walk_backward' | 'crouch'
  | 'light_punch' | 'heavy_punch' | 'light_kick' | 'heavy_kick'
  | 'special_1' | 'special_2' | 'special_3' | 'special_4'
  | 'jump' | 'block' | 'hurt_high' | 'hurt_low' | 'knockdown' | 'ko';

export interface AnimationFrameMeta {
  frame: number;
  x: number;
  y: number;
  width: number;
  height: number;
  durationMs: number;
  phase: 'startup' | 'active' | 'recovery' | 'loop';
  hitbox?: { x: number; y: number; width: number; height: number };
}

export interface AnimationClip {
  action: AnimationAction;
  loop: boolean;
  frames: AnimationFrameMeta[];
  defaultFrameDurationMs: number;
  activeStartFrame?: number;
  activeEndFrameExclusive?: number;
}

export interface AnimationEvent {
  type: 'stateChanged' | 'frameChanged' | 'activeStarted' | 'activeEnded' | 'completed';
  action: AnimationAction;
  frame: number;
}

const STATE_TO_ACTION: Partial<Record<FighterActionState, AnimationAction>> = {
  IDLE: 'idle',
  WALK_FWD: 'walk_forward',
  WALK_BACK: 'walk_backward',
  CROUCH: 'crouch',
  JUMP: 'jump',
  JUMP_NEUTRAL: 'jump',
  JUMP_FWD: 'jump',
  JUMP_BACK: 'jump',
  GUARD: 'block',
  ATTACK_LP: 'light_punch',
  ATTACK_HP: 'heavy_punch',
  ATTACK_LK: 'light_kick',
  ATTACK_HK: 'heavy_kick',
  SPECIAL_1: 'special_1',
  SPECIAL_2: 'special_2',
  SPECIAL_3: 'special_3',
  SUPER: 'special_4',
  CLIMAX: 'special_4',
  HIT_LIGHT: 'hurt_high',
  HIT_HEAVY: 'hurt_high',
  KNOCKDOWN: 'knockdown',
  DEFEAT: 'ko',
};

const DEFAULT_FRAME_COUNTS: Record<AnimationAction, number> = {
  idle: 8, walk_forward: 8, walk_backward: 8, crouch: 4,
  light_punch: 7, heavy_punch: 11, light_kick: 8, heavy_kick: 12,
  special_1: 14, special_2: 16, special_3: 15, special_4: 24,
  jump: 10, block: 6, hurt_high: 7, hurt_low: 7, knockdown: 12, ko: 18,
};

const LOOPING = new Set<AnimationAction>(['idle', 'walk_forward', 'walk_backward', 'crouch']);

export function actionForState(state: FighterActionState): AnimationAction {
  return STATE_TO_ACTION[state] ?? 'idle';
}

export function buildFallbackClip(action: AnimationAction, frameWidth = 256, frameHeight = 480): AnimationClip {
  const count = DEFAULT_FRAME_COUNTS[action];
  const activeStart = action.includes('punch') || action.includes('kick') || action.startsWith('special_') ? Math.max(1, Math.floor(count * 0.32)) : undefined;
  const activeEnd = activeStart === undefined ? undefined : Math.max(activeStart + 1, Math.floor(count * 0.55));
  const frames: AnimationFrameMeta[] = Array.from({ length: count }, (_, frame) => ({
    frame,
    x: frame * frameWidth,
    y: 0,
    width: frameWidth,
    height: frameHeight,
    durationMs: 1000 / 60,
    phase: LOOPING.has(action) ? 'loop' : frame < (activeStart ?? count) ? 'startup' : frame < (activeEnd ?? count) ? 'active' : 'recovery',
    ...(activeStart !== undefined && frame >= activeStart && frame < (activeEnd ?? activeStart + 1)
      ? { hitbox: { x: 145, y: 150, width: 95, height: 110 } }
      : {}),
  }));
  return {
    action,
    loop: LOOPING.has(action),
    frames,
    defaultFrameDurationMs: 1000 / 60,
    activeStartFrame: activeStart,
    activeEndFrameExclusive: activeEnd,
  };
}

export class CharacterAnimationController {
  private clips = new Map<AnimationAction, AnimationClip>();
  private currentAction: AnimationAction = 'idle';
  private currentFrame = 0;
  private elapsedMs = 0;
  private lastState: FighterActionState = 'IDLE';
  private active = false;
  private events: AnimationEvent[] = [];

  constructor(clips: Partial<Record<AnimationAction, AnimationClip>> = {}) {
    (Object.keys(DEFAULT_FRAME_COUNTS) as AnimationAction[]).forEach((action) => {
      this.clips.set(action, clips[action] ?? buildFallbackClip(action));
    });
  }

  registerClip(clip: AnimationClip): void {
    if (!clip.frames.length) throw new Error(`Animation clip ${clip.action} contains no frames`);
    this.clips.set(clip.action, clip);
  }

  getAction(): AnimationAction { return this.currentAction; }
  getFrame(): number { return this.currentFrame; }
  getClip(): AnimationClip { return this.clips.get(this.currentAction)!; }
  getFrameMeta(): AnimationFrameMeta { return this.getClip().frames[this.currentFrame] ?? this.getClip().frames[0]; }
  isActiveFrame(): boolean { return this.active; }
  consumeEvents(): AnimationEvent[] { const out = this.events; this.events = []; return out; }

  trigger(action: AnimationAction): void {
    this.currentAction = action;
    this.currentFrame = 0;
    this.elapsedMs = 0;
    this.active = this.computeActive();
    this.events.push({ type: 'stateChanged', action, frame: 0 });
    if (this.active) this.events.push({ type: 'activeStarted', action, frame: 0 });
  }

  interruptWith(action: AnimationAction): void { this.trigger(action); }

  syncFromEntity(entity: FightingEntity): void {
    const action = actionForState(entity.state);
    if (action !== this.currentAction || entity.state !== this.lastState) {
      this.currentAction = action;
      this.currentFrame = 0;
      this.elapsedMs = 0;
      this.active = false;
      this.events.push({ type: 'stateChanged', action, frame: 0 });
    }
    this.lastState = entity.state;

    // Gameplay remains authoritative: stateFrame is the deterministic 60 Hz playhead.
    const clip = this.getClip();
    const total = clip.frames.length;
    if (entity.currentMove && !clip.loop) {
      const target = Math.max(0, Math.min(total - 1, entity.stateFrame));
      if (target !== this.currentFrame) {
        this.currentFrame = target;
        this.elapsedMs = 0;
        this.events.push({ type: 'frameChanged', action, frame: target });
      }
    } else if (!clip.loop && entity.stateFrame >= total) {
      this.currentFrame = total - 1;
    }
    this.active = this.computeActive();
  }

  update(deltaMs: number, entity?: FightingEntity): void {
    if (entity) this.syncFromEntity(entity);
    const clip = this.getClip();
    if (clip.loop) {
      this.elapsedMs += Math.max(0, Math.min(deltaMs, 100));
      while (this.elapsedMs >= this.frameDuration()) {
        this.elapsedMs -= this.frameDuration();
        this.currentFrame = (this.currentFrame + 1) % clip.frames.length;
        this.events.push({ type: 'frameChanged', action: this.currentAction, frame: this.currentFrame });
      }
      this.active = this.computeActive();
      return;
    }

    // When driven without an entity, deterministic 60 Hz frame stepping is used.
    this.elapsedMs += Math.max(0, Math.min(deltaMs, 100));
    while (this.elapsedMs >= this.frameDuration()) {
      this.elapsedMs -= this.frameDuration();
      if (this.currentFrame < clip.frames.length - 1) {
        const wasActive = this.active;
        this.currentFrame += 1;
        this.active = this.computeActive();
        if (!wasActive && this.active) this.events.push({ type: 'activeStarted', action: this.currentAction, frame: this.currentFrame });
        if (wasActive && !this.active) this.events.push({ type: 'activeEnded', action: this.currentAction, frame: this.currentFrame });
        this.events.push({ type: 'frameChanged', action: this.currentAction, frame: this.currentFrame });
      } else if (!clip.loop) {
        this.events.push({ type: 'completed', action: this.currentAction, frame: this.currentFrame });
        this.trigger('idle');
        break;
      }
    }
  }

  private frameDuration(): number {
    return Math.max(1, this.getFrameMeta()?.durationMs ?? this.getClip().defaultFrameDurationMs);
  }

  private computeActive(): boolean {
    const clip = this.getClip();
    const meta = clip.frames[this.currentFrame];
    if (meta?.phase === 'active') return true;
    if (clip.activeStartFrame === undefined || clip.activeEndFrameExclusive === undefined) return false;
    return this.currentFrame >= clip.activeStartFrame && this.currentFrame < clip.activeEndFrameExclusive;
  }
}

export const ANIMATION_ACTIONS: AnimationAction[] = Object.keys(DEFAULT_FRAME_COUNTS) as AnimationAction[];
