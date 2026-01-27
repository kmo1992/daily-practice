// src/components/Stepper.jsx

import React from 'react';

function Stepper({
  value = 0,
  min = 0,
  max = 0,
  step = 1,
  quickAdd = 5,
  disabled = false,
  onChange = () => {},
  ariaLabel = 'Stepper',
}) {
  const safeMin = Number.isFinite(min) ? min : 0;
  const safeMax = Number.isFinite(max) ? max : safeMin;
  const boundedMax = safeMax < safeMin ? safeMin : safeMax;
  const safeValue = Number.isFinite(value) ? value : safeMin;
  const clampedValue = Math.max(safeMin, Math.min(boundedMax, safeValue));

  const handleChange = (nextValue) => {
    if (disabled) {
      return;
    }
    const clamped = Math.max(safeMin, Math.min(boundedMax, nextValue));
    onChange(clamped);
  };

  const canDecrement = clampedValue > safeMin;
  const canIncrement = clampedValue < boundedMax;

  return (
    <div className={`stepper${disabled ? ' disabled' : ''}`} role="group" aria-label={ariaLabel}>
      <div className="stepper-core">
        <button
          className="stepper-btn"
          type="button"
          onClick={() => handleChange(clampedValue - step)}
          disabled={disabled || !canDecrement}
          aria-label="Decrease reps"
        >
          −
        </button>
        <div className="stepper-value" aria-live="polite">
          {clampedValue}
        </div>
        <button
          className="stepper-btn"
          type="button"
          onClick={() => handleChange(clampedValue + step)}
          disabled={disabled || !canIncrement}
          aria-label="Increase reps"
        >
          +
        </button>
      </div>
      <button
        className="stepper-quick"
        type="button"
        onClick={() => handleChange(clampedValue + quickAdd)}
        disabled={disabled || !canIncrement}
      >
        +{quickAdd}
      </button>
    </div>
  );
}

export default Stepper;
