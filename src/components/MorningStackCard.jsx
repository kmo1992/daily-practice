// src/components/MorningStackCard.jsx

import React from 'react';
import { FaArrowUp, FaBookOpen, FaDumbbell, FaMoon, FaSun, FaStar } from 'react-icons/fa';
import { GrYoga } from 'react-icons/gr';
import BurpeeTimer from './BurpeeTimer';
import Stepper from './Stepper';
import { getAppToday, getChallengeStartDate, isFutureDate } from '../utils/dateUtils';
import { getLivingRoomWorkout, getMobilityPractice } from '../utils/practiceUtils';
import {
  getBurpeeOptions,
  getNavyBurpeeOptions,
  getPullupOptions,
  getWeekStartKey,
  getScheduleForDay,
  parseCount,
} from '../utils/scheduleUtils';

function MorningStackCard({ data = {}, weekGoals = {}, onUpdateDay = null, selectedDate = null }) {
  const [showTimer, setShowTimer] = React.useState(false);
  const displayDate = selectedDate || getAppToday();
  const weekStartKey = getWeekStartKey(displayDate);
  const currentWeekGoals = weekGoals[weekStartKey] || {};
  const dateStr = displayDate.format('YYYY-MM-DD');
  const dayData = data[dateStr] || {};
  const practices = dayData.practices || [];
  const sleepWellSet = typeof dayData.sleepWell === 'boolean';
  const isFuture = isFutureDate(displayDate);
  const isEditable = onUpdateDay && !isFuture;
  const [animateStack, setAnimateStack] = React.useState(false);
  const prevSleepWellSet = React.useRef(sleepWellSet);

  // Completion detection for green pulse animation
  const [completedStepIds, setCompletedStepIds] = React.useState(new Set());
  const prevStepsRef = React.useRef([]);
  const stepRefs = React.useRef({});

  React.useEffect(() => {
    const wasSet = prevSleepWellSet.current;
    if (!wasSet && sleepWellSet) {
      setAnimateStack(true);
    } else if (!sleepWellSet) {
      setAnimateStack(false);
    }
    prevSleepWellSet.current = sleepWellSet;
  }, [sleepWellSet]);

  // Detect newly completed habits for animation
  React.useEffect(() => {
    if (!sleepWellSet) return; // Skip if sleep gate not passed

    const prevPractices = prevStepsRef.current;
    const currentPractices = {
      burpees: practices.includes('Burpees'),
      pullups: practices.includes('Pullups'),
      stretch: practices.includes('Stretch'),
      read: practices.includes('Read'),
      water: practices.includes('Water'),
    };

    // Initialize on first render
    if (Object.keys(prevPractices).length === 0) {
      prevStepsRef.current = currentPractices;
      return;
    }

    // Find newly completed habits
    const newlyCompleted = [];
    if (currentPractices.burpees && !prevPractices.burpees) newlyCompleted.push('workout');
    if (currentPractices.pullups && !prevPractices.pullups) newlyCompleted.push('pullups');
    if (currentPractices.stretch && !prevPractices.stretch) newlyCompleted.push('mobility');
    if (currentPractices.read && !prevPractices.read) newlyCompleted.push('reward');
    if (currentPractices.water && !prevPractices.water) newlyCompleted.push('water');

    if (newlyCompleted.length > 0) {
      setCompletedStepIds(new Set(newlyCompleted));

      // Clear animation after 1.2s
      const timer = setTimeout(() => setCompletedStepIds(new Set()), 1200);
      prevStepsRef.current = currentPractices;
      return () => clearTimeout(timer);
    }

    prevStepsRef.current = currentPractices;
  }, [sleepWellSet, practices]);

  const cardClassName = `morning-stack-card${animateStack ? ' morning-stack-reveal' : ''}`;

  const handleSleepChoice = (sleptWell) => {
    if (!onUpdateDay) {
      return;
    }
    const updatedPractices = new Set(practices);
    if (sleptWell) {
      updatedPractices.add('Sleep');
    } else {
      updatedPractices.delete('Sleep');
    }
    onUpdateDay(dateStr, {
      sleepWell: sleptWell,
      practices: Array.from(updatedPractices),
    });
  };

  if (!sleepWellSet) {
    return (
      <section className={cardClassName}>
        <div className="morning-stack-gate">
          <div className="primer-header">
            <span className="primer-icon night">
              <FaMoon />
            </span>
            <div>
              <p className="primer-kicker">Start the day</p>
              <h2 className="primer-title">Did you sleep well last night?</h2>
            </div>
          </div>
          <div className="primer-actions">
            <button
              className="primer-choice yes"
              type="button"
              disabled={!isEditable}
              onClick={() => handleSleepChoice(true)}
            >
              Yes
            </button>
            <button
              className="primer-choice no"
              type="button"
              disabled={!isEditable}
              onClick={() => handleSleepChoice(false)}
            >
              No
            </button>
          </div>
        </div>
      </section>
    );
  }

  const dayOfWeek = displayDate.isoWeekday();
  const schedule = getScheduleForDay(dayOfWeek);

  const burpeeReps = parseCount(dayData.burpeesTotalReps);
  const pullupsReps = parseCount(dayData.pullups);
  const burpeesValue =
    dayData.burpeesTotalReps !== undefined ? parseCount(dayData.burpeesTotalReps) : 0;
  const pullupsValue = dayData.pullups !== undefined ? parseCount(dayData.pullups) : 0;

  const isSunday = dayOfWeek === 7;
  const startDate = getChallengeStartDate();
  const daysSinceStart = displayDate.clone().startOf('day').diff(startDate.clone().startOf('day'), 'days');
  const numSundays = Math.floor((daysSinceStart + startDate.isoWeekday() - 1) / 7);
  const workoutIndex = Math.max(0, daysSinceStart - numSundays);
  const livingRoomWorkout =
    !schedule.hasBurpees && !isSunday && daysSinceStart >= 0
      ? getLivingRoomWorkout(workoutIndex)
      : null;
  const mobilityPractice = !isSunday ? getMobilityPractice(dayOfWeek) : null;
  const workoutDone = practices.includes('Burpees') || practices.includes('Exercise'); // Exercise for backward compatibility
  const pullupsDone = practices.includes('Pullups');
  const mobilityDone = practices.includes('Stretch');
  const readingDone = practices.includes('Read');
  const outsideDone = practices.includes('Exercise') && practices.includes('Stretch');
  const coffeeDone = isSunday ? true : workoutDone && pullupsDone && mobilityDone;

  const workoutMeta = schedule.hasBurpees
    ? schedule.burpeeType === 'navy'
      ? 'Navy SEALs'
      : 'Burpees'
    : livingRoomWorkout
      ? 'Video workout'
      : 'Other exercise';

  // Calculate burpee goal for metadata display
  const burpeeGoal =
    schedule.hasBurpees && schedule.burpeeType === 'regular'
      ? parseCount(currentWeekGoals.regularBurpeesGoalTotal)
      : schedule.hasBurpees && schedule.burpeeType === 'navy'
        ? parseCount(currentWeekGoals.navySealBurpeesGoalTotal)
        : 0;

  const workoutMetaText = schedule.hasBurpees
    ? burpeeReps > 0
      ? burpeeGoal > 0
        ? `${workoutMeta} - ${burpeeReps}/${burpeeGoal} reps`
        : `${workoutMeta} - ${burpeeReps} reps`
      : burpeeGoal > 0
        ? `${workoutMeta} - Goal: ${burpeeGoal} reps`
        : workoutMeta
    : workoutMeta;

  const updatePractices = (updater) => {
    if (!onUpdateDay) {
      return;
    }
    const updatedPractices = updater(new Set(practices));
    onUpdateDay(dateStr, { practices: Array.from(updatedPractices) });
  };

  const handlePracticeToggle = (practiceName) => (event) => {
    const checked = event.target.checked;
    updatePractices((updatedPractices) => {
      if (checked) {
        updatedPractices.add(practiceName);
      } else {
        updatedPractices.delete(practiceName);
      }
      return updatedPractices;
    });
  };

  const handleBurpeeChange = (nextValue) => {
    if (!onUpdateDay) {
      return;
    }
    const value = parseCount(nextValue);
    const updatedPractices = new Set(practices);

    // Calculate burpee goal for this session
    const burpeeGoal =
      schedule.hasBurpees && schedule.burpeeType === 'regular'
        ? parseCount(currentWeekGoals.regularBurpeesGoalTotal)
        : schedule.hasBurpees && schedule.burpeeType === 'navy'
          ? parseCount(currentWeekGoals.navySealBurpeesGoalTotal)
          : 0;

    // Auto-mark Burpees when goal is reached (or any reps if no goal set)
    const burpeeGoalMet = burpeeGoal > 0 ? value >= burpeeGoal : value > 0;

    if (burpeeGoalMet) {
      updatedPractices.add('Burpees');
    } else {
      updatedPractices.delete('Burpees');
    }

    // Remove old 'Exercise' if it exists (for backward compatibility)
    updatedPractices.delete('Exercise');

    onUpdateDay(dateStr, {
      burpeesTotalReps: value,
      burpeeType: schedule.burpeeType,
      practices: Array.from(updatedPractices),
    });
  };

  const handlePullupChange = (nextValue) => {
    if (!onUpdateDay) {
      return;
    }
    const value = parseCount(nextValue);
    const updatedPractices = new Set(practices);

    // Get pullup goal from week goals
    const pullupGoal = parseCount(currentWeekGoals.pullupsGoalPerSession);

    // Auto-mark Pullups when goal is reached (or any reps if no goal set)
    const pullupGoalMet = pullupGoal > 0 ? value >= pullupGoal : value > 0;

    if (pullupGoalMet) {
      updatedPractices.add('Pullups');
    } else {
      updatedPractices.delete('Pullups');
    }

    // Remove old 'Exercise' if it exists (for backward compatibility)
    updatedPractices.delete('Exercise');

    onUpdateDay(dateStr, {
      pullups: value,
      practices: Array.from(updatedPractices),
    });
  };

  const handleSundayOutsideToggle = (event) => {
    if (!onUpdateDay) {
      return;
    }
    const checked = event.target.checked;
    const updatedPractices = new Set(practices);
    if (checked) {
      updatedPractices.add('Exercise');
      updatedPractices.add('Stretch');
    } else {
      updatedPractices.delete('Exercise');
      updatedPractices.delete('Stretch');
    }
    onUpdateDay(dateStr, { practices: Array.from(updatedPractices) });
  };

  const rewardMeta = 'Enjoy a cup of coffee';
  const goalReps =
    schedule.hasBurpees && schedule.burpeeType === 'regular'
      ? parseCount(currentWeekGoals.regularBurpeesGoalTotal)
      : schedule.hasBurpees && schedule.burpeeType === 'navy'
        ? parseCount(currentWeekGoals.navySealBurpeesGoalTotal)
        : 0;
  const timerReps = goalReps > 0 ? goalReps : burpeeReps;
  const burpeeOptions = schedule.hasBurpees
    ? schedule.burpeeType === 'navy'
      ? getNavyBurpeeOptions()
      : getBurpeeOptions()
    : [];
  const pullupOptions = getPullupOptions();
  const burpeeMax = burpeeOptions.length > 0 ? burpeeOptions[burpeeOptions.length - 1] : 0;
  const pullupMax = pullupOptions.length > 0 ? pullupOptions[pullupOptions.length - 1] : 0;
  const burpeeStep = schedule.burpeeType === 'regular' ? 2 : 1;

  const workoutControls = schedule.hasBurpees ? (
    <div className="morning-step-field">
      <span>Reps</span>
      <Stepper
        value={burpeesValue}
        min={0}
        max={burpeeMax}
        step={burpeeStep}
        quickAdd={5}
        disabled={!isEditable}
        ariaLabel="Burpee reps"
        onChange={handleBurpeeChange}
      />
    </div>
  ) : null;

  const pullupControls = (
    <div className="morning-step-field">
      <span>Reps</span>
      <Stepper
        value={pullupsValue}
        min={0}
        max={pullupMax}
        step={1}
        quickAdd={5}
        disabled={!isEditable}
        ariaLabel="Pull-up reps"
        onChange={handlePullupChange}
      />
    </div>
  );

  const workoutLinks = [];

  if (schedule.hasBurpees) {
    workoutLinks.push({
      id: 'burpee-timer',
      label: 'Start burpee timer',
      onClick: () => setShowTimer(true),
    });
  }

  if (livingRoomWorkout) {
    workoutLinks.push({
      id: 'workout-video',
      label: 'Workout video',
      href: livingRoomWorkout.url,
    });
  }

  const mobilityLinks = mobilityPractice
    ? [
        {
          id: 'mobility-video',
          label: 'Mobility video',
          href: mobilityPractice.url,
        },
      ]
    : [];

  const steps = isSunday
    ? [
        {
          id: 'coffee',
          label: 'Coffee',
          meta: 'First ritual',
          icon: null,
          done: coffeeDone,
          tone: 'warm',
        },
        {
          id: 'reading',
          label: 'Read',
          meta: rewardMeta,
          icon: <FaBookOpen />,
          done: readingDone,
          toggleable: true,
          onToggle: handlePracticeToggle('Read'),
          tone: 'cool',
        },
        {
          id: 'outside',
          label: 'Go outside!',
          meta: 'Workout + mobility',
          icon: <FaSun />,
          done: outsideDone,
          toggleable: true,
          onToggle: handleSundayOutsideToggle,
          tone: 'neutral',
        },
      ]
    : [
        {
          id: 'workout',
          label: 'Workout',
          meta: workoutMetaText,
          icon: <FaDumbbell />,
          done: workoutDone,
          controls: workoutControls,
          links: workoutLinks,
          tone: 'heat',
          priority: true,
        },
        {
          id: 'pullups',
          label: 'Pull-ups',
          meta:
            pullupsReps > 0
              ? parseCount(currentWeekGoals.pullupsGoalPerSession) > 0
                ? `${pullupsReps}/${parseCount(currentWeekGoals.pullupsGoalPerSession)} reps`
                : `${pullupsReps} reps`
              : parseCount(currentWeekGoals.pullupsGoalPerSession) > 0
                ? `Goal: ${parseCount(currentWeekGoals.pullupsGoalPerSession)} reps`
                : 'Log reps',
          icon: <FaArrowUp />,
          done: pullupsDone,
          controls: pullupControls,
          tone: 'warm',
        },
        {
          id: 'mobility',
          label: 'Mobility',
          meta: 'Flow + reset',
          icon: <GrYoga />,
          done: mobilityDone,
          toggleable: true,
          onToggle: handlePracticeToggle('Stretch'),
          links: mobilityLinks,
          tone: 'neutral',
          priority: true,
        },
        {
          id: 'reward',
          label: 'Read',
          meta: rewardMeta,
          icon: (
            <FaBookOpen />
          ),
          done: readingDone,
          toggleable: true,
          onToggle: handlePracticeToggle('Read'),
          tone: 'cool',
        },
      ];

  const completedSteps = steps.filter((step) => step.done).length;
  const progressPercent = Math.round((completedSteps / steps.length) * 100);
  const firstIncomplete = steps.findIndex((step) => !step.done);
  const activeStepNumber = firstIncomplete === -1 ? steps.length : firstIncomplete + 1;
  const toneMap = {
    heat: 'var(--heat)',
    warm: 'var(--warm)',
    neutral: 'var(--neutral)',
    cool: 'var(--cool)',
  };
  const progressToneCount = Math.max(1, completedSteps);
  const progressTones = steps
    .slice(0, progressToneCount)
    .map((step) => toneMap[step.tone])
    .filter(Boolean);
  const progressGradient =
    progressTones.length <= 1
      ? progressTones[0] || 'var(--cool)'
      : `linear-gradient(90deg, ${progressTones
          .map((color, index) => {
            const percent = Math.round((index / (progressTones.length - 1)) * 100);
            return `${color} ${percent}%`;
          })
          .join(', ')})`;

  const stepsWithState = steps.map((step, index) => {
    let state = 'locked';
    if (step.done) {
      state = 'done';
    } else if (index === firstIncomplete) {
      state = 'next';
    }
    return { ...step, state, stepNumber: index + 1, priority: step.priority || false };
  });

  const accentDoneIds = new Set(['mobility', 'reward', 'reading']);

  const identityLabel = isSunday
    ? 'Relax Day'
    : schedule.hasBurpees
      ? schedule.burpeeType === 'navy'
        ? 'Navy SEAL Practitioner'
        : 'Burpee Practitioner'
      : 'Consistency Builder';

  const progressLabel =
    completedSteps === steps.length
      ? isSunday
        ? 'Sunday stack complete.'
        : 'Stack complete.'
      : `${completedSteps} of ${steps.length} complete`;

  return (
    <section className={cardClassName}>
      {schedule.hasBurpees && (
        <BurpeeTimer
          isOpen={showTimer}
          onClose={() => setShowTimer(false)}
          totalReps={timerReps}
        />
      )}
      <div className="morning-stack-header">
        <div className="morning-stack-heading">
          <p className="morning-stack-kicker">Pinned stack</p>
          <div className="morning-stack-title-row">
            <h2 className="morning-stack-title">Morning Stack</h2>
            <span className="morning-stack-date">{displayDate.format('ddd MMM D')}</span>
          </div>
          <div className="morning-stack-identity-row">
            <span className="morning-stack-identity">{identityLabel}</span>
          </div>
        </div>
      </div>

      <div className="morning-stack-progress">
        <div className="morning-stack-progress-track">
          <div
            className={`morning-stack-progress-fill ${completedSteps === steps.length ? 'complete' : ''}`}
            style={{ width: `${progressPercent}%`, '--progress-gradient': progressGradient }}
          ></div>
        </div>
        <span className="morning-stack-progress-text">{progressLabel}</span>
      </div>

      <div className="morning-stack-steps-header">
        <span className="morning-stack-steps-title">
          Step {activeStepNumber} of {steps.length}
        </span>
        <span className="morning-stack-steps-caption">Effort → ease → calm</span>
      </div>

      <div className="morning-stack-steps">
        {stepsWithState.map((step) => {
          const accentDone = step.done && accentDoneIds.has(step.id);
          const justCompleted = completedStepIds.has(step.id);
          return (
          <div
            key={step.id}
            ref={(el) => (stepRefs.current[step.id] = el)}
            className={`morning-step ${step.state}${accentDone ? ' accent-done' : ''}${
              step.tone ? ` tone-${step.tone}` : ''
            }${step.priority ? ' priority' : ''}${justCompleted ? ' just-completed' : ''}`}
          >
            <span className="morning-step-index">
              {String(step.stepNumber).padStart(2, '0')}
            </span>
            {step.priority && (
              <span className="morning-step-priority-badge" aria-label="Priority habit">
                <FaStar />
              </span>
            )}
            {step.icon && <span className="morning-step-icon">{step.icon}</span>}
            <div className="morning-step-text">
              <span className="morning-step-label">{step.label}</span>
              {step.meta && <span className="morning-step-meta">{step.meta}</span>}
              {step.links && step.links.length > 0 && (
                <div className="morning-step-links">
                  {step.links.map((link) =>
                    link.href ? (
                      <a
                        key={link.id}
                        className="morning-step-link"
                        href={link.href}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {link.label}
                      </a>
                    ) : (
                      <button
                        key={link.id}
                        className="morning-step-link"
                        type="button"
                        onClick={link.onClick}
                      >
                        {link.label}
                      </button>
                    ),
                  )}
                </div>
              )}
            </div>
            {step.controls && (
              <div className="morning-step-aside">
                <div className="morning-step-controls">{step.controls}</div>
                <span className={`morning-step-state ${step.state}`}>
                  {step.state === 'done' ? 'Done' : step.state === 'next' ? 'Next' : 'Locked'}
                </span>
              </div>
            )}
            {step.toggleable ? (
              <label className="morning-step-toggle">
                <input type="checkbox" checked={step.done} onChange={step.onToggle} disabled={!isEditable} />
                <span className="morning-toggle-track">
                  <span className="morning-toggle-thumb"></span>
                </span>
                <span className="morning-toggle-label">{step.done ? 'Done' : 'Mark done'}</span>
              </label>
            ) : (
              !step.controls && (
                <span className={`morning-step-state ${step.state}`}>
                  {step.state === 'done' ? 'Done' : step.state === 'next' ? 'Next' : 'Locked'}
                </span>
              )
            )}
          </div>
        );
        })}
      </div>
    </section>
  );
}

export default MorningStackCard;
