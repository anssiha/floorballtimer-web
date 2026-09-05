import React, { useState, useEffect } from 'react';
import { useTimer } from './hooks/useTimer';
import { Header } from './components/Header';
import { TimerDisplay } from './components/TimerDisplay';
import { Controls } from './components/Controls';
import { TimeAdjustModal } from './components/TimeAdjustModal';
import { SettingsModal } from './components/SettingsModal';
import { PeriodEndModal } from './components/PeriodEndModal';
import './App.css';

export const App: React.FC = () => {
  const {
    state,
    config,
    language,
    isAlertAcknowledged,
    toggleTimer,
    resetPeriod,
    resetMatch,
    adjustRemainingMs,
    proceedToNextStage,
    updateConfig,
    setLanguage,
    acknowledgeAlert,
  } = useTimer();

  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);

  // Keyboard shortcut: Spacebar toggles start/pause if not in modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isAdjustModalOpen || isSettingsModalOpen) return;
      if (e.code === 'Space' && e.target === document.body) {
        e.preventDefault();
        toggleTimer();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [toggleTimer, isAdjustModalOpen, isSettingsModalOpen]);

  return (
    <div className="app-container">
      <Header
        language={language}
        onOpenSettings={() => setIsSettingsModalOpen(true)}
      />

      <main className="main-content">
        <TimerDisplay
          state={state}
          config={config}
          language={language}
          onOpenAdjust={() => setIsAdjustModalOpen(true)}
          isAlertAcknowledged={isAlertAcknowledged}
        />

        <Controls
          state={state}
          config={config}
          language={language}
          onToggleTimer={toggleTimer}
          onResetPeriod={resetPeriod}
          onResetMatch={resetMatch}
          onProceedNext={proceedToNextStage}
        />
      </main>

      {/* Manual Time Adjustment Modal */}
      {isAdjustModalOpen && (
        <TimeAdjustModal
          isOpen={isAdjustModalOpen}
          onClose={() => setIsAdjustModalOpen(false)}
          currentRemainingMs={state.remainingMs}
          onApply={adjustRemainingMs}
          language={language}
        />
      )}

      {/* Match Configuration Settings Modal */}
      <SettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        config={config}
        onUpdateConfig={updateConfig}
        language={language}
        onLanguageChange={setLanguage}
        onResetMatch={resetMatch}
      />

      {/* Period Ended Alert Dialog */}
      <PeriodEndModal
        isOpen={state.status === 'PERIOD_ENDED' && !isAlertAcknowledged}
        state={state}
        config={config}
        language={language}
        onAcknowledge={acknowledgeAlert}
        onProceedNext={proceedToNextStage}
      />
    </div>
  );
};

export default App;
