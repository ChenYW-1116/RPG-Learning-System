/**
 * ═══════════════════════════════════════════════════════════════════════════
 * 🔍 TROUBLESHOOTING MODULE v1.0
 * 基於意圖對比的智能除錯系統 - 可選載入
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * 此模組實現了 4 階段意圖對比除錯流程:
 * - Stage 1: 建立雙向意圖基準 (Spec to Intent + Code to Intent)
 * - Stage 2: 執行意圖差異分析 (Gap Analysis)
 * - Stage 3: 生成除錯提示詞 (debug.md)
 * - Stage 4: 執行深度代碼修復 (Senior Debugger)
 * 
 * DEPENDENCIES (必須在主核心中已定義):
 * - state: 全域狀態對象
 * - addLog(): 日誌系統
 * - logTerminal(): 終端輸出
 * - addChatMessage(): 聊天訊息
 * - callKimi(): AI API 調用
 * - resolveAIConfig(): AI 配置解析
 * - updateTypingStatus(): 打字狀態更新
 * - removeTypingIndicator(): 移除打字指示器
 * ═══════════════════════════════════════════════════════════════════════════
 */

// 檢查相依模組是否存在
(function () {
    const requiredDeps = ['state', 'addLog', 'logTerminal', 'addChatMessage', 'callKimi', 'resolveAIConfig'];
    const missingDeps = requiredDeps.filter(dep => typeof window[dep] === 'undefined');

    if (missingDeps.length > 0) {
        console.error('[TROUBLESHOOTING MODULE] ❌ Missing dependencies:', missingDeps.join(', '));
        console.warn('[TROUBLESHOOTING MODULE] ⚠️ Please ensure spec-kit-sdd-core.js is loaded first.');
    } else {
        console.log('[TROUBLESHOOTING MODULE] ✅ All dependencies satisfied. Module loaded.');
    }
})();

// ═══════════════════════════════════════════════════════════════════════════
// 📋 INTENT TEMPLATES (意圖描述模板)
// ═══════════════════════════════════════════════════════════════════════════

const INTENT_TEMPLATES = {
    // 業務邏輯型
    ruleBasedIntent: `在 [條件/場景] 下，系統應該根據 [規則 A] 執行 [動作 B]，且必須避免 [錯誤情況 C]。`,

    // 數據轉換/算法型
    dataProcessingIntent: `當輸入為 [輸入數據] 時，預期的處理步驟是 [步驟 1, 2, 3]，最後輸出的格式應為 [輸出結果]。`,

    // 使用者路徑/狀態型
    stateMachineIntent: `當用戶點擊 [按鈕/觸發點] 後，系統應進入 [狀態 A]，只有在 [特定條件] 滿足時才允許跳轉到 [狀態 B]。`,

    // 意圖對比表模板
    gapAnalysisTable: `| 檢測維度 (Dimension) | 意圖規格 (Intended Behavior) | 程式現狀 (Actual Implementation) | 根本原因推測 (Root Cause) |
|---|---|---|---|
| **1. 觸發與互動** | [預期行為] | [實際行為] | [根本原因] |
| **2. 數據與邏輯** | [預期行為] | [實際行為] | [根本原因] |
| **3. 渲染與輸出** | [預期行為] | [實際行為] | [根本原因] |
| **4. 邊界與異常** | [預期行為] | [實際行為] | [根本原因] |`
};

// ═══════════════════════════════════════════════════════════════════════════
// 🔍 STAGE 1: ESTABLISH INTENT BASELINES
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Stage 1: 建立雙向意圖基準
 * @param {string} specContent - 規格文檔內容 (spec.md)
 * @param {string} codeContent - 代碼內容 (HTML)
 * @returns {Promise<{specIntent: string, codeIntent: string}>}
 */
