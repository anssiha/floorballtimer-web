import type { SavedTimerData, MatchConfig, MatchState, Language } from '../types/timer';
import { DEFAULT_CONFIG } from '../constants/presets';
import { createDefaultGoalieSaves } from '../utils/goalie';
import { getStageClock, advanceClock } from '../utils/timerMath';

const STORAGE_KEY = 'floorball_timer_v3';
const LEGACY_STORAGE_KEY_V2 = 'floorball_timer_v2';

export function loadSavedTimerData(): SavedTimerData | null {
  if (typeof window === 'undefined') return null;
  try {
    let raw = localStorage.getItem(STORAGE_KEY);
    let isLegacyV2 = false;
    if (!raw) {
      raw = localStorage.getItem(LEGACY_STORAGE_KEY_V2);
      isLegacyV2 = true;
    }
    if (!raw) return null;
    const parsed: SavedTimerData = JSON.parse(raw);
    if (parsed && (parsed.version === 3 || parsed.version === 2)) {
      if (parsed.config && parsed.config.keepAwakeOnPause === undefined) {
        parsed.config.keepAwakeOnPause = true;
      }
      // Drop settings that no longer exist (buzzer horn, auto-start break)
      if (parsed.config) {
        const legacyConfig = parsed.config as { soundEnabled?: boolean; autoStartBreak?: boolean };
        delete legacyConfig.soundEnabled;
        delete legacyConfig.autoStartBreak;
      }
      if (parsed.config && parsed.config.restartClockEachPeriod === undefined) {
        parsed.config.restartClockEachPeriod = false;
      }
      if (parsed.config && parsed.config.trackGoalieSaves === undefined) {
        parsed.config.trackGoalieSaves = true;
      }
      if (parsed.state && !parsed.state.goalieSaves) {
        parsed.state.goalieSaves = createDefaultGoalieSaves();
      }
      // Older versions stored hard-coded Finnish default team names; clear them so the
      // UI falls back to the translated "Home"/"Away" labels.
      if (parsed.state?.goalieSaves) {
        if (parsed.state.goalieSaves.home.teamName === 'Koti') {
          parsed.state.goalieSaves.home.teamName = '';
        }
        if (parsed.state.goalieSaves.away.teamName === 'Vieras') {
          parsed.state.goalieSaves.away.teamName = '';
        }
      }
      if (isLegacyV2 || parsed.version === 2) {
        parsed.version = 3;
        parsed.config.breakEnabled = false;
        if (parsed.state.stage === 'BREAK') {
          // If was in break, gracefully convert to next period stopped
          parsed.state.stage = 'PERIOD';
          parsed.state.status = 'STOPPED';
        }
      }
      if (parsed.state.status === 'RUNNING') {
        const now = Date.now();
        const elapsedAway = Math.max(0, now - (parsed.lastUpdated || now));

        // Safety cap: if away for more than 3 hours, pause timer to avoid runaway sessions from old days
        if (elapsedAway > 3 * 60 * 60 * 1000) {
          if (parsed.state.stage === 'BREAK') {
            // A break can't be paused, and one left running for hours is long over
            parsed.state.remainingMs = 0;
            parsed.state.status = 'PERIOD_ENDED';
          } else {
            parsed.state.status = 'PAUSED';
          }
          return parsed;
        }

        const { remainingMs, isEnded } = advanceClock(parsed.config, parsed.state, elapsedAway);
        parsed.state.remainingMs = remainingMs;
        parsed.state.status = isEnded ? 'PERIOD_ENDED' : 'RUNNING';
      }
      // Breaks can no longer be paused; resume a break saved as stopped/paused by older versions
      if (
        parsed.state.stage === 'BREAK' &&
        (parsed.state.status === 'STOPPED' || parsed.state.status === 'PAUSED')
      ) {
        parsed.state.status = 'RUNNING';
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
      version: 3,
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

export function getDefaultInitialState(config: MatchConfig = DEFAULT_CONFIG): MatchState {
  const clock = getStageClock(config, 'PERIOD', 1);
  return {
    status: 'STOPPED',
    stage: 'PERIOD',
    currentPeriod: 1,
    remainingMs: clock.startMs,
    totalDurationMs: clock.durationMs,
    goalieSaves: createDefaultGoalieSaves(),
  };
}
