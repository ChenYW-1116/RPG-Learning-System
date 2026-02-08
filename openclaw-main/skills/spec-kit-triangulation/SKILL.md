---
name: spec-kit-triangulation
description: Advanced thinking framework for Spec-Driven Development (SDD). Used to detect content drift, triangulate implementation details from multiple sources (Spec, Plan, E2E), and ensure absolute adherence to complex requirements. Use when a project involves multiple contradictory or complex input files.
---

# Spec Kit Triangulation Framework

This skill documents the thinking process used to achieve high-fidelity alignment between specifications and generated code.

## 1. 🔍 Drift Detection (偏離偵測)
Content drift occurs when the AI uses a generic template (e.g., "Project Manager") instead of the specific domain (e.g., "IELTS Coach").
- **Signal**: If the `<h1>` or metadata doesn't match the `featureName` in the Spec, stop implementation.
- **Action**: Perform a "Hard Reset" on the UI layout and re-align with the Spec's core US (User Stories).

## 2. 📐 The Triangulation Method (三角定位法)
Never rely on a single file. Triangulate the "Truth" by cross-referencing three pillars:
- **Pillar A: The Spec (What)**: Defines the business value and features.
- **Pillar B: The E2E Spec (How)**: Defines the technical structure. If the E2E script searches for `#timer-display`, the HTML **must** have that exact ID.
- **Pillar C: The Constitution (Quality)**: Defines the aesthetic and robust requirements (Premium UI, defensive coding).

## 3. 🧩 Checklist-First Construction
Instead of building the UI then testing it, build the UI **around** the tests:
1.  Read the `e2e.spec.js` and extract every `locator` and `id`.
2.  Read the `checklist.md` and extract every `CHK` requirement.
3.  Map these IDs and requirements directly to HTML elements before writing any decorative CSS.

## 4. 🛡️ Constraint-Driven Implementation
Follow the "Golden Constraints" to ensure sandbox compatibility:
- **Test Integrity**: Always use the `injectTestRunner` pattern with **No Destructuring** (`runner.assert` vs `const {assert}`).
- **Zero-Build Reactivity**: Prefer **AlpineJS** or **Vanilla JS** over complex frameworks to ensure the app runs as a single, portable HTML file.
- **Persistent State**: Always use a shared `localStorage` namespace defined in the `plan.md`.

## 🧠 Mental Recursive Loop:
Ask yourself: *"If I run the automated E2E test right now, which line will fail first?"* Fix that line in your mind before writing the code.
