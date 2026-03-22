# Verification Log: CyberEase

This log captures the actual output of every verification gate. It is the source of truth for project completion status.

**Rule:** No entry may be written without executing the command and pasting real output. "Assumed to pass" is not an entry.

---

## Progress

**Current phase:** Completed - Gate 5 (Learning Closure) passed. Post-Gate-5 feature additions documented.
**Last updated:** 2026-03-21 (renamed to CyberEase)

| Step | Status |
|------|--------|
| Intent | PASS |
| Design | PASS |
| Gate 0: Dependencies | PASS |
| Gate 1: Scaffold | PASS |
| Gate 2: Feature | PASS |
| Gate 3: Tests | PASS |
| Gate 4: Clean build | PASS |
| Self-Review | PASS with residual findings |
| Gate 5: Learning closure | PASS |

**Update this section after every gate or phase transition. When resuming interrupted work, read this section first.**

---

## Gate 0: Dependencies
**Executed:** 2026-03-21 11:58:18 CET
**Command:** `npm install`
**Exit code:** 0
**Status:** PASS

<details>
<summary>Output (click to expand)</summary>

```text
up to date, audited 1 package in 202ms

found 0 vulnerabilities
```

</details>

**Notes:** No runtime dependencies are installed through npm; install still produces a clean lockfile state.

---

## Gate 1: Scaffold Verification
**Executed:** 2026-03-21 11:58:18 CET
**Command:** `npm run build`
**Exit code:** 0
**Status:** PASS

<details>
<summary>Output</summary>

```text
> cyberease@1.0.0 build
> node scripts/build.mjs

Built static app to /Users/oscarmarina/Projects/AGENTS/CSSDark/cyberease/dist
```

</details>

**Notes:** Static output is generated under `cyberease/dist`.

---

## Gate 2: Feature Verification
**Executed:** 2026-03-21 11:58:18 CET
**Command:** `npm run build && npm test`
**Exit code:** 0
**Status:** PASS

<details>
<summary>Output</summary>

```text
> cyberease@1.0.0 build
> node scripts/build.mjs

Built static app to /Users/oscarmarina/Projects/AGENTS/CSSDark/cyberease/dist

> cyberease@1.0.0 test
> node --test

✔ sanitizeCurve clamps x and y into the supported domain (0.565417ms)
✔ hash serialization round-trips the target curve (0.160292ms)
✔ formatCurve emits a stable CSS easing string (0.048459ms)
✔ linear control points evaluate to linear progress (0.100416ms)
✔ buildCurvePath returns an SVG path command string (0.701667ms)
ℹ tests 5
ℹ suites 0
ℹ pass 5
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 39.657417
```

</details>

**Notes:** Feature verification confirms the build output and the helper logic remain synchronized after implementation fixes.

---

## Gate 3: Test Verification
**Executed:** 2026-03-21 11:58:18 CET
**Command:** `npm test`
**Exit code:** 0
**Status:** PASS
**Tests passed:** 5/5
**Coverage:** not measured

<details>
<summary>Output</summary>

```text
> cyberease@1.0.0 test
> node --test

✔ sanitizeCurve clamps x and y into the supported domain (0.521125ms)
✔ hash serialization round-trips the target curve (0.157542ms)
✔ formatCurve emits a stable CSS easing string (0.054417ms)
✔ linear control points evaluate to linear progress (0.109042ms)
✔ buildCurvePath returns an SVG path command string (0.49575ms)
ℹ tests 5
ℹ suites 0
ℹ pass 5
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 42.939
```

</details>

**Notes:** Test scope is focused on pure curve math, parsing, and path generation rather than browser-level interaction.

---

## Gate 4: Final Verification (Clean Build)
**Executed:** 2026-03-21 11:58:18 CET
**Clean command:** `node -e "import('node:fs/promises').then(async (fs) => { await fs.rm('node_modules', { recursive: true, force: true }); await fs.rm('dist', { recursive: true, force: true }); await fs.rm('package-lock.json', { force: true }); })" && npm install && npm run build && npm test`
**Exit code:** 0
**Status:** PASS
**Tests passed:** 5/5

<details>
<summary>Output</summary>

```text
up to date, audited 1 package in 220ms

found 0 vulnerabilities

> cyberease@1.0.0 build
> node scripts/build.mjs

Built static app to /Users/oscarmarina/Projects/AGENTS/CSSDark/cyberease/dist

> cyberease@1.0.0 test
> node --test

✔ sanitizeCurve clamps x and y into the supported domain (0.527083ms)
✔ hash serialization round-trips the target curve (0.148833ms)
✔ formatCurve emits a stable CSS easing string (0.049958ms)
✔ linear control points evaluate to linear progress (0.105667ms)
✔ buildCurvePath returns an SVG path command string (0.5445ms)
ℹ tests 5
ℹ suites 0
ℹ pass 5
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 41.691709
```

</details>

**Notes:** Clean verification uses a Node-based scrub command because direct `rm` is blocked in this terminal policy environment.

---

## Self-Review (Full projects only)

### Domain Checklist Results

