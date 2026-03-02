import moment from 'moment';
import { getTrackableHabits } from './scheduleUtils';

/**
 * Check if ALL trackable habits for a given day are completed.
 */
export const isDayComplete = (dayData, isoWeekday) => {
  if (!dayData || !dayData.habits) return false;
  const trackable = getTrackableHabits(isoWeekday);
  return trackable.every((habit) => {
    const val = dayData.habits[habit];
    // hydrate: legacy true or numeric >= 3 counts as complete
    if (habit === 'hydrate') return val === true || val >= 3;
    return val === true;
  });
};

/**
 * Calculate the unified streak: consecutive days (going backward from asOfDate)
 * where ALL trackable habits were completed.
 */
export const calculateStreak = (data, asOfDate) => {
  const today = moment().startOf('day');
  if (asOfDate.isAfter(today, 'day')) return 0;

  let streak = 0;
  const checkDate = asOfDate.clone().startOf('day');
  const maxLookback = 365;

  for (let i = 0; i < maxLookback; i++) {
    const dateStr = checkDate.format('YYYY-MM-DD');
    const dayData = data[dateStr];
    const isoWeekday = checkDate.isoWeekday();

    if (!isDayComplete(dayData, isoWeekday)) break;

    streak++;
    checkDate.subtract(1, 'days');
  }

  return streak;
};
