// src/components/NewDayPrimer.jsx

import React from 'react';
import { FaMoon, FaSun, FaLeaf } from 'react-icons/fa';
import { getAppToday } from '../utils/dateUtils';

function NewDayPrimer({ data = {}, onUpdateDay = null }) {
  const today = getAppToday();
  const dateStr = today.format('YYYY-MM-DD');
  const dayData = data[dateStr] || {};
  const practices = dayData.practices || [];

  const sleepWellSet = typeof dayData.sleepWell === 'boolean';
  const nutritionSet = dayData.nutritionPoints !== undefined;

  if (sleepWellSet && nutritionSet) {
    return null;
  }

  const handleSleepChoice = (sleptWell) => {
    if (!onUpdateDay) {
      return;
    }
    const updatedPractices = new Set(practices);
    if (sleptWell) {
      updatedPractices.add('Sleep');
    } else {
      updatedPractices.delete('Sleep');
    }
    onUpdateDay(dateStr, {
      sleepWell: sleptWell,
      practices: Array.from(updatedPractices),
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
      {!sleepWellSet && (
        <div className="primer-card">
          <div className="primer-header">
            <span className="primer-icon night">
              <FaMoon />
            </span>
            <div>
              <p className="primer-kicker">Start the day</p>
              <h2 className="primer-title">Did you sleep well last night?</h2>
            </div>
          </div>
          <div className="primer-actions">
            <button
              className="primer-choice yes"
              type="button"
              onClick={() => handleSleepChoice(true)}
            >
              Yes
            </button>
            <button
              className="primer-choice no"
              type="button"
              onClick={() => handleSleepChoice(false)}
            >
              No
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
