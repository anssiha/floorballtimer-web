import React, { useState } from 'react';
import type { TeamGoalieData, GoalieStats, Language } from '../types/timer';
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
  onRenameGoalie: (goalieId: string, name: string) => void;
  onRemoveGoalie: (goalieId: string) => void;
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
  onRenameGoalie,
  onRemoveGoalie,
  onRenameTeam,
}) => {
  const [newGoalieInput, setNewGoalieInput] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState('');
  const [goalieToDelete, setGoalieToDelete] = useState<GoalieStats | null>(null);

  if (!isOpen) return null;

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newGoalieInput.trim()) {
      onAddGoalie(newGoalieInput.trim());
      setNewGoalieInput('');
      onClose();
    }
  };

  const handleRenameSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId && editDraft.trim()) {
      onRenameGoalie(editingId, editDraft.trim());
      setEditingId(null);
    }
  };

  const teamTitle = getTeamLabel(teamData, team, language);
  const canDelete = teamData.goalies.length > 1;

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

            if (goalie.id === editingId) {
              return (
                <form key={goalie.id} className="goalie-row goalie-edit-row" onSubmit={handleRenameSubmit}>
                  <input
                    type="text"
                    value={editDraft}
                    maxLength={25}
                    autoFocus
                    aria-label={t(language, 'renameGoalie')}
                    onChange={(e) => setEditDraft(e.target.value)}
                    onKeyDown={(e) => {
                      // Escape cancels only the edit, not the whole dialog
                      if (e.key === 'Escape') {
                        e.preventDefault();
                        e.stopPropagation();
                        setEditingId(null);
                      }
                    }}
                  />
                  <button
                    type="submit"
                    className="goalie-icon-btn confirm"
                    disabled={!editDraft.trim()}
                    aria-label={t(language, 'saveName')}
                    title={t(language, 'saveName')}
                  >
                    ✓
                  </button>
                  <button
                    type="button"
                    className="goalie-icon-btn"
                    onClick={() => setEditingId(null)}
                    aria-label={t(language, 'cancel')}
                    title={t(language, 'cancel')}
                  >
                    ✕
                  </button>
                </form>
              );
            }

            return (
              <div key={goalie.id} className="goalie-row">
                <button
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
                <button
                  type="button"
                  className="goalie-icon-btn"
                  onClick={() => {
                    setEditingId(goalie.id);
                    setEditDraft(goalie.nameOrNumber);
                  }}
                  aria-label={`${t(language, 'renameGoalie')}: ${goalie.nameOrNumber}`}
                  title={t(language, 'renameGoalie')}
                >
                  ✏️
                </button>
                <button
                  type="button"
                  className="goalie-icon-btn danger"
                  disabled={!canDelete}
                  onClick={() => setGoalieToDelete(goalie)}
                  aria-label={`${t(language, 'deleteGoalie')}: ${goalie.nameOrNumber}`}
                  title={t(language, 'deleteGoalie')}
                >
                  🗑
                </button>
              </div>
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

      {goalieToDelete && (
        <Modal
          onClose={() => setGoalieToDelete(null)}
          className="confirm-modal"
          ariaLabel={t(language, 'confirmDeleteGoalieTitle')}
        >
          <div className="modal-header">
            <h3>⚠️ {t(language, 'confirmDeleteGoalieTitle')}</h3>
            <button
              type="button"
              className="modal-close-btn"
              onClick={() => setGoalieToDelete(null)}
              aria-label={t(language, 'cancel')}
            >
              ✕
            </button>
          </div>
          <div className="confirm-body">
            <p className="confirm-text">
              {t(language, 'confirmDeleteGoalieText', {
                name: goalieToDelete.nameOrNumber,
                saves: formatSaveCount(language, getGoalieTotalSaves(goalieToDelete)),
              })}
            </p>
            <div className="confirm-actions">
              <button
                type="button"
                className="btn-confirm danger"
                onClick={() => {
                  onRemoveGoalie(goalieToDelete.id);
                  setGoalieToDelete(null);
                }}
              >
                {t(language, 'delete')}
              </button>
              <button type="button" className="btn-cancel" onClick={() => setGoalieToDelete(null)}>
                {t(language, 'cancel')}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </Modal>
  );
};
