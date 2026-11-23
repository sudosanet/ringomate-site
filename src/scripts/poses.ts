// Procedural poses for the site mascot (VRM 0.x normalized bones after rotateVRM0; radians).
// Euler XYZ in the model's own frame (it faces -z there): +z lowers the left arm, -z lowers the right arm;
// +x swings a lowered arm forward; elbows bend forward with +y (right) / -y (left); +x on an upper leg lifts it forward;
// on the spine, neck and head +x leans back / looks up, -x bows / nods.
// A pose is a function of time t (s, since the act began) and beat phase b (0..1 per beat). Nothing stands still.
import type { VRMHumanBoneName } from "@pixiv/three-vrm";

export type Rot = [number, number, number];
type Bones = Partial<Record<VRMHumanBoneName, Rot>>;
export type Pose = { bones: Bones; hipsY?: number; hipsX?: number; face?: Record<string, number> };
export type Act = "hello" | "idle" | "spin" | "dance" | "hold" | "talk" | "notice" | "voice" | "sleepy" | "think" | "cheer" | "shh";

export const BPM = 142;
const S = Math.sin, TAU = Math.PI * 2;
const pulse = (x: number) => Math.max(0, S(x)) ** 2; // 0..1 bumps, half the time at rest
const tri = (x: number) => 1 - Math.abs(((x % 2) + 2) % 2 - 1); // 0..1..0 over 2

/** The resting body every pose builds on: breathing, weight shifting from foot to foot, a little look-around. */
function base(t: number, energy = 1): Bones {
  const shift = S(t * 1.3) * energy;
  return {
    hips: [0, 0.08 * S(t * 0.6) * energy, 0.035 * shift],
    spine: [0.025 * S(t * 2.1), 0, -0.03 * shift],
    chest: [0.02 * S(t * 2.1), 0.05 * S(t * 0.6 + 1) * energy, -0.02 * shift],
    neck: [0, 0.12 * S(t * 0.45) * energy, 0],
    head: [0.04 * S(t * 0.9), 0.1 * S(t * 0.33 + 2) * energy, 0.06 * S(t * 0.8) + 0.04 * shift],
    leftUpperArm: [0.05 * S(t * 1.3), 0, 1.22 - 0.04 * S(t * 2.1)], leftLowerArm: [0, -0.15 - 0.05 * S(t * 1.3), 0.1],
    rightUpperArm: [0.05 * S(t * 1.3 + 1), 0, -1.22 + 0.04 * S(t * 2.1)], rightLowerArm: [0, 0.15 + 0.05 * S(t * 1.3 + 1), -0.1],
    leftUpperLeg: [0, 0, 0.03 * Math.max(0, -shift)], rightUpperLeg: [0, 0, -0.03 * Math.max(0, shift)],
  };
}

/** Step in place: lift one foot then the other (`phase` in turns). */
function step(phase: number, lift = 0.35): Bones {
  const l = pulse(phase * TAU), r = pulse(phase * TAU + Math.PI);
  return {
    leftUpperLeg: [lift * l, 0, 0.04], leftLowerLeg: [-lift * 2 * l, 0, 0], leftFoot: [lift * l, 0, 0],
    rightUpperLeg: [lift * r, 0, -0.04], rightLowerLeg: [-lift * 2 * r, 0, 0], rightFoot: [lift * r, 0, 0],
  };
}

