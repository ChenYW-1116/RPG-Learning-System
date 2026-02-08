---
name: spec-app-runtime-hardening
description: "Standard for hardening Single Page Applications (SPA) by implementing robust data simulation, protected async UI interactions (Loading Locks), and modern notification systems (Toasts). Use this to upgrade static prototypes into resilient, production-like experiences. Use when: (1) Building SPAs that need production-like resilience, (2) Preventing double-submit bugs on async buttons, (3) Adding loading states and spinners to async operations, (4) Replacing window.alert() with modern toast notifications, (5) Implementing explicit lifecycle management with init() pattern."
---

# Application Runtime Hardening Strategy

This skill transforms fragile, static HTML prototypes into robust, interactive applications. It mandates a separation of concerns between Data, UI, and Logic, specifically targeting "Double-Submit" bugs, "Frozen UI" states, and "Logic Dispersion".

## Core Pillars

### 1. Unified Data Layer (`DataService`)
**Problem:** Logic scattered across button handlers; operations complete instantly (unrealistic).
**Solution:** Encapsulate all backend logic (mocked or real) in a dedicated service with simulated latency.

*   **Requirement 1:** Must implement `latency` (default ~500-800ms) to test UI loading states.
*   **Requirement 2:** All "Backend" logic (scoring, heavy calculations, storage ops) belongs here.
*   **Pattern:**
    ```javascript
    class DataService {
        constructor() { this.latency = 800; }
        
        _delay() { return new Promise(r => setTimeout(r, this.latency)); }

        async getComplexData(input) {
            await this._delay(); // Creating realistic async gap
            if (!input) throw new Error("Validation Failed"); // Centralized Validation
            
            return { result: "calculated_value" };
        }
    }
    ```

### 2. UI Resilience Guard (`UIHandler`)
**Problem:** Users spam-click buttons; `alert()` blocks execution; errors are swallowed.
**Solution:** A dedicated handler for Toasts (Notifications) and Async Action Locking.

*   **Requirement 1 (Action Guard):** Never call an async function directly from `onclick`. Wrap it in a guard that disables the button, adds a spinner, and handles errors.
*   **Requirement 2 (Toast System):** Replace `window.alert` with a non-blocking DOM-based toast container.
*   **Pattern:**
    ```javascript
    class UIHandler {
        toast(msg, type='info') {
            // Implementation: Append to fixed container, animate in/out
        }

        async performAction(btnId, asyncFn) {
            const btn = document.getElementById(btnId);
            if(btn) {
                const originalText = btn.innerHTML;
                btn.disabled = true; // LOCK
                btn.innerHTML = `⏳ Processing...`; // FEEDBACK
            }
            
            try {
                await asyncFn(); // EXECUTE
            } catch (e) {
                this.toast(e.message, 'error'); // ERROR HANDLING
            } finally {
                if(btn) {
                    btn.disabled = false; // UNLOCK
                    btn.innerHTML = originalText;
                }
            }
        }
    }
    ```

### 3. Explicit Lifecycle Management
**Problem:** Code runs immediately on load, causing "Element not found" errors or race conditions with Test Runners.
**Solution:** Strict `init()` pattern wrapped in `DOMContentLoaded`.

*   **Pattern:**
    ```javascript
    class App {
        constructor() {
            this.data = new DataService();
            this.ui = new UIHandler(this);
        }
        init() {
            this.router.resolve(); // Routing
            this.updateUI();       // Initial Paint
        }
    }

    document.addEventListener('DOMContentLoaded', () => {
        const app = new App();
        window.app = app; // Expose for E2E Testing
        app.init();       // Explicit Start
    });
    ```

## Implementation Checklist

1.  [ ] **Create `DataService`**: Move all `Math.random` mocks and calculations out of the main App class.
2.  [ ] **Create `UIHandler`**: Implement the `performAction` guard and Toast container.
3.  [ ] **Refactor Handlers**: Change all `onclick` logic from:
    *   `async () => { await doStuff(); }`
    *   **To**: `() => this.ui.performAction('btn-id', async () => { await this.data.doStuff(); })`
4.  [ ] **Lifecycle**: Ensure no logic runs until `app.init()` is called inside `DOMContentLoaded`.

## Anti-Patterns (Do NOT do this)

*   ❌ **No `alert()`**: Do not use blocking alerts for errors.
*   ❌ **No Direct Fetch**: UI Components should not fetch data directly; call `this.data.method()`.
*   ❌ **No Logic in HTML**: Avoid complex inline JS in `onclick="..."`. Delegate to App methods.