async function establishIntentBaselines(specContent, codeContent) {
    addLog('Stage 1: 建立雙向意圖基準', 'info', 'TROUBLESHOOT');
    logTerminal('═══════════════════════════════════════════════════════════', 'cmd');
    logTerminal('🔍 TROUBLESHOOTING Stage 1: 意圖基準建立', 'cmd');
    logTerminal('═══════════════════════════════════════════════════════════', 'cmd');

    // 🔵 分析階段：強制使用 Kimi
    const aiConfig = resolveAIConfig('kimi', 'phase1');

    // 1.1 規格轉意圖 (Spec to Intent)
    logTerminal('PS > 執行規格轉意圖分析 (Spec to Intent)...', 'cmd');
    const specToIntentPrompt = `你是意圖分析專家。請分析以下規格文檔，使用下列意圖描述類型將其轉換為結構化的規格意圖:

## 意圖類型
1. **業務邏輯型**: ${INTENT_TEMPLATES.ruleBasedIntent}
2. **數據轉換型**: ${INTENT_TEMPLATES.dataProcessingIntent}
3. **狀態機型**: ${INTENT_TEMPLATES.stateMachineIntent}

## 規格文檔:
${specContent}

## 輸出格式:
請為每個功能模組輸出對應的意圖描述，格式如下:
### [模組名稱]
- **意圖類型**: [業務邏輯型/數據轉換型/狀態機型]
- **預期行為**: [詳細描述]
- **成功條件**: [可驗證的條件]
- **邊界情況**: [需處理的異常]`;

    const specIntent = await callKimi(
        specToIntentPrompt,
        "你是意圖分析專家，請直接輸出 Markdown 格式的意圖分析。",
        aiConfig.model,
        aiConfig.key,
        aiConfig.url
    );

    addLog('規格意圖分析完成', 'success', 'TROUBLESHOOT');
    logTerminal('✓ Spec to Intent: 完成', 'success');

    // 1.2 代碼轉意圖 (Code to Intent)
    logTerminal('PS > 執行代碼逆向意圖分析 (Code to Intent)...', 'cmd');
    const codeToIntentPrompt = `你是代碼逆向工程專家。請分析以下 HTML/JS 代碼，推斷其實際實現的意圖:

## 意圖類型模板
1. **業務邏輯型**: ${INTENT_TEMPLATES.ruleBasedIntent}
2. **數據轉換型**: ${INTENT_TEMPLATES.dataProcessingIntent}
3. **狀態機型**: ${INTENT_TEMPLATES.stateMachineIntent}

## 源代碼:
\`\`\`html
${codeContent.substring(0, 30000)} ${codeContent.length > 30000 ? '... [TRUNCATED]' : ''}
\`\`\`

## 輸出格式:
請為每個已實現的功能模組輸出對應的意圖描述:
### [模組名稱]
- **意圖類型**: [業務邏輯型/數據轉換型/狀態機型]
- **實際行為**: [代碼實際做了什麼]
- **潛在問題**: [可能的問題或缺失]
- **代碼位置**: [相關函數/行號提示]`;

    const codeIntent = await callKimi(
        codeToIntentPrompt,
        "你是代碼逆向工程專家，請直接輸出 Markdown 格式的意圖分析。",
        aiConfig.model,
        aiConfig.key,
        aiConfig.url
    );

    addLog('代碼意圖分析完成', 'success', 'TROUBLESHOOT');
    logTerminal('✓ Code to Intent: 完成', 'success');

    return { specIntent, codeIntent };
}

// ═══════════════════════════════════════════════════════════════════════════
// 🔍 STAGE 2: GAP ANALYSIS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Stage 2: 執行意圖差異分析
 * @param {string} specIntent - 規格意圖 (intent1.md)
 * @param {string} codeIntent - 代碼意圖 (intent2.md)
 * @returns {Promise<string>} 意圖對比表格 (Markdown)
 */
async function executeGapAnalysis(specIntent, codeIntent) {
    addLog('Stage 2: 執行意圖差異分析', 'info', 'TROUBLESHOOT');
    logTerminal('═══════════════════════════════════════════════════════════', 'cmd');
    logTerminal('🔍 TROUBLESHOOTING Stage 2: 意圖差異分析 (Gap Analysis)', 'cmd');
    logTerminal('═══════════════════════════════════════════════════════════', 'cmd');

    // 🔵 分析階段：強制使用 Kimi
    const aiConfig = resolveAIConfig('kimi', 'phase1');

    const gapAnalysisPrompt = `你是資深 QA 專家。請比對以下兩份意圖文檔，找出差異並生成意圖對比表格。

## 規格意圖 (Expected - intent1.md):
${specIntent}

## 代碼意圖 (Actual - intent2.md):
${codeIntent}

## 輸出格式 (使用此模板):
${INTENT_TEMPLATES.gapAnalysisTable}

## 要求:
1. 針對每個維度，詳細說明預期行為與實際行為的差異
2. 提供具體的根本原因推測
3. 在表格後添加「修正方案」區塊，列出具體的 Action Items

請直接輸出 Markdown 格式的意圖對比表格和修正方案。`;

    const gapAnalysisResult = await callKimi(
        gapAnalysisPrompt,
        "你是資深 QA 專家，請直接輸出 Markdown 格式的意圖對比表格。",
        aiConfig.model,
        aiConfig.key,
        aiConfig.url
    );

    addLog('意圖差異分析完成', 'success', 'TROUBLESHOOT');
    logTerminal('✓ Gap Analysis: 生成意圖對比表格', 'success');

    return gapAnalysisResult;
}

