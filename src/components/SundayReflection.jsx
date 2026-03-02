import React from 'react';

function SundayReflection({ onOpenSettings, hasTargetsSet }) {
  return (
    <section className="sunday-reflection">
      <h2 className="sunday-reflection-title">Weekly Intentions</h2>
      <button
        className={`sunday-reflection-btn${hasTargetsSet ? ' sunday-reflection-btn--done' : ''}`}
        type="button"
        onClick={onOpenSettings}
      >
        {hasTargetsSet ? 'Practice Set for Next Week \u2713' : 'Set Targets for Next Week'}
      </button>
      <p className="sunday-reflection-caption">
        Rest is part of the practice. Plan your path for tomorrow.
      </p>
    </section>
  );
}

export default SundayReflection;
