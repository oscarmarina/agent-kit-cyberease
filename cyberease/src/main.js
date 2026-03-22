import {
  PRESETS,
  TARGET_CURVE,
  buildCurvePath,
  computeTelemetry,
  formatCurve,
  formatCurveNumber,
  mapCurvePointToGraph,
  mapGraphToCurve,
  parseCurveHash,
  sampleEasing,
  sanitizeCurve,
  solveBezierYAtX,
  toCurveHash,
} from "./bezier.js";

const state = {
  curve: parseCurveHash(window.location.hash) ?? { ...TARGET_CURVE },
  activeHandle: null,
  pointerId: null,
  presetId: "target",
  compareCurve: { ...(PRESETS.find((p) => p.id === "ease")?.points ?? TARGET_CURVE) },
  comparePresetId: "ease",
};

const graph = document.querySelector("#curve-graph");
const curvePath = document.querySelector("#curve-path");
const comparePath = document.querySelector("#compare-path");
const handleOne = document.querySelector("#handle-1");
const handleTwo = document.querySelector("#handle-2");
const guideOne = document.querySelector("#handle-line-1");
const guideTwo = document.querySelector("#handle-line-2");
const copyButton = document.querySelector("#copy-button");
const rerunButton = document.querySelector("#rerun-button");
const curveString = document.querySelector("#curve-string");
const hashString = document.querySelector("#hash-string");
const statusText = document.querySelector("#status-text");
const presetRow = document.querySelector("#preset-row");
const comparePresetRow = document.querySelector("#compare-preset-row");
const comparePillLabel = document.querySelector("#compare-pill-label");
const sampleBars = document.querySelector("#sample-bars");
const cursorLine = document.querySelector("#cursor-line");
const cursorReadout = document.querySelector("#cursor-readout");
const previewNodes = Array.from(document.querySelectorAll("[data-preview-node]"));
const comparePreviewNodes = Array.from(document.querySelectorAll("[data-preview-compare]"));

const inputs = {
  x1: document.querySelector("#input-x1"),
  y1: document.querySelector("#input-y1"),
  x2: document.querySelector("#input-x2"),
  y2: document.querySelector("#input-y2"),
};

const metrics = {
  quarter: document.querySelector("#metric-quarter"),
  mid: document.querySelector("#metric-mid"),
  threeQuarter: document.querySelector("#metric-three-quarter"),
  bias: document.querySelector("#metric-bias"),
};

function syncPreviewTiming() {
  const curve = formatCurve(state.curve);
  const referenceCurve = formatCurve(state.compareCurve);
  document.documentElement.style.setProperty("--curve-current", curve);
  document.documentElement.style.setProperty("--curve-compare", referenceCurve);

  [...previewNodes, ...comparePreviewNodes].forEach((node) => {
    if (node.classList.contains("preview-node--slide")) {
      const track = node.closest(".preview-track");
      const travel = Math.max(0, track.clientWidth - node.clientWidth - 24);
      node.style.setProperty("--preview-travel", `${travel}px`);
    }
  });
}

function setStatus(message, tone = "cyan") {
  statusText.textContent = message;
  statusText.className = `status-text cyber-text-${tone}`;
}

function identifyPreset(curve) {
  const match = PRESETS.find((preset) =>
    ["x1", "y1", "x2", "y2"].every((key) => Math.abs(preset.points[key] - curve[key]) < 0.001)
  );

  return match?.id ?? null;
}

function updateHistoryHash(hash) {
  if (window.location.hash !== hash) {
    window.history.replaceState(null, "", hash);
  }
}

function renderPresetChips() {
  presetRow.innerHTML = "";

  PRESETS.forEach((preset) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `preset-chip${preset.id === state.presetId ? " is-active" : ""}`;
    button.textContent = preset.label;
    button.addEventListener("click", () => {
      state.curve = sanitizeCurve(preset.points);
      state.presetId = preset.id;
      render(true);
      setStatus(`Loaded preset: ${preset.label}.`, "green");
    });
    presetRow.append(button);
  });
}

function renderComparePresetChips() {
  comparePresetRow.innerHTML = "";
  const activeLabel = PRESETS.find((p) => p.id === state.comparePresetId)?.label ?? "Custom";
  comparePillLabel.textContent = activeLabel;

  PRESETS.forEach((preset) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `compare-chip${preset.id === state.comparePresetId ? " is-active" : ""}`;
    button.textContent = preset.label;
    button.addEventListener("click", () => {
      state.compareCurve = sanitizeCurve(preset.points);
      state.comparePresetId = preset.id;
      render(true);
      setStatus(`Reference set to: ${preset.label}.`, "yellow");
    });
    comparePresetRow.append(button);
  });
}

