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

export const getChallengeStartDate = () => moment('2026-01-05');
export const getChallengeEndDate = () => moment('2026-02-15');
