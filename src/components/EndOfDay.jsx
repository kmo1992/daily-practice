import React from 'react';
import HabitRow from './HabitRow';

function EndOfDay({ habits, onToggleHabit, disabled }) {
  return (
    <section className="section">
      <h2 className="section-header">Daily Habits</h2>

      <HabitRow
        label="Eat at the table"
        checked={!!habits.eatAtTable}
        onToggle={() => onToggleHabit('eatAtTable')}
        disabled={disabled}
      />

      <HabitRow
        label="Hydrate"
        checked={!!habits.hydrate}
        onToggle={() => onToggleHabit('hydrate')}
        disabled={disabled}
      />
    </section>
  );
}

export default EndOfDay;
