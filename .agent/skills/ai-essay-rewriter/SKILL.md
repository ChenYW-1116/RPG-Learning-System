---
name: ai-essay-rewriter
description: AI 高階改寫功能，將普通文章升級為雅思 Band 9 水準。使用場景：(1) 需要將用戶文章改寫為更高級的英語表達，(2) 需要展示「專家級」改寫範本供用戶學習，(3) 構建寫作輔助工具的「AI 改寫」功能，(4) 需要提升文章的詞彙多樣性和語法複雜度。
---

# AI Essay Rewriter Skill

## Skill Name
`ai-essay-rewriter`

## Mounting Mode
**[Reference]** - 封裝為獨立業務邏輯函數

## Target Slot
`@slot:feature_essay_rewrite`

## Purpose
使用 AI 將用戶的雅思文章改寫為 Band 9 水準，聚焦於詞彙資源和語法範圍的提升。

## Interface Contract

### Input Parameters
```javascript
{
  text: string,              // 待改寫的文章
  geminiApi: GeminiAPIWrapper  // Gemini API 實例
}
```

### Output (Promise)
```javascript
{
  rewrittenText: string  // Band 9 水準的改寫文本
}
```

## Implementation Reference

### Module Definition
```javascript
/**
 * AI 高階文章改寫器
 * 依賴：GeminiAPIWrapper
 */
class AIEssayRewriter {
  constructor(geminiApi) {
    this.api = geminiApi;
  }

  /**
   * 改寫文章至 Band 9 水準
   * @param {string} text - 原文
   * @returns {Promise<string>} 改寫後的文本
   */
  async rewrite(text) {
    if (!text || text.trim().length === 0) {
      throw new Error("Essay text cannot be empty");
    }

    const systemPrompt = `Rewrite the user's IELTS essay into a Band 9 version. 
      Focus on lexical resource and grammatical range. 
      Return raw text.`;

    const result = await this.api.call(`Rewrite this: ${text}`, systemPrompt, false);
    return result;
  }
}

export { AIEssayRewriter };
```

### Glue Code

<!-- ⚠️ @GLUE:REQUIRED -->
```javascript
// @slot:feature_essay_rewrite

const essayRewriter = new AIEssayRewriter(geminiApi);

document.getElementById('aiRewriteBtn').addEventListener('click', async () => {
  const text = document.getElementById('essayInput').value.trim();
  if (!text) {
    showToast('no_essay', 'error');
    return;
  }

  toggleLoader('rewrite', true);
  try {
    const result = await essayRewriter.rewrite(text);
    
    const resEl = document.getElementById('rewriteResult');
    resEl.classList.remove('hidden');
    resEl.innerHTML = `
      <h4 class="font-bold text-indigo-800 mb-2">✨ Band 9 範文改寫：</h4>
      <p class="text-sm text-indigo-900 leading-relaxed">
        ${result.replace(/\n/g, '<br>')}
      </p>
    `;
  } catch (e) {
    showToast('toast_error', 'error');
  } finally {
    toggleLoader('rewrite', false);
  }
});
```
<!-- ⚠️ END @GLUE:REQUIRED -->

## UI Requirements
```html
<!-- 改寫結果顯示區 -->
<div id="rewriteResult" class="hidden bg-indigo-50 p-6 rounded-2xl shadow-sm border border-indigo-200">
  <!-- AI 改寫顯示區 -->
</div>

<!-- 觸發按鈕 -->
<button id="aiRewriteBtn" class="flex-1 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 font-bold py-3 rounded-xl transition-all flex justify-center items-center gap-2 border border-indigo-200">
  <span>AI 高階改寫 ✨</span>
  <div id="rewriteLoader" class="hidden loader w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full"></div>
</button>
```

## Dependencies
- `gemini-api-wrapper` skill
