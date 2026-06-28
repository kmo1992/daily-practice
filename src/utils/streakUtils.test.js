import { describe, it, expect } from 'vitest';
import moment from 'moment';
import { isDayComplete, calculateStreak } from './streakUtils';

// A day object with every possible habit satisfied — valid for any weekday's
// trackable subset, so it always counts as "complete".
const completeDay = () => ({
  habits: {
    workout: true,
    pullups: true,
    stretch: true,
    readCoffee: true,
    outside: true,
    eatAtTable: 3,
    hydrate: 3,
  },
});

// Build a data map of N consecutive complete days ending on `endDate`.
const completeRange = (endDate, n) => {
  const data = {};
  const d = moment(endDate);
  for (let i = 0; i < n; i++) {
    data[d.format('YYYY-MM-DD')] = completeDay();
    d.subtract(1, 'day');
  }
  return data;
};

describe('isDayComplete', () => {
  it('is false for missing data', () => {
    expect(isDayComplete(undefined, 1)).toBe(false);
    expect(isDayComplete({}, 1)).toBe(false);
  });

  it('is true when all trackable habits are satisfied (Wednesday workout day)', () => {
    expect(isDayComplete(completeDay(), 3)).toBe(true);
  });

  it('is false when a required habit is missing', () => {
    const day = completeDay();
    delete day.habits.workout; // required on a workout day (Wed = 3)
    expect(isDayComplete(day, 3)).toBe(false);
  });

  it('ignores workout on a rest day (Tuesday = 2)', () => {
    const day = completeDay();
    delete day.habits.workout; // not tracked on Tue, so still complete
    expect(isDayComplete(day, 2)).toBe(true);
  });

  it('accepts legacy boolean true for tally habits', () => {
    const day = completeDay();
    day.habits.hydrate = true;
    day.habits.eatAtTable = true;
    expect(isDayComplete(day, 3)).toBe(true);
  });

  it('is false when a tally habit is below the threshold of 3', () => {
    const day = completeDay();
    day.habits.hydrate = 2;
    expect(isDayComplete(day, 3)).toBe(false);
  });
});

describe('calculateStreak', () => {
  it('returns 0 for empty data', () => {
    expect(calculateStreak({}, moment('2024-03-15'))).toBe(0);
  });

  it('counts consecutive complete days ending at asOfDate', () => {
    const asOf = moment('2024-03-15');
    expect(calculateStreak(completeRange(asOf, 4), asOf)).toBe(4);
  });

  it('stops at the first incomplete day', () => {
    const asOf = moment('2024-03-15');
    const data = completeRange(asOf, 5);
    // Break the chain 3 days back
    data[moment(asOf).subtract(2, 'day').format('YYYY-MM-DD')].habits.hydrate = 0;
    expect(calculateStreak(data, asOf)).toBe(2);
  });

  it('returns 0 when the asOf day itself is incomplete', () => {
    const asOf = moment('2024-03-15');
    const data = completeRange(asOf, 3);
    data[asOf.format('YYYY-MM-DD')].habits.pullups = false;
    expect(calculateStreak(data, asOf)).toBe(0);
  });

  it('returns 0 for a date in the future', () => {
    const future = moment().add(5, 'day');
    expect(calculateStreak(completeRange(future, 3), future)).toBe(0);
  });
});
