# Design: CyberEase

**Intent:** docs/cyberease-intent.md
**Domain Profile:** framework/domains/cyberease.md
**Date:** 2026-03-21

## Domain Profile Selection Rationale

| Candidate Profile | Keyword Score | Excluded? | Reason |
|-------------------|---------------|-----------|--------|
| web-vanilla-static | 7 | No | Matches vanilla, html, css, javascript, static, frontend, browser |

**Selected Profile:** web-vanilla-static via [framework/domains/cyberease.md]
**Selection Basis:** Unique highest score >= 2 after no existing project-specific profile matched the stack.

## Architecture

### Stack

| Technology | Version | Verified Via | Purpose |
|-----------|---------|-------------|---------|
| Browser ES modules | Native | Platform API | App logic, rendering, and interaction |
| Cybercore CSS | 0.3.0 | `npm view cybercore-css version` | Base cyberpunk component and effects language |
| Google Fonts `Rajdhani`, `Exo 2`, `JetBrains Mono` | Web-hosted | Cybercore CSS docs | Display, body, and mono typography matching the design system |
| Node.js built-ins | Native | Project runtime | Static build copy, local dev server, and tests |

### Structure

- `cyberease/index.html` - semantic shell, graph SVG, controls, preview panels
- `cyberease/styles.css` - custom layout, token overrides, motion, responsive behavior
- `cyberease/src/bezier.js` - pure math, parsing, formatting, path generation, presets
- `cyberease/src/main.js` - DOM wiring, render cycle, pointer handling, copy action
- `cyberease/scripts/build.mjs` - static build into `dist/`
- `cyberease/scripts/dev.mjs` - local static server for manual inspection
- `cyberease/tests/bezier.test.mjs` - unit tests for pure bezier helpers

### Data Flow

1. URL hash or default preset creates the initial numeric curve state.
2. Pointer drags and numeric inputs both normalize into the same `curve` object.
3. A single render pass updates:
   - graph paths and handle positions
   - numeric fields and telemetry
   - copy string and hash permalink
   - preview lane timing functions and replay state
4. Pure helper functions provide all geometry, formatting, and sampling so the DOM layer remains thin.

### Initialization Chain

1. `index.html` loads fonts, Cybercore CSS, and local `styles.css`
2. The browser loads `src/main.js` as an ES module
3. `main.js` imports pure helpers from `src/bezier.js`
4. Initial state is parsed from `location.hash` or the target preset
5. Event listeners bind to SVG handles, form inputs, buttons, and `hashchange`
6. The first render updates graph, telemetry, hash, and preview lanes

### Dependencies

**Production:**
- none via npm; Cybercore CSS is loaded as a version-pinned CDN stylesheet

**Development:**
- none beyond Node.js built-ins

## Decisions

| # | Decision | Choice | Alternatives Considered | Rationale |
|---|----------|--------|------------------------|-----------|
| 1 | Visual system | Cybercore CSS plus custom override layer | Pure custom CSS only | Keeps the official palette, effects, and typography conventions visible while allowing a tailored layout |
| 2 | Graph rendering | Inline SVG with model-space mapping | Canvas, absolutely positioned HTML divs | SVG gives crisp lines, easy handle placement, and clear semantic geometry |
| 3 | Curve evaluation | Pure JS solver with Newton plus subdivision fallback | CSS-only preview without sampling, external easing library | Needed for telemetry, bars, path sampling, and tests without extra dependencies |
| 4 | Verification | Pure Node build and `node:test` suite | Playwright, jsdom-heavy UI tests | The core risk is math and state sync; those can be verified without adding runtime complexity |
| 5 | Reference curve state | `state.compareCurve` + `state.comparePresetId` (mutable, same render cycle) | Frozen constant, URL param | Allows interactive comparison without new URL or page state model; fits the existing single-state render pass |
| 6 | Keyboard handle movement | Arrow keys on focused SVG handle elements, step 0.01 / Shift×0.10 | Dedicated input fields for precise entry | Matches cubic-bezier.com's interaction model; gives precision without leaving the editor |
| 7 | Canvas click-to-teleport | `Math.hypot` distance to P1/P2, nearest handle snaps + drag continues | Only handle-hit-target dragging | Enlarges the effective drag target area; copied from the original site's UX |
| 8 | Hover crosshair | SVG `<line visibility>` + `solveBezierYAtX` per mousemove for live T→P readout | Static telemetry grid only | Gives an immediate, spatially-anchored readout at any time position; higher signal density than fixed 25/50/75% metrics |

