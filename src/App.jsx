import React, { useEffect, useState } from 'react';
import { onAuthStateChanged, signInWithPopup, signOut } from 'firebase/auth';
import { collection, doc, getDocs, setDoc } from 'firebase/firestore';
import { auth, googleProvider, db } from './firebase';
import { getAppToday } from './utils/dateUtils';
import { getWeekStartKey } from './utils/scheduleUtils';
import DayView from './components/DayView';
import WeeklyTargetsModal from './components/WeeklyTargetsModal';
import './App.css';

// Inline gear SVG icon
const GearIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="10" cy="10" r="3" />
    <path d="M10 1.5a1 1 0 0 1 1 1v1.17a6.5 6.5 0 0 1 2.18.9l.83-.83a1 1 0 0 1 1.41 1.41l-.83.83a6.5 6.5 0 0 1 .9 2.18H16.5a1 1 0 0 1 0 2h-1.17a6.5 6.5 0 0 1-.9 2.18l.83.83a1 1 0 0 1-1.41 1.41l-.83-.83a6.5 6.5 0 0 1-2.18.9V16.5a1 1 0 0 1-2 0v-1.17a6.5 6.5 0 0 1-2.18-.9l-.83.83a1 1 0 0 1-1.41-1.41l.83-.83a6.5 6.5 0 0 1-.9-2.18H3.5a1 1 0 0 1 0-2h1.17a6.5 6.5 0 0 1 .9-2.18l-.83-.83A1 1 0 0 1 6.16 4.24l.83.83a6.5 6.5 0 0 1 2.18-.9V2.5a1 1 0 0 1 1-1z" />
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

  const handleSignIn = async () => {
    setError('');
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err) {
      console.error('Sign-in failed', err);
      setError('Sign-in was interrupted. Please try again.');
    }
  };

  const handleSignOut = async () => {
    setData({});
    setWeekGoals({});
    setError('');
    setSettingsOpen(false);
    try {
      await signOut(auth);
    } catch (err) {
      console.error('Sign-out failed', err);
      setError('Sign-out did not complete. Try again.');
    }
  };

  const weekStartKey = getWeekStartKey(getAppToday());
  const currentWeekGoals = weekGoals[weekStartKey] || {};

  return (
    <div className="app">
      <header className="app-header">
        <h1 className="app-title">Daily Practice</h1>
        <div className="app-actions">
          {user && (
            <>
              <button className="settings-btn" type="button" onClick={() => setSettingsOpen(true)} aria-label="Settings">
                <GearIcon />
              </button>
              <button className="sign-out-btn" type="button" onClick={handleSignOut}>
                Sign out
              </button>
            </>
          )}
          {!user && authReady && (
            <button className="sign-in-btn" type="button" onClick={handleSignIn}>
              Sign in with Google
            </button>
          )}
        </div>
      </header>

      {error && <p className="error-message">{error}</p>}
      {authReady && user && loadingData && <p className="loading">Loading...</p>}

      {authReady && user && !loadingData && (
        <DayView
          data={data}
          weekGoals={weekGoals}
          onUpdateDay={handleUpdateDay}
        />
      )}

      {authReady && !user && (
        <p className="sign-in-prompt">Sign in to start your daily practice.</p>
      )}

      <WeeklyTargetsModal
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        weekStartKey={weekStartKey}
        weekGoals={currentWeekGoals}
        onUpdateWeek={handleUpdateWeek}
      />
    </div>
  );
}

export default App;
