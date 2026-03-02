import React from 'react';

const CheckIcon = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="2.5 7.5 5.5 10.5 11.5 3.5" />
  </svg>
);

const PlateIcon = ({ filled }) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* Plate rim */}
    <ellipse cx="12" cy="13" rx="10" ry="7"
      stroke="currentColor" strokeWidth="1.5"
      fill={filled ? 'currentColor' : 'none'}
    />
    {/* Inner plate */}
    <ellipse cx="12" cy="12" rx="6" ry="4"
      stroke="currentColor" strokeWidth="1"
      fill={filled ? 'currentColor' : 'none'}
    />
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
            <PlateIcon filled={i < plates} />
          </button>
        ))}
      </div>
    </div>
  );
}

export default EatAtTableRow;
