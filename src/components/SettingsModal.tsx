import React, { useState } from 'react';
import type { MatchConfig, MatchState, Language } from '../types/timer';
import {
  PERIOD_DURATION_PRESETS,
  BREAK_DURATION_PRESETS,
  OVERTIME_DURATION_PRESETS,
} from '../constants/presets';
import { t } from '../i18n/translations';
import { formatMMSS } from '../utils/format';
import { isMatchStarted } from '../utils/timerMath';
import { Modal } from './Modal';
import { NewMatchModal } from './NewMatchModal';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: MatchConfig;
  state: MatchState;
  onUpdateConfig: (newConfig: Partial<MatchConfig>) => void;
  language: Language;
  onLanguageChange: (lang: Language) => void;
  onResetMatch: () => void;
}

interface DurationPickerProps {
  presets: number[];
  value: number;
  min: number;
  max: number;
  disabled: boolean;
  customLabel: string;
  onChange: (minutes: number) => void;
}

// Preset minute buttons plus a "Custom..." button that reveals a number input
const DurationPicker: React.FC<DurationPickerProps> = ({
  presets,
  value,
  min,
  max,
  disabled,
  customLabel,
  onChange,
}) => {
  const [showCustom, setShowCustom] = useState(!presets.includes(value));

  return (
    <>
      <div className="presets-row">
        {presets.map((mins) => (
          <button
            key={mins}
            type="button"
            className={`preset-btn ${value === mins && !showCustom ? 'active' : ''}`}
            disabled={disabled}
            onClick={() => {
              setShowCustom(false);
              onChange(mins);
            }}
          >
            {mins} min
          </button>
        ))}
        <button
          type="button"
          className={`preset-btn ${showCustom ? 'active' : ''}`}
          disabled={disabled}
          onClick={() => setShowCustom(true)}
        >
          {customLabel}
        </button>
      </div>

      {showCustom && (
        <div className="custom-input-wrap">
          <input
            type="number"
            min={min}
            max={max}
            value={value}
            disabled={disabled}
            onChange={(e) => {
              const val = parseInt(e.target.value, 10);
              if (!isNaN(val) && val >= min && val <= max) {
                onChange(val);
              }
            }}
          />
          <span className="unit-label">min</span>
        </div>
      )}
    </>
  );
};

interface ToggleRowProps {
  label: string;
  checked: boolean;
  disabled?: boolean;
  onChange: (checked: boolean) => void;
}

