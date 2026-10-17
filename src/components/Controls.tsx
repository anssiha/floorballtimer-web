import React, { useState } from 'react';
import type { MatchState, MatchConfig, Language } from '../types/timer';
import { t } from '../i18n/translations';
import { Modal } from './Modal';
import { NewMatchModal } from './NewMatchModal';
import { SaveSummaryModal } from './SaveSummaryModal';

interface ControlsProps {
  state: MatchState;
  config: MatchConfig;
  language: Language;
  onToggleTimer: () => void;
  onResetPeriod: () => void;
  onResetMatch: () => void;
  onProceedNext: (skipBreak?: boolean) => void;
  onRevertPrevious?: () => void;
}

export const Controls: React.FC<ControlsProps> = ({
  state,
  config,
  language,
  onToggleTimer,
  onResetPeriod,
  onResetMatch,
  onProceedNext,
  onRevertPrevious,
}) => {
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [showProceedConfirm, setShowProceedConfirm] = useState(false);
  const [showNewMatchConfirm, setShowNewMatchConfirm] = useState(false);
  const [showSavesSummary, setShowSavesSummary] = useState(false);

  const isRunning = state.status === 'RUNNING';
  const isPeriodEnded = state.status === 'PERIOD_ENDED';
  const isMatchFinished = state.status === 'MATCH_FINISHED';
  const isBreak = state.stage === 'BREAK';
  // Proceeding from this period starts an intermission break (never after the last period)
  const nextIsBreak =
    config.breakEnabled &&
    config.breakDurationMinutes > 0 &&
    state.stage === 'PERIOD' &&
    state.currentPeriod < config.periodCount;
  // Moving on from overtime, or from the last period without overtime, finishes the match
  const nextFinishesMatch =
    state.stage === 'OVERTIME' ||
    (state.stage === 'PERIOD' &&
      state.currentPeriod >= config.periodCount &&
      !config.overtimeEnabled);
  // Label for the action that moves the match on from the current stage
  const nextActionLabel = isBreak
    ? t(language, 'nextPeriod')
    : nextFinishesMatch
    ? t(language, 'finishMatch')
    : state.currentPeriod < config.periodCount
    ? nextIsBreak
      ? t(language, 'startBreak')
      : t(language, 'nextPeriod')
    : t(language, 'startOvertime');
  const canRevertPrevious =
    isMatchFinished ||
    state.currentPeriod > 1 ||
    state.stage === 'BREAK' ||
    state.stage === 'OVERTIME';

  // Primary button label & style
  let primaryLabel = t(language, 'start');
  let primaryClass = 'btn-primary-start';

  if (isMatchFinished) {
    primaryLabel = t(language, 'newMatch');
    primaryClass = 'btn-primary-start';
  } else if (isBreak) {
    // The break clock always runs; the only action is ending it (early) for the next period
    primaryLabel = t(language, 'nextPeriod');
    primaryClass = 'btn-primary-next';
  } else if (isRunning) {
    primaryLabel = t(language, 'pause');
    primaryClass = 'btn-primary-pause';
  } else if (state.status === 'PAUSED') {
    primaryLabel = t(language, 'resume');
    primaryClass = 'btn-primary-resume';
  } else if (isPeriodEnded) {
    primaryLabel = nextActionLabel;
    primaryClass = 'btn-primary-next';
  }

  const handlePrimaryClick = () => {
    if (isMatchFinished) {
      setShowNewMatchConfirm(true);
    } else if (isBreak) {
      if (isPeriodEnded) {
        onProceedNext();
      } else {
        // Ending the break early: confirm so a stray tap can't cut it short
        setShowProceedConfirm(true);
      }
    } else if (isPeriodEnded) {
      if (nextIsBreak) {
        // Confirm before starting the break countdown (or skipping it)
        setShowProceedConfirm(true);
      } else {
        onProceedNext();
      }
    } else {
      onToggleTimer();
    }
  };

  const proceedTitle = isBreak
    ? t(language, 'confirmEndBreakTitle')
    : nextIsBreak
    ? t(language, 'confirmBreakTitle')
    : nextFinishesMatch
    ? t(language, 'confirmFinishMatchTitle')
    : t(language, 'confirmNextPeriodTitle');
  const proceedText = isBreak
    ? t(language, 'confirmEndBreakText', { next: state.currentPeriod + 1 })
    : nextIsBreak
    ? t(language, 'confirmBreakText')
    : nextFinishesMatch
    ? t(language, 'confirmFinishMatchText')
    : t(language, 'confirmNextPeriodText');

  const handleResetClick = () => {
    setShowResetConfirm(true);
  };

  const handleConfirmResetPeriod = () => {
    onResetPeriod();
    setShowResetConfirm(false);
  };

  return (
    <div className="controls-container">
      {/* Primary Action Button (Extra Large for bench gloves/one-thumb tap) */}
      <button
        type="button"
        className={`main-action-btn ${primaryClass}`}
        onClick={handlePrimaryClick}
      >
        <span className="btn-icon">
          {isRunning && !isBreak ? (
            <svg viewBox="0 0 24 24" width="32" height="32" fill="currentColor">
              <rect x="6" y="4" width="4" height="16" rx="1.5"></rect>
              <rect x="14" y="4" width="4" height="16" rx="1.5"></rect>
            </svg>
          ) : isPeriodEnded || isBreak ? (
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
          title={t(language, 'correct')}
        >
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path>
            <path d="M3 3v5h5"></path>
          </svg>
          <span>{t(language, 'correct')}</span>
        </button>

        {/* Next Period/Break Button */}
        {!isPeriodEnded && !isMatchFinished && !isBreak && (
          <button
            type="button"
            className="secondary-btn btn-next"
            onClick={() => setShowProceedConfirm(true)}
          >
            <span>{nextActionLabel}</span>
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 18 15 12 9 6"></polyline>
            </svg>
          </button>
        )}

        {/* Finished match: saves per period for the match report */}
        {isMatchFinished && config.trackGoalieSaves && (
          <button
            type="button"
            className="secondary-btn"
            onClick={() => setShowSavesSummary(true)}
            title={t(language, 'savesSummary')}
          >
            <span>🥅 {t(language, 'savesSummaryShort')}</span>
          </button>
        )}
      </div>

      {showSavesSummary && (
        <SaveSummaryModal
          goalieSaves={state.goalieSaves}
          config={config}
          state={state}
          language={language}
          onClose={() => setShowSavesSummary(false)}
        />
      )}

      {/* Correction dialog: previous period / restart this period */}
      {showResetConfirm && (
        <Modal
          onClose={() => setShowResetConfirm(false)}
          className="confirm-modal"
          ariaLabel={t(language, 'correct')}
        >
          <div className="modal-header">
            <h3>⚠️ {t(language, 'correct')}</h3>
            <button
              type="button"
              className="modal-close-btn"
              onClick={() => setShowResetConfirm(false)}
              aria-label={t(language, 'cancel')}
            >
              ✕
            </button>
          </div>
          <div className="confirm-body">
            <p className="confirm-text">{t(language, 'correctText')}</p>
            <div className="confirm-actions">
              {canRevertPrevious && onRevertPrevious && (
                <button
                  type="button"
                  className="btn-confirm-secondary"
                  onClick={() => {
                    onRevertPrevious();
                    setShowResetConfirm(false);
                  }}
                >
                  ⏪ {isMatchFinished ? t(language, 'undoMatchEnd') : t(language, 'previousPeriod')}
                </button>
              )}
              {!isMatchFinished && (
                <button
                  type="button"
                  className="btn-confirm danger"
                  onClick={handleConfirmResetPeriod}
                >
                  {t(language, 'resetPeriod')}
                </button>
              )}
              <button
                type="button"
                className="btn-cancel"
                onClick={() => setShowResetConfirm(false)}
              >
                {t(language, 'cancel')}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Next Period / Break Confirmation Modal */}
      {showProceedConfirm && (
        <Modal
          onClose={() => setShowProceedConfirm(false)}
          className="confirm-modal"
          ariaLabel={proceedTitle}
        >
          <div className="modal-header">
            <h3>{proceedTitle}</h3>
            <button
              type="button"
              className="modal-close-btn"
              onClick={() => setShowProceedConfirm(false)}
              aria-label={t(language, 'cancel')}
            >
              ✕
            </button>
          </div>
          <div className="confirm-body">
            <p className="confirm-text">
              {proceedText}
            </p>
            <div className="confirm-actions">
              {nextIsBreak ? (
                <>
                  <button
                    type="button"
                    className="btn-confirm"
                    onClick={() => {
                      onProceedNext(false);
                      setShowProceedConfirm(false);
                    }}
                  >
                    {t(language, 'startBreak')} ({config.breakDurationMinutes} min)
                  </button>
                  <button
                    type="button"
                    className="btn-confirm-secondary"
                    onClick={() => {
                      onProceedNext(true);
                      setShowProceedConfirm(false);
                    }}
                  >
                    {t(language, 'skipBreak')}
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  className="btn-confirm"
                  onClick={() => {
                    onProceedNext();
                    setShowProceedConfirm(false);
                  }}
                >
                  {nextActionLabel}
                </button>
              )}
              <button
                type="button"
                className="btn-cancel"
                onClick={() => setShowProceedConfirm(false)}
              >
                {t(language, 'cancel')}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {showNewMatchConfirm && (
        <NewMatchModal
          language={language}
          onConfirm={onResetMatch}
          onClose={() => setShowNewMatchConfirm(false)}
        />
      )}
    </div>
  );
};
