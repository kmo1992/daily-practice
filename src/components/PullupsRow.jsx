const CheckIcon = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="2.5 7.5 5.5 10.5 11.5 3.5" />
  </svg>
);

// Pull-ups row: a checkbox for "done" plus a stepper to log the actual reps.
// `count` is the reps completed today; `target` is the day's goal (for context).
function PullupsRow({ count, target, disabled, onSetCount }) {
  const done = count > 0;

  const handleToggle = () => {
    if (disabled) return;
    // Tap to complete to the target (min 1); tap again to clear.
    onSetCount(done ? 0 : Math.max(1, target || 0));
  };

  const adjust = (delta) => (e) => {
    e.stopPropagation();
    if (disabled) return;
    onSetCount(Math.max(0, count + delta));
  };

  const rowClasses = ['habit-row', 'pullups-row', disabled && 'habit-row--disabled']
    .filter(Boolean).join(' ');
  const checkboxClasses = ['habit-checkbox', done && 'habit-checkbox--checked']
    .filter(Boolean).join(' ');
  const labelClasses = ['habit-label', done && 'habit-label--checked']
    .filter(Boolean).join(' ');

  return (
    <div
      className={rowClasses}
      onClick={handleToggle}
      role="button"
      tabIndex={disabled ? -1 : 0}
    >
      <div className={checkboxClasses}>
        {done && <CheckIcon />}
      </div>
      <span className={labelClasses}>Pull-ups</span>
      <div className="pullups-stepper" onClick={(e) => e.stopPropagation()}>
        <button
          className="pullups-step"
          type="button"
          onClick={adjust(-1)}
          disabled={disabled || count <= 0}
          aria-label="One fewer pull-up"
        >
          −
        </button>
        <span className="pullups-count">
          {count}
          {target > 0 && <span className="pullups-target">/{target}</span>}
        </span>
        <button
          className="pullups-step"
          type="button"
          onClick={adjust(1)}
          disabled={disabled}
          aria-label="One more pull-up"
        >
          +
        </button>
      </div>
    </div>
  );
}

export default PullupsRow;
