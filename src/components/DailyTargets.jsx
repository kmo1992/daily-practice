import React from 'react';
import { getDailyTargets } from '../utils/scheduleUtils';

function DailyTargets({ isoWeekday, weekGoals }) {
  const targets = getDailyTargets(isoWeekday, weekGoals);
  if (!targets) return null;

  const parts = [];
  if (targets.burpees) parts.push(`${targets.burpees} burpees`);
  if (targets.navySeals) parts.push(`${targets.navySeals} navy seals`);
  if (targets.pullups) parts.push(`${targets.pullups} pull-ups`);

  if (parts.length === 0) return null;

  return (
    <div className="daily-targets">
      {parts.join(' · ')}
    </div>
  );
}

export default DailyTargets;
