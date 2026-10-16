import { describe, it, expect } from 'vitest';
import { createDefaultGoalieSaves, clearGoalieSaves, getTeamLabel, getTeamTotalSaves } from './goalie';
import { formatSaveCount } from '../i18n/translations';

describe('clearGoalieSaves', () => {
  it('zeroes all saves but keeps team names and goalies', () => {
    const saves = createDefaultGoalieSaves();
    saves.home.teamName = 'Salo';
    saves.home.goalies[0].savesPerPeriod = { 1: 5, 2: 3 };
    saves.home.goalies[0].savesOvertime = 2;
    saves.home.goalies.push({ id: 'home_2', nameOrNumber: '#30', savesPerPeriod: { 3: 4 } });

    const cleared = clearGoalieSaves(saves);

    expect(getTeamTotalSaves(cleared.home.goalies)).toBe(0);
    expect(cleared.home.teamName).toBe('Salo');
    expect(cleared.home.goalies.map((g) => g.nameOrNumber)).toEqual(['#1', '#30']);
    expect(cleared.home.activeGoalieId).toBe('home_1');
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
