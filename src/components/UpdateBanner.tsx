import React from 'react';
import type { Language } from '../types/timer';
import { t } from '../i18n/translations';

interface UpdateBannerProps {
  language: Language;
}

// A new version is ready; reloading is left to the user so a running match is never interrupted.
// The match is restored from storage on reload.
export const UpdateBanner: React.FC<UpdateBannerProps> = ({ language }) => (
  <div className="update-banner" role="status">
    <span className="update-banner-text">{t(language, 'updateAvailable')}</span>
    <button type="button" className="update-banner-btn" onClick={() => window.location.reload()}>
      {t(language, 'updateReload')}
    </button>
  </div>
);
