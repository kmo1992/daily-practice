import { useMemo } from 'react';
import { calculateStreakWarnings } from '../utils/streakUtils';

/**
 * Custom hook to calculate streak warnings (at-risk, recovery mode, broken streaks)
 * @param {object} data - All day data from Firestore
 * @param {moment} selectedDate - Current selected date
 * @returns {object} Warnings per habit { workout: { atRisk, recoveryMode, previousBest, streakAtRisk }, ... }
 */
export const useStreakWarnings = (data, selectedDate) => {
  return useMemo(() => {
    if (!data || !selectedDate) {
      return {};
    }
    return calculateStreakWarnings(data, selectedDate);
  }, [data, selectedDate]);
};
