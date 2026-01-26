// src/components/MorningStackCard.jsx

import React from 'react';
import { FaArrowUp, FaBookOpen, FaDumbbell, FaMoon, FaSun } from 'react-icons/fa';
import { GrYoga } from 'react-icons/gr';
import BurpeeTimer from './BurpeeTimer';
import { getAppToday, getChallengeStartDate } from '../utils/dateUtils';
import { getLivingRoomWorkout, getMobilityPractice } from '../utils/practiceUtils';
import {
  getBurpeeOptions,
  getNavyBurpeeOptions,
  getPullupOptions,
  getWeekStartKey,
  getScheduleForDay,
  parseCount,
} from '../utils/scheduleUtils';

function MorningStackCard({ data = {}, weekGoals = {}, onUpdateDay = null }) {
  const [showTimer, setShowTimer] = React.useState(false);
  const today = getAppToday();
  const weekStartKey = getWeekStartKey(today);
  const currentWeekGoals = weekGoals[weekStartKey] || {};
  const dateStr = today.format('YYYY-MM-DD');
  const dayData = data[dateStr] || {};
  const practices = dayData.practices || [];
  const sleepWellSet = typeof dayData.sleepWell === 'boolean';
  const [animateStack, setAnimateStack] = React.useState(false);
  const prevSleepWellSet = React.useRef(sleepWellSet);

  React.useEffect(() => {
    const wasSet = prevSleepWellSet.current;
    if (!wasSet && sleepWellSet) {
      setAnimateStack(true);
    } else if (!sleepWellSet) {
      setAnimateStack(false);
    }
    prevSleepWellSet.current = sleepWellSet;
  }, [sleepWellSet]);

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
              disabled={!onUpdateDay}
              onClick={() => handleSleepChoice(true)}
            >
              Yes
            </button>
            <button
              className="primer-choice no"
              type="button"
              disabled={!onUpdateDay}
              onClick={() => handleSleepChoice(false)}
            >
              No
            </button>
          </div>
        </div>
      </section>
    );
  }

  const dayOfWeek = today.isoWeekday();
  const schedule = getScheduleForDay(dayOfWeek);

  const burpeeReps = parseCount(dayData.burpeesTotalReps);
  const pullupsReps = parseCount(dayData.pullups);
  const burpeesValue = dayData.burpeesTotalReps !== undefined ? parseCount(dayData.burpeesTotalReps) : '';
  const pullupsValue = dayData.pullups !== undefined ? parseCount(dayData.pullups) : '';

  const isSunday = dayOfWeek === 7;
  const startDate = getChallengeStartDate();
  const daysSinceStart = today.clone().startOf('day').diff(startDate.clone().startOf('day'), 'days');
  const numSundays = Math.floor((daysSinceStart + startDate.isoWeekday() - 1) / 7);
  const workoutIndex = Math.max(0, daysSinceStart - numSundays);
  const livingRoomWorkout =
    !schedule.hasBurpees && !isSunday && daysSinceStart >= 0
      ? getLivingRoomWorkout(workoutIndex)
      : null;
  const mobilityPractice = !isSunday ? getMobilityPractice(dayOfWeek) : null;
  const workoutDone = schedule.hasBurpees
    ? practices.includes('Exercise') || burpeeReps > 0
    : practices.includes('Exercise');
  const pullupsDone = pullupsReps > 0;
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

  const workoutMetaText =
    burpeeReps > 0 ? `${workoutMeta} - ${burpeeReps} reps` : workoutMeta;

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

  const handleBurpeeChange = (event) => {
    if (!onUpdateDay) {
      return;
    }
    const value = parseCount(event.target.value);
    const updatedPractices = new Set(practices);
    const shouldMarkExercise = value > 0 && pullupsReps > 0;
    if (shouldMarkExercise) {
      updatedPractices.add('Exercise');
    } else {
      updatedPractices.delete('Exercise');
    }
    onUpdateDay(dateStr, {
      burpeesTotalReps: value,
      burpeeType: schedule.burpeeType,
      practices: Array.from(updatedPractices),
    });
  };

  const handlePullupChange = (event) => {
    if (!onUpdateDay) {
      return;
    }
    const value = parseCount(event.target.value);
    const updatedPractices = new Set(practices);
    if (schedule.hasBurpees) {
      const shouldMarkExercise = value > 0 && burpeeReps > 0;
      if (shouldMarkExercise) {
        updatedPractices.add('Exercise');
      } else {
        updatedPractices.delete('Exercise');
      }
    }
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

  const workoutControls = schedule.hasBurpees ? (
    <label className="morning-step-field">
      <span>Reps</span>
      <select
        className="morning-step-select"
        value={burpeesValue}
        onChange={handleBurpeeChange}
        disabled={!onUpdateDay}
      >
        <option value=""></option>
        {burpeeOptions.map((value) => (
          <option key={value} value={value}>
            {value}
          </option>
        ))}
      </select>
    </label>
  ) : null;

  const pullupControls = (
    <label className="morning-step-field">
      <span>Reps</span>
      <select
        className="morning-step-select"
        value={pullupsValue}
        onChange={handlePullupChange}
        disabled={!onUpdateDay}
      >
        <option value=""></option>
        {pullupOptions.map((value) => (
          <option key={value} value={value}>
            {value}
          </option>
        ))}
      </select>
    </label>
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
        },
        {
          id: 'pullups',
          label: 'Pull-ups',
          meta: pullupsReps > 0 ? `${pullupsReps} reps` : 'Log reps',
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
    return { ...step, state, stepNumber: index + 1 };
  });

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
            <span className="morning-stack-date">{today.format('ddd MMM D')}</span>
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
            style={{ width: `${progressPercent}%`, background: progressGradient }}
          ></div>
        </div>
        <span className="morning-stack-progress-text">{progressLabel}</span>
      </div>

      <div className="morning-stack-steps-header">
        <span className="morning-stack-steps-title">
          Step {activeStepNumber} of {steps.length}
        </span>
        <span className="morning-stack-steps-caption">Effort -> ease -> calm</span>
      </div>

      <div className="morning-stack-steps">
        {stepsWithState.map((step) => (
          <div
            key={step.id}
            className={`morning-step ${step.state}${step.tone ? ` tone-${step.tone}` : ''}`}
          >
            <span className="morning-step-index">
              {String(step.stepNumber).padStart(2, '0')}
            </span>
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
                <input type="checkbox" checked={step.done} onChange={step.onToggle} />
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
        ))}
      </div>
    </section>
  );
}

export default MorningStackCard;
