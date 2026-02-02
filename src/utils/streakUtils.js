import moment from 'moment';

// Workout activities that count toward the workout streak (NOT pull-ups)
// 'Burpees' = current burpee days, 'Exercise' = backward compatibility + non-burpee workout days
const WORKOUT_ACTIVITIES = ['Burpees', 'Exercise'];

/**
 * Check if a date is a Sunday (rest day)
 * @param {moment} date - Date to check
 * @returns {boolean} True if Sunday
 */
const isSunday = (date) => {
  return date.day() === 0;
};

/**
 * Calculate current streak for a specific habit up to a given date
 * @param {string} habitName - Name of habit (e.g., 'Stretch', 'Read', 'Water')
 * @param {object} data - All day data from Firestore
 * @param {moment} asOfDate - Calculate streak up to this date
 * @returns {number} Current streak count
 */
export const calculateCurrentStreak = (habitName, data, asOfDate) => {
  // Don't calculate for future dates
  const today = moment().startOf('day');
  if (asOfDate.isAfter(today, 'day')) {
    return 0;
  }

  let streak = 0;
  let checkDate = asOfDate.clone();
  const maxLookback = 365; // Prevent infinite loops
  const challengeStart = moment('2026-01-05'); // Challenge start date

  while (streak < maxLookback) {
    const dateStr = checkDate.format('YYYY-MM-DD');
    const dayData = data[dateStr];

    // Handle missing data gracefully - no data = streak broken
    if (!dayData) {
      break;
    }

    const practices = Array.isArray(dayData.practices) ? dayData.practices : [];

    // Check if habit was completed on this day
    if (!practices.includes(habitName)) {
      break; // Streak broken
    }

    streak++;
    checkDate.subtract(1, 'days');

    // Stop at challenge start date (don't go before tracking began)
    if (checkDate.isBefore(challengeStart, 'day')) {
      break;
    }
  }

  return streak;
};

/**
 * Calculate workout streak - counts if ANY workout activity was completed
 * (Burpees or Exercise) - Sundays are rest days and don't break the streak
 * @param {object} data - All day data from Firestore
 * @param {moment} asOfDate - Calculate streak up to this date
 * @returns {number} Current workout streak count
 */
export const calculateWorkoutStreak = (data, asOfDate) => {
  // Don't calculate for future dates
  const today = moment().startOf('day');
  if (asOfDate.isAfter(today, 'day')) {
    return 0;
  }

  let streak = 0;
  let checkDate = asOfDate.clone();
  const maxLookback = 365;
  const challengeStart = moment('2026-01-05');

  while (streak < maxLookback) {
    const dateStr = checkDate.format('YYYY-MM-DD');
    const dayData = data[dateStr];

    // Handle missing data gracefully
    if (!dayData) {
      break;
    }

    const practices = Array.isArray(dayData.practices) ? dayData.practices : [];

    // Sunday is a rest day - skip without breaking streak
    if (isSunday(checkDate)) {
      checkDate.subtract(1, 'days');
      // Don't increment streak, but don't break it either
      continue;
    }

    // Check if ANY workout activity was completed (practices array OR rep count for backward compatibility)
    const workoutCompleted = WORKOUT_ACTIVITIES.some(activity =>
      practices.includes(activity)
    ) || (dayData.burpeesTotalReps !== undefined && dayData.burpeesTotalReps > 0);

    if (!workoutCompleted) {
      break; // Streak broken
    }

    streak++;
    checkDate.subtract(1, 'days');

    // Stop at challenge start date
    if (checkDate.isBefore(challengeStart, 'day')) {
      break;
    }
  }

  return streak;
};

/**
 * Calculate pull-ups streak - Sundays are rest days and don't break the streak
 * @param {object} data - All day data from Firestore
 * @param {moment} asOfDate - Calculate streak up to this date
 * @returns {number} Current pull-ups streak count
 */
