// src/components/MorningFlowTabs.jsx

import React from 'react';
import { GiWaterBottle } from 'react-icons/gi';
import MorningStackCard from './MorningStackCard';
import NutritionPanel from './NutritionPanel';
import DailyScoreboard from './DailyScoreboard';
import StreakBadge from './StreakBadge';
import { getAppToday, isFutureDate } from '../utils/dateUtils';
import { calculateHabitPoints } from '../utils/practiceUtils';
import { useStreaks } from '../hooks/useStreaks';

function MorningFlowTabs({ data = {}, weekGoals = {}, onUpdateDay = null, selectedDate = null }) {
  const displayDate = selectedDate || getAppToday();
  const dateStr = displayDate.format('YYYY-MM-DD');
  const dayData = data[dateStr] || {};
  const practices = dayData.practices || [];
  const isFuture = isFutureDate(displayDate);
  const isEditable = onUpdateDay && !isFuture;

  // Calculate streaks for all habits
  const streaks = useStreaks(data, displayDate);

  const sleepQualitySet = dayData.sleepQuality !== undefined;
  const nutritionSet = dayData.nutritionPoints !== undefined;
  const nutritionPoints = nutritionSet ? dayData.nutritionPoints : 5;
  const [revealHydration, setRevealHydration] = React.useState(false);
  const prevSleepQualitySet = React.useRef(sleepQualitySet);

  React.useEffect(() => {
    if (!onUpdateDay || nutritionSet) {
      return;
    }
    onUpdateDay(dateStr, { nutritionPoints: 5 });
  }, [nutritionSet, dateStr, onUpdateDay]);

  React.useEffect(() => {
    const wasSet = prevSleepQualitySet.current;
    if (!wasSet && sleepQualitySet) {
      setRevealHydration(true);
    } else if (!sleepQualitySet) {
      setRevealHydration(false);
    }
    prevSleepQualitySet.current = sleepQualitySet;
  }, [sleepQualitySet]);

  const storedBottles = Array.isArray(dayData.waterBottles) ? dayData.waterBottles : [];
  const bottles = [0, 1, 2].map((index) => {
    const stored = storedBottles[index] || {};
    return {
      done: typeof stored.done === 'boolean' ? stored.done : false,
      size: stored.size ? String(stored.size) : '32',
    };
  });

  const updateBottles = (nextBottles) => {
    if (!onUpdateDay) {
      return;
    }
    const updatedPractices = new Set(practices);
    const allDone = nextBottles.every((bottle) => bottle.done);
    if (allDone) {
      updatedPractices.add('Water');
    } else {
      updatedPractices.delete('Water');
    }
    onUpdateDay(dateStr, {
      waterBottles: nextBottles,
      practices: Array.from(updatedPractices),
    });
  };

  const handleBottleToggle = (index) => {
    const nextBottles = bottles.map((bottle, i) =>
      i === index ? { ...bottle, done: !bottle.done } : bottle
    );
    updateBottles(nextBottles);
  };

  const bottlesDoneCount = bottles.filter((bottle) => bottle.done).length;
  const habitPoints = calculateHabitPoints(practices, dayData);
  const isToday = displayDate.isSame(getAppToday(), 'day');

  const handleNutritionChange = (valueOrEvent) => {
    if (!onUpdateDay) {
      return;
    }
    const nextValue =
      typeof valueOrEvent === 'number'
        ? valueOrEvent
        : parseInt(valueOrEvent.target.value, 10);
    if (Number.isNaN(nextValue)) {
      return;
    }
    onUpdateDay(dateStr, { nutritionPoints: nextValue });
  };

  return (
    <section className="morning-flow">
      <DailyScoreboard
        habitPoints={habitPoints}
        nutritionPoints={nutritionPoints}
        displayDate={displayDate}
        isToday={isToday}
      />
      <MorningStackCard
        data={data}
        weekGoals={weekGoals}
        onUpdateDay={onUpdateDay}
        selectedDate={displayDate}
      />

      {sleepQualitySet && (
        <div className={`hydration-card${revealHydration ? ' hydration-reveal' : ''}`}>
          <div className="hydration-nutrition">
            <div className="hydration-nutrition-header">
              <div>
                <p className="hydration-kicker">Nutrition</p>
                <h3 className="hydration-title">Daily points</h3>
              </div>
              <span className="hydration-status">{nutritionPoints} pts</span>
            </div>
            <NutritionPanel
              nutritionPoints={nutritionPoints}
              onNutritionChange={handleNutritionChange}
              disabled={!isEditable}
            />
          </div>
          <div className="hydration-divider" role="presentation"></div>
          <div className="hydration-header">
            <div>
              <p className="hydration-kicker">Hydration</p>
              <h3 className="hydration-title">
                3 bottles
                {streaks.water > 0 && (
                  <> <StreakBadge count={streaks.water} habitName="Water" /></>
                )}
              </h3>
            </div>
            <span className="hydration-status">{bottlesDoneCount}/3</span>
          </div>
          <div className="hydration-bottles">
            {bottles.map((bottle, index) => (
              <div
                key={`bottle-${index + 1}`}
                className={`hydration-bottle ${bottle.done ? 'done' : ''}`}
              >
                <button
                  className="hydration-bottle-toggle"
                  type="button"
                  aria-pressed={bottle.done}
                  aria-label={`Bottle ${index + 1} ${bottle.done ? 'done' : 'not done'}`}
                  onClick={() => handleBottleToggle(index)}
                  disabled={!isEditable}
                >
                  <GiWaterBottle aria-hidden="true" />
                  <span className="hydration-bottle-label">Bottle {index + 1}</span>
                  <span className="hydration-bottle-state">
                    {bottle.done ? 'Done' : 'Not yet'}
                  </span>
                </button>
                <span className="hydration-bottle-meta">Water</span>
              </div>
            ))}
          </div>
        </div>
      )}

    </section>
  );
}

export default MorningFlowTabs;
