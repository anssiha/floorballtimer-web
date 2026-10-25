import { describe, it, expect } from 'vitest';
import {
  createDefaultScore,
  changeGoals,
  getStageGoals,
  getTeamGoals,
  resetStageGoals,
  getScoreRow,
} from './score';

describe('changeGoals', () => {
  it('adds goals to the current period', () => {
    let score = createDefaultScore().home;
    score = changeGoals(score, 'PERIOD', 1, 1);
    score = changeGoals(score, 'PERIOD', 1, 1);
    score = changeGoals(score, 'PERIOD', 2, 1);
    expect(score.goalsPerPeriod).toEqual({ 1: 2, 2: 1 });
    expect(getTeamGoals(score)).toBe(3);
  });

  it('adds overtime goals separately from periods', () => {
    let score = changeGoals(createDefaultScore().away, 'PERIOD', 3, 1);
    score = changeGoals(score, 'OVERTIME', 3, 1);
    expect(getStageGoals(score, 'OVERTIME', 3)).toBe(1);
    expect(getStageGoals(score, 'PERIOD', 3)).toBe(1);
    expect(getTeamGoals(score)).toBe(2);
  });

  it('never goes below zero', () => {
    const score = changeGoals(createDefaultScore().home, 'PERIOD', 1, -1);
    expect(getStageGoals(score, 'PERIOD', 1)).toBe(0);
    const ot = changeGoals(createDefaultScore().home, 'OVERTIME', 3, -1);
    expect(ot.goalsOvertime).toBe(0);
  });

  it('counts break goals to the period that just ended', () => {
    const score = changeGoals(createDefaultScore().home, 'BREAK', 1, 1);
    expect(score.goalsPerPeriod).toEqual({ 1: 1 });
  });
});

describe('resetStageGoals', () => {
  it('clears only the given period', () => {
    const score = { goalsPerPeriod: { 1: 2, 2: 3 }, goalsOvertime: 1 };
    expect(resetStageGoals(score, 'PERIOD', 2)).toEqual({
      goalsPerPeriod: { 1: 2, 2: 0 },
      goalsOvertime: 1,
    });
  });

  it('clears only overtime in overtime', () => {
    const score = { goalsPerPeriod: { 3: 2 }, goalsOvertime: 1 };
    expect(resetStageGoals(score, 'OVERTIME', 3)).toEqual({
      goalsPerPeriod: { 3: 2 },
      goalsOvertime: 0,
    });
  });
});

describe('getScoreRow', () => {
  it('shows unplayed periods and overtime as null', () => {
    const score = { goalsPerPeriod: { 1: 2 }, goalsOvertime: 0 };
    expect(getScoreRow(score, { periodCount: 3, playedPeriods: 2, overtimePlayed: false })).toEqual({
      periods: [2, 0, null],
      overtime: null,
      total: 2,
    });
  });

  it('shows goals recorded in a period not reached yet', () => {
    const score = { goalsPerPeriod: { 3: 1 }, goalsOvertime: 1 };
    expect(getScoreRow(score, { periodCount: 3, playedPeriods: 1, overtimePlayed: false })).toEqual({
      periods: [0, null, 1],
      overtime: 1,
      total: 2,
    });
  });
});
