import React, { useState } from 'react';
import type { MatchState, Language } from '../types/timer';
import { t } from '../i18n/translations';
import { getGoalieTotalSaves, getTeamTotalSaves } from '../utils/goalie';
import { GoalieChangeModal } from './GoalieChangeModal';

interface GoalieSaveCardsProps {
  state: MatchState;
  language: Language;
  onAddSave: (team: 'home' | 'away') => void;
  onRemoveSave: (team: 'home' | 'away') => void;
  onSwitchGoalie: (team: 'home' | 'away', goalieId: string) => void;
  onAddGoalie: (team: 'home' | 'away', nameOrNumber: string) => void;
}

export const GoalieSaveCards: React.FC<GoalieSaveCardsProps> = ({
  state,
  language,
  onAddSave,
  onRemoveSave,
  onSwitchGoalie,
  onAddGoalie,
}) => {
  const [modalTeam, setModalTeam] = useState<'home' | 'away' | null>(null);

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

    const teamLabel = teamData.teamName || t(language, team);
    const periodBadge = isOvertime ? 'JA' : `${t(language, 'savesPeriod')} ${currentPeriod}`;

    return (
      <div className={`goalie-team-card goalie-card-${team}`} key={team}>
        <div className="goalie-card-header">
          <span className="goalie-team-title">{teamLabel}</span>
          <button
            type="button"
            className="goalie-select-chip"
            onClick={() => setModalTeam(team)}
            title={`${activeGoalie?.nameOrNumber || '#1'}: ${goalieTotal} ${t(language, 'saves').toLowerCase()}`}
          >
            <span className="chip-icon">🥅</span>
            <span className="chip-name">{activeGoalie?.nameOrNumber || '#1'}</span>
            <span className="chip-arrow">▾</span>
          </button>
        </div>

        <div className="goalie-action-row">
          <button
            type="button"
            className="btn-save-minus"
            onClick={() => onRemoveSave(team)}
            disabled={periodSaves <= 0}
            title="-1"
            aria-label="-1"
          >
            -
          </button>

          <button
            type="button"
            className="btn-save-plus-main"
            onClick={() => onAddSave(team)}
            title={`+1 ${t(language, 'saves').toLowerCase()}`}
          >
            <div className="save-count-badge">
              <span className="save-plus-icon">+1</span>
              <span className="save-period-num">{periodSaves}</span>
            </div>
            <div className="save-meta-info">
              <span className="save-period-label">{periodBadge}</span>
              <span className="save-total-label">
                ({t(language, 'savesTotal')}: {teamTotal})
              </span>
            </div>
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
        />
      )}
    </div>
  );
};
