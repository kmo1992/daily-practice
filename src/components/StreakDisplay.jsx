
function StreakDisplay({ streak }) {
  if (streak === 0) {
    return (
      <div className="streak-display">
        <span className="streak-empty">Start your streak today</span>
      </div>
    );
  }

  return (
    <div className="streak-display">
      <span className="streak-count">{streak}</span>
      <span className="streak-label">day streak</span>
    </div>
  );
}

export default StreakDisplay;
