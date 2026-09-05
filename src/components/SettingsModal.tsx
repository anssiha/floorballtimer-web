import React, { useState } from 'react';
import type { MatchConfig, Language, CountDirection } from '../types/timer';
import {
  PERIOD_DURATION_PRESETS,
  BREAK_DURATION_PRESETS,
  OVERTIME_DURATION_PRESETS,
} from '../constants/presets';
import { t } from '../i18n/translations';
import { playArenaHorn } from '../services/sound';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: MatchConfig;
  onUpdateConfig: (newConfig: Partial<MatchConfig>) => void;
  language: Language;
  onLanguageChange: (lang: Language) => void;
  onResetMatch: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  config,
  onUpdateConfig,
  language,
  onLanguageChange,
  onResetMatch,
}) => {
  const [showCustomPeriod, setShowCustomPeriod] = useState(
    !PERIOD_DURATION_PRESETS.includes(config.periodDurationMinutes)
  );
  const [showCustomBreak, setShowCustomBreak] = useState(
    !BREAK_DURATION_PRESETS.includes(config.breakDurationMinutes)
  );

  if (!isOpen) return null;

  const handleTestBuzzer = () => {
    playArenaHorn();
  };

  const handleResetConfirm = () => {
    if (window.confirm(t(language, 'resetMatchConfirm'))) {
      onResetMatch();
      onClose();
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div
        className="modal-content settings-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <div className="title-row">
            <span className="icon">⚙️</span>
            <h3>{t(language, 'matchSettings')}</h3>
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

        <div className="settings-body">
          {/* Language selection */}
          <div className="setting-group">
            <label className="setting-label">{t(language, 'language')}</label>
            <div className="btn-segmented">
              <button
                type="button"
                className={`segment-btn ${language === 'fi' ? 'active' : ''}`}
                onClick={() => onLanguageChange('fi')}
              >
                Suomi (FI)
              </button>
              <button
                type="button"
                className={`segment-btn ${language === 'en' ? 'active' : ''}`}
                onClick={() => onLanguageChange('en')}
              >
                English (EN)
              </button>
            </div>
          </div>

          {/* Number of Periods */}
          <div className="setting-group">
            <label className="setting-label">{t(language, 'periodCount')}</label>
            <div className="btn-segmented">
              {([1, 2, 3] as const).map((num) => (
                <button
                  key={num}
                  type="button"
                  className={`segment-btn ${config.periodCount === num ? 'active' : ''}`}
                  onClick={() => onUpdateConfig({ periodCount: num })}
                >
                  {num} {t(language, 'period')}
                </button>
              ))}
            </div>
          </div>

          {/* Period Duration */}
          <div className="setting-group">
            <label className="setting-label">{t(language, 'periodLength')}</label>
            <div className="presets-row">
              {PERIOD_DURATION_PRESETS.map((mins) => (
                <button
                  key={mins}
                  type="button"
                  className={`preset-btn ${
                    config.periodDurationMinutes === mins && !showCustomPeriod
                      ? 'active'
                      : ''
                  }`}
                  onClick={() => {
                    setShowCustomPeriod(false);
                    onUpdateConfig({ periodDurationMinutes: mins });
                  }}
                >
                  {mins} min
                </button>
              ))}
              <button
                type="button"
                className={`preset-btn ${showCustomPeriod ? 'active' : ''}`}
                onClick={() => setShowCustomPeriod(true)}
              >
                {t(language, 'custom')}
              </button>
            </div>

            {showCustomPeriod && (
              <div className="custom-input-wrap">
                <input
                  type="number"
                  min="1"
                  max="60"
                  value={config.periodDurationMinutes}
                  onChange={(e) => {
                    const val = parseInt(e.target.value, 10);
                    if (!isNaN(val) && val > 0) {
                      onUpdateConfig({ periodDurationMinutes: val });
                    }
                  }}
                />
                <span className="unit-label">min</span>
              </div>
            )}
          </div>

          {/* Optional Break Toggle & Duration */}
          <div className="setting-group toggle-group">
            <div className="toggle-info">
              <span className="setting-label">{t(language, 'breakEnabled')}</span>
            </div>
            <label className="switch">
              <input
                type="checkbox"
                checked={config.breakEnabled}
                onChange={(e) => onUpdateConfig({ breakEnabled: e.target.checked })}
              />
              <span className="slider round"></span>
            </label>
          </div>

          {config.breakEnabled && (
            <div className="setting-group sub-group">
              <label className="setting-label">{t(language, 'breakLength')}</label>
              <div className="presets-row">
                {BREAK_DURATION_PRESETS.map((mins) => (
                  <button
                    key={mins}
                    type="button"
                    className={`preset-btn ${
                      config.breakDurationMinutes === mins && !showCustomBreak
                        ? 'active'
                        : ''
                    }`}
                    onClick={() => {
                      setShowCustomBreak(false);
                      onUpdateConfig({ breakDurationMinutes: mins });
                    }}
                  >
                    {mins} min
                  </button>
                ))}
                <button
                  type="button"
                  className={`preset-btn ${showCustomBreak ? 'active' : ''}`}
                  onClick={() => setShowCustomBreak(true)}
                >
                  {t(language, 'custom')}
                </button>
              </div>

              {showCustomBreak && (
                <div className="custom-input-wrap">
                  <input
                    type="number"
                    min="0"
                    max="30"
                    value={config.breakDurationMinutes}
                    onChange={(e) => {
                      const val = parseInt(e.target.value, 10);
                      if (!isNaN(val) && val >= 0) {
                        onUpdateConfig({ breakDurationMinutes: val });
                      }
                    }}
                  />
                  <span className="unit-label">min</span>
                </div>
              )}
            </div>
          )}

          {/* Overtime Configuration ("Jatkoerä") */}
          <div className="setting-group toggle-group">
            <div className="toggle-info">
              <span className="setting-label">{t(language, 'overtimeOption')}</span>
            </div>
            <label className="switch">
              <input
                type="checkbox"
                checked={config.overtimeEnabled}
                onChange={(e) => onUpdateConfig({ overtimeEnabled: e.target.checked })}
              />
              <span className="slider round"></span>
            </label>
          </div>

          {config.overtimeEnabled && (
            <div className="setting-group sub-group">
              <label className="setting-label">{t(language, 'overtimeLength')}</label>
              <div className="presets-row">
                {OVERTIME_DURATION_PRESETS.map((mins) => (
                  <button
                    key={mins}
                    type="button"
                    className={`preset-btn ${
                      config.overtimeDurationMinutes === mins ? 'active' : ''
                    }`}
                    onClick={() => onUpdateConfig({ overtimeDurationMinutes: mins })}
                  >
                    {mins} min
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Count Direction */}
          <div className="setting-group">
            <label className="setting-label">{t(language, 'countDirection')}</label>
            <div className="btn-segmented">
              <button
                type="button"
                className={`segment-btn ${config.countDirection === 'UP' ? 'active' : ''}`}
                onClick={() => onUpdateConfig({ countDirection: 'UP' as CountDirection })}
              >
                {t(language, 'countUp')}
              </button>
              <button
                type="button"
                className={`segment-btn ${config.countDirection === 'DOWN' ? 'active' : ''}`}
                onClick={() => onUpdateConfig({ countDirection: 'DOWN' as CountDirection })}
              >
                {t(language, 'countDown')}
              </button>
            </div>
          </div>

          {/* Sound & Haptics */}
          <div className="setting-group toggle-group">
            <div className="toggle-info">
              <span className="setting-label">{t(language, 'soundHorn')}</span>
            </div>
            <div className="sound-toggle-row">
              <button
                type="button"
                className="btn-test-sound"
                onClick={handleTestBuzzer}
              >
                📢 {t(language, 'testSound')}
              </button>
              <label className="switch">
                <input
                  type="checkbox"
                  checked={config.soundEnabled}
                  onChange={(e) => onUpdateConfig({ soundEnabled: e.target.checked })}
                />
                <span className="slider round"></span>
              </label>
            </div>
          </div>

          <div className="setting-group toggle-group">
            <div className="toggle-info">
              <span className="setting-label">{t(language, 'haptics')}</span>
            </div>
            <label className="switch">
              <input
                type="checkbox"
                checked={config.hapticsEnabled}
                onChange={(e) => onUpdateConfig({ hapticsEnabled: e.target.checked })}
              />
              <span className="slider round"></span>
            </label>
          </div>

          {/* Reset Entire Match */}
          <div className="setting-group reset-group">
            <button
              type="button"
              className="btn-danger-reset"
              onClick={handleResetConfirm}
            >
              ⚠️ {t(language, 'resetMatch')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
