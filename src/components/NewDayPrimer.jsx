// src/components/NewDayPrimer.jsx

import React from 'react';
import { FaMoon, FaSun, FaLeaf } from 'react-icons/fa';
import { getAppToday } from '../utils/dateUtils';

function NewDayPrimer({ data = {}, onUpdateDay = null }) {
  const today = getAppToday();
  const dateStr = today.format('YYYY-MM-DD');
  const dayData = data[dateStr] || {};
  const practices = dayData.practices || [];

  const sleepQualitySet = dayData.sleepQuality !== undefined;
  const nutritionSet = dayData.nutritionPoints !== undefined;

  if (sleepQualitySet && nutritionSet) {
    return null;
  }

  const handleSleepChoice = (quality) => {
    if (!onUpdateDay) {
      return;
    }
    onUpdateDay(dateStr, {
      sleepQuality: quality,
    });
  };

  const handleNutritionStart = () => {
    if (!onUpdateDay) {
      return;
    }
    onUpdateDay(dateStr, { nutritionPoints: 5 });
  };

  return (
    <section className="day-primer">
      {!sleepQualitySet && (
        <div className="primer-card">
          <div className="primer-header">
            <span className="primer-icon night">
              <FaMoon />
            </span>
            <div>
              <p className="primer-kicker">Start the day</p>
              <h2 className="primer-title">How did you sleep last night?</h2>
            </div>
          </div>
          <div className="primer-actions">
            <button
              className="primer-choice yes"
              type="button"
              onClick={() => handleSleepChoice('good')}
            >
              Good
            </button>
            <button
              className="primer-choice"
              type="button"
              onClick={() => handleSleepChoice('OK')}
            >
              OK
            </button>
            <button
              className="primer-choice no"
              type="button"
              onClick={() => handleSleepChoice('bad')}
            >
              Bad
            </button>
          </div>
        </div>
      )}

      {!nutritionSet && (
        <div className="primer-card">
          <div className="primer-header">
            <span className="primer-icon day">
              <FaSun />
            </span>
            <div>
              <p className="primer-kicker">Nutrition reset</p>
              <h2 className="primer-title">Fresh start: you begin with 5 points.</h2>
            </div>
          </div>
          <p className="primer-body">
            Be honest when you eat or drink something off-plan so your points stay real.
          </p>
          <button className="primer-affirm" type="button" onClick={handleNutritionStart}>
            Start with 5 points
          </button>
          <span className="primer-note">
            <FaLeaf aria-hidden="true" /> Clean points, clean momentum.
          </span>
        </div>
      )}
    </section>
  );
}

export default NewDayPrimer;
