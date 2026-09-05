import React, { useState, useEffect } from 'react';
import type { Language } from '../types/timer';
import { t } from '../i18n/translations';
import { setWakeLockListener } from '../services/wakeLock';

interface HeaderProps {
  language: Language;
  onLanguageChange: (lang: Language) => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
  onOpenSettings: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  language,
  onLanguageChange,
  soundEnabled,
  onToggleSound,
  onOpenSettings,
}) => {
  const [wakeLockActive, setWakeLockActive] = useState(false);

  useEffect(() => {
    return setWakeLockListener((active) => {
      setWakeLockActive(active);
    });
  }, []);

  return (
    <header className="app-header">
      <div className="header-left">
        <div className="app-badge">
          <span className="sports-ball-icon">🏑</span>
          <span className="app-title">{t(language, 'appTitle')}</span>
        </div>
      </div>

      <div className="header-actions">
        {/* Wake Lock Status Indicator */}
        <div
          className={`status-pill ${wakeLockActive ? 'active' : ''}`}
          title={t(language, wakeLockActive ? 'wakeLockActive' : 'wakeLockInactive')}
          aria-label={t(language, wakeLockActive ? 'wakeLockActive' : 'wakeLockInactive')}
        >
          <span className="status-dot"></span>
          <span className="status-text">
            {wakeLockActive ? 'WAKE LOCK' : 'IDLE'}
          </span>
        </div>

        {/* Sound Horn Toggle */}
        <button
          type="button"
          className={`icon-btn ${soundEnabled ? 'active' : 'muted'}`}
          onClick={onToggleSound}
          title={t(language, 'soundHorn')}
          aria-label={t(language, 'soundHorn')}
        >
          {soundEnabled ? (
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
              <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path>
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
              <line x1="23" y1="9" x2="17" y2="15"></line>
              <line x1="17" y1="9" x2="23" y2="15"></line>
            </svg>
          )}
        </button>

        {/* Language Switcher */}
        <div className="lang-switcher">
          <button
            type="button"
            className={`lang-btn ${language === 'fi' ? 'active' : ''}`}
            onClick={() => onLanguageChange('fi')}
          >
            FI
          </button>
          <button
            type="button"
            className={`lang-btn ${language === 'en' ? 'active' : ''}`}
            onClick={() => onLanguageChange('en')}
          >
            EN
          </button>
        </div>

        {/* Settings button */}
        <button
          type="button"
          className="icon-btn settings-btn"
          onClick={onOpenSettings}
          title={t(language, 'settings')}
          aria-label={t(language, 'settings')}
        >
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="3"></circle>
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
          </svg>
        </button>
      </div>
    </header>
  );
};
