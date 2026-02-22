import React from 'react';
import HabitRow from './HabitRow';
import JournalEntry from './JournalEntry';

function EndOfDay({ habits, journal, onToggleHabit, onSaveJournal, disabled }) {
  return (
    <section className="section">
      <h2 className="section-header">End of Day</h2>

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

      <JournalEntry
        text={journal}
        onSave={onSaveJournal}
        disabled={disabled}
        onAutoCheck={() => onToggleHabit('journal', true)}
      />
    </section>
  );
}

export default EndOfDay;
