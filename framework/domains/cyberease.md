# Domain Profile: CyberEase

## Profile Link

```yaml
extends: web-vanilla-static
catalog_version: 1.0.0
```

> **How it works:** The Builder loads the base profile from `catalog/[extends].md` and applies the local sections below on top. Base sections not overridden here remain active. To check if your base is outdated, compare `catalog_version` against the current profile.

---

## Local Pitfalls

### Pitfall L1: Hash state drifts from the visible curve
- **What goes wrong:** The UI shows one curve, but the permalink hash still points to an older value, so reload/share reproduces the wrong state.
- **Correct approach:** Update the hash during every successful state render and parse it on load and on external hash changes.
- **Detection:** `grep -R "replaceState\|location.hash\|hashchange" cyberease/src`

### Pitfall L2: CSS animation shorthand clobbers timing function on replay restart
- **What goes wrong:** Using `node.style.animation = "none"` to restart an animation triggers the CSS animation shorthand, which resets **all** animation sub-longhands — including `animation-timing-function`. Any timing function previously applied via JavaScript (inline or through a CSS variable) is silently wiped out. After `node.style.animation = ""` restores the animation, all nodes run with the same default timing, making multi-curve comparison show identical motion regardless of the active curve.
- **Correct approach:** Use the `animation-name` longhand to restart: `node.style.animationName = "none"` / force reflow / `node.style.animationName = ""`. This only touches the name, leaving `animation-timing-function` intact. Declare timing functions in CSS via per-selector rules using CSS custom properties (`animation-timing-function: var(--curve-current)`) rather than setting them as inline styles.
- **Detection:** `grep -R "style.animation =" cyberease/src`

## Local Adversary Questions

- What happens if someone opens the page with a malformed cubic-bezier hash?

## Local Overrides

### Verification Commands (overrides)

**GATE 2 (Feature):**
- Command: `npm run build && npm test`
- Expected output: The deployable bundle is rebuilt and the math or state tests still pass after feature changes

## Local Decision History

| Date | Decision | Context | Constraint |
|------|----------|---------|------------|
| 2026-03-21 | Keep Cybercore CSS as a pinned external stylesheet | The user asked for Cybercore aesthetics, not a framework migration | MUST use the visual language through a version-pinned CDN asset plus local overrides, not a build-time framework |