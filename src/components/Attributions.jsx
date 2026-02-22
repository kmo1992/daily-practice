import React from 'react';

const SOURCES = [
  {
    name: 'Atomic Habits by James Clear',
    url: 'https://www.amazon.com/Atomic-Habits-Proven-Build-Break/dp/0735211299',
    note: 'Buy the book. Read the book.',
  },
  {
    name: 'Whole Life Challenge',
    url: 'https://www.wholelifechallenge.com/',
    note: 'Sign up for access to stretching videos.',
  },
  {
    name: 'Busy Dad Training',
    url: 'https://busydadtraining.com/',
    note: 'Learn proper form for Burpees and Navy Seals.',
  },
  {
    name: 'Seconds Interval Timer',
    url: 'https://apps.apple.com/us/app/seconds-interval-timer/id475816966',
    note: 'Download the app for all sorts of training.',
  },
  {
    name: 'The Four Agreements by Don Miguel Ruiz',
    url: 'https://www.amazon.com/Four-Agreements-Practical-Personal-Freedom/dp/1878424319',
    note: 'Buy the book. Read the book.',
  },
];

function Attributions() {
  return (
    <footer className="attributions">
      <p className="attributions-heading">Inspired by</p>
      <ul className="attributions-list">
        {SOURCES.map((source) => (
          <li key={source.url} className="attributions-item">
            <a
              className="attributions-link"
              href={source.url}
              target="_blank"
              rel="noopener noreferrer"
            >
              {source.name}
            </a>
            {source.note && <span className="attributions-note"> — {source.note}</span>}
          </li>
        ))}
      </ul>
      <p className="attributions-footer">
        Built by{' '}
        <a
          className="attributions-link"
          href="https://www.linkedin.com/in/kevin-michael-oliver/"
          target="_blank"
          rel="noopener noreferrer"
        >
          Kevin Oliver
        </a>
        . Everything is slow and methodical.
      </p>
    </footer>
  );
}

export default Attributions;
