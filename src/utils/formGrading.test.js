import { describe, it, expect } from 'vitest';
import {
  LM,
  angleDeg,
  analyzeFrame,
  createRepTracker,
  requiredDipsFor,
  summarizeGrades,
} from './formGrading';

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

// Upright, fully extended: hip/knee/elbow all straight, torso vertical
const standing = () =>
  makeFrame({
    SHOULDER: { x: 0.5, y: 0.2 },
    ELBOW: { x: 0.5, y: 0.35 },
    WRIST: { x: 0.5, y: 0.5 },
    HIP: { x: 0.5, y: 0.5 },
    KNEE: { x: 0.5, y: 0.7 },
    ANKLE: { x: 0.5, y: 0.9 },
  });

// Upright but knees soft — should fail the stand-tall checkpoint
const lazyStanding = () =>
  makeFrame({
    SHOULDER: { x: 0.5, y: 0.2 },
    ELBOW: { x: 0.5, y: 0.35 },
    WRIST: { x: 0.5, y: 0.5 },
    HIP: { x: 0.5, y: 0.5 },
    KNEE: { x: 0.5, y: 0.7 },
    ANKLE: { x: 0.42, y: 0.88 },
  });

// Horizontal, arms locked out, straight body line
const plank = () =>
  makeFrame({
    SHOULDER: { x: 0.3, y: 0.6 },
    ELBOW: { x: 0.3, y: 0.7 },
    WRIST: { x: 0.3, y: 0.8 },
    HIP: { x: 0.55, y: 0.62 },
    KNEE: { x: 0.68, y: 0.64 },
    ANKLE: { x: 0.8, y: 0.66 },
  });

// Plank with hips dropped below the body line
const saggingPlank = () =>
  makeFrame({
    SHOULDER: { x: 0.3, y: 0.6 },
    ELBOW: { x: 0.3, y: 0.7 },
    WRIST: { x: 0.3, y: 0.8 },
    HIP: { x: 0.55, y: 0.7 },
    KNEE: { x: 0.68, y: 0.68 },
    ANKLE: { x: 0.8, y: 0.66 },
  });

// Bottom of a push-up: horizontal with elbows bent past depth
const pushupBottom = () =>
  makeFrame({
    SHOULDER: { x: 0.3, y: 0.72 },
    ELBOW: { x: 0.42, y: 0.74 },
    WRIST: { x: 0.3, y: 0.8 },
    HIP: { x: 0.55, y: 0.7 },
    KNEE: { x: 0.68, y: 0.68 },
    ANKLE: { x: 0.8, y: 0.66 },
  });

const feed = (tracker, frames) => {
  const completed = [];
  frames.forEach((f) => {
    const r = tracker.update(analyzeFrame(f));
    if (r) completed.push(r);
  });
  return completed;
};

const stand3 = () => [standing(), standing(), standing()];

// One clean 6-count-style descent: plank → push-up → plank
const cleanDescent = () => [plank(), pushupBottom(), plank(), plank()];

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
    const f = analyzeFrame(standing());
    expect(f.posture).toBe('stand');
    expect(f.hipAngle).toBeGreaterThan(165);
    expect(f.kneeAngle).toBeGreaterThan(165);
  });

  it('classifies a plank as ground with a straight body line', () => {
    const f = analyzeFrame(plank());
    expect(f.posture).toBe('ground');
    expect(f.bodyLine).toBeGreaterThanOrEqual(160);
    expect(f.elbowAngle).toBeGreaterThan(150);
  });

  it('detects hip sag in the body line', () => {
    const f = analyzeFrame(saggingPlank());
    expect(f.posture).toBe('ground');
    expect(f.bodyLine).toBeLessThan(160);
  });

  it('detects push-up depth via the elbow angle', () => {
    const f = analyzeFrame(pushupBottom());
    expect(f.posture).toBe('ground');
    expect(f.elbowAngle).toBeLessThan(95);
  });
});

describe('requiredDipsFor', () => {
  it('requires 1 push-up for burpees and 3 for navy seals', () => {
    expect(requiredDipsFor('Burpees')).toBe(1);
    expect(requiredDipsFor('Navy Seals')).toBe(3);
  });
});

