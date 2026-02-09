/**
 * Gemini API Wrapper Module
 * 
 * 封裝 Google Gemini API 調用邏輯，提供：
 * - 指數退避重試機制
 * - JSON/文本雙模式響應解析
 * - 統一錯誤處理
 * 
 * @module GeminiAPIWrapper
 * @version 1.0.0
 * @skill gemini-api-wrapper
 */

class GeminiAPIWrapper {
    /**
     * 創建 Gemini API Wrapper 實例
     * @param {Object} config - 配置對象
     * @param {string} config.apiKey - Gemini API Key
     * @param {string} [config.model="gemini-3-flash-preview"] - 模型名稱
     * @param {number[]} [config.retryDelays=[1000, 2000, 4000]] - 重試延遲毫秒數組
     */
    constructor(config = {}) {
        this.apiKey = config.apiKey || "";
        this.model = config.model || "gemini-3-flash-preview";
        this.retryDelays = config.retryDelays || [1000, 2000, 4000];
        this.baseUrl = "https://generativelanguage.googleapis.com/v1beta/models";
    }

    /**
     * 調用 Gemini API
     * @param {string} prompt - 用戶提示詞
     * @param {string} systemPrompt - 系統指令
     * @param {boolean} [useJson=true] - 是否返回 JSON 格式
     * @returns {Promise<any>} 解析後的響應（JSON 對象或原始文本）
     * @throws {Error} 當所有重試失敗後拋出錯誤
     */
    async call(prompt, systemPrompt, useJson = true) {
        const url = `${this.baseUrl}/${this.model}:generateContent?key=${this.apiKey}`;

        const payload = {
            contents: [{ parts: [{ text: prompt }] }],
            systemInstruction: { parts: [{ text: systemPrompt }] },
            generationConfig: useJson ? { responseMimeType: "application/json" } : {}
        };

        // 指數退避重試邏輯
        for (let delay of [...this.retryDelays, 0]) {
            try {
                const response = await fetch(url, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });

                if (!response.ok) {
                    const errorText = await response.text();
                    throw new Error(`HTTP ${response.status}: ${response.statusText} - ${errorText}`);
                }

                const data = await response.json();

                // 驗證響應結構
                if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
                    throw new Error("Invalid API response structure");
                }

                const text = data.candidates[0].content.parts[0].text;
                return useJson ? JSON.parse(text) : text;

            } catch (e) {
                console.warn(`API call failed, delay=${delay}ms, error:`, e.message);

                if (delay === 0) {
                    throw e;
                }

                await new Promise(r => setTimeout(r, delay));
            }
        }
    }

    /**
     * 更新 API Key
     * @param {string} key - 新的 API Key
     */
    setApiKey(key) {
        this.apiKey = key;
    }

    /**
     * 更新模型
     * @param {string} model - 新的模型名稱
     */
    setModel(model) {
        this.model = model;
    }

    /**
     * 檢查 API Key 是否已設置
     * @returns {boolean}
     */
    hasApiKey() {
        return this.apiKey && this.apiKey.trim().length > 0;
    }
}

// Export for ES Module
export { GeminiAPIWrapper };

// Export for CommonJS / Browser global
if (typeof window !== 'undefined') {
    window.GeminiAPIWrapper = GeminiAPIWrapper;
}