function renderGraph() {
  curvePath.setAttribute("d", buildCurvePath(state.curve));
  comparePath.setAttribute("d", buildCurvePath(state.compareCurve));

  const start = mapCurvePointToGraph({ x: 0, y: 0 });
  const end = mapCurvePointToGraph({ x: 1, y: 1 });
  const controlOne = mapCurvePointToGraph({ x: state.curve.x1, y: state.curve.y1 });
  const controlTwo = mapCurvePointToGraph({ x: state.curve.x2, y: state.curve.y2 });

  handleOne.setAttribute("transform", `translate(${controlOne.x.toFixed(2)} ${controlOne.y.toFixed(2)})`);
  handleTwo.setAttribute("transform", `translate(${controlTwo.x.toFixed(2)} ${controlTwo.y.toFixed(2)})`);

  guideOne.setAttribute("x1", start.x.toFixed(2));
  guideOne.setAttribute("y1", start.y.toFixed(2));
  guideOne.setAttribute("x2", controlOne.x.toFixed(2));
  guideOne.setAttribute("y2", controlOne.y.toFixed(2));
  guideTwo.setAttribute("x1", end.x.toFixed(2));
  guideTwo.setAttribute("y1", end.y.toFixed(2));
  guideTwo.setAttribute("x2", controlTwo.x.toFixed(2));
  guideTwo.setAttribute("y2", controlTwo.y.toFixed(2));
}

function renderInputs() {
  Object.entries(inputs).forEach(([key, input]) => {
    input.value = formatCurveNumber(state.curve[key]);
  });
}

function renderTelemetry() {
  const telemetry = computeTelemetry(state.curve);
  metrics.quarter.textContent = telemetry.quarter.toFixed(2);
  metrics.mid.textContent = telemetry.mid.toFixed(2);
  metrics.threeQuarter.textContent = telemetry.threeQuarter.toFixed(2);
  metrics.bias.textContent = telemetry.bias.toFixed(2);

  sampleBars.innerHTML = "";
  sampleEasing(state.curve).forEach((value) => {
    const bar = document.createElement("div");
    bar.className = "sample-bars__bar";
    bar.style.height = `${Math.max(14, value * 100)}%`;
    sampleBars.append(bar);
  });
}

function replayPreview() {
  syncPreviewTiming();

  [...previewNodes, ...comparePreviewNodes].forEach((node) => {
    node.style.animationName = "none";
    node.offsetHeight; // force reflow to reset animation
    node.style.animationName = "";
  });
}

function render(replay = false) {
  state.curve = sanitizeCurve(state.curve);
  state.presetId = identifyPreset(state.curve) ?? state.presetId;

  const curve = formatCurve(state.curve);
  const hash = toCurveHash(state.curve);

  curveString.textContent = curve;
  hashString.textContent = hash;
  updateHistoryHash(hash);

  renderGraph();
  renderInputs();
  renderPresetChips();
  renderComparePresetChips();
  renderTelemetry();
  syncPreviewTiming();

  if (replay) {
    replayPreview();
  }
}

function updateCurveKey(key, rawValue) {
  const nextValue = Number(rawValue);
  if (!Number.isFinite(nextValue)) {
    return;
  }

  state.curve = sanitizeCurve({
    ...state.curve,
    [key]: nextValue,
  });
  state.presetId = identifyPreset(state.curve) ?? state.presetId;
  render(true);
}

function handleHandleKeydown(event) {
  const handle = event.target.closest("[data-handle]");
  if (!handle) {
    return;
  }

  const STEP = event.shiftKey ? 0.1 : 0.01;
  let dx = 0;
  let dy = 0;

  switch (event.key) {
    case "ArrowLeft":  dx = -STEP; break;
    case "ArrowRight": dx = +STEP; break;
    case "ArrowUp":    dy = +STEP; break;
    case "ArrowDown":  dy = -STEP; break;
    default: return;
  }

  event.preventDefault();

  const i = Number(handle.dataset.handle);
  if (i === 0) {
    state.curve = sanitizeCurve({ ...state.curve, x1: state.curve.x1 + dx, y1: state.curve.y1 + dy });
  } else {
    state.curve = sanitizeCurve({ ...state.curve, x2: state.curve.x2 + dx, y2: state.curve.y2 + dy });
  }

  state.presetId = identifyPreset(state.curve) ?? state.presetId;
  render(false);
}