export const calculatePullupsStreak = (data, asOfDate) => {
  // Don't calculate for future dates
  const today = moment().startOf('day');
  if (asOfDate.isAfter(today, 'day')) {
    return 0;
  }

  let streak = 0;
  let checkDate = asOfDate.clone();
  const maxLookback = 365;
  const challengeStart = moment('2026-01-05');

  while (streak < maxLookback) {
    const dateStr = checkDate.format('YYYY-MM-DD');
    const dayData = data[dateStr];

    // Handle missing data gracefully
    if (!dayData) {
      break;
    }

    const practices = Array.isArray(dayData.practices) ? dayData.practices : [];

    // Sunday is a rest day - skip without breaking streak
    if (isSunday(checkDate)) {
      checkDate.subtract(1, 'days');
      // Don't increment streak, but don't break it either
      continue;
    }

    // Check if pull-ups were completed (practices array OR rep count for backward compatibility)
    const pullupsCompleted = practices.includes('Pullups') ||
      (dayData.pullups !== undefined && dayData.pullups > 0);

    if (!pullupsCompleted) {
      break; // Streak broken
    }

    streak++;
    checkDate.subtract(1, 'days');

    // Stop at challenge start date
    if (checkDate.isBefore(challengeStart, 'day')) {
      break;
    }
  }

  return streak;
};

/**
 * Calculate stretch streak - Sundays are rest days and don't break the streak
 * @param {object} data - All day data from Firestore
 * @param {moment} asOfDate - Calculate streak up to this date
 * @returns {number} Current stretch streak count
 */
export const calculateStretchStreak = (data, asOfDate) => {
  // Don't calculate for future dates
  const today = moment().startOf('day');
  if (asOfDate.isAfter(today, 'day')) {
    return 0;
  }

  let streak = 0;
  let checkDate = asOfDate.clone();
  const maxLookback = 365;
  const challengeStart = moment('2026-01-05');

  while (streak < maxLookback) {
    const dateStr = checkDate.format('YYYY-MM-DD');
    const dayData = data[dateStr];

    // Handle missing data gracefully
    if (!dayData) {
      break;
    }

    const practices = Array.isArray(dayData.practices) ? dayData.practices : [];

    // Sunday is a rest day - skip without breaking streak
    if (isSunday(checkDate)) {
      checkDate.subtract(1, 'days');
      // Don't increment streak, but don't break it either
      continue;
    }

    // Check if stretch was completed
    if (!practices.includes('Stretch')) {
      break; // Streak broken
    }

    streak++;
    checkDate.subtract(1, 'days');

    // Stop at challenge start date
    if (checkDate.isBefore(challengeStart, 'day')) {
      break;
    }
  }

  return streak;
};

/**
 * Calculate outside streak - only counts Sundays
 * @param {object} data - All day data from Firestore
 * @param {moment} asOfDate - Calculate streak up to this date
 * @returns {number} Current outside streak count (number of consecutive Sundays)
 */
export const calculateOutsideStreak = (data, asOfDate) => {
  // Don't calculate for future dates
  const today = moment().startOf('day');
  if (asOfDate.isAfter(today, 'day')) {
    return 0;
  }

  let streak = 0;
  let checkDate = asOfDate.clone();
  const maxLookback = 365;
  const challengeStart = moment('2026-01-05');

  while (streak < maxLookback) {
    const dateStr = checkDate.format('YYYY-MM-DD');
    const dayData = data[dateStr];

    // Handle missing data gracefully
    if (!dayData) {
      break;
    }

    const practices = Array.isArray(dayData.practices) ? dayData.practices : [];

    // Only count Sundays - skip all other days without breaking streak
    if (!isSunday(checkDate)) {
      checkDate.subtract(1, 'days');
      continue;
    }

    // It's a Sunday - check if outside activity was completed
    if (!practices.includes('Outside')) {
      break; // Streak broken - missed a Sunday
    }

    streak++;
    checkDate.subtract(1, 'days');

    // Stop at challenge start date
    if (checkDate.isBefore(challengeStart, 'day')) {
      break;
    }
  }

  return streak;
};

/**
 * Calculate nutrition streak - consecutive days with perfect 5/5 nutrition points
 * @param {object} data - All day data from Firestore
 * @param {moment} asOfDate - Calculate streak up to this date
 * @returns {number} Current nutrition streak count
 */
export const calculateNutritionStreak = (data, asOfDate) => {
  const today = moment().startOf('day');
  if (asOfDate.isAfter(today, 'day')) {
    return 0;
  }

  let streak = 0;
  let checkDate = asOfDate.clone();
  const maxLookback = 365;
  const challengeStart = moment('2026-01-05');

  while (streak < maxLookback) {
    const dateStr = checkDate.format('YYYY-MM-DD');
    const dayData = data[dateStr];

    if (!dayData) {
      break;
    }

    if (dayData.nutritionPoints !== 5) {
      break;
    }

    streak++;
    checkDate.subtract(1, 'days');

    if (checkDate.isBefore(challengeStart, 'day')) {
      break;
    }
  }

  return streak;
};

