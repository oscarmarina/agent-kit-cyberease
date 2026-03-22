import test from "node:test";
import assert from "node:assert/strict";

import {
  TARGET_CURVE,
  buildCurvePath,
  formatCurve,
  parseCurveHash,
  sanitizeCurve,
  solveBezierYAtX,
  toCurveHash,
} from "../src/bezier.js";

test("sanitizeCurve clamps x and y into the supported domain", () => {
  const curve = sanitizeCurve({ x1: -1, y1: -9, x2: 4, y2: 12 });

  assert.deepEqual(curve, { x1: 0, y1: -0.5, x2: 1, y2: 1.5 });
});

test("hash serialization round-trips the target curve", () => {
  const hash = toCurveHash(TARGET_CURVE);
  const parsed = parseCurveHash(hash);

  assert.equal(hash, "#.67,.66,1,.23");
  assert.deepEqual(parsed, TARGET_CURVE);
});

test("formatCurve emits a stable CSS easing string", () => {
  assert.equal(formatCurve(TARGET_CURVE), "cubic-bezier(0.67, 0.66, 1, 0.23)");
});

test("linear control points evaluate to linear progress", () => {
  const linear = { x1: 0, y1: 0, x2: 1, y2: 1 };
  const midpoint = solveBezierYAtX(0.5, linear);

  assert.ok(Math.abs(midpoint - 0.5) < 0.0001);
});

test("buildCurvePath returns an SVG path command string", () => {
  const path = buildCurvePath(TARGET_CURVE);

  assert.match(path, /^M /);
  assert.ok(path.includes(" L "));
});