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

    // Check if ANY workout activity was completed
    const workoutCompleted = WORKOUT_ACTIVITIES.some(activity =>
      practices.includes(activity)
    );

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

    // Check if pull-ups were completed
    if (!practices.includes('Pullups')) {
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
 * Calculate streaks for all core habits
 * @param {object} data - All day data
 * @param {moment} asOfDate - Calculate as of this date
 * @returns {object} { workout: 5, pullups: 3, stretch: 0, read: 7, water: 2, outside: 3 }
 */
export const calculateAllStreaks = (data, asOfDate) => {
  return {
    workout: calculateWorkoutStreak(data, asOfDate),
    pullups: calculatePullupsStreak(data, asOfDate),
    stretch: calculateStretchStreak(data, asOfDate),
    read: calculateCurrentStreak('Read', data, asOfDate),
    water: calculateCurrentStreak('Water', data, asOfDate),
    outside: calculateOutsideStreak(data, asOfDate),
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
