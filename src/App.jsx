// src/App.jsx

import React, { useEffect, useState } from 'react';
import { onAuthStateChanged, signInWithPopup, signOut } from 'firebase/auth';
import { collection, doc, getDocs, setDoc, writeBatch } from 'firebase/firestore';
import WeekView from './components/WeekView';
import IconKey from './components/IconKey';
import { auth, googleProvider, db } from './firebase';
import './App.css';

function App() {
  const [user, setUser] = useState(null);
  const [data, setData] = useState({});
  const [authReady, setAuthReady] = useState(false);
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        await loadUserData(firebaseUser);
      } else {
        setData({});
        setLoadingData(false);
      }
      setAuthReady(true);
    });

    return () => unsubscribe();
  }, []);

  const loadUserData = async (firebaseUser) => {
    setLoadingData(true);
    const daysRef = collection(db, 'users', firebaseUser.uid, 'days');
    const snapshot = await getDocs(daysRef);
    const firestoreData = {};

    snapshot.forEach((docSnap) => {
      firestoreData[docSnap.id] = docSnap.data();
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
    setLoadingData(false);
  };

  const handleUpdateDay = async (dateStr, partialData) => {
    if (!user) return;
    const mergedDay = { ...(data[dateStr] || {}), ...partialData };
    setData((prev) => ({ ...prev, [dateStr]: mergedDay }));

    const dayRef = doc(db, 'users', user.uid, 'days', dateStr);
    await setDoc(dayRef, mergedDay, { merge: true });
  };

  const handleSignIn = async () => {
    await signInWithPopup(auth, googleProvider);
  };

  const handleSignOut = async () => {
    setData({});
    await signOut(auth);
  };

  return (
    <div className="App">
      <div className="app-header">
        <h1>Healthy Habits Tracker</h1>
        <div className="auth-bar">
          {user ? (
            <div className="auth-details">
              <span className="auth-name">
                Signed in as {user.displayName || user.email || 'Google User'}
              </span>
              <button className="secondary-button" onClick={handleSignOut}>
                Sign out
              </button>
            </div>
          ) : (
            <button className="google-button" onClick={handleSignIn}>
              <span className="g-icon" aria-hidden="true"></span>
              <span>Sign in with Google</span>
            </button>
          )}
        </div>
      </div>

      {authReady && user && loadingData && <p>Loading your data...</p>}
      {authReady && user && !loadingData && (
        <>
          <IconKey />
          <WeekView data={data} onUpdateDay={handleUpdateDay} />
        </>
      )}
      {authReady && !user && (
        <>
          <p>Sign in to start tracking your challenge and sync to Firestore.</p>
          <IconKey />
        </>
      )}
    </div>
  );
}

export default App;
