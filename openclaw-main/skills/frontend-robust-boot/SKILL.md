---
name: frontend-robust-boot
description: A specialized skill for fixing "silent failures" in frontend applications, specifically addressing visibility/interaction issues where the UI appears static or unresponsive despite correct-looking HTML/JS.
use-when: Use this when a frontend app (HTML/JS) is "not working", "only showing static content", or when buttons have no reaction. Especially relevant for single-file HTML apps using class-based logic and Inline Event Handlers (onclick).
---

# Frontend Robust Boot & Lifecycle Skill

This skill ensures that frontend applications transition correctly from "static code" to "interactive application" without silent crashes during the boot phase.

## Phase 1: Global Scope Audit (The "Unresponsive Button" Fix)

In many single-file HTML apps, AI-generated code defines logic inside a `<script type="module">` or a local block, but references it in HTML via `onclick="app.func()"`. This fails because `app` is not in the global `window` scope.

- **Check**: Are there `onclick`, `oninput`, or `onchange` attributes in the HTML?
- **Fix**: Ensure the main instance is explicitly attached to `window`.
  ```javascript
  // Bad: Local scope only
  const app = new MyApp(); 

  // Good: Explicitly global for HTML handlers
  window.app = new MyApp();
  ```

## Phase 2: Lifecycle & DOM Readiness

Accessing DOM elements before the browser has finished parsing the HTML is the #1 cause of "static-only" behavior.

- **Check**: Is the script accessing `document.getElementById` directly at the top level?
- **Fix**: Wrap the entry point in `DOMContentLoaded`.
- **Rule**: Separate `constructor` (data setup) from `init` (DOM binding).
  ```javascript
  document.addEventListener('DOMContentLoaded', () => {
      window.app = new App();
      window.app.init(); // Bind to DOM only after it's ready
  });
  ```

## Phase 3: Context Binding (The "this" Loss)

Passing class methods as event listeners directly causes `this` to be `undefined`.

- **Check**: Are methods passed like `addEventListener('click', app.init)`?
- **Fix**: Use arrow functions to preserve context.
  ```javascript
  // Bad: this inside init will be undefined/window
  window.addEventListener('load', app.init); 

  // Good: this remains the app instance
  window.addEventListener('load', () => app.init());
  ```

## Phase 4: Defensive DOM Access (Bulletproofing)

If a single `getElementById` returns `null` and the code tries to access `.value`, the entire script crashes silently.

- **Check**: Are DOM interactions guarded?
- **Fix**: Implement "Existence Guards" for every element access.
  ```javascript
  // Bad: Crashes if element is missing
  document.getElementById('timer').textContent = "00:00";

  // Good: Safe and robust
  const timerEl = document.getElementById('timer');
  if (timerEl) timerEl.textContent = "00:00";
  ```

## Phase 5: Error Isolation

The "Boot Phase" should never crash the engine.

- **Check**: Is the `init()` method wrapped in a try-catch?
- **Fix**: Wrap the initialization sequence to catch and log errors without stopping the script.
  ```javascript
  init() {
      try {
          this.setupUI();
          this.bindEvents();
      } catch (e) {
          console.error("App Boot Failed:", e);
      }
  }
  ```

## Phase 6: State Parsing Safety

Loading data from `localStorage` often crashes due to malformed JSON or schema changes.

- **Check**: Is `JSON.parse` guarded?
- **Fix**: Always use try-catch and deep-merge defaults.
  ```javascript
  loadState() {
      const saved = localStorage.getItem('my_key');
      try {
          const parsed = JSON.parse(saved);
          return { ...defaults, ...parsed }; // Ensure defaults aren't lost
      } catch (e) {
          return defaults;
      }
  }
  ```
