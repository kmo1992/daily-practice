// src/components/WeekView.jsx

import React, { useEffect, useMemo, useState } from 'react';
import NavigationButtons from './NavigationButtons';
import WeeklyChart from './WeeklyChart';
import EntireChallengeChart from './EntireChallengeChart';
import MorningFlowTabs from './MorningFlowTabs';
import NutritionListPanel from './NutritionListPanel';
import Modal from './Modal';
import { FaAppleAlt, FaBullseye, FaChartBar, FaTrophy } from 'react-icons/fa';
import { getAppToday, getChallengeStartDate, isFutureDate } from '../utils/dateUtils';
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
  const [selectedDate, setSelectedDate] = useState(() => getAppToday());
  const today = getAppToday();
  const startDate = useMemo(() => getChallengeStartDate(), []);
  const weekStartKey = useMemo(() => getWeekStartKey(currentWeekStart), [currentWeekStart]);
  const completionPractices = ['Sleep', 'Exercise', 'Stretch', 'Read', 'Water'];

  // Keep navigation within reasonable bounds (start from tracking start date)
  useEffect(() => {
    const boundedStart = startDate.clone().startOf('isoWeek');

    if (currentWeekStart.isBefore(boundedStart)) {
      setCurrentWeekStart(boundedStart);
    }
    // No upper bound - allow infinite future navigation
  }, [currentWeekStart, startDate]);

  // Keep selectedDate within the current week when week changes
  useEffect(() => {
    const weekEnd = currentWeekStart.clone().add(6, 'days');
    if (selectedDate.isBefore(currentWeekStart, 'day') || selectedDate.isAfter(weekEnd, 'day')) {
      // If selected date is outside the current week, move to the same day of week in the new week
      const dayOfWeek = selectedDate.isoWeekday();
      const newSelectedDate = currentWeekStart.clone().add(dayOfWeek - 1, 'days');
      setSelectedDate(newSelectedDate);
    }
  }, [currentWeekStart, selectedDate]);


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
      <NavigationButtons
        currentWeekStart={currentWeekStart}
        setCurrentWeekStart={setCurrentWeekStart}
      />
      <div className="week-date-strip sticky" role="list" aria-label="Weekly navigation">
        {[...Array(7)].map((_, i) => {
          const date = currentWeekStart.clone().add(i, 'days');
          const dateStr = date.format('YYYY-MM-DD');
          const dayData = data[dateStr] || {};
          const dayPractices = Array.isArray(dayData.practices) ? dayData.practices : [];
          const nutritionSet = dayData.nutritionPoints !== undefined;
          const allPracticesDone = completionPractices.every((name) => dayPractices.includes(name));
          const isComplete = allPracticesDone && nutritionSet;
          const isToday = date.isSame(today, 'day');
          const isSelected = date.isSame(selectedDate, 'day');
          const isFuture = isFutureDate(date);
          const isBeforeStart = date.isBefore(startDate, 'day');

          return (
            <button
              key={`strip-${dateStr}`}
              type="button"
              className={`week-date-chip${isComplete ? ' complete' : ''}${isToday ? ' today' : ''}${isSelected ? ' selected' : ''}${isFuture ? ' future' : ''}${isBeforeStart ? ' disabled' : ''}`}
              role="listitem"
              aria-label={`${date.format('ddd MMM D')}${isComplete ? ' completed' : ''}${isSelected ? ' selected' : ''}${isFuture ? ' future date' : ''}`}
              onClick={() => setSelectedDate(date)}
              disabled={isBeforeStart}
            >
              <span className="week-date-chip-day">{date.format('ddd')}</span>
              <span className="week-date-chip-date">{date.format('D')}</span>
              <span className={`week-date-chip-check${isComplete ? ' visible' : ''}`} aria-hidden="true">
                ✓
              </span>
            </button>
          );
        })}
      </div>
      <MorningFlowTabs
        data={data}
        weekGoals={weekGoals}
        onUpdateDay={onUpdateDay}
        selectedDate={selectedDate}
      />
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
        title="Progress History"
        icon={<FaTrophy />}
        onClose={handleCloseModal}
      >
        <EntireChallengeChart data={data} />
      </Modal>
    </div>
  );
}

export default WeekView;
