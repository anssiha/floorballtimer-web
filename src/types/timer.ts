export type TimerStatus = 'STOPPED' | 'RUNNING' | 'PAUSED' | 'PERIOD_ENDED' | 'MATCH_FINISHED';

export type StageType = 'PERIOD' | 'BREAK' | 'OVERTIME';

export type Language = 'fi' | 'en';

export type CountDirection = 'DOWN' | 'UP';

export interface MatchConfig {
  periodCount: 1 | 2 | 3;
  periodDurationMinutes: number; // e.g. 15, 20
  breakEnabled: boolean;
  breakDurationMinutes: number; // e.g. 12
  overtimeEnabled: boolean;
  overtimeDurationMinutes: number; // e.g. 5
  countDirection: CountDirection;
  soundEnabled: boolean;
  hapticsEnabled: boolean;
  autoStartBreak: boolean;
}

export interface MatchState {
  status: TimerStatus;
  stage: StageType;
  currentPeriod: number; // 1, 2, 3
  remainingMs: number;
  totalDurationMs: number;
}

export interface SavedTimerData {
  version: number;
  config: MatchConfig;
  state: MatchState;
  language: Language;
  lastUpdated: number;
}
