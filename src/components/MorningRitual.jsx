import React from 'react';
import HabitRow from './HabitRow';
import { isSunday } from '../utils/scheduleUtils';

function MorningRitual({ habits, isoWeekday, workoutSchedule, onToggleHabit, disabled, onOpenTimer, stretchLink }) {
  const sunday = isSunday(isoWeekday);
  const workoutRest = workoutSchedule.type === 'Rest';

  // Workout label varies by day
  const workoutLabel = workoutRest ? 'Workout' : workoutSchedule.type;

  // Build action button for workout row
  let workoutAction = null;
  if (workoutSchedule.hasTimer) {
    workoutAction = { type: 'button', label: '20 min', onClick: onOpenTimer };
  }

  // Stretch action button (active Mon-Sat)
  let stretchAction = null;
  if (!sunday && stretchLink) {
    stretchAction = { type: 'link', label: 'WLC stretch', href: stretchLink };
  }

  return (
    <section className="section">
      <h2 className="section-header">Morning Ritual</h2>

      {/* Workout */}
      <HabitRow
        label={workoutLabel}
        checked={!!habits.workout}
        onToggle={() => onToggleHabit('workout')}
        disabled={disabled || workoutRest}
        isRest={workoutRest}
        actionButton={workoutAction}
      />

      {/* Pull-ups — active on all days except Sunday */}
      <HabitRow
        label="Pull-ups"
        checked={!!habits.pullups}
        onToggle={() => onToggleHabit('pullups')}
        disabled={disabled || sunday}
        isRest={sunday}
      />

      {/* Stretch — active Mon-Sat */}
      <HabitRow
        label="Stretch"
        checked={!!habits.stretch}
        onToggle={() => onToggleHabit('stretch')}
        disabled={disabled || sunday}
        isRest={sunday}
        actionButton={stretchAction}
      />

      {/* Outside time — Sunday only */}
      {sunday && (
        <HabitRow
          label="Outside time"
          checked={!!habits.outside}
          onToggle={() => onToggleHabit('outside')}
          disabled={disabled}
        />
      )}

      {/* Read + Coffee — always active, reward styling */}
      <HabitRow
        label="Read + Coffee"
        checked={!!habits.readCoffee}
        onToggle={() => onToggleHabit('readCoffee')}
        disabled={disabled}
        rewardStyle
        emoji="☕"
      />
    </section>
  );
}

export default MorningRitual;
