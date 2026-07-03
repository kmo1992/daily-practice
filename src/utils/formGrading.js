// Burpee form grading from MediaPipe Pose landmarks.
//
// Form reference: Busy Dad Training tutorials —
//   6-count military burpee: https://www.youtube.com/watch?v=eroWyZxZNlA
//   Navy SEAL burpee:        https://www.youtube.com/watch?v=BqWQkblauo8
//
// 6-count: squat/hands down → kick back to plank → push-up down → press up
//          → feet forward → STAND TALL (no jump).
// Navy SEAL: same entry/exit, but three push-ups (2nd/3rd with knee-to-elbow).
//
// Checkpoints graded per rep:
//   standTall   — full hip + knee extension at the top
//   chestToDeck — full-depth push-up(s): 1 for 6-count, 3 for navy seals
//   plank       — body line stays straight while horizontal (no sag/pike)
// Grade: A = all pass, B = one miss, C = two or more.

// MediaPipe Pose landmark indices (33-point model)
export const LM = {
  NOSE: 0,
  LEFT_SHOULDER: 11,
  RIGHT_SHOULDER: 12,
  LEFT_ELBOW: 13,
  RIGHT_ELBOW: 14,
  LEFT_WRIST: 15,
  RIGHT_WRIST: 16,
  LEFT_HIP: 23,
  RIGHT_HIP: 24,
  LEFT_KNEE: 25,
  RIGHT_KNEE: 26,
  LEFT_ANKLE: 27,
  RIGHT_ANKLE: 28,
};

// All tunable in one place — expect to calibrate these against real footage.
export const THRESHOLDS = {
  // posture classification
  standMaxTorsoTilt: 30, // deg from vertical to still count as upright
  standMinHipAngle: 150,
  standMinKneeAngle: 150,
  groundMinTorsoTilt: 55, // deg from vertical → body near horizontal

  // checkpoint: stand tall at the top
  standTallHipAngle: 165,
  standTallKneeAngle: 165,

  // checkpoint: push-up depth (elbow angle at the bottom)
  pushupDepthElbow: 95,
  pushupLockoutElbow: 150,

  // checkpoint: plank body line (shoulder–hip–ankle angle)
  plankBodyLineMin: 160,
  plankMaxSagRatio: 0.3, // fraction of horizontal frames allowed below the line

  // frames of continuous standing that close out a rep
  stableFrames: 3,
};

const mid = (a, b) => ({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 });

// Angle at vertex b (degrees) for points a-b-c
export const angleDeg = (a, b, c) => {
  const v1 = { x: a.x - b.x, y: a.y - b.y };
  const v2 = { x: c.x - b.x, y: c.y - b.y };
  const m1 = Math.hypot(v1.x, v1.y);
  const m2 = Math.hypot(v2.x, v2.y);
  if (m1 === 0 || m2 === 0) return 180;
  const cos = Math.min(1, Math.max(-1, (v1.x * v2.x + v1.y * v2.y) / (m1 * m2)));
  return (Math.acos(cos) * 180) / Math.PI;
};

// Torso tilt from vertical in degrees (image space, y grows downward)
export const torsoTilt = (lm) => {
  const shoulder = mid(lm[LM.LEFT_SHOULDER], lm[LM.RIGHT_SHOULDER]);
  const hip = mid(lm[LM.LEFT_HIP], lm[LM.RIGHT_HIP]);
  const dx = Math.abs(shoulder.x - hip.x);
  const dy = Math.abs(shoulder.y - hip.y);
  return (Math.atan2(dx, dy || 1e-6) * 180) / Math.PI;
};

const sideAvg = (lm, fn) => (fn('LEFT') + fn('RIGHT')) / 2;

