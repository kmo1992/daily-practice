// src/components/DayCard.jsx

import React, { useMemo } from 'react';
import PracticeItem from './PracticeItem';
import MobilitySection from './MobilitySection';
import { practices } from '../data/practices';
import { getAppToday, getChallengeStartDate, getChallengeEndDate } from '../utils/dateUtils';
import { getScheduleForDay, parseCount } from '../utils/scheduleUtils';

const PULLUP_OPTIONS = Array.from({ length: 51 }, (_, index) => index);

function DayCard({ date, data, onUpdateDay, weekGoals }) {
  const dateStr = date.format('YYYY-MM-DD');
  const today = getAppToday();
  const isToday = date.isSame(today, 'day');
  const dayOfWeek = date.isoWeekday();
  const schedule = useMemo(() => getScheduleForDay(dayOfWeek), [dayOfWeek]);
  const isSunday = dayOfWeek === 7;

  const startDate = getChallengeStartDate();
  const endDate = getChallengeEndDate();
  const inChallenge = date.isBetween(startDate.clone().subtract(1, 'day'), endDate.clone().add(1, 'day'), 'day');

  const dayData = data[dateStr] || {};

  const handleUpdate = (newData) => {
    onUpdateDay(dateStr, newData);
  };

  const pullupsValue = dayData.pullups !== undefined ? parseCount(dayData.pullups) : '';
  const burpeesValue = dayData.burpeesTotalReps !== undefined ? parseCount(dayData.burpeesTotalReps) : '';

  return (
    <div
      id={`day-${dateStr}`}
      className={`day-card ${isToday ? 'today' : ''} ${!inChallenge ? 'not-in-challenge' : ''
        }`}
    >
      <h3>{date.format('ddd D')}</h3>
      <div className="practices-container">
        {inChallenge ? (
          <>
            {practices.map((practice) => (
              <PracticeItem
                key={practice.name}
                practice={practice}
                dayData={dayData}
                handleUpdate={handleUpdate}
              />
            ))}
          </>
        ) : (
          <span>Not Part of Challenge</span>
        )}
      </div>
      <MobilitySection
        date={date}
        hideWorkout={schedule.hasBurpees}
        schedule={schedule}
        dayData={dayData}
        onUpdateDay={handleUpdate}
        pullupsValue={pullupsValue}
        burpeesValue={burpeesValue}
        pullupOptions={PULLUP_OPTIONS}
        weekGoals={weekGoals}
      />
    </div>
  );
}

export default DayCard;
