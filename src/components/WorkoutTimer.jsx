import React, { useState, useEffect, useRef, useCallback } from 'react';

const TOTAL_SECONDS = 1200; // 20 minutes

const formatTime = (seconds) => {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
};

function WorkoutTimer({ isOpen, onClose }) {
  const [timeLeft, setTimeLeft] = useState(TOTAL_SECONDS);
  const [isRunning, setIsRunning] = useState(false);
  const intervalRef = useRef(null);

  const clearTimer = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (isRunning && timeLeft > 0) {
      intervalRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearTimer();
            setIsRunning(false);
            // Try to notify when timer completes
            if (navigator.vibrate) navigator.vibrate(200);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      clearTimer();
    }
    return clearTimer;
  }, [isRunning, timeLeft, clearTimer]);

  // Reset state when timer is closed
  useEffect(() => {
    if (!isOpen) {
      clearTimer();
      setIsRunning(false);
      setTimeLeft(TOTAL_SECONDS);
    }
  }, [isOpen, clearTimer]);

  if (!isOpen) return null;

  const handleStartPause = () => {
    if (timeLeft === 0) return;
    setIsRunning((prev) => !prev);
  };

  const handleReset = () => {
    clearTimer();
    setIsRunning(false);
    setTimeLeft(TOTAL_SECONDS);
  };

  return (
    <div className="workout-timer">
      <div className="workout-timer-display">{formatTime(timeLeft)}</div>
      <div className="workout-timer-controls">
        <button
          className="workout-timer-btn workout-timer-btn--primary"
          type="button"
          onClick={handleStartPause}
          disabled={timeLeft === 0}
        >
          {isRunning ? 'Pause' : 'Start'}
        </button>
        <button className="workout-timer-btn" type="button" onClick={handleReset}>
          Reset
        </button>
        <button className="workout-timer-btn" type="button" onClick={onClose}>
          Close
        </button>
      </div>
    </div>
  );
}

export default WorkoutTimer;
