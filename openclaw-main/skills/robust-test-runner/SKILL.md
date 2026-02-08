---
name: robust-test-runner
description: "Prevents common Test Runner execution errors (undefined properties, lost context) by enforcing strict coding patterns. Use when: (1) Implementing injectTestRunner() function in generated code, (2) Getting 'Cannot read properties of undefined' errors in test sandbox, (3) Test runner context is lost after destructuring runner object, (4) DOM elements are not found due to async rendering, (5) Need defensive programming patterns for sandbox environment."
description_zh: 防止測試執行器常見錯誤（如缺少屬性、Context 丟失），強制使用嚴格的編碼模式。
---

# Robust Test Runner Implementation

When implementing the `injectTestRunner(runner)` function, you must adhere to the following strict guidelines to prevent runtime errors like `Cannot read properties of undefined` (reading 'assert'/'click').

## 1. 🚫 NO DESTRUCTURING (禁止解構)
**NEVER** destructure methods from the `runner` object. The methods rely on internal `this` context (e.g., `click` calls `this.log`). Destructuring breaks this binding.

### ❌ WRONG (Will Crash)
```javascript
function injectTestRunner(runner) {
    // 💥 DANGER: Context Lost here!
    const { assert, click, type } = runner; 
    
    runner.defineTests([{
        id: 'fail',
        name: 'Bad Pattern',
        steps: async () => {
            await click('#btn'); // 💥 Crash: Cannot read property 'log' of undefined
            assert(true);        // 💥 Crash
        }
    }]);
}
```

### ✅ CORRECT (Always use runner.*)
```javascript
function injectTestRunner(runner) {
    runner.defineTests([{
        id: 'pass',
        name: 'Good Pattern',
        steps: async () => {
            // ✅ Preserves 'this' Context
            await runner.click('#btn'); 
            runner.assert(true, 'Verify true');        
        }
    }]);
}
```

## 2. 🛡️ Defensive DOM Access (防禦性 DOM 操作)
The sandbox environment implies async rendering. Elements might not be ready immediately.

### ❌ WRONG
```javascript
// 💥 Crash if element is missing
document.getElementById('score').textContent = '100'; 
```

### ✅ CORRECT
```javascript
const el = document.getElementById('score');
if (el) {
    el.textContent = '100';
} else {
    // Optional: Log warning if critical
    console.warn('Score element missing');
}
```

## 3. ⏳ Explicit Waits (等待機制)
Always use `runner.waitFor(selector)` before interacting with critical elements that might render dynamically.

```javascript
/* Inside steps */
async () => {
    // Wait for button to appear (handles dynamic rendering)
    await runner.waitFor('#submit-btn');
    await runner.click('#submit-btn');
}
```
