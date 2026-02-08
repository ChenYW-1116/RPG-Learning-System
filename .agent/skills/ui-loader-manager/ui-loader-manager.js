/**
 * UI Loader Manager Snippet
 * 
 * 統一的 UI 加載狀態管理工具函數：
 * - 按鈕禁用/啟用
 * - 加載動畫顯示/隱藏
 * 
 * @module UILoaderManager
 * @version 1.0.0
 * @skill ui-loader-manager
 */

/**
 * 切換加載狀態
 * @param {string} type - 加載器類型 (對應 ID 前綴)
 * @param {boolean} show - 是否顯示加載狀態
 * 
 * @example
 * // 開始加載
 * toggleLoader('analyze', true);
 * 
 * // 結束加載
 * toggleLoader('analyze', false);
 */
function toggleLoader(type, show) {
    const loader = document.getElementById(`${type}Loader`);
    const btn = document.getElementById(`${type}Btn`);

    if (loader) {
        loader.classList.toggle('hidden', !show);
    }

    if (btn) {
        btn.disabled = show;
    }
}

/**
 * 帶加載狀態的異步操作包裝器
 * @param {string} type - 加載器類型
 * @param {Function} asyncFn - 異步函數
 * @returns {Promise<any>} 異步函數的返回值
 * 
 * @example
 * const result = await withLoader('analyze', async () => {
 *     return await essayAnalyzer.analyze(text);
 * });
 */
async function withLoader(type, asyncFn) {
    toggleLoader(type, true);
    try {
        return await asyncFn();
    } finally {
        toggleLoader(type, false);
    }
}

/**
 * 批量禁用/啟用多個按鈕
 * @param {string[]} types - 按鈕類型數組
 * @param {boolean} disabled - 是否禁用
 * 
 * @example
 * // 禁用所有 AI 功能按鈕
 * setButtonsDisabled(['analyze', 'rewrite', 'inspire'], true);
 */
function setButtonsDisabled(types, disabled) {
    types.forEach(type => {
        const btn = document.getElementById(`${type}Btn`);
        if (btn) {
            btn.disabled = disabled;
        }
    });
}

// CSS 樣式（需要添加到 <style> 標籤）
const LOADER_CSS = `
/* 加載動畫 */
.loader {
    border-top-color: var(--primary, #2563eb);
    animation: spinner 1.5s linear infinite;
}

@keyframes spinner {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
}
`;

// HTML 模板
const LOADER_HTML_TEMPLATE = `
<!-- 標準按鈕模板 -->
<button id="{type}Btn" class="flex items-center gap-2 ...">
    <span>{label}</span>
    <div id="{type}Loader" class="hidden loader w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
</button>
`;

// Export for ES Module
export { toggleLoader, withLoader, setButtonsDisabled, LOADER_CSS };

// Export for CommonJS / Browser global
if (typeof window !== 'undefined') {
    window.toggleLoader = toggleLoader;
    window.withLoader = withLoader;
    window.setButtonsDisabled = setButtonsDisabled;
}
