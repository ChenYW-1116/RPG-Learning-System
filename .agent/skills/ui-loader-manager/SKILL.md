---
name: ui-loader-manager
description: 統一的 UI 加載狀態管理器，處理按鈕禁用和加載動畫顯示。使用場景：(1) 需要在異步操作期間禁用按鈕防止重複點擊，(2) 需要顯示 spinner 加載動畫提供視覺反饋，(3) 需要統一管理多個按鈕的加載狀態，(4) 構建前端應用的 UI 交互層時需要標準化的加載狀態處理。
---

# UI Loader Manager Skill

## Skill Name
`ui-loader-manager`

## Mounting Mode
**[Snippet]** - 輕量級工具函數，直接嵌入使用

## Target Slot
`@slot:ui_utilities`

## Purpose
提供統一的加載狀態管理，包括按鈕禁用、加載動畫顯示/隱藏，確保 UI 一致性。

## Interface Contract

### Input Parameters
```javascript
{
  type: string,    // 加載器類型標識 (e.g., 'analyze', 'rewrite', 'inspire')
  show: boolean    // 是否顯示加載狀態
}
```

### Side Effects
- 切換 `{type}Loader` 元素的 `hidden` class
- 切換 `{type}Btn` 元素的 `disabled` 屬性

## Implementation Reference

### Glue Code

<!-- ⚠️ @GLUE:REQUIRED -->
```javascript
// @slot:ui_utilities

/**
 * 切換加載狀態
 * @param {string} type - 加載器類型 (對應 ID 前綴)
 * @param {boolean} show - 是否顯示加載狀態
 */
function toggleLoader(type, show) {
  const loader = document.getElementById(`${type}Loader`);
  // 注意：按鈕 ID 可能與前綴略有不同（如 aiRewriteBtn），需根據實際 ID 調整
  const btn = document.getElementById(`${type}Btn`) || document.getElementById(`ai${type.charAt(0).toUpperCase() + type.slice(1)}Btn`);
  
  if (loader) {
    loader.classList.toggle('hidden', !show);
  }
  
  if (btn) {
    btn.disabled = show;
  }
}
```
<!-- ⚠️ END @GLUE:REQUIRED -->

### CSS Requirements
```css
/* 加載動畫 */
.loader {
  border-top-color: var(--primary, #2563eb);
  animation: spinner 1.5s linear infinite;
}

@keyframes spinner {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
```

### HTML Pattern
```html
<!-- 標準按鈕模板 -->
<button id="analyzeBtn" class="flex items-center gap-2 ...">
  <span>分析範文</span>
  <div id="analyzeLoader" class="hidden loader w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
</button>
```

## Usage Examples

### Basic Usage
```javascript
// 開始加載
toggleLoader('analyze', true);

// 執行異步操作
try {
  const result = await someAsyncOperation();
  // 處理結果
} finally {
  // 結束加載
  toggleLoader('analyze', false);
}
```

### With Async Wrapper
```javascript
async function withLoader(type, asyncFn) {
  toggleLoader(type, true);
  try {
    return await asyncFn();
  } finally {
    toggleLoader(type, false);
  }
}

// 使用
await withLoader('analyze', async () => {
  return await essayAnalyzer.analyze(text);
});
```

## Naming Convention
| Type | Loader ID | Button ID |
|------|-----------|-----------|
| analyze | `analyzeLoader` | `analyzeBtn` |
| rewrite | `rewriteLoader` | `aiRewriteBtn` |
| inspire | `inspireLoader` | `aiInspireBtn` |
| diagnosis | `diagnosisLoader` | N/A |

## Dependencies
- 無外部依賴
- 需要對應 CSS 動畫
