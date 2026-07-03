// Burpee rep counting from MediaPipe Pose landmarks.
//
// A rep is one stand → horizontal → stand-back-up cycle, which covers both
// Busy Dad movements (6-count and Navy SEAL) from any camera angle robust
// enough to classify posture. No form grading — the camera counts and
// records; judging form is for self-review of the video.

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

export const THRESHOLDS = {
  standMaxTorsoTilt: 30, // deg from vertical to still count as upright
  standMinHipAngle: 150,
  standMinKneeAngle: 150,
  groundMinTorsoTilt: 55, // deg from vertical → body near horizontal
  stableFrames: 3, // consecutive standing frames that close out a rep
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

// Reduce one landmark frame to a posture classification
export const analyzeFrame = (lm) => {
  const hipAngle = sideAvg(lm, (s) =>
    angleDeg(lm[LM[`${s}_SHOULDER`]], lm[LM[`${s}_HIP`]], lm[LM[`${s}_KNEE`]]));
  const kneeAngle = sideAvg(lm, (s) =>
    angleDeg(lm[LM[`${s}_HIP`]], lm[LM[`${s}_KNEE`]], lm[LM[`${s}_ANKLE`]]));
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

  return { posture, hipAngle, kneeAngle, tilt };
};

// Stateful rep counter: feed analyzed frames in order; update() returns true
// exactly when a rep completes (back to a stable stand after going down).
export const createRepCounter = () => {
  let state = 'idle'; // idle → stand → rep → stand → ...
  let standStreak = 0;
  let groundFrames = 0;
  let count = 0;

  const update = (frame) => {
    const isStand = frame.posture === 'stand';
    standStreak = isStand ? standStreak + 1 : 0;

    if (state === 'idle') {
      if (standStreak >= THRESHOLDS.stableFrames) state = 'stand';
      return false;
    }

    if (state === 'stand') {
      if (isStand) return false;
      state = 'rep';
      groundFrames = 0;
    }

    // state === 'rep'
    if (frame.posture === 'ground') groundFrames += 1;

    if (standStreak >= THRESHOLDS.stableFrames) {
      state = 'stand';
      // Never went horizontal: noise (a crouch), not a burpee
      if (groundFrames > 0) {
        count += 1;
        return true;
      }
    }
    return false;
  };

  return { update, getCount: () => count };
};
