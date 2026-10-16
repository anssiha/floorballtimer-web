import type { MatchConfig, MatchState, StageType, TimerStatus } from '../types/timer';

const MS_PER_MINUTE = 60 * 1000;

/**
 * Where the clock starts and stops for one stage of the match.
 *
 * - Breaks always count down from the break length to 00:00.
 * - Count DOWN: periods and overtime run from their length to 00:00.
 * - Count UP: time runs continuously across the match, e.g. with 3 x 20 min
 *   period 1 is 00:00 -> 20:00, period 2 is 20:00 -> 40:00, period 3 is 40:00 -> 60:00
 *   and overtime continues from 60:00.
 */
export interface StageClock {
  startMs: number;
  endMs: number;
  durationMs: number;
  countsDown: boolean;
}

export function getStageClock(
  config: MatchConfig,
  stage: StageType,
  period: number
): StageClock {
  if (stage === 'BREAK') {
    const durationMs = config.breakDurationMinutes * MS_PER_MINUTE;
    return { startMs: durationMs, endMs: 0, durationMs, countsDown: true };
  }

  const periodMs = config.periodDurationMinutes * MS_PER_MINUTE;
  const countsDown = config.countDirection === 'DOWN';

  if (stage === 'OVERTIME') {
    const durationMs = config.overtimeDurationMinutes * MS_PER_MINUTE;
    if (countsDown) {
      return { startMs: durationMs, endMs: 0, durationMs, countsDown };
    }
    const regularEndMs = config.periodCount * periodMs;
    return { startMs: regularEndMs, endMs: regularEndMs + durationMs, durationMs, countsDown };
  }

  if (countsDown) {
    return { startMs: periodMs, endMs: 0, durationMs: periodMs, countsDown };
  }
  return {
    startMs: (period - 1) * periodMs,
    endMs: period * periodMs,
    durationMs: periodMs,
    countsDown,
  };
}

/**
 * Runs the clock forward by `deltaMs` of real time, stopping at the stage end.
 */
export function advanceClock(
  config: MatchConfig,
  state: Pick<MatchState, 'stage' | 'currentPeriod' | 'remainingMs'>,
  deltaMs: number
): { remainingMs: number; isEnded: boolean } {
  const clock = getStageClock(config, state.stage, state.currentPeriod);
  if (clock.countsDown) {
    const remainingMs = state.remainingMs - deltaMs;
    return remainingMs <= clock.endMs
      ? { remainingMs: clock.endMs, isEnded: true }
      : { remainingMs, isEnded: false };
  }
  const remainingMs = state.remainingMs + deltaMs;
  return remainingMs >= clock.endMs
    ? { remainingMs: clock.endMs, isEnded: true }
    : { remainingMs, isEnded: false };
}

/**
 * Moves the clock by whole seconds (stepper buttons), starting from the second currently
 * shown on screen and staying within the current stage.
 */
export function adjustClock(
  config: MatchConfig,
  state: Pick<MatchState, 'stage' | 'currentPeriod' | 'remainingMs'>,
  deltaSeconds: number
): number {
  // Snap to the displayed second; must match the rounding used by formatMMSS
  const currentSec =
    config.countDirection === 'DOWN'
      ? Math.ceil(state.remainingMs / 1000)
      : Math.floor(state.remainingMs / 1000);

  const clock = getStageClock(config, state.stage, state.currentPeriod);
  const minSec = Math.min(clock.startMs, clock.endMs) / 1000;
  const maxSec = Math.max(clock.startMs, clock.endMs) / 1000;
  const newSec = Math.max(minSec, Math.min(maxSec, currentSec + deltaSeconds));
  return newSec * 1000;
}

/**
 * Share of the current stage already played, 0-100.
 */
export function getStageProgressPercent(
  config: MatchConfig,
  state: Pick<MatchState, 'stage' | 'currentPeriod' | 'remainingMs'>
): number {
  const clock = getStageClock(config, state.stage, state.currentPeriod);
  if (clock.durationMs <= 0) return 0;
  const elapsedMs = clock.countsDown
    ? clock.startMs - state.remainingMs
    : state.remainingMs - clock.startMs;
  return Math.min(100, Math.max(0, (elapsedMs / clock.durationMs) * 100));
}

/**
 * Puts the match into `stage`/`period` with the clock at the stage start
 * (moving forward) or at its end (reverting to a stage that was left by mistake).
 */
export function moveToStage(
  config: MatchConfig,
  state: MatchState,
  stage: StageType,
  period: number,
  position: 'start' | 'end',
  status: TimerStatus
): MatchState {
  const clock = getStageClock(config, stage, period);
  return {
    ...state,
    status,
    stage,
    currentPeriod: period,
    totalDurationMs: clock.durationMs,
    remainingMs: position === 'start' ? clock.startMs : clock.endMs,
  };
}

/**
 * True once the first period has been started. The match format (period count, length,
 * count direction) is locked from then on until the match is reset.
 */
export function isMatchStarted(state: Pick<MatchState, 'stage' | 'currentPeriod' | 'status'>): boolean {
  return !(state.stage === 'PERIOD' && state.currentPeriod === 1 && state.status === 'STOPPED');
}

/**
 * Status after the clock was adjusted with the stepper buttons.
 * A break always keeps running (it can't be paused); it only stays ended if it is still at 00:00.
 * In a period, adjusting an ended clock pauses it so play can continue from the new time.
 */
export function statusAfterAdjust(
  state: Pick<MatchState, 'stage' | 'status'>,
  newRemainingMs: number
): TimerStatus {
  if (state.stage === 'BREAK') {
    return newRemainingMs > 0 ? 'RUNNING' : state.status;
  }
  return state.status === 'PERIOD_ENDED' ? 'PAUSED' : state.status;
}

/**
 * Undo "match finished": the match can be finished early from the secondary button,
 * so keep the clock where it was. Only a clock that had run out goes back to "ended".
 */
export function reopenFinishedMatch(config: MatchConfig, state: MatchState): MatchState {
  const clock = getStageClock(config, state.stage, state.currentPeriod);
  return {
    ...state,
    status: state.remainingMs === clock.endMs ? 'PERIOD_ENDED' : 'PAUSED',
  };
}
