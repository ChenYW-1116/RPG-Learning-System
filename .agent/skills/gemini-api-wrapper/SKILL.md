---
name: gemini-api-wrapper
description: 封裝 Google Gemini API 調用邏輯，包含指數退避重試機制和 JSON/文本響應解析。使用場景：(1) 需要在 JavaScript 中程式化調用 Gemini API，(2) 需要自動重試機制處理網絡錯誤或限流，(3) 構建 AI 功能模組需要統一的 API 調用層，(4) 需要同時支持 JSON 和純文本響應格式。
---

# Gemini API Wrapper Skill

## Skill Name
`gemini-api-wrapper`

## Mounting Mode
**[Reference]** - 此功能邏輯較重，封裝為獨立 Class/Module

## Target Slot
`@slot:api_service_layer`

## Purpose
封裝與 Google Gemini API 的所有交互邏輯，提供統一的調用接口，內建重試機制和錯誤處理。

## Interface Contract

### Input Parameters
```javascript
{
  prompt: string,           // 用戶提示詞
  systemPrompt: string,     // 系統指令
  apiKey: string,           // Gemini API Key
  useJson?: boolean,        // 是否返回 JSON 格式 (default: true)
  model?: string,           // 模型名稱 (default: "gemini-2.5-flash-preview-09-2025")
  retryDelays?: number[]    // 重試延遲毫秒數組 (default: [1000, 2000, 4000])
}
```

### Output (Promise)
```javascript
// 成功時返回
{
  success: true,
  data: any  // JSON object 或 raw text，取決於 useJson 參數
}

// 失敗時返回
{
  success: false,
  error: string
}
```

## Implementation Reference

### Module Definition (`gemini-api-wrapper.js`)
```javascript
/**
 * Gemini API Wrapper with Exponential Backoff Retry
 * @module GeminiAPIWrapper
 */
class GeminiAPIWrapper {
  constructor(config = {}) {
    this.apiKey = config.apiKey || "";
    this.model = config.model || "gemini-2.5-flash-preview-09-2025";
    this.retryDelays = config.retryDelays || [1000, 2000, 4000];
    this.baseUrl = "https://generativelanguage.googleapis.com/v1beta/models";
  }

  /**
   * 調用 Gemini API
   * @param {string} prompt - 用戶提示詞
   * @param {string} systemPrompt - 系統指令
   * @param {boolean} useJson - 是否返回 JSON 格式
   * @returns {Promise<any>} 解析後的響應
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
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        const text = data.candidates[0].content.parts[0].text;
        return useJson ? JSON.parse(text) : text;
        
      } catch (e) {
        if (delay === 0) throw e;
        await new Promise(r => setTimeout(r, delay));
      }
    }
  }

  /**
   * 設置 API Key
   * @param {string} key - 新的 API Key
   */
  setApiKey(key) {
    this.apiKey = key;
  }
}

// Export for ES Module
export { GeminiAPIWrapper };

// Export for CommonJS / Browser global
if (typeof window !== 'undefined') {
  window.GeminiAPIWrapper = GeminiAPIWrapper;
}
```

### Glue Code

<!-- ⚠️ @GLUE:REQUIRED -->
```javascript
// @slot:api_service_layer
// 方式一：ES Module 引入
import { GeminiAPIWrapper } from './skills/gemini-api-wrapper.js';

// 方式二：在 HTML 中直接內聯（適用於單文件架構）
// 將上述 class 定義複製到 <script> 標籤內

// 初始化實例
const geminiApi = new GeminiAPIWrapper({
  apiKey: "YOUR_API_KEY",
  model: "gemini-2.5-flash-preview-09-2025"
});

// 使用示例 - 範文分析
async function analyzeEssay(text) {
  const sys = `You are an IELTS expert. Analyze the essay. 
    Return JSON: { 
      passive_sentences: [], 
      advanced_verbs: [{word:'', meaning:''}], 
      passive_ratio: 0.2, 
      score_estimate: '7.5' 
    }`;
  
  try {
    const result = await geminiApi.call(`Analyze: ${text}`, sys, true);
    return { success: true, data: result };
  } catch (e) {
    return { success: false, error: e.message };
  }
}
```
<!-- ⚠️ END @GLUE:REQUIRED -->

## Dependencies
- Browser `fetch` API 或 Node.js `node-fetch`
- 無第三方依賴

## Error Handling
- 自動重試最多 3 次（可配置）
- 捕獲網絡錯誤和 API 錯誤
- 返回結構化錯誤信息

## Usage Scenarios
1. **範文分析** - 分析被動句、高級詞彙
2. **AI 改寫** - 將文章改寫為 Band 9 水準
3. **靈感助手** - 生成議題正反觀點
4. **表現診斷** - 評估盲寫表現