describe('createRepTracker — 6-count', () => {
  it('grades a clean rep A', () => {
    const tracker = createRepTracker('Burpees');
    const completed = feed(tracker, [...stand3(), ...cleanDescent(), ...stand3()]);
    expect(completed).toHaveLength(1);
    expect(completed[0].grade).toBe('A');
    expect(completed[0].checkpoints).toEqual({
      standTall: true,
      chestToDeck: true,
      plank: true,
    });
  });

  it('grades B when the finish is not fully tall', () => {
    const tracker = createRepTracker('Burpees');
    const completed = feed(tracker, [
      ...stand3(),
      ...cleanDescent(),
      lazyStanding(), lazyStanding(), lazyStanding(),
    ]);
    expect(completed).toHaveLength(1);
    expect(completed[0].grade).toBe('B');
    expect(completed[0].checkpoints.standTall).toBe(false);
  });

  it('grades B when there is no full-depth push-up', () => {
    const tracker = createRepTracker('Burpees');
    const completed = feed(tracker, [
      ...stand3(),
      plank(), plank(), plank(),
      ...stand3(),
    ]);
    expect(completed).toHaveLength(1);
    expect(completed[0].grade).toBe('B');
    expect(completed[0].checkpoints.chestToDeck).toBe(false);
  });

  it('grades C when two checkpoints fail', () => {
    const tracker = createRepTracker('Burpees');
    // Mostly sagging plank, no push-up
    const completed = feed(tracker, [
      ...stand3(),
      saggingPlank(), saggingPlank(), saggingPlank(),
      ...stand3(),
    ]);
    expect(completed).toHaveLength(1);
    expect(completed[0].grade).toBe('C');
    expect(completed[0].checkpoints.chestToDeck).toBe(false);
    expect(completed[0].checkpoints.plank).toBe(false);
  });

  it('ignores a crouch that never goes horizontal', () => {
    const tracker = createRepTracker('Burpees');
    const crouch = lazyStanding(); // leaves stand posture briefly? no — build transit
    const completed = feed(tracker, [
      ...stand3(),
      // a transit-only wobble (not ground, not stand)
      makeFrame({
        SHOULDER: { x: 0.45, y: 0.45 },
        ELBOW: { x: 0.45, y: 0.55 },
        WRIST: { x: 0.45, y: 0.65 },
        HIP: { x: 0.5, y: 0.62 },
        KNEE: { x: 0.42, y: 0.75 },
        ANKLE: { x: 0.5, y: 0.9 },
      }),
      ...stand3(),
    ]);
    expect(completed).toHaveLength(0);
    expect(crouch).toBeTruthy();
  });

  it('counts multiple reps in sequence', () => {
    const tracker = createRepTracker('Burpees');
    const completed = feed(tracker, [
      ...stand3(),
      ...cleanDescent(),
      ...stand3(),
      ...cleanDescent(),
      ...stand3(),
    ]);
    expect(completed).toHaveLength(2);
    expect(tracker.getReps()).toHaveLength(2);
  });
});

describe('createRepTracker — navy seals', () => {
  const dip = () => [pushupBottom(), plank()];

  it('requires three push-ups for an A', () => {
    const tracker = createRepTracker('Navy Seals');
    const completed = feed(tracker, [
      ...stand3(),
      plank(), ...dip(), ...dip(), ...dip(),
      ...stand3(),
    ]);
    expect(completed).toHaveLength(1);
    expect(completed[0].dips).toBe(3);
    expect(completed[0].grade).toBe('A');
  });

  it('fails chest-to-deck with only one push-up', () => {
    const tracker = createRepTracker('Navy Seals');
    const completed = feed(tracker, [
      ...stand3(),
      plank(), ...dip(),
      ...stand3(),
    ]);
    expect(completed).toHaveLength(1);
    expect(completed[0].dips).toBe(1);
    expect(completed[0].checkpoints.chestToDeck).toBe(false);
    expect(completed[0].grade).toBe('B');
  });
});

describe('summarizeGrades', () => {
  it('tallies grades', () => {
    const summary = summarizeGrades([
      { grade: 'A' }, { grade: 'A' }, { grade: 'B' }, { grade: 'C' },
    ]);
    expect(summary).toEqual({ total: 4, counts: { A: 2, B: 1, C: 1 } });
  });

  it('handles an empty session', () => {
    expect(summarizeGrades([])).toEqual({ total: 0, counts: { A: 0, B: 0, C: 0 } });
  });
});
