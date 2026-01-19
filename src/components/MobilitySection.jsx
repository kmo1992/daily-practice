import React from 'react';
import { getMobilityPractice, getLivingRoomWorkout } from '../utils/practiceUtils';
import { getChallengeStartDate } from '../utils/dateUtils';
import { getBurpeeOptions, getNavyBurpeeOptions, parseCount } from '../utils/scheduleUtils';
import BurpeeTimer from './BurpeeTimer';

function MobilitySection(props) {
  const {
    date,
    hideWorkout = false,
    schedule,
    onUpdateDay,
    pullupsValue,
    burpeesValue,
    pullupOptions = [],
    weekGoals
  } = props; // Destructure including weekGoals

  const [showTimer, setShowTimer] = React.useState(false);

  const dayOfWeek = date.isoWeekday(); // 1 (Monday) to 7 (Sunday)
  const isSunday = dayOfWeek === 7;

  // Determine goal based on schedule type
  let goalReps = 0;
  if (schedule?.burpeeType === 'regular') {
    goalReps = parseCount(weekGoals?.regularBurpeesGoalTotal);
  } else if (schedule?.burpeeType === 'navy') {
    goalReps = parseCount(weekGoals?.navySealBurpeesGoalTotal);
  }

  // Use goalReps if available, otherwise fallback to manually selected value (burpeesValue)
  const timerReps = goalReps > 0 ? goalReps : (burpeesValue || 0);

  if (dayOfWeek === 7) {
    // Sunday
    return (
      <div className="mobility">
        <span>Go Outside!</span>
        <span>&nbsp;</span>
      </div>
    );
  } else {
    // ... existing logic ...
    const startDate = getChallengeStartDate();
    const daysSinceStart = date.clone().startOf('day').diff(startDate.clone().startOf('day'), 'days');
    const numSundays = Math.floor((daysSinceStart + startDate.isoWeekday() - 1) / 7);
    const workoutIndex = daysSinceStart - numSundays;

    const livingRoomWorkout = hideWorkout ? null : getLivingRoomWorkout(workoutIndex);
    const mobilityPractice = getMobilityPractice(dayOfWeek);

    return (
      <div className="mobility">
        <BurpeeTimer
          isOpen={showTimer}
          onClose={() => setShowTimer(false)}
          totalReps={timerReps}
        />
        {!isSunday && schedule?.hasBurpees && (
          <div className="mobility-inputs">
            {schedule?.hasBurpees && (
              <label className="practice-select-label">
                <span
                  className="practice-text clickable"
                  onClick={() => setShowTimer(true)}
                  style={{ cursor: 'pointer', color: '#007bff' }}
                  title={`Click to open timer (Goal: ${goalReps || 'Not Set'})`}
                >
                  {schedule.burpeeType === 'navy' ? 'Navy SEALs' : 'Burpees'}
                </span>
                <select
                  value={burpeesValue}
                  onChange={(event) =>
                    onUpdateDay({
                      burpeesTotalReps: parseCount(event.target.value),
                      burpeeType: schedule.burpeeType,
                    })
                  }
                >
                  <option value=""></option>
                  {(schedule?.burpeeType === 'navy'
                    ? getNavyBurpeeOptions()
                    : getBurpeeOptions()
                  ).map((value) => (
                    <option key={value} value={value}>
                      {value}
                    </option>
                  ))}
                </select>
              </label>
            )}
          </div>
        )}
        <div className="mobility-lines">
          {livingRoomWorkout && (
            <a href={livingRoomWorkout.url} target="_blank" rel="noopener noreferrer">
              {livingRoomWorkout.name}
            </a>
          )}
          {!isSunday && schedule?.hasPullups && (
            <label className="practice-select-label">
              <span className="practice-text">Pull ups</span>
              <select
                value={pullupsValue}
                onChange={(event) => onUpdateDay({ pullups: parseCount(event.target.value) })}
              >
                <option value=""></option>
                {pullupOptions.map((value) => (
                  <option key={value} value={value}>
                    {value}
                  </option>
                ))}
              </select>
            </label>
          )}
          <a href={mobilityPractice.url} target="_blank" rel="noopener noreferrer">
            {mobilityPractice.name}
          </a>
        </div>
      </div>
    );
  }
}

export default MobilitySection;
