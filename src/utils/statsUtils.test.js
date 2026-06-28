import { describe, it, expect } from 'vitest';
import moment from 'moment';
import {
  getDayCompletion,
  calculateLongestStreak,
  getCompletionStats,
  getConsistencyWeeks,
  getPullupHistory,
} from './statsUtils';

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

const range = (endDate, n, build) => {
  const data = {};
  const d = moment(endDate);
  for (let i = 0; i < n; i++) {
    data[d.format('YYYY-MM-DD')] = build();
    d.subtract(1, 'day');
  }
  return data;
};

describe('getDayCompletion', () => {
  it('returns none for missing data', () => {
    expect(getDayCompletion(undefined, 3)).toBe('none');
    expect(getDayCompletion({}, 3)).toBe('none');
  });

  it('returns full when all trackable habits are satisfied', () => {
    expect(getDayCompletion(completeDay(), 3)).toBe('full');
  });

  it('returns partial when only some habits are satisfied', () => {
    const day = { habits: { workout: true, pullups: true } }; // Wed needs more
    expect(getDayCompletion(day, 3)).toBe('partial');
  });
});

describe('calculateLongestStreak', () => {
  it('is 0 with no complete days', () => {
    expect(calculateLongestStreak({})).toBe(0);
  });

  it('finds the longest consecutive run across the data', () => {
    // 3-day run ending 2024-03-10, gap, then 5-day run ending 2024-03-20
    const data = {
      ...range('2024-03-10', 3, completeDay),
      ...range('2024-03-20', 5, completeDay),
    };
    expect(calculateLongestStreak(data)).toBe(5);
  });

  it('does not count non-adjacent complete days as a run', () => {
    const data = {
      '2024-03-01': completeDay(),
      '2024-03-05': completeDay(),
    };
    expect(calculateLongestStreak(data)).toBe(1);
  });
});

describe('getCompletionStats', () => {
  it('counts complete days within the window', () => {
    const data = range('2024-03-15', 5, completeDay);
    expect(getCompletionStats(data, moment('2024-03-15'), 30)).toEqual({ completed: 5, total: 30 });
  });
});

describe('getConsistencyWeeks', () => {
  it('returns the requested number of 7-day weeks', () => {
    const weeks = getConsistencyWeeks({}, moment('2024-03-15'), 12);
    expect(weeks).toHaveLength(12);
    weeks.forEach((w) => expect(w).toHaveLength(7));
  });

  it('marks days after the end date as future', () => {
    // 2024-03-13 is a Wednesday; later days in its week are future
    const weeks = getConsistencyWeeks({}, moment('2024-03-13'), 1);
    const lastWeek = weeks[weeks.length - 1];
    expect(lastWeek[6].isFuture).toBe(true); // Sunday after Wed
    expect(lastWeek[0].isFuture).toBe(false); // Monday before Wed
  });
});

describe('getPullupHistory', () => {
  it('returns logged sessions oldest-first, skipping empty days', () => {
    const data = {
      '2024-03-10': { habits: { pullupsCount: 5 } },
      '2024-03-11': { habits: { pullupsCount: 0 } },
      '2024-03-12': { habits: { pullupsCount: 8 } },
    };
    const history = getPullupHistory(data, moment('2024-03-12'), 14);
    expect(history).toEqual([
      { date: '2024-03-10', reps: 5 },
      { date: '2024-03-12', reps: 8 },
    ]);
  });

  it('caps the number of sessions returned', () => {
    const data = range('2024-03-20', 20, () => ({ habits: { pullupsCount: 4 } }));
    expect(getPullupHistory(data, moment('2024-03-20'), 14)).toHaveLength(14);
  });
});
