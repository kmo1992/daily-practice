import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import confetti from 'canvas-confetti';
import './BurpeeTimer.css';

// Audio Context helper
const AudioContext = window.AudioContext || window.webkitAudioContext;

const BurpeeTimer = ({ isOpen, onClose, totalReps = 0 }) => {
  // Recalculate constants here to use in initial state? 
  // Hooks run in order. We can calc constants before state.

  const BASE_TARGET_TIME = 20 * 60;
  const rawDuration = totalReps > 0 ? BASE_TARGET_TIME / totalReps : 0;
  const repDuration = Math.round(rawDuration);
  const TOTAL_TIME = repDuration * totalReps;

  const [timerState, setTimerState] = useState({
    isActive: false,
    timeLeft: TOTAL_TIME,
    repTimeLeft: repDuration,
    currentRep: 1,
    totalElapsed: 0
  });

  const { isActive, timeLeft, repTimeLeft, currentRep } = timerState;
  const [isLocked, setIsLocked] = useState(false);

  const audioCtxRef = useRef(null);
  const timerRef = useRef(null);
  const startTimeRef = useRef(0);    // When the current active session started (minus paused duration adjustments)
  const pausedTimeRef = useRef(0);   // Total duration paused
  const prevRepRef = useRef(1);
  const warnedRef = useRef(false);
  const lastTickRef = useRef(0);

  // Constants moved to top of component scope

  // Initialize AudioContext
  const initAudio = () => {
    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new AudioContext();
      }
      if (audioCtxRef.current.state === 'suspended') {
        audioCtxRef.current.resume();
      }
    } catch (e) {
      console.warn('AudioContext initialization failed', e);
    }
  };

  const playBell = useCallback(() => {
    try {
      if (!audioCtxRef.current) return;
      const ctx = audioCtxRef.current;
      [400, 560].forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, ctx.currentTime);
        gain.gain.setValueAtTime(0.3, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.5);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + (i * 0.05));
        osc.stop(ctx.currentTime + 1.5 + (i * 0.05));
      });
    } catch (e) {
      console.error('Error playing bell', e);
    }
  }, []);

  const playWarning = useCallback(() => {
    try {
      if (!audioCtxRef.current) return;
      const ctx = audioCtxRef.current;
      const now = ctx.currentTime;
      [0, 0.25, 0.5].forEach(offset => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(800, now + offset);
        gain.gain.setValueAtTime(0.5, now + offset);
        gain.gain.exponentialRampToValueAtTime(0.001, now + offset + 0.1);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + offset);
        osc.stop(now + offset + 0.1);
      });
    } catch (e) {
      console.error('Error playing warning', e);
    }
  }, []);

  const finishTimer = () => {
    setTimerState(prev => ({ ...prev, isActive: false, timeLeft: 0 }));
    confetti({
      particleCount: 250,
      spread: 160,
      origin: { y: 0.6 },
      zIndex: 2000,
      colors: ['#26ccff', '#a25afd', '#ff5e7e', '#88ff5a', '#fcff42', '#ffa62d', '#ff36ff'],
      scalar: 1.2
    });
  };

  // Main Timer Loop
  useEffect(() => {
    let animationFrameId;

    const tick = (timestamp) => {
      // Initialize start time if needed (first tick after start/resume)
      if (!startTimeRef.current) {
        startTimeRef.current = timestamp - (timerState.totalElapsed * 1000);
      }

      const elapsed = (timestamp - startTimeRef.current) / 1000;
      const newTimeLeft = Math.max(0, TOTAL_TIME - elapsed);

      // Calculate derived values
      let newCalculatedRep = 1;
      let newRepTimeLeft = 0;

      if (repDuration > 0) {
        newCalculatedRep = Math.floor(elapsed / repDuration) + 1;
        const repProgress = elapsed % repDuration;
        newRepTimeLeft = Math.max(0, repDuration - repProgress);
      }

      const safeRep = Math.min(newCalculatedRep, totalReps);

      // Batch update state
      setTimerState(prev => ({
        ...prev,
        timeLeft: newTimeLeft,
        currentRep: safeRep,
        repTimeLeft: newRepTimeLeft,
        totalElapsed: elapsed
      }));

      // Audio Logic inside tick to ensure sync with state updates
      // New Rep Bell
      if (newCalculatedRep > prevRepRef.current) {
        if (newCalculatedRep <= totalReps) playBell();
        prevRepRef.current = newCalculatedRep;
        warnedRef.current = false;
      }

      // Warning (crossing 10s or custom threshold)
      if (repDuration > 15 && newRepTimeLeft <= 10 && newRepTimeLeft > 0 && !warnedRef.current) {
        playWarning();
        warnedRef.current = true;
      }

      if (newTimeLeft > 0) {
        animationFrameId = requestAnimationFrame(tick);
      } else {
        // Finished
        setTimerState(prev => ({ ...prev, isActive: false }));
        // Trigger confetti when timer naturally finishes
        confetti({
          particleCount: 250,
          spread: 160,
          origin: { y: 0.6 },
          zIndex: 2000,
          colors: ['#26ccff', '#a25afd', '#ff5e7e', '#88ff5a', '#fcff42', '#ffa62d', '#ff36ff'],
          scalar: 1.2
        });
      }
    };

    if (isActive) {
      animationFrameId = requestAnimationFrame(tick);
    } else {
      // When pausing, we stop the loop. 
      // startTimeRef needs to be reset so next start calculates correctly? 
      // Actually, we store totalElapsed in state, so we can resume from there.
      startTimeRef.current = 0;
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
    }

    return () => {
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
    };
  }, [isActive, totalReps, repDuration, playBell, playWarning]);


  // Timer Toggle / Reset Logic
  const toggleTimer = () => {
    if (totalReps <= 0) {
      alert("Please set the total number of burpees first.");
      return;
    }

    // Check if timer is finished -> Restart
    if (timerState.timeLeft <= 0) {
      initAudio();
      setTimerState({
        isActive: true, // Auto-start
        timeLeft: TOTAL_TIME,
        repTimeLeft: repDuration,
        currentRep: 1,
        totalElapsed: 0
      });
      startTimeRef.current = 0;
      prevRepRef.current = 1;
      warnedRef.current = false;

      // Play bell on restart
      playBell();
      return;
    }

    if (!isActive) {
      initAudio();
      setTimerState(prev => ({ ...prev, isActive: true }));
      // If just starting
      if (timerState.timeLeft === TOTAL_TIME) {
        playBell();
        // Reset ref logic based on current rep
        prevRepRef.current = timerState.currentRep;
      }
    } else {
      setTimerState(prev => ({ ...prev, isActive: false }));
    }
  };

  const resetTimer = () => {
    setTimerState({
      isActive: false,
      timeLeft: TOTAL_TIME,
      repTimeLeft: repDuration,
      currentRep: 1,
      totalElapsed: 0
    });
    startTimeRef.current = 0;
    prevRepRef.current = 1;
    warnedRef.current = false;
  };

  // Sync state when config changes (if not active)
  useEffect(() => {
    if (!isActive) {
      setTimerState(prev => ({
        ...prev,
        timeLeft: TOTAL_TIME,
        repTimeLeft: repDuration,
        currentRep: 1,
        totalElapsed: 0
      }));
    }
  }, [TOTAL_TIME, repDuration]);

  // Sync initial repTimeLeft when repDuration changes (redundant but safe)
  useEffect(() => {
    if (!isActive && timerState.totalElapsed === 0) {
      setTimerState(prev => ({
        ...prev,
        repTimeLeft: repDuration
      }));
    }
  }, [repDuration, isActive, timerState.totalElapsed]);

  // Cleanup / Reset on close
  useEffect(() => {
    if (!isOpen) {
      resetTimer();
    }
  }, [isOpen]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatTimeCeil = (seconds) => {
    const mins = Math.floor(Math.ceil(seconds) / 60);
    const secs = Math.ceil(seconds) % 60;
    // Handle edge case where 60s % 60 is 0 but we want to show next minute? 
    // Actually ceil(1199.1) = 1200. 1200/60 = 20. 1200%60 = 0. -> 20:00. Correct.
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatRepTime = (seconds) => {
    // Format as 00:XX
    const s = Math.ceil(seconds);
    return `00:${s.toString().padStart(2, '0')}`;
  };

  const elapsedTime = TOTAL_TIME - timeLeft;

  // Icons
  const IconPlay = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
  );
  const IconPause = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="6" y="4" width="4" height="16"></rect><rect x="14" y="4" width="4" height="16"></rect></svg>
  );
  const IconReset = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 2v6h6"></path><path d="M3 13a9 9 0 1 0 3-7.7L3 8"></path></svg>
  );
  const IconClose = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
  );
  const IconLock = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
  );
  const IconUnlock = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 9.9-1"></path></svg>
  );

  if (!isOpen) return null;

  const overlay = (
    <div className={`burpee-timer-overlay ${timeLeft <= 0 ? 'finished' : ''}`}>
      <div className="burpee-timer-modal">

        {/* 1. Huge Countdown */}
        <div className="timer-display-huge">
          {formatRepTime(repTimeLeft)}
        </div>

        {/* 2. Stats Row */}
        {/* 2. Stats Row */}
        <div className="stats-row">
          <div className="stat-item">
            <span className="stat-label">ELAPSED</span>
            <span className="stat-value">{formatTime(elapsedTime)}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">INTERVAL</span>
            <span className="stat-value">{currentRep}/{totalReps}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">REMAINING</span>
            <span className="stat-value">{formatTimeCeil(timeLeft)}</span>
          </div>
        </div>

        {/* 3. Bottom Area: Rounds + Controls */}
        <div className="bottom-area">

          <div className="rounds-container">
            {timeLeft <= 0 ? (
              <div className="end-timer-message">
                Congratulations!
              </div>
            ) : (
              <>
                {/* Current Interval */}
                <div className="interval-info current">
                  <span className="interval-label mobile-only">CURRENT</span>
                  <span className="interval-round">Round {currentRep}</span>
                  <span className="interval-time mobile-only">{formatRepTime(repTimeLeft)}</span>
                </div>

                {/* Up Next Info OR End Timer Button on last round */}
                <div className="interval-info next">
                  {currentRep < totalReps ? (
                    <>
                      <span className="interval-label mobile-only">NEXT</span>
                      <span className="interval-round">Round {currentRep + 1}</span>
                      <span className="interval-time mobile-only">{formatRepTime(repDuration)}</span>
                    </>
                  ) : (
                    <button className="end-timer-btn" onClick={finishTimer}>
                      Done
                    </button>
                  )}
                </div>
              </>
            )}
          </div>

          <div className="controls-container">
            <div className="controls-group left">
              <button
                className="icon-btn close"
                onClick={onClose}
                disabled={isLocked}
                aria-label="Close"
              >
                <IconClose />
              </button>
              <button
                className="icon-btn lock"
                onClick={() => setIsLocked(!isLocked)}
                aria-label={isLocked ? "Unlock" : "Lock"}
              >
                {isLocked ? <IconLock /> : <IconUnlock />}
              </button>
            </div>

            <div className="controls-group right">
              <button
                className="icon-btn reset"
                onClick={resetTimer}
                disabled={isLocked}
                aria-label="Reset"
              >
                <IconReset />
              </button>
              <button
                className="icon-btn play"
                onClick={toggleTimer}
                disabled={isLocked}
                aria-label={isActive ? "Pause" : "Start"}
              >
                {isActive ? <IconPause /> : <IconPlay />}
              </button>
            </div>
          </div>

        </div>

      </div>
    </div>
  );

  if (typeof document === 'undefined') {
    return overlay;
  }

  return createPortal(overlay, document.body);
};

export default BurpeeTimer;
