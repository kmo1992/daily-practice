// src/App.jsx

import React, { useEffect, useState } from 'react';
import { FaBars } from 'react-icons/fa';
import { onAuthStateChanged, signInWithPopup, signOut } from 'firebase/auth';
import { collection, doc, getDocs, setDoc, writeBatch } from 'firebase/firestore';
import WeekView from './components/WeekView';
import { auth, googleProvider, db } from './firebase';
import { getAppToday } from './utils/dateUtils';
import './App.css';

function App() {
  const [user, setUser] = useState(null);
  const [data, setData] = useState({});
  const [weekGoals, setWeekGoals] = useState({});
  const [authReady, setAuthReady] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [error, setError] = useState('');
  const [appMenuOpen, setAppMenuOpen] = useState(false);
  const [activeModal, setActiveModal] = useState(null);

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

      // One-time migration from localStorage if this is the first login
      const localData = JSON.parse(localStorage.getItem('wholeLifeChallengeData')) || {};
      if (snapshot.empty && Object.keys(localData).length > 0) {
        const batch = writeBatch(db);
        Object.entries(localData).forEach(([dateStr, dayData]) => {
          const dayRef = doc(db, 'users', firebaseUser.uid, 'days', dateStr);
          batch.set(dayRef, dayData, { merge: true });
          firestoreData[dateStr] = dayData;
        });
        await batch.commit();
        localStorage.removeItem('wholeLifeChallengeData');
      }

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
      // Revert to previous state on failure
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
      setError('Could not save your weekly goals. Please retry.');
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
    setAppMenuOpen(false);
    setActiveModal(null);
    try {
      await signOut(auth);
    } catch (err) {
      console.error('Sign-out failed', err);
      setError('Sign-out did not complete. Try again.');
    }
  };

  const openModal = (modalId) => {
    setActiveModal(modalId);
    setAppMenuOpen(false);
  };

  const today = getAppToday();
  const dateStr = today.format('YYYY-MM-DD');
  const dayData = data[dateStr] || {};
  const nutritionPoints =
    dayData.nutritionPoints !== undefined ? dayData.nutritionPoints : 5;

  return (
    <div className="App">
      <div className="app-header">
        <h1>Healthy Habits Tracker</h1>
        <div className="auth-bar">
          {user ? (
            <div className="app-menu">
              <button
                className="app-menu-button"
                type="button"
                aria-haspopup="menu"
                aria-expanded={appMenuOpen}
                aria-label="Open menu"
                onClick={() => setAppMenuOpen((prev) => !prev)}
              >
                <FaBars aria-hidden="true" />
              </button>
              {appMenuOpen && (
                <div className="app-menu-list" role="menu">
                  <div className="app-menu-user">
                    Signed in as {user.displayName || user.email || 'Google User'}
                  </div>
                  <button
                    className={`app-menu-item ${activeModal === 'nutrition' ? 'active' : ''}`}
                    type="button"
                    role="menuitem"
                    onClick={() => openModal('nutrition')}
                  >
                    <span className="app-menu-item-label">Nutrition List</span>
                  </button>
                  <button
                    className={`app-menu-item ${activeModal === 'weekly-goals' ? 'active' : ''}`}
                    type="button"
                    role="menuitem"
                    onClick={() => openModal('weekly-goals')}
                  >
                    <span className="app-menu-item-label">Weekly Workout Goals</span>
                  </button>
                  <button
                    className={`app-menu-item ${activeModal === 'weekly-progress' ? 'active' : ''}`}
                    type="button"
                    role="menuitem"
                    onClick={() => openModal('weekly-progress')}
                  >
                    <span className="app-menu-item-label">Weekly Progress</span>
                  </button>
                  <button
                    className={`app-menu-item ${activeModal === 'challenge-progress' ? 'active' : ''}`}
                    type="button"
                    role="menuitem"
                    onClick={() => openModal('challenge-progress')}
                  >
                    <span className="app-menu-item-label">Entire Challenge Progress</span>
                  </button>
                  <button
                    className="app-menu-item"
                    type="button"
                    role="menuitem"
                    onClick={handleSignOut}
                  >
                    Sign out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button className="google-button" onClick={handleSignIn}>
              <span className="g-icon" aria-hidden="true"></span>
              <span>Sign in with Google</span>
            </button>
          )}
        </div>
      </div>

      {error && <p className="status-message error">{error}</p>}
      {authReady && user && loadingData && (
        <p className="status-message">Loading your data...</p>
      )}
      {authReady && user && !loadingData && (
        <>
          <WeekView
            data={data}
            weekGoals={weekGoals}
            onUpdateDay={handleUpdateDay}
            onUpdateWeek={handleUpdateWeek}
            activeModal={activeModal}
            onCloseModal={() => setActiveModal(null)}
          />
        </>
      )}
      {authReady && !user && (
        <>
          <p>Sign in to start tracking your challenge and sync to Firestore.</p>
        </>
      )}
    </div>
  );
}

export default App;
