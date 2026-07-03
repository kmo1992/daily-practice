import { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import './BurpeeTimer.css';

// Audio Context helper
const AudioContext = window.AudioContext || window.webkitAudioContext;

const BurpeeTimer = ({ isOpen, onClose, totalReps = 0 }) => {
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

  // 'classic' shows counts and clocks; 'flow' is a numbers-free breathing pulse
  const [mode, setMode] = useState(() => {
    try {
      return window.localStorage.getItem('burpee-timer-mode') === 'flow' ? 'flow' : 'classic';
    } catch {
      return 'classic';
    }
  });

  const selectMode = (m) => {
    setMode(m);
    try {
      window.localStorage.setItem('burpee-timer-mode', m);
    } catch {
      // localStorage unavailable — mode just won't persist
    }
  };

  const audioCtxRef = useRef(null);
  const startTimeRef = useRef(0);
  const prevRepRef = useRef(1);
  const warnedRef = useRef(false);

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

  // Warm mallet-style chime: soft attack, layered harmonics with a slight
  // detune for warmth, long natural decay. Marks the start of each rep.
  const playChime = useCallback(() => {
    try {
      if (!audioCtxRef.current) return;
      const ctx = audioCtxRef.current;
      const now = ctx.currentTime;
      // [frequency, peak gain, decay seconds]
      [
        [330, 0.32, 2.4],
        [332, 0.12, 2.4],
        [660, 0.12, 1.6],
        [990, 0.04, 1.0],
      ].forEach(([freq, peak, dur]) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now);
        gain.gain.setValueAtTime(0.0001, now);
        gain.gain.exponentialRampToValueAtTime(peak, now + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + dur);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + dur);
      });
    } catch (e) {
      console.error('Error playing chime', e);
    }
  }, []);

  // Single gentle heads-up tone (classic mode only) — replaces the old
  // harsh 800Hz triple beep.
  const playWarning = useCallback(() => {
    try {
      if (!audioCtxRef.current) return;
      const ctx = audioCtxRef.current;
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(523.25, now);
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(0.12, now + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.6);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.6);
    } catch (e) {
      console.error('Error playing warning', e);
    }
  }, []);

  const finishTimer = () => {
    setTimerState(prev => ({ ...prev, isActive: false, timeLeft: 0 }));
    playChime();
    if (navigator.vibrate) navigator.vibrate([200, 100, 200]);
  };

  // Main Timer Loop
  useEffect(() => {
    let animationFrameId;

    const tick = (timestamp) => {
      if (!startTimeRef.current) {
        startTimeRef.current = timestamp - (timerState.totalElapsed * 1000);
      }

      const elapsed = (timestamp - startTimeRef.current) / 1000;
      const newTimeLeft = Math.max(0, TOTAL_TIME - elapsed);

      let newCalculatedRep = 1;
      let newRepTimeLeft = 0;

      if (repDuration > 0) {
        newCalculatedRep = Math.floor(elapsed / repDuration) + 1;
        const repProgress = elapsed % repDuration;
        newRepTimeLeft = Math.max(0, repDuration - repProgress);
      }

      const safeRep = Math.min(newCalculatedRep, totalReps);

      setTimerState(prev => ({
        ...prev,
        timeLeft: newTimeLeft,
        currentRep: safeRep,
        repTimeLeft: newRepTimeLeft,
        totalElapsed: elapsed
      }));

      if (newCalculatedRep > prevRepRef.current) {
        if (newCalculatedRep <= totalReps) playChime();
        prevRepRef.current = newCalculatedRep;
        warnedRef.current = false;
      }

      // Heads-up tone only in classic mode — flow mode stays anticipation-free
      if (mode === 'classic' && repDuration > 15 && newRepTimeLeft <= 10 && newRepTimeLeft > 0 && !warnedRef.current) {
        playWarning();
        warnedRef.current = true;
      }

      if (newTimeLeft > 0) {
        animationFrameId = requestAnimationFrame(tick);
      } else {
        setTimerState(prev => ({ ...prev, isActive: false }));
        playChime();
        if (navigator.vibrate) navigator.vibrate([200, 100, 200]);
      }
    };

    if (isActive) {
      animationFrameId = requestAnimationFrame(tick);
    } else {
      startTimeRef.current = 0;
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
    }

    return () => {
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
    };
  }, [isActive, totalReps, repDuration, mode, playChime, playWarning]);

  const toggleTimer = () => {
    if (totalReps <= 0) return;

    if (timerState.timeLeft <= 0) {
      initAudio();
      setTimerState({
        isActive: true,
        timeLeft: TOTAL_TIME,
        repTimeLeft: repDuration,
        currentRep: 1,
        totalElapsed: 0
      });
      startTimeRef.current = 0;
      prevRepRef.current = 1;
      warnedRef.current = false;
      playChime();
      return;
    }

    if (!isActive) {
      initAudio();
      setTimerState(prev => ({ ...prev, isActive: true }));
      if (timerState.timeLeft === TOTAL_TIME) {
        playChime();
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

  useEffect(() => {
    if (!isActive && timerState.totalElapsed === 0) {
      setTimerState(prev => ({ ...prev, repTimeLeft: repDuration }));
    }
  }, [repDuration, isActive, timerState.totalElapsed]);

  useEffect(() => {
    if (!isOpen) resetTimer();
  }, [isOpen]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatTimeCeil = (seconds) => {
    const mins = Math.floor(Math.ceil(seconds) / 60);
    const secs = Math.ceil(seconds) % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatRepTime = (seconds) => {
    const s = Math.ceil(seconds);
    return `00:${s.toString().padStart(2, '0')}`;
  };

  const elapsedTime = TOTAL_TIME - timeLeft;

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

  const isFlow = mode === 'flow';
  const finished = timeLeft <= 0;
  const preStart = !isActive && !finished && timeLeft === TOTAL_TIME;

  // Breathing pulse: one full expand/contract cycle per rep interval
  const repProgress = repDuration > 0 ? 1 - (repTimeLeft / repDuration) : 0;
  const breath = 0.5 - 0.5 * Math.cos(2 * Math.PI * repProgress);
  const pulseScale = 0.6 + 0.5 * breath;

  const controls = (
    <div className="controls-container">
      <div className="controls-group left">
        <button className="icon-btn close" onClick={onClose} disabled={isLocked} aria-label="Close">
          <IconClose />
        </button>
        <button className="icon-btn lock" onClick={() => setIsLocked(!isLocked)} aria-label={isLocked ? "Unlock" : "Lock"}>
          {isLocked ? <IconLock /> : <IconUnlock />}
        </button>
      </div>

      <div className="controls-group right">
        <button className="icon-btn reset" onClick={resetTimer} disabled={isLocked} aria-label="Reset">
          <IconReset />
        </button>
        <button className="icon-btn play" onClick={toggleTimer} disabled={isLocked} aria-label={isActive ? "Pause" : "Start"}>
          {isActive ? <IconPause /> : <IconPlay />}
        </button>
      </div>
    </div>
  );

  const overlay = (
    <div className={`burpee-timer-overlay${isFlow ? ' flow' : ''}${finished ? ' finished' : ''}`}>
      <div className="burpee-timer-modal">
        {preStart && (
          <div className="mode-toggle" role="group" aria-label="Timer mode">
            <button
              className={`mode-btn${!isFlow ? ' mode-btn--active' : ''}`}
              type="button"
              onClick={() => selectMode('classic')}
            >
              Classic
            </button>
            <button
              className={`mode-btn${isFlow ? ' mode-btn--active' : ''}`}
              type="button"
              onClick={() => selectMode('flow')}
            >
              Flow
            </button>
          </div>
        )}

        {isFlow ? (
          <div className="bottom-area flow-bottom">
            <div className="flow-area">
              {finished ? (
                <div className="end-timer-message">Well done.</div>
              ) : (
                <>
                  <div
                    className={`flow-pulse${preStart ? ' flow-pulse--idle' : ''}`}
                    style={preStart ? undefined : { transform: `scale(${pulseScale.toFixed(3)})` }}
                  />
                  {preStart && (
                    <p className="flow-hint">One burpee per chime. Follow the pulse.</p>
                  )}
                </>
              )}
            </div>
            {controls}
          </div>
        ) : (
          <>
            <div className="timer-display-huge">
              {formatRepTime(repTimeLeft)}
            </div>

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

            <div className="bottom-area">
              <div className="rounds-container">
                {finished ? (
                  <div className="end-timer-message">
                    Congratulations!
                  </div>
                ) : (
                  <>
                    <div className="interval-info current">
                      <span className="interval-label mobile-only">CURRENT</span>
                      <span className="interval-round">Round {currentRep}</span>
                      <span className="interval-time mobile-only">{formatRepTime(repTimeLeft)}</span>
                    </div>

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
              {controls}
            </div>
          </>
        )}
      </div>
    </div>
  );

  return createPortal(overlay, document.body);
};

export default BurpeeTimer;
