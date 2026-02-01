import moment from 'moment';

const DEBUG_DATE_STORAGE_KEY = 'wlct-debug-date';

const getDebugDateString = () => {
  if (!import.meta.env?.DEV || typeof window === 'undefined') {
    return null;
  }
  const params = new URLSearchParams(window.location.search);
  return params.get('debugDate') || window.localStorage.getItem(DEBUG_DATE_STORAGE_KEY);
};

export const getAppToday = () => {
  const now = moment();
  const debugDate = getDebugDateString();
  if (!debugDate) {
    return now;
  }
  const parsed = moment(debugDate, 'YYYY-MM-DD', true);
  return parsed.isValid() ? parsed : now;
};

// Legacy functions kept for backward compatibility
// The app is now an ongoing lifestyle tracker, not a 6-week challenge
export const getChallengeStartDate = () => moment('2026-01-05'); // First day of tracking
export const getChallengeEndDate = () => null; // No end date - ongoing tracking

// Check if a date is in the future (for view-only mode)
export const isFutureDate = (date) => {
  const today = getAppToday().startOf('day');
  return date.isAfter(today, 'day');
};
