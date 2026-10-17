import React from 'react';
import type { GoalieSavesState, Language, MatchConfig, MatchState } from '../types/timer';
import { t } from '../i18n/translations';
import { getSavesTable, getTeamLabel } from '../utils/goalie';
import { Modal } from './Modal';

interface SaveSummaryModalProps {
  goalieSaves: GoalieSavesState;
  config: MatchConfig;
  state: Pick<MatchState, 'stage' | 'currentPeriod' | 'status'>;
  language: Language;
  onClose: () => void;
}

const cell = (value: number | null) => (value === null ? '–' : value);

// Saves per period and in total for both teams, one table per team with a row per goalie
export const SaveSummaryModal: React.FC<SaveSummaryModalProps> = ({
  goalieSaves,
  config,
  state,
  language,
  onClose,
}) => {
  const overtimeReached = state.stage === 'OVERTIME';
  const options = {
    periodCount: config.periodCount,
    playedPeriods: overtimeReached ? config.periodCount : state.currentPeriod,
    overtimePlayed: overtimeReached,
  };

  const renderTeam = (team: 'home' | 'away') => {
    const teamData = goalieSaves[team];
    const { rows, totals } = getSavesTable(teamData, options);
    const showOvertime = config.overtimeEnabled || totals.overtime !== null;

    return (
      <section className={`saves-summary-team saves-summary-${team}`} key={team}>
        <h4>{getTeamLabel(teamData, team, language)}</h4>
        <table className="saves-table">
          <thead>
            <tr>
              <th scope="col">{t(language, 'goalie')}</th>
              {totals.periods.map((_, i) => (
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
              <tr key={row.id}>
                <th scope="row">{row.name}</th>
                {row.periods.map((value, i) => (
                  <td key={i}>{cell(value)}</td>
                ))}
                {showOvertime && <td>{cell(row.overtime)}</td>}
                <td className="saves-total-cell">{row.total}</td>
              </tr>
            ))}
          </tbody>
          {rows.length > 1 && (
            <tfoot>
              <tr>
                <th scope="row">{t(language, 'savesTotal')}</th>
                {totals.periods.map((value, i) => (
                  <td key={i}>{cell(value)}</td>
                ))}
                {showOvertime && <td>{cell(totals.overtime)}</td>}
                <td className="saves-total-cell">{totals.total}</td>
              </tr>
            </tfoot>
          )}
        </table>
      </section>
    );
  };

  return (
    <Modal onClose={onClose} className="saves-summary-modal" ariaLabel={t(language, 'savesSummary')}>
      <div className="modal-header">
        <div className="title-row">
          <span className="icon">🥅</span>
          <h3>{t(language, 'savesSummary')}</h3>
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
        {renderTeam('home')}
        {renderTeam('away')}
      </div>
    </Modal>
  );
};
