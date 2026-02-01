// src/components/NavigationButtons.jsx

import React from 'react';
import moment from 'moment';
import { getChallengeStartDate } from '../utils/dateUtils';

function NavigationButtons({ currentWeekStart, setCurrentWeekStart }) {
  const startDate = getChallengeStartDate();

  const prevWeek = () => {
    setCurrentWeekStart(currentWeekStart.clone().subtract(1, 'week'));
  };

  const nextWeek = () => {
    setCurrentWeekStart(currentWeekStart.clone().add(1, 'week'));
  };

  const isPrevDisabled = currentWeekStart.isSameOrBefore(startDate.clone().startOf('isoWeek'));
  // No upper limit - allow infinite forward navigation
  const isNextDisabled = false;

  return (
    <div className="navigation-buttons">
      <button onClick={prevWeek} disabled={isPrevDisabled}>
        Previous Week
      </button>
      <span style={{ whiteSpace: 'nowrap', flexGrow: 1, textAlign: 'center' }}>
        {currentWeekStart.format('MMM D')} -{' '}
        {currentWeekStart.clone().endOf('isoWeek').format('MMM D')}
      </span>
      <button onClick={nextWeek} disabled={isNextDisabled}>
        Next Week
      </button>
    </div>
  );
}

export default NavigationButtons;
