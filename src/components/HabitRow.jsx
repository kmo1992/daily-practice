import { CheckIcon, DashIcon } from './icons';

function HabitRow({ label, checked, onToggle, disabled, isRest, actionButton, rewardStyle, emoji }) {
  // Accept a single action or an array of them
  const actions = Array.isArray(actionButton) ? actionButton : actionButton ? [actionButton] : [];

  const handleRowClick = (e) => {
    if (disabled || isRest) return;
    // Don't toggle if clicking the action button
    if (e.target.closest('.habit-action-btn')) return;
    onToggle();
  };

  const rowClasses = [
    'habit-row',
    disabled && 'habit-row--disabled',
    isRest && 'habit-row--rest',
  ].filter(Boolean).join(' ');

  const checkboxClasses = [
    'habit-checkbox',
    checked && 'habit-checkbox--checked',
    isRest && 'habit-checkbox--rest',
    rewardStyle && !isRest && 'habit-checkbox--reward',
  ].filter(Boolean).join(' ');

  const labelClasses = [
    'habit-label',
    isRest && 'habit-label--rest',
    checked && !isRest && !rewardStyle && 'habit-label--checked',
    checked && rewardStyle && 'habit-label--reward',
  ].filter(Boolean).join(' ');

  return (
    <div className={rowClasses} onClick={handleRowClick} role="button" tabIndex={disabled || isRest ? -1 : 0}>
      <div className={checkboxClasses}>
        {isRest && <DashIcon />}
        {checked && !isRest && <CheckIcon />}
      </div>
      <span className={labelClasses}>
        {label}
        {emoji && <span className="habit-emoji">{emoji}</span>}
      </span>
      {actions.length > 0 && !isRest && (
        <div className="habit-actions">
          {actions.map((btn) =>
            btn.type === 'link' ? (
              <a
                key={btn.label}
                className="habit-action-btn"
                href={btn.href}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
              >
                {btn.label}
              </a>
            ) : (
              <button
                key={btn.label}
                className="habit-action-btn"
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  btn.onClick();
                }}
              >
                {btn.label}
              </button>
            )
          )}
        </div>
      )}
    </div>
  );
}

export default HabitRow;
