/**
 * ═══════════════════════════════════════════════════════════════════════════
 * 🔧 AUTO-FIX MODULE v1.0
 * 模組化的自動修復功能 - 可選載入
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * 此模組包含 Auto-Fix 相關功能，可獨立於主核心載入。
 * 
 * DEPENDENCIES (必須在主核心中已定義):
 * - state: 全域狀態對象
 * - addLog(): 日誌系統
 * - logTerminal(): 終端輸出
 * - addChatMessage(): 聊天訊息
 * - callKimi(): AI API 調用
 * - resolveAIConfig(): AI 配置解析
 * - findRelevantSkills(): 技能發現
 * - updateCodeSection(): UI 更新
 * - runDynamicTests(): 動態測試執行
 * - updateTypingStatus(): 打字狀態更新
 * - removeTypingIndicator(): 移除打字指示器
 * ═══════════════════════════════════════════════════════════════════════════
 */

// 檢查相依模組是否存在
(function () {
    const requiredDeps = ['state', 'addLog', 'logTerminal', 'addChatMessage', 'callKimi', 'resolveAIConfig', 'findRelevantSkills', 'loadSkillContent'];
    const missingDeps = requiredDeps.filter(dep => typeof window[dep] === 'undefined');

    if (missingDeps.length > 0) {
        console.error('[AUTO-FIX MODULE] ❌ Missing dependencies:', missingDeps.join(', '));
        console.warn('[AUTO-FIX MODULE] ⚠️ Please ensure spec-kit-sdd-core.js is loaded first.');
    } else {
        console.log('[AUTO-FIX MODULE] ✅ All dependencies satisfied. Module loaded.');
    }
})();

// ═══════════════════════════════════════════════════════════════════════════
// 🔧 AUTO-FIX FROM TEST RESULTS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * 基於測試結果自動修復 (防幻覺：只修具體問題)
 */
