import React from 'react';

const CheckIcon = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="2.5 7.5 5.5 10.5 11.5 3.5" />
  </svg>
);

const UtensilIcon = ({ filled }) => (
  <svg width="22" height="22" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* Fork: bottom-left to top-right */}
    <g stroke="currentColor" strokeWidth={filled ? 2 : 1.5} strokeLinecap="round" strokeLinejoin="round">
      <line x1="3" y1="19" x2="9" y2="13" />
      <line x1="9" y1="13" x2="7" y2="6" />
      <line x1="9" y1="13" x2="11" y2="8" />
      <line x1="9" y1="13" x2="14" y2="10" />
    </g>
    {/* Knife: top-left to bottom-right */}
    <g stroke="currentColor" strokeWidth={filled ? 2 : 1.5} strokeLinecap="round" strokeLinejoin="round">
      <line x1="19" y1="19" x2="12" y2="12" />
      <line x1="12" y1="12" x2="5" y2="3" />
      <line x1="5" y1="3" x2="9" y2="3" />
      <line x1="9" y1="3" x2="12" y2="12" />
    </g>
  </svg>
);

function EatAtTableRow({ plates, onSetPlates, disabled }) {
  const allFilled = plates >= 3;

  const handlePlateClick = (index) => {
    if (disabled) return;
    const plateNum = index + 1;
    if (plateNum === plates) {
      onSetPlates(plates - 1);
    } else {
      onSetPlates(plateNum);
    }
  };

  const rowClasses = [
    'tally-row',
    disabled && 'tally-row--disabled',
  ].filter(Boolean).join(' ');

  const labelClasses = [
    'habit-label',
    allFilled && 'habit-label--checked',
  ].filter(Boolean).join(' ');

  const checkboxClasses = [
    'habit-checkbox',
    'tally-checkbox',
    allFilled && 'habit-checkbox--checked',
  ].filter(Boolean).join(' ');

  return (
    <div className={rowClasses}>
      <div className={checkboxClasses}>
        {allFilled && <CheckIcon />}
      </div>
      <span className={labelClasses}>Eat at table</span>
      <div className="tally-items">
        {[0, 1, 2].map((i) => (
          <button
            key={i}
            className={`tally-item ${i < plates ? 'tally-item--filled' : ''}`}
            onClick={() => handlePlateClick(i)}
            disabled={disabled}
            type="button"
            aria-label={`Meal ${i + 1} of 3`}
          >
            <UtensilIcon filled={i < plates} />
          </button>
        ))}
      </div>
    </div>
  );
}

export default EatAtTableRow;
