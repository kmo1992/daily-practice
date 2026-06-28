import moment from 'moment';
import { getTrackableHabits } from './scheduleUtils';
import { isDayComplete, isHabitSatisfied } from './streakUtils';

/**
 * Classify a day's completion for the consistency heatmap.
 * Returns 'full' (all trackable habits done), 'partial' (some), or 'none'.
 */
export const getDayCompletion = (dayData, isoWeekday) => {
  const habits = dayData?.habits;
  if (!habits) return 'none';
  const trackable = getTrackableHabits(isoWeekday);
  const done = trackable.filter((h) => isHabitSatisfied(habits, h)).length;
  if (done === 0) return 'none';
  if (done === trackable.length) return 'full';
  return 'partial';
};

/**
 * Longest run of consecutive calendar days where every trackable habit
 * was completed, across all recorded data.
 */
export const calculateLongestStreak = (data) => {
  const completeDates = Object.keys(data)
    .filter((d) => isDayComplete(data[d], moment(d).isoWeekday()))
    .sort();

  let longest = 0;
  let run = 0;
  let prev = null;
  for (const d of completeDates) {
    if (prev && moment(d).diff(moment(prev), 'days') === 1) {
      run += 1;
    } else {
      run = 1;
    }
    longest = Math.max(longest, run);
    prev = d;
  }
  return longest;
};

/**
 * Count of fully-complete days within the trailing `windowDays` ending at endDate.
 */
export const getCompletionStats = (data, endDate, windowDays = 30) => {
  const end = moment(endDate);
  let completed = 0;
  for (let i = 0; i < windowDays; i++) {
    const date = end.clone().subtract(i, 'days');
    if (isDayComplete(data[date.format('YYYY-MM-DD')], date.isoWeekday())) completed += 1;
  }
  return { completed, total: windowDays };
};

/**
 * Build a grid of the trailing `weeks` ISO-weeks ending at endDate.
 * Returns an array of weeks (oldest first); each week is 7 day cells (Mon→Sun).
 */
export const getConsistencyWeeks = (data, endDate, weeks = 12) => {
  const end = moment(endDate);
  const start = end.clone().startOf('isoWeek').subtract(weeks - 1, 'weeks');
  const result = [];
  for (let w = 0; w < weeks; w++) {
    const weekStart = start.clone().add(w, 'weeks');
    const days = [];
    for (let d = 0; d < 7; d++) {
      const date = weekStart.clone().add(d, 'days');
      const key = date.format('YYYY-MM-DD');
      const isFuture = date.isAfter(end, 'day');
      days.push({
        date: key,
        isoWeekday: date.isoWeekday(),
        isFuture,
        completion: isFuture ? 'none' : getDayCompletion(data[key], date.isoWeekday()),
      });
    }
    result.push(days);
  }
  return result;
};

/**
 * Recent pull-up sessions (days with logged reps), oldest→newest,
 * up to `maxSessions`, looking back from endDate.
 */
export const getPullupHistory = (data, endDate, maxSessions = 14) => {
  const sessions = [];
  const d = moment(endDate);
  for (let i = 0; i < 365 && sessions.length < maxSessions; i++) {
    const key = d.format('YYYY-MM-DD');
    const reps = Number(data[key]?.habits?.pullupsCount) || 0;
    if (reps > 0) sessions.push({ date: key, reps });
    d.subtract(1, 'day');
  }
  return sessions.reverse();
};
