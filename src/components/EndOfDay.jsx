import React from 'react';
import HabitRow from './HabitRow';
import HydrationRow from './HydrationRow';

function EndOfDay({ habits, onToggleHabit, onSetHydration, disabled }) {
  // Normalize hydrate: legacy boolean true → 3, false/undefined → 0
  const bottles = habits.hydrate === true ? 3 : (Number(habits.hydrate) || 0);

  return (
    <section className="section">
      <h2 className="section-header">Daily Habits</h2>

      <HabitRow
        label="Eat at the table"
        checked={!!habits.eatAtTable}
        onToggle={() => onToggleHabit('eatAtTable')}
        disabled={disabled}
      />

      <HydrationRow
        bottles={bottles}
        onSetBottles={onSetHydration}
        disabled={disabled}
      />
    </section>
  );
}

export default EndOfDay;
