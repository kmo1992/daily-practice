import React, { useEffect, useState } from 'react';
import { getStreakMilestone, formatStreakText } from '../utils/streakUtils';

function StreakBadge({ count, habitName }) {
  const [prevCount, setPrevCount] = useState(count);
  const [justIncremented, setJustIncremented] = useState(false);

  useEffect(() => {
    if (count > prevCount && prevCount > 0) {
      setJustIncremented(true);
      const timer = setTimeout(() => setJustIncremented(false), 600);
      return () => clearTimeout(timer);
    }
    setPrevCount(count);
  }, [count, prevCount]);

  if (count === 0) return null;

  const milestone = getStreakMilestone(count);
  const text = formatStreakText(count);
  const milestoneClass = milestone > 0 ? `milestone-${milestone}` : '';
  const incrementClass = justIncremented ? 'just-incremented' : '';

  return (
    <span
      className={`streak-badge ${milestoneClass} ${incrementClass}`}
      aria-label={`${text} for ${habitName}`}
      role="status"
      aria-live="polite"
    >
      🔥 {text}
    </span>
  );
}

export default StreakBadge;