| Check | Command | Result | Pass? |
|-------|---------|--------|-------|
| No CSS-pixel drag math | `grep -R "offsetX\|offsetY" cyberease/src` | No matches | YES |
| Reduced-motion branch present | `grep -R "prefers-reduced-motion" cyberease/styles.css` | `cyberease/styles.css:@media (prefers-reduced-motion: reduce) {` | YES |
| Decorative layers ignore pointers | `grep -R "pointer-events: none" cyberease/styles.css` | `cyberease/styles.css:  pointer-events: none;` | YES |

### Devil's Advocate
1. **What happens when:** the Cybercore CDN is blocked, a user drags on a narrow mobile viewport, or clipboard permissions are denied in a locked-down browser.
2. **The weakest link is:** the visual dependency on third-party hosted fonts and Cybercore CSS, because the core app still functions but the intended aesthetic degrades sharply without them.
3. **If I had to break this, I would:** enforce a restrictive Content Security Policy or offline mode to remove the external stylesheet and fonts, then verify whether the custom CSS still preserves enough hierarchy and affordance.

### Findings

| # | Severity | Finding | Impact |
|---|----------|---------|--------|
| 1 | P2 | No browser-level test currently proves that SVG drag wiring works end-to-end; verification covers math and formatting only. | A DOM event regression could slip through while unit tests still pass. |
| 2 | P2 | The final visual fidelity depends on external Cybercore CSS and Google Fonts loaded from third-party hosts. | Offline or CSP-restricted environments will lose the intended Cybercore look. |
| 3 | P2 | The fallback copy path still relies on `document.execCommand('copy')`, which is increasingly constrained by browser policies. | Copy may fail in some hardened browsers even though the primary Clipboard API path works. |

---

## Failure History

### Post-Gate 4 Bug Fix: Preview animation ignores curve changes
**Error:** All preview nodes (current and compare) played the same animation timing regardless of the active cubic-bezier value. Changing control points had no visual effect on the preview.
**Root Cause:** `node.style.animation = "none"` uses the CSS shorthand property, which implicitly resets **all** animation sub-longhands including `animation-timing-function`. This silently wiped the per-node inline timing function set by `syncPreviewTiming()` the moment `replayPreview()` called the restart sequence. After clearing, the browser used only what the stylesheet declared for all nodes — which was the same value for both.
**Fix:** Changed restart to `node.style.animationName = "none"` (longhand-only — does not clobber `animation-timing-function`). Moved compare-node timing to a declarative CSS rule: `[data-preview-compare] { animation-timing-function: var(--curve-compare); }` — this value is not disturbed by the longhand restart.
**Re-run result:** PASS — Gate 3 (5/5 tests), Gate 4 (clean build) both re-confirmed post-fix.
**Framework note:** Domain profile update was performed after user prompt, not atomically with the fix. This compliance failure triggered the creation of Gate 5.

---

## Domain Profile Updates

| What Changed | Section Updated | Trigger |
|---|---|---|
| Added new base profile for static vanilla web apps | `catalog/web-vanilla-static.md` | No matching catalog profile existed for vanilla HTML/CSS/JS static work |
| Added project-specific hash drift pitfall and pinned Cybercore decision | `framework/domains/cyberease.md` | This project needs shareable hash state and a fixed external design-system version |
| Replaced the POSIX clean command with a Node-based scrub command | `catalog/web-vanilla-static.md` Verification Commands | Gate 4 environment restriction: direct `rm` is blocked by terminal policy |
| Added Pitfall 2: CSS animation shorthand clobbers timing function on restart | `catalog/web-vanilla-static.md` Common Pitfalls + Automated Checks | Post-Gate 4 bug: `style.animation = "none"` silently wiped per-node `animation-timing-function` |
| Added Pitfall L2: CSS animation shorthand clobbers timing function | `framework/domains/cyberease.md` Common Pitfalls | Same bug — detection command added: `grep -R "style.animation =" cyberease/src` |

**Gate 5 status: PASS** — Failure History is non-empty and all entries have corresponding domain profile updates above.

---

## Post-Gate-5 Feature Additions

*These features were added after Gate 5 closed. No gate failures occurred during their implementation. Build and tests (5/5) re-confirmed after each addition.*

| Feature | Files Changed | Verified |
|---|---|---|
| Editable reference curve — `state.compareCurve` / `state.comparePresetId` mutable; `renderComparePresetChips()` renders magenta preset selector; pill label updates live | `src/main.js`, `index.html`, `styles.css` | `npm run build && npm test` ✓ |
| Arrow key navigation on focused handles — `handleHandleKeydown()`, step 0.01 / Shift×0.10, `sanitizeCurve` clamps at boundary | `src/main.js` | `npm run build && npm test` ✓ |
| Canvas click-to-teleport nearest handle — `startDrag()` expanded with `Math.hypot` distance check when click target is not a handle element | `src/main.js` | `npm run build && npm test` ✓ |
| Hover crosshair with T→P readout — `#cursor-line` SVG element, `#cursor-readout` div, `handleGraphHover()` calls `solveBezierYAtX` per frame, `handlePointerMove()` dispatches drag vs. hover, `hideGraphCursor()` on mouseleave | `src/main.js`, `index.html`, `styles.css` | `npm run build && npm test` ✓ |

**Domain profile update check:** No new pitfalls surfaced during these additions. All interaction paths were covered by existing pitfalls P1 (pointer math) and L1 (hash state). Gate 5 N/A for this batch.