// ═══════════════════════════════════════════════════════════════════════════
// 🔍 STAGE 3: GENERATE DEBUG PROMPT
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Stage 3: 生成除錯提示詞 (debug.md)
 * @param {string} gapAnalysis - 意圖對比表格
 * @param {string} codeContent - 原始代碼
 * @returns {Promise<string>} 除錯提示詞
 */
async function generateDebugPrompt(gapAnalysis, codeContent) {
    addLog('Stage 3: 生成除錯提示詞', 'info', 'TROUBLESHOOT');
    logTerminal('═══════════════════════════════════════════════════════════', 'cmd');
    logTerminal('🔍 TROUBLESHOOTING Stage 3: 生成除錯提示詞 (debug.md)', 'cmd');
    logTerminal('═══════════════════════════════════════════════════════════', 'cmd');

    // 🔵 分析階段：強制使用 Kimi
    const aiConfig = resolveAIConfig('kimi', 'phase1');

    const debugPromptGeneratorPrompt = `你是提示詞工程師。請根據以下意圖對比表格，撰寫一份給「資深除錯專家」的精確提示詞。

## 意圖對比表格:
${gapAnalysis}

## 代碼大小資訊:
- 代碼總長度: ${codeContent.length} 字元
- 約 ${(codeContent.length / 1024).toFixed(1)} KB

## 輸出要求:
生成的提示詞 (debug.md) 應包含:

1. **背景說明**: 告知 AI 這是一份需要修復的 Web 應用代碼
2. **修正目標**: 列出意圖對比表格中的所有修正點 (Action Items)
3. **代碼健康度要求**:
   - 檢查潛在的語法錯誤
   - 檢查內存洩漏 (如 setInterval/setTimeout 清理)
   - 檢查邊界條件防護 (null check, try-catch)
   - 檢查 async/await 競態條件
4. **輸出指令**: 要求 AI 輸出完整的修復後代碼

請直接輸出可用的除錯提示詞。`;

    const debugPrompt = await callKimi(
        debugPromptGeneratorPrompt,
        "你是提示詞工程師，請直接輸出除錯提示詞內容。",
        aiConfig.model,
        aiConfig.key,
        aiConfig.url
    );

    addLog('除錯提示詞生成完成', 'success', 'TROUBLESHOOT');
    logTerminal('✓ Debug Prompt: 生成 debug.md', 'success');

    return debugPrompt;
}

// ═══════════════════════════════════════════════════════════════════════════
// 🔍 STAGE 4: EXECUTE DEEP CODE FIX
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Stage 4: 執行深度代碼修復
 * @param {string} debugPrompt - 除錯提示詞
 * @param {string} codeContent - 原始代碼
 * @returns {Promise<string>} 修復後的代碼
 */
