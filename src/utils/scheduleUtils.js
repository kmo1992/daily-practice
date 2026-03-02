import moment from 'moment';

// Day-of-week workout rotation (moment isoWeekday: 1=Mon ... 7=Sun)
// Tue(2) and Thu(4) are workout rest days (pull-ups still happen)
export const WORKOUT_SCHEDULE = {
  1: { type: 'Burpees', hasTimer: true },
  2: { type: 'Rest', hasTimer: false },
  3: { type: 'Navy Seals', hasTimer: true },
  4: { type: 'Rest', hasTimer: false },
  5: { type: 'Burpees', hasTimer: true },
  6: { type: 'Navy Seals', hasTimer: true },
  7: { type: 'Rest', hasTimer: false },
};

export const getWorkoutForDay = (isoWeekday) =>
  WORKOUT_SCHEDULE[isoWeekday] || WORKOUT_SCHEDULE[7];

export const isSunday = (isoWeekday) => isoWeekday === 7;

// Trackable habits differ by day type
export const getTrackableHabits = (isoWeekday) => {
  if (isoWeekday === 7) {
    // Sunday: full rest
    return ['outside', 'readCoffee', 'eatAtTable', 'hydrate'];
  }
  const workout = getWorkoutForDay(isoWeekday);
  if (workout.type === 'Rest') {
    // Tue/Thu: workout rest, but pull-ups and stretch still happen
    return ['pullups', 'stretch', 'readCoffee', 'eatAtTable', 'hydrate'];
  }
  return ['workout', 'pullups', 'stretch', 'readCoffee', 'eatAtTable', 'hydrate'];
};

// ISO week start key for weekly goals lookup
export const getWeekStartKey = (date) =>
  date.clone().startOf('isoWeek').format('YYYY-MM-DD');

// Calculate daily session targets from weekly goals
export const getDailyTargets = (isoWeekday, weekGoals) => {
  if (!weekGoals || isoWeekday === 7) return null; // Sunday: full rest, no targets

  const workout = getWorkoutForDay(isoWeekday);
  const targets = {};

  if (workout.type === 'Burpees') {
    const total = weekGoals.regularBurpeesGoalTotal || 0;
    if (total > 0) targets.burpees = total;
  } else if (workout.type === 'Navy Seals') {
    const total = weekGoals.navySealBurpeesGoalTotal || 0;
    if (total > 0) targets.navySeals = total;
  }
  const pullups = weekGoals.pullupsGoalPerSession || 0;
  if (pullups > 0) targets.pullups = pullups;

  return Object.keys(targets).length > 0 ? targets : null;
};

// Coach baseline for new users with no prior targets
export const COACH_BASELINE = {
  regularBurpeesGoalTotal: 30,
  navySealBurpeesGoalTotal: 10,
  pullupsGoalPerSession: 3,
};

// Resolve effective goals for a given week:
// 1. Explicit targets for this week → use them
// 2. Look back up to 4 weeks for carry-over → use most recent
// 3. Fall back to coach baseline
export const resolveWeekGoals = (weekGoals, weekStartKey) => {
  if (!weekGoals) return { ...COACH_BASELINE };

  const current = weekGoals[weekStartKey];
  if (current && Object.keys(current).length > 0) return current;

  // Look back up to 4 prior weeks
  let d = moment(weekStartKey);
  for (let i = 0; i < 4; i++) {
    d = d.clone().subtract(7, 'days');
    const key = d.format('YYYY-MM-DD');
    const prev = weekGoals[key];
    if (prev && Object.keys(prev).length > 0) return prev;
  }

  return { ...COACH_BASELINE };
};

// Get mobility practice index for stretch link (Mon-Sat = 0-5)
export const getMobilityIndex = (isoWeekday) => {
  if (isoWeekday === 7) return 0;
  return (isoWeekday - 1) % 6;
};