function handleDrag(event) {
  if (state.activeHandle === null) {
    return;
  }

  const rect = graph.getBoundingClientRect();
  const point = mapGraphToCurve(event.clientX, event.clientY, rect);

  if (state.activeHandle === 0) {
    state.curve = sanitizeCurve({ ...state.curve, x1: point.x, y1: point.y });
  } else {
    state.curve = sanitizeCurve({ ...state.curve, x2: point.x, y2: point.y });
  }

  state.presetId = identifyPreset(state.curve) ?? state.presetId;
  render(false);
}

function startDrag(event) {
  const handle = event.target.closest("[data-handle]");
  let handleIndex;

  if (handle) {
    handleIndex = Number(handle.dataset.handle);
  } else {
    const rect = graph.getBoundingClientRect();
    const point = mapGraphToCurve(event.clientX, event.clientY, rect);
    const d1 = Math.hypot(point.x - state.curve.x1, point.y - state.curve.y1);
    const d2 = Math.hypot(point.x - state.curve.x2, point.y - state.curve.y2);
    handleIndex = d1 <= d2 ? 0 : 1;
    if (handleIndex === 0) {
      state.curve = sanitizeCurve({ ...state.curve, x1: point.x, y1: point.y });
    } else {
      state.curve = sanitizeCurve({ ...state.curve, x2: point.x, y2: point.y });
    }
    state.presetId = identifyPreset(state.curve) ?? state.presetId;
    render(false);
  }

  event.preventDefault();
  state.activeHandle = handleIndex;
  state.pointerId = event.pointerId;
  graph.setPointerCapture(event.pointerId);
  setStatus(`Adjusting P${state.activeHandle + 1}.`, "cyan");
}

function stopDrag() {
  if (state.activeHandle === null) {
    return;
  }

  state.activeHandle = null;
  state.pointerId = null;
  hideGraphCursor();
  render(true);
  setStatus("Curve updated.", "green");
}

function handleGraphHover(event) {
  const rect = graph.getBoundingClientRect();
  const xRatio = Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width));
  const progress = Math.round(xRatio * 100);
  const output = Math.round(solveBezierYAtX(xRatio, state.curve) * 100);
  const svgX = (xRatio * 100).toFixed(1);

  cursorLine.setAttribute("x1", svgX);
  cursorLine.setAttribute("x2", svgX);
  cursorLine.setAttribute("visibility", "visible");
  cursorReadout.textContent = `T\u00a0${progress}%\u00a0\u2192\u00a0P\u00a0${output}%`;
}

function hideGraphCursor() {
  cursorLine.setAttribute("visibility", "hidden");
  cursorReadout.textContent = "\u00a0";
}

function handlePointerMove(event) {
  if (state.activeHandle !== null) {
    handleDrag(event);
  } else {
    handleGraphHover(event);
  }
}

async function copyCurveToClipboard() {
  const value = formatCurve(state.curve);

  try {
    await navigator.clipboard.writeText(value);
    setStatus("Curve copied to clipboard.", "green");
    return;
  } catch {
    const textarea = document.createElement("textarea");
    textarea.value = value;
    textarea.setAttribute("readonly", "readonly");
    textarea.style.position = "absolute";
    textarea.style.left = "-9999px";
    document.body.append(textarea);
    textarea.select();

    const copied = document.execCommand("copy");
    textarea.remove();

    setStatus(copied ? "Curve copied via fallback." : "Copy failed. Select the string manually.", copied ? "green" : "magenta");
  }
}

Object.entries(inputs).forEach(([key, input]) => {
  input.addEventListener("input", (event) => {
    updateCurveKey(key, event.currentTarget.value);
  });
});

graph.addEventListener("pointerdown", startDrag);
graph.addEventListener("pointermove", handlePointerMove);
graph.addEventListener("pointerup", stopDrag);
graph.addEventListener("pointercancel", stopDrag);
graph.addEventListener("lostpointercapture", stopDrag);
graph.addEventListener("keydown", handleHandleKeydown);
graph.addEventListener("mouseleave", hideGraphCursor);

copyButton.addEventListener("click", copyCurveToClipboard);
rerunButton.addEventListener("click", () => {
  replayPreview();
  setStatus("Preview replayed.", "yellow");
});

window.addEventListener("hashchange", () => {
  const curve = parseCurveHash(window.location.hash);
  if (!curve) {
    setStatus("Malformed hash ignored. Restored current signal.", "magenta");
    updateHistoryHash(toCurveHash(state.curve));
    return;
  }

  state.curve = curve;
  state.presetId = identifyPreset(state.curve) ?? state.presetId;
  render(true);
  setStatus("Signal loaded from hash.", "green");
});

window.addEventListener("resize", syncPreviewTiming);

render(true);