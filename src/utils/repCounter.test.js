import { describe, it, expect } from 'vitest';
import { LM, angleDeg, analyzeFrame, createRepCounter } from './repCounter';

// Build a 33-point landmark frame from a sparse spec, mirroring the same
// coordinates onto left and right sides (a clean side-on view).
const makeFrame = (spec) => {
  const lm = Array.from({ length: 33 }, () => ({ x: 0, y: 0 }));
  Object.entries(spec).forEach(([part, pt]) => {
    lm[LM[`LEFT_${part}`]] = pt;
    lm[LM[`RIGHT_${part}`]] = pt;
  });
  return lm;
};

// Upright, fully extended
const standing = () =>
  makeFrame({
    SHOULDER: { x: 0.5, y: 0.2 },
    HIP: { x: 0.5, y: 0.5 },
    KNEE: { x: 0.5, y: 0.7 },
    ANKLE: { x: 0.5, y: 0.9 },
  });

// Horizontal (plank / push-up territory)
const horizontal = () =>
  makeFrame({
    SHOULDER: { x: 0.3, y: 0.6 },
    HIP: { x: 0.55, y: 0.62 },
    KNEE: { x: 0.68, y: 0.64 },
    ANKLE: { x: 0.8, y: 0.66 },
  });

// Mid-movement crouch: neither upright-extended nor horizontal
const crouch = () =>
  makeFrame({
    SHOULDER: { x: 0.45, y: 0.45 },
    HIP: { x: 0.5, y: 0.62 },
    KNEE: { x: 0.42, y: 0.75 },
    ANKLE: { x: 0.5, y: 0.9 },
  });

const feed = (counter, frames) =>
  frames.reduce((n, f) => n + (counter.update(analyzeFrame(f)) ? 1 : 0), 0);

const stand3 = () => [standing(), standing(), standing()];
const descent = () => [horizontal(), horizontal(), horizontal()];

describe('angleDeg', () => {
  it('measures a straight line as 180', () => {
    expect(angleDeg({ x: 0, y: 0 }, { x: 0, y: 1 }, { x: 0, y: 2 })).toBeCloseTo(180);
  });

  it('measures a right angle as 90', () => {
    expect(angleDeg({ x: 0, y: 0 }, { x: 0, y: 1 }, { x: 1, y: 1 })).toBeCloseTo(90);
  });
});

describe('analyzeFrame', () => {
  it('classifies upright full extension as stand', () => {
    expect(analyzeFrame(standing()).posture).toBe('stand');
  });

  it('classifies a horizontal body as ground', () => {
    expect(analyzeFrame(horizontal()).posture).toBe('ground');
  });

  it('classifies a crouch as transit', () => {
    expect(analyzeFrame(crouch()).posture).toBe('transit');
  });
});

describe('createRepCounter', () => {
  it('counts a clean stand → ground → stand cycle as one rep', () => {
    const counter = createRepCounter();
    const reps = feed(counter, [...stand3(), ...descent(), ...stand3()]);
    expect(reps).toBe(1);
    expect(counter.getCount()).toBe(1);
  });

  it('ignores a crouch that never goes horizontal', () => {
    const counter = createRepCounter();
    const reps = feed(counter, [...stand3(), crouch(), crouch(), ...stand3()]);
    expect(reps).toBe(0);
    expect(counter.getCount()).toBe(0);
  });

  it('counts consecutive reps', () => {
    const counter = createRepCounter();
    const reps = feed(counter, [
      ...stand3(),
      ...descent(), ...stand3(),
      ...descent(), ...stand3(),
      ...descent(), ...stand3(),
    ]);
    expect(reps).toBe(3);
    expect(counter.getCount()).toBe(3);
  });

  it('does not count until an initial stable stand is seen', () => {
    const counter = createRepCounter();
    // Starts mid-plank (e.g. camera turned on late) — no phantom rep
    const reps = feed(counter, [...descent(), ...stand3()]);
    expect(reps).toBe(0);
  });

  it('requires the stand to be stable, not a single frame', () => {
    const counter = createRepCounter();
    // One standing frame between descents is a wobble, not a completed rep
    const reps = feed(counter, [...stand3(), ...descent(), standing(), ...descent(), ...stand3()]);
    expect(reps).toBe(1);
  });
});