## Risks (Adversary Lens)

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| Pointer drift on responsive resize | Users cannot position handles accurately | Medium | Convert pointer coordinates via `getBoundingClientRect()` into normalized graph coordinates |
| Motion overload reduces readability | Users miss core controls or feel visual fatigue | Medium | Constrain motion to a few high-impact surfaces and add reduced-motion fallbacks |
| Hash or form parsing accepts malformed values | Broken initial render or NaN state | Low | Sanitize all parsed values and fall back to the target preset |
| Clipboard API denied | Copy button appears broken | Medium | Provide a textarea-based fallback and status messaging |

## Adversary Questions Applied

| Question | Answer for This Design |
|----------|----------------------|
| What happens when the interaction surface is scaled down on mobile or enlarged by browser zoom? | Drag math is based on the SVG bounding rect and normalized into explicit graph coordinates, so responsive scaling does not change behavior. |
| What happens when the active pointer leaves the control surface mid-drag or the input device is touch instead of mouse? | Pointer events are bound on the SVG, active drags use pointer capture, and move math does not assume mouse-only properties. |
| What happens when the Clipboard API is unavailable, blocked, or denied? | The copy path falls back to a temporary textarea and still surfaces success or failure status in the UI. |
| What happens if JavaScript initializes after the first paint and the HTML must stand on its own for a moment? | The HTML ships with visible headings, cards, controls, and the target code string so the page still communicates its purpose before enhancement. |
| What happens if someone opens the page with a malformed cubic-bezier hash? | The parser validates four numeric values, clamps them, and falls back to the default target curve on failure. |
| What happens when the user presses arrow keys repeatedly at the domain boundary (x=0 or x=1)? | `sanitizeCurve` clamps all values on every render; the handle stops at the limit and no NaN or out-of-range state can propagate. |
| What happens if `solveBezierYAtX` is called with a progress close to 0 or 1 during the hover readout and returns an imprecise value? | The readout displays a rounded integer percentage; small floating-point errors are invisible at that display resolution. |

## Domain Pitfalls Applied

| Pitfall | Applies? | How Addressed |
|---------|----------|---------------|
| Pointer math tied to CSS pixels instead of the app's coordinate system | Yes | Pointer conversion is normalized from the rendered SVG box into a fixed curve domain before state updates |
| Decorative overlays block controls | Yes | All ambient layers use `pointer-events: none` and interactive layers sit above them |
| Motion-heavy UI ignores reduced motion | Yes | The stylesheet includes a `prefers-reduced-motion` branch that disables non-essential animations |
| Hash state drifts from the visible curve | Yes | The render pass updates the hash after every valid curve change and listens for `hashchange` on reload or shared links |
| CSS animation shorthand clobbers timing function on restart | Yes | Animation restart uses `animationName` longhand only; compare-node timing is declared in CSS via `var(--curve-compare)` |

## Verification

| Gate | Command | Pass Criteria |
|------|---------|---------------|
| 0 | `npm install` | Exit 0 and project metadata resolves cleanly |
| 1 | `npm run build` | Exit 0 and `dist/` contains the deployable app |
| 2 | `npm run build && npm test` | Exit 0 and state or math changes do not break verification |
| 3 | `npm test` | All unit tests pass |
| 4 | `node -e "import('node:fs/promises').then(async (fs) => { await fs.rm('node_modules', { recursive: true, force: true }); await fs.rm('dist', { recursive: true, force: true }); await fs.rm('package-lock.json', { force: true }); })" && npm install && npm run build && npm test` | Clean install and verification succeed |

## Test Strategy

- **What to test:** curve sanitization, hash parsing and formatting, easing sampling, and SVG path generation
- **How:** `node:test` with strict assertions against the pure helper module
- **Coverage target:** cover every exported math or parsing helper that feeds the UI
- **What NOT to test:** browser rendering details owned by Cybercore CSS or simple static markup text