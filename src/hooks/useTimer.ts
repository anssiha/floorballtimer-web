import { useState, useEffect, useRef, useCallback } from 'react';
import type { MatchConfig, MatchState, Language, GoalieStats } from '../types/timer';
import { DEFAULT_CONFIG } from '../constants/presets';
import { resetGoalieSaves, renameGoalieInTeam, removeGoalieFromTeam } from '../utils/goalie';
import {
  loadSavedTimerData,
  saveTimerData,
  getDefaultInitialState,
} from '../services/storage';
import {
  triggerPeriodEndVibration,
  triggerButtonHaptic,
  setHapticsEnabled,
} from '../services/haptics';
import { requestWakeLock, releaseWakeLock } from '../services/wakeLock';
import {
  getStageClock,
  advanceClock,
  adjustClock,
  moveToStage,
  statusAfterAdjust,
  reopenFinishedMatch,
  syncClockToConfig,
} from '../utils/timerMath';

// Tick interval: 10 Hz is plenty for a MM:SS display and keeps renders/battery use low
const TICK_INTERVAL_MS = 100;

export function useTimer() {
  const [config, setConfigState] = useState<MatchConfig>(
    () => loadSavedTimerData()?.config || DEFAULT_CONFIG
  );
  const [language, setLanguageState] = useState<Language>(
    () => loadSavedTimerData()?.language || 'fi'
  );
  const [state, setState] = useState<MatchState>(
    () => loadSavedTimerData()?.state || getDefaultInitialState(DEFAULT_CONFIG)
  );

  const [isAlertAcknowledged, setIsAlertAcknowledged] = useState(true);

  const tickIntervalRef = useRef<number | null>(null);
  const lastWallClockRef = useRef<number | null>(null);

  // Persist to localStorage. While running, remainingMs changes every tick, so writes that
  // only carry a clock tick are throttled to once per second; any other change (status,
  // config, saves, ...) is written at once.
  const lastSaveRef = useRef<{
    at: number;
    config: MatchConfig;
    state: MatchState;
    language: Language;
  } | null>(null);
  const latestDataRef = useRef({ config, state, language });

  useEffect(() => {
    latestDataRef.current = { config, state, language };
    const now = Date.now();
    const last = lastSaveRef.current;
    // Ticks copy every other field from the previous state, so reference equality is enough
    const onlyClockTicked =
      last !== null &&
      last.config === config &&
      last.language === language &&
      last.state.status === state.status &&
      last.state.stage === state.stage &&
      last.state.currentPeriod === state.currentPeriod &&
      last.state.goalieSaves === state.goalieSaves;
    if (onlyClockTicked && now - last.at < 1000) return;
    saveTimerData(config, state, language);
    lastSaveRef.current = { at: now, config, state, language };
  }, [config, state, language]);

  // Flush the latest state when the page is hidden or closed, so no throttled tick is lost
  useEffect(() => {
    const flush = () => {
      const { config: c, state: s, language: l } = latestDataRef.current;
      saveTimerData(c, s, l);
      lastSaveRef.current = { at: Date.now(), config: c, state: s, language: l };
    };
    const onVisibilityChange = () => {
      if (document.visibilityState === 'hidden') flush();
    };
    document.addEventListener('visibilitychange', onVisibilityChange);
    window.addEventListener('pagehide', flush);
    return () => {
      document.removeEventListener('visibilitychange', onVisibilityChange);
      window.removeEventListener('pagehide', flush);
    };
  }, []);

  // Keep the haptics service in sync with the user's setting
  useEffect(() => {
    setHapticsEnabled(config.hapticsEnabled);
  }, [config.hapticsEnabled]);

  // Vibration & flashing alert when the clock runs out (RUNNING -> PERIOD_ENDED).
  // Kept out of the state updater so it stays pure (StrictMode may call updaters twice).
  const prevStatusRef = useRef(state.status);
  useEffect(() => {
    const prevStatus = prevStatusRef.current;
    prevStatusRef.current = state.status;
    if (prevStatus === 'RUNNING' && state.status === 'PERIOD_ENDED') {
      triggerPeriodEndVibration();
      setIsAlertAcknowledged(false);
    }
  }, [state.status]);

  // Handle Screen Wake Lock with a 15-minute safety timeout during pause
  useEffect(() => {
    let safetyTimer: ReturnType<typeof setTimeout> | null = null;

    const isPausedStage = state.status === 'PAUSED' || state.status === 'PERIOD_ENDED';
    const shouldKeepAwake =
      state.status === 'RUNNING' ||
      (isPausedStage && config.keepAwakeOnPause);

    if (shouldKeepAwake) {
      requestWakeLock();

      // If paused or period ended, auto-release after 15 minutes of inactivity to save battery
      if (isPausedStage) {
        safetyTimer = setTimeout(() => {
          releaseWakeLock();
        }, 15 * 60 * 1000);
      }
    } else {
      releaseWakeLock();
    }

    return () => {
      if (safetyTimer) {
        clearTimeout(safetyTimer);
      }
      releaseWakeLock();
    };
  }, [state.status, config.keepAwakeOnPause]);

  // Main loop using an interval with wall-clock time delta (accurate even if ticks are delayed)
  useEffect(() => {
    if (state.status !== 'RUNNING') {
      lastWallClockRef.current = null;
      return;
    }

    // Start measuring from the moment the clock starts, not from the first tick,
    // so no time is lost on each start/resume
    if (lastWallClockRef.current === null) {
      lastWallClockRef.current = Date.now();
    }

    const onTick = () => {
      const now = Date.now();
      if (lastWallClockRef.current === null) {
        lastWallClockRef.current = now;
      }
      const delta = Math.max(0, now - lastWallClockRef.current);
      lastWallClockRef.current = now;

      setState((prev) => {
        if (prev.status !== 'RUNNING') return prev;
        const { remainingMs, isEnded } = advanceClock(config, prev, delta);
        return {
          ...prev,
          remainingMs,
          status: isEnded ? 'PERIOD_ENDED' : prev.status,
        };
      });
    };

    tickIntervalRef.current = window.setInterval(onTick, TICK_INTERVAL_MS);

    return () => {
      if (tickIntervalRef.current !== null) {
        window.clearInterval(tickIntervalRef.current);
        tickIntervalRef.current = null;
      }
    };
  }, [state.status, config]);

  // Controls: Start, Pause, Resume, Toggle
  const startTimer = useCallback(() => {
    triggerButtonHaptic();
    setIsAlertAcknowledged(true);
    setState((prev) => {
      if (prev.status === 'RUNNING') return prev;
      return { ...prev, status: 'RUNNING' };
    });
  }, []);

  const pauseTimer = useCallback(() => {
    triggerButtonHaptic();
    // Count the time since the last tick too, so pausing doesn't drop up to one tick
    const elapsedSinceTick =
      lastWallClockRef.current === null ? 0 : Math.max(0, Date.now() - lastWallClockRef.current);
    setState((prev) => {
      if (prev.status !== 'RUNNING') return prev;
      const { remainingMs, isEnded } = advanceClock(config, prev, elapsedSinceTick);
      return { ...prev, remainingMs, status: isEnded ? 'PERIOD_ENDED' : 'PAUSED' };
    });
  }, [config]);

  const toggleTimer = useCallback(() => {
    // The break clock can't be paused; it is ended with "Next period" instead
    if (state.stage === 'BREAK') return;
    // An ended period or finished match is moved on with the on-screen buttons, never by
    // toggling (that would restart a clock that has already run out)
    if (state.status === 'PERIOD_ENDED' || state.status === 'MATCH_FINISHED') return;
    if (state.status === 'RUNNING') {
      pauseTimer();
    } else {
      startTimer();
    }
  }, [state.status, state.stage, pauseTimer, startTimer]);

  // Reset current period to its start
  const resetPeriod = useCallback(() => {
    triggerButtonHaptic();
    setIsAlertAcknowledged(true);
    setState((prev) => {
      const resetMs = getStageClock(config, prev.stage, prev.currentPeriod).startMs;

      // Reset saves of the stage being reset. A break has no saves of its own
      // (currentPeriod still points at the period that just ended, so leave it alone),
      // and overtime only clears overtime saves, not the last regular period's.
      const resetGoalie = (g: GoalieStats): GoalieStats => {
        if (prev.stage === 'OVERTIME') return { ...g, savesOvertime: 0 };
        return { ...g, savesPerPeriod: { ...g.savesPerPeriod, [prev.currentPeriod]: 0 } };
      };

      return {
        ...prev,
        // Restarting a break restarts its countdown; a period waits for Start
        status: prev.stage === 'BREAK' ? 'RUNNING' : 'STOPPED',
        remainingMs: resetMs,
        goalieSaves:
          prev.goalieSaves && prev.stage !== 'BREAK'
            ? {
                home: { ...prev.goalieSaves.home, goalies: prev.goalieSaves.home.goalies.map(resetGoalie) },
                away: { ...prev.goalieSaves.away, goalies: prev.goalieSaves.away.goalies.map(resetGoalie) },
              }
            : prev.goalieSaves,
      };
    });
  }, [config]);

  // Reset entire match
  // Reset entire match: clock back to the start of period 1, goalies and saves reset.
  // Team names are kept for the next match.
  const resetMatch = useCallback(() => {
    triggerButtonHaptic();
    setIsAlertAcknowledged(true);
    setState((prev) => ({
      ...getDefaultInitialState(config),
      goalieSaves: resetGoalieSaves(prev.goalieSaves),
    }));
  }, [config]);

  // Stepper buttons next to the timer (+/-1 s, +/-1 min)
  const adjustSeconds = useCallback(
    (deltaSeconds: number) => {
      triggerButtonHaptic();
      setIsAlertAcknowledged(true);
      setState((prev) => {
        const remainingMs = adjustClock(config, prev, deltaSeconds);
        return { ...prev, remainingMs, status: statusAfterAdjust(prev, remainingMs) };
      });
    },
    [config]
  );

  const adjustMinutes = useCallback(
    (deltaMinutes: number) => adjustSeconds(deltaMinutes * 60),
    [adjustSeconds]
  );

  // Period Progression
  const proceedToNextStage = useCallback((skipBreak = false) => {
    triggerButtonHaptic();
    setIsAlertAcknowledged(true);

    setState((prev) => {
      // 1. If currently in a BREAK, move to next period
      if (prev.stage === 'BREAK') {
        return moveToStage(config, prev, 'PERIOD', prev.currentPeriod + 1, 'start', 'STOPPED');
      }

      // 2. If currently in a regular PERIOD
      if (prev.stage === 'PERIOD') {
        // Is this the last regular period?
        if (prev.currentPeriod >= config.periodCount) {
          if (config.overtimeEnabled) {
            // Overtime ("Jatkoerä")
            return moveToStage(config, prev, 'OVERTIME', prev.currentPeriod, 'start', 'STOPPED');
          }
          // Match Finished
          return {
            ...prev,
            status: 'MATCH_FINISHED',
          };
        }

        // Need break before next period? Starting the break also starts its countdown.
        if (!skipBreak && config.breakEnabled && config.breakDurationMinutes > 0) {
          return moveToStage(config, prev, 'BREAK', prev.currentPeriod, 'start', 'RUNNING');
        }
        // No break configured, disabled, or explicitly skipped: straight to next period
        return moveToStage(config, prev, 'PERIOD', prev.currentPeriod + 1, 'start', 'STOPPED');
      }

      // 3. If in OVERTIME and ended
      if (prev.stage === 'OVERTIME') {
        return {
          ...prev,
          status: 'MATCH_FINISHED',
        };
      }

      return prev;
    });
  }, [config]);

  // Revert to previous period (e.g. if period was ended or next period was started by accident)
  const revertToPreviousStage = useCallback(() => {
    triggerButtonHaptic();
    setIsAlertAcknowledged(true);

    setState((prev) => {
      // 0. Match finished by mistake: reopen it where the clock was
      if (prev.status === 'MATCH_FINISHED') {
        return reopenFinishedMatch(config, prev);
      }

      // 1. If currently in OVERTIME, revert to last regular period
      if (prev.stage === 'OVERTIME') {
        return moveToStage(config, prev, 'PERIOD', config.periodCount, 'end', 'PAUSED');
      }

      // 2. If currently in a BREAK, revert to the period that just ended
      if (prev.stage === 'BREAK') {
        return moveToStage(config, prev, 'PERIOD', prev.currentPeriod, 'end', 'PAUSED');
      }

      // 3. If currently in a regular PERIOD > 1, revert to previous period
      if (prev.stage === 'PERIOD' && prev.currentPeriod > 1) {
        return moveToStage(config, prev, 'PERIOD', prev.currentPeriod - 1, 'end', 'PAUSED');
      }

      return prev;
    });
  }, [config]);

  // Update configuration. The clock is moved in the same update, so no render (or tick)
  // ever sees the new clock layout with the old time.
  const updateConfig = useCallback(
    (newConfig: Partial<MatchConfig>) => {
      const next = { ...config, ...newConfig };
      setConfigState(next);
      setState((s) => syncClockToConfig(config, next, s));
    },
    [config]
  );

  const setLanguage = useCallback((lang: Language) => {
    triggerButtonHaptic();
    setLanguageState(lang);
  }, []);

  // Goalie save actions
  const addGoalieSave = useCallback((team: 'home' | 'away') => {
    triggerButtonHaptic();
    setState((prev) => {
      if (!prev.goalieSaves) return prev;
      const currentTeamData = prev.goalieSaves[team];
      const activeId = currentTeamData.activeGoalieId;
      const period = prev.currentPeriod;
      const isOvertime = prev.stage === 'OVERTIME';

      const updatedGoalies = currentTeamData.goalies.map((goalie) => {
        if (goalie.id !== activeId) return goalie;

        if (isOvertime) {
          return {
            ...goalie,
            savesOvertime: (goalie.savesOvertime || 0) + 1,
          };
        }

        const currentPeriodSaves = goalie.savesPerPeriod?.[period] || 0;
        return {
          ...goalie,
          savesPerPeriod: {
            ...goalie.savesPerPeriod,
            [period]: currentPeriodSaves + 1,
          },
        };
      });

      return {
        ...prev,
        goalieSaves: {
          ...prev.goalieSaves,
          [team]: {
            ...currentTeamData,
            goalies: updatedGoalies,
          },
        },
      };
    });
  }, []);

  const removeGoalieSave = useCallback((team: 'home' | 'away') => {
    triggerButtonHaptic();
    setState((prev) => {
      if (!prev.goalieSaves) return prev;
      const currentTeamData = prev.goalieSaves[team];
      const activeId = currentTeamData.activeGoalieId;
      const period = prev.currentPeriod;
      const isOvertime = prev.stage === 'OVERTIME';

      const updatedGoalies = currentTeamData.goalies.map((goalie) => {
        if (goalie.id !== activeId) return goalie;

        if (isOvertime) {
          const currentOt = goalie.savesOvertime || 0;
          return {
            ...goalie,
            savesOvertime: Math.max(0, currentOt - 1),
          };
        }

        const currentPeriodSaves = goalie.savesPerPeriod?.[period] || 0;
        return {
          ...goalie,
          savesPerPeriod: {
            ...goalie.savesPerPeriod,
            [period]: Math.max(0, currentPeriodSaves - 1),
          },
        };
      });

      return {
        ...prev,
        goalieSaves: {
          ...prev.goalieSaves,
          [team]: {
            ...currentTeamData,
            goalies: updatedGoalies,
          },
        },
      };
    });
  }, []);

  const switchGoalie = useCallback((team: 'home' | 'away', goalieId: string) => {
    triggerButtonHaptic();
    setState((prev) => {
      if (!prev.goalieSaves) return prev;
      return {
        ...prev,
        goalieSaves: {
          ...prev.goalieSaves,
          [team]: {
            ...prev.goalieSaves[team],
            activeGoalieId: goalieId,
          },
        },
      };
    });
  }, []);

  const addGoalie = useCallback((team: 'home' | 'away', nameOrNumber: string) => {
    triggerButtonHaptic();
    const newId = `${team}_${Date.now()}`;
    const newGoalie: GoalieStats = {
      id: newId,
      nameOrNumber: nameOrNumber.trim() || `#${newId.slice(-2)}`,
      savesPerPeriod: { 1: 0, 2: 0, 3: 0 },
      savesOvertime: 0,
    };

    setState((prev) => {
      if (!prev.goalieSaves) return prev;
      return {
        ...prev,
        goalieSaves: {
          ...prev.goalieSaves,
          [team]: {
            ...prev.goalieSaves[team],
            activeGoalieId: newId,
            goalies: [...prev.goalieSaves[team].goalies, newGoalie],
          },
        },
      };
    });
  }, []);

  const renameGoalie = useCallback((team: 'home' | 'away', goalieId: string, name: string) => {
    triggerButtonHaptic();
    setState((prev) => ({
      ...prev,
      goalieSaves: {
        ...prev.goalieSaves,
        [team]: renameGoalieInTeam(prev.goalieSaves[team], goalieId, name),
      },
    }));
  }, []);

  const removeGoalie = useCallback((team: 'home' | 'away', goalieId: string) => {
    triggerButtonHaptic();
    setState((prev) => ({
      ...prev,
      goalieSaves: {
        ...prev.goalieSaves,
        [team]: removeGoalieFromTeam(prev.goalieSaves[team], goalieId),
      },
    }));
  }, []);

  // Raw value is stored while typing; the display falls back to "Home"/"Away" when empty
  const updateTeamName = useCallback((team: 'home' | 'away', name: string) => {
    setState((prev) => ({
      ...prev,
      goalieSaves: {
        ...prev.goalieSaves,
        [team]: { ...prev.goalieSaves[team], teamName: name },
      },
    }));
  }, []);

  return {
    state,
    config,
    language,
    isAlertAcknowledged,
    startTimer,
    pauseTimer,
    toggleTimer,
    resetPeriod,
    resetMatch,
    adjustSeconds,
    adjustMinutes,
    proceedToNextStage,
    revertToPreviousStage,
    updateConfig,
    setLanguage,
    addGoalieSave,
    removeGoalieSave,
    switchGoalie,
    addGoalie,
    renameGoalie,
    removeGoalie,
    updateTeamName,
  };
}
