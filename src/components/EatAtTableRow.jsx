import React from 'react';

const CheckIcon = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="2.5 7.5 5.5 10.5 11.5 3.5" />
  </svg>
);

const UtensilIcon = ({ filled }) => (
  <svg width="20" height="24" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="1.5"
    strokeLinecap="round" strokeLinejoin="round">
    {/* Fork: closed shape for fill + handle */}
    <path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2H3Z"
      fill={filled ? 'currentColor' : 'none'} />
    <line x1="7" y1="11" x2="7" y2="22" />
    {/* Knife: closed blade + handle */}
    <path d="M16 7a5 5 0 0 1 5-5v13h-3a2 2 0 0 1-2-2V7Z"
      fill={filled ? 'currentColor' : 'none'} />
    <line x1="18" y1="15" x2="18" y2="22" />
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
