export const CURVE_DOMAIN = Object.freeze({
  xMin: 0,
  xMax: 1,
  yMin: -0.5,
  yMax: 1.5,
});

export const TARGET_CURVE = Object.freeze({ x1: 0.67, y1: 0.66, x2: 1, y2: 0.23 });

export const PRESETS = Object.freeze([
  {
    id: "target",
    label: "Night Shift",
    points: TARGET_CURVE,
  },
  {
    id: "linear",
    label: "Linear",
    points: Object.freeze({ x1: 0, y1: 0, x2: 1, y2: 1 }),
  },
  {
    id: "ease",
    label: "Ease",
    points: Object.freeze({ x1: 0.25, y1: 0.1, x2: 0.25, y2: 1 }),
  },
  {
    id: "ease-out",
    label: "Ease Out",
    points: Object.freeze({ x1: 0, y1: 0, x2: 0.58, y2: 1 }),
  },
  {
    id: "snap",
    label: "Hard Snap",
    points: Object.freeze({ x1: 0.8, y1: 0.02, x2: 1, y2: 0.98 }),
  },
  {
    id: "cold-start",
    label: "Cold Start",
    points: Object.freeze({ x1: 0.42, y1: 0, x2: 1, y2: 1 }),
  },
  {
    id: "pulse-fire",
    label: "Pulse Fire",
    points: Object.freeze({ x1: 0.19, y1: 1, x2: 0.22, y2: 1 }),
  },
  {
    id: "spring",
    label: "Spring",
    points: Object.freeze({ x1: 0.34, y1: 1.56, x2: 0.64, y2: 1 }),
  },
  {
    id: "kick-start",
    label: "Kick Start",
    points: Object.freeze({ x1: 0.36, y1: 0, x2: 0.66, y2: -0.56 }),
  },
  {
    id: "surge",
    label: "Surge",
    points: Object.freeze({ x1: 0.87, y1: 0, x2: 0.13, y2: 1 }),
  },
]);

const NEWTON_ITERATIONS = 8;
const NEWTON_EPSILON = 1e-7;
const SUBDIVISION_EPSILON = 1e-7;
const SUBDIVISION_MAX_ITERATIONS = 10;

export function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

export function sanitizeCurve(curve) {
  return {
    x1: clamp(Number(curve.x1), CURVE_DOMAIN.xMin, CURVE_DOMAIN.xMax),
    y1: clamp(Number(curve.y1), CURVE_DOMAIN.yMin, CURVE_DOMAIN.yMax),
    x2: clamp(Number(curve.x2), CURVE_DOMAIN.xMin, CURVE_DOMAIN.xMax),
    y2: clamp(Number(curve.y2), CURVE_DOMAIN.yMin, CURVE_DOMAIN.yMax),
  };
}

export function parseCurveHash(hash) {
  if (!hash || !hash.startsWith("#")) {
    return null;
  }

  const values = hash
    .slice(1)
    .split(",")
    .map((part) => Number(part));

  if (values.length !== 4 || values.some((value) => !Number.isFinite(value))) {
    return null;
  }

  return sanitizeCurve({
    x1: values[0],
    y1: values[1],
    x2: values[2],
    y2: values[3],
  });
}

export function formatCurveNumber(value) {
  const rounded = Number.parseFloat(Number(value).toFixed(2));
  return Number.isInteger(rounded) ? String(rounded) : rounded.toString();
}

export function formatCurve(curve) {
  return `cubic-bezier(${formatCurveNumber(curve.x1)}, ${formatCurveNumber(curve.y1)}, ${formatCurveNumber(curve.x2)}, ${formatCurveNumber(curve.y2)})`;
}

export function toCurveHash(curve) {
  return `#${[curve.x1, curve.y1, curve.x2, curve.y2]
    .map((value) => formatCurveNumber(value).replace(/^0\./, ".").replace(/^-0\./, "-."))
    .join(",")}`;
}

export function mapCurvePointToGraph(point, size = 100) {
  const x = clamp(point.x, CURVE_DOMAIN.xMin, CURVE_DOMAIN.xMax) * size;
  const yRatio = (clamp(point.y, CURVE_DOMAIN.yMin, CURVE_DOMAIN.yMax) - CURVE_DOMAIN.yMin) /
    (CURVE_DOMAIN.yMax - CURVE_DOMAIN.yMin);

  return {
    x,
    y: size - yRatio * size,
  };
}

export function mapGraphToCurve(clientX, clientY, rect) {
  const xRatio = clamp((clientX - rect.left) / rect.width, 0, 1);
  const yRatio = clamp(1 - (clientY - rect.top) / rect.height, 0, 1);

  return {
    x: xRatio,
    y: CURVE_DOMAIN.yMin + yRatio * (CURVE_DOMAIN.yMax - CURVE_DOMAIN.yMin),
  };
}

function cubicAt(t, a1, a2) {
  const inverse = 1 - t;
  return 3 * inverse * inverse * t * a1 + 3 * inverse * t * t * a2 + t * t * t;
}

function cubicDerivativeAt(t, a1, a2) {
  const inverse = 1 - t;
  return 3 * inverse * inverse * a1 + 6 * inverse * t * (a2 - a1) + 3 * t * t * (1 - a2);
}

function solveCurveTForX(x, curve) {
  let guess = x;

  for (let iteration = 0; iteration < NEWTON_ITERATIONS; iteration += 1) {
    const slope = cubicDerivativeAt(guess, curve.x1, curve.x2);

    if (Math.abs(slope) < NEWTON_EPSILON) {
      break;
    }

    const estimate = cubicAt(guess, curve.x1, curve.x2) - x;
    guess -= estimate / slope;
  }

  let start = 0;
  let end = 1;
  let current = guess;

  for (let iteration = 0; iteration < SUBDIVISION_MAX_ITERATIONS; iteration += 1) {
    const estimate = cubicAt(current, curve.x1, curve.x2) - x;

    if (Math.abs(estimate) <= SUBDIVISION_EPSILON) {
      return current;
    }

    if (estimate > 0) {
      end = current;
    } else {
      start = current;
    }

    current = (start + end) / 2;
  }

  return clamp(current, 0, 1);
}

export function solveBezierYAtX(progress, curve) {
  const x = clamp(progress, 0, 1);
  const t = solveCurveTForX(x, curve);
  return cubicAt(t, curve.y1, curve.y2);
}

export function sampleCurve(curve, count = 64) {
  return Array.from({ length: count + 1 }, (_, index) => {
    const t = index / count;
    return {
      t,
      x: cubicAt(t, curve.x1, curve.x2),
      y: cubicAt(t, curve.y1, curve.y2),
    };
  });
}

export function buildCurvePath(curve, size = 100) {
  const points = sampleCurve(curve, 56).map((point) => mapCurvePointToGraph(point, size));
  return points
    .map((point, index) => `${index === 0 ? "M" : "L"} ${point.x.toFixed(2)} ${point.y.toFixed(2)}`)
    .join(" ");
}

export function sampleEasing(curve, count = 12) {
  return Array.from({ length: count }, (_, index) => {
    const progress = (index + 1) / count;
    return solveBezierYAtX(progress, curve);
  });
}

export function computeTelemetry(curve) {
  const quarter = solveBezierYAtX(0.25, curve);
  const mid = solveBezierYAtX(0.5, curve);
  const threeQuarter = solveBezierYAtX(0.75, curve);

  return {
    quarter,
    mid,
    threeQuarter,
    bias: quarter - 0.25,
  };
}