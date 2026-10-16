import React from 'react';
import type { Language } from '../types/timer';
import { t } from '../i18n/translations';
import { Modal } from './Modal';

interface NewMatchModalProps {
  language: Language;
  onConfirm: () => void;
  onClose: () => void;
}

// Confirmation for resetting the whole match (from the match-end button and from settings)
export const NewMatchModal: React.FC<NewMatchModalProps> = ({ language, onConfirm, onClose }) => (
  <Modal onClose={onClose} className="confirm-modal" ariaLabel={t(language, 'confirmNewMatchTitle')}>
    <div className="modal-header">
      <h3>⚠️ {t(language, 'confirmNewMatchTitle')}</h3>
      <button
        type="button"
        className="modal-close-btn"
        onClick={onClose}
        aria-label={t(language, 'cancel')}
      >
        ✕
      </button>
    </div>
    <div className="confirm-body">
      <p className="confirm-text">{t(language, 'confirmNewMatchText')}</p>
      <div className="confirm-actions">
        <button
          type="button"
          className="btn-confirm danger"
          onClick={() => {
            onConfirm();
            onClose();
          }}
        >
          {t(language, 'newMatch')}
        </button>
        <button type="button" className="btn-cancel" onClick={onClose}>
          {t(language, 'cancel')}
        </button>
      </div>
    </div>
  </Modal>
);
