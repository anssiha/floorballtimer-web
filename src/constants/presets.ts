import type { MatchConfig } from '../types/timer';

export const PERIOD_DURATION_PRESETS = [10, 15, 20]; // in minutes
export const BREAK_DURATION_PRESETS = [5, 10, 12, 15]; // in minutes
export const OVERTIME_DURATION_PRESETS = [5, 10, 20]; // in minutes

export const DEFAULT_CONFIG: MatchConfig = {
  periodCount: 3,
  periodDurationMinutes: 20,
  breakEnabled: false,
  breakDurationMinutes: 12,
  overtimeEnabled: false,
  overtimeDurationMinutes: 20,
  countDirection: 'UP',
  soundEnabled: true,
  hapticsEnabled: true,
  autoStartBreak: false,
  keepAwakeOnPause: true,
  trackGoalieSaves: true,
};
