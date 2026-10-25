import type { ScoreState, StageType, TeamScore } from '../types/timer';

export function createDefaultScore(): ScoreState {
  return {
    home: { goalsPerPeriod: {}, goalsOvertime: 0 },
    away: { goalsPerPeriod: {}, goalsOvertime: 0 },
  };
}

/**
 * Goals of a team in the given stage: overtime goals in overtime, otherwise the period's goals.
 * During a break, currentPeriod still points at the period that just ended.
 */
export function getStageGoals(score: TeamScore, stage: StageType, period: number): number {
  if (stage === 'OVERTIME') return score.goalsOvertime || 0;
  return score.goalsPerPeriod?.[period] || 0;
}

/**
 * Total goals of a team across all periods and overtime
 */
export function getTeamGoals(score: TeamScore): number {
  const periodTotal = Object.values(score.goalsPerPeriod || {}).reduce(
    (sum, count) => sum + (count || 0),
    0
  );
  return periodTotal + (score.goalsOvertime || 0);
}

/**
 * Adds delta goals (+1 / -1) to the given stage; a stage never goes below zero
 */
export function changeGoals(
  score: TeamScore,
  stage: StageType,
  period: number,
  delta: number
): TeamScore {
  const next = Math.max(0, getStageGoals(score, stage, period) + delta);
  if (stage === 'OVERTIME') return { ...score, goalsOvertime: next };
  return { ...score, goalsPerPeriod: { ...score.goalsPerPeriod, [period]: next } };
}

/**
 * Clears the goals of the given stage (used when a period is reset)
 */
export function resetStageGoals(score: TeamScore, stage: StageType, period: number): TeamScore {
  return changeGoals(score, stage, period, -getStageGoals(score, stage, period));
}

export interface ScoreRow {
  /** Goals per regular period; null for a period not played yet */
  periods: (number | null)[];
  /** Overtime goals; null when overtime is not played (yet) */
  overtime: number | null;
  total: number;
}

export interface ScoreRowOptions {
  periodCount: number;
  /** Last regular period that has been reached */
  playedPeriods: number;
  overtimePlayed: boolean;
}

/**
 * Goals per period for the summary table. Periods and overtime not reached yet are null
 * (shown as a dash), unless goals were recorded there anyway (e.g. after stepping back a period).
 */
export function getScoreRow(score: TeamScore, options: ScoreRowOptions): ScoreRow {
  const { periodCount, playedPeriods, overtimePlayed } = options;
  const overtimeGoals = score.goalsOvertime || 0;
  return {
    periods: Array.from({ length: periodCount }, (_, i) => {
      const goals = score.goalsPerPeriod?.[i + 1] || 0;
      return i + 1 > playedPeriods && goals === 0 ? null : goals;
    }),
    overtime: overtimePlayed || overtimeGoals > 0 ? overtimeGoals : null,
    total: getTeamGoals(score),
  };
}
