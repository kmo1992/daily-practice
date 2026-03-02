import React, { useState, useMemo } from 'react';
import DayNavigation from './DayNavigation';
import StreakDisplay from './StreakDisplay';
import DailyTargets from './DailyTargets';
import MorningRitual from './MorningRitual';
import EndOfDay from './EndOfDay';
import FourAgreements from './FourAgreements';
import Attributions from './Attributions';
import BurpeeTimer from './BurpeeTimer';
import SundayReflection from './SundayReflection';
import { getAppToday, isFutureDate } from '../utils/dateUtils';
import { getWorkoutForDay, getWeekStartKey, getMobilityIndex, getDailyTargets, resolveWeekGoals } from '../utils/scheduleUtils';
import { calculateStreak } from '../utils/streakUtils';
import { mobilityPractices } from '../data/practicesData';

function DayView({ data, weekGoals, onUpdateDay, onOpenSettings }) {
  const [currentDate, setCurrentDate] = useState(() => getAppToday());
  const [showTimer, setShowTimer] = useState(false);

  const dateStr = currentDate.format('YYYY-MM-DD');
  const isoWeekday = currentDate.isoWeekday();
  const isToday = currentDate.isSame(getAppToday(), 'day');
  const isFuture = isFutureDate(currentDate);
  const isReadOnly = isFuture;

  const dayData = data[dateStr] || {};
  const habits = dayData.habits || {};

  const workoutSchedule = getWorkoutForDay(isoWeekday);
  const weekStartKey = getWeekStartKey(currentDate);
  const currentWeekGoals = resolveWeekGoals(weekGoals, weekStartKey);

  const streak = useMemo(() => calculateStreak(data, currentDate), [data, currentDate]);

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
    if (isFuture) return;
    const currentValue = !!habits[habitKey];
    const newValue = forceValue !== undefined ? forceValue : !currentValue;
    if (newValue === currentValue) return;

    const updatedHabits = { ...habits, [habitKey]: newValue };
    onUpdateDay(dateStr, {
      habits: updatedHabits,
      workoutType: workoutSchedule.type,
    });
  };

  const handleSetEatAtTable = (count) => {
    if (isFuture) return;
    const updatedHabits = { ...habits, eatAtTable: count };
    onUpdateDay(dateStr, {
      habits: updatedHabits,
      workoutType: workoutSchedule.type,
    });
  };

  const handleSetHydration = (count) => {
    if (isFuture) return;
    const updatedHabits = { ...habits, hydrate: count };
    onUpdateDay(dateStr, {
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
        stretchLink={stretchLink}
      />

      <BurpeeTimer
        isOpen={showTimer}
        onClose={() => setShowTimer(false)}
        totalReps={(() => {
          const targets = getDailyTargets(isoWeekday, currentWeekGoals);
          return targets?.burpees || targets?.navySeals || 0;
        })()}
      />

      {isoWeekday === 7 && (() => {
        const nextWeekKey = getWeekStartKey(currentDate.clone().add(1, 'day'));
        const nextWeekExplicit = weekGoals[nextWeekKey];
        const hasTargetsSet = !!(nextWeekExplicit && Object.keys(nextWeekExplicit).length > 0);
        return (
          <SundayReflection
            onOpenSettings={onOpenSettings}
            hasTargetsSet={hasTargetsSet}
          />
        );
      })()}

      <EndOfDay
        habits={habits}
        onSetEatAtTable={handleSetEatAtTable}
        onSetHydration={handleSetHydration}
        disabled={isReadOnly}
      />

      <FourAgreements collapsed={isoWeekday === 7} />

      <Attributions />
    </div>
  );
}

export default DayView;
