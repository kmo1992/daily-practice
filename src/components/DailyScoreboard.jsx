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
      // Big celebration — initial burst from both sides
      const colors = ['#FFD700', '#FFA500', '#FF6347', '#f093fb', '#22c55e', '#60a5fa'];

      // Massive opening volley
      confetti({
        particleCount: 80,
        angle: 60,
        spread: 70,
        origin: { x: 0, y: 0.6 },
        colors,
        gravity: 0.7,
        scalar: 1.1,
        ticks: 200,
      });
      confetti({
        particleCount: 80,
        angle: 120,
        spread: 70,
        origin: { x: 1, y: 0.6 },
        colors,
        gravity: 0.7,
        scalar: 1.1,
        ticks: 200,
      });

      // Sustained shower for 3.5 seconds
      const duration = 3500;
      const end = Date.now() + duration;

      (function frame() {
        confetti({
          particleCount: 6,
          angle: 60,
          spread: 60,
          origin: { x: 0, y: 0.55 },
          colors,
          gravity: 0.8,
          scalar: 0.9,
        });
        confetti({
          particleCount: 6,
          angle: 120,
          spread: 60,
          origin: { x: 1, y: 0.55 },
          colors,
          gravity: 0.8,
          scalar: 0.9,
        });

        if (Date.now() < end) {
          requestAnimationFrame(frame);
        }
      })();

      // Second big burst halfway through
      setTimeout(() => {
        confetti({
          particleCount: 60,
          spread: 100,
          origin: { x: 0.5, y: 0.4 },
          colors,
          gravity: 0.6,
          scalar: 1.2,
          ticks: 180,
        });
      }, 1200);

      // Haptic feedback on mobile
      if ('vibrate' in navigator) {
        navigator.vibrate([30, 50, 30]);
      }
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
