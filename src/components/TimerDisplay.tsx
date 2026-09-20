import React, { useRef, useEffect, useCallback } from 'react';
import type { MatchState, MatchConfig, Language } from '../types/timer';
import { formatMMSS } from '../utils/format';
import { t } from '../i18n/translations';

interface TimerDisplayProps {
  state: MatchState;
  config: MatchConfig;
  language: Language;
  onAdjustMinutes: (delta: number) => void;
  onAdjustSeconds: (delta: number) => void;
  isAlertAcknowledged: boolean;
}

export const TimerDisplay: React.FC<TimerDisplayProps> = ({
  state,
  config,
  language,
  onAdjustMinutes,
  onAdjustSeconds,
  isAlertAcknowledged,
}) => {
  const { minutes, seconds } = formatMMSS(state.remainingMs, config.countDirection);
  const isFlashing = state.status === 'PERIOD_ENDED' && !isAlertAcknowledged;

  // Press-and-hold acceleration references
  const isHoldingRef = useRef(false);
  const timeoutIdRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);

  const stopHold = useCallback(() => {
    isHoldingRef.current = false;
    if (timeoutIdRef.current !== null) {
      window.clearTimeout(timeoutIdRef.current);
      timeoutIdRef.current = null;
    }
  }, []);

  // Ensure any window-level release stops the hold immediately (using capture phase)
  useEffect(() => {
    const handleGlobalRelease = () => {
      stopHold();
    };

    window.addEventListener('pointerup', handleGlobalRelease, true);
    window.addEventListener('pointercancel', handleGlobalRelease, true);
    window.addEventListener('mouseup', handleGlobalRelease, true);
    window.addEventListener('touchend', handleGlobalRelease, true);
    window.addEventListener('touchcancel', handleGlobalRelease, true);
    window.addEventListener('blur', handleGlobalRelease);

    return () => {
      window.removeEventListener('pointerup', handleGlobalRelease, true);
      window.removeEventListener('pointercancel', handleGlobalRelease, true);
      window.removeEventListener('mouseup', handleGlobalRelease, true);
      window.removeEventListener('touchend', handleGlobalRelease, true);
      window.removeEventListener('touchcancel', handleGlobalRelease, true);
      window.removeEventListener('blur', handleGlobalRelease);
      stopHold();
    };
  }, [stopHold]);

  const startHold = useCallback(
    (e: React.PointerEvent<HTMLButtonElement>, action: () => void) => {
      // Only respond to primary click / touch
      if (e.button !== 0) return;
      e.stopPropagation();
      e.preventDefault();

      // Capture pointer so pointerup is guaranteed even if finger moves outside the button
      try {
        e.currentTarget.setPointerCapture(e.pointerId);
      } catch {
        // Safe fallback if unsupported
      }

      // Stop any existing active repeat
      stopHold();

      // Fire initial step immediately on tap
      action();

      isHoldingRef.current = true;
      startTimeRef.current = Date.now();

      const runLoop = (delay: number) => {
        timeoutIdRef.current = window.setTimeout(() => {
          // Abort immediately if hold was released
          if (!isHoldingRef.current) return;

          action();

          // Abort if action changed hold state
          if (!isHoldingRef.current) return;

          const elapsed = Date.now() - startTimeRef.current;
          // Pacing tailored for sports timer adjustments:
          // 0 - 1500ms: 220ms interval (calm, predictable pace to easily hit 3-6 steps)
          // 1500 - 3000ms: 120ms interval (speeds up smoothly to cover 7-18 steps)
          // > 3000ms: 65ms interval (fast run for 20+ steps or minutes)
          let nextDelay = 220;
          if (elapsed > 3000) {
            nextDelay = 65;
          } else if (elapsed > 1500) {
            nextDelay = 120;
          }

          if (isHoldingRef.current) {
            runLoop(nextDelay);
          }
        }, delay);
      };

      // Initial press delay before repeating starts (400ms)
      runLoop(400);
    },
    [stopHold]
  );

  // Calculate percentage elapsed for the active period/break progress bar
  let progressPercent = 0;
  const isCountDown = config.countDirection === 'DOWN';

  if (state.stage === 'BREAK') {
    const breakLenMs = config.breakDurationMinutes * 60 * 1000;
    if (breakLenMs > 0) {
      progressPercent = Math.min(
        100,
        Math.max(0, ((breakLenMs - state.remainingMs) / breakLenMs) * 100)
      );
    }
  } else if (state.stage === 'OVERTIME') {
    const otLenMs = config.overtimeDurationMinutes * 60 * 1000;
    if (otLenMs > 0) {
      if (isCountDown) {
        progressPercent = Math.min(
          100,
          Math.max(0, ((otLenMs - state.remainingMs) / otLenMs) * 100)
        );
      } else {
        const startMs = config.periodCount * config.periodDurationMinutes * 60 * 1000;
        progressPercent = Math.min(
          100,
          Math.max(0, ((state.remainingMs - startMs) / otLenMs) * 100)
        );
      }
    }
  } else {
    // Regular PERIOD
    const periodLenMs = config.periodDurationMinutes * 60 * 1000;
    if (periodLenMs > 0) {
      if (isCountDown) {
        progressPercent = Math.min(
          100,
          Math.max(0, ((periodLenMs - state.remainingMs) / periodLenMs) * 100)
        );
      } else {
        const startMs = (state.currentPeriod - 1) * periodLenMs;
        progressPercent = Math.min(
          100,
          Math.max(0, ((state.remainingMs - startMs) / periodLenMs) * 100)
        );
      }
    }
  }

  // Stage display badge text
  let stageLabel = '';
  if (state.status === 'MATCH_FINISHED') {
    stageLabel = t(language, 'matchFinished');
  } else if (state.stage === 'BREAK') {
    stageLabel = t(language, 'break');
  } else if (state.stage === 'OVERTIME') {
    stageLabel = t(language, 'overtime');
  } else {
    stageLabel = t(language, 'periodOf', {
      current: state.currentPeriod,
      total: config.periodCount,
    });
  }

  const isPeriodActive = state.stage === 'PERIOD' || state.stage === 'OVERTIME';
  const isPlayStopped = isPeriodActive && (state.status === 'PAUSED' || state.status === 'STOPPED');

  let statusText = '';
  if (isPlayStopped) {
    statusText = t(language, 'gameStopped');
  } else {
    switch (state.status) {
      case 'STOPPED':
        statusText = t(language, 'statusStopped');
        break;
      case 'RUNNING':
        statusText = t(language, 'statusRunning');
        break;
      case 'PAUSED':
        statusText = t(language, 'statusPaused');
        break;
      case 'PERIOD_ENDED':
        statusText = t(language, 'statusPeriodEnded');
        break;
      case 'MATCH_FINISHED':
        statusText = t(language, 'statusMatchFinished');
        break;
    }
  }

  return (
    <section
      className={`timer-display-container ${isFlashing ? 'flashing-alert' : ''} ${
        isPlayStopped ? 'play-stopped' : ''
      }`}
    >
      {/* Stage Badge & Status */}
      <div className="stage-badge-wrapper">
        <div className={`stage-badge stage-${state.stage.toLowerCase()} ${state.status.toLowerCase()}`}>
          <span className="stage-icon">
            {state.stage === 'BREAK' ? '☕' : state.stage === 'OVERTIME' ? '⚡' : '⏱️'}
          </span>
          <span className="stage-text">{stageLabel}</span>
        </div>

        <div
          className={`timer-state-pill state-${state.status.toLowerCase()} ${
            isPlayStopped ? 'state-play-stopped' : ''
          }`}
        >
          {state.status === 'RUNNING' && <span className="pulsing-dot"></span>}
          {isPlayStopped && <span className="paused-icon">⏸</span>}
          <span>{statusText}</span>
        </div>
      </div>

      {/* Main Scoreboard Digits with Direct Minutes & Seconds Steppers */}
      <div
        className="timer-digits-box"
        role="region"
        aria-label={`${minutes} ${t(language, 'minutes')}, ${seconds} ${t(language, 'seconds')}`}
      >
        <div className="timer-stepper-row">
          {/* Minutes Stepper (Left) */}
          <div className="unit-stepper minutes-stepper" role="group" aria-label={t(language, 'minutes')}>
            <button
              type="button"
              className="stepper-arrow-btn plus"
              onPointerDown={(e) => startHold(e, () => onAdjustMinutes(1))}
              onPointerUp={(e) => { e.preventDefault(); stopHold(); }}
              onPointerLeave={stopHold}
              onPointerCancel={stopHold}
              onLostPointerCapture={stopHold}
              onContextMenu={(e) => e.preventDefault()}
              onClick={(e) => e.stopPropagation()}
              aria-label={t(language, 'addMinute')}
              title={t(language, 'addMinute')}
            >
              <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19"></line>
                <line x1="5" y1="12" x2="19" y2="12"></line>
              </svg>
            </button>
            <span className="stepper-unit-label">min</span>
            <button
              type="button"
              className="stepper-arrow-btn minus"
              onPointerDown={(e) => startHold(e, () => onAdjustMinutes(-1))}
              onPointerUp={(e) => { e.preventDefault(); stopHold(); }}
              onPointerLeave={stopHold}
              onPointerCancel={stopHold}
              onLostPointerCapture={stopHold}
              onContextMenu={(e) => e.preventDefault()}
              onClick={(e) => e.stopPropagation()}
              aria-label={t(language, 'subtractMinute')}
              title={t(language, 'subtractMinute')}
            >
              <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round">
                <line x1="5" y1="12" x2="19" y2="12"></line>
              </svg>
            </button>
          </div>

          {/* Main Digits */}
          <div className="timer-numbers">
            <span className="digit-block">{minutes}</span>
            <span className="colon-separator">:</span>
            <span className="digit-block">{seconds}</span>
          </div>

          {/* Seconds Stepper (Right) */}
          <div className="unit-stepper seconds-stepper" role="group" aria-label={t(language, 'seconds')}>
            <button
              type="button"
              className="stepper-arrow-btn plus"
              onPointerDown={(e) => startHold(e, () => onAdjustSeconds(1))}
              onPointerUp={(e) => { e.preventDefault(); stopHold(); }}
              onPointerLeave={stopHold}
              onPointerCancel={stopHold}
              onLostPointerCapture={stopHold}
              onContextMenu={(e) => e.preventDefault()}
              onClick={(e) => e.stopPropagation()}
              aria-label={t(language, 'addSecond')}
              title={t(language, 'addSecond')}
            >
              <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19"></line>
                <line x1="5" y1="12" x2="19" y2="12"></line>
              </svg>
            </button>
            <span className="stepper-unit-label">sek</span>
            <button
              type="button"
              className="stepper-arrow-btn minus"
              onPointerDown={(e) => startHold(e, () => onAdjustSeconds(-1))}
              onPointerUp={(e) => { e.preventDefault(); stopHold(); }}
              onPointerLeave={stopHold}
              onPointerCancel={stopHold}
              onLostPointerCapture={stopHold}
              onContextMenu={(e) => e.preventDefault()}
              onClick={(e) => e.stopPropagation()}
              aria-label={t(language, 'subtractSecond')}
              title={t(language, 'subtractSecond')}
            >
              <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round">
                <line x1="5" y1="12" x2="19" y2="12"></line>
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="timer-progress-track">
        <div
          className="timer-progress-fill"
          style={{ width: `${progressPercent}%` }}
        ></div>
      </div>
    </section>
  );
};
