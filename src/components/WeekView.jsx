// src/components/WeekView.jsx

import React, { useState } from 'react';
import moment from 'moment';
import DayCard from './DayCard';
import NavigationButtons from './NavigationButtons';
import WeeklyChart from './WeeklyChart';
import EntireChallengeChart from './EntireChallengeChart';
import { getChallengeStartDate, getChallengeEndDate } from '../utils/dateUtils';

function WeekView({ data, onUpdateDay }) {
  const [currentWeekStart, setCurrentWeekStart] = useState(moment().startOf('isoWeek'));

  const startDate = getChallengeStartDate();
  const endDate = getChallengeEndDate();

  // Adjust currentWeekStart to be within the challenge period
  if (currentWeekStart.isBefore(startDate.clone().startOf('isoWeek'))) {
    setCurrentWeekStart(startDate.clone().startOf('isoWeek'));
  } else if (currentWeekStart.isAfter(endDate.clone().startOf('isoWeek'))) {
    setCurrentWeekStart(endDate.clone().startOf('isoWeek'));
  }

  return (
    <div className="week-view">
      <NavigationButtons
        currentWeekStart={currentWeekStart}
        setCurrentWeekStart={setCurrentWeekStart}
      />
      <div className="week-container">
        {[...Array(7)].map((_, i) => {
          const date = currentWeekStart.clone().add(i, 'days');
          const dateStr = date.format('YYYY-MM-DD');
          return (
              <DayCard
                key={dateStr}
                date={date}
                data={data}
                onUpdateDay={onUpdateDay}
              />
            );
          })}
      </div>
      <WeeklyChart currentWeekStart={currentWeekStart} data={data} />
      <EntireChallengeChart data={data} />
    </div>
  );
}

export default WeekView;
