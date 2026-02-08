# Common Alignment Pitfalls for E2E Tests

When aligning code with automated E2E tests, pay attention to the following details that often cause failures:

## 1. Locator Mismatches (IDs and Data Attributes)
- **ID Drifting**: Ensure HTML IDs match the test's `page.locator('#id')` exactly.
- **Data Attributes**: Tests often use `data-testid` or `data-i18n`. Ensure these are preserved and correctly spelled.
- **Button Text**: If a test uses `getByText('Start')`, the button MUST have that exact text (case-sensitive) or the match will fail.

## 2. Internationalization (i18n) Logic
- **Default Language**: If tests expect English text, the application must default to English or the test must include a step to switch languages.
- **Dynamic Content**: If text is injected via JS (e.g., from `translations` object), ensure the keys in JS match the `data-i18n` attributes in HTML.
- **Trailing Whitespace**: `<h3>Title\n</h3>` might fail to match `getByText('Title')` in some environments. Keep tags tight: `<h3>Title</h3>`.

## 3. Element Visibility & State
- **Initial Hidden State**: If a test checks for the presence of an element upon page load, it must not be `hidden` or `display: none` unless the test intends to check for hidden state.
- **Persistence Logic**: If the page reloads, ensure the state (like language) persists via `localStorage`, otherwise the test might fail after a navigation step.
- **Dynamic Hiding**: Avoid logic that immediately re-hides elements after a user action (like a successful submission) if the test needs to assert their presence/text.

## 4. Business Rules & Thresholds
- **Threshold Matching**: If the spec says "at least 15%" and the test checks for `>15`, ensure the JS logic uses `> 0.15` and NOT `>= 0.15`.
- **Input Parsing**: Tests may provide complex inputs (e.g., comma-separated values). Ensure inputs are properly sanitized and split before processing.
