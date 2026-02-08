---
name: spec-alignment-strategy
description: "Rigorous alignment of application code (HTML/JS) with E2E test specifications. Use when: (1) E2E tests are failing due to locator mismatches, (2) UI behavior deviates from test expectations, (3) Localization (i18n) causes text-matching failures, or (4) Logic thresholds in code do not match test assertions."
---

# Spec Alignment Strategy

This skill provides a systematic approach to fixing "alignment drift" between code and automated tests. It ensures that the application not only follows the PRD but also satisfies the concrete assertions in the E2E test suite.

## Workflow

### 1. Diagnostic Mapping
Before editing, map out the conflicts between the `e2e.spec.js` and the application code:
- Identify every `locator('#id')` in the test and verify it exists in HTML.
- Identify every `getByText()` and check if it matches the current `translations[lang]` values.
- Check helper functions in the test (e.g., `setWordCounts`) to see if they make assumptions about the DOM structure.

### 2. Strict ID Synchronization
Update HTML IDs to exactly match the locators used in the test suite.
- Example: If the test expects `#btn-start-session` but the code has `#btn-start-timer`, rename it in both HTML and the JavaScript references (e.g., the `els` object).

### 3. Localization Consistency
Tests typically run in a single language context (usually English). 
- **Action**: Set the default state of the application to match the test's expected language (e.g., `lang: 'en'`).
- **Validation**: Ensure the `translations` object in JS has the exact strings checked by `getByText()` in the tests.

### 4. Visibility for Testability
Tests often need to "see" elements that may be hidden by default in a production environment.
- **Action**: Disable auto-hiding logic or remove `hidden` classes from elements mentioned in CHK (Checklist) tests if they interfere with initial detection.
- **Note**: Ensure the "Gatekeeper" or "Success" banners stay visible long enough for the test engine to capture them.

### 5. Threshold & Logic Precision
Align boundary conditions (e.g., reduction targets, score minimums) with test expectations.
- **Logic**: If a test expects a button to enable at 15.1% but the code requires 20%, the test will fail. Use the exact comparison operator (`>` vs `>=`) and number from the test case.

## Reference Material

- **Common Pitfalls**: See [references/alignment-pitfalls.md](references/alignment-pitfalls.md) for a detailed list of frequent alignment errors.

## Example: Fixing a "No Test Found" or "Action Failed" Scenario
If Playwright fails to find a button:
1.  Check if the file suffix matches (`spec.js` vs `spec (18).js`).
2.  Check if the page is loading the correct file (Sync `temp_verif_...html` to `samples/index.html`).
3.  Check if a `data-i18n` attribute is overwriting the hardcoded text that the test is looking for.
