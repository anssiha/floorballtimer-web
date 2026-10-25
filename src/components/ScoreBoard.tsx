import React, { useState } from 'react';
import type { MatchState, MatchConfig, Language } from '../types/timer';
import { t } from '../i18n/translations';
import { getTeamLabel } from '../utils/goalie';
import { getStageGoals, getTeamGoals } from '../utils/score';
import { TeamNamesModal } from './TeamNamesModal';
import { ScoreSummaryModal } from './ScoreSummaryModal';

interface ScoreBoardProps {
  state: MatchState;
  config: MatchConfig;
  language: Language;
  onAddGoal: (team: 'home' | 'away') => void;
  onRemoveGoal: (team: 'home' | 'away') => void;
  onRenameTeam: (team: 'home' | 'away', name: string) => void;
}

// Compact score strip above the timer: tap a score for +1, the small button for -1.
// Kept smaller than the clock on purpose, since goals are rare compared to clock use.
export const ScoreBoard: React.FC<ScoreBoardProps> = ({
  state,
  config,
  language,
  onAddGoal,
  onRemoveGoal,
  onRenameTeam,
}) => {
  const [showNames, setShowNames] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  // Bumped on every +1/-1 so the feedback animation elements remount and replay
  const [feedback, setFeedback] = useState<
    Partial<Record<'home' | 'away', { kind: 'add' | 'remove'; count: number }>>
  >({});

  const giveFeedback = (team: 'home' | 'away', kind: 'add' | 'remove') => {
    setFeedback((prev) => ({ ...prev, [team]: { kind, count: (prev[team]?.count ?? 0) + 1 } }));
  };

  const { score, goalieSaves, stage, currentPeriod } = state;

  const renderTeam = (team: 'home' | 'away') => {
    const teamLabel = getTeamLabel(goalieSaves[team], team, language);
    const total = getTeamGoals(score[team]);
    // -1 only undoes goals of the current period, like the saves -1
    const stageGoals = getStageGoals(score[team], stage, currentPeriod);

    const teamFeedback = feedback[team];
    const feedbackKey = teamFeedback ? `${teamFeedback.kind}-${teamFeedback.count}` : 'none';

    return (
      <div className={`score-team score-team-${team}`}>
        {teamFeedback && (
          <span
            key={feedbackKey}
            className={`save-flash save-flash-${teamFeedback.kind}`}
            aria-hidden="true"
          />
        )}

        <button
          type="button"
          className="score-team-name"
          onClick={() => setShowNames(true)}
          title={t(language, 'teamName')}
        >
          {teamLabel}
        </button>

        <div className="score-team-row">
          <button
            type="button"
            className="btn-goal-plus"
            onClick={() => {
              onAddGoal(team);
              giveFeedback(team, 'add');
            }}
            aria-label={`${teamLabel}: +1 ${t(language, 'addGoal').toLowerCase()} (${total})`}
          >
            <span
              key={feedbackKey}
              className={`score-num ${teamFeedback ? `save-pop-${teamFeedback.kind}` : ''}`}
            >
              {total}
            </span>
            <span className="goal-plus-label">+</span>
          </button>
          <button
            type="button"
            className="btn-goal-minus"
            onClick={() => {
              onRemoveGoal(team);
              giveFeedback(team, 'remove');
            }}
            disabled={stageGoals <= 0}
            aria-label={`${teamLabel}: ${t(language, 'removeGoal')}`}
            title={t(language, 'removeGoal')}
          >
            −1
          </button>
        </div>
      </div>
    );
  };

  return (
    <section className="scoreboard" aria-label={t(language, 'goals')}>
      {renderTeam('home')}

      {/* Tapping the separator opens the per-period breakdown */}
      <button
        type="button"
        className="score-separator"
        onClick={() => setShowSummary(true)}
        title={t(language, 'scoreSummary')}
        aria-label={t(language, 'scoreSummary')}
      >
        –
      </button>

      {renderTeam('away')}

      {showNames && (
        <TeamNamesModal
          goalieSaves={goalieSaves}
          language={language}
          onRenameTeam={onRenameTeam}
          onClose={() => setShowNames(false)}
        />
      )}

      {showSummary && (
        <ScoreSummaryModal
          state={state}
          config={config}
          language={language}
          onClose={() => setShowSummary(false)}
        />
      )}
    </section>
  );
};
