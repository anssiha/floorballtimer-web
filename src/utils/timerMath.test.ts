import { describe, it, expect } from 'vitest';
import type { MatchConfig, MatchState } from '../types/timer';
import { DEFAULT_CONFIG } from '../constants/presets';
import { createDefaultGoalieSaves } from './goalie';
import {
  getStageClock,
  advanceClock,
  adjustClock,
  getStageProgressPercent,
  moveToStage,
  isMatchStarted,
  statusAfterAdjust,
  reopenFinishedMatch,
} from './timerMath';

const MIN = 60 * 1000;

const up: MatchConfig = {
  ...DEFAULT_CONFIG,
  periodCount: 3,
  periodDurationMinutes: 20,
  breakDurationMinutes: 10,
  overtimeDurationMinutes: 5,
  countDirection: 'UP',
};
const down: MatchConfig = { ...up, countDirection: 'DOWN' };

function makeState(overrides: Partial<MatchState>): MatchState {
  return {
    status: 'RUNNING',
    stage: 'PERIOD',
    currentPeriod: 1,
    remainingMs: 0,
    totalDurationMs: 20 * MIN,
    goalieSaves: createDefaultGoalieSaves(),
    ...overrides,
  };
}

describe('getStageClock', () => {
  it('counts up continuously across periods', () => {
    expect(getStageClock(up, 'PERIOD', 1)).toMatchObject({ startMs: 0, endMs: 20 * MIN });
    expect(getStageClock(up, 'PERIOD', 2)).toMatchObject({ startMs: 20 * MIN, endMs: 40 * MIN });
    expect(getStageClock(up, 'PERIOD', 3)).toMatchObject({ startMs: 40 * MIN, endMs: 60 * MIN });
  });

  it('continues overtime after regular time when counting up', () => {
    expect(getStageClock(up, 'OVERTIME', 3)).toEqual({
      startMs: 60 * MIN,
      endMs: 65 * MIN,
      durationMs: 5 * MIN,
      countsDown: false,
    });
  });

  it('runs every period and overtime from its length to zero when counting down', () => {
    expect(getStageClock(down, 'PERIOD', 2)).toMatchObject({ startMs: 20 * MIN, endMs: 0, countsDown: true });
    expect(getStageClock(down, 'OVERTIME', 3)).toMatchObject({ startMs: 5 * MIN, endMs: 0, countsDown: true });
  });

  it('always counts breaks down', () => {
    for (const config of [up, down]) {
      expect(getStageClock(config, 'BREAK', 1)).toEqual({
        startMs: 10 * MIN,
        endMs: 0,
        durationMs: 10 * MIN,
        countsDown: true,
      });
    }
  });
});

describe('advanceClock', () => {
  it('moves the clock up and stops exactly at the period end', () => {
    const state = makeState({ currentPeriod: 2, remainingMs: 39 * MIN });
    expect(advanceClock(up, state, 30 * 1000)).toEqual({ remainingMs: 39.5 * MIN, isEnded: false });
    expect(advanceClock(up, state, 2 * MIN)).toEqual({ remainingMs: 40 * MIN, isEnded: true });
  });

  it('moves the clock down and stops at zero', () => {
    const state = makeState({ remainingMs: 1000 });
    expect(advanceClock(down, state, 400)).toEqual({ remainingMs: 600, isEnded: false });
    expect(advanceClock(down, state, 5000)).toEqual({ remainingMs: 0, isEnded: true });
  });

  it('counts a break down even when the match counts up', () => {
    const state = makeState({ stage: 'BREAK', remainingMs: 10 * MIN });
    expect(advanceClock(up, state, MIN)).toEqual({ remainingMs: 9 * MIN, isEnded: false });
  });

  it('ends count-up overtime at regular time + overtime length', () => {
    const state = makeState({ stage: 'OVERTIME', currentPeriod: 3, remainingMs: 64 * MIN });
    expect(advanceClock(up, state, 2 * MIN)).toEqual({ remainingMs: 65 * MIN, isEnded: true });
  });
});

describe('adjustClock', () => {
  it('steps from the displayed second (floor when counting up)', () => {
    const state = makeState({ remainingMs: 10_900 }); // shows 00:10
    expect(adjustClock(up, state, 1)).toBe(11_000);
  });

  it('steps from the displayed second (ceil when counting down)', () => {
    const state = makeState({ remainingMs: 10_100 }); // shows 00:11
    expect(adjustClock(down, state, -1)).toBe(10_000);
  });

  it('stays within the current count-up period', () => {
    const state = makeState({ currentPeriod: 2, remainingMs: 20 * MIN + 30 * 1000 });
    expect(adjustClock(up, state, -60)).toBe(20 * MIN);
    expect(adjustClock(up, { ...state, remainingMs: 39.5 * MIN }, 60)).toBe(40 * MIN);
  });

  it('stays within the period length when counting down', () => {
    const state = makeState({ remainingMs: 19.5 * MIN });
    expect(adjustClock(down, state, 60)).toBe(20 * MIN);
    expect(adjustClock(down, { ...state, remainingMs: 30 * 1000 }, -60)).toBe(0);
  });
});

