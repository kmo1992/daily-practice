import moment from 'moment';

// Day-of-week workout rotation (moment isoWeekday: 1=Mon ... 7=Sun)
export const WORKOUT_SCHEDULE = {
  1: { type: 'Burpees', hasTimer: true, hasLink: false },
  2: { type: 'Video workout', hasTimer: false, hasLink: true },
  3: { type: 'Navy Seals', hasTimer: true, hasLink: false },
  4: { type: 'Burpees', hasTimer: true, hasLink: false },
  5: { type: 'Video workout', hasTimer: false, hasLink: true },
  6: { type: 'Navy Seals', hasTimer: true, hasLink: false },
  7: { type: 'Rest', hasTimer: false, hasLink: false },
};

export const getWorkoutForDay = (isoWeekday) =>
  WORKOUT_SCHEDULE[isoWeekday] || WORKOUT_SCHEDULE[7];

export const isSunday = (isoWeekday) => isoWeekday === 7;

// Trackable habits differ by day type
export const getTrackableHabits = (isoWeekday) => {
  if (isoWeekday === 7) {
    return ['outside', 'readCoffee', 'eatAtTable', 'hydrate', 'journal'];
  }
  return ['workout', 'pullups', 'stretch', 'readCoffee', 'eatAtTable', 'hydrate', 'journal'];
};

// ISO week start key for weekly goals lookup
export const getWeekStartKey = (date) =>
  date.clone().startOf('isoWeek').format('YYYY-MM-DD');

// Calculate daily session targets from weekly goals
export const getDailyTargets = (isoWeekday, weekGoals) => {
  if (!weekGoals || isoWeekday === 7) return null;

  const workout = getWorkoutForDay(isoWeekday);
  const targets = {};

  if (workout.type === 'Burpees') {
    const total = weekGoals.regularBurpeesGoalTotal || 0;
    if (total > 0) targets.burpees = total;
  } else if (workout.type === 'Navy Seals') {
    const total = weekGoals.navySealBurpeesGoalTotal || 0;
    if (total > 0) targets.navySeals = total;
  }
  // Video days: no burpee/navy target, only pull-ups

  const pullups = weekGoals.pullupsGoalPerSession || 0;
  if (pullups > 0) targets.pullups = pullups;

  return Object.keys(targets).length > 0 ? targets : null;
};

// Calculate the video workout index (rotating through livingRoomWorkouts)
export const getVideoWorkoutIndex = (date) => {
  const challengeStart = moment('2026-01-05');
  const daysSinceStart = date.diff(challengeStart, 'days');
  if (daysSinceStart < 0) return 0;

  // Count video workout days (Tue + Fri) from start to date
  let videoIndex = 0;
  const check = challengeStart.clone();
  while (check.isSameOrBefore(date, 'day')) {
    const dow = check.isoWeekday();
    if (dow === 2 || dow === 5) videoIndex++;
    check.add(1, 'days');
  }
  return Math.max(0, videoIndex - 1);
};

// Get mobility practice index for stretch link (Mon-Sat = 0-5)
export const getMobilityIndex = (isoWeekday) => {
  if (isoWeekday === 7) return 0;
  return (isoWeekday - 1) % 6;
};