/**
 * Calculate streaks for all core habits
 * @param {object} data - All day data
 * @param {moment} asOfDate - Calculate as of this date
 * @returns {object} { workout, pullups, stretch, read, water, outside, nutrition }
 */
export const calculateAllStreaks = (data, asOfDate) => {
  return {
    workout: calculateWorkoutStreak(data, asOfDate),
    pullups: calculatePullupsStreak(data, asOfDate),
    stretch: calculateStretchStreak(data, asOfDate),
    read: calculateCurrentStreak('Read', data, asOfDate),
    water: calculateCurrentStreak('Water', data, asOfDate),
    outside: calculateOutsideStreak(data, asOfDate),
    nutrition: calculateNutritionStreak(data, asOfDate),
  };
};

/**
 * Get milestone tier for a streak count
 * @param {number} count - Streak count
 * @returns {number} Milestone tier (0, 7, 14, 30, 100)
 */
export const getStreakMilestone = (count) => {
  if (count >= 100) return 100;
  if (count >= 30) return 30;
  if (count >= 14) return 14;
  if (count >= 7) return 7;
  return 0;
};

/**
 * Format streak text for display
 * @param {number} count - Streak count
 * @param {string} habitName - Name of the habit (optional, used to determine unit)
 * @returns {string} Formatted text (e.g., "5 day streak" or "3 week streak")
 */
export const formatStreakText = (count, habitName = '') => {
  if (count === 0) return '';

  // "Go outside!" tracks consecutive weeks (Sundays), not days
  const isWeeklyHabit = habitName === 'Go outside!';
  const unit = isWeeklyHabit ? 'week' : 'day';

  if (count === 1) return `1 ${unit} streak`;
  return `${count} ${unit} streak`;
};

/**
 * Check if a habit was completed on a specific date.
 * Handles backward compatibility for workout/pullup rep counts.
 * @param {string} habitKey - Internal habit key (workout, pullups, stretch, read, water, outside)
 * @param {object} dayData - Day data from Firestore (or undefined)
 * @returns {boolean}
 */
const wasHabitDone = (habitKey, dayData) => {
  if (!dayData) return false;
  const practices = Array.isArray(dayData.practices) ? dayData.practices : [];
  switch (habitKey) {
    case 'workout':
      return WORKOUT_ACTIVITIES.some(a => practices.includes(a)) ||
        (dayData.burpeesTotalReps !== undefined && dayData.burpeesTotalReps > 0);
    case 'pullups':
      return practices.includes('Pullups') ||
        (dayData.pullups !== undefined && dayData.pullups > 0);
    case 'stretch':
      return practices.includes('Stretch');
    case 'read':
      return practices.includes('Read');
    case 'water':
      return practices.includes('Water');
    case 'outside':
      return practices.includes('Outside');
    case 'nutrition':
      return dayData.nutritionPoints === 5;
    default:
      return false;
  }
};

/**
 * For a given habit, find the "previous relevant day" before asOfDate,
 * accounting for rest days (Sundays for weekday habits, non-Sundays for outside).
 * @param {string} habitKey
 * @param {moment} asOfDate
 * @returns {moment} The previous relevant date
 */
const getPreviousRelevantDay = (habitKey, asOfDate) => {
  const weekdayHabits = ['workout', 'pullups', 'stretch'];
  const prev = asOfDate.clone().subtract(1, 'days');

  if (habitKey === 'outside') {
    // Go back to previous Sunday
    while (prev.day() !== 0) {
      prev.subtract(1, 'days');
    }
    return prev;
  }

  if (weekdayHabits.includes(habitKey)) {
    // Skip Sundays for weekday habits
    while (prev.day() === 0) {
      prev.subtract(1, 'days');
    }
    return prev;
  }

  // Daily habits (read, water) - just yesterday
  return prev;
};

/**
 * Search backward from asOfDate (exclusive) to find the most recent day the
 * habit was completed, then return the streak as of that day.
 * Skips rest days appropriately per habit type.
 * @returns {number} The streak count at the most recent completed day, or 0
 */
const findRecentBrokenStreak = (habitKey, data, asOfDate, streakFn) => {
  const maxLookback = habitKey === 'outside' ? 6 : 14; // weeks or days
  let checkDate = asOfDate.clone();

  for (let i = 0; i < maxLookback; i++) {
    checkDate = getPreviousRelevantDay(habitKey, checkDate);
    if (wasHabitDone(habitKey, data[checkDate.format('YYYY-MM-DD')])) {
      return streakFn(checkDate);
    }
  }
  return 0;
};

