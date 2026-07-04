import { useEffect, useRef, useState, useCallback } from 'react';
import { LM, analyzeFrame, createRepCounter } from '../utils/repCounter';

// Pinned to the installed @mediapipe/tasks-vision version
const WASM_CDN = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm';
const MODEL_URL =
  'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task';

const DEVICE_STORAGE_KEY = 'burpee-camera-device';

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

const pickRecorderType = () => {
  if (typeof MediaRecorder === 'undefined') return null;
  const candidates = ['video/mp4', 'video/webm;codecs=vp9', 'video/webm'];
  return candidates.find((t) => MediaRecorder.isTypeSupported(t)) ?? '';
};

// Camera for workout sessions: video recording plus (optional) on-device
// rep counting.
//
// While `enabled`, acquires the selected camera (front/user-facing by
// default); with `counting` it also lazy-loads the MediaPipe pose
// landmarker. `start()` begins a session: the rep counter resets and the
// recorder starts. `stop()` ends it, finalizing the recording into
// `videoUrl`/`videoBlob` for review and storage. Everything is on-device;
// nothing is uploaded.
export default function useRepCamera({ videoRef, canvasRef, enabled, counting = true }) {
  const [status, setStatus] = useState('idle'); // idle | loading | ready | counting | error
  const [error, setError] = useState('');
  const [count, setCount] = useState(0);
  const [devices, setDevices] = useState([]);
  const [deviceId, setDeviceId] = useState(() => {
    try {
      return window.localStorage.getItem(DEVICE_STORAGE_KEY) || '';
    } catch {
      return '';
    }
  });
  const [videoUrl, setVideoUrl] = useState(null);
  const [videoBlob, setVideoBlob] = useState(null);
  const [videoMime, setVideoMime] = useState('video/webm');

  const streamRef = useRef(null);
  const landmarkerRef = useRef(null);
  const counterRef = useRef(null);
  const recorderRef = useRef(null);
  const chunksRef = useRef([]);
  const rafRef = useRef(0);
  const runningRef = useRef(false);
  const lastVideoTimeRef = useRef(-1);
  const videoUrlRef = useRef(null);

  const releaseVideoUrl = useCallback(() => {
    if (videoUrlRef.current) {
      URL.revokeObjectURL(videoUrlRef.current);
      videoUrlRef.current = null;
    }
    setVideoUrl(null);
    setVideoBlob(null);
  }, []);

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
        if (lm && counterRef.current) {
          if (counterRef.current.update(analyzeFrame(lm))) {
            setCount((c) => c + 1);
          }
        }
      } catch (e) {
        console.error('Pose detection failed', e);
      }
    }
    rafRef.current = requestAnimationFrame(loop);
  }, [drawOverlay, videoRef]);

  // Camera stream — re-acquired when the selected device changes
  useEffect(() => {
    if (!enabled) return undefined;
    let cancelled = false;

    (async () => {
      setStatus((s) => (s === 'ready' || s === 'counting' ? s : 'loading'));
      setError('');
      try {
        const constraints = (id) => ({
          video: id ? { deviceId: { exact: id }, width: { ideal: 960 } } : { facingMode: 'user', width: { ideal: 960 } },
          audio: false,
        });
        let stream;
        try {
          stream = await navigator.mediaDevices.getUserMedia(constraints(deviceId));
        } catch (err) {
          // Saved device unplugged/renamed — fall back to the default camera
          if (deviceId && err?.name === 'OverconstrainedError') {
            stream = await navigator.mediaDevices.getUserMedia(constraints(''));
          } else {
            throw err;
          }
        }
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
        // Labels are only populated after permission is granted
        const all = await navigator.mediaDevices.enumerateDevices();
        if (!cancelled) setDevices(all.filter((d) => d.kind === 'videoinput'));
        if (!cancelled && (!counting || landmarkerRef.current)) setStatus('ready');
      } catch (err) {
        console.error('Camera setup failed', err);
        if (!cancelled) {
          setError(
            err?.name === 'NotAllowedError'
              ? 'Camera access denied'
              : 'Camera unavailable'
          );
          setStatus('error');
        }
      }
    })();

    return () => {
      cancelled = true;
      runningRef.current = false;
      cancelAnimationFrame(rafRef.current);
      if (recorderRef.current && recorderRef.current.state !== 'inactive') {
        recorderRef.current.stop();
      }
      recorderRef.current = null;
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }
    };
  }, [enabled, counting, deviceId, videoRef]);

  // Pose model — loaded once per enable, independent of device switches.
  // Skipped entirely when counting is off (record-only sessions).
  useEffect(() => {
    if (!enabled || !counting) return undefined;
    let cancelled = false;

    (async () => {
      try {
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
        // Camera may still be starting; only flip to ready if it's up
        if (streamRef.current) setStatus((s) => (s === 'loading' ? 'ready' : s));
      } catch (err) {
        // Recording still works without the model — degrade, don't fail
        console.error('Pose model failed to load', err);
      }
    })();

    return () => {
      cancelled = true;
      if (landmarkerRef.current) {
        landmarkerRef.current.close();
        landmarkerRef.current = null;
      }
    };
  }, [enabled, counting]);

  // Reset session state and release any recorded video when disabled
  useEffect(() => {
    if (!enabled) {
      releaseVideoUrl();
      setStatus('idle');
      setCount(0);
    }
  }, [enabled, releaseVideoUrl]);

  const selectDevice = useCallback((id) => {
    setDeviceId(id);
    try {
      window.localStorage.setItem(DEVICE_STORAGE_KEY, id);
    } catch {
      // preference just won't persist
    }
  }, []);

  const start = useCallback(() => {
    counterRef.current = createRepCounter();
    setCount(0);
    releaseVideoUrl();
    lastVideoTimeRef.current = -1;

    // Recording works even if the pose model failed to load
    const stream = streamRef.current;
    const mimeType = pickRecorderType();
    if (stream && mimeType !== null) {
      try {
        chunksRef.current = [];
        const recorder = mimeType
          ? new MediaRecorder(stream, { mimeType })
          : new MediaRecorder(stream);
        recorder.ondataavailable = (e) => {
          if (e.data && e.data.size > 0) chunksRef.current.push(e.data);
        };
        recorder.onstop = () => {
          if (chunksRef.current.length === 0) return;
          const type = recorder.mimeType || 'video/webm';
          const blob = new Blob(chunksRef.current, { type });
          chunksRef.current = [];
          const url = URL.createObjectURL(blob);
          videoUrlRef.current = url;
          setVideoUrl(url);
          setVideoBlob(blob);
          setVideoMime(type);
        };
        recorder.start(1000);
        recorderRef.current = recorder;
      } catch (e) {
        console.error('Recording unavailable', e);
      }
    }

    if (counting && landmarkerRef.current) {
      runningRef.current = true;
      setStatus('counting');
      rafRef.current = requestAnimationFrame(loop);
    }
  }, [counting, loop, releaseVideoUrl]);

  const stop = useCallback(() => {
    runningRef.current = false;
    cancelAnimationFrame(rafRef.current);
    if (recorderRef.current && recorderRef.current.state !== 'inactive') {
      recorderRef.current.stop();
    }
    recorderRef.current = null;
    setStatus((s) => (s === 'counting' ? 'ready' : s));
  }, []);

  return {
    status,
    error,
    count,
    devices,
    deviceId,
    selectDevice,
    start,
    stop,
    videoUrl,
    videoBlob,
    videoMime,
    discardVideo: releaseVideoUrl,
  };
}
