// src/components/DayCard.jsx

import React from 'react';
import moment from 'moment';
import PracticeItem from './PracticeItem';
import MobilitySection from './MobilitySection';
import { practices } from '../data/practices';
import { getChallengeStartDate, getChallengeEndDate } from '../utils/dateUtils';

function DayCard({ date, data, onUpdateDay }) {
  const dateStr = date.format('YYYY-MM-DD');
  const today = moment();
  const isToday = date.isSame(today, 'day');

  const startDate = getChallengeStartDate();
  const endDate = getChallengeEndDate();
  const inChallenge = date.isBetween(startDate.clone().subtract(1, 'day'), endDate.clone().add(1, 'day'), 'day');

  const dayData = data[dateStr] || {};

  const handleUpdate = (newData) => {
    onUpdateDay(dateStr, newData);
  };

  return (
    <div
      className={`day-card ${isToday ? 'today' : ''} ${
        !inChallenge ? 'not-in-challenge' : ''
      }`}
    >
      <h3>{date.format('ddd D')}</h3>
      <div className="practices-container">
        {inChallenge ? (
          practices.map((practice) => (
            <PracticeItem
              key={practice.name}
              practice={practice}
              dayData={dayData}
              handleUpdate={handleUpdate}
            />
          ))
        ) : (
          <span>Not Part of Challenge</span>
        )}
      </div>
      <MobilitySection date={date} />
    </div>
  );
}

export default DayCard;
