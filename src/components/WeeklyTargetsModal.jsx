import React, { useState, useEffect } from 'react';
import Modal from './Modal';

function WeeklyTargetsModal({ isOpen, onClose, weekStartKey, weekGoals, onUpdateWeek }) {
  const [burpees, setBurpees] = useState('');
  const [navySeals, setNavySeals] = useState('');
  const [pullups, setPullups] = useState('');

  // Sync form fields when modal opens or week changes
  useEffect(() => {
    if (isOpen) {
      setBurpees(weekGoals.regularBurpeesGoalTotal || '');
      setNavySeals(weekGoals.navySealBurpeesGoalTotal || '');
      setPullups(weekGoals.pullupsGoalPerSession || '');
    }
  }, [isOpen, weekGoals]);

  const handleSave = () => {
    const parsed = {
      regularBurpeesGoalTotal: parseInt(burpees, 10) || 0,
      navySealBurpeesGoalTotal: parseInt(navySeals, 10) || 0,
      pullupsGoalPerSession: parseInt(pullups, 10) || 0,
    };
    onUpdateWeek(weekStartKey, parsed);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} title="Weekly Targets" onClose={onClose}>
      <div className="targets-form">
        <div className="targets-field">
          <label className="targets-label">Weekly burpees total</label>
          <input
            className="targets-input"
            type="number"
            min="0"
            value={burpees}
            onChange={(e) => setBurpees(e.target.value)}
          />
        </div>
        <div className="targets-field">
          <label className="targets-label">Weekly navy seals total</label>
          <input
            className="targets-input"
            type="number"
            min="0"
            value={navySeals}
            onChange={(e) => setNavySeals(e.target.value)}
          />
        </div>
        <div className="targets-field">
          <label className="targets-label">Pull-ups per session</label>
          <input
            className="targets-input"
            type="number"
            min="0"
            value={pullups}
            onChange={(e) => setPullups(e.target.value)}
          />
        </div>
        <button className="targets-save-btn" type="button" onClick={handleSave}>
          Save
        </button>
      </div>
    </Modal>
  );
}

export default WeeklyTargetsModal;
