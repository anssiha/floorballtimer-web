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
      // If timer was running when page unloaded, restore it paused at the exact remaining time
      if (parsed.state.status === 'RUNNING') {
        parsed.state.status = 'PAUSED';
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
