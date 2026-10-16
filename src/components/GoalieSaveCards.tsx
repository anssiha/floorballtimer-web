import React, { useState } from 'react';
import type { MatchState, Language } from '../types/timer';
import { t, formatSaveCount } from '../i18n/translations';
import { getGoalieTotalSaves, getTeamTotalSaves, getTeamLabel } from '../utils/goalie';
import { GoalieChangeModal } from './GoalieChangeModal';

interface GoalieSaveCardsProps {
  state: MatchState;
  language: Language;
  onAddSave: (team: 'home' | 'away') => void;
  onRemoveSave: (team: 'home' | 'away') => void;
  onSwitchGoalie: (team: 'home' | 'away', goalieId: string) => void;
  onAddGoalie: (team: 'home' | 'away', nameOrNumber: string) => void;
  onRenameTeam: (team: 'home' | 'away', name: string) => void;
}

export const GoalieSaveCards: React.FC<GoalieSaveCardsProps> = ({
  state,
  language,
  onAddSave,
  onRemoveSave,
  onSwitchGoalie,
  onAddGoalie,
  onRenameTeam,
}) => {
  const [modalTeam, setModalTeam] = useState<'home' | 'away' | null>(null);
  // Bumped on every +1/-1 so the feedback animation elements remount and replay
  const [feedback, setFeedback] = useState<
    Partial<Record<'home' | 'away', { kind: 'add' | 'remove'; count: number }>>
  >({});

  const giveFeedback = (team: 'home' | 'away', kind: 'add' | 'remove') => {
    setFeedback((prev) => ({ ...prev, [team]: { kind, count: (prev[team]?.count ?? 0) + 1 } }));
  };

  const { goalieSaves, currentPeriod, stage } = state;
  if (!goalieSaves) return null;

  const renderTeamCard = (team: 'home' | 'away') => {
    const teamData = goalieSaves[team];
    const activeGoalie =
      teamData.goalies.find((g) => g.id === teamData.activeGoalieId) ||
      teamData.goalies[0];

    const isOvertime = stage === 'OVERTIME';
    const periodSaves = isOvertime
      ? activeGoalie?.savesOvertime || 0
      : activeGoalie?.savesPerPeriod?.[currentPeriod] || 0;

    const goalieTotal = activeGoalie ? getGoalieTotalSaves(activeGoalie) : 0;
    const teamTotal = getTeamTotalSaves(teamData.goalies);

    const teamLabel = getTeamLabel(teamData, team, language);
    const periodBadge = isOvertime ? t(language, 'overtimeShort') : `${t(language, 'savesPeriod')} ${currentPeriod}`;

    const teamFeedback = feedback[team];
    const feedbackKey = teamFeedback ? `${teamFeedback.kind}-${teamFeedback.count}` : 'none';

    return (
      <div className={`goalie-team-card goalie-card-${team}`} key={team}>
        {teamFeedback && (
          <span
            key={feedbackKey}
            className={`save-flash save-flash-${teamFeedback.kind}`}
            aria-hidden="true"
          />
        )}

        <div className="goalie-card-header">
          {/* Tapping the team name opens the same dialog, where the name can be edited */}
          <button
            type="button"
            className="goalie-team-title"
            onClick={() => setModalTeam(team)}
            title={t(language, 'teamName')}
          >
            {teamLabel}
          </button>
          <button
            type="button"
            className="goalie-select-chip"
            onClick={() => setModalTeam(team)}
            title={`${activeGoalie?.nameOrNumber || '#1'}: ${formatSaveCount(language, goalieTotal)}`}
          >
            <span className="chip-icon">🥅</span>
            <span className="chip-name">{activeGoalie?.nameOrNumber || '#1'}</span>
            <span className="chip-arrow">▾</span>
          </button>
        </div>

        {/* The whole card body is the +1 target */}
        <button
          type="button"
          className="btn-save-plus-main"
          onClick={() => {
            onAddSave(team);
            giveFeedback(team, 'add');
          }}
          aria-label={`${teamLabel}: +1 ${t(language, 'addSave').toLowerCase()} (${periodSaves})`}
        >
          <span
            key={feedbackKey}
            className={`save-period-num ${teamFeedback ? `save-pop-${teamFeedback.kind}` : ''}`}
          >
            {periodSaves}
          </span>
          <span className="save-plus-label">+ {t(language, 'addSave')}</span>
        </button>

        <div className="goalie-card-footer">
          <span className="save-meta-info">
            <span>{periodBadge}</span>
            <span>
              {t(language, 'savesTotal')} {teamTotal}
            </span>
          </span>
          <button
            type="button"
            className="btn-save-minus"
            onClick={() => {
              onRemoveSave(team);
              giveFeedback(team, 'remove');
            }}
            disabled={periodSaves <= 0}
            aria-label={`${teamLabel}: -1 ${t(language, 'addSave').toLowerCase()}`}
          >
            −1
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="goalie-saves-container">
      {renderTeamCard('home')}
      {renderTeamCard('away')}

      {modalTeam && (
        <GoalieChangeModal
          isOpen={modalTeam !== null}
          onClose={() => setModalTeam(null)}
          team={modalTeam}
          teamData={goalieSaves[modalTeam]}
          language={language}
          onSelectGoalie={(goalieId) => onSwitchGoalie(modalTeam, goalieId)}
          onAddGoalie={(name) => onAddGoalie(modalTeam, name)}
          onRenameTeam={(name) => onRenameTeam(modalTeam, name)}
        />
      )}
    </div>
  );
};