export const POSES: Record<Act, (t: number, b: number) => Pose> = {
  // Looks around, and every few seconds stretches or tilts her head with a little hop of the heels.
  idle: (t) => {
    const g = Math.floor(t / 5) % 3, k = pulse(((t % 5) / 5) * Math.PI); // one gesture per 5 s window
    const bones = { ...base(t, 1.3), ...step(t * 0.45, 0.12) };
    if (g === 1) Object.assign(bones, { leftUpperArm: [0, 0, 1.22 - 2.2 * k], rightUpperArm: [0, 0, -1.22 + 2.2 * k], spine: [0.12 * k, 0, 0], head: [0.25 * k, 0, 0] }); // stretch
    if (g === 2) Object.assign(bones, { head: [0, 0.25 * k, 0.25 * k], rightUpperArm: [0.4 * k, 0, -1.22 + 0.2 * k], rightLowerArm: [0, 0.15 + 1.6 * k, 0] }); // "hm?"
    return { bones, face: { happy: g === 1 ? 0.6 * k : 0.15, relaxed: g === 1 ? 0.4 * k : 0 } };
  },

  // Big wave with the whole body, bouncing on her toes.
  hello: (t, b) => ({
    bones: {
      ...base(t, 1.4), ...step(t * 1.1, 0.15),
      rightUpperArm: [0.1, 0, 0.45 + 0.12 * S(t * 6)], rightLowerArm: [0, 0, 1.0 + 0.55 * S(t * 11)], rightHand: [0, 0, 0.3 * S(t * 11)],
      leftUpperArm: [0.25, 0, 1.0], leftLowerArm: [0, -0.9, 0],
      spine: [0, 0, 0.1 * S(t * 3)], head: [0, -0.1, -0.12 + 0.06 * S(t * 3)],
    },
    hipsY: 0.02 * pulse(Math.PI * b),
    face: { happy: 0.9 },
  }),

  // Turns all the way round, arms floating out like a twirl.
  spin: (t) => ({
    bones: {
      ...base(t), ...step(t * 0.9, 0.2), hips: [0, t * 1.2, 0.05 * S(t * 2.4)],
      leftUpperArm: [0, 0, 0.6 + 0.15 * S(t * 2.4)], leftLowerArm: [0, 0, 0.3], rightUpperArm: [0, 0, -0.6 - 0.15 * S(t * 2.4)], rightLowerArm: [0, 0, -0.3],
      head: [-0.05, 0, 0.1 * S(t * 1.2)],
    },
    face: { happy: 0.6 },
  }),

  // Four moves, one per bar: pump, clap, wave overhead, point and sway. Steps on every beat.
  dance: (t, b) => {
    const beat = TAU * b, beats = (t * BPM) / 60, move = Math.floor(beats / 4) % 4, on = pulse(beat / 2 + Math.PI / 2);
    const bones: Bones = {
      ...step(beats / 2, 0.3),
      hips: [0, 0.25 * S((beats * Math.PI) / 4), 0.08 * S(beat / 2)],
      spine: [-0.06 * on, 0, -0.1 * S(beat / 2)], chest: [0, -0.18 * S((beats * Math.PI) / 4), 0.05 * S(beat / 2)],
      neck: [-0.1 * on, 0, 0], head: [-0.06 * on, 0, 0.14 * S(beat / 2)],
    };
    if (move === 0) Object.assign(bones, { // pump
      leftUpperArm: [0.3, 0, 0.2 + 0.8 * tri(beats)], leftLowerArm: [0, -1.4, 0], rightUpperArm: [0.3, 0, -0.2 - 0.8 * tri(beats + 1)], rightLowerArm: [0, 1.4, 0] });
    if (move === 1) Object.assign(bones, { // clap in front
      leftUpperArm: [0.7, -0.5 * on, 1.0], leftLowerArm: [0, -1.2 - 0.3 * on, 0], rightUpperArm: [0.7, 0.5 * on, -1.0], rightLowerArm: [0, 1.2 + 0.3 * on, 0] });
    if (move === 2) Object.assign(bones, { // both arms waving overhead
      leftUpperArm: [0, 0, -0.9 + 0.35 * S(beat / 2)], leftLowerArm: [0, 0, -0.3], rightUpperArm: [0, 0, 0.9 + 0.35 * S(beat / 2)], rightLowerArm: [0, 0, 0.3] });
    if (move === 3) Object.assign(bones, { // point up and to the side, swap every two beats
      ...(Math.floor(beats / 2) % 2
        ? { rightUpperArm: [0, 0, 0.5] as Rot, rightLowerArm: [0, 0, 0.2] as Rot, leftUpperArm: [0.2, 0, 1.1] as Rot, leftLowerArm: [0, -1.4, 0] as Rot }
        : { leftUpperArm: [0, 0, -0.5] as Rot, leftLowerArm: [0, 0, -0.2] as Rot, rightUpperArm: [0.2, 0, -1.1] as Rot, rightLowerArm: [0, 1.4, 0] as Rot }) });
    return { bones, hipsY: -0.04 * on, hipsX: 0.04 * S((beats * Math.PI) / 2), face: { happy: 0.5 + 0.4 * on } };
  },

  // Shows off the prop: lifts it, sways, glances at it.
  hold: (t) => ({
    bones: {
      ...base(t, 1.2), ...step(t * 0.6, 0.12),
      rightUpperArm: [0.4 + 0.08 * S(t * 1.6), 0, -1.1 + 0.15 * S(t * 0.8)], rightLowerArm: [0, 1.4 + 0.15 * S(t * 1.6), 0],
      leftUpperArm: [0.1, 0, 1.15], leftLowerArm: [0, -0.4, 0],
      head: [-0.05, -0.2 * pulse(t * 0.7), -0.08 + 0.05 * S(t * 1.6)],
    },
    face: { happy: 0.6 },
  }),

  // Talks with her hands: alternating open-palm gestures and nods.
  talk: (t) => {
    const g = S(t * 2.2), nod = pulse(t * 4.4);
    return {
      bones: {
        ...base(t, 1.1),
        leftUpperArm: [0.35 + 0.15 * Math.max(0, g), -0.2 * Math.max(0, g), 1.1], leftLowerArm: [0, -1.1 - 0.4 * Math.max(0, g), 0],
        rightUpperArm: [0.35 + 0.15 * Math.max(0, -g), 0.2 * Math.max(0, -g), -1.1], rightLowerArm: [0, 1.1 + 0.4 * Math.max(0, -g), 0],
        head: [-0.1 * nod, 0.12 * S(t * 0.7), 0.08 * S(t * 1.1)],
      },
      face: { happy: 0.35 + 0.2 * S(t * 0.9) },
    };
  },

  // Points at the page (her right is the page side), bounces the finger, glances between it and you.
  notice: (t) => {
    const look = tri(t * 0.4);
    return {
      bones: {
        ...base(t), ...step(t * 0.8, 0.15),
        hips: [0, -0.25, 0], chest: [0, -0.1, 0], head: [0, -0.35 * look, 0.06],
        rightUpperArm: [0.2, 0.45, -0.3 + 0.12 * pulse(t * 7)], rightLowerArm: [0, 0.2, 0],
        leftUpperArm: [0.3, 0, 1.0], leftLowerArm: [0, -1.5, 0],
      },
      face: { Surprised: 0.35 + 0.2 * pulse(t * 2), happy: 0.4 },
    };
  },

  // Listens, swaying, hands together.
  voice: (t) => ({
    bones: {
      ...base(t, 1.3), ...step(t * 0.5, 0.1),
      leftUpperArm: [0.5, 0, 1.1], leftLowerArm: [0, -1.5, 0], rightUpperArm: [0.5, 0, -1.1], rightLowerArm: [0, 1.5, 0],
      head: [0, 0, 0.15 * S(t * 1.5)], spine: [0, 0, 0.06 * S(t * 1.5)],
    },
    face: { relaxed: 0.5 },
  }),

  // Nods off, sinks, then jerks awake every few seconds.
  sleepy: (t) => {
    const c = t % 6, drop = c < 5 ? Math.min(1, c / 4) : 0, jolt = c >= 5 && c < 5.4 ? 1 : 0;
    return {
      bones: {
        ...base(t, 0.4),
        spine: [-0.08 * drop, 0, 0], neck: [-0.15 * drop, 0, 0], head: [-0.3 * drop + 0.1 * jolt, 0, 0.18 * drop],
        leftUpperArm: [0.1, 0, 1.3], rightUpperArm: [0.4 * jolt, 0, -1.3 + 0.6 * jolt], rightLowerArm: [0, 1.6 * jolt, 0],
      },
      hipsY: -0.01 * drop,
      face: { blink: jolt ? 0 : 0.35 + 0.6 * drop, relaxed: 0.5, Surprised: jolt },
    };
  },

  // Hand on chin, tapping, tilting her head; every 4 s an "aha!" with a raised finger.
  think: (t) => {
    const aha = pulse(((t % 4) / 4) ** 6 * Math.PI);
    return {
      bones: {
        ...base(t, 0.8), ...step(t * 0.5, 0.08),
        rightUpperArm: [0.5 - 0.3 * aha, 0.2, -1.2 + 1.3 * aha], rightLowerArm: [0, 2.3 - 1.0 * aha + 0.1 * S(t * 9), 0],
        leftUpperArm: [0.45, 0, 1.2], leftLowerArm: [0, -1.7, 0],
        head: [0.1, 0.15 * S(t * 0.6), 0.18 - 0.2 * aha + 0.03 * S(t * 2)],
      },
      hipsY: 0.02 * aha,
      face: { lookup: 0.6 * (1 - aha), Surprised: 0.6 * aha, happy: 0.5 * aha },
    };
  },

  // Jumps with both arms up.
  cheer: (t, b) => {
    const up = pulse(Math.PI * b);
    return {
      bones: {
        ...base(t, 0.6), ...step(t, 0.2),
        leftUpperArm: [0, 0, -0.5 - 0.3 * up], leftLowerArm: [0, 0, -0.3], rightUpperArm: [0, 0, 0.5 + 0.3 * up], rightLowerArm: [0, 0, 0.3],
        head: [0.12, 0, 0.1 * S(t * 4)], spine: [0.06 * up, 0, 0],
      },
      hipsY: 0.05 * up,
      face: { happy: 1 },
    };
  },

  // Finger to lips, a wink, leaning in.
  shh: (t) => ({
    bones: {
      ...base(t, 0.9), ...step(t * 0.4, 0.08),
      rightUpperArm: [0.55, 0.45, -1.15], rightLowerArm: [0, 2.5, 0], spine: [-0.08 - 0.03 * S(t * 1.5), 0, 0],
      head: [-0.05, 0.1 * S(t * 0.7), -0.1 + 0.05 * S(t * 1.5)], leftUpperArm: [0.15, 0, 1.2],
    },
    face: { blink_r: 1, relaxed: 0.6 },
  }),
};

