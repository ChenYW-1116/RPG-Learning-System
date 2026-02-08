---
name: ai-essay-analyzer
description: 雅思範文 AI 分析功能模組，使用 Gemini API 識別被動句、高級詞彙和預估評分。使用場景：(1) 需要分析英文文章的語法特徵（如被動語態比例），(2) 需要提取文章中的高級詞彙並提供釋義，(3) 需要對雅思作文進行分數預估，(4) 構建寫作教練或語言學習應用的分析功能。
---

# AI Essay Analyzer Skill

## Skill Name
`ai-essay-analyzer`

## Mounting Mode
**[Reference]** - 封裝為獨立業務邏輯函數

## Target Slot
`@slot:feature_essay_analysis`

## Purpose
使用 AI 對雅思範文進行深度分析，識別語法特徵（被動句）、詞彙資源（高級動詞），並預估分數。

## Interface Contract

### Input Parameters
```javascript
{
  text: string,              // 待分析的範文文本
  geminiApi: GeminiAPIWrapper  // Gemini API 實例
}
```

### Output (Promise)
```javascript
{
  passive_sentences: string[],   // 被動句列表
  advanced_verbs: Array<{
    word: string,
    meaning: string
  }>,
  passive_ratio: number,         // 被動句比例 (0-1)
  score_estimate: string         // 預估分數 (e.g., "7.5")
}
```

## Implementation Reference

### Module Definition
```javascript
/**
 * AI 範文分析器
 * 依賴：GeminiAPIWrapper
 */
class AIEssayAnalyzer {
  constructor(geminiApi) {
    this.api = geminiApi;
  }

  /**
   * 分析範文
   * @param {string} text - 範文文本
   * @returns {Promise<Object>} 分析結果
   */
  async analyze(text) {
    if (!text || text.trim().length === 0) {
      throw new Error("Essay text cannot be empty");
    }

    const systemPrompt = `You are an IELTS expert. Analyze the essay. 
      Return JSON: { 
        passive_sentences: [], 
        advanced_verbs: [{word:'', meaning:''}], 
        passive_ratio: 0.2, 
        score_estimate: '7.5' 
      }`;

    const result = await this.api.call(`Analyze: ${text}`, systemPrompt, true);
    return result;
  }
}

export { AIEssayAnalyzer };
```

### Glue Code

<!-- ⚠️ @GLUE:REQUIRED -->
```javascript
// @slot:feature_essay_analysis

// 假設 GeminiAPIWrapper 已在 @slot:api_service_layer 初始化
const essayAnalyzer = new AIEssayAnalyzer(geminiApi);

// 綁定按鈕事件
document.getElementById('analyzeBtn').addEventListener('click', async () => {
  const text = document.getElementById('essayInput').value.trim();
  if (!text) {
    showToast('no_essay', 'error');
    return;
  }

  toggleLoader('analyze', true);
  try {
    const result = await essayAnalyzer.analyze(text);
    
    // 保存狀態
    state.currentEssay = text;
    state.lastAnalysis = result;
    saveState();
    
    // 渲染結果
    renderAnalysis(result);
    showToast('toast_success');
  } catch (e) {
    showToast('toast_error', 'error');
  } finally {
    toggleLoader('analyze', false);
  }
});
```
<!-- ⚠️ END @GLUE:REQUIRED -->

### UI Rendering Template
```javascript
function renderAnalysis(data) {
  const container = document.getElementById('analysisResult');
  container.innerHTML = `
    <div class="space-y-4">
      <div class="flex justify-between items-center">
        <h3 class="text-lg font-bold text-blue-600">雅思專家分析</h3>
        <span class="bg-blue-600 text-white px-3 py-1 rounded-full text-xs font-bold">
          預估得分: ${data.score_estimate}
        </span>
      </div>
      <div>
        <h4 class="text-sm font-bold text-slate-700">📌 被動句 (Grammar Range)</h4>
        <div class="mt-2 space-y-1">
          ${data.passive_sentences.map(s => 
            `<div class="text-xs p-2 bg-slate-50 rounded italic border-l-2 border-blue-400">${s}</div>`
          ).join('')}
        </div>
      </div>
      <div>
        <h4 class="text-sm font-bold text-slate-700">💡 詞彙寶庫 (Lexical Resource)</h4>
        <div class="mt-2 grid grid-cols-2 gap-2">
          ${data.advanced_verbs.map(v => 
            `<div class="p-2 border rounded text-xs">
              <strong>${v.word}</strong><br>
              <span class="text-slate-500">${v.meaning}</span>
            </div>`
          ).join('')}
        </div>
      </div>
    </div>
  `;
}
```

## Dependencies
- `gemini-api-wrapper` skill

## Related Skills
- `ai-essay-rewriter` - AI 高階改寫
- `ai-inspiration-generator` - 靈感助手
