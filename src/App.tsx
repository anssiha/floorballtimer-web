import React, { useState, useEffect } from 'react';
import { useTimer } from './hooks/useTimer';
import { useUpdateAvailable } from './hooks/useUpdateAvailable';
import { Header } from './components/Header';
import { UpdateBanner } from './components/UpdateBanner';
import { TimerDisplay } from './components/TimerDisplay';
import { Controls } from './components/Controls';
import { SettingsModal } from './components/SettingsModal';
import { GoalieSaveCards } from './components/GoalieSaveCards';
import { ScoreBoard } from './components/ScoreBoard';
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
    adjustSeconds,
    adjustMinutes,
    proceedToNextStage,
    revertToPreviousStage,
    updateConfig,
    setLanguage,
    addGoalieSave,
    removeGoalieSave,
    switchGoalie,
    addGoalie,
    renameGoalie,
    removeGoalie,
    updateTeamName,
    addGoal,
    removeGoal,
  } = useTimer();

  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const updateAvailable = useUpdateAvailable();

  // Keyboard shortcut: Spacebar toggles start/pause, whichever button has focus.
  // Without this, Space would "click" the last tapped button (e.g. Reset) instead.
  useEffect(() => {
    const isShortcutSpace = (e: KeyboardEvent) => {
      if (e.code !== 'Space') return false;
      // Leave Space alone inside dialogs and text fields
      if (document.querySelector('[aria-modal="true"]')) return false;
      const target = e.target as HTMLElement | null;
      if (target?.closest('input, textarea, select, [contenteditable="true"]')) return false;
      return true;
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isShortcutSpace(e)) return;
      e.preventDefault();
      if (!e.repeat) toggleTimer();
    };
    // Buttons activate on keyup in some browsers, so block that too
    const handleKeyUp = (e: KeyboardEvent) => {
      if (isShortcutSpace(e)) e.preventDefault();
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [toggleTimer]);

  return (
    <div className="app-container">
      <Header
        language={language}
        onOpenSettings={() => setIsSettingsModalOpen(true)}
      />

      {/* Hidden while the clock runs, so a tap during play can't reload the app */}
      {updateAvailable && state.status !== 'RUNNING' && <UpdateBanner language={language} />}

      <main className="main-content">
        {config.trackScore && (
          <ScoreBoard
            state={state}
            config={config}
            language={language}
            onAddGoal={addGoal}
            onRemoveGoal={removeGoal}
            onRenameTeam={updateTeamName}
          />
        )}

        <TimerDisplay
          state={state}
          config={config}
          language={language}
          onAdjustMinutes={adjustMinutes}
          onAdjustSeconds={adjustSeconds}
          isAlertAcknowledged={isAlertAcknowledged}
        />

        {config.trackGoalieSaves && (
          <GoalieSaveCards
            state={state}
            config={config}
            language={language}
            onAddSave={addGoalieSave}
            onRemoveSave={removeGoalieSave}
            onSwitchGoalie={switchGoalie}
            onAddGoalie={addGoalie}
            onRenameGoalie={renameGoalie}
            onRemoveGoalie={removeGoalie}
            onRenameTeam={updateTeamName}
          />
        )}

        <Controls
          state={state}
          config={config}
          language={language}
          onToggleTimer={toggleTimer}
          onResetPeriod={resetPeriod}
          onResetMatch={resetMatch}
          onProceedNext={proceedToNextStage}
          onRevertPrevious={revertToPreviousStage}
        />
      </main>

      {/* Match Configuration Settings Modal */}
      <SettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        config={config}
        state={state}
        onUpdateConfig={updateConfig}
        language={language}
        onLanguageChange={setLanguage}
        onResetMatch={resetMatch}
      />
    </div>
  );
};

export default App;
