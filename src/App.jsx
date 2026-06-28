import { useEffect, useState, useRef, useCallback } from 'react';
import { onAuthStateChanged, signOut, signInWithCredential, GoogleAuthProvider } from 'firebase/auth';
import { collection, doc, getDocs, setDoc } from 'firebase/firestore';
import { auth, GOOGLE_CLIENT_ID, db } from './firebase';
import { getAppToday } from './utils/dateUtils';
import { getWeekStartKey, resolveWeekGoals } from './utils/scheduleUtils';
import DayView from './components/DayView';
import TrendsView from './components/TrendsView';
import WeeklyTargetsModal from './components/WeeklyTargetsModal';
import './App.css';

// Inline gear SVG icon
const GearIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="10" cy="10" r="3" />
    <path d="M10 1.5a1 1 0 0 1 1 1v1.17a6.5 6.5 0 0 1 2.18.9l.83-.83a1 1 0 0 1 1.41 1.41l-.83.83a6.5 6.5 0 0 1 .9 2.18H16.5a1 1 0 0 1 0 2h-1.17a6.5 6.5 0 0 1-.9 2.18l.83.83a1 1 0 0 1-1.41 1.41l-.83-.83a6.5 6.5 0 0 1-2.18.9V16.5a1 1 0 0 1-2 0v-1.17a6.5 6.5 0 0 1-2.18-.9l-.83.83a1 1 0 0 1-1.41-1.41l.83-.83a6.5 6.5 0 0 1-.9-2.18H3.5a1 1 0 0 1 0-2h1.17a6.5 6.5 0 0 1 .9-2.18l-.83-.83A1 1 0 0 1 6.16 4.24l.83.83a6.5 6.5 0 0 1 2.18-.9V2.5a1 1 0 0 1 1-1z" />
  </svg>
);

// Inline bar-chart SVG icon for the trends toggle
const ChartIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="3" y1="17" x2="17" y2="17" />
    <rect x="4" y="9" width="3" height="6" />
    <rect x="8.5" y="5" width="3" height="10" />
    <rect x="13" y="11" width="3" height="4" />
  </svg>
);

