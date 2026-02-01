import { mobilityPractices, livingRoomWorkouts } from '../data/practicesData';

export const getMobilityPractice = (dayOfWeek) => {
  if (dayOfWeek === 1) {
    return mobilityPractices[0]; // 'Thoracic Flow' on Mondays
  } else {
    return mobilityPractices[(dayOfWeek - 2) % (mobilityPractices.length - 1) + 1];
  }
};

export const getLivingRoomWorkout = (index) => {
  return livingRoomWorkouts[index] || null;
};

// Calculate habit points (0-5) based on completion practices
// The 5 core practices that count toward the daily 10-point goal
export const COMPLETION_PRACTICES = ['Sleep', 'Exercise', 'Stretch', 'Read', 'Water'];

export const calculateHabitPoints = (practices = []) => {
  if (!Array.isArray(practices)) {
    return 0;
  }
  const completedCount = COMPLETION_PRACTICES.filter(practice =>
    practices.includes(practice)
  ).length;
  return completedCount; // Each practice = 1 point, max 5 points
};
