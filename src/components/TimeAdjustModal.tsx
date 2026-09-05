import React, { useState } from 'react';
import type { Language } from '../types/timer';
import { t } from '../i18n/translations';
import { formatMMSS } from '../utils/format';

interface TimeAdjustModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentRemainingMs: number;
  onApply: (newMs: number) => void;
  language: Language;
}

export const TimeAdjustModal: React.FC<TimeAdjustModalProps> = ({
  isOpen,
  onClose,
  currentRemainingMs,
  onApply,
  language,
}) => {
  const { minutes: initialMins, seconds: initialSecs } = formatMMSS(currentRemainingMs);
  const [mins, setMins] = useState(() => parseInt(initialMins, 10));
  const [secs, setSecs] = useState(() => parseInt(initialSecs, 10));

  if (!isOpen) return null;

  const handleQuickAdd = (deltaSeconds: number) => {
    let totalSecs = mins * 60 + secs + deltaSeconds;
    if (totalSecs < 0) totalSecs = 0;
    if (totalSecs > 99 * 60 + 59) totalSecs = 99 * 60 + 59;
    setMins(Math.floor(totalSecs / 60));
    setSecs(totalSecs % 60);
  };

  const handleSave = () => {
    const totalMs = (mins * 60 + secs) * 1000;
    onApply(totalMs);
    onClose();
  };

  return (
    <div className="modal-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div
        className="modal-content time-adjust-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <h3>{t(language, 'adjustTime')}</h3>
          <button
            type="button"
            className="modal-close-btn"
            onClick={onClose}
            aria-label={t(language, 'cancel')}
          >
            ✕
          </button>
        </div>

        {/* Big Preview Digits */}
        <div className="time-adjust-preview">
          <div className="adjust-digit-group">
            <span className="adjust-digit-val">{String(mins).padStart(2, '0')}</span>
            <span className="adjust-unit">{t(language, 'minutes')}</span>
          </div>
          <span className="adjust-colon">:</span>
          <div className="adjust-digit-group">
            <span className="adjust-digit-val">{String(secs).padStart(2, '0')}</span>
            <span className="adjust-unit">{t(language, 'seconds')}</span>
          </div>
        </div>

        {/* Quick Stepper Buttons */}
        <div className="quick-steppers-grid">
          <button
            type="button"
            className="stepper-btn"
            onClick={() => handleQuickAdd(60)}
          >
            +1 min
          </button>
          <button
            type="button"
            className="stepper-btn"
            onClick={() => handleQuickAdd(-60)}
          >
            -1 min
          </button>
          <button
            type="button"
            className="stepper-btn"
            onClick={() => handleQuickAdd(10)}
          >
            +10 s
          </button>
          <button
            type="button"
            className="stepper-btn"
            onClick={() => handleQuickAdd(-10)}
          >
            -10 s
          </button>
          <button
            type="button"
            className="stepper-btn"
            onClick={() => handleQuickAdd(1)}
          >
            +1 s
          </button>
          <button
            type="button"
            className="stepper-btn"
            onClick={() => handleQuickAdd(-1)}
          >
            -1 s
          </button>
        </div>

        {/* Direct Inputs */}
        <div className="direct-inputs-row">
          <div className="input-field">
            <label htmlFor="adjust-mins">{t(language, 'minutes')}</label>
            <input
              id="adjust-mins"
              type="number"
              min="0"
              max="99"
              value={mins}
              onChange={(e) => {
                const v = parseInt(e.target.value, 10);
                setMins(isNaN(v) ? 0 : Math.max(0, Math.min(99, v)));
              }}
            />
          </div>
          <div className="input-field">
            <label htmlFor="adjust-secs">{t(language, 'seconds')}</label>
            <input
              id="adjust-secs"
              type="number"
              min="0"
              max="59"
              value={secs}
              onChange={(e) => {
                const v = parseInt(e.target.value, 10);
                setSecs(isNaN(v) ? 0 : Math.max(0, Math.min(59, v)));
              }}
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="modal-actions">
          <button
            type="button"
            className="btn-modal-cancel"
            onClick={onClose}
          >
            {t(language, 'cancel')}
          </button>
          <button
            type="button"
            className="btn-modal-apply"
            onClick={handleSave}
          >
            {t(language, 'apply')}
          </button>
        </div>
      </div>
    </div>
  );
};
