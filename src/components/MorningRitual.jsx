import React from 'react';
import HabitRow from './HabitRow';
import { isSunday } from '../utils/scheduleUtils';

function MorningRitual({ habits, isoWeekday, workoutSchedule, onToggleHabit, disabled, onOpenTimer, workoutLink, stretchLink }) {
  const sunday = isSunday(isoWeekday);

  // Workout label varies by day
  const workoutLabels = {
    'Burpees': 'Burpees',
    'Video workout': 'Video Workout',
    'Navy Seals': 'Navy Seals',
    'Rest': 'Workout',
  };
  const workoutLabel = workoutLabels[workoutSchedule.type] || 'Workout';

  // Build action button for workout row
  let workoutAction = null;
  if (!sunday && workoutSchedule.hasTimer) {
    workoutAction = { type: 'button', label: '20 min', onClick: onOpenTimer };
  } else if (!sunday && workoutSchedule.hasLink && workoutLink) {
    workoutAction = { type: 'link', label: 'Open video', href: workoutLink };
  }

  // Stretch action button
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
        disabled={disabled || sunday}
        isRest={sunday}
        actionButton={workoutAction}
      />

      {/* Pull-ups */}
      <HabitRow
        label="Pull-ups"
        checked={!!habits.pullups}
        onToggle={() => onToggleHabit('pullups')}
        disabled={disabled || sunday}
        isRest={sunday}
      />

      {/* Stretch */}
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
