import { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import useRepCamera from '../hooks/useRepCamera';
import './FlowTimer.css';

// Audio Context helper
const AudioContext = window.AudioContext || window.webkitAudioContext;

// Chime voicings: [frequency, peak gain, decay seconds] per partial.
// Warm mallet strike for reps; a brighter voicing marks milestones.
const CHIME_WARM = [
  [330, 0.32, 2.4],
  [332, 0.12, 2.4],
  [660, 0.12, 1.6],
  [990, 0.04, 1.0],
];
const CHIME_BRIGHT = [
  [415.3, 0.3, 2.0],
  [417, 0.1, 2.0],
  [830.6, 0.12, 1.4],
  [1245.9, 0.05, 0.9],
];

const FlowTimer = ({ isOpen, onClose, totalReps = 0, workoutType = 'Burpees', onSaveRepSession }) => {
  const BASE_TARGET_TIME = 20 * 60;
  const repDuration = totalReps > 0 ? Math.round(BASE_TARGET_TIME / totalReps) : 0;
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
  const [sessionSaved, setSessionSaved] = useState(false);

  // Camera: rep counting + session recording, on-device
  const [cameraOn, setCameraOn] = useState(() => {
    try {
      return window.localStorage.getItem('burpee-timer-camera') === 'on';
    } catch {
      return false;
    }
  });
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const camera = useRepCamera({ videoRef, canvasRef, enabled: isOpen && cameraOn });
  const { stop: stopCamera, discardVideo } = camera;

  const toggleCamera = () => {
    const next = !cameraOn;
    setCameraOn(next);
    try {
      window.localStorage.setItem('burpee-timer-camera', next ? 'on' : 'off');
    } catch {
      // preference just won't persist
    }
  };

  const audioCtxRef = useRef(null);
  const startTimeRef = useRef(0);
  const prevRepRef = useRef(1);

  const initAudio = () => {
    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new AudioContext();
      }
      if (audioCtxRef.current.state === 'suspended') {
        audioCtxRef.current.resume();
      }
      // Declare ourselves a playback session (like a music app) so chimes
      // survive the iOS silent switch where the API is available.
      if (navigator.audioSession) {
        navigator.audioSession.type = 'playback';
      }
    } catch (e) {
      console.warn('AudioContext initialization failed', e);
    }
  };

  // Fire one layered strike at an optional offset from now
  const strike = useCallback((partials, delay = 0) => {
    const ctx = audioCtxRef.current;
    if (!ctx) return;
    const at = ctx.currentTime + delay;
    partials.forEach(([freq, peak, dur]) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, at);
      gain.gain.setValueAtTime(0.0001, at);
      gain.gain.exponentialRampToValueAtTime(peak, at + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.0001, at + dur);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(at);
      osc.stop(at + dur);
    });
  }, []);

  // 'rep': warm strike. 'half': two-note halfway marker. 'final': brighter
  // strike for the last three reps. 'done': a descending phrase that cannot
  // be mistaken for a "go" cue — no more accidental 51st burpee.
  const playChime = useCallback((variant = 'rep') => {
    try {
      if (!audioCtxRef.current) return;
      if (variant === 'half') {
        strike(CHIME_WARM);
        strike(CHIME_BRIGHT, 0.3);
      } else if (variant === 'final') {
        strike(CHIME_BRIGHT);
      } else if (variant === 'done') {
        strike([[523.25, 0.28, 1.1], [1046.5, 0.07, 0.7]]);
        strike([[415.3, 0.28, 1.1], [830.6, 0.07, 0.7]], 0.35);
        strike([[330, 0.32, 2.6], [660, 0.1, 1.6]], 0.7);
      } else {
        strike(CHIME_WARM);
      }
    } catch (e) {
      console.error('Error playing chime', e);
    }
  }, [strike]);

  // Main Timer Loop
  useEffect(() => {
    let animationFrameId;

    const halfwayRep = Math.floor(totalReps / 2) + 1;
    const variantForRep = (rep) => {
      if (rep >= totalReps - 2) return 'final';
      if (rep === halfwayRep) return 'half';
      return 'rep';
    };

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
        if (newCalculatedRep <= totalReps) {
          playChime(variantForRep(newCalculatedRep));
          // Haptic backup for when music drowns the chime (no-op on iOS)
          if (navigator.vibrate) navigator.vibrate(60);
        }
        prevRepRef.current = newCalculatedRep;
      }

      if (newTimeLeft > 0) {
        animationFrameId = requestAnimationFrame(tick);
      } else {
        setTimerState(prev => ({ ...prev, isActive: false }));
        stopCamera();
        playChime('done');
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
  }, [isActive, totalReps, repDuration, playChime, stopCamera]);

  const startSession = () => {
    setSessionSaved(false);
    if (cameraOn) camera.start();
  };

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
      startSession();
      playChime('rep');
      return;
    }

    if (!isActive) {
      initAudio();
      setTimerState(prev => ({ ...prev, isActive: true }));
      if (timerState.timeLeft === TOTAL_TIME) {
        startSession();
        playChime('rep');
        prevRepRef.current = timerState.currentRep;
      }
    } else {
      setTimerState(prev => ({ ...prev, isActive: false }));
    }
  };

  const resetTimer = useCallback(() => {
    setTimerState({
      isActive: false,
      timeLeft: TOTAL_TIME,
      repTimeLeft: repDuration,
      currentRep: 1,
      totalElapsed: 0
    });
    startTimeRef.current = 0;
    prevRepRef.current = 1;
    setSessionSaved(false);
    stopCamera();
    discardVideo();
  }, [TOTAL_TIME, repDuration, stopCamera, discardVideo]);

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
  }, [isOpen, resetTimer]);

  // A natural finish with the camera on records the detected count for the day
  useEffect(() => {
    if (!isOpen || !cameraOn || sessionSaved) return;
    if (timeLeft <= 0 && camera.count > 0 && onSaveRepSession) {
      onSaveRepSession({ workoutType, detected: camera.count, target: totalReps });
      setSessionSaved(true);
    }
  }, [isOpen, cameraOn, sessionSaved, timeLeft, camera.count, onSaveRepSession, workoutType, totalReps]);

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

  const finished = timeLeft <= 0;
  const preStart = !isActive && !finished && timeLeft === TOTAL_TIME;

  // Bell-strike pulse: blooms instantly at each chime, then decays through
  // the interval — the jump IS the "new burpee" signal.
  const repProgress = repDuration > 0 ? 1 - (repTimeLeft / repDuration) : 0;
  const pulseScale = 1.05 - 0.45 * Math.pow(repProgress, 0.7);

  const overlay = (
    <div className={`flow-timer-overlay${finished ? ' finished' : ''}`}>
      <div className="flow-timer-modal">
        {preStart && (
          <div className="prestart-controls">
            <button
              className={`camera-toggle${cameraOn ? ' camera-toggle--on' : ''}`}
              type="button"
              onClick={toggleCamera}
              aria-pressed={cameraOn}
            >
              {cameraOn ? '◉ Camera on' : '○ Camera off'}
            </button>
            {cameraOn && camera.devices.length > 1 && (
              <select
                className="camera-picker"
                value={camera.deviceId}
                onChange={(e) => camera.selectDevice(e.target.value)}
                aria-label="Camera"
              >
                {camera.devices.map((d, i) => (
                  <option key={d.deviceId} value={d.deviceId}>
                    {d.label || `Camera ${i + 1}`}
                  </option>
                ))}
              </select>
            )}
          </div>
        )}

        {/* Camera tile stays mounted while the camera is on so the stream
            and recorder survive across start/finish/reset */}
        {cameraOn && (
          <div className={`timer-pip${finished ? ' timer-pip--dim' : ''}`}>
            <video ref={videoRef} playsInline muted />
            <canvas ref={canvasRef} />
            {camera.status === 'loading' && <span className="pip-status">Loading…</span>}
            {camera.status === 'error' && (
              <span className="pip-status pip-status--error">{camera.error}</span>
            )}
          </div>
        )}

        <div className="flow-area">
          {finished ? (
            <>
              <div className="end-timer-message">Well done.</div>
              {cameraOn && camera.count > 0 && (
                <p className="count-report">
                  Camera counted {camera.count} of {totalReps}
                  {sessionSaved ? ' · saved' : ''}
                </p>
              )}
              {cameraOn && camera.videoUrl && (
                <div className="video-review">
                  <video src={camera.videoUrl} controls playsInline />
                  <div className="video-review-actions">
                    <a
                      className="review-btn"
                      href={camera.videoUrl}
                      download={`${workoutType.toLowerCase().replace(/\s+/g, '-')}-${new Date().toISOString().slice(0, 10)}.${camera.videoExt}`}
                    >
                      Save video
                    </a>
                    <button className="review-btn review-btn--ghost" type="button" onClick={discardVideo}>
                      Discard
                    </button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <>
              <div className="flow-pulse-wrap">
                {/* keyed on the rep so the ripple restarts at every strike */}
                {!preStart && isActive && (
                  <span key={currentRep} className="flow-ripple" />
                )}
                <div
                  className={`flow-pulse${preStart ? ' flow-pulse--idle' : ''}`}
                  style={preStart ? undefined : { transform: `scale(${pulseScale.toFixed(3)})` }}
                />
              </div>
              {preStart && (
                <p className="flow-hint">One burpee per strike — move when it blooms.</p>
              )}
            </>
          )}
        </div>

        <div className="controls-container">
          <div className="controls-group">
            <button className="icon-btn close" onClick={onClose} disabled={isLocked} aria-label="Close">
              <IconClose />
            </button>
            <button className="icon-btn lock" onClick={() => setIsLocked(!isLocked)} aria-label={isLocked ? "Unlock" : "Lock"}>
              {isLocked ? <IconLock /> : <IconUnlock />}
            </button>
          </div>

          <div className="controls-group">
            <button className="icon-btn reset" onClick={resetTimer} disabled={isLocked} aria-label="Reset">
              <IconReset />
            </button>
            <button className="icon-btn play" onClick={toggleTimer} disabled={isLocked} aria-label={isActive ? "Pause" : "Start"}>
              {isActive ? <IconPause /> : <IconPlay />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(overlay, document.body);
};

export default FlowTimer;
