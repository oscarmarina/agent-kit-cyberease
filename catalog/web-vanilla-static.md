# Domain Profile: Web Frontend - Vanilla HTML/CSS/JS Static App

**Domain:** Web Frontend
**Stack:** Vanilla HTML + CSS + JavaScript + static asset build scripts
**Standards:** WCAG 2.2 AA, responsive layout best practices, progressive enhancement

## Selection Metadata (Operational Contract)

**Profile ID:** web-vanilla-static
**Match Keywords:** vanilla, html, css, javascript, static, frontend, no framework, browser
**Use When:** Use this profile for browser-based interfaces built with plain HTML, CSS, and JavaScript without React, Vue, Angular, or other UI frameworks.
**Do Not Use When:** Do not use this profile when the project depends on a component framework, a server-rendered app framework, or a non-browser runtime.

## Terminology Mapping

| Framework Term | Domain Term | Notes |
|---|---|---|
| Build/Compile | Static asset copy build | Produces a deployable `dist/` directory |
| Test suite | Node test run | Prefer pure logic tests plus targeted browser-safe behavior |
| Dev server | Local static HTTP server | Serves the project root or `dist/` |
| Package/dependency | npm package or CDN asset | Pin versions when external assets are used |
| Import/module | ES module | Browser-native module loading |
| Deployment | Static hosting | Netlify, GitHub Pages, S3, nginx, etc. |

## Verification Commands

**GATE 0 (Dependencies):**
- Command: `npm install`
- Expected output: Exit 0 and a complete install from `package.json`

**GATE 1 (Scaffold):**
- Command: `npm run build`
- Expected output: Exit 0 and a populated `dist/` directory

**GATE 2 (Feature):**
- Command: `npm run build`
- Expected output: Exit 0 with no missing asset references or script errors introduced by the feature

**GATE 3 (Tests):**
- Command: `npm test`
- Expected output: All tests pass
- Coverage command: `node --test --experimental-test-coverage`

**GATE 4 (Final):**
- Clean command (POSIX): `node -e "import('node:fs/promises').then(async (fs) => { await fs.rm('node_modules', { recursive: true, force: true }); await fs.rm('dist', { recursive: true, force: true }); await fs.rm('package-lock.json', { force: true }); })" && npm install && npm run build && npm test`
- Clean command (PowerShell): `if (Test-Path node_modules) { Remove-Item node_modules -Recurse -Force }; if (Test-Path dist) { Remove-Item dist -Recurse -Force }; if (Test-Path package-lock.json) { Remove-Item package-lock.json -Force }; npm install; npm run build; npm test`
- Expected output: Install, build, and tests all pass from a clean state

## Common Pitfalls

### Pitfall 1: Pointer math tied to CSS pixels instead of the app's coordinate system
- **What goes wrong:** Dragging logic uses `offsetX`, `offsetY`, or raw client coordinates and drifts when the editor scales, the page scrolls, or zoom changes.
- **Correct approach:** Convert pointer coordinates from `getBoundingClientRect()` into explicit model-space values on every move.
- **Detection:** `grep -R "offsetX\\|offsetY" cyberease/src`

### Pitfall 2: CSS animation shorthand clobbers timing function on animation restart
- **What goes wrong:** Setting `element.style.animation = "none"` uses the CSS animation shorthand and silently resets all animation sub-longhands, including `animation-timing-function`. Any timing functions set via JS or CSS variables are lost. After clearing the shorthand with `element.style.animation = ""`, every node runs with the same default easing regardless of what was applied, making per-element timing impossible.
- **Correct approach:** Reset only the animation name: `element.style.animationName = "none"`, force reflow, then `element.style.animationName = ""`. Declare timing functions declaratively in CSS rules using CSS custom properties so they survive the restart.
- **Detection:** `grep -R "style.animation =" cyberease/src`

### Pitfall 3: Decorative overlays block controls
- **What goes wrong:** Noise, scanline, glow, or absolute-positioned chrome sits above the interactive layer and steals clicks or drag events.
- **Correct approach:** Put chrome on separate layers and set `pointer-events: none` on non-interactive overlays.
- **Detection:** `grep -R "pointer-events: none" cyberease/styles.css`

### Pitfall 3: Motion-heavy UI ignores reduced motion
- **What goes wrong:** Glitch, scanline, or preview animations keep running for users who request reduced motion, hurting accessibility and readability.
- **Correct approach:** Gate non-essential animation behind `prefers-reduced-motion` and provide a static fallback.
- **Detection:** `grep -R "prefers-reduced-motion" cyberease/styles.css`

## Adversary Questions

- What happens when the interaction surface is scaled down on mobile or enlarged by browser zoom?
- What happens when the active pointer leaves the control surface mid-drag or the input device is touch instead of mouse?
- What happens when the Clipboard API is unavailable, blocked, or denied?
- What happens if JavaScript initializes after the first paint and the HTML must stand on its own for a moment?

**These questions must be answered in the Design document's "Adversary Questions Applied" section — not just read. Checking pitfalls is necessary but not sufficient; adversary questions target how traps interact with a specific design.**

## Integration Rules

### Data Flow: DOM to State
- DOM events are translated into normalized numeric state before rendering.

### Data Flow: State to DOM
- State changes trigger a deterministic render pass that updates text, geometry, and preview animation parameters.

### Type Boundaries
- Parse form input strings into numbers at the boundary; keep the internal model numeric only.

### Build/Compile Scoping
- Build scripts copy only deployable assets into `dist/`; tests and development scripts stay outside the deploy output.

### Startup/Bootstrap Order
- HTML loads critical structure and CSS first.
- Browser loads ES modules after the DOM is available.
- JavaScript binds events, normalizes initial state, then performs the first render.

## Automated Checks

| Check | Command | Expected Result |
|-------|---------|-----------------|
| No CSS-pixel drag math | `grep -R "offsetX\\|offsetY" cyberease/src` | No matches |
| Reduced-motion branch present | `grep -R "prefers-reduced-motion" cyberease/styles.css` | At least one match |
| Decorative layers ignore pointers | `grep -R "pointer-events: none" cyberease/styles.css` | At least one match |

## Decision History

| Date | Decision | Context | Constraint |
|------|----------|---------|------------|
| 2026-03-21 | Favor testable pure modules | Static apps often hide logic inside DOM code and become untestable | MUST keep math and parsing helpers in pure ESM modules whenever the interaction model is non-trivial |
| 2026-03-21 | Pin external visual assets | CDN drift changes rendering unexpectedly | MUST pin CDN versions when external CSS is part of the shipped interface |

## Review Checklist

- [ ] Drag and input paths update the same source of truth
- [ ] Interactive controls remain usable on narrow screens and touch pointers
- [ ] Decorative motion can be reduced without breaking hierarchy or readability

## Constraints and Standards

- Must remain deployable as a static site
- Must use semantic HTML for controls and readable text hierarchy
- Must not require a framework runtime in the browser
- Should keep the first paint meaningful before JavaScript enhances the page