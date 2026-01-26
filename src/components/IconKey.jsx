// src/components/IconKey.jsx

import React from 'react';
import {
  FaAppleAlt,
  FaDumbbell,
  FaBed,
  FaTint,
  FaBookOpen,
} from 'react-icons/fa';
import { GrYoga } from "react-icons/gr";

function IconKey() {
  const keyItems = [
    { name: 'Nutrition', icon: <FaAppleAlt style={{ color: '#333' }} /> },
    { name: 'Exercise', icon: <FaDumbbell style={{ color: '#333' }} /> },
    { name: 'Stretch', icon: <GrYoga style={{ color: '#333' }} /> },
    { name: 'Sleep', icon: <FaBed style={{ color: '#333' }} /> },
    { name: 'Water', icon: <FaTint style={{ color: '#333' }} /> },
    { name: 'Read', icon: <FaBookOpen style={{ color: '#333' }} /> },
  ];

  return (
    <div className="icon-key">
      {keyItems.map((item) => (
        <div key={item.name} className="key-item">
          <span className="icon">{item.icon}</span>
          <span>{item.name}</span>
        </div>
      ))}
    </div>
  );
}

export default IconKey;
