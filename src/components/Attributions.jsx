import React from 'react';

const Link = ({ href, children }) => (
  <a className="attributions-link" href={href} target="_blank" rel="noopener noreferrer">
    <strong>{children}</strong>
  </a>
);

function Attributions() {
  return (
    <footer className="attributions">
      <p className="attributions-heading">Inspired by</p>

      <div className="attributions-entries">
        <p className="attributions-entry">
          <Link href="https://www.amazon.com/Atomic-Habits-Proven-Build-Break/dp/0735211299">
            Atomic Habits
          </Link>{' '}
          helped me refine and simplify this app to make it super easy to use.
        </p>

        <p className="attributions-entry">
          <Link href="https://www.wholelifechallenge.com/">Whole Life Challenge</Link>{' '}
          is where this journey started years ago—a framework of daily practices. Their
          stretching videos (requires subscription) are a fantastic springboard for a better
          lifestyle.
        </p>

        <p className="attributions-entry">
          <Link href="https://busydadtraining.com/">Busy Dad Training</Link>{' '}
          keeps it simple. Watch his videos for proper Burpee and Navy Seal form. Pair them
          with pull-ups—start with a band and work your way up to 10. Then, graduate to a
          lighter band or none at all.
        </p>

        <div className="attributions-extras">
          <p className="attributions-entry">
            <Link href="https://apps.apple.com/us/app/seconds-interval-timer/id475816966">
              Seconds Interval Timer
            </Link>{' '}
            — the app for all your training countdowns.
          </p>

          <p className="attributions-entry">
            <Link href="https://www.amazon.com/Four-Agreements-Practical-Personal-Freedom/dp/1878424319">
              The Four Agreements
            </Link>{' '}
            — an easy read with essential advice for moving through the day with less guilt
            and self-blame.
          </p>
        </div>
      </div>

      <p className="attributions-footer">
        Built by{' '}
        <Link href="https://www.linkedin.com/in/kevin-michael-oliver/">Kevin Oliver</Link>
      </p>
    </footer>
  );
}

export default Attributions;
