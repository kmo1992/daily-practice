import { useEffect, useRef, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { LM, analyzeFrame, createRepTracker, summarizeGrades } from '../utils/formGrading';
import './FormCoach.css';

// Pinned to the installed @mediapipe/tasks-vision version
const WASM_CDN = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm';
const MODEL_URL =
  'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task';

// Skeleton edges drawn on the overlay
const EDGES = [
  [LM.LEFT_SHOULDER, LM.RIGHT_SHOULDER],
  [LM.LEFT_SHOULDER, LM.LEFT_ELBOW],
  [LM.LEFT_ELBOW, LM.LEFT_WRIST],
  [LM.RIGHT_SHOULDER, LM.RIGHT_ELBOW],
  [LM.RIGHT_ELBOW, LM.RIGHT_WRIST],
  [LM.LEFT_SHOULDER, LM.LEFT_HIP],
  [LM.RIGHT_SHOULDER, LM.RIGHT_HIP],
  [LM.LEFT_HIP, LM.RIGHT_HIP],
  [LM.LEFT_HIP, LM.LEFT_KNEE],
  [LM.LEFT_KNEE, LM.LEFT_ANKLE],
  [LM.RIGHT_HIP, LM.RIGHT_KNEE],
  [LM.RIGHT_KNEE, LM.RIGHT_ANKLE],
];

function FormCoach({ isOpen, onClose, workoutType, onSave }) {
  const [phase, setPhase] = useState('init'); // init | ready | running | done | error
  const [errorMsg, setErrorMsg] = useState('');
  const [reps, setReps] = useState([]);
  const [saved, setSaved] = useState(false);

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const landmarkerRef = useRef(null);
  const trackerRef = useRef(null);
  const rafRef = useRef(0);
  const runningRef = useRef(false);
  const lastVideoTimeRef = useRef(-1);

  const drawOverlay = useCallback((lm) => {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    if (!canvas || !video) return;
    if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
    }
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (!lm) return;
    ctx.strokeStyle = 'rgba(245, 240, 230, 0.85)';
    ctx.lineWidth = 3;
    EDGES.forEach(([a, b]) => {
      ctx.beginPath();
      ctx.moveTo(lm[a].x * canvas.width, lm[a].y * canvas.height);
      ctx.lineTo(lm[b].x * canvas.width, lm[b].y * canvas.height);
      ctx.stroke();
    });
    ctx.fillStyle = 'rgba(245, 240, 230, 0.95)';
    EDGES.flat().forEach((i) => {
      ctx.beginPath();
      ctx.arc(lm[i].x * canvas.width, lm[i].y * canvas.height, 4, 0, 2 * Math.PI);
      ctx.fill();
    });
  }, []);

  const loop = useCallback(() => {
    const video = videoRef.current;
    const landmarker = landmarkerRef.current;
    if (!runningRef.current || !video || !landmarker) return;
    if (video.currentTime !== lastVideoTimeRef.current && video.videoWidth > 0) {
      lastVideoTimeRef.current = video.currentTime;
      try {
        const result = landmarker.detectForVideo(video, performance.now());
        const lm = result.landmarks && result.landmarks[0];
        drawOverlay(lm);
        if (lm && trackerRef.current) {
          const completed = trackerRef.current.update(analyzeFrame(lm));
          if (completed) setReps((prev) => [...prev, completed]);
        }
      } catch (e) {
        console.error('Pose detection failed', e);
      }
    }
    rafRef.current = requestAnimationFrame(loop);
  }, [drawOverlay]);

  // Acquire camera + load the pose model whenever the coach opens
  useEffect(() => {
    if (!isOpen) return undefined;
    let cancelled = false;

    const teardown = () => {
      runningRef.current = false;
      cancelAnimationFrame(rafRef.current);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }
      if (landmarkerRef.current) {
        landmarkerRef.current.close();
        landmarkerRef.current = null;
      }
    };

    (async () => {
      setPhase('init');
      setErrorMsg('');
      setReps([]);
      setSaved(false);
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment', width: { ideal: 960 } },
          audio: false,
        });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        const video = videoRef.current;
        video.srcObject = stream;
        await video.play();

        const { FilesetResolver, PoseLandmarker } = await import('@mediapipe/tasks-vision');
        const fileset = await FilesetResolver.forVisionTasks(WASM_CDN);
        const options = (delegate) => ({
          baseOptions: { modelAssetPath: MODEL_URL, delegate },
          runningMode: 'VIDEO',
          numPoses: 1,
        });
        let landmarker;
        try {
          landmarker = await PoseLandmarker.createFromOptions(fileset, options('GPU'));
        } catch {
          landmarker = await PoseLandmarker.createFromOptions(fileset, options('CPU'));
        }
        if (cancelled) {
          landmarker.close();
          return;
        }
        landmarkerRef.current = landmarker;
        setPhase('ready');
      } catch (err) {
        console.error('Form coach setup failed', err);
        if (!cancelled) {
          setErrorMsg(
            err?.name === 'NotAllowedError'
              ? 'Camera access was denied. Allow camera access and try again.'
              : 'Could not start the camera or load the pose model. Check your connection and try again.'
          );
          setPhase('error');
        }
      }
    })();

    return () => {
      cancelled = true;
      teardown();
    };
  }, [isOpen]);

  const startSession = () => {
    trackerRef.current = createRepTracker(workoutType);
    setReps([]);
    setSaved(false);
    lastVideoTimeRef.current = -1;
    runningRef.current = true;
    setPhase('running');
    rafRef.current = requestAnimationFrame(loop);
  };

  const stopSession = () => {
    runningRef.current = false;
    cancelAnimationFrame(rafRef.current);
    setPhase('done');
  };

  const handleSave = () => {
    const { total, counts } = summarizeGrades(reps);
    onSave({
      workoutType,
      grades: reps.map((r) => r.grade),
      counts,
      total,
    });
    setSaved(true);
  };

  if (!isOpen) return null;

  const summary = summarizeGrades(reps);
  const lastRep = reps[reps.length - 1];

  const overlay = (
    <div className="form-coach-overlay">
      <div className="form-coach-header">
        <span className="form-coach-title">Form Coach · {workoutType}</span>
        <button className="form-coach-close" type="button" onClick={onClose}>
          Close
        </button>
      </div>

      <div className="form-coach-stage">
        {/* video/canvas stay mounted through every phase so refs hold */}
        <video ref={videoRef} className="form-coach-video" playsInline muted />
        <canvas ref={canvasRef} className="form-coach-canvas" />
        {phase === 'init' && (
          <p className="form-coach-status">Starting camera and loading the pose model…</p>
        )}
        {phase === 'error' && <p className="form-coach-status form-coach-error">{errorMsg}</p>}
        {phase === 'running' && lastRep && (
          <div className={`form-coach-live-grade grade-${lastRep.grade}`}>{lastRep.grade}</div>
        )}
      </div>

      <div className="form-coach-panel">
        {phase === 'ready' && (
          <p className="form-coach-hint">
            Prop your phone side-on with your whole body in frame, then start.
          </p>
        )}

        {reps.length > 0 && (
          <div className="form-coach-grades">
            {reps.map((r, i) => (
              <span key={i} className={`grade-chip grade-${r.grade}`} title={
                Object.entries(r.checkpoints)
                  .filter(([, ok]) => !ok)
                  .map(([k]) => k)
                  .join(', ') || 'clean'
              }>
                {r.grade}
              </span>
            ))}
          </div>
        )}

        {phase === 'done' && (
          <p className="form-coach-summary">
            {summary.total} reps · A×{summary.counts.A} B×{summary.counts.B} C×{summary.counts.C}
          </p>
        )}

        <div className="form-coach-actions">
          {phase === 'ready' && (
            <button className="form-coach-btn" type="button" onClick={startSession}>
              Start
            </button>
          )}
          {phase === 'running' && (
            <button className="form-coach-btn" type="button" onClick={stopSession}>
              Stop
            </button>
          )}
          {phase === 'done' && (
            <>
              <button className="form-coach-btn form-coach-btn--ghost" type="button" onClick={startSession}>
                Start over
              </button>
              <button
                className="form-coach-btn"
                type="button"
                onClick={handleSave}
                disabled={reps.length === 0 || saved}
              >
                {saved ? 'Saved ✓' : 'Save to today'}
              </button>
            </>
          )}
        </div>

        <p className="form-coach-privacy">
          Graded on your device — video never leaves your phone.
        </p>
      </div>
    </div>
  );

  return createPortal(overlay, document.body);
}

export default FormCoach;
