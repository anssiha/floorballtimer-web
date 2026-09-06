import type { GoalieStats, GoalieSavesState } from '../types/timer';

export function createDefaultGoalie(id: string, nameOrNumber: string): GoalieStats {
  return {
    id,
    nameOrNumber,
    savesPerPeriod: { 1: 0, 2: 0, 3: 0 },
    savesOvertime: 0,
  };
}

export function createDefaultGoalieSaves(): GoalieSavesState {
  return {
    home: {
      teamName: 'Koti',
      activeGoalieId: 'home_1',
      goalies: [createDefaultGoalie('home_1', '#1')],
    },
    away: {
      teamName: 'Vieras',
      activeGoalieId: 'away_1',
      goalies: [createDefaultGoalie('away_1', '#1')],
    },
  };
}

/**
 * Calculates the total saves for a single goalie across all periods and overtime
 */
export function getGoalieTotalSaves(goalie: GoalieStats): number {
  const periodTotal = Object.values(goalie.savesPerPeriod || {}).reduce(
    (sum, count) => sum + (count || 0),
    0
  );
  return periodTotal + (goalie.savesOvertime || 0);
}

/**
 * Calculates total saves for a team in a specific period across all goalies who played in that period
 */
export function getTeamPeriodSaves(goalies: GoalieStats[], period: number): number {
  return goalies.reduce((sum, g) => sum + (g.savesPerPeriod?.[period] || 0), 0);
}

/**
 * Calculates grand total saves for a team across all periods and all goalies
 */
export function getTeamTotalSaves(goalies: GoalieStats[]): number {
  return goalies.reduce((sum, g) => sum + getGoalieTotalSaves(g), 0);
}
