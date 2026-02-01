// src/components/EntireChallengeChart.jsx

import React, { useState, useEffect } from 'react';
import { Bar } from 'react-chartjs-2'; // Changed from Line to Bar
import 'chart.js/auto';
import moment from 'moment';
import { practices } from '../data/practices';
import { getChallengeStartDate, getAppToday } from '../utils/dateUtils';

function EntireChallengeChart({ data }) {
  const [aspectRatio, setAspectRatio] = useState(2); // Default aspect ratio

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 600) {
        setAspectRatio(1.5); // Adjust for mobile
      } else {
        setAspectRatio(2); // Adjust for desktop/tablet
      }
    };

    handleResize(); // Initial check
    window.addEventListener('resize', handleResize); // Listen for resize

    return () => window.removeEventListener('resize', handleResize); // Cleanup
  }, []);

  const startDate = getChallengeStartDate();
  const today = getAppToday();
  // Show data from start date to today (or last date with data)
  const dataKeys = Object.keys(data).filter(key => {
    const date = moment(key, 'YYYY-MM-DD');
    return date.isValid() && date.isSameOrAfter(startDate, 'day');
  }).sort();
  const lastDataDate = dataKeys.length > 0
    ? moment(dataKeys[dataKeys.length - 1], 'YYYY-MM-DD')
    : today;
  const endDate = moment.max(lastDataDate, today);

  const labels = [];
  const practiceDataPoints = [];
  const nutritionDataPoints = [];

  let currentDate = startDate.clone();
  while (currentDate.isSameOrBefore(endDate, 'day')) {
    const dateStr = currentDate.format('YYYY-MM-DD');
    labels.push(currentDate.format('MM/DD'));
    const dayData = data[dateStr] || {};
    const practicesCompleted = dayData.practices ? dayData.practices.length : 0;
    const nutritionPoints = dayData.nutritionPoints !== undefined ? dayData.nutritionPoints : 0;

    practiceDataPoints.push(practicesCompleted);
    nutritionDataPoints.push(nutritionPoints);

    currentDate.add(1, 'day');
  }

  const chartData = {
    labels: labels,
    datasets: [
      {
        label: 'Practices Completed',
        data: practiceDataPoints,
        backgroundColor: 'rgba(75, 192, 192, 0.6)', // Teal
        borderWidth: 1,
        stack: 'Stack 0', // Assign to stack
      },
      {
        label: 'Nutrition Points',
        data: nutritionDataPoints,
        backgroundColor: 'rgba(255, 159, 64, 0.6)', // Orange
        borderWidth: 1,
        stack: 'Stack 0', // Assign to stack
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: true, // Maintain aspect ratio for better responsiveness
    aspectRatio: aspectRatio, // Dynamic aspect ratio based on screen size
    layout: {
      padding: {
        top: 10, // Reduced padding
        right: 10,
        bottom: 10,
        left: 10,
      },
    },
    scales: {
      x: {
        stacked: true, // Enable stacking on the x-axis
        title: {
          display: true,
          text: 'Date',
        },
        ticks: {
          maxRotation: 90, // Rotate labels if they overlap
          minRotation: 45,
          autoSkip: true,
          maxTicksLimit: 10, // Limit number of ticks to prevent clutter
        },
      },
      y: {
        stacked: true, // Enable stacking on the y-axis
        beginAtZero: true,
        max: 10, // Total points per day (5 practices + 5 nutrition)
        ticks: {
          stepSize: 1,
          callback: function (value) {
            return value; // Ensure labels are shown as integers
          },
        },
        title: {
          display: true,
          text: 'Points',
        },
      },
    },
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          boxWidth: 20,
          padding: 15,
        },
      },
      tooltip: {
        mode: 'index', // Show tooltip for all datasets at a given x-value
        intersect: false, // Do not require the cursor to intersect a bar
      },
    },
    interaction: {
      mode: 'nearest',
      axis: 'x',
      intersect: false,
    },
  };

  return (
    <div className="chart-container">
      <h2>Progress History</h2>
      <Bar data={chartData} options={options} />
    </div>
  );
}

export default EntireChallengeChart;
