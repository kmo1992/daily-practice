import { useState, useMemo } from 'react';
import DayNavigation from './DayNavigation';
import StreakDisplay from './StreakDisplay';
import MorningTargets from './MorningTargets';
import MorningRitual from './MorningRitual';
import EndOfDay from './EndOfDay';
import FourAgreements from './FourAgreements';
import Attributions from './Attributions';
import BurpeeTimer from './BurpeeTimer';
import FormCoach from './FormCoach';
import SundayReflection from './SundayReflection';
import TomorrowPreview from './TomorrowPreview';
import { getAppToday, isFutureDate } from '../utils/dateUtils';
import { getWorkoutForDay, getWeekStartKey, getMobilityIndex, getDailyTargets, resolveWeekGoals } from '../utils/scheduleUtils';
import { calculateStreak } from '../utils/streakUtils';
import { mobilityPractices } from '../data/practicesData';

function DayView({ data, weekGoals, onUpdateDay, onOpenSettings }) {
  const [currentDate, setCurrentDate] = useState(() => getAppToday());
  const [showTimer, setShowTimer] = useState(false);
  const [showFormCoach, setShowFormCoach] = useState(false);

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
    setShowFormCoach(false);
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

  const handleAcceptTargets = (acceptedTargets) => {
    if (isFuture) return;
    onUpdateDay(dateStr, {
      acceptedTargets,
      targetsAcceptedAt: new Date().toISOString(),
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

  const handleSetPullups = (count) => {
    if (isFuture) return;
    // Keep the boolean in sync so streak/completion logic still works
    const updatedHabits = { ...habits, pullups: count > 0, pullupsCount: count };
    onUpdateDay(dateStr, {
      habits: updatedHabits,
      workoutType: workoutSchedule.type,
    });
  };

  const handleSaveFormSession = (session) => {
    if (isFuture) return;
    onUpdateDay(dateStr, {
      formSession: { ...session, gradedAt: new Date().toISOString() },
      workoutType: workoutSchedule.type,
    });
  };

  // Today's pull-up target: the accepted number if set, else the schedule's
  const pullupsTarget = (() => {
    const accepted = dayData.acceptedTargets;
    if (accepted && accepted.pullups != null) return accepted.pullups;
    const targets = getDailyTargets(isoWeekday, currentWeekGoals);
    return targets?.pullups || 0;
  })();

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
      <MorningTargets
        isoWeekday={isoWeekday}
        weekGoals={currentWeekGoals}
        dayData={dayData}
        isToday={isToday}
        disabled={isReadOnly}
        onAccept={handleAcceptTargets}
      />

      <MorningRitual
        habits={habits}
        isoWeekday={isoWeekday}
        workoutSchedule={workoutSchedule}
        onToggleHabit={handleToggleHabit}
        disabled={isReadOnly}
        onOpenTimer={() => setShowTimer(true)}
        onOpenFormCoach={() => setShowFormCoach(true)}
        stretchLink={stretchLink}
        pullupsCount={Number(habits.pullupsCount) || (habits.pullups ? pullupsTarget : 0)}
        pullupsTarget={pullupsTarget}
        onSetPullups={handleSetPullups}
      />

      <BurpeeTimer
        isOpen={showTimer}
        onClose={() => setShowTimer(false)}
        totalReps={(() => {
          // Prefer the numbers you accepted for the day; fall back to the schedule
          const accepted = dayData.acceptedTargets;
          const targets = accepted || getDailyTargets(isoWeekday, currentWeekGoals);
          return targets?.burpees || targets?.navySeals || 0;
        })()}
      />

      <FormCoach
        isOpen={showFormCoach}
        onClose={() => setShowFormCoach(false)}
        workoutType={workoutSchedule.type}
        onSave={handleSaveFormSession}
      />

      {isoWeekday === 7 && (() => {
        const nextWeekKey = getWeekStartKey(currentDate.clone().add(1, 'day'));
        const nextWeekExplicit = weekGoals[nextWeekKey];
        const hasTargetsSet = !!(nextWeekExplicit && Object.keys(nextWeekExplicit).length > 0);
        const nextWeekGoals = resolveWeekGoals(weekGoals, nextWeekKey);
        return (
          <SundayReflection
            onOpenSettings={onOpenSettings}
            hasTargetsSet={hasTargetsSet}
            targets={nextWeekGoals}
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

      {isToday && (
        <TomorrowPreview date={currentDate.clone().add(1, 'day')} weekGoals={weekGoals} />
      )}

      <Attributions />
    </div>
  );
}

export default DayView;
