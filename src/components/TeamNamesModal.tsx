import React from 'react';
import type { GoalieSavesState, Language } from '../types/timer';
import { t } from '../i18n/translations';
import { Modal } from './Modal';

interface TeamNamesModalProps {
  goalieSaves: GoalieSavesState;
  language: Language;
  onRenameTeam: (team: 'home' | 'away', name: string) => void;
  onClose: () => void;
}

// Team names for the scoreboard. They are the same names the goalie cards use,
// so they can be edited here even when goalie saves are not tracked.
export const TeamNamesModal: React.FC<TeamNamesModalProps> = ({
  goalieSaves,
  language,
  onRenameTeam,
  onClose,
}) => (
  <Modal onClose={onClose} className="goalie-modal" ariaLabel={t(language, 'teamNames')}>
    <div className="modal-header">
      <div className="title-row">
        <span className="icon">🏑</span>
        <h3>{t(language, 'teamNames')}</h3>
      </div>
      <button
        type="button"
        className="modal-close-btn"
        onClick={onClose}
        aria-label={t(language, 'done')}
      >
        ✕
      </button>
    </div>

    <form
      className="goalie-modal-body"
      onSubmit={(e) => {
        e.preventDefault();
        onClose();
      }}
    >
      {(['home', 'away'] as const).map((team) => (
        <React.Fragment key={team}>
          <label className="setting-label" htmlFor={`score-team-name-${team}`}>
            {t(language, team)}
          </label>
          <input
            id={`score-team-name-${team}`}
            className="team-name-input"
            type="text"
            value={goalieSaves[team].teamName}
            placeholder={t(language, team)}
            maxLength={20}
            onChange={(e) => onRenameTeam(team, e.target.value)}
          />
        </React.Fragment>
      ))}
      {/* Lets Enter on a mobile keyboard close the dialog */}
      <button type="submit" hidden />
    </form>
  </Modal>
);
