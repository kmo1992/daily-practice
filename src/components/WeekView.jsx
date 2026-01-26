// src/components/WeekView.jsx

import React, { useEffect, useMemo, useState } from 'react';
import DayCard from './DayCard';
import NavigationButtons from './NavigationButtons';
import WeeklyChart from './WeeklyChart';
import EntireChallengeChart from './EntireChallengeChart';
import MorningFlowTabs from './MorningFlowTabs';
import NutritionListPanel from './NutritionListPanel';
import Modal from './Modal';
import { FaAppleAlt, FaBullseye, FaChartBar, FaTrophy } from 'react-icons/fa';
import { getAppToday, getChallengeStartDate, getChallengeEndDate } from '../utils/dateUtils';
import { getScheduleForDay, getWeekStartKey, parseCount } from '../utils/scheduleUtils';
import WeeklyGoalsPanel from './WeeklyGoalsPanel';

function WeekView({
  data,
  weekGoals,
  onUpdateDay,
  onUpdateWeek,
  activeModal = null,
  onCloseModal = null,
}) {
  const [currentWeekStart, setCurrentWeekStart] = useState(() =>
    getAppToday().startOf('isoWeek')
  );
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

  const handleCloseModal = () => {
    if (onCloseModal) {
      onCloseModal();
    }
  };

  return (
    <div className="week-view">
      <MorningFlowTabs data={data} weekGoals={weekGoals} onUpdateDay={onUpdateDay} />
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
      <Modal
        isOpen={activeModal === 'nutrition'}
        kicker="Nutrition"
        title="Nutrition List"
        icon={<FaAppleAlt />}
        onClose={handleCloseModal}
      >
        <NutritionListPanel />
      </Modal>
      <Modal
        isOpen={activeModal === 'weekly-goals'}
        title="Weekly Workout Goals"
        icon={<FaBullseye />}
        onClose={handleCloseModal}
      >
        <WeeklyGoalsPanel
          weekStart={currentWeekStart}
          weekStartKey={weekStartKey}
          weekGoals={currentWeekGoals}
          weeklySummary={weeklySummary}
          onUpdateWeek={onUpdateWeek}
        />
      </Modal>
      <Modal
        isOpen={activeModal === 'weekly-progress'}
        title="Weekly Progress"
        icon={<FaChartBar />}
        onClose={handleCloseModal}
      >
        <WeeklyChart currentWeekStart={currentWeekStart} data={data} />
      </Modal>
      <Modal
        isOpen={activeModal === 'challenge-progress'}
        title="Entire Challenge Progress"
        icon={<FaTrophy />}
        onClose={handleCloseModal}
      >
        <EntireChallengeChart data={data} />
      </Modal>
    </div>
  );
}

export default WeekView;