export const JUMP_SECONDS = 1.0;
export const JUMP_HEIGHT = 0.22;

/** The click reaction on top of any pose: crouch, leap with arms up, land with a squash. u: 0..1 over the jump.
 * Legs stay straight in the air (no tuck, no spin): anything that lifts the knees or whirls the body flips the skirt. */
export function jump(u: number): { bones: Bones; lift: number } {
  const clamp = (x: number) => Math.min(1, Math.max(0, x));
  const crouch = u < 0.2 ? S((u / 0.2) * (Math.PI / 2)) : u < 0.6 ? 0 : u < 0.8 ? S(((u - 0.6) / 0.2) * Math.PI) * 0.7 : 0;
  const a = clamp((u - 0.2) / 0.4), air = u >= 0.2 && u < 0.6 ? 1 : 0;
  const lift = air * 4 * a * (1 - a);
  const up = u < 0.2 ? 0 : u < 0.6 ? Math.min(1, a * 3) : Math.max(0, 1 - (u - 0.6) * 4);
  const wave = air * S(a * Math.PI * 4); // little kicks of the hands at the top
  return {
    lift,
    bones: {
      hips: [0, 0, 0],
      spine: [-0.22 * crouch + 0.1 * up, 0, 0], chest: [0.06 * up, 0, 0], head: [-0.15 * crouch + 0.22 * up, 0, 0.08 * wave],
      leftUpperLeg: [0.45 * crouch, 0, 0.05], leftLowerLeg: [-0.9 * crouch, 0, 0], leftFoot: [0.45 * crouch - 0.35 * air, 0, 0],
      rightUpperLeg: [0.45 * crouch, 0, -0.05], rightLowerLeg: [-0.9 * crouch, 0, 0], rightFoot: [0.45 * crouch - 0.35 * air, 0, 0],
      leftUpperArm: [-0.5 * crouch, 0, 1.2 * (1 - up) - 0.75 * up], leftLowerArm: [0, 0, -0.3 * up - 0.3 * wave],
      rightUpperArm: [-0.5 * crouch, 0, -1.2 * (1 - up) + 0.75 * up], rightLowerArm: [0, 0, 0.3 * up + 0.3 * wave],
    },
  };
}
