import React, { useState, useMemo } from 'react';
import moment from 'moment';
import DayNavigation from './DayNavigation';
import StreakDisplay from './StreakDisplay';
import DailyTargets from './DailyTargets';
import MorningRitual from './MorningRitual';
import EndOfDay from './EndOfDay';
import WorkoutTimer from './WorkoutTimer';
import { getAppToday, isFutureDate } from '../utils/dateUtils';
import { getWorkoutForDay, getWeekStartKey, getVideoWorkoutIndex, getMobilityIndex } from '../utils/scheduleUtils';
import { calculateStreak } from '../utils/streakUtils';
import { livingRoomWorkouts, mobilityPractices } from '../data/practicesData';

function DayView({ data, weekGoals, onUpdateDay }) {
  const [currentDate, setCurrentDate] = useState(() => getAppToday());
  const [showTimer, setShowTimer] = useState(false);

  const dateStr = currentDate.format('YYYY-MM-DD');
  const isoWeekday = currentDate.isoWeekday();
  const isToday = currentDate.isSame(getAppToday(), 'day');
  const isFuture = isFutureDate(currentDate);
  const isReadOnly = !isToday;

  const dayData = data[dateStr] || {};
  const habits = dayData.habits || {};
  const journal = dayData.journal || '';

  const workoutSchedule = getWorkoutForDay(isoWeekday);
  const weekStartKey = getWeekStartKey(currentDate);
  const currentWeekGoals = weekGoals[weekStartKey] || {};

  const streak = useMemo(() => calculateStreak(data, currentDate), [data, currentDate]);

  // Resolve video workout link
  const workoutLink = useMemo(() => {
    if (!workoutSchedule.hasLink) return null;
    const index = getVideoWorkoutIndex(currentDate);
    const workout = livingRoomWorkouts[index % livingRoomWorkouts.length];
    return workout?.url || null;
  }, [currentDate, workoutSchedule.hasLink]);

  // Resolve stretch link
  const stretchLink = useMemo(() => {
    const idx = getMobilityIndex(isoWeekday);
    const practice = mobilityPractices[idx % mobilityPractices.length];
    return practice?.url || null;
  }, [isoWeekday]);

  const handleNavigate = (newDate) => {
    setShowTimer(false);
    setCurrentDate(newDate);
  };

  const handleToggleHabit = (habitKey, forceValue) => {
    if (isReadOnly) return;
    const currentValue = !!habits[habitKey];
    const newValue = forceValue !== undefined ? forceValue : !currentValue;
    if (newValue === currentValue) return;

    const updatedHabits = { ...habits, [habitKey]: newValue };
    onUpdateDay(dateStr, {
      habits: updatedHabits,
      workoutType: workoutSchedule.type,
    });
  };

  const handleSaveJournal = (text) => {
    if (isReadOnly) return;
    const hasText = text.trim().length > 0;
    const updatedHabits = { ...habits, journal: hasText };
    onUpdateDay(dateStr, {
      journal: text,
      habits: updatedHabits,
      workoutType: workoutSchedule.type,
    });
  };

  if (isFuture) {
    return (
      <div>
        <DayNavigation currentDate={currentDate} onNavigate={handleNavigate} isToday={isToday} />
        <p className="future-day">Nothing here yet.</p>
      </div>
    );
  }

  return (
    <div>
      <DayNavigation currentDate={currentDate} onNavigate={handleNavigate} isToday={isToday} />
      <StreakDisplay streak={streak} />
      <DailyTargets isoWeekday={isoWeekday} weekGoals={currentWeekGoals} />

      <MorningRitual
        habits={habits}
        isoWeekday={isoWeekday}
        workoutSchedule={workoutSchedule}
        onToggleHabit={handleToggleHabit}
        disabled={isReadOnly}
        onOpenTimer={() => setShowTimer(true)}
        workoutLink={workoutLink}
        stretchLink={stretchLink}
      />

      <WorkoutTimer isOpen={showTimer} onClose={() => setShowTimer(false)} />

      <EndOfDay
        habits={habits}
        journal={journal}
        onToggleHabit={handleToggleHabit}
        onSaveJournal={handleSaveJournal}
        disabled={isReadOnly}
      />
    </div>
  );
}

export default DayView;
