import type { SavedTimerData, MatchConfig, MatchState, Language } from '../types/timer';
import { DEFAULT_CONFIG } from '../constants/presets';

const STORAGE_KEY = 'floorball_timer_v2';

export function loadSavedTimerData(): SavedTimerData | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed: SavedTimerData = JSON.parse(raw);
    if (parsed && parsed.version === 2) {
      if (parsed.state.status === 'RUNNING') {
        const now = Date.now();
        const elapsedAway = Math.max(0, now - (parsed.lastUpdated || now));

        // Safety cap: if away for more than 3 hours, pause timer to avoid runaway sessions from old days
        if (elapsedAway > 3 * 60 * 60 * 1000) {
          parsed.state.status = 'PAUSED';
          return parsed;
        }

        const isCountDown = parsed.config.countDirection === 'DOWN';
        let newRemainingMs = parsed.state.remainingMs;
        let isEnded = false;

        if (parsed.state.stage === 'BREAK') {
          newRemainingMs = Math.max(0, parsed.state.remainingMs - elapsedAway);
          if (newRemainingMs <= 0) {
            isEnded = true;
          }
        } else if (parsed.state.stage === 'OVERTIME') {
          if (isCountDown) {
            newRemainingMs = Math.max(0, parsed.state.remainingMs - elapsedAway);
            if (newRemainingMs <= 0) isEnded = true;
          } else {
            const regularEndMs = parsed.config.periodCount * parsed.config.periodDurationMinutes * 60 * 1000;
            const otTargetMs = regularEndMs + parsed.config.overtimeDurationMinutes * 60 * 1000;
            newRemainingMs = parsed.state.remainingMs + elapsedAway;
            if (newRemainingMs >= otTargetMs) {
              newRemainingMs = otTargetMs;
              isEnded = true;
            }
          }
        } else {
          // Regular PERIOD
          if (isCountDown) {
            newRemainingMs = Math.max(0, parsed.state.remainingMs - elapsedAway);
            if (newRemainingMs <= 0) isEnded = true;
          } else {
            const periodTargetMs = parsed.state.currentPeriod * parsed.config.periodDurationMinutes * 60 * 1000;
            newRemainingMs = parsed.state.remainingMs + elapsedAway;
            if (newRemainingMs >= periodTargetMs) {
              newRemainingMs = periodTargetMs;
              isEnded = true;
            }
          }
        }

        parsed.state.remainingMs = newRemainingMs;
        if (isEnded) {
          parsed.state.status = 'PERIOD_ENDED';
        } else {
          parsed.state.status = 'RUNNING';
        }
      }
      return parsed;
    }
  } catch (err) {
    console.error('Failed to load saved match state:', err);
  }
  return null;
}

export function saveTimerData(
  config: MatchConfig,
  state: MatchState,
  language: Language
): void {
  if (typeof window === 'undefined') return;
  try {
    const data: SavedTimerData = {
      version: 2,
      config,
      state,
      language,
      lastUpdated: Date.now(),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (err) {
    console.error('Failed to persist match state:', err);
  }
}

export function clearSavedTimerData(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (err) {
    console.error('Failed to clear saved match state:', err);
  }
}

export function getDefaultInitialState(config: MatchConfig = DEFAULT_CONFIG): MatchState {
  const durationMs = config.periodDurationMinutes * 60 * 1000;
  return {
    status: 'STOPPED',
    stage: 'PERIOD',
    currentPeriod: 1,
    remainingMs: config.countDirection === 'DOWN' ? durationMs : 0,
    totalDurationMs: durationMs,
  };
}
