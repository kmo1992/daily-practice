import { useEffect, useRef, useState, useCallback } from 'react';
import { LM, analyzeFrame, createRepTracker } from '../utils/formGrading';

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

// Camera + on-device pose grading for burpee form.
//
// While `enabled`, acquires the camera (back camera preferred, falls back to
// a webcam) and lazy-loads the MediaPipe pose landmarker. Video is processed
// entirely on-device. `start()` begins a graded session (clearing reps);
// `stop()` halts grading but keeps the camera warm for a restart.
export default function useFormGrading({ videoRef, canvasRef, workoutType, enabled }) {
  const [status, setStatus] = useState('idle'); // idle | loading | ready | grading | error
  const [error, setError] = useState('');
  const [reps, setReps] = useState([]);

  const streamRef = useRef(null);
  const landmarkerRef = useRef(null);
  const trackerRef = useRef(null);
  const rafRef = useRef(0);
  const runningRef = useRef(false);
  const lastVideoTimeRef = useRef(-1);

  const drawOverlay = useCallback(
    (lm) => {
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
    },
    [canvasRef, videoRef]
  );

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
  }, [drawOverlay, videoRef]);

  // Acquire camera + model while enabled; tear down when disabled/unmounted
  useEffect(() => {
    if (!enabled) return undefined;
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
      setStatus('loading');
      setError('');
      setReps([]);
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
        if (video) {
          video.srcObject = stream;
          await video.play();
        }

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
        setStatus('ready');
      } catch (err) {
        console.error('Form grading setup failed', err);
        if (!cancelled) {
          setError(
            err?.name === 'NotAllowedError'
              ? 'Camera access denied'
              : 'Camera or model unavailable'
          );
          setStatus('error');
        }
      }
    })();

    return () => {
      cancelled = true;
      teardown();
      setStatus('idle');
      setReps([]);
    };
  }, [enabled, videoRef]);

  const start = useCallback(() => {
    if (!landmarkerRef.current) return;
    trackerRef.current = createRepTracker(workoutType);
    setReps([]);
    lastVideoTimeRef.current = -1;
    runningRef.current = true;
    setStatus('grading');
    rafRef.current = requestAnimationFrame(loop);
  }, [workoutType, loop]);

  const stop = useCallback(() => {
    runningRef.current = false;
    cancelAnimationFrame(rafRef.current);
    setStatus((s) => (s === 'grading' ? 'ready' : s));
  }, []);

  return { status, error, reps, start, stop };
}
