import React from 'react';

function SundayReflection({ onOpenSettings, hasTargetsSet, targets }) {
  const parts = [];
  if (targets) {
    if (targets.regularBurpeesGoalTotal > 0) parts.push(`${targets.regularBurpeesGoalTotal} burpees`);
    if (targets.navySealBurpeesGoalTotal > 0) parts.push(`${targets.navySealBurpeesGoalTotal} navy seals`);
    if (targets.pullupsGoalPerSession > 0) parts.push(`${targets.pullupsGoalPerSession} pull-ups`);
  }

  return (
    <section className="sunday-reflection">
      <h2 className="sunday-reflection-title">Weekly Intentions</h2>
      {parts.length > 0 && (
        <p className="sunday-reflection-summary">
          Next week: {parts.join(' · ')}
        </p>
      )}
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
