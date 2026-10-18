import type { GoalieStats, GoalieSavesState, TeamGoalieData, Language } from '../types/timer';
import { t } from '../i18n/translations';

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
      teamName: '',
      activeGoalieId: 'home_1',
      goalies: [createDefaultGoalie('home_1', '#1')],
    },
    away: {
      teamName: '',
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

/**
 * Goalies and saves reset for a new match: each team is back to a single default goalie
 * with no saves. Team names are kept, since the same teams often play on.
 */
export function resetGoalieSaves(saves: GoalieSavesState): GoalieSavesState {
  const defaults = createDefaultGoalieSaves();
  return {
    home: { ...defaults.home, teamName: saves.home.teamName },
    away: { ...defaults.away, teamName: saves.away.teamName },
  };
}

/**
 * Renames a goalie (blank names are ignored so a goalie is never left unlabeled).
 */
export function renameGoalieInTeam(
  team: TeamGoalieData,
  goalieId: string,
  nameOrNumber: string
): TeamGoalieData {
  const name = nameOrNumber.trim();
  if (!name) return team;
  return {
    ...team,
    goalies: team.goalies.map((g) => (g.id === goalieId ? { ...g, nameOrNumber: name } : g)),
  };
}

/**
 * Removes a goalie together with their saves. A team always keeps at least one goalie;
 * if the active goalie is removed, the first remaining one takes over.
 */
export function removeGoalieFromTeam(team: TeamGoalieData, goalieId: string): TeamGoalieData {
  if (team.goalies.length <= 1 || !team.goalies.some((g) => g.id === goalieId)) return team;
  const goalies = team.goalies.filter((g) => g.id !== goalieId);
  return {
    ...team,
    goalies,
    activeGoalieId: team.activeGoalieId === goalieId ? goalies[0].id : team.activeGoalieId,
  };
}

/**
 * Display name of a team: the custom name, or the translated "Home"/"Away"
 */
export function getTeamLabel(
  teamData: TeamGoalieData,
  team: 'home' | 'away',
  language: Language
): string {
  return teamData.teamName.trim() || t(language, team);
}

export interface SavesTableRow {
  id: string;
  name: string;
  /** Saves per regular period; null for a period not played yet */
  periods: (number | null)[];
  /** Overtime saves; null when overtime is not played (yet) */
  overtime: number | null;
  total: number;
}

export interface SavesTable {
  rows: SavesTableRow[];
  totals: Omit<SavesTableRow, 'id' | 'name'>;
}

export interface SavesTableOptions {
  periodCount: number;
  /** Last regular period that has been reached */
  playedPeriods: number;
  overtimePlayed: boolean;
}

/**
 * Saves per goalie and period for the summary table, with a totals row.
 * Periods and overtime not reached yet are null (shown as a dash), unless saves were
 * recorded there anyway (e.g. after stepping back a period).
 */
export function getSavesTable(team: TeamGoalieData, options: SavesTableOptions): SavesTable {
  const { periodCount, playedPeriods, overtimePlayed } = options;

  const rows: SavesTableRow[] = team.goalies.map((goalie) => ({
    id: goalie.id,
    name: goalie.nameOrNumber,
    periods: Array.from({ length: periodCount }, (_, i) => {
      const saves = goalie.savesPerPeriod?.[i + 1] || 0;
      return i + 1 > playedPeriods && saves === 0 ? null : saves;
    }),
    overtime: overtimePlayed || (goalie.savesOvertime || 0) > 0 ? goalie.savesOvertime || 0 : null,
    total: getGoalieTotalSaves(goalie),
  }));

  const sum = (values: (number | null)[]) => values.reduce<number>((a, v) => a + (v || 0), 0);
  const allNull = (values: (number | null)[]) => values.every((v) => v === null);

  return {
    rows,
    totals: {
      periods: Array.from({ length: periodCount }, (_, i) => {
        const column = rows.map((r) => r.periods[i]);
        return allNull(column) ? null : sum(column);
      }),
      overtime: allNull(rows.map((r) => r.overtime)) ? null : sum(rows.map((r) => r.overtime)),
      total: sum(rows.map((r) => r.total)),
    },
  };
}