/**
 * Calculate streak warnings for all habits.
 * Returns per-habit warning state with three distinct levels:
 *   1. atRisk      – active streak, not done today ("Don't break your streak!")
 *   2. recoveryMode – missed ONE day only ("Never miss twice")
 *   3. streakBroken – missed 2+ days, streak is gone ("Streak reset. Previous best: X")
 *
 * @param {object} data - All day data from Firestore
 * @param {moment} asOfDate - Current selected date
 * @returns {object} { workout: { atRisk, recoveryMode, streakBroken, previousBest, streakAtRisk }, ... }
 */
export const calculateStreakWarnings = (data, asOfDate) => {
  const today = moment().startOf('day');
  if (!data || !asOfDate || asOfDate.isAfter(today, 'day')) {
    return {};
  }

  const habitKeys = ['workout', 'pullups', 'stretch', 'read', 'water', 'outside', 'nutrition'];
  const streakFns = {
    workout: (d) => calculateWorkoutStreak(data, d),
    pullups: (d) => calculatePullupsStreak(data, d),
    stretch: (d) => calculateStretchStreak(data, d),
    read: (d) => calculateCurrentStreak('Read', data, d),
    water: (d) => calculateCurrentStreak('Water', data, d),
    outside: (d) => calculateOutsideStreak(data, d),
    nutrition: (d) => calculateNutritionStreak(data, d),
  };

  // Thresholds per habit cadence:
  //   daily  (read, water)                – 7 days for at-risk, 3 for recovery/broken
  //   6-day  (workout, pullups, stretch)  – 6 days (one full Mon-Sat week)
  //   weekly (outside)                    – 2 weeks for at-risk, 1 for recovery/broken
  const SIX_DAY_HABITS = ['workout', 'pullups', 'stretch'];

  const getThresholds = (key) => {
    if (key === 'outside') return { atRisk: 2, recovery: 1 };
    if (SIX_DAY_HABITS.includes(key)) return { atRisk: 6, recovery: 3 };
    return { atRisk: 7, recovery: 3 }; // daily habits
  };

  const noWarning = { atRisk: false, recoveryMode: false, streakBroken: false, previousBest: 0, streakAtRisk: 0 };
  const warnings = {};

  for (const key of habitKeys) {
    const { atRisk: atRiskMin, recovery: recoveryMin } = getThresholds(key);
    const doneToday = wasHabitDone(key, data[asOfDate.format('YYYY-MM-DD')]);

    if (doneToday) {
      warnings[key] = { ...noWarning };
      continue;
    }

    // Find previous relevant day (skipping rest days)
    const prevDay = getPreviousRelevantDay(key, asOfDate);
    const streakAsOfPrevDay = streakFns[key](prevDay);

    if (streakAsOfPrevDay >= atRiskMin) {
      // ── State 1: Streak at risk ──
      // Previous day was completed, active streak in danger
      warnings[key] = {
        ...noWarning,
        atRisk: true,
        streakAtRisk: streakAsOfPrevDay,
      };
    } else if (streakAsOfPrevDay > 0) {
      // Previous day was completed but streak is below at-risk threshold — no warning
      warnings[key] = { ...noWarning };
    } else {
      // streakAsOfPrevDay === 0 → previous relevant day was missed
      // Determine if it's one miss (recovery) or multiple (broken)
      const dayBeforePrev = getPreviousRelevantDay(key, prevDay);
      const doneOnDayBeforePrev = wasHabitDone(key, data[dayBeforePrev.format('YYYY-MM-DD')]);

      if (doneOnDayBeforePrev) {
        // ── State 2: Recovery mode ──
        // Only ONE miss — "Never miss twice"
        const streakBeforeMiss = streakFns[key](dayBeforePrev);
        if (streakBeforeMiss >= recoveryMin) {
          warnings[key] = {
            ...noWarning,
            recoveryMode: true,
            previousBest: streakBeforeMiss,
          };
        } else {
          warnings[key] = { ...noWarning };
        }
      } else {
        // ── State 3: Broken streak ──
        // Multiple misses — search backward for the streak that was broken
        const recentStreak = findRecentBrokenStreak(key, data, asOfDate, streakFns[key]);
        if (recentStreak >= recoveryMin) {
          warnings[key] = {
            ...noWarning,
            streakBroken: true,
            previousBest: recentStreak,
          };
        } else {
          warnings[key] = { ...noWarning };
        }
      }
    }
  }

  return warnings;
};
