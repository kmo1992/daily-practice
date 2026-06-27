import { useState, useEffect } from 'react';
import { getDailyTargets } from '../utils/scheduleUtils';

// Exercises that can appear in a day's numbers, in display order
const FIELDS = [
  { key: 'burpees', label: 'Burpees' },
  { key: 'navySeals', label: 'Navy seals' },
  { key: 'pullups', label: 'Pull-ups' },
];

function MorningTargets({ isoWeekday, weekGoals, dayData, isToday, disabled, onAccept }) {
  const computed = getDailyTargets(isoWeekday, weekGoals);
  const accepted = dayData.acceptedTargets || null;
  // Show accepted numbers if you've locked them in, otherwise the proposed ones
  const source = accepted || computed;

  const activeFields = FIELDS.filter((f) => source && source[f.key] != null);
  const sourceKey = activeFields.map((f) => `${f.key}:${source[f.key]}`).join('|');

  const [editing, setEditing] = useState(false);
  const [values, setValues] = useState({});

  // Seed the inputs whenever the underlying numbers change (day change, goals load)
  useEffect(() => {
    const init = {};
    activeFields.forEach((f) => { init[f.key] = String(source[f.key]); });
    setValues(init);
    setEditing(false);
  }, [sourceKey]); // eslint-disable-line react-hooks/exhaustive-deps

  if (activeFields.length === 0) return null;

  const showEditor = isToday && !disabled && (!accepted || editing);

  const handleAccept = () => {
    const result = {};
    activeFields.forEach((f) => {
      result[f.key] = parseInt(values[f.key], 10) || 0;
    });
    onAccept(result);
    setEditing(false);
  };

  if (!showEditor) {
    const summary = activeFields
      .map((f) => `${source[f.key]} ${f.label.toLowerCase()}`)
      .join(' · ');
    return (
      <div className={`daily-targets${accepted ? ' daily-targets--accepted' : ''}`}>
        {accepted && <span className="daily-targets-check">✓</span>}
        {summary}
        {isToday && !disabled && accepted && (
          <button
            type="button"
            className="daily-targets-edit"
            onClick={() => setEditing(true)}
          >
            Adjust
          </button>
        )}
      </div>
    );
  }

  return (
    <section className="morning-targets">
      <h2 className="section-header morning-targets-header">Today&apos;s Numbers</h2>
      <div className="targets-accept-grid">
        {activeFields.map((f) => (
          <div className="targets-accept-field" key={f.key}>
            <input
              className="targets-accept-input"
              type="number"
              min="0"
              inputMode="numeric"
              value={values[f.key] ?? ''}
              onChange={(e) =>
                setValues((prev) => ({ ...prev, [f.key]: e.target.value }))
              }
            />
            <span className="targets-accept-label">{f.label}</span>
          </div>
        ))}
      </div>
      <button type="button" className="targets-accept-btn" onClick={handleAccept}>
        Accept today&apos;s numbers
      </button>
    </section>
  );
}

export default MorningTargets;
