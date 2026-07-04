import { describe, it, expect } from 'vitest';
import moment from 'moment';
import {
  WORKOUT_SCHEDULE,
  getWorkoutForDay,
  isSunday,
  getTrackableHabits,
  getWeekStartKey,
  getDailyTargets,
  resolveWeekGoals,
  getMobilityIndex,
  COACH_BASELINE,
} from './scheduleUtils';

const GOALS = {
  regularBurpeesGoalTotal: 30,
  navySealBurpeesGoalTotal: 10,
  pullupsGoalPerSession: 3,
};

describe('getWorkoutForDay', () => {
  it('maps each weekday to its workout type', () => {
    expect(getWorkoutForDay(1).type).toBe('Burpees');
    expect(getWorkoutForDay(2).type).toBe('Rest');
    expect(getWorkoutForDay(3).type).toBe('Navy Seals');
    expect(getWorkoutForDay(4).type).toBe('Rest');
    expect(getWorkoutForDay(5).type).toBe('Burpees');
    expect(getWorkoutForDay(6).type).toBe('Navy Seals');
    expect(getWorkoutForDay(7).type).toBe('Rest');
  });

  it('falls back to Sunday (Rest) for out-of-range input', () => {
    expect(getWorkoutForDay(0)).toBe(WORKOUT_SCHEDULE[7]);
    expect(getWorkoutForDay(99)).toBe(WORKOUT_SCHEDULE[7]);
  });
});

describe('isSunday', () => {
  it('is true only for isoWeekday 7', () => {
    expect(isSunday(7)).toBe(true);
    [1, 2, 3, 4, 5, 6].forEach((d) => expect(isSunday(d)).toBe(false));
  });
});

describe('getTrackableHabits', () => {
  it('Sunday tracks rest-day habits (no workout/pullups/stretch)', () => {
    expect(getTrackableHabits(7)).toEqual(['outside', 'readCoffee', 'hydrate']);
  });

  it('workout-rest days (Tue/Thu) still track pull-ups and stretch but not workout', () => {
    const expected = ['pullups', 'stretch', 'readCoffee', 'hydrate'];
    expect(getTrackableHabits(2)).toEqual(expected);
    expect(getTrackableHabits(4)).toEqual(expected);
  });

  it('workout days track the workout too', () => {
    const expected = ['workout', 'pullups', 'stretch', 'readCoffee', 'hydrate'];
    [1, 3, 5, 6].forEach((d) => expect(getTrackableHabits(d)).toEqual(expected));
  });
});

describe('getWeekStartKey', () => {
  it('returns the Monday (ISO week start) for any day', () => {
    // 2024-03-13 is a Wednesday; its ISO week starts Monday 2024-03-11
    expect(getWeekStartKey(moment('2024-03-13'))).toBe('2024-03-11');
    // A Monday maps to itself
    expect(getWeekStartKey(moment('2024-03-11'))).toBe('2024-03-11');
    // A Sunday belongs to the week that started the prior Monday
    expect(getWeekStartKey(moment('2024-03-17'))).toBe('2024-03-11');
  });
});

describe('getDailyTargets', () => {
  it('returns null on Sunday (full rest)', () => {
    expect(getDailyTargets(7, GOALS)).toBeNull();
  });

  it('returns null when there are no week goals', () => {
    expect(getDailyTargets(1, null)).toBeNull();
  });

  it('includes burpees + pull-ups on a burpees day', () => {
    expect(getDailyTargets(1, GOALS)).toEqual({ burpees: 30, pullups: 3 });
  });

  it('includes navy seals + pull-ups on a navy seals day', () => {
    expect(getDailyTargets(3, GOALS)).toEqual({ navySeals: 10, pullups: 3 });
  });

  it('includes only pull-ups on a workout-rest day', () => {
    expect(getDailyTargets(2, GOALS)).toEqual({ pullups: 3 });
  });

  it('omits zero-valued targets and returns null when nothing remains', () => {
    const zero = { regularBurpeesGoalTotal: 0, navySealBurpeesGoalTotal: 0, pullupsGoalPerSession: 0 };
    expect(getDailyTargets(1, zero)).toBeNull();
    expect(getDailyTargets(2, zero)).toBeNull();
  });
});

describe('resolveWeekGoals', () => {
  it('returns a copy of the coach baseline when weekGoals is missing', () => {
    expect(resolveWeekGoals(null, '2024-03-11')).toEqual(COACH_BASELINE);
  });

  it('uses explicit goals for the requested week', () => {
    const weekGoals = { '2024-03-11': GOALS };
    expect(resolveWeekGoals(weekGoals, '2024-03-11')).toBe(GOALS);
  });

  it('carries over the most recent prior week within 4 weeks', () => {
    const prior = { regularBurpeesGoalTotal: 50, navySealBurpeesGoalTotal: 20, pullupsGoalPerSession: 5 };
    // target week 2024-03-11 is empty; prior week 2024-03-04 has goals
    const weekGoals = { '2024-03-04': prior, '2024-03-11': {} };
    expect(resolveWeekGoals(weekGoals, '2024-03-11')).toBe(prior);
  });

  it('falls back to coach baseline when the last explicit goals are >4 weeks back', () => {
    // 5 weeks before 2024-03-11 is 2024-02-05 — outside the 4-week lookback
    const weekGoals = { '2024-02-05': GOALS };
    expect(resolveWeekGoals(weekGoals, '2024-03-11')).toEqual(COACH_BASELINE);
  });
});

describe('getMobilityIndex', () => {
  it('Sunday returns 0', () => {
    expect(getMobilityIndex(7)).toBe(0);
  });

  it('Mon-Sat map to 0-5', () => {
    expect([1, 2, 3, 4, 5, 6].map(getMobilityIndex)).toEqual([0, 1, 2, 3, 4, 5]);
  });
});
