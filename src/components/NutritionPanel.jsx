// src/components/NutritionPanel.jsx

import React from 'react';

function NutritionPanel({ nutritionPoints = 5, onNutritionChange = () => {} }) {
  const normalizedPoints = Number.isFinite(nutritionPoints)
    ? Math.max(0, Math.min(5, nutritionPoints))
    : 5;

  const updatePoints = (nextPoints) => {
    const clamped = Math.max(0, Math.min(5, nextPoints));
    onNutritionChange(clamped);
  };

  return (
    <div className="nutrition-panel-content">
        <div className="nutrition-points-grid" role="group" aria-label="Points remaining">
          <div className="nutrition-points-grid-header">
            <span className="nutrition-points-grid-value">{normalizedPoints}</span>
            <span className="nutrition-points-grid-label">Points remaining</span>
          </div>
          <div className="nutrition-points-controls">
            <button
              className="nutrition-points-adjust"
              type="button"
              aria-label="Lose a point"
              onClick={() => updatePoints(normalizedPoints - 1)}
              disabled={normalizedPoints === 0}
            >
              −
            </button>
            {[0, 1, 2, 3, 4, 5].map((value) => {
              const isActive = value === normalizedPoints;
              return (
                <button
                  key={`points-${value}`}
                  className={`nutrition-points-btn ${isActive ? 'active' : ''}`}
                  type="button"
                  aria-pressed={isActive}
                  onClick={() => updatePoints(value)}
                >
                  {value}
                </button>
              );
            })}
            <button
              className="nutrition-points-adjust"
              type="button"
              aria-label="Restore a point"
              onClick={() => updatePoints(normalizedPoints + 1)}
              disabled={normalizedPoints === 5}
          >
            +
          </button>
        </div>
        <div className="nutrition-points-grid-scale">
          <span>0 = off-plan</span>
          <span>5 = start</span>
        </div>
      </div>
    </div>
  );
}

export default NutritionPanel;
