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

// Calculate habit points based on completion practices
// Regular weekdays: Burpees/Exercise (1), Pullups (1), Stretch (1), Read (1), Water (1) = 5 points max
// Sundays: Read (1), Outside (3) = 4 points max
// Sleep is tracked separately as an indicator (not counted in habit points)

export const calculateHabitPoints = (practices = [], dayData = {}) => {
  if (!Array.isArray(practices)) {
    return 0;
  }

  let points = 0;

  // Sunday: Outside counts as 3 points (replaces workout + mobility + pullups)
  if (practices.includes('Outside')) {
    points += 3;
  } else {
    // Weekday workout activities (Burpees or Exercise) = 1 point
    // Also check rep counts for backward compatibility
    const hasWorkout = practices.includes('Burpees') || practices.includes('Exercise') ||
      (dayData.burpeesTotalReps !== undefined && dayData.burpeesTotalReps > 0);
    if (hasWorkout) {
      points += 1;
    }

    // Pull-ups = 1 point
    // Also check rep counts for backward compatibility
    const hasPullups = practices.includes('Pullups') ||
      (dayData.pullups !== undefined && dayData.pullups > 0);
    if (hasPullups) {
      points += 1;
    }

    // Stretch/Mobility = 1 point
    if (practices.includes('Stretch')) {
      points += 1;
    }
  }

  // Read = 1 point (both weekdays and Sundays)
  if (practices.includes('Read')) {
    points += 1;
  }

  // Water = 1 point (weekdays only, not part of Sunday routine)
  if (practices.includes('Water')) {
    points += 1;
  }

  return points;
};
