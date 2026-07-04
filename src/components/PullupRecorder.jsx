import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import useRepCamera from '../hooks/useRepCamera';
import RecordingsList from './RecordingsList';
import { saveRecording, deleteRecording } from '../utils/recordingsStore';
import './FlowTimer.css';

// Record a pull-up set for self-review: camera preview, record/stop,
// auto-save to on-device recordings, replay. No timer, no pose counting —
// just the video.
function PullupRecorder({ isOpen, onClose }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const camera = useRepCamera({ videoRef, canvasRef, enabled: isOpen, counting: false });
  const [recordingLive, setRecordingLive] = useState(false);
  const [savedId, setSavedId] = useState(null);

  const videoExt = camera.videoMime.includes('mp4') ? 'mp4' : 'webm';

  // Auto-save once a stopped recording finalizes
  useEffect(() => {
    if (!isOpen || recordingLive || savedId || !camera.videoBlob) return;
    saveRecording({ label: 'Pull-ups', blob: camera.videoBlob, mime: camera.videoMime })
      .then(setSavedId)
      .catch((e) => console.error('Could not save recording', e));
  }, [isOpen, recordingLive, savedId, camera.videoBlob, camera.videoMime]);

  if (!isOpen) return null;

  const startRecording = () => {
    setSavedId(null);
    camera.start();
    setRecordingLive(true);
  };

  const stopRecording = () => {
    camera.stop();
    setRecordingLive(false);
  };

  const deleteSaved = () => {
    if (savedId) {
      deleteRecording(savedId).catch((e) => console.error('Could not delete recording', e));
    }
    setSavedId(null);
    camera.discardVideo();
  };

  const overlay = (
    <div className="flow-timer-overlay">
      <div className="flow-timer-modal">
        <div className="prestart-controls">
          <span className="recorder-title">Record pull-ups</span>
          {!recordingLive && camera.devices.length > 1 && (
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

        <div className="flow-area">
          {camera.videoUrl && !recordingLive ? (
            <div className="video-review">
              <video src={camera.videoUrl} controls playsInline />
              <p className="review-caption">{savedId ? 'Saved to recordings ✓' : 'Saving…'}</p>
              <div className="video-review-actions">
                <a
                  className="review-btn"
                  href={camera.videoUrl}
                  download={`pull-ups-${new Date().toISOString().slice(0, 10)}.${videoExt}`}
                >
                  Download
                </a>
                <button className="review-btn review-btn--ghost recorder-ghost" type="button" onClick={deleteSaved}>
                  Delete
                </button>
              </div>
            </div>
          ) : (
            <div className="recorder-stage">
              <video ref={videoRef} className="recorder-preview" playsInline muted />
              <canvas ref={canvasRef} style={{ display: 'none' }} />
              {camera.status === 'loading' && <p className="flow-hint">Starting camera…</p>}
              {camera.status === 'error' && <p className="flow-hint">{camera.error}</p>}
              {recordingLive && <span className="recorder-dot">● REC</span>}
            </div>
          )}

          {!recordingLive && <RecordingsList />}
        </div>

        <div className="controls-container">
          <button className="review-btn review-btn--ghost recorder-ghost" type="button" onClick={onClose}>
            Close
          </button>
          {recordingLive ? (
            <button className="review-btn recorder-rec" type="button" onClick={stopRecording}>
              Stop
            </button>
          ) : (
            <button
              className="review-btn recorder-rec"
              type="button"
              onClick={startRecording}
              disabled={camera.status !== 'ready'}
            >
              Record
            </button>
          )}
        </div>
      </div>
    </div>
  );

  return createPortal(overlay, document.body);
}

export default PullupRecorder;