async function autoFixFromTestResults() {
    if (typeof addLog !== 'function') {
        console.error('[AUTO-FIX] Module not properly initialized');
        return;
    }

    addLog('自動修復流程啟動', 'info', 'AUTO-FIX');
    logTerminal('═══════════════════════════════════════════════════════════', 'cmd');
    logTerminal('🔧 AUTO-FIX: 開始測試驅動自動修復', 'cmd');
    logTerminal('═══════════════════════════════════════════════════════════', 'cmd');

    const resultItems = document.querySelectorAll('#test-results-list > div');
    const failedTests = [];

    addLog(`掃描測試結果: ${resultItems.length} 個項目`, 'debug', 'AUTO-FIX');
    logTerminal(`PS > 掃描測試結果: ${resultItems.length} 個項目`, 'cmd');

    resultItems.forEach(div => {
        if (div.classList.contains('bg-red-500/10')) {
            const id = div.querySelector('.font-mono')?.textContent || '';
            const name = div.querySelector('.font-semibold')?.textContent || '';
            const details = div.querySelector('.text-gray-400')?.textContent || '';
            failedTests.push({ id, name, details });
            addLog(`識別失敗測試: [${id}] ${name}`, 'warn', 'AUTO-FIX');
            logTerminal(`   ✗ 失敗: [${id}] ${name}`, 'error');
        }
    });

    if (failedTests.length === 0) {
        addLog('沒有失敗的測試需修復', 'success', 'AUTO-FIX');
        logTerminal('✓ 沒有失敗的測試需要修復', 'success');
        addChatMessage('✅ 沒有失敗的測試需要修復');
        return;
    }

    addLog(`識別到 ${failedTests.length} 個失敗測試`, 'info', 'AUTO-FIX');
    logTerminal(`PS > 🕵️ 啟動外科手術式除錯 (Surgical Debugging)...`, 'cmd');

    addChatMessage('', false, true);
    updateTypingStatus('AI 正在分析首要錯誤並重新探索技能...');

    // 1. 構建「高解析度」報錯報告
    const primaryFailure = failedTests[0]; // 聚焦於第一個阻塞點
    const failureReport = failedTests.map((t, index) => {
        let hint = "";
        if (t.details.includes("未找到按鈕")) hint = "檢查 ID/Text 是否匹配。";
        if (t.details.includes("undefined")) hint = "可能是 Context 丟失或未注入。";
        return `${index === 0 ? '🔺 [PRIMARY] ' : '- '}[${t.id}] ${t.name}: ${t.details} (${hint})`;
    }).join('\n');

    // 2. 🧠 全面搜尋技能 (基於所有失敗點)
    const allFailuresStr = failedTests.map(t => t.name).join(', ');
    const attemptInfo = state.autoFixAttempts > 0 ? ` (修復嘗試 #${state.autoFixAttempts + 1})` : "";

    // 構建更宏大的查詢，讓 AI 知道這是一個綜合性錯誤
    const fixQuery = `Failures: ${allFailuresStr}. Details of primary blocker: ${primaryFailure.details}. Goal: Find ALL relevant skills to fix logic, UI compliance, and test runner issues simultaneously.${attemptInfo}`;

    let activeSkillsContent = "";
    try {
        addLog(`正在針對 ${failedTests.length} 個錯誤進行全球化技能匹配...`, 'info', 'AUTO-FIX');
        // 加大搜尋額度，允許發現更多協同技能
        if (typeof findRelevantSkills === 'function' && typeof loadSkillContent === 'function') {
            const foundSkills = await findRelevantSkills(fixQuery, 4);

            if (foundSkills && Array.isArray(foundSkills)) {
                addLog(`找到 ${foundSkills.length} 個相關技能，正在載入內容...`, 'debug', 'AUTO-FIX');

                for (const skill of foundSkills) {
                    try {
                        const content = await loadSkillContent(skill.path);
                        if (content) {
                            activeSkillsContent += `\n\n# SKILL: ${skill.name}\n${content}\n`;
                            // 如果有 Glue Code，也要特別標記
                            if (content.includes('### Glue Code')) {
                                activeSkillsContent += `\n<!-- REMINDER: Implement Glue Code for ${skill.name} -->\n`;
                            }
                        }
                    } catch (err) {
                        console.warn(`Failed to load content for skill ${skill.name}`, err);
                    }
                }
            } else if (typeof foundSkills === 'string') {
                activeSkillsContent = foundSkills;
            }
        }
    } catch (e) {
        console.error('Holistic skill discovery failed', e);
    }

    logTerminal(`PS > 針對「${primaryFailure.name}」重新分析技能需求...`, 'cmd');

    const prompt = `# Role
You are an expert debugger. This is an ITERative fixing attempt${attemptInfo}.
${activeSkillsContent || ''}

# Priority Goal
Pass the PRIMARY failure: [${primaryFailure.id}] ${primaryFailure.name}.
Secondary goal: Pass other identified failures.

# Test Failure Report (Current State)
${failureReport}

# Instructions
1. **Focus on the Blocker**: Solve [${primaryFailure.id}] first. If it's a context/undefined error, apply Skill rules strictly.
2. **Code Integrity**: Use the correct HTML IDs from the current file. Do NOT invent IDs.
3. **Compliance Check**: CROSS-REFERENCE your fix with the \`CHECKLIST\` below. Ensure no functional requirements are broken or missing.
4. **Inject Test Runner**: If the test code needs adjustment to match the HTML, update the \`injectTestRunner\` block.

# CHECKLIST
${state.checklistMarkdown || '(未提供)'}

# Current Code
${state.generatedCode}

# Fixed Code (FULL FILE):`;

    // 🔵 自動修復階段 (Reverse)：強制使用 Google Gemini Key #2
    const aiConfig = resolveAIConfig('gemini', 'reverse');
    const targetModel = aiConfig.model;
    const targetApiKey = aiConfig.key;
    const targetApiUrl = aiConfig.url;

    addLog(`調用 AI 進行修復. 模型=${targetModel}, 原代碼大小=${(state.generatedCode.length / 1024).toFixed(1)} KB`, 'info', 'AUTO-FIX');
    logTerminal('PS > 調用 AI 引擎進行修復...', 'cmd');
    logTerminal(`   原始代碼大小: ${(state.generatedCode.length / 1024).toFixed(1)} KB`, 'cmd');
    logTerminal(`   使用模型: ${targetModel}`, 'cmd');
    logTerminal(`   Provider: ${aiConfig.provider}`, 'cmd');

    const startTime = performance.now();
    const result = await callKimi(
        prompt,
        "You are a precise code debugger. Only fix specific issues. Return raw HTML.",
        targetModel,
        targetApiKey,
        targetApiUrl
    );
    const endTime = performance.now();
    const duration = ((endTime - startTime) / 1000).toFixed(2);

    addLog(`API 耗時: ${duration}s`, 'debug', 'AUTO-FIX');
    logTerminal(`   API 回應時間: ${duration} 秒`, 'cmd');

    removeTypingIndicator();

    if (!result) {
        addLog('API 回傳空結果', 'error', 'AUTO-FIX');
        logTerminal('✗ 自動修復失敗: API 無回應', 'error');
        addChatMessage('❌ 自動修復失敗');
        return;
    }

    addLog(`收到修復結果. 大小=${(result.length / 1024).toFixed(1)} KB`, 'info', 'AUTO-FIX');
    logTerminal(`   收到修復結果: ${(result.length / 1024).toFixed(1)} KB`, 'cmd');

    // 清理並驗證結果
    console.log('🔍 [AUTO-FIX] 驗證修復結果...');
    logTerminal('PS > 驗證修復結果格式...', 'cmd');

    let cleaned = result.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();
    // Strip markdown code blocks if present
    cleaned = cleaned.replace(/```html/g, '').replace(/```/g, '').trim();

    const htmlMatch = cleaned.match(/<!DOCTYPE html>[\s\S]*?<\/html>/i) || cleaned.match(/<html[\s\S]*?<\/html>/i);

    if (!htmlMatch) {
        addLog('結果格式不正確 (無 HTML 結構)', 'error', 'AUTO-FIX');
        logTerminal('✗ 修復結果無效 (缺少 HTML 結構)', 'error');
        addChatMessage('❌ AI 返回的修復結果格式不正確');
        return;
    }

    const fixedCode = htmlMatch[0].trim();

    // 基本完整性驗證
    if (!fixedCode.includes('<!DOCTYPE html>') || !fixedCode.includes('</html>')) {
        addLog('修復後的代碼似乎不完整', 'error', 'AUTO-FIX');
        logTerminal('✗ 修復失敗: 生成的代碼不完整', 'error');
        addChatMessage('⚠️ AI 修復後的代碼不完整，放棄本次修復。', false);
        return;
    }

    addLog(`修復代碼完成. 大小=${(fixedCode.length / 1024).toFixed(1)} KB`, 'info', 'AUTO-FIX');
    logTerminal(`   修復後代碼大小: ${(fixedCode.length / 1024).toFixed(1)} KB`, 'cmd');

    // 防幻覺：確保修復不會大幅縮減代碼
    const sizeRatio = (fixedCode.length / state.generatedCode.length * 100).toFixed(1);
    console.log(`📊 [AUTO-FIX] 大小比例: ${sizeRatio}%`);
    logTerminal(`   大小比例: ${sizeRatio}% (原始代碼)`, 'cmd');

    if (fixedCode.length < state.generatedCode.length * 0.7) {
        addLog('修復被拒絕: 代碼量異常減少 (可能為幻覺)', 'error', 'AUTO-FIX');
        logTerminal('✗ 修復被拒絕: 代碼量異常減少 (可能為幻覺)', 'error');
        addChatMessage('⚠️ 修復結果被拒絕 (代碼量異常減少，可能為幻覺)');
        return;
    }

    addLog('修復驗證通過', 'success', 'AUTO-FIX');
    logTerminal('✓ 修復驗證通過', 'success');

    state.generatedCode = fixedCode;
    updateCodeSection(fixedCode);

    addLog('代碼已更新並執行重新測試', 'success', 'AUTO-FIX');
    logTerminal('✓ 代碼已根據測試結果修復', 'success');
    logTerminal('═══════════════════════════════════════════════════════════', 'cmd');

    addChatMessage(`
        <div class="bg-green-900/30 border border-green-500/30 p-3 rounded-lg">
            <p class="text-green-300 font-semibold">✅ 代碼已自動修復</p>
            <p class="text-sm text-gray-400 mt-1">修復了 ${failedTests.length} 個問題。正在重新執行測試驗證...</p>
        </div>
    `);

    console.log('🔄 [AUTO-FIX] 準備重新執行測試...');
    logTerminal('PS > 準備重新執行動態測試...', 'cmd');

    // 自動重新執行測試
    setTimeout(() => {
        console.log('🧪 [AUTO-FIX] 開始重新測試');
        logTerminal('PS > 開始重新測試修復後的代碼', 'cmd');
        runDynamicTests();
    }, 1000);
}