// The whole row is a <label>, so tapping the text toggles the switch too
const ToggleRow: React.FC<ToggleRowProps> = ({ label, checked, disabled = false, onChange }) => (
  <label className={`setting-group toggle-group ${disabled ? 'disabled' : ''}`}>
    <span className="setting-label">{label}</span>
    <span className="switch">
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange(e.target.checked)}
      />
      <span className="slider round"></span>
    </span>
  </label>
);

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  config,
  state,
  onUpdateConfig,
  language,
  onLanguageChange,
  onResetMatch,
}) => {
  const [showNewMatchConfirm, setShowNewMatchConfirm] = useState(false);

  if (!isOpen) return null;

  // Period count, length and clock direction can't change once the match has started.
  // Break and overtime settings stay editable, except while that stage is in progress.
  const formatLocked = isMatchStarted(state);
  const breakLocked = state.stage === 'BREAK';
  const overtimeLocked = state.stage === 'OVERTIME';

  const periodMs = config.periodDurationMinutes * 60 * 1000;
  const countUpEnd = formatMMSS(
    config.restartClockEachPeriod ? periodMs : config.periodCount * periodMs,
    'UP'
  ).formatted;
  const countDownStart = formatMMSS(periodMs, 'DOWN').formatted;

  return (
    <Modal onClose={onClose} className="settings-modal" ariaLabel={t(language, 'settings')}>
      <div className="modal-header">
        <div className="title-row">
          <span className="icon">⚙️</span>
          <h3>{t(language, 'settings')}</h3>
        </div>
        <button type="button" className="settings-done-btn" onClick={onClose}>
          {t(language, 'done')}
        </button>
      </div>

      <div className="settings-body">
        {/* Match format */}
        <h4 className="settings-section-title">{t(language, 'sectionMatch')}</h4>

        {formatLocked && (
          <p className="settings-lock-note">🔒 {t(language, 'formatLockedNote')}</p>
        )}

        <div className="setting-group">
          <span className="setting-label">{t(language, 'periodCount')}</span>
          <div className="btn-segmented">
            {([1, 2, 3] as const).map((num) => (
              <button
                key={num}
                type="button"
                className={`segment-btn ${config.periodCount === num ? 'active' : ''}`}
                disabled={formatLocked}
                onClick={() => onUpdateConfig({ periodCount: num })}
              >
                {num}
              </button>
            ))}
          </div>
        </div>

        <div className="setting-group">
          <span className="setting-label">{t(language, 'periodLength')}</span>
          <DurationPicker
            presets={PERIOD_DURATION_PRESETS}
            value={config.periodDurationMinutes}
            min={1}
            max={60}
            disabled={formatLocked}
            customLabel={t(language, 'custom')}
            onChange={(mins) => onUpdateConfig({ periodDurationMinutes: mins })}
          />
        </div>

        <div className="setting-group">
          <span className="setting-label">{t(language, 'countDirection')}</span>
          <div className="btn-segmented">
            <button
              type="button"
              className={`segment-btn ${config.countDirection === 'UP' ? 'active' : ''}`}
              disabled={formatLocked}
              onClick={() => onUpdateConfig({ countDirection: 'UP' })}
            >
              {t(language, 'countUp', { end: countUpEnd })}
            </button>
            <button
              type="button"
              className={`segment-btn ${config.countDirection === 'DOWN' ? 'active' : ''}`}
              disabled={formatLocked}
              onClick={() => onUpdateConfig({ countDirection: 'DOWN' })}
            >
              {t(language, 'countDown', { start: countDownStart })}
            </button>
          </div>
        </div>

        {/* Unlike the rest of the format, this can be switched at any time; the time played
            in the current period is kept */}
        {config.countDirection === 'UP' && (
          <ToggleRow
            label={t(language, 'restartClockEachPeriod')}
            checked={config.restartClockEachPeriod}
            onChange={(checked) => onUpdateConfig({ restartClockEachPeriod: checked })}
          />
        )}

        <ToggleRow
          label={t(language, 'breakEnabled')}
          checked={config.breakEnabled}
          disabled={breakLocked}
          onChange={(checked) => onUpdateConfig({ breakEnabled: checked })}
        />
        {config.breakEnabled && (
          <div className="setting-group sub-group">
            <span className="setting-label">{t(language, 'breakLength')}</span>
            <DurationPicker
              presets={BREAK_DURATION_PRESETS}
              value={config.breakDurationMinutes}
              min={1}
              max={30}
              disabled={breakLocked}
              customLabel={t(language, 'custom')}
              onChange={(mins) => onUpdateConfig({ breakDurationMinutes: mins })}
            />
          </div>
        )}

        <ToggleRow
          label={t(language, 'overtimeOption')}
          checked={config.overtimeEnabled}
          disabled={overtimeLocked}
          onChange={(checked) => onUpdateConfig({ overtimeEnabled: checked })}
        />
        {config.overtimeEnabled && (
          <div className="setting-group sub-group">
            <span className="setting-label">{t(language, 'overtimeLength')}</span>
            <DurationPicker
              presets={OVERTIME_DURATION_PRESETS}
              value={config.overtimeDurationMinutes}
              min={1}
              max={30}
              disabled={overtimeLocked}
              customLabel={t(language, 'custom')}
              onChange={(mins) => onUpdateConfig({ overtimeDurationMinutes: mins })}
            />
          </div>
        )}

        {/* Whole-match reset lives here, away from the mid-game controls on the main
            screen; it also unlocks the match format */}
        <button
          type="button"
          className="btn-danger-reset"
          onClick={() => setShowNewMatchConfirm(true)}
        >
          {t(language, 'resetMatch')}
        </button>

        {/* Tracking */}
        <h4 className="settings-section-title">{t(language, 'sectionTracking')}</h4>

        <ToggleRow
          label={t(language, 'trackScore')}
          checked={config.trackScore}
          onChange={(checked) => onUpdateConfig({ trackScore: checked })}
        />

        <ToggleRow
          label={t(language, 'trackGoalieSaves')}
          checked={config.trackGoalieSaves}
          onChange={(checked) => onUpdateConfig({ trackGoalieSaves: checked })}
        />

        {/* Device */}
        <h4 className="settings-section-title">{t(language, 'sectionDevice')}</h4>

        <div className="setting-group">
          <span className="setting-label">{t(language, 'language')}</span>
          <div className="btn-segmented">
            <button
              type="button"
              className={`segment-btn ${language === 'fi' ? 'active' : ''}`}
              onClick={() => onLanguageChange('fi')}
            >
              Suomi
            </button>
            <button
              type="button"
              className={`segment-btn ${language === 'en' ? 'active' : ''}`}
              onClick={() => onLanguageChange('en')}
            >
              English
            </button>
          </div>
        </div>

        <ToggleRow
          label={t(language, 'keepAwakeOnPause')}
          checked={config.keepAwakeOnPause}
          onChange={(checked) => onUpdateConfig({ keepAwakeOnPause: checked })}
        />

        <ToggleRow
          label={t(language, 'haptics')}
          checked={config.hapticsEnabled}
          onChange={(checked) => onUpdateConfig({ hapticsEnabled: checked })}
        />
      </div>

      {showNewMatchConfirm && (
        <NewMatchModal
          language={language}
          onConfirm={onResetMatch}
          onClose={() => setShowNewMatchConfirm(false)}
        />
      )}
    </Modal>
  );
};
