import { useState, useEffect, useRef, useCallback } from 'react';
import type { MatchConfig, MatchState, Language, StageType } from '../types/timer';
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

  // Handle Wake Lock based on running status
  useEffect(() => {
    if (state.status === 'RUNNING') {
      requestWakeLock();
    } else {
      releaseWakeLock();
    }
    return () => {
      releaseWakeLock();
    };
  }, [state.status]);

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

      return {
        ...prev,
        status: 'STOPPED',
        remainingMs: resetMs,
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

  // Period Progression
  const proceedToNextStage = useCallback(() => {
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
        if (config.breakEnabled && config.breakDurationMinutes > 0) {
          const breakDurationMs = config.breakDurationMinutes * 60 * 1000;
          return {
            status: config.autoStartBreak ? 'RUNNING' : 'STOPPED',
            stage: 'BREAK',
            currentPeriod: prev.currentPeriod,
            totalDurationMs: breakDurationMs,
            remainingMs: breakDurationMs,
          };
        } else {
          // No break configured or disabled, straight to next period
          const nextPeriod = prev.currentPeriod + 1;
          const durationMs = config.periodDurationMinutes * 60 * 1000;
          const startMs =
            config.countDirection === 'UP'
              ? (nextPeriod - 1) * durationMs
              : durationMs;

          return {
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
      setState({
        status: 'STOPPED',
        stage,
        currentPeriod: periodNumber,
        totalDurationMs: durationMs,
        remainingMs: startMs,
      });
    },
    [config]
  );

  // Update configuration
  const updateConfig = useCallback(
    (newConfig: Partial<MatchConfig>) => {
      setConfigState((prev) => {
        const merged = { ...prev, ...newConfig };
        // If period length changed and timer is STOPPED at period 1, update active start/target
        if (
          newConfig.periodDurationMinutes !== undefined &&
          newConfig.periodDurationMinutes !== prev.periodDurationMinutes &&
          state.status === 'STOPPED' &&
          state.stage === 'PERIOD'
        ) {
          const newDurMs = newConfig.periodDurationMinutes * 60 * 1000;
          const startMs =
            merged.countDirection === 'UP'
              ? (state.currentPeriod - 1) * newDurMs
              : newDurMs;

          setState((prevState) => ({
            ...prevState,
            totalDurationMs: newDurMs,
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
    proceedToNextStage,
    jumpToStage,
    updateConfig,
    setLanguage,
    acknowledgeAlert,
  };
}
