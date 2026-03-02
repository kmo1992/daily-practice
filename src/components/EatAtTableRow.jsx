import React from 'react';

const CheckIcon = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="2.5 7.5 5.5 10.5 11.5 3.5" />
  </svg>
);

const UtensilIcon = ({ filled }) => (
  <svg width="18" height="24" viewBox="0 0 18 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* Fork */}
    <g stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" fill={filled ? 'currentColor' : 'none'}>
      <line x1="2" y1="2" x2="2" y2="9" />
      <line x1="5" y1="2" x2="5" y2="9" />
      <line x1="8" y1="2" x2="8" y2="9" />
      <path d="M2 9 Q2 13 5 13 Q8 13 8 9" />
      <line x1="5" y1="13" x2="5" y2="22" />
    </g>
    {/* Knife */}
    <g stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" fill={filled ? 'currentColor' : 'none'}>
      <path d="M14 2 L14 13 Q14 15 13 15 L13 22" />
      <path d="M14 2 Q17 6 14 13" />
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
