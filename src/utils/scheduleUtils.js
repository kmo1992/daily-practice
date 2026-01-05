export const WEEKDAY_SCHEDULE = {
  1: {
    label: 'Regular Burpees + Pull-ups',
    burpeeType: 'regular',
    hasBurpees: true,
    hasPullups: true,
  },
  2: {
    label: 'Other Exercise + Pull-ups',
    hasBurpees: false,
    hasPullups: true,
  },
  3: {
    label: 'Navy SEAL Burpees + Pull-ups',
    burpeeType: 'navy',
    hasBurpees: true,
    hasPullups: true,
  },
  4: {
    label: 'Other Exercise + Pull-ups',
    hasBurpees: false,
    hasPullups: true,
  },
  5: {
    label: 'Regular Burpees + Pull-ups',
    burpeeType: 'regular',
    hasBurpees: true,
    hasPullups: true,
  },
  6: {
    label: 'Navy SEAL Burpees + Pull-ups',
    burpeeType: 'navy',
    hasBurpees: true,
    hasPullups: true,
  },
  7: {
    label: 'OFF + Weekly Goals + Review',
    hasBurpees: false,
    hasPullups: false,
  },
};

export const getScheduleForDay = (dayOfWeek) =>
  WEEKDAY_SCHEDULE[dayOfWeek] || WEEKDAY_SCHEDULE[7];

export const getWeekStartKey = (date) => date.clone().startOf('isoWeek').format('YYYY-MM-DD');

export const parseCount = (value) => {
  const parsed = parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : 0;
};

export const getBurpeeOptions = () => {
  const values = [];
  for (let i = 0; i <= 200; i += 2) {
    values.push(i);
  }
  return values;
};

export const getPullupOptions = () => Array.from({ length: 51 }, (_, index) => index);

export const getNavyBurpeeOptions = () => Array.from({ length: 201 }, (_, index) => index);
