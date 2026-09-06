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

  const renderTeamSaves = (teamKey: 'home' | 'away') => {
    if (!state.goalieSaves) return null;
    const teamData = state.goalieSaves[teamKey];
    const isOvertime = state.stage === 'OVERTIME';
    const period = state.currentPeriod;

    // Show goalies who played in this period: active goalie or those with saves > 0 in this period
    const relevantGoalies = teamData.goalies.filter((g) => {
      const s = isOvertime ? (g.savesOvertime || 0) : (g.savesPerPeriod?.[period] || 0);
      return s > 0 || g.id === teamData.activeGoalieId;
    });

    const teamPeriodTotal = teamData.goalies.reduce((acc, g) => {
      const s = isOvertime ? (g.savesOvertime || 0) : (g.savesPerPeriod?.[period] || 0);
      return acc + s;
    }, 0);

    return (
      <div className={`saves-summary-col saves-team-${teamKey}`}>
        <span className="summary-team-label">{teamData.teamName || t(language, teamKey)}</span>
        <div className="goalie-breakdown-list">
          {relevantGoalies.map((g) => {
            const s = isOvertime ? (g.savesOvertime || 0) : (g.savesPerPeriod?.[period] || 0);
            return (
              <div key={g.id} className="goalie-breakdown-item">
                <span className="goalie-tag">{g.nameOrNumber}</span>
                <span className="goalie-saves-count">{s}</span>
              </div>
            );
          })}
        </div>
        {relevantGoalies.length > 1 && (
          <div className="goalie-breakdown-subtotal">
            <span>{t(language, 'savesTotal')}:</span>
            <span className="total-val">{teamPeriodTotal}</span>
          </div>
        )}
      </div>
    );
  };

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

        {/* Goalie saves summary if tracking is enabled */}
        {config.trackGoalieSaves && state.goalieSaves && (
          <div className="period-saves-summary">
            <h4 className="saves-summary-heading">
              {t(language, 'savesSummaryTitle')} ({t(language, 'savesPeriod')} {state.stage === 'OVERTIME' ? 'JA' : state.currentPeriod})
            </h4>
            <div className="saves-summary-row">
              {renderTeamSaves('home')}
              <div className="saves-summary-divider">vs</div>
              {renderTeamSaves('away')}
            </div>
          </div>
        )}

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
