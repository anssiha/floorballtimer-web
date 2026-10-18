import { describe, it, expect } from 'vitest';
import {
  createDefaultGoalieSaves,
  resetGoalieSaves,
  renameGoalieInTeam,
  removeGoalieFromTeam,
  getTeamLabel,
  getTeamTotalSaves,
  getSavesTable,
} from './goalie';
import { formatSaveCount } from '../i18n/translations';

describe('resetGoalieSaves', () => {
  it('resets goalies and saves but keeps team names', () => {
    const saves = createDefaultGoalieSaves();
    saves.home.teamName = 'Salo';
    saves.home.goalies[0].savesPerPeriod = { 1: 5, 2: 3 };
    saves.home.goalies.push({ id: 'home_2', nameOrNumber: '#30', savesPerPeriod: { 3: 4 } });
    saves.home.activeGoalieId = 'home_2';

    const reset = resetGoalieSaves(saves);

    expect(reset.home).toEqual({ ...createDefaultGoalieSaves().home, teamName: 'Salo' });
    expect(reset.away).toEqual(createDefaultGoalieSaves().away);
  });
});

describe('renameGoalieInTeam', () => {
  it('renames one goalie and ignores blank names', () => {
    const team = createDefaultGoalieSaves().home;
    team.goalies.push({ id: 'home_2', nameOrNumber: '#30', savesPerPeriod: {} });
    expect(renameGoalieInTeam(team, 'home_2', '  #31 ').goalies.map((g) => g.nameOrNumber)).toEqual(['#1', '#31']);
    expect(renameGoalieInTeam(team, 'home_2', '   ')).toBe(team);
  });
});

describe('removeGoalieFromTeam', () => {
  const twoGoalies = () => {
    const team = createDefaultGoalieSaves().home;
    team.goalies.push({ id: 'home_2', nameOrNumber: '#30', savesPerPeriod: { 1: 4 } });
    return team;
  };

  it('removes the goalie with their saves and keeps the active goalie', () => {
    const team = { ...twoGoalies(), activeGoalieId: 'home_2' };
    const result = removeGoalieFromTeam(team, 'home_1');
    expect(result.goalies.map((g) => g.id)).toEqual(['home_2']);
    expect(result.activeGoalieId).toBe('home_2');
    expect(getTeamTotalSaves(result.goalies)).toBe(4);
  });

  it('hands over to the first remaining goalie when the active one is removed', () => {
    const result = removeGoalieFromTeam({ ...twoGoalies(), activeGoalieId: 'home_2' }, 'home_2');
    expect(result.activeGoalieId).toBe('home_1');
  });

  it('never removes the last goalie', () => {
    const team = createDefaultGoalieSaves().home;
    expect(removeGoalieFromTeam(team, 'home_1')).toBe(team);
  });
});

describe('getTeamLabel', () => {
  it('falls back to the translated label when the name is blank', () => {
    const saves = createDefaultGoalieSaves();
    expect(getTeamLabel(saves.home, 'home', 'fi')).toBe('Koti');
    expect(getTeamLabel(saves.away, 'away', 'en')).toBe('Away');
    saves.away.teamName = '   ';
    expect(getTeamLabel(saves.away, 'away', 'fi')).toBe('Vieras');
    saves.away.teamName = ' Turku ';
    expect(getTeamLabel(saves.away, 'away', 'fi')).toBe('Turku');
  });
});

describe('formatSaveCount', () => {
  it('uses the right Finnish and English forms', () => {
    expect(formatSaveCount('fi', 0)).toBe('0 torjuntaa');
    expect(formatSaveCount('fi', 1)).toBe('1 torjunta');
    expect(formatSaveCount('fi', 2)).toBe('2 torjuntaa');
    expect(formatSaveCount('en', 1)).toBe('1 save');
    expect(formatSaveCount('en', 3)).toBe('3 saves');
  });
});

describe('getSavesTable', () => {
  const team = () => {
    const saves = createDefaultGoalieSaves();
    saves.home.goalies[0].savesPerPeriod = { 1: 5, 2: 3 };
    saves.home.goalies.push({ id: 'home_2', nameOrNumber: '#30', savesPerPeriod: { 2: 2 }, savesOvertime: 1 });
    return saves.home;
  };

  it('lists saves per goalie and period with totals', () => {
    const table = getSavesTable(team(), { periodCount: 3, playedPeriods: 3, overtimePlayed: true });
    expect(table.rows[0]).toMatchObject({ name: '#1', periods: [5, 3, 0], overtime: 0, total: 8 });
    expect(table.rows[1]).toMatchObject({ name: '#30', periods: [0, 2, 0], overtime: 1, total: 3 });
    expect(table.totals).toEqual({ periods: [5, 5, 0], overtime: 1, total: 11 });
  });

  it('marks periods and overtime not reached yet with null', () => {
    const table = getSavesTable(team(), { periodCount: 3, playedPeriods: 2, overtimePlayed: false });
    expect(table.rows[0].periods).toEqual([5, 3, null]);
    expect(table.totals.periods).toEqual([5, 5, null]);
    // #30 has overtime saves recorded (e.g. after stepping back), so they still show
    expect(table.rows[1].overtime).toBe(1);
    expect(table.rows[0].overtime).toBeNull();
  });

  it('has a null overtime total when none was played', () => {
    const saves = createDefaultGoalieSaves();
    const table = getSavesTable(saves.away, { periodCount: 2, playedPeriods: 1, overtimePlayed: false });
    expect(table.totals).toEqual({ periods: [0, null], overtime: null, total: 0 });
  });
});
