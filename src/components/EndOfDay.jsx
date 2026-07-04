import HydrationRow from './HydrationRow';

function EndOfDay({ habits, onSetHydration, disabled }) {
  // Normalize: legacy boolean true → 3, false/undefined → 0
  const bottles = habits.hydrate === true ? 3 : (Number(habits.hydrate) || 0);

  return (
    <section className="section">
      <h2 className="section-header">Hydration</h2>

      <HydrationRow
        bottles={bottles}
        onSetBottles={onSetHydration}
        disabled={disabled}
      />
    </section>
  );
}

export default EndOfDay;
