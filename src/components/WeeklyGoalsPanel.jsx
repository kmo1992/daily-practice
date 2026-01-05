import React, { useEffect, useMemo, useState } from 'react';
import {
  getBurpeeOptions,
  getNavyBurpeeOptions,
  getPullupOptions,
  parseCount,
} from '../utils/scheduleUtils';

function WeeklyGoalsPanel({ weekStart, weekStartKey, weekGoals, weeklySummary, onUpdateWeek }) {
  const [regularGoal, setRegularGoal] = useState('');
  const [navyGoal, setNavyGoal] = useState('');
  const [pullupsGoal, setPullupsGoal] = useState('');

  useEffect(() => {
    const regularValue =
      weekGoals && weekGoals.regularBurpeesGoalTotal !== undefined
        ? String(weekGoals.regularBurpeesGoalTotal)
        : '';
    const navyValue =
      weekGoals && weekGoals.navySealBurpeesGoalTotal !== undefined
        ? String(weekGoals.navySealBurpeesGoalTotal)
        : '';
    const pullupsValue =
      weekGoals && weekGoals.pullupsGoalPerSession !== undefined
        ? String(weekGoals.pullupsGoalPerSession)
        : '';
    setRegularGoal(regularValue);
    setNavyGoal(navyValue);
    setPullupsGoal(pullupsValue);
  }, [weekGoals]);

  const progressRows = useMemo(() => {
    const pullupsGoalTotal = weeklySummary?.pullupsGoalTotal || 0;

    return [
      {
        key: 'regular',
        label: 'Regular burpees',
        actual: weeklySummary?.regularActualTotal || 0,
        goal: weeklySummary?.regularWeeklyGoalTotal || 0,
        sessions: weeklySummary?.regularSessionCount || 0,
        achieved: weeklySummary?.regularAchievedCount || 0,
      },
      {
        key: 'navy',
        label: 'Navy SEAL burpees',
        actual: weeklySummary?.navyActualTotal || 0,
        goal: weeklySummary?.navyWeeklyGoalTotal || 0,
        sessions: weeklySummary?.navySessionCount || 0,
        achieved: weeklySummary?.navyAchievedCount || 0,
      },
      {
        key: 'pullups',
        label: 'Pull-ups',
        actual: weeklySummary?.pullupsActualTotal || 0,
        goal: pullupsGoalTotal,
        sessions: weeklySummary?.pullupsSessionCount || 0,
        achieved: weeklySummary?.pullupsAchievedCount || 0,
      },
    ];
  }, [weeklySummary]);

  const handleSaveGoals = () => {
    if (!onUpdateWeek) return;
    onUpdateWeek(weekStartKey, {
      regularBurpeesGoalTotal: parseCount(regularGoal),
      navySealBurpeesGoalTotal: parseCount(navyGoal),
      pullupsGoalPerSession: parseCount(pullupsGoal),
    });
  };

  const regularPace = parseCount(regularGoal);
  const navyPace = parseCount(navyGoal);
  const regularSeconds = regularPace > 0 ? Math.round(1200 / regularPace) : 0;
  const navySeconds = navyPace > 0 ? Math.round(1200 / navyPace) : 0;

  return (
    <div className="weekly-goals-panel">
      <div className="weekly-goals-header">
        <h2>Weekly Burpee & Pull-up Goals</h2>
        <span>
          {weekStart.format('MMM D')} - {weekStart.clone().endOf('isoWeek').format('MMM D')}
        </span>
      </div>
      <div className="weekly-goals-content">
        <div className="weekly-goals-inputs">
          <label>
            Regular burpees goal per session
            <select value={regularGoal} onChange={(event) => setRegularGoal(event.target.value)}>
              <option value=""></option>
              {getBurpeeOptions().map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>
          </label>
          {regularPace > 0 && (
            <div className="pace-hint">Approx pace: {regularSeconds} sec per burpee</div>
          )}
          <label>
            Navy SEAL burpees goal per session
            <select value={navyGoal} onChange={(event) => setNavyGoal(event.target.value)}>
              <option value=""></option>
              {getNavyBurpeeOptions().map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>
          </label>
          {navyPace > 0 && (
            <div className="pace-hint">Approx pace: {navySeconds} sec per burpee</div>
          )}
          <label>
            Pull-ups goal per session
            <select value={pullupsGoal} onChange={(event) => setPullupsGoal(event.target.value)}>
              <option value=""></option>
              {getPullupOptions().map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>
          </label>
          <button type="button" className="workout-edit-button" onClick={handleSaveGoals}>
            Save goals
          </button>
        </div>
        <div className="weekly-progress">
          {progressRows.map((row) => {
            const goalValue = row.goal > 0 ? row.goal : 0;
            const percent = goalValue > 0 ? Math.min(row.actual / goalValue, 1) * 100 : 0;
            return (
              <div key={row.key} className="progress-row">
                <div className="progress-label">
                  <span>{row.label}</span>
                  <span>
                    {row.actual}/{row.goal}
                  </span>
                </div>
                {row.sessions !== undefined && (
                  <div className="progress-meta">
                    Sessions hit: {row.achieved}/{row.sessions}
                  </div>
                )}
                <div className="progress-track">
                  <div className="progress-fill" style={{ width: `${percent}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default WeeklyGoalsPanel;
