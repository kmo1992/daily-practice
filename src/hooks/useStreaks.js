import { useMemo } from 'react';
import { calculateAllStreaks } from '../utils/streakUtils';

/**
 * Custom hook to calculate habit streaks
 * @param {object} data - All day data from Firestore
 * @param {moment} selectedDate - Current selected date
 * @returns {object} Streaks for all habits { workout, pullups, stretch, read, water, outside }
 */
export const useStreaks = (data, selectedDate) => {
  return useMemo(() => {
    if (!data || !selectedDate) {
      return {
        workout: 0,
        pullups: 0,
        stretch: 0,
        read: 0,
        water: 0,
        outside: 0,
      };
    }

    return calculateAllStreaks(data, selectedDate);
  }, [data, selectedDate]);
};