// Reduce one landmark frame to the measurements the tracker needs
export const analyzeFrame = (lm) => {
  const hipAngle = sideAvg(lm, (s) =>
    angleDeg(lm[LM[`${s}_SHOULDER`]], lm[LM[`${s}_HIP`]], lm[LM[`${s}_KNEE`]]));
  const kneeAngle = sideAvg(lm, (s) =>
    angleDeg(lm[LM[`${s}_HIP`]], lm[LM[`${s}_KNEE`]], lm[LM[`${s}_ANKLE`]]));
  const elbowAngle = sideAvg(lm, (s) =>
    angleDeg(lm[LM[`${s}_SHOULDER`]], lm[LM[`${s}_ELBOW`]], lm[LM[`${s}_WRIST`]]));
  const bodyLine = sideAvg(lm, (s) =>
    angleDeg(lm[LM[`${s}_SHOULDER`]], lm[LM[`${s}_HIP`]], lm[LM[`${s}_ANKLE`]]));
  const tilt = torsoTilt(lm);

  let posture = 'transit';
  if (
    tilt <= THRESHOLDS.standMaxTorsoTilt &&
    hipAngle >= THRESHOLDS.standMinHipAngle &&
    kneeAngle >= THRESHOLDS.standMinKneeAngle
  ) {
    posture = 'stand';
  } else if (tilt >= THRESHOLDS.groundMinTorsoTilt) {
    posture = 'ground';
  }

  return { posture, hipAngle, kneeAngle, elbowAngle, bodyLine, tilt };
};

export const requiredDipsFor = (workoutType) =>
  workoutType === 'Navy Seals' ? 3 : 1;

// Stateful rep tracker: feed analyzed frames in order; returns a graded rep
// object whenever one completes (returning to a stable stand), else null.
export const createRepTracker = (workoutType = 'Burpees') => {
  const requiredDips = requiredDipsFor(workoutType);
  let state = 'idle'; // idle → stand → rep → stand → ...
  let standStreak = 0;
  let inDip = false;
  let rep = null;
  const reps = [];

  const startRep = () => {
    inDip = false;
    rep = { dips: 0, groundFrames: 0, sagFrames: 0 };
  };

  const completeRep = (frame) => {
    // Never went horizontal: probably noise (crouched and stood back up)
    if (rep.groundFrames === 0) {
      rep = null;
      return null;
    }
    const standTall =
      frame.hipAngle >= THRESHOLDS.standTallHipAngle &&
      frame.kneeAngle >= THRESHOLDS.standTallKneeAngle;
    const chestToDeck = rep.dips >= requiredDips;
    const plank =
      rep.sagFrames / rep.groundFrames <= THRESHOLDS.plankMaxSagRatio;

    const checkpoints = { standTall, chestToDeck, plank };
    const misses = Object.values(checkpoints).filter((ok) => !ok).length;
    const grade = misses === 0 ? 'A' : misses === 1 ? 'B' : 'C';
    const result = { grade, checkpoints, dips: rep.dips };
    reps.push(result);
    rep = null;
    return result;
  };

  const update = (frame) => {
    const isStand = frame.posture === 'stand';
    standStreak = isStand ? standStreak + 1 : 0;

    if (state === 'idle') {
      if (standStreak >= THRESHOLDS.stableFrames) state = 'stand';
      return null;
    }

    if (state === 'stand') {
      if (isStand) return null;
      state = 'rep';
      startRep();
    }

    // state === 'rep'
    if (frame.posture === 'ground') {
      rep.groundFrames += 1;
      if (frame.bodyLine < THRESHOLDS.plankBodyLineMin) rep.sagFrames += 1;
      if (!inDip && frame.elbowAngle <= THRESHOLDS.pushupDepthElbow) {
        inDip = true;
        rep.dips += 1;
      }
      if (inDip && frame.elbowAngle >= THRESHOLDS.pushupLockoutElbow) {
        inDip = false;
      }
    }

    if (standStreak >= THRESHOLDS.stableFrames) {
      const completed = completeRep(frame);
      state = 'stand';
      return completed;
    }
    return null;
  };

  return { update, getReps: () => [...reps], requiredDips };
};

export const summarizeGrades = (reps) => {
  const counts = { A: 0, B: 0, C: 0 };
  reps.forEach((r) => {
    counts[r.grade] += 1;
  });
  return { total: reps.length, counts };
};
