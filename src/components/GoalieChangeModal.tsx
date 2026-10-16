import React, { useState } from 'react';
import type { TeamGoalieData, Language } from '../types/timer';
import { t, formatSaveCount } from '../i18n/translations';
import { getGoalieTotalSaves, getTeamLabel } from '../utils/goalie';
import { Modal } from './Modal';

interface GoalieChangeModalProps {
  isOpen: boolean;
  onClose: () => void;
  team: 'home' | 'away';
  teamData: TeamGoalieData;
  language: Language;
  onSelectGoalie: (goalieId: string) => void;
  onAddGoalie: (nameOrNumber: string) => void;
  onRenameTeam: (name: string) => void;
}

export const GoalieChangeModal: React.FC<GoalieChangeModalProps> = ({
  isOpen,
  onClose,
  team,
  teamData,
  language,
  onSelectGoalie,
  onAddGoalie,
  onRenameTeam,
}) => {
  const [newGoalieInput, setNewGoalieInput] = useState('');

  if (!isOpen) return null;

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newGoalieInput.trim()) {
      onAddGoalie(newGoalieInput.trim());
      setNewGoalieInput('');
      onClose();
    }
  };

  const teamTitle = getTeamLabel(teamData, team, language);

  return (
    <Modal onClose={onClose} className="goalie-modal" ariaLabel={`${teamTitle} – ${t(language, 'switchGoalie')}`}>
      <div className="modal-header">
        <div className="title-row">
          <span className="icon">🥅</span>
          <h3>{teamTitle} – {t(language, 'switchGoalie')}</h3>
        </div>
        <button
          type="button"
          className="modal-close-btn"
          onClick={onClose}
          aria-label={t(language, 'cancel')}
        >
          ✕
        </button>
      </div>

      <div className="goalie-modal-body">
        <label className="setting-label" htmlFor={`team-name-${team}`}>
          {t(language, 'teamName')}
        </label>
        <input
          id={`team-name-${team}`}
          className="team-name-input"
          type="text"
          value={teamData.teamName}
          placeholder={t(language, team)}
          maxLength={20}
          onChange={(e) => onRenameTeam(e.target.value)}
        />

        <label className="setting-label">{t(language, 'goalie')}</label>
        <div className="goalie-list">
          {teamData.goalies.map((goalie) => {
            const isActive = goalie.id === teamData.activeGoalieId;
            const totalSaves = getGoalieTotalSaves(goalie);
            return (
              <button
                key={goalie.id}
                type="button"
                className={`goalie-item-btn ${isActive ? 'active' : ''}`}
                onClick={() => {
                  onSelectGoalie(goalie.id);
                  onClose();
                }}
              >
                <span className="goalie-name">{goalie.nameOrNumber}</span>
                <span className="goalie-badge-saves">
                  {formatSaveCount(language, totalSaves)}
                </span>
                {isActive && <span className="active-tag">✓</span>}
              </button>
            );
          })}
        </div>

        <form onSubmit={handleAddSubmit} className="add-goalie-form">
          <label className="setting-label">{t(language, 'addGoalie')}</label>
          <div className="add-goalie-row">
            <input
              type="text"
              placeholder={t(language, 'enterGoalieNumber')}
              value={newGoalieInput}
              onChange={(e) => setNewGoalieInput(e.target.value)}
              maxLength={25}
            />
            <button
              type="submit"
              className="btn-add-goalie"
              disabled={!newGoalieInput.trim()}
            >
              +
            </button>
          </div>
        </form>
      </div>
    </Modal>
  );
};
