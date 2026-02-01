// src/components/PracticeItem.jsx

import React from 'react';
import {
  FaAppleAlt,
  FaDumbbell,
  FaBed,
  FaTint,
  FaBookOpen,
} from 'react-icons/fa';
import { GrYoga } from "react-icons/gr";

// Updated icon map with new practices and icons
const iconMap = {
  Workout: <FaDumbbell style={{ color: '#333' }} />,
  'Pull-ups': <FaDumbbell style={{ color: '#333' }} />,
  Stretch: <GrYoga style={{ color: '#333' }} />,
  Sleep: <FaBed style={{ color: '#333' }} />,
  Water: <FaTint style={{ color: '#333' }} />,
  Read: <FaBookOpen style={{ color: '#333' }} />,
};

function PracticeItem({ practice, dayData, handleUpdate }) {
  const isChecked = dayData.practices ? dayData.practices.includes(practice.name) : false;
  const sleepQuality = dayData.sleepQuality !== undefined ? dayData.sleepQuality : 'not-set';

  const handleCheckboxChange = () => {
    const nextChecked = !isChecked;
    const updatedPractices = isChecked
      ? dayData.practices.filter((name) => name !== practice.name)
      : [...(dayData.practices || []), practice.name];

    if (practice.name === 'Water') {
      const storedBottles = Array.isArray(dayData.waterBottles) ? dayData.waterBottles : [];
      const nextBottles = [0, 1, 2].map((index) => {
        const stored = storedBottles[index] || {};
        return {
          done: nextChecked,
          size: stored.size ? String(stored.size) : '32',
        };
      });
      handleUpdate({ practices: updatedPractices, waterBottles: nextBottles });
      return;
    }

    handleUpdate({ practices: updatedPractices });
  };

  const handleSelectChange = (e) => {
    const value = e.target.value;
    if (value !== 'not-set') {
      handleUpdate({ sleepQuality: value });
    } else {
      const newData = { ...dayData };
      delete newData.sleepQuality;
      handleUpdate(newData);
    }
  };

  const iconStyle = {
    width: '24px',
    height: '24px',
    marginRight: '8px',
    color: '#333',
  };

  const labelStyle = {
    display: 'flex',
    alignItems: 'center',
    fontSize: '1em',
  };

  if (practice.type === 'checkbox') {
    return (
      <div className="practice">
        <label style={labelStyle} title={practice.name}>
          <span style={iconStyle}>{iconMap[practice.name]}</span>
          <input
            type="checkbox"
            checked={isChecked}
            onChange={handleCheckboxChange}
          />
          <span className="checkbox"></span>
        </label>
      </div>
    );
  } else if (practice.type === 'select') {
    return (
      <div className="practice">
        <label style={labelStyle} title={practice.name}>
          <span style={iconStyle}>{iconMap[practice.name]}</span>
          <select value={sleepQuality} onChange={handleSelectChange}>
            <option value="not-set"></option>
            <option value="good">Good</option>
            <option value="OK">OK</option>
            <option value="bad">Bad</option>
          </select>
        </label>
      </div>
    );
  }
}

export default PracticeItem;
