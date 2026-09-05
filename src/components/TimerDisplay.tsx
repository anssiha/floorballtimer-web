import React from 'react';
import type { MatchState, MatchConfig, Language } from '../types/timer';
import { formatMMSS } from '../utils/format';
import { t } from '../i18n/translations';

interface TimerDisplayProps {
  state: MatchState;
  config: MatchConfig;
  language: Language;
  onOpenAdjust: () => void;
  isAlertAcknowledged: boolean;
}

export const TimerDisplay: React.FC<TimerDisplayProps> = ({
  state,
  config,
  language,
  onOpenAdjust,
  isAlertAcknowledged,
}) => {
  const { minutes, seconds } = formatMMSS(state.remainingMs);
  const isEditable = state.status === 'PAUSED' || state.status === 'STOPPED';
  const isFlashing = state.status === 'PERIOD_ENDED' && !isAlertAcknowledged;

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

  return (
    <section className={`timer-display-container ${isFlashing ? 'flashing-alert' : ''}`}>
      {/* Stage Badge & Status */}
      <div className="stage-badge-wrapper">
        <div className={`stage-badge stage-${state.stage.toLowerCase()} ${state.status.toLowerCase()}`}>
          <span className="stage-icon">
            {state.stage === 'BREAK' ? '☕' : state.stage === 'OVERTIME' ? '⚡' : '⏱️'}
          </span>
          <span className="stage-text">{stageLabel}</span>
        </div>

        <div className={`timer-state-pill state-${state.status.toLowerCase()}`}>
          {state.status === 'RUNNING' && <span className="pulsing-dot"></span>}
          <span>{state.status}</span>
        </div>
      </div>

      {/* Main Scoreboard Digits */}
      <div
        className={`timer-digits-box ${isEditable ? 'editable' : ''}`}
        onClick={() => {
          if (isEditable) {
            onOpenAdjust();
          }
        }}
        role={isEditable ? 'button' : 'region'}
        tabIndex={isEditable ? 0 : undefined}
        aria-label={`${minutes} ${t(language, 'minutes')}, ${seconds} ${t(language, 'seconds')}`}
        title={isEditable ? t(language, 'tapToEdit') : undefined}
      >
        <div className="timer-numbers">
          <span className="digit-block">{minutes}</span>
          <span className="colon-separator">:</span>
          <span className="digit-block">{seconds}</span>
        </div>

        {isEditable && (
          <div className="edit-hint">
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 20h9"></path>
              <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
            </svg>
            <span>{t(language, 'tapToEdit')}</span>
          </div>
        )}
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