// ═══════════════════════════════════════════════════════════════════════════
// 🔄 REGENERATE WITH FEEDBACK
// ═══════════════════════════════════════════════════════════════════════════

/**
 * 重新生成代碼 (帶有先前測試反饋)
 */
async function regenerateWithFeedback() {
    if (typeof addChatMessage !== 'function' || typeof runImplementCommand !== 'function') {
        console.error('[AUTO-FIX] Module not properly initialized');
        return;
    }

    addChatMessage('🔄 正在重新生成代碼... 會考慮之前的測試反饋。');
    await runImplementCommand();
    setTimeout(() => runDynamicTests(), 2000);
}

// ═══════════════════════════════════════════════════════════════════════════
// 🛡️ VERIFY CODE WITH BRIDGE (Precision Execution)
// ═══════════════════════════════════════════════════════════════════════════

/**
 * 驗證代碼與本地 Bridge 溝通 (Precision Execution)
 */
async function verifyCodeWithBridge() {
    if (!state.generatedCode) {
        alert('尚未生成代碼，無法進行驗證。');
        return;
    }

    // 更新 UI 狀態
    const btn = document.querySelector('button[onclick="verifyCodeWithBridge()"]');
    const originalText = btn.innerHTML;
    btn.innerHTML = '<span>⚡</span> 驗證中 (需時約 30s)...';
    btn.disabled = true;

    addChatMessage('🛡️ 正在啟動 **精確執行驗證 (Precision Execution)**...', false, true);
    updateTypingStatus("正在呼叫本地 Bridge 進行深度 CoT 驗證...");
    logTerminal('PS > Invoke-RestMethod -Uri "http://localhost:3000/verify" -Method POST', 'cmd');
    addLog('發起本地 Bridge 驗證請求', 'info', 'BRIDGE');

    try {
        // 🧠 SMART SKILL DISCOVERY FOR VERIFICATION
        logTerminal(`🤖 [BRIDGE] 正在偵測驗證所需的專業技能...`, 'cmd');
        const verificationRequirement = `Verify this code: ${state.userRequirement || 'General UI fix'}. Ensure business logic, checklist compliance, and technical robustness.`;

        let activeSkills = null;
        if (typeof findRelevantSkills === 'function') {
            activeSkills = await findRelevantSkills(verificationRequirement, 3);
        }

        let prompt = "請嚴格檢查這份代碼。確認所有按鈕都能運作，排版在手機上是否正常，並且修復任何邏輯錯誤。";
        if (activeSkills) {
            prompt += `\n\n# 🌟 ACTIVE SKILLS FOR VERIFICATION\n${activeSkills}`;
            logTerminal(`✅ [BRIDGE] 已為驗證引擎注入額外技能知識`, 'success');
        }

        // 🔵 驗證階段 (Reverse)：強制使用 Google Gemini Key #2
        const config = resolveAIConfig('gemini', 'reverse');

        // 呼叫本地 Bridge
        // 嘗試連結本地服務器
        const response = await fetch('/api/bridge/verify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                code: state.generatedCode,
                prompt: prompt,
                apiKey: config.key,
                model: config.model
            })
        }).catch(err => {
            throw new Error(`無法連接到 Bridge Server。請確認後端服務已啟動。`);
        });

        if (!response.ok) {
            const errData = await response.json().catch(() => ({}));
            throw new Error(errData.error || `Server Error ${response.status}`);
        }

        const result = await response.json();

        removeTypingIndicator(); // 移除打字狀態

        // 處理日誌
        if (result.logs) {
            console.log("[Bridge Logs]", result.logs);
            // 可以選擇將部分日誌顯示在 Terminal
            const logLines = result.logs.split('\n').filter(l => l.trim());
            logLines.slice(-5).forEach(l => logTerminal(`[Bridge] ${l}`, 'info'));
        }

        if (result.correctedCode) {
            const oldLines = state.generatedCode.split('\n').length;
            const newLines = result.correctedCode.split('\n').length;

            // 檢查是否有變更
            if (result.correctedCode.trim() === state.generatedCode.trim()) {
                addChatMessage('✅ **驗證通過！** Agent 未發現需要修復的錯誤。');
                logTerminal('✓ Verification Passed - No changes', 'success');
            } else {
                state.generatedCode = result.correctedCode;
                updateCodeSection(state.generatedCode);
                addChatMessage(`
                    <div class="bg-indigo-900/40 border border-indigo-500/50 p-4 rounded-lg">
                        <h3 class="text-indigo-400 font-bold text-lg mb-2">🔧 代碼已精確修正</h3>
                        <div class="text-sm text-gray-300 space-y-1">
                            <p>Agent 已完成深度驗證並自動修復了問題。</p>
                            <p class="text-xs text-gray-500">變更: ${oldLines} 行 → ${newLines} 行</p>
                        </div>
                        <div class="mt-3">
                            <button onclick="runDynamicTests()" class="text-xs bg-indigo-600 hover:bg-indigo-500 px-3 py-1.5 rounded text-white">立即測試修復版本</button>
                        </div>
                    </div>
                 `);
                logTerminal(`✓ Code Corrected (${newLines} lines)`, 'success');
            }
        }

    } catch (err) {
        removeTypingIndicator();
        console.error("Bridge Error:", err);
        addChatMessage(`
            <div class="bg-red-900/30 border border-red-500/50 p-3 rounded text-sm text-red-200">
                <strong>❌ 驗證失敗</strong><br/>
                ${err.message}
                <div class="mt-2 text-xs text-gray-400 bg-black/40 p-2 rounded">
                    提示: 請在終端機執行 <code>.\\start-precision-bridge.ps1</code> 以啟動本地服務器。
                </div>
            </div>
        `, false);
        logTerminal(`✗ Bridge Error: ${err.message}`, 'error');
    } finally {
        btn.innerHTML = originalText;
        btn.disabled = false;
    }
}

// ═══════════════════════════════════════════════════════════════════════════
// 📦 MODULE EXPORTS (Expose to global scope)
// ═══════════════════════════════════════════════════════════════════════════

// 標記模組已載入
window.AUTO_FIX_MODULE_LOADED = true;

// 導出函數到全域 (覆蓋式)
window.autoFixFromTestResults = autoFixFromTestResults;
window.regenerateWithFeedback = regenerateWithFeedback;
window.verifyCodeWithBridge = verifyCodeWithBridge;

console.log('[AUTO-FIX MODULE] 🔧 Functions exported to global scope:');
console.log('  - autoFixFromTestResults()');
console.log('  - regenerateWithFeedback()');
console.log('  - verifyCodeWithBridge()');