async function executeDeepCodeFix(debugPrompt, codeContent) {
    addLog('Stage 4: 執行深度代碼修復', 'info', 'TROUBLESHOOT');
    logTerminal('═══════════════════════════════════════════════════════════', 'cmd');
    logTerminal('🔍 TROUBLESHOOTING Stage 4: 深度代碼修復', 'cmd');
    logTerminal('═══════════════════════════════════════════════════════════', 'cmd');

    // 使用 Gemini Reverse key 進行修復
    const aiConfig = resolveAIConfig('gemini', 'reverse');

    const seniorDebuggerPrompt = `# 角色：資深全端除錯專家 (Senior Full-Stack Debugger)

## 核心任務
你的唯一目標是根據 **源代碼** 與 **除錯指引**，執行深度代碼修復與優化，最終產出 **零錯誤 (Zero-Bug)** 且 **完全符合需求** 的完整檔案代碼。

## 執行準則 (Guidelines)
1. **嚴格遵循指引**：必須逐條落實除錯指引中的所有修正要求，不可遺漏。
2. **保持架構一致性**：保留原有的技術棧（如 Tailwind CSS, I18N 結構, State Management 模式），除非指引明確要求重構。
3. **防禦性編程**：
   - 針對所有 DOM 操作加入 Null Check。
   - 針對所有 API 呼叫加入 try-catch 錯誤處理。
   - 確保 Async/Await 邏輯無 Race Condition。
4. **完整輸出**：不要只輸出修改片段，必須輸出 **可直接運行** 的完整檔案內容。

## 除錯指引 (debug.md):
${debugPrompt}

## 源代碼:
\`\`\`html
${codeContent}
\`\`\`

## 修復後的完整代碼:`;

    const startTime = performance.now();
    logTerminal('PS > 調用 AI 引擎進行深度修復...', 'cmd');
    logTerminal(`   原始代碼大小: ${(codeContent.length / 1024).toFixed(1)} KB`, 'cmd');
    logTerminal(`   使用模型: ${aiConfig.model}`, 'cmd');

    const fixedCode = await callKimi(
        seniorDebuggerPrompt,
        "你是資深全端除錯專家。請輸出完整的修復後 HTML 代碼，包含 <!DOCTYPE html> 開頭和 </html> 結尾。",
        aiConfig.model,
        aiConfig.key,
        aiConfig.url
    );

    const endTime = performance.now();
    const duration = ((endTime - startTime) / 1000).toFixed(2);

    addLog(`深度修復完成. 耗時=${duration}s`, 'success', 'TROUBLESHOOT');
    logTerminal(`✓ Deep Fix Complete: ${duration} 秒`, 'success');

    // 清理並驗證結果
    if (!fixedCode) {
        addLog('API 回傳空結果', 'error', 'TROUBLESHOOT');
        return null;
    }

    let cleaned = fixedCode.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();
    cleaned = cleaned.replace(/```html/g, '').replace(/```/g, '').trim();

    const htmlMatch = cleaned.match(/<!DOCTYPE html>[\s\S]*?<\/html>/i) ||
        cleaned.match(/<html[\s\S]*?<\/html>/i);

    if (!htmlMatch) {
        addLog('修復結果格式不正確', 'error', 'TROUBLESHOOT');
        return null;
    }

    const result = htmlMatch[0].trim();
    logTerminal(`   修復後代碼大小: ${(result.length / 1024).toFixed(1)} KB`, 'cmd');

    return result;
}

// ═══════════════════════════════════════════════════════════════════════════
// 🚀 MAIN TROUBLESHOOTING ORCHESTRATOR
// ═══════════════════════════════════════════════════════════════════════════

/**
 * 執行完整的 4 階段意圖對比除錯流程
 * @param {object} options - 配置選項
 * @param {string} options.specContent - 規格文檔內容
 * @param {string} options.codeContent - 代碼內容
 * @param {boolean} options.autoFix - 是否自動應用修復 (default: true)
 * @returns {Promise<object>} 除錯結果
 */