function App() {
  const [user, setUser] = useState(null);
  const [data, setData] = useState({});
  const [weekGoals, setWeekGoals] = useState({});
  const [authReady, setAuthReady] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [error, setError] = useState('');
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [view, setView] = useState('day');
  const gisButtonRef = useRef(null);
  const gisInitializedRef = useRef(false);

  const handleGisCredentialResponse = useCallback(async (response) => {
    setError('');
    try {
      const credential = GoogleAuthProvider.credential(response.credential);
      await signInWithCredential(auth, credential);
    } catch (err) {
      console.error('GIS sign-in failed', err);
      setError('Sign-in failed. Please try again.');
    }
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      setError('');
      if (firebaseUser) {
        await loadUserData(firebaseUser);
      } else {
        setData({});
        setWeekGoals({});
        setLoadingData(false);
      }
      setAuthReady(true);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (user || !authReady) return;
    if (gisInitializedRef.current) return;

    const initializeGis = () => {
      if (!window.google?.accounts?.id) return false;
      if (!gisButtonRef.current) return false;

      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: handleGisCredentialResponse,
        auto_select: false,
        itp_support: true,
      });

      window.google.accounts.id.renderButton(gisButtonRef.current, {
        type: 'standard',
        theme: 'outline',
        size: 'large',
        text: 'signin_with',
        shape: 'rectangular',
        width: 250,
      });

      gisInitializedRef.current = true;
      return true;
    };

    if (initializeGis()) return;

    const interval = setInterval(() => {
      if (initializeGis()) {
        clearInterval(interval);
      }
    }, 100);

    return () => clearInterval(interval);
  }, [user, authReady, handleGisCredentialResponse]);

  const loadUserData = async (firebaseUser) => {
    setLoadingData(true);
    try {
      const daysRef = collection(db, 'users', firebaseUser.uid, 'days');
      const weeksRef = collection(db, 'users', firebaseUser.uid, 'weeks');
      const [snapshot, weeksSnapshot] = await Promise.all([getDocs(daysRef), getDocs(weeksRef)]);
      const firestoreData = {};
      const firestoreWeeks = {};

      snapshot.forEach((docSnap) => {
        firestoreData[docSnap.id] = docSnap.data();
      });
      weeksSnapshot.forEach((docSnap) => {
        firestoreWeeks[docSnap.id] = docSnap.data();
      });

      setData(firestoreData);
      setWeekGoals(firestoreWeeks);
    } catch (err) {
      console.error('Failed to load data', err);
      setError('Unable to load your data right now. Please retry.');
    } finally {
      setLoadingData(false);
    }
  };

  const handleUpdateDay = async (dateStr, partialData) => {
    if (!user) return;
    const mergedDay = { ...(data[dateStr] || {}), ...partialData };

    setData((prev) => ({ ...prev, [dateStr]: mergedDay }));
    setError('');

    try {
      const dayRef = doc(db, 'users', user.uid, 'days', dateStr);
      await setDoc(dayRef, mergedDay, { merge: true });
    } catch (err) {
      console.error('Save failed', err);
      setError('Could not save your change. Please retry.');
      setData((prev) => ({ ...prev, [dateStr]: data[dateStr] || {} }));
    }
  };

  const handleUpdateWeek = async (weekStartStr, partialData) => {
    if (!user) return;
    const mergedWeek = { ...(weekGoals[weekStartStr] || {}), ...partialData };

    setWeekGoals((prev) => ({ ...prev, [weekStartStr]: mergedWeek }));
    setError('');

    try {
      const weekRef = doc(db, 'users', user.uid, 'weeks', weekStartStr);
      await setDoc(weekRef, mergedWeek, { merge: true });
    } catch (err) {
      console.error('Week save failed', err);
      setError('Could not save your weekly targets. Please retry.');
      setWeekGoals((prev) => ({ ...prev, [weekStartStr]: weekGoals[weekStartStr] || {} }));
    }
  };

  const handleSignOut = async () => {
    setData({});
    setWeekGoals({});
    setError('');
    setSettingsOpen(false);
    setView('day');
    gisInitializedRef.current = false;
    try {
      if (window.google?.accounts?.id) {
        window.google.accounts.id.disableAutoSelect();
      }
      await signOut(auth);
    } catch (err) {
      console.error('Sign-out failed', err);
      setError('Sign-out did not complete. Try again.');
    }
  };

  const today = getAppToday();
  const isSunday = today.isoWeekday() === 7;
  // On Sunday, settings target the upcoming week (Monday's key)
  const settingsWeekStartKey = isSunday
    ? getWeekStartKey(today.clone().add(1, 'day'))
    : getWeekStartKey(today);
  const settingsWeekGoals = resolveWeekGoals(weekGoals, settingsWeekStartKey);

  return (
    <div className="app">
      <header className="app-header">
        <h1 className="app-title">Daily Practice</h1>
        <div className="app-actions">
          {user && (
            <>
              <button
                className="settings-btn"
                type="button"
                onClick={() => setView(view === 'trends' ? 'day' : 'trends')}
                aria-label={view === 'trends' ? 'Back to today' : 'Trends'}
              >
                <ChartIcon />
              </button>
              <button className="settings-btn" type="button" onClick={() => setSettingsOpen(true)} aria-label="Settings">
                <GearIcon />
              </button>
              <button className="sign-out-btn" type="button" onClick={handleSignOut}>
                Sign out
              </button>
            </>
          )}
        </div>
      </header>

      {error && <p className="error-message">{error}</p>}
      {authReady && user && loadingData && <p className="loading">Loading...</p>}

      {authReady && user && !loadingData && view === 'day' && (
        <DayView
          data={data}
          weekGoals={weekGoals}
          onUpdateDay={handleUpdateDay}
          onOpenSettings={() => setSettingsOpen(true)}
        />
      )}

      {authReady && user && !loadingData && view === 'trends' && (
        <TrendsView data={data} onBack={() => setView('day')} />
      )}

      {authReady && !user && (
        <div className="sign-in-container">
          <p className="sign-in-prompt">Sign in to start your daily practice.</p>
          <div ref={gisButtonRef} />
        </div>
      )}

      <WeeklyTargetsModal
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        weekStartKey={settingsWeekStartKey}
        weekGoals={settingsWeekGoals}
        onUpdateWeek={handleUpdateWeek}
        title={isSunday ? "Next Week's Targets" : 'Weekly Targets'}
      />
    </div>
  );
}

export default App;
