import React from 'react';

const BottleIcon = ({ filled }) => (
  <svg width="20" height="28" viewBox="0 0 20 28" fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* Cap */}
    <rect x="6" y="0" width="8" height="4" rx="1"
      stroke="currentColor" strokeWidth="1.5"
      fill={filled ? 'currentColor' : 'none'}
    />
    {/* Neck */}
    <rect x="7" y="4" width="6" height="3"
      stroke="currentColor" strokeWidth="1.5"
      fill={filled ? 'currentColor' : 'none'}
    />
    {/* Body */}
    <rect x="3" y="7" width="14" height="19" rx="2"
      stroke="currentColor" strokeWidth="1.5"
      fill={filled ? 'currentColor' : 'none'}
    />
  </svg>
);

function HydrationRow({ bottles, onSetBottles, disabled }) {
  const allFilled = bottles >= 3;

  const handleBottleClick = (index) => {
    if (disabled) return;
    const bottleNum = index + 1;
    // Tap filled bottle at the current count → unfill it (go back one)
    // Tap any other bottle → fill up to that bottle
    if (bottleNum === bottles) {
      onSetBottles(bottles - 1);
    } else {
      onSetBottles(bottleNum);
    }
  };

  const rowClasses = [
    'hydration-row',
    disabled && 'hydration-row--disabled',
  ].filter(Boolean).join(' ');

  const labelClasses = [
    'habit-label',
    allFilled && 'habit-label--checked',
  ].filter(Boolean).join(' ');

  return (
    <div className={rowClasses}>
      <span className={labelClasses}>Hydrate</span>
      <div className="hydration-bottles">
        {[0, 1, 2].map((i) => (
          <button
            key={i}
            className={`hydration-bottle ${i < bottles ? 'hydration-bottle--filled' : ''}`}
            onClick={() => handleBottleClick(i)}
            disabled={disabled}
            type="button"
            aria-label={`Bottle ${i + 1} of 3`}
          >
            <BottleIcon filled={i < bottles} />
          </button>
        ))}
      </div>
    </div>
  );
}

export default HydrationRow;