async function runTroubleshootingPipeline(options = {}) {
    const {
        specContent = state.spec?.markdownContent || '',
        codeContent = state.generatedCode || '',
        autoFix = true
    } = options;

    if (!specContent || !codeContent) {
        addLog('缺少規格或代碼內容', 'error', 'TROUBLESHOOT');
        addChatMessage('❌ 無法執行除錯：缺少規格文檔或代碼。');
        return { success: false, error: 'Missing spec or code content' };
    }

    addLog('啟動 4 階段意圖對比除錯流程', 'info', 'TROUBLESHOOT');
    addChatMessage(`
        <div class="bg-purple-900/30 border border-purple-500/30 p-3 rounded-lg">
            <p class="text-purple-300 font-semibold">🔍 啟動意圖對比除錯 (4-Stage Pipeline)</p>
            <p class="text-sm text-gray-400 mt-1">Stage 1: 意圖基準 → Stage 2: 差異分析 → Stage 3: 提示生成 → Stage 4: 深度修復</p>
        </div>
    `);

    try {
        // Stage 1: 建立意圖基準
        updateTypingStatus('Stage 1/4: 建立雙向意圖基準...');
        const { specIntent, codeIntent } = await establishIntentBaselines(specContent, codeContent);

        // Stage 2: 差異分析
        updateTypingStatus('Stage 2/4: 執行意圖差異分析...');
        const gapAnalysis = await executeGapAnalysis(specIntent, codeIntent);

        // 保存中間結果到 state
        state.troubleshootingData = {
            specIntent,
            codeIntent,
            gapAnalysis,
            debugPrompt: null,
            fixedCode: null
        };

        // Stage 3: 生成除錯提示詞
        updateTypingStatus('Stage 3/4: 生成除錯提示詞...');
        const debugPrompt = await generateDebugPrompt(gapAnalysis, codeContent);
        state.troubleshootingData.debugPrompt = debugPrompt;

        // Stage 4: 深度修復
        updateTypingStatus('Stage 4/4: 執行深度代碼修復...');
        const fixedCode = await executeDeepCodeFix(debugPrompt, codeContent);
        state.troubleshootingData.fixedCode = fixedCode;

        removeTypingIndicator();

        if (!fixedCode) {
            addLog('修復流程失敗', 'error', 'TROUBLESHOOT');
            addChatMessage('❌ 除錯流程完成，但未能生成有效的修復代碼。');
            return { success: false, error: 'Failed to generate fixed code' };
        }

        // 驗證修復代碼大小
        const sizeRatio = (fixedCode.length / codeContent.length * 100).toFixed(1);
        if (fixedCode.length < codeContent.length * 0.7) {
            addLog('修復被拒絕: 代碼量異常減少', 'warn', 'TROUBLESHOOT');
            addChatMessage('⚠️ 修復代碼大小異常，可能存在截斷問題。');
            return { success: false, error: 'Code size too small (possible truncation)' };
        }

        // 自動應用修復
        if (autoFix) {
            state.generatedCode = fixedCode;
            if (typeof updateCodeSection === 'function') {
                updateCodeSection(fixedCode);
            }
            addLog('已自動應用修復代碼', 'success', 'TROUBLESHOOT');
        }

        addChatMessage(`
            <div class="bg-green-900/30 border border-green-500/30 p-3 rounded-lg">
                <p class="text-green-300 font-semibold">✅ 意圖對比除錯完成</p>
                <div class="text-sm text-gray-400 mt-2 space-y-1">
                    <p>📊 大小比例: ${sizeRatio}%</p>
                    <p>📝 修復前: ${(codeContent.length / 1024).toFixed(1)} KB</p>
                    <p>📝 修復後: ${(fixedCode.length / 1024).toFixed(1)} KB</p>
                </div>
                ${autoFix ? '<p class="text-green-400 mt-2">✓ 修復代碼已自動應用</p>' : '<p class="text-yellow-400 mt-2">⚠️ 請手動檢查並應用修復</p>'}
            </div>
        `);

        logTerminal('═══════════════════════════════════════════════════════════', 'cmd');
        logTerminal('✓ TROUBLESHOOTING PIPELINE COMPLETE', 'success');
        logTerminal('═══════════════════════════════════════════════════════════', 'cmd');

        return {
            success: true,
            specIntent,
            codeIntent,
            gapAnalysis,
            debugPrompt,
            fixedCode,
            sizeRatio
        };

    } catch (error) {
        removeTypingIndicator();
        addLog(`除錯流程錯誤: ${error.message}`, 'error', 'TROUBLESHOOT');
        addChatMessage(`❌ 除錯流程發生錯誤: ${error.message}`);
        return { success: false, error: error.message };
    }
}

// ═══════════════════════════════════════════════════════════════════════════
// 📦 MODULE EXPORTS (Expose to global scope)
// ═══════════════════════════════════════════════════════════════════════════

// 標記模組已載入
window.TROUBLESHOOTING_MODULE_LOADED = true;

// 導出函數到全域
window.runTroubleshootingPipeline = runTroubleshootingPipeline;
window.establishIntentBaselines = establishIntentBaselines;
window.executeGapAnalysis = executeGapAnalysis;
window.generateDebugPrompt = generateDebugPrompt;
window.executeDeepCodeFix = executeDeepCodeFix;

// 導出模板
window.INTENT_TEMPLATES = INTENT_TEMPLATES;

console.log('[TROUBLESHOOTING MODULE] 🔍 Functions exported to global scope:');
console.log('  - runTroubleshootingPipeline(options)');
console.log('  - establishIntentBaselines(spec, code)');
console.log('  - executeGapAnalysis(specIntent, codeIntent)');
console.log('  - generateDebugPrompt(gapAnalysis, code)');
console.log('  - executeDeepCodeFix(debugPrompt, code)');
