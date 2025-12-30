// src/components/WeekView.jsx

import React, { useEffect, useMemo, useState } from 'react';
import moment from 'moment';
import DayCard from './DayCard';
import NavigationButtons from './NavigationButtons';
import WeeklyChart from './WeeklyChart';
import EntireChallengeChart from './EntireChallengeChart';
import { getChallengeStartDate, getChallengeEndDate } from '../utils/dateUtils';

function WeekView({ data, onUpdateDay }) {
  const [currentWeekStart, setCurrentWeekStart] = useState(moment().startOf('isoWeek'));

  const startDate = useMemo(() => getChallengeStartDate(), []);
  const endDate = useMemo(() => getChallengeEndDate(), []);

  // Keep navigation within the challenge period
  useEffect(() => {
    const boundedStart = startDate.clone().startOf('isoWeek');
    const boundedEnd = endDate.clone().startOf('isoWeek');

    if (currentWeekStart.isBefore(boundedStart)) {
      setCurrentWeekStart(boundedStart);
    } else if (currentWeekStart.isAfter(boundedEnd)) {
      setCurrentWeekStart(boundedEnd);
    }
  }, [currentWeekStart, startDate, endDate]);

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
