import { useState } from 'react';
import {
  getWeekStartKey,
  getDailyTargets,
  resolveWeekGoals,
  getMobilityIndex,
} from '../utils/scheduleUtils';
import { mobilityPractices } from '../data/practicesData';

// A collapsed, glanceable peek at tomorrow's plan — workout, pull-ups, and
// which stretch routine — so the day can be planned around without pulling
// focus from today. Collapsed by default.
function TomorrowPreview({ date, weekGoals }) {
  const [open, setOpen] = useState(false);

  const iso = date.isoWeekday();
  const sunday = iso === 7;
  const goals = resolveWeekGoals(weekGoals, getWeekStartKey(date));
  const targets = getDailyTargets(iso, goals);
  const stretch = sunday ? null : mobilityPractices[getMobilityIndex(iso) % mobilityPractices.length];

  let workoutText;
  if (targets?.burpees) workoutText = `${targets.burpees} burpees`;
  else if (targets?.navySeals) workoutText = `${targets.navySeals} navy seals`;
  else workoutText = 'Rest — no burpees';

  return (
    <section className="tomorrow">
      <button
        className="tomorrow-toggle"
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
      >
        <span className="tomorrow-label">Tomorrow · {date.format('dddd')}</span>
        <span className={`tomorrow-chevron${open ? ' tomorrow-chevron--open' : ''}`}>›</span>
      </button>

      {open && (
        <div className="tomorrow-body">
          {sunday ? (
            <p className="tomorrow-line">Full rest day</p>
          ) : (
            <>
              <p className="tomorrow-line">
                <span className="tomorrow-key">Workout</span>
                <span className="tomorrow-value">{workoutText}</span>
              </p>
              {targets?.pullups > 0 && (
                <p className="tomorrow-line">
                  <span className="tomorrow-key">Pull-ups</span>
                  <span className="tomorrow-value">{targets.pullups}</span>
                </p>
              )}
              {stretch && (
                <p className="tomorrow-line">
                  <span className="tomorrow-key">Stretch</span>
                  <a
                    className="tomorrow-link"
                    href={stretch.url}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {stretch.name}
                  </a>
                </p>
              )}
            </>
          )}
        </div>
      )}
    </section>
  );
}

export default TomorrowPreview;
