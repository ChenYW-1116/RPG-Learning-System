---
name: Auto-Fix Styling
description: A robust method to fix styling issues caused by Shadow DOM encapsulation blocking Tailwind CSS, including ID conflict resolution.
---

# Auto-Fix Styling (Shadow DOM Removal)

## Context
這絕對不是我預期的結果。畫面看起來完全沒有樣式（Unstyled），這是一個技術架構上的衝突導致的。

## 問題原因
1. **Tailwind CSS (CDN)**：樣式表是在主頁面 (`<head>`) 中載入的。
2. **Shadow DOM**：代碼使用了 Web Components 的 Shadow DOM 技術 (`attachShadow`)。這是一種「封裝」技術，原本是為了保護組件樣式不被干擾，但它同時也擋住了外面的 Tailwind 樣式進入。

**結果**：所有的美觀樣式（顏色、排版、卡片效果）都被「擋」在外面，導致組件看起來像是 90 年代的純 HTML。

## 解決方案
**移除 Shadow DOM (Switch to Light DOM)**
為了讓應用程式恢復精美的「Premium Design」，需要修改組件，移除 Shadow DOM 的屏障，讓 Tailwind 的樣式能夠直接渲染在組件上。

這需要對代碼進行一些結構調整（特別是處理 `TaskCard` 中的 ID 重複問題，因為移除 Shadow DOM 後 ID 必須全域唯一）。

## 執行步驟

### Step 1: 修復 NavBar, CountdownTimer (單例組件)
這些組件只會出現一次，所以 ID 不會衝突，只需移除 Shadow DOM 即可。

**Action:**
- Remove `this.attachShadow({ mode: 'open' })`.
- Replace `this.shadowRoot.innerHTML` with `this.innerHTML`.
- Replace `this.shadowRoot.querySelector` with `this.querySelector`.

### Step 2: 修復 TaskCard (多例組件)
這是最棘手的部分。因為頁面有 5 個卡片，原本在 Shadow DOM 裡可以用相同的 `id="start-btn"`，現在必須改成 Class 或動態 ID，否則會衝突。

**Action:**
- Remove Shadow DOM (as above).
- **Refactor Static IDs**: Change `id="start-btn"` to `id="start-btn-${this.taskId}"`.
- **Refactor JS Selectors**: Update `this.querySelector('#start-btn')` to `this.querySelector(\`#start-btn-\${this.taskId}\`)`.

### Step 3: Update Test Runner
Ensure validation scripts (`injectTestRunner`) are updated to:
- Stop using `shadowRoot` helpers.
- Target the new Dynamic IDs (e.g., `#start-btn-task-1`).
