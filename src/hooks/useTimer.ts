import { useState, useEffect, useRef, useCallback } from 'react';
import type { MatchConfig, MatchState, Language, StageType, GoalieStats } from '../types/timer';
import { DEFAULT_CONFIG } from '../constants/presets';
import {
  loadSavedTimerData,
  saveTimerData,
  getDefaultInitialState,
} from '../services/storage';
import { playArenaHorn } from '../services/sound';
import { triggerPeriodEndVibration, triggerButtonHaptic } from '../services/haptics';
import { requestWakeLock, releaseWakeLock } from '../services/wakeLock';

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

  // References for animation frame and timing
  const animFrameRef = useRef<number | null>(null);
  const lastWallClockRef = useRef<number | null>(null);

  // Sync state & config changes to localStorage
  useEffect(() => {
    saveTimerData(config, state, language);
  }, [config, state, language]);

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

  // Main loop using requestAnimationFrame with wall-clock time delta
  useEffect(() => {
    if (state.status !== 'RUNNING') {
      if (animFrameRef.current !== null) {
        cancelAnimationFrame(animFrameRef.current);
        animFrameRef.current = null;
      }
      lastWallClockRef.current = null;
      return;
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

        const isCountDown = config.countDirection === 'DOWN';
        let newRemainingMs = prev.remainingMs;
        let isEnded = false;

        if (prev.stage === 'BREAK') {
          // Break is always a countdown from breakDuration to 0
          newRemainingMs = prev.remainingMs - delta;
          if (newRemainingMs <= 0) {
            newRemainingMs = 0;
            isEnded = true;
          }
        } else if (prev.stage === 'OVERTIME') {
          const regularEndMs = config.periodCount * config.periodDurationMinutes * 60 * 1000;
          const otDurationMs = config.overtimeDurationMinutes * 60 * 1000;

          if (isCountDown) {
            newRemainingMs = prev.remainingMs - delta;
            if (newRemainingMs <= 0) {
              newRemainingMs = 0;
              isEnded = true;
            }
          } else {
            // Count UP: e.g. from 60:00 to 80:00
            const otTargetMs = regularEndMs + otDurationMs;
            newRemainingMs = prev.remainingMs + delta;
            if (newRemainingMs >= otTargetMs) {
              newRemainingMs = otTargetMs;
              isEnded = true;
            }
          }
        } else {
          // Regular PERIOD:
          if (isCountDown) {
            newRemainingMs = prev.remainingMs - delta;
            if (newRemainingMs <= 0) {
              newRemainingMs = 0;
              isEnded = true;
            }
          } else {
            // Count UP continuously across periods:
            // Period 1: 00:00 -> 20:00
            // Period 2: 20:00 -> 40:00
            // Period 3: 40:00 -> 60:00
            const periodTargetMs = prev.currentPeriod * config.periodDurationMinutes * 60 * 1000;
            newRemainingMs = prev.remainingMs + delta;
            if (newRemainingMs >= periodTargetMs) {
              newRemainingMs = periodTargetMs;
              isEnded = true;
            }
          }
        }

        if (isEnded) {
          // Trigger horn buzzer & vibration
          if (config.soundEnabled) {
            playArenaHorn();
          }
          if (config.hapticsEnabled) {
            triggerPeriodEndVibration();
          }

          setIsAlertAcknowledged(false);

          return {
            ...prev,
            status: 'PERIOD_ENDED',
            remainingMs: newRemainingMs,
          };
        }

        return {
          ...prev,
          remainingMs: newRemainingMs,
        };
      });

      animFrameRef.current = requestAnimationFrame(onTick);
    };

    animFrameRef.current = requestAnimationFrame(onTick);

    return () => {
      if (animFrameRef.current !== null) {
        cancelAnimationFrame(animFrameRef.current);
        animFrameRef.current = null;
      }
    };
  }, [
    state.status,
    config.countDirection,
    config.soundEnabled,
    config.hapticsEnabled,
    config.periodDurationMinutes,
    config.periodCount,
    config.overtimeDurationMinutes,
  ]);

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
    setState((prev) => {
      if (prev.status !== 'RUNNING') return prev;
      return { ...prev, status: 'PAUSED' };
    });
  }, []);

  const toggleTimer = useCallback(() => {
    if (state.status === 'RUNNING') {
      pauseTimer();
    } else {
      startTimer();
    }
  }, [state.status, pauseTimer, startTimer]);

  // Reset current period to its start
  const resetPeriod = useCallback(() => {
    triggerButtonHaptic();
    setIsAlertAcknowledged(true);
    setState((prev) => {
      let resetMs = 0;
      if (prev.stage === 'BREAK') {
        resetMs = config.breakDurationMinutes * 60 * 1000;
      } else if (prev.stage === 'OVERTIME') {
        if (config.countDirection === 'UP') {
          resetMs = config.periodCount * config.periodDurationMinutes * 60 * 1000;
        } else {
          resetMs = config.overtimeDurationMinutes * 60 * 1000;
        }
      } else {
        // Regular PERIOD
        if (config.countDirection === 'UP') {
          // e.g. Period 1 -> 00:00, Period 2 -> 20:00, Period 3 -> 40:00
          resetMs = (prev.currentPeriod - 1) * config.periodDurationMinutes * 60 * 1000;
        } else {
          resetMs = config.periodDurationMinutes * 60 * 1000;
        }
      }

      // Reset saves for this period if any
      const newHomeGoalies = prev.goalieSaves?.home?.goalies?.map((g) => ({
        ...g,
        savesPerPeriod: { ...g.savesPerPeriod, [prev.currentPeriod]: 0 },
        savesOvertime: prev.stage === 'OVERTIME' ? 0 : (g.savesOvertime || 0),
      })) || [];

      const newAwayGoalies = prev.goalieSaves?.away?.goalies?.map((g) => ({
        ...g,
        savesPerPeriod: { ...g.savesPerPeriod, [prev.currentPeriod]: 0 },
        savesOvertime: prev.stage === 'OVERTIME' ? 0 : (g.savesOvertime || 0),
      })) || [];

      return {
        ...prev,
        status: 'STOPPED',
        remainingMs: resetMs,
        goalieSaves: prev.goalieSaves
          ? {
              home: { ...prev.goalieSaves.home, goalies: newHomeGoalies },
              away: { ...prev.goalieSaves.away, goalies: newAwayGoalies },
            }
          : prev.goalieSaves,
      };
    });
  }, [
    config.countDirection,
    config.breakDurationMinutes,
    config.periodDurationMinutes,
    config.periodCount,
    config.overtimeDurationMinutes,
  ]);

  // Reset entire match
  const resetMatch = useCallback(() => {
    triggerButtonHaptic();
    setIsAlertAcknowledged(true);
    setState(getDefaultInitialState(config));
  }, [config]);

  // Manual time adjustment (in ms)
  const adjustRemainingMs = useCallback((newMs: number) => {
    triggerButtonHaptic();
    setState((prev) => {
      const clampedMs = Math.max(0, Math.min(newMs, 99 * 60 * 1000 + 59 * 1000));
      return {
        ...prev,
        remainingMs: clampedMs,
        status: prev.status === 'PERIOD_ENDED' ? 'PAUSED' : prev.status,
      };
    });
  }, []);

  // Helper to compute min & max allowable seconds for the current period/stage
  const getStageBounds = useCallback(
    (stage: StageType, currentPeriod: number): { minSec: number; maxSec: number } => {
      const isCountDown = config.countDirection === 'DOWN';
      const periodLenSec = config.periodDurationMinutes * 60;

      if (stage === 'BREAK') {
        const breakLenSec = config.breakDurationMinutes * 60;
        return { minSec: 0, maxSec: breakLenSec };
      }

      if (stage === 'OVERTIME') {
        const otLenSec = config.overtimeDurationMinutes * 60;
        if (isCountDown) {
          return { minSec: 0, maxSec: otLenSec };
        } else {
          const startSec = config.periodCount * periodLenSec;
          return { minSec: startSec, maxSec: startSec + otLenSec };
        }
      }

      // Regular PERIOD:
      if (isCountDown) {
        return { minSec: 0, maxSec: periodLenSec };
      } else {
        // Count UP:
        // Period 1: 00:00 -> 20:00 (clamps [00:00, 20:00])
        // Period 2: 20:00 -> 40:00 (clamps [20:00, 40:00])
        // Period 3: 40:00 -> 60:00 (clamps [40:00, 60:00])
        const minSec = (currentPeriod - 1) * periodLenSec;
        const maxSec = currentPeriod * periodLenSec;
        return { minSec, maxSec };
      }
    },
    [
      config.countDirection,
      config.periodDurationMinutes,
      config.breakDurationMinutes,
      config.overtimeDurationMinutes,
      config.periodCount,
    ]
  );

  // Quick seconds adjustment (e.g. +1s or -1s stepper buttons next to timer)
  const adjustSeconds = useCallback(
    (deltaSeconds: number) => {
      triggerButtonHaptic();
      setIsAlertAcknowledged(true);
      setState((prev) => {
        const isCountDown = config.countDirection === 'DOWN';
        // Snap to current displayed whole second
        const currentSec = isCountDown
          ? Math.ceil(prev.remainingMs / 1000)
          : Math.floor(prev.remainingMs / 1000);

        const { minSec, maxSec } = getStageBounds(prev.stage, prev.currentPeriod);
        const newSec = Math.max(minSec, Math.min(maxSec, currentSec + deltaSeconds));
        const newMs = newSec * 1000;

        return {
          ...prev,
          remainingMs: newMs,
          status: prev.status === 'PERIOD_ENDED' ? 'PAUSED' : prev.status,
        };
      });
    },
    [config.countDirection, getStageBounds]
  );

  // Quick minutes adjustment (e.g. +1m or -1m stepper buttons)
  const adjustMinutes = useCallback(
    (deltaMinutes: number) => {
      triggerButtonHaptic();
      setIsAlertAcknowledged(true);
      setState((prev) => {
        const isCountDown = config.countDirection === 'DOWN';
        const currentSec = isCountDown
          ? Math.ceil(prev.remainingMs / 1000)
          : Math.floor(prev.remainingMs / 1000);

        const { minSec, maxSec } = getStageBounds(prev.stage, prev.currentPeriod);
        const newSec = Math.max(minSec, Math.min(maxSec, currentSec + deltaMinutes * 60));
        const newMs = newSec * 1000;

        return {
          ...prev,
          remainingMs: newMs,
          status: prev.status === 'PERIOD_ENDED' ? 'PAUSED' : prev.status,
        };
      });
    },
    [config.countDirection, getStageBounds]
  );

  // Period Progression
  const proceedToNextStage = useCallback((skipBreak = false) => {
    triggerButtonHaptic();
    setIsAlertAcknowledged(true);

    setState((prev) => {
      // 1. If currently in a BREAK, move to next period
      if (prev.stage === 'BREAK') {
        const nextPeriod = prev.currentPeriod + 1;
        const durationMs = config.periodDurationMinutes * 60 * 1000;
        const startMs =
          config.countDirection === 'UP'
            ? (nextPeriod - 1) * durationMs
            : durationMs;

        return {
          ...prev,
          status: 'STOPPED',
          stage: 'PERIOD',
          currentPeriod: nextPeriod,
          totalDurationMs: durationMs,
          remainingMs: startMs,
        };
      }

      // 2. If currently in a regular PERIOD
      if (prev.stage === 'PERIOD') {
        // Is this the last regular period?
        if (prev.currentPeriod >= config.periodCount) {
          if (config.overtimeEnabled) {
            // Overtime ("Jatkoerä")
            const otDurationMs = config.overtimeDurationMinutes * 60 * 1000;
            const startMs =
              config.countDirection === 'UP'
                ? config.periodCount * config.periodDurationMinutes * 60 * 1000
                : otDurationMs;

            return {
              ...prev,
              status: 'STOPPED',
              stage: 'OVERTIME',
              currentPeriod: prev.currentPeriod,
              totalDurationMs: otDurationMs,
              remainingMs: startMs,
            };
          }
          // Match Finished
          return {
            ...prev,
            status: 'MATCH_FINISHED',
          };
        }

        // Need break before next period?
        if (!skipBreak && config.breakEnabled && config.breakDurationMinutes > 0) {
          const breakDurationMs = config.breakDurationMinutes * 60 * 1000;
          return {
            ...prev,
            status: config.autoStartBreak ? 'RUNNING' : 'STOPPED',
            stage: 'BREAK',
            currentPeriod: prev.currentPeriod,
            totalDurationMs: breakDurationMs,
            remainingMs: breakDurationMs,
          };
        } else {
          // No break configured, disabled, or explicitly skipped: straight to next period
          const nextPeriod = prev.currentPeriod + 1;
          const durationMs = config.periodDurationMinutes * 60 * 1000;
          const startMs =
            config.countDirection === 'UP'
              ? (nextPeriod - 1) * durationMs
              : durationMs;

          return {
            ...prev,
            status: 'STOPPED',
            stage: 'PERIOD',
            currentPeriod: nextPeriod,
            totalDurationMs: durationMs,
            remainingMs: startMs,
          };
        }
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

  // Jump to specific period
  const jumpToStage = useCallback(
    (stage: StageType, periodNumber: number) => {
      triggerButtonHaptic();
      setIsAlertAcknowledged(true);
      let durationMinutes = config.periodDurationMinutes;
      let startMs = 0;

      if (stage === 'BREAK') {
        durationMinutes = config.breakDurationMinutes;
        startMs = durationMinutes * 60 * 1000;
      } else if (stage === 'OVERTIME') {
        durationMinutes = config.overtimeDurationMinutes;
        startMs =
          config.countDirection === 'UP'
            ? config.periodCount * config.periodDurationMinutes * 60 * 1000
            : durationMinutes * 60 * 1000;
      } else {
        startMs =
          config.countDirection === 'UP'
            ? (periodNumber - 1) * config.periodDurationMinutes * 60 * 1000
            : durationMinutes * 60 * 1000;
      }

      const durationMs = durationMinutes * 60 * 1000;
      setState((prev) => ({
        ...prev,
        status: 'STOPPED',
        stage,
        currentPeriod: periodNumber,
        totalDurationMs: durationMs,
        remainingMs: startMs,
      }));
    },
    [config]
  );

  // Revert to previous period (e.g. if period was ended or next period was started by accident)
  const revertToPreviousStage = useCallback(() => {
    triggerButtonHaptic();
    setIsAlertAcknowledged(true);

    setState((prev) => {
      // 1. If currently in OVERTIME, revert to last regular period
      if (prev.stage === 'OVERTIME') {
        const lastPeriod = config.periodCount;
        const durMs = config.periodDurationMinutes * 60 * 1000;
        const endMs =
          config.countDirection === 'UP'
            ? lastPeriod * durMs
            : 0;

        return {
          ...prev,
          status: 'PAUSED',
          stage: 'PERIOD',
          currentPeriod: lastPeriod,
          totalDurationMs: durMs,
          remainingMs: endMs,
        };
      }

      // 2. If currently in a BREAK, revert to the period that just ended
      if (prev.stage === 'BREAK') {
        const durMs = config.periodDurationMinutes * 60 * 1000;
        const endMs =
          config.countDirection === 'UP'
            ? prev.currentPeriod * durMs
            : 0;

        return {
          ...prev,
          status: 'PAUSED',
          stage: 'PERIOD',
          currentPeriod: prev.currentPeriod,
          totalDurationMs: durMs,
          remainingMs: endMs,
        };
      }

      // 3. If currently in a regular PERIOD > 1, revert to previous period
      if (prev.stage === 'PERIOD' && prev.currentPeriod > 1) {
        const prevPeriod = prev.currentPeriod - 1;
        const durMs = config.periodDurationMinutes * 60 * 1000;
        const endMs =
          config.countDirection === 'UP'
            ? prevPeriod * durMs
            : 0;

        return {
          ...prev,
          status: 'PAUSED',
          stage: 'PERIOD',
          currentPeriod: prevPeriod,
          totalDurationMs: durMs,
          remainingMs: endMs,
        };
      }

      return prev;
    });
  }, [config]);

  // Update configuration
  const updateConfig = useCallback(
    (newConfig: Partial<MatchConfig>) => {
      setConfigState((prev) => {
        const merged = { ...prev, ...newConfig };
        // If period length or count direction changed and timer is STOPPED at period 1, update active start/target
        const durationChanged =
          newConfig.periodDurationMinutes !== undefined &&
          newConfig.periodDurationMinutes !== prev.periodDurationMinutes;
        const directionChanged =
          newConfig.countDirection !== undefined &&
          newConfig.countDirection !== prev.countDirection;

        if (
          (durationChanged || directionChanged) &&
          state.status === 'STOPPED' &&
          state.stage === 'PERIOD'
        ) {
          const effectiveDur = merged.periodDurationMinutes * 60 * 1000;
          const startMs =
            merged.countDirection === 'UP'
              ? (state.currentPeriod - 1) * effectiveDur
              : effectiveDur;

          setState((prevState) => ({
            ...prevState,
            totalDurationMs: effectiveDur,
            remainingMs: startMs,
          }));
        }
        return merged;
      });
    },
    [state.status, state.stage, state.currentPeriod]
  );

  const setLanguage = useCallback((lang: Language) => {
    triggerButtonHaptic();
    setLanguageState(lang);
  }, []);

  const acknowledgeAlert = useCallback(() => {
    triggerButtonHaptic();
    setIsAlertAcknowledged(true);
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

  const updateTeamName = useCallback((team: 'home' | 'away', name: string) => {
    setState((prev) => {
      if (!prev.goalieSaves) return prev;
      return {
        ...prev,
        goalieSaves: {
          ...prev.goalieSaves,
          [team]: {
            ...prev.goalieSaves[team],
            teamName: name.trim() || (team === 'home' ? 'Koti' : 'Vieras'),
          },
        },
      };
    });
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
    adjustRemainingMs,
    adjustSeconds,
    adjustMinutes,
    proceedToNextStage,
    revertToPreviousStage,
    jumpToStage,
    updateConfig,
    setLanguage,
    acknowledgeAlert,
    addGoalieSave,
    removeGoalieSave,
    switchGoalie,
    addGoalie,
    updateTeamName,
  };
}
