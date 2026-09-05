import React, { useState } from 'react';
import type { MatchState, MatchConfig, Language } from '../types/timer';
import { t } from '../i18n/translations';

interface ControlsProps {
  state: MatchState;
  config: MatchConfig;
  language: Language;
  onToggleTimer: () => void;
  onResetPeriod: () => void;
  onResetMatch: () => void;
  onProceedNext: () => void;
}

export const Controls: React.FC<ControlsProps> = ({
  state,
  config,
  language,
  onToggleTimer,
  onResetPeriod,
  onResetMatch,
  onProceedNext,
}) => {
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const isRunning = state.status === 'RUNNING';
  const isPeriodEnded = state.status === 'PERIOD_ENDED';
  const isMatchFinished = state.status === 'MATCH_FINISHED';

  // Primary button label & style
  let primaryLabel = t(language, 'start');
  let primaryClass = 'btn-primary-start';

  if (isRunning) {
    primaryLabel = t(language, 'pause');
    primaryClass = 'btn-primary-pause';
  } else if (state.status === 'PAUSED') {
    primaryLabel = t(language, 'resume');
    primaryClass = 'btn-primary-resume';
  } else if (isPeriodEnded) {
    if (state.stage === 'BREAK') {
      primaryLabel = t(language, 'nextPeriod');
    } else if (state.currentPeriod < config.periodCount) {
      primaryLabel = config.breakEnabled ? t(language, 'startBreak') : t(language, 'nextPeriod');
    } else if (config.overtimeEnabled) {
      primaryLabel = t(language, 'startOvertime');
    } else {
      primaryLabel = t(language, 'finishMatch');
    }
    primaryClass = 'btn-primary-next';
  }

  const handlePrimaryClick = () => {
    if (isPeriodEnded) {
      onProceedNext();
    } else {
      onToggleTimer();
    }
  };

  const handleResetClick = () => {
    setShowResetConfirm(true);
  };

  const handleConfirmResetPeriod = () => {
    onResetPeriod();
    setShowResetConfirm(false);
  };

  const handleConfirmResetMatch = () => {
    onResetMatch();
    setShowResetConfirm(false);
  };

  return (
    <div className="controls-container">
      {/* Primary Action Button (Extra Large for bench gloves/one-thumb tap) */}
      <button
        type="button"
        className={`main-action-btn ${primaryClass}`}
        onClick={handlePrimaryClick}
        disabled={isMatchFinished}
      >
        <span className="btn-icon">
          {isRunning ? (
            <svg viewBox="0 0 24 24" width="32" height="32" fill="currentColor">
              <rect x="6" y="4" width="4" height="16" rx="1.5"></rect>
              <rect x="14" y="4" width="4" height="16" rx="1.5"></rect>
            </svg>
          ) : isPeriodEnded ? (
            <svg viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="5 4 15 12 5 20 5 4"></polygon>
              <line x1="19" y1="5" x2="19" y2="19"></line>
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" width="34" height="34" fill="currentColor">
              <polygon points="6 3 20 12 6 21 6 3"></polygon>
            </svg>
          )}
        </span>
        <span className="btn-label">{primaryLabel}</span>
      </button>

      {/* Secondary Controls Bar */}
      <div className="secondary-controls">
        {/* Reset Button with confirmation */}
        <button
          type="button"
          className="secondary-btn btn-reset"
          onClick={handleResetClick}
          title={t(language, 'reset')}
        >
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path>
            <path d="M3 3v5h5"></path>
          </svg>
          <span>{t(language, 'reset')}</span>
        </button>

        {/* Next Period/Break Button */}
        {!isPeriodEnded && !isMatchFinished && (
          <button
            type="button"
            className="secondary-btn btn-next"
            onClick={onProceedNext}
          >
            <span>
              {state.stage === 'BREAK'
                ? t(language, 'nextPeriod')
                : state.currentPeriod < config.periodCount
                ? (config.breakEnabled ? t(language, 'startBreak') : t(language, 'nextPeriod'))
                : config.overtimeEnabled
                ? t(language, 'startOvertime')
                : t(language, 'finishMatch')}
            </span>
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 18 15 12 9 6"></polyline>
            </svg>
          </button>
        )}
      </div>

      {/* Reset Confirmation Modal */}
      {showResetConfirm && (
        <div className="modal-backdrop" onClick={() => setShowResetConfirm(false)} role="dialog" aria-modal="true">
          <div className="modal-content confirm-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>⚠️ {t(language, 'reset')}</h3>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setShowResetConfirm(false)}
              >
                ✕
              </button>
            </div>
            <div className="confirm-body">
              <p className="confirm-text">{t(language, 'resetPeriodConfirm')}</p>
              <div className="confirm-actions">
                <button
                  type="button"
                  className="btn-danger-confirm"
                  onClick={handleConfirmResetPeriod}
                >
                  {t(language, 'reset')} ({t(language, 'period')})
                </button>
                <button
                  type="button"
                  className="btn-danger-all"
                  onClick={handleConfirmResetMatch}
                >
                  {t(language, 'reset')} ({t(language, 'appTitle')})
                </button>
                <button
                  type="button"
                  className="btn-cancel"
                  onClick={() => setShowResetConfirm(false)}
                >
                  {t(language, 'cancel')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