describe('getStageProgressPercent', () => {
  it('reports the share of the stage played', () => {
    expect(getStageProgressPercent(up, makeState({ currentPeriod: 2, remainingMs: 30 * MIN }))).toBe(50);
    expect(getStageProgressPercent(down, makeState({ remainingMs: 15 * MIN }))).toBe(25);
    expect(getStageProgressPercent(up, makeState({ stage: 'BREAK', remainingMs: 0 }))).toBe(100);
  });

  it('is 0 for a zero-length stage', () => {
    const config = { ...up, breakDurationMinutes: 0 };
    expect(getStageProgressPercent(config, makeState({ stage: 'BREAK', remainingMs: 0 }))).toBe(0);
  });
});

describe('moveToStage', () => {
  it('starts the next count-up period where the previous one ended', () => {
    const state = makeState({ status: 'PERIOD_ENDED', remainingMs: 20 * MIN });
    expect(moveToStage(up, state, 'PERIOD', 2, 'start', 'STOPPED')).toMatchObject({
      status: 'STOPPED',
      stage: 'PERIOD',
      currentPeriod: 2,
      remainingMs: 20 * MIN,
      totalDurationMs: 20 * MIN,
    });
  });

  it('puts the clock at the stage end when reverting', () => {
    const state = makeState({ stage: 'OVERTIME', currentPeriod: 3, remainingMs: 2 * MIN });
    expect(moveToStage(down, state, 'PERIOD', 3, 'end', 'PAUSED')).toMatchObject({
      status: 'PAUSED',
      stage: 'PERIOD',
      remainingMs: 0,
    });
  });

  it('keeps goalie saves untouched', () => {
    const state = makeState({});
    expect(moveToStage(up, state, 'BREAK', 1, 'start', 'RUNNING').goalieSaves).toBe(state.goalieSaves);
  });
});

describe('isMatchStarted', () => {
  it('is false only before the first period has been started', () => {
    expect(isMatchStarted({ stage: 'PERIOD', currentPeriod: 1, status: 'STOPPED' })).toBe(false);
    expect(isMatchStarted({ stage: 'PERIOD', currentPeriod: 1, status: 'RUNNING' })).toBe(true);
    expect(isMatchStarted({ stage: 'PERIOD', currentPeriod: 1, status: 'PAUSED' })).toBe(true);
    expect(isMatchStarted({ stage: 'PERIOD', currentPeriod: 2, status: 'STOPPED' })).toBe(true);
    expect(isMatchStarted({ stage: 'BREAK', currentPeriod: 1, status: 'STOPPED' })).toBe(true);
  });
});

describe('statusAfterAdjust', () => {
  it('keeps a break running, also when time is added after it ended', () => {
    expect(statusAfterAdjust({ stage: 'BREAK', status: 'RUNNING' }, 60_000)).toBe('RUNNING');
    expect(statusAfterAdjust({ stage: 'BREAK', status: 'PERIOD_ENDED' }, 60_000)).toBe('RUNNING');
    expect(statusAfterAdjust({ stage: 'BREAK', status: 'PERIOD_ENDED' }, 0)).toBe('PERIOD_ENDED');
  });

  it('pauses an ended period so play can continue, otherwise keeps the status', () => {
    expect(statusAfterAdjust({ stage: 'PERIOD', status: 'PERIOD_ENDED' }, 60_000)).toBe('PAUSED');
    expect(statusAfterAdjust({ stage: 'PERIOD', status: 'RUNNING' }, 60_000)).toBe('RUNNING');
    expect(statusAfterAdjust({ stage: 'OVERTIME', status: 'STOPPED' }, 60_000)).toBe('STOPPED');
  });
});

describe('reopenFinishedMatch', () => {
  it('keeps the clock when the match was finished early', () => {
    const state = makeState({ status: 'MATCH_FINISHED', currentPeriod: 3, remainingMs: 12 * MIN });
    expect(reopenFinishedMatch(down, state)).toMatchObject({ status: 'PAUSED', remainingMs: 12 * MIN });
  });

  it('returns to "ended" when the clock had run out', () => {
    const state = makeState({ status: 'MATCH_FINISHED', currentPeriod: 3, remainingMs: 60 * MIN });
    expect(reopenFinishedMatch(up, state)).toMatchObject({ status: 'PERIOD_ENDED', remainingMs: 60 * MIN });
  });
});
