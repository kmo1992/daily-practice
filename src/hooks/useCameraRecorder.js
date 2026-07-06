import { useEffect, useRef, useState, useCallback } from 'react';

const DEVICE_STORAGE_KEY = 'burpee-camera-device';

const pickRecorderType = () => {
  if (typeof MediaRecorder === 'undefined') return null;
  const candidates = ['video/mp4', 'video/webm;codecs=vp9', 'video/webm'];
  return candidates.find((t) => MediaRecorder.isTypeSupported(t)) ?? '';
};

// Camera recording for workout sessions — no pose estimation, just video.
//
// While `enabled`, acquires the selected camera (front/user-facing by
// default). `start()` begins recording; `stop()` finalizes it into
// `videoUrl`/`videoBlob` for review and storage. Everything is on-device;
// nothing is uploaded.
export default function useCameraRecorder({ videoRef, enabled }) {
  const [status, setStatus] = useState('idle'); // idle | loading | ready | error
  const [error, setError] = useState('');
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
  const recorderRef = useRef(null);
  const chunksRef = useRef([]);
  const videoUrlRef = useRef(null);

  const releaseVideoUrl = useCallback(() => {
    if (videoUrlRef.current) {
      URL.revokeObjectURL(videoUrlRef.current);
      videoUrlRef.current = null;
    }
    setVideoUrl(null);
    setVideoBlob(null);
  }, []);

  // Camera stream — re-acquired when the selected device changes
  useEffect(() => {
    if (!enabled) return undefined;
    let cancelled = false;

    (async () => {
      setStatus((s) => (s === 'ready' ? s : 'loading'));
      setError('');
      try {
        const constraints = (id) => ({
          video: id
            ? { deviceId: { exact: id }, width: { ideal: 960 } }
            : { facingMode: 'user', width: { ideal: 960 } },
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
        if (!cancelled) {
          setDevices(all.filter((d) => d.kind === 'videoinput'));
          setStatus('ready');
        }
      } catch (err) {
        console.error('Camera setup failed', err);
        if (!cancelled) {
          setError(err?.name === 'NotAllowedError' ? 'Camera access denied' : 'Camera unavailable');
          setStatus('error');
        }
      }
    })();

    return () => {
      cancelled = true;
      if (recorderRef.current && recorderRef.current.state !== 'inactive') {
        recorderRef.current.stop();
      }
      recorderRef.current = null;
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }
    };
  }, [enabled, deviceId, videoRef]);

  // Reset session state and release any recorded video when disabled
  useEffect(() => {
    if (!enabled) {
      releaseVideoUrl();
      setStatus('idle');
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
    releaseVideoUrl();
    const stream = streamRef.current;
    const mimeType = pickRecorderType();
    if (!stream || mimeType === null) return;
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
  }, [releaseVideoUrl]);

  const stop = useCallback(() => {
    if (recorderRef.current && recorderRef.current.state !== 'inactive') {
      recorderRef.current.stop();
    }
    recorderRef.current = null;
  }, []);

  return {
    status,
    error,
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
