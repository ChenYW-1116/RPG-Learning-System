---
name: spec-kit-app-repair
description: Guided repair and optimization for Spec Kit generated web applications. Handles incomplete code generation, robust test runner injection, and comprehensive multi-language (i18n) support. Use when generated code is missing logic, has test runner context errors (undefined properties), or requires robust i18n.
---

# Spec Kit App Repair & Optimization

This skill provides a systematic approach to fixing and enhancing Spec Kit generated applications.

## 1. 🏗️ Repairing Incomplete Logic
If the generated code is truncated or missing the `<script>` section, follow these steps:
- **Analyze HTML Structure**: Scan all `id` and `data-i18n` attributes to infer the developer's intent.
- **Implement State Management**: Use a central `state` object and `els` (elements) map for cleaner logic.
- **Hook Event Listeners**: Ensure Buttons (start, submit, toggle) and Inputs (editor, mock bands) have listeners.

## 2. 🛡️ Robust Test Runner Implementation
To prevent common runtime errors like `Cannot read properties of undefined` in the test sandbox:
- **🚫 NO DESTRUCTURING**: Methods in the `runner` object rely on internal context. **Always** use `runner.method()` (e.g., `runner.click()`, `runner.assert()`).
- **🛡️ DEFENSIVE DOM**: Sandbox environments are asynchronous. Always check if an element exists before updating:
  ```javascript
  const el = document.getElementById('target');
  if (el) el.textContent = 'Success';
  ```
- **⏳ EXPLICIT WAITS**: Use `await runner.waitFor(selector)` before any interaction to ensure the DOM is ready.

## 3. 🌍 Comprehensive i18n
Use the **Translation Dictionary Pattern** for scalable multi-language support:
- **Dictionary Structure**:
  ```javascript
  const translations = {
      en: { title: 'Coach', ... },
      zh: { title: '教練', ... }
  };
  ```
- **Dynamic Update**: Use `document.querySelectorAll('[data-i18n]')` to update all elements in a single loop.
- **Attributes**: Remember to update `placeholder` for `INPUT` and `TEXTAREA` elements as well.

## 4. 💾 State Persistence
Use `localStorage` with a descriptive key (e.g., `IELTS_SESSIONS`) to track user progress (e.g., sessions in last 48h) and preserve the "Budget" logic between reloads.

## 5. 🌟 Reference Implementation (Golden Sample)

> **Full Source File**: [examples/reference-impl.html](examples/reference-impl.html)

Use this architectural pattern for **Application Class**, **State Management**, **i18n**, and **Test Runner Injection**.

```html
<!DOCTYPE html>
<html lang="zh-TW">
<head>
    <meta charset="UTF-8">
    <title data-i18n="app_title">IELTS Writing Coach</title>
    <!-- CSS (Tailwind + Custom) -->
    <script src="https://cdn.tailwindcss.com"></script>
    <style> /* ... critical styles ... */ </style>
</head>
<body class="min-h-screen">
    <nav>...</nav>

    <main>
        <!-- Section 1: Dashboard -->
        <section id="view-dashboard" class="view-section active">
             <!-- Elements utilizing Unique IDs -->
             <div id="stat-quota-badge"></div>
        </section>

        <!-- Section 2: Interactive Task -->
        <section id="view-rewrite" class="view-section">
            <textarea id="input-original" oninput="app.calculateReduction()"></textarea>
            <textarea id="input-rewritten" oninput="app.calculateReduction()"></textarea>
            <button id="btn-submit-rewrite" onclick="app.submitRewrite()" disabled>Submit</button>
        </section>
    </main>

    <!-- Modal Overlay -->
    <div id="settings-modal" class="hidden">...</div>

    <script>
        // --- 1. Internationalization Repository ---
        const translations = {
            zh: { app_title: "IELTS 寫作教練", ... },
            en: { app_title: "IELTS Writing Coach", ... }
        };

        // --- 2. Application Core Class ---
        class ConcisenessCoach {
            constructor() {
                this.state = this.loadState();
            }

            // Data Management
            loadState() {
                const defaults = {
                    settings: { lang: 'zh' },
                    history: { rewrites: [] }
                };
                const saved = localStorage.getItem('conciseness_coach_v1');
                return saved ? JSON.parse(saved) : defaults; // Simplified for brevity
            }

            saveState() {
                localStorage.setItem('conciseness_coach_v1', JSON.stringify(this.state));
                this.updateUI();
            }

            // UI Manipulation
            init() {
                this.applyTranslations();
                this.updateUI();
            }

            applyTranslations() {
                const lang = this.state.settings.lang;
                const dict = translations[lang];
                document.querySelectorAll('[data-i18n]').forEach(el => {
                    const key = el.getAttribute('data-i18n');
                    if (dict[key]) el.textContent = dict[key];
                });
            }

            updateUI() {
                // ... Logic to update DOM based on this.state ...
                const count = this.state.history.rewrites.length;
                const progressEl = document.getElementById('stat-quota-progress');
                if (progressEl) progressEl.style.width = `${(count / 5) * 100}%`;
            }

            // Task Logic
            calculateReduction() {
                // ... logic ...
                this.updateUI(); // or local update
            }
        }

        // --- 3. Interaction with SDD System (Test Runner) ---
        function injectTestRunner(runner) {
            runner.defineTests([
                {
                    id: 'TC-001',
                    name: 'E2E Happy Path',
                    steps: async () => {
                        await runner.log('Starting verification...');
                        await runner.click('#tab-rewrite');
                        await runner.type('#input-original', "Source text");
                        await runner.type('#input-rewritten', "Target");
                        await runner.waitFor(500);
                        
                        // Assertions
                        const val = await runner.getText('#reduction-percent');
                        runner.assert(parseFloat(val) > 0, "Reduction updated");
                    }
                }
            ]);
        }

        // --- 4. Boot ---
        document.addEventListener('DOMContentLoaded', () => {
            window.app = new ConcisenessCoach();
            window.app.init();
        });
    </script>
</body>
</html>
```

## 6. 🔍 Post-Repair and Skill Discovery

After applying these structural repairs, **you must perform a new skill discovery** to verify if other specialized skills are needed for the specific context. 

**Procedure:**
1.  **Review Available Skills**: Check `skills/` for relevant tools.
2.  **Chain Skills**: If the app has complex CSS issues, specific JS logic flaws, or requires alignment with a spec:
    -   Use `skills/spec-html-css-js-debug` for detailed CSS/JS debugging.
    -   Use `skills/spec-alignment-strategy` for aligning closely with requirements.
    -   Use `skills/precise-execution` for complex logic implementation.
3.  **Confirm**: Explicitly state which additional skills you are checking to ensure comprehensive code correctness.


