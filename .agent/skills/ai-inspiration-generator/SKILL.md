---
name: ai-inspiration-generator
description: AI 寫作靈感助手，根據議題生成正反觀點和主題詞彙。使用場景：(1) 用戶面對寫作題目不知從何下手，(2) 需要快速生成議論文的正反觀點，(3) 需要獲取與題目相關的學術詞彙，(4) 構建寫作教練應用的「靈感激發」或「破題助手」功能。
---

# AI Inspiration Generator Skill

## Skill Name
`ai-inspiration-generator`

## Mounting Mode
**[Reference]** - 封裝為獨立業務邏輯函數

## Target Slot
`@slot:feature_inspiration`

## Purpose
根據用戶輸入的雅思作文題目，使用 AI 生成正面觀點、反面觀點和學術詞彙，為寫作提供靈感。

## Interface Contract

### Input Parameters
```javascript
{
  topic: string,              // 作文題目
  geminiApi: GeminiAPIWrapper  // Gemini API 實例
}
```

### Output (Promise)
```javascript
{
  pros: string[],              // 正面觀點列表 (3 個)
  cons: string[],              // 反面觀點列表 (3 個)
  vocab: Array<{
    word: string,
    usage: string
  }>                           // 主題詞彙 (5 個)
}
```

## Implementation Reference

### Module Definition
```javascript
/**
 * AI 寫作靈感生成器
 * 依賴：GeminiAPIWrapper
 */
class AIInspirationGenerator {
  constructor(geminiApi) {
    this.api = geminiApi;
  }

  /**
   * 生成議題靈感
   * @param {string} topic - 作文題目
   * @returns {Promise<Object>} 靈感內容
   */
  async generate(topic) {
    if (!topic || topic.trim().length === 0) {
      throw new Error("Topic cannot be empty");
    }

    const systemPrompt = `Provide 3 pros, 3 cons, and 5 academic vocabulary for this IELTS topic. 
      Return JSON: { 
        pros: [], 
        cons: [], 
        vocab: [{word:'', usage:''}] 
      }`;

    const result = await this.api.call(`Topic: ${topic}`, systemPrompt, true);
    return result;
  }
}

export { AIInspirationGenerator };
```

### Glue Code

<!-- ⚠️ @GLUE:REQUIRED -->
```javascript
// @slot:feature_inspiration

const inspirationGenerator = new AIInspirationGenerator(geminiApi);

document.getElementById('aiInspireBtn').addEventListener('click', async () => {
  const topic = document.getElementById('aiTopicInput').value.trim();
  if (!topic) return;

  toggleLoader('inspire', true);
  try {
    const result = await inspirationGenerator.generate(topic);
    
    const resEl = document.getElementById('aiInspireResult');
    resEl.classList.remove('hidden');
    resEl.innerHTML = `
      <div class="bg-white p-6 rounded-2xl border-2 border-blue-100 shadow-sm grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h4 class="font-bold text-green-600 mb-2">正面觀點 (Pros)</h4>
          <ul class="text-sm list-disc pl-4 space-y-1">
            ${result.pros.map(p => `<li>${p}</li>`).join('')}
          </ul>
          <h4 class="font-bold text-red-600 mt-4 mb-2">反面觀點 (Cons)</h4>
          <ul class="text-sm list-disc pl-4 space-y-1">
            ${result.cons.map(c => `<li>${c}</li>`).join('')}
          </ul>
        </div>
        <div>
          <h4 class="font-bold text-blue-600 mb-2">推薦主題詞彙</h4>
          <div class="space-y-2">
            ${result.vocab.map(v => 
              `<div class="text-sm">
                <strong>${v.word}</strong>: 
                <span class="text-slate-500">${v.usage}</span>
              </div>`
            ).join('')}
          </div>
        </div>
      </div>
    `;
  } catch (e) {
    showToast('toast_error', 'error');
  } finally {
    toggleLoader('inspire', false);
  }
});
```
<!-- ⚠️ END @GLUE:REQUIRED -->

## UI Requirements
```html
<!-- AI 靈感助手卡片 -->
<div class="bg-gradient-to-r from-blue-600 to-indigo-700 p-6 rounded-2xl shadow-lg mb-8 text-white relative overflow-hidden">
  <div class="relative z-10">
    <h3 class="text-xl font-bold mb-2">✨ AI 寫作靈感助手</h3>
    <p class="text-blue-100 text-sm mb-4">輸入作文題目，為你生成雅思高分觀點與詞彙。</p>
    <div class="flex gap-2">
      <input id="aiTopicInput" type="text" 
        placeholder="例如：Is tourism beneficial for local cultures?" 
        class="flex-1 px-4 py-2 rounded-lg text-slate-800 focus:outline-none">
      <button id="aiInspireBtn" class="bg-white text-blue-600 px-6 py-2 rounded-lg font-bold hover:bg-blue-50 transition-colors flex items-center gap-2">
        <span>獲取靈感 ✨</span>
        <div id="inspireLoader" class="hidden loader w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full"></div>
      </button>
    </div>
  </div>
  <!-- 裝飾背景 -->
  <div class="absolute top-0 right-0 -mt-4 -mr-4 w-32 h-32 bg-white opacity-10 rounded-full"></div>
</div>

<!-- 靈感結果顯示區 -->
<div id="aiInspireResult" class="hidden mb-8"></div>
```

## Dependencies
- `gemini-api-wrapper` skill

## Styling
此模組使用漸變背景和裝飾性圓形元素增強視覺效果，需要確保 Tailwind CSS 可用。
