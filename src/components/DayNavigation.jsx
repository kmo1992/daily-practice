import React from 'react';

// Inline arrow SVGs
const LeftArrow = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="15 18 9 12 15 6" />
  </svg>
);

const RightArrow = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="9 6 15 12 9 18" />
  </svg>
);

function DayNavigation({ currentDate, onNavigate, isToday }) {
  const handlePrev = () => {
    onNavigate(currentDate.clone().subtract(1, 'days'));
  };

  const handleNext = () => {
    if (!isToday) {
      onNavigate(currentDate.clone().add(1, 'days'));
    }
  };

  const dateDisplay = currentDate.format('dddd, MMMM D, YYYY');

  return (
    <nav className="day-nav">
      <button className="day-nav-btn" type="button" onClick={handlePrev} aria-label="Previous day">
        <LeftArrow />
      </button>

      <div className="day-nav-date">
        {dateDisplay}
        {isToday && <span className="day-nav-today-badge">Today</span>}
        {!isToday && <span className="day-nav-past-badge">Read only</span>}
      </div>

      <button className="day-nav-btn" type="button" onClick={handleNext} disabled={isToday} aria-label="Next day">
        <RightArrow />
      </button>
    </nav>
  );
}

export default DayNavigation;
