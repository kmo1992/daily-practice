import { getTrackableHabits } from './scheduleUtils';
import { getAppToday } from './dateUtils';

// Tally habits store numeric counts; legacy boolean true is also valid.
// (eatAtTable was retired 2026-07 — old day docs may still carry its data,
// but it is no longer trackable.)
const TALLY_HABITS = ['hydrate'];

/**
 * Whether a single habit is satisfied for a day's habits object.
 */
export const isHabitSatisfied = (habits, habit) => {
  const val = habits?.[habit];
  if (TALLY_HABITS.includes(habit)) return val === true || val >= 3;
  return val === true;
};

/**
 * Check if ALL trackable habits for a given day are completed.
 */
export const isDayComplete = (dayData, isoWeekday) => {
  if (!dayData || !dayData.habits) return false;
  const trackable = getTrackableHabits(isoWeekday);
  return trackable.every((habit) => isHabitSatisfied(dayData.habits, habit));
};

/**
 * Calculate the unified streak: consecutive days (going backward from asOfDate)
 * where ALL trackable habits were completed.
 */
export const calculateStreak = (data, asOfDate) => {
  const today = getAppToday().startOf('day');
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
