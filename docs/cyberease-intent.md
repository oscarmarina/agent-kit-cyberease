# Intent: CyberEase

**Date:** 2026-03-21
**Size:** Full
**Domain Profile:** [framework/domains/cyberease.md]
**Supersedes:** --

## Goal

Build a standalone vanilla HTML/CSS/JS recreation of the cubic-bezier.com editor for the specific target curve `cubic-bezier(.67,.66,1,.23)`, rendered as a high-contrast Cybercore control deck with strong motion and data-visualization cues.

## Behavior

- **Given** the page loads, **when** the app initializes, **then** the graph, code string, hash, and preview all start from `cubic-bezier(.67,.66,1,.23)`.
- **Given** a user drags either control point or edits the numeric fields, **when** the values change, **then** the curve geometry, telemetry, permalink hash, and animation preview update from the same source of truth.
- **Given** a user wants to reuse the easing, **when** they press copy, **then** the current `cubic-bezier(...)` string is copied or a fallback copy path is attempted and surfaced.
- **Given** a user wants to compare motion character, **when** the preview replays, **then** multiple preview lanes animate with the current easing against a visible baseline reference.
- **Given** a user has keyboard focus on a handle, **when** they press an arrow key, **then** the control point moves ±0.01 in curve space; holding Shift multiplies the step by 10.
- **Given** a user clicks anywhere on the curve graph canvas (not on a handle), **when** the click lands, **then** the nearest control point teleports to that position and drag continues from there.
- **Given** a user hovers over the curve graph, **when** the pointer moves, **then** a vertical crosshair tracks the pointer and a readout below the graph shows the current time percentage and the corresponding output value of the active curve.
- **Given** a user selects a reference preset from the compare selector, **when** the choice changes, **then** the reference curve in the graph, the compare preview lane, and the pill label all update immediately.

## Decisions

| Decision | Choice | Rejected | Why |
|----------|--------|----------|-----|
| Rendering stack | Vanilla HTML/CSS/JS with ES modules | Vite, React, Vue | User constraint: no frameworks; static site is sufficient |
| Cybercore integration | Version-pinned Cybercore CSS CDN plus local override stylesheet | Rebuilding the full framework locally, approximating the aesthetic from scratch | Faster delivery with direct alignment to the requested visual system |
| Verification approach | Node-only build and test scripts | Browser-only manual checks, bundler-specific tooling | Keeps the project static and verifiable without adding a framework or heavy toolchain |
| State sharing | Single numeric curve state for graph, inputs, preview, and hash | Separate UI-only state per panel | Prevents drift between the controls and the rendered output |

## Constraints

**MUST:**
- Use vanilla HTML, CSS, and JavaScript only
- Place all project files under `cyberease/`
- Reproduce the target curve editor behavior around `cubic-bezier(.67,.66,1,.23)`
- Follow the Cybercore CSS visual language for typography, palette, and effects

**MUST NOT:**
- Use frontend frameworks
- Move project code to the repository root
- Let decorative effects interfere with interaction or readability

**SHOULD:**
- Keep the app shareable through a URL hash
- Support pointer drag and direct numeric entry equally well
- Respect reduced-motion preferences

## Scope

**IN:**
- Interactive curve graph with draggable handles (pointer, keyboard arrow-keys, canvas click-to-teleport)
- Hover crosshair on the graph with live time→progress readout
- Numeric control fields and copy action
- Motion preview lanes with dual simultaneous comparison (current curve vs. selectable reference preset)
- Reference curve selector — any preset can be set as the comparison baseline
- Cybercore-inspired visual treatment using the official stylesheet and custom CSS
- Static build, dev server, and unit tests for curve logic

**OUT:**
- Full clone of cubic-bezier.com's library import or export workflows
- User accounts, persistence, or cloud sync
- Framework migration or component library packaging

## Acceptance

- `npm install && npm run build && npm test` passes from `cyberease/`
- The initial state matches `cubic-bezier(.67,.66,1,.23)` on load
- Dragging a handle updates the graph, preview, and displayed code string without desynchronization
- Arrow keys on a focused handle move the control point; Shift multiplies the step
- Clicking the canvas background teleports the nearest handle to that point
- Hovering the graph shows a crosshair and a time→output readout below
- Selecting a different reference preset updates the comparison lane and the graph's dashed reference path
- The interface remains usable on desktop and mobile widths