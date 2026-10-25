import React from 'react';
import type { Language, MatchConfig, MatchState } from '../types/timer';
import { t } from '../i18n/translations';
import { getTeamLabel } from '../utils/goalie';
import { getScoreRow } from '../utils/score';
import { Modal } from './Modal';

interface ScoreSummaryModalProps {
  state: Pick<MatchState, 'stage' | 'currentPeriod' | 'score' | 'goalieSaves'>;
  config: MatchConfig;
  language: Language;
  onClose: () => void;
}

const cell = (value: number | null) => (value === null ? '–' : value);

// Goals per period and in total, one row per team
export const ScoreSummaryModal: React.FC<ScoreSummaryModalProps> = ({
  state,
  config,
  language,
  onClose,
}) => {
  const overtimeReached = state.stage === 'OVERTIME';
  const options = {
    periodCount: config.periodCount,
    playedPeriods: overtimeReached ? config.periodCount : state.currentPeriod,
    overtimePlayed: overtimeReached,
  };
  const rows = (['home', 'away'] as const).map((team) => ({
    team,
    label: getTeamLabel(state.goalieSaves[team], team, language),
    ...getScoreRow(state.score[team], options),
  }));
  const showOvertime = config.overtimeEnabled || rows.some((r) => r.overtime !== null);

  return (
    <Modal onClose={onClose} className="saves-summary-modal" ariaLabel={t(language, 'scoreSummary')}>
      <div className="modal-header">
        <div className="title-row">
          <span className="icon">🏑</span>
          <h3>{t(language, 'scoreSummary')}</h3>
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
      <div className="saves-summary-body">
        <table className="saves-table">
          <thead>
            <tr>
              <th scope="col">{t(language, 'goals')}</th>
              {rows[0].periods.map((_, i) => (
                <th scope="col" key={i}>
                  {t(language, 'savesPeriodShort')}
                  {i + 1}
                </th>
              ))}
              {showOvertime && <th scope="col">{t(language, 'overtimeShort')}</th>}
              <th scope="col">{t(language, 'savesTotal')}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.team} className={`score-summary-${row.team}`}>
                <th scope="row">{row.label}</th>
                {row.periods.map((value, i) => (
                  <td key={i}>{cell(value)}</td>
                ))}
                {showOvertime && <td>{cell(row.overtime)}</td>}
                <td className="saves-total-cell">{row.total}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Modal>
  );
};
