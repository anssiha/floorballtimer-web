import React from 'react';
import type { MatchState, MatchConfig, Language } from '../types/timer';
import { t } from '../i18n/translations';

interface PeriodEndModalProps {
  isOpen: boolean;
  state: MatchState;
  config: MatchConfig;
  language: Language;
  onAcknowledge: () => void;
  onProceedNext: (skipBreak?: boolean) => void;
}

export const PeriodEndModal: React.FC<PeriodEndModalProps> = ({
  isOpen,
  state,
  config,
  language,
  onAcknowledge,
  onProceedNext,
}) => {
  if (!isOpen) return null;

  let alertTitle = t(language, 'periodEndedAlert');
  if (state.stage === 'OVERTIME') {
    alertTitle = t(language, 'overtimeEndedAlert');
  } else if (state.stage === 'PERIOD' && state.currentPeriod >= config.periodCount && !config.overtimeEnabled) {
    alertTitle = t(language, 'matchEndedAlert');
  }

  const isBeforeBreak =
    config.breakEnabled &&
    config.breakDurationMinutes > 0 &&
    state.stage === 'PERIOD' &&
    state.currentPeriod < config.periodCount;

  let nextActionLabel = t(language, 'nextPeriod');
  if (state.stage === 'PERIOD' && state.currentPeriod >= config.periodCount) {
    nextActionLabel = config.overtimeEnabled ? t(language, 'startOvertime') : t(language, 'finishMatch');
  }

  return (
    <div className="period-alert-overlay" role="alertdialog" aria-modal="true">
      <div className="period-alert-card flashing-border">
        <div className="alert-icon-wrapper">
          <span className="buzz-icon">🚨</span>
        </div>

        <h2 className="alert-title">{alertTitle}</h2>

        <p className="alert-subtitle">
          {state.stage === 'PERIOD'
            ? `${t(language, 'period')} ${state.currentPeriod} / ${config.periodCount}`
            : state.stage === 'BREAK'
            ? t(language, 'break')
            : t(language, 'overtime')}
        </p>

        <div className="alert-buttons">
          {isBeforeBreak ? (
            <>
              <button
                type="button"
                className="alert-btn alert-primary"
                onClick={() => onProceedNext(false)}
              >
                {t(language, 'startBreak')} ({config.breakDurationMinutes} min)
              </button>
              <button
                type="button"
                className="alert-btn alert-primary"
                onClick={() => onProceedNext(true)}
              >
                {t(language, 'nextPeriod')}
              </button>
            </>
          ) : (
            <button
              type="button"
              className="alert-btn alert-primary"
              onClick={() => onProceedNext()}
            >
              {nextActionLabel}
            </button>
          )}
          <button
            type="button"
            className="alert-btn alert-secondary"
            onClick={onAcknowledge}
          >
            {t(language, 'dismiss')}
          </button>
        </div>
      </div>
    </div>
  );
};
