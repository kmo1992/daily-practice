
// Inline SVG icons
const CheckIcon = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="2.5 7.5 5.5 10.5 11.5 3.5" />
  </svg>
);

const DashIcon = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <line x1="3" y1="7" x2="11" y2="7" />
  </svg>
);

function HabitRow({ label, checked, onToggle, disabled, isRest, actionButton, rewardStyle, emoji }) {
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
      {actionButton && !isRest && (
        actionButton.type === 'link' ? (
          <a
            className="habit-action-btn"
            href={actionButton.href}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
          >
            {actionButton.label}
          </a>
        ) : (
          <button
            className="habit-action-btn"
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              actionButton.onClick();
            }}
          >
            {actionButton.label}
          </button>
        )
      )}
    </div>
  );
}

export default HabitRow;
