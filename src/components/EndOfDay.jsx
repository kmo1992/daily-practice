import React from 'react';
import EatAtTableRow from './EatAtTableRow';
import HydrationRow from './HydrationRow';

function EndOfDay({ habits, onSetEatAtTable, onSetHydration, disabled }) {
  // Normalize: legacy boolean true → 3, false/undefined → 0
  const plates = habits.eatAtTable === true ? 3 : (Number(habits.eatAtTable) || 0);
  const bottles = habits.hydrate === true ? 3 : (Number(habits.hydrate) || 0);

  return (
    <section className="section">
      <h2 className="section-header">Daily Habits</h2>

      <HydrationRow
        bottles={bottles}
        onSetBottles={onSetHydration}
        disabled={disabled}
      />

      <EatAtTableRow
        plates={plates}
        onSetPlates={onSetEatAtTable}
        disabled={disabled}
      />
    </section>
  );
}

export default EndOfDay;
