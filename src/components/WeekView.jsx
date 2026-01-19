// src/components/WeekView.jsx

import React, { useEffect, useMemo, useState } from 'react';
import moment from 'moment';
import DayCard from './DayCard';
import NavigationButtons from './NavigationButtons';
import WeeklyChart from './WeeklyChart';
import EntireChallengeChart from './EntireChallengeChart';
import { getChallengeStartDate, getChallengeEndDate } from '../utils/dateUtils';
import { getScheduleForDay, getWeekStartKey, parseCount } from '../utils/scheduleUtils';
import WeeklyGoalsPanel from './WeeklyGoalsPanel';

function WeekView({ data, weekGoals, onUpdateDay, onUpdateWeek }) {
  const [currentWeekStart, setCurrentWeekStart] = useState(moment().startOf('isoWeek'));

  const startDate = useMemo(() => getChallengeStartDate(), []);
  const endDate = useMemo(() => getChallengeEndDate(), []);
  const weekStartKey = useMemo(() => getWeekStartKey(currentWeekStart), [currentWeekStart]);

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

  const currentWeekGoals = weekGoals[weekStartKey] || {};
  const regularGoalPerSession = parseCount(currentWeekGoals.regularBurpeesGoalTotal);
  const navyGoalPerSession = parseCount(currentWeekGoals.navySealBurpeesGoalTotal);
  const pullupsGoalPerSession = parseCount(currentWeekGoals.pullupsGoalPerSession);

  const weeklySummary = useMemo(() => {
    let regularActualTotal = 0;
    let navyActualTotal = 0;
    let pullupsActualTotal = 0;
    let regularSessionCount = 0;
    let navySessionCount = 0;
    let regularAchievedCount = 0;
    let navyAchievedCount = 0;
    let pullupsSessionCount = 0;
    let pullupsAchievedCount = 0;

    [...Array(7)].forEach((_, i) => {
      const date = currentWeekStart.clone().add(i, 'days');
      const dateStr = date.format('YYYY-MM-DD');
      const dayData = data[dateStr] || {};
      const pullups = parseCount(dayData.pullups);
      const burpees = parseCount(dayData.burpeesTotalReps);
      const schedule = getScheduleForDay(date.isoWeekday());

      if (schedule.hasPullups) {
        pullupsSessionCount += 1;
        pullupsActualTotal += pullups;
        if (pullupsGoalPerSession > 0 && pullups >= pullupsGoalPerSession) {
          pullupsAchievedCount += 1;
        }
      }

      if (schedule.hasBurpees && schedule.burpeeType === 'regular') {
        regularSessionCount += 1;
        regularActualTotal += burpees;
        if (regularGoalPerSession > 0 && burpees >= regularGoalPerSession) {
          regularAchievedCount += 1;
        }
      }

      if (schedule.hasBurpees && schedule.burpeeType === 'navy') {
        navySessionCount += 1;
        navyActualTotal += burpees;
        if (navyGoalPerSession > 0 && burpees >= navyGoalPerSession) {
          navyAchievedCount += 1;
        }
      }
    });

    return {
      regularActualTotal,
      navyActualTotal,
      pullupsActualTotal,
      pullupsGoalTotal: pullupsGoalPerSession * pullupsSessionCount,
      regularSessionCount,
      navySessionCount,
      regularAchievedCount,
      navyAchievedCount,
      pullupsSessionCount,
      pullupsAchievedCount,
      regularGoalPerSession,
      navyGoalPerSession,
      pullupsGoalPerSession,
      regularWeeklyGoalTotal: regularGoalPerSession * regularSessionCount,
      navyWeeklyGoalTotal: navyGoalPerSession * navySessionCount,
    };
  }, [currentWeekStart, data, regularGoalPerSession, navyGoalPerSession, pullupsGoalPerSession]);

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
              weekGoals={currentWeekGoals}
              onUpdateDay={onUpdateDay}
            />
          );
        })}
      </div>
      <WeeklyGoalsPanel
        weekStart={currentWeekStart}
        weekStartKey={weekStartKey}
        weekGoals={currentWeekGoals}
        weeklySummary={weeklySummary}
        onUpdateWeek={onUpdateWeek}
      />
      <WeeklyChart currentWeekStart={currentWeekStart} data={data} />
      <EntireChallengeChart data={data} />
    </div>
  );
}

export default WeekView;
