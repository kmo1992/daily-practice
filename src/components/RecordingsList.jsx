import { useEffect, useState, useCallback } from 'react';
import { listRecordings, getRecording, deleteRecording } from '../utils/recordingsStore';

const extFor = (mime) => (mime && mime.includes('mp4') ? 'mp4' : 'webm');

const fmtSize = (bytes) => {
  if (bytes >= 1e9) return `${(bytes / 1e9).toFixed(1)} GB`;
  if (bytes >= 1e6) return `${Math.round(bytes / 1e6)} MB`;
  return `${Math.max(1, Math.round(bytes / 1e3))} KB`;
};

const fmtDate = (iso) => {
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
};

// Saved workout recordings: play inline, download, or delete.
// Everything lives in on-device storage — reviewing here never uploads.
function RecordingsList() {
  const [items, setItems] = useState([]);
  const [active, setActive] = useState(null); // { id, url }

  const refresh = useCallback(() => {
    listRecordings().then(setItems).catch((e) => console.error('Recordings unavailable', e));
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  // Release the playback URL when switching or unmounting
  useEffect(() => {
    return () => {
      if (active) URL.revokeObjectURL(active.url);
    };
  }, [active]);

  const play = async (id) => {
    if (active?.id === id) {
      setActive(null);
      return;
    }
    const rec = await getRecording(id);
    if (rec) setActive({ id, url: URL.createObjectURL(rec.blob) });
  };

  const download = async (item) => {
    const rec = await getRecording(item.id);
    if (!rec) return;
    const url = URL.createObjectURL(rec.blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${item.label.toLowerCase().replace(/\s+/g, '-')}-${item.createdAt.slice(0, 10)}.${extFor(item.mime)}`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 10000);
  };

  const remove = async (id) => {
    await deleteRecording(id);
    if (active?.id === id) setActive(null);
    refresh();
  };

  if (items.length === 0) return null;

  return (
    <div className="recordings">
      <p className="recordings-heading">Recordings</p>
      {items.map((item) => (
        <div key={item.id}>
          <div className="recording-row">
            <button className="recording-play" type="button" onClick={() => play(item.id)}>
              {active?.id === item.id ? '■' : '▶'}
            </button>
            <span className="recording-label">
              {item.label} · {fmtDate(item.createdAt)} · {fmtSize(item.size)}
            </span>
            <button className="recording-action" type="button" onClick={() => download(item)}>
              Save
            </button>
            <button className="recording-action" type="button" onClick={() => remove(item.id)}>
              Delete
            </button>
          </div>
          {active?.id === item.id && (
            <video className="recording-player video-mirror" src={active.url} controls autoPlay playsInline />
          )}
        </div>
      ))}
    </div>
  );
}

export default RecordingsList;
