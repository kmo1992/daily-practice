// src/components/DailyScoreboard.jsx

import React, { useEffect, useRef } from 'react';
import { FaFire, FaAppleAlt } from 'react-icons/fa';
import confetti from 'canvas-confetti';

function DailyScoreboard({
  habitPoints = 0,
  nutritionPoints = 0,
  displayDate = null,
  isToday = false
}) {
  const totalPoints = habitPoints + nutritionPoints;
  const maxPoints = 10;
  const progressPercent = (totalPoints / maxPoints) * 100;
  const isComplete = totalPoints >= maxPoints;
  const prevCompleteRef = useRef(false);

  // Trigger celebration when goal is achieved
  useEffect(() => {
    const wasComplete = prevCompleteRef.current;
    if (isComplete && !wasComplete && isToday) {
      // Subtle celebration animation
      const duration = 2000;
      const end = Date.now() + duration;

      const colors = ['#FFD700', '#FFA500', '#FF6347'];

      (function frame() {
        confetti({
          particleCount: 3,
          angle: 60,
          spread: 55,
          origin: { x: 0, y: 0.6 },
          colors: colors,
          gravity: 0.8,
          scalar: 0.8,
        });
        confetti({
          particleCount: 3,
          angle: 120,
          spread: 55,
          origin: { x: 1, y: 0.6 },
          colors: colors,
          gravity: 0.8,
          scalar: 0.8,
        });

        if (Date.now() < end) {
          requestAnimationFrame(frame);
        }
      })();
    }
    prevCompleteRef.current = isComplete;
  }, [isComplete, isToday]);

  return (
    <div className={`daily-scoreboard${isComplete ? ' complete' : ''}`}>
      <div className="daily-scoreboard-header">
        <div className="daily-scoreboard-title-row">
          <h2 className="daily-scoreboard-title">Daily Score</h2>
          {displayDate && (
            <span className="daily-scoreboard-date">
              {displayDate.format('ddd MMM D')}
              {isToday && <span className="daily-scoreboard-today-badge">Today</span>}
            </span>
          )}
        </div>
        <div className="daily-scoreboard-total">
          <span className="daily-scoreboard-total-value">{totalPoints}</span>
          <span className="daily-scoreboard-total-max">/{maxPoints}</span>
        </div>
      </div>

      <div className="daily-scoreboard-progress">
        <div className="daily-scoreboard-progress-track">
          <div
            className={`daily-scoreboard-progress-fill${isComplete ? ' complete' : ''}`}
            style={{ width: `${progressPercent}%` }}
          ></div>
        </div>
      </div>

      <div className="daily-scoreboard-breakdown">
        <div className="daily-scoreboard-item habits">
          <div className="daily-scoreboard-item-icon">
            <FaFire />
          </div>
          <div className="daily-scoreboard-item-content">
            <span className="daily-scoreboard-item-label">Habits</span>
            <span className="daily-scoreboard-item-value">{habitPoints}/5</span>
          </div>
        </div>

        <div className="daily-scoreboard-divider"></div>

        <div className="daily-scoreboard-item nutrition">
          <div className="daily-scoreboard-item-icon">
            <FaAppleAlt />
          </div>
          <div className="daily-scoreboard-item-content">
            <span className="daily-scoreboard-item-label">Nutrition</span>
            <span className="daily-scoreboard-item-value">{nutritionPoints}/5</span>
          </div>
        </div>
      </div>

      {isComplete && (
        <div className="daily-scoreboard-badge">
          <span className="daily-scoreboard-badge-text">Goal Achieved!</span>
        </div>
      )}
    </div>
  );
}

export default DailyScoreboard;
