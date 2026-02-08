---
name: ai-blind-write-diagnosis
description: AI 盲寫表現診斷功能，比對原文與盲寫，提供語法/詞彙錯誤反饋。使用場景：(1) 用戶完成盲寫練習後需要 AI 診斷表現，(2) 需要識別用戶嘗試與原文之間的關鍵差異，(3) 需要提供簡短且鼓勵性的反饋，(4) 構建記憶訓練或聽寫/盲寫練習應用的評估功能。
---

# AI Blind Write Diagnosis Skill

## Skill Name
`ai-blind-write-diagnosis`

## Mounting Mode
**[Snippet]** - 此功能必須嵌入盲寫評估主流程

## Target Slot
`@slot:blind_write_diagnosis`

## Purpose
在盲寫評估完成後，調用 AI 對比原文和用戶嘗試，診斷最關鍵的語法或詞彙錯誤，並提供鼓勵性反饋。

## Interface Contract

### Input Parameters
```javascript
{
  source: string,             // 原文文本
  attempt: string,            // 用戶盲寫嘗試
  geminiApi: GeminiAPIWrapper  // Gemini API 實例
}
```

### Output (Promise)
```javascript
{
  diagnosis: string  // AI 診斷反饋 (50 字以內)
}
```

## Implementation Reference

### Glue Code

<!-- ⚠️ @GLUE:REQUIRED -->
```javascript
// @slot:blind_write_diagnosis
// 此代碼片段必須集成到基礎盲寫評估流程中

async function diagnoseBlindWrite(source, attempt) {
  const diagLoader = document.getElementById('diagnosisLoader');
  const diagContent = document.getElementById('diagnosisContent');
  
  if (diagLoader) diagLoader.classList.remove('hidden');

  try {
    const systemPrompt = `Compare the source and user attempt. 
      Briefly point out the most critical grammar or vocabulary mistake. 
      Keep it under 50 words. Be encouraging.`;
    
    // geminiApi 實例必須已初始化
    const result = await geminiApi.call(
      `Source: ${source}\nAttempt: ${attempt}`, 
      systemPrompt, 
      false
    );
    
    if (diagContent) diagContent.innerText = result;
  } catch (e) {
    if (diagContent) diagContent.innerText = "暫時無法連接 AI 診斷，請稍後再試。";
  } finally {
    if (diagLoader) diagLoader.classList.add('hidden');
  }
}

// 在 evaluateBlindWrite() 尾部調用
// evaluateBlindWrite() {
//   ...
//   diagnoseBlindWrite(source, attempt);
// }
```
<!-- ⚠️ END @GLUE:REQUIRED -->

### UI Requirements
```html
<!-- AI 診斷結果顯示區 -->
<div id="aiDiagnosisResult" class="p-4 bg-blue-50 rounded-xl border border-blue-100 text-sm">
  <h4 class="font-bold text-blue-700 mb-2 flex items-center gap-2">
    AI 表現診斷 ✨ 
    <span id="diagnosisLoader" class="hidden loader w-3 h-3 border-2 border-blue-700 border-t-transparent rounded-full"></span>
  </h4>
  <div id="diagnosisContent" class="text-blue-900 italic">正在獲取 AI 反饋...</div>
</div>
```

## Integration with Blind Write Flow

### Complete Flow Integration
```javascript
class BlindWriteModule {
  constructor(geminiApi, state) {
    this.api = geminiApi;
    this.state = state;
  }

  evaluate() {
    const attempt = document.getElementById('blindWriteInput').value.trim();
    const source = this.state.currentEssay;
    
    if (!source) {
      showToast('no_essay', 'error');
      return;
    }

    // 1. 計算遺漏率
    const sourceWords = source.toLowerCase().match(/\b(\w+)\b/g) || [];
    const attemptWords = attempt.toLowerCase().match(/\b(\w+)\b/g) || [];
    
    let html = "";
    let omitted = 0;
    
    sourceWords.forEach(w => {
      if (attemptWords.includes(w)) {
        html += `<span class="correct">${w} </span>`;
      } else {
        html += `<span class="omitted">${w}</span> `;
        omitted++;
      }
    });

    // 2. 顯示差異結果
    document.getElementById('blindWriteDiff').classList.remove('hidden');
    document.getElementById('diffResult').innerHTML = html;
    
    const rate = omitted / sourceWords.length;
    document.getElementById('omissionStats').innerHTML = `
      <div class="p-3 bg-red-100 rounded-lg text-center">
        <div class="text-xs">遺漏率</div>
        <div class="text-xl font-bold">${(rate*100).toFixed(1)}%</div>
      </div>
      <div class="p-3 bg-green-100 rounded-lg text-center">
        <div class="text-xs">精準度</div>
        <div class="text-xl font-bold">${(100-rate*100).toFixed(1)}%</div>
      </div>
    `;

    // 3. 保存歷史記錄
    this.addHistoryRecord(rate);
    
    // 4. @slot:blind_write_diagnosis - AI 診斷
    this.diagnose(source, attempt);
  }

  async diagnose(source, attempt) {
    const diagLoader = document.getElementById('diagnosisLoader');
    const diagContent = document.getElementById('diagnosisContent');
    
    if (diagLoader) diagLoader.classList.remove('hidden');

    try {
      const sys = `Compare the source and user attempt. 
        Briefly point out the most critical grammar or vocabulary mistake. 
        Keep it under 50 words. Be encouraging.`;
      
      const result = await this.api.call(`Source: ${source}\nAttempt: ${attempt}`, sys, false);
      if (diagContent) diagContent.innerText = result;
    } catch (e) {
      if (diagContent) diagContent.innerText = "暫時無法連接 AI 診斷，請稍後再試。";
    } finally {
      if (diagLoader) diagLoader.classList.add('hidden');
    }
  }

  addHistoryRecord(rate) {
    const rec = {
      date: new Date().toLocaleDateString(),
      passive_ratio: this.state.lastAnalysis?.passive_ratio || 0,
      omission_rate: rate,
      new_verbs: this.state.lastAnalysis?.advanced_verbs?.length || 0,
      status: rate < 0.2 ? '優秀' : '待改進'
    };
    this.state.history.unshift(rec);
    saveState();
  }
}
```

## Dependencies
- `gemini-api-wrapper` skill
- 盲寫評估基礎邏輯

## Error Handling
- 網絡錯誤時顯示友好提示
- 不阻塞主要評估流程
