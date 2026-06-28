import { useMemo } from 'react';
import moment from 'moment';
import { getAppToday } from '../utils/dateUtils';
import { calculateStreak } from '../utils/streakUtils';
import {
  calculateLongestStreak,
  getCompletionStats,
  getConsistencyWeeks,
  getPullupHistory,
} from '../utils/statsUtils';

const HeatCell = ({ day }) => {
  if (day.isFuture) return <span className="heat-cell heat-cell--future" />;
  const title = `${moment(day.date).format('ddd, MMM D')} — ${day.completion}`;
  return <span className={`heat-cell heat-cell--${day.completion}`} title={title} />;
};

function PullupChart({ sessions }) {
  if (sessions.length === 0) {
    return <p className="trends-empty">Log some pull-ups and your progression shows up here.</p>;
  }
  const max = Math.max(...sessions.map((s) => s.reps), 1);
  const W = 280;
  const H = 90;
  const gap = 4;
  const barW = Math.max(6, (W - gap * (sessions.length - 1)) / sessions.length);

  return (
    <svg className="pullup-chart" viewBox={`0 0 ${W} ${H + 18}`} role="img" aria-label="Pull-up reps over recent sessions">
      {sessions.map((s, i) => {
        const h = Math.round((s.reps / max) * H);
        const x = i * (barW + gap);
        const y = H - h;
        return (
          <g key={s.date}>
            <rect x={x} y={y} width={barW} height={h} rx="2" className="pullup-bar" />
            <text x={x + barW / 2} y={H + 12} className="pullup-bar-label" textAnchor="middle">
              {s.reps}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

function TrendsView({ data, onBack }) {
  const stats = useMemo(() => {
    const today = getAppToday();
    return {
      current: calculateStreak(data, today),
      longest: calculateLongestStreak(data),
      last30: getCompletionStats(data, today, 30),
      weeks: getConsistencyWeeks(data, today, 12),
      pullups: getPullupHistory(data, today, 14),
    };
  }, [data]);

  return (
    <div className="trends-view">
      <div className="trends-header">
        <button className="trends-back" type="button" onClick={onBack}>
          ← Today
        </button>
        <h2 className="trends-title">Your Practice</h2>
        <span className="trends-header-spacer" />
      </div>

      <div className="trends-stats">
        <div className="trends-stat">
          <span className="trends-stat-value">{stats.current}</span>
          <span className="trends-stat-label">day streak</span>
        </div>
        <div className="trends-stat">
          <span className="trends-stat-value">{stats.longest}</span>
          <span className="trends-stat-label">longest</span>
        </div>
        <div className="trends-stat">
          <span className="trends-stat-value">{stats.last30.completed}</span>
          <span className="trends-stat-label">of 30 days</span>
        </div>
      </div>

      <section className="trends-section">
        <h3 className="trends-section-title">Consistency</h3>
        <div className="heatmap">
          {stats.weeks.map((week, i) => (
            <div className="heat-week" key={i}>
              {week.map((day) => (
                <HeatCell key={day.date} day={day} />
              ))}
            </div>
          ))}
        </div>
        <div className="heat-legend">
          <span className="heat-cell heat-cell--none" /> none
          <span className="heat-cell heat-cell--partial" /> partial
          <span className="heat-cell heat-cell--full" /> full
        </div>
      </section>

      <section className="trends-section">
        <h3 className="trends-section-title">Pull-up progression</h3>
        <PullupChart sessions={stats.pullups} />
      </section>
    </div>
  );
}

export default TrendsView;
