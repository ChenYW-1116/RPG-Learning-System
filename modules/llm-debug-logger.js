/**
 * ═══════════════════════════════════════════════════════════════════════════
 * 🔍 LLM DEBUG LOGGER MODULE
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * 專用於追蹤和記錄與 LLM 的所有通信過程
 * 包含：Prompt 構建、API 請求、回應解析、技能載入
 * 
 * @version 1.0.0
 * @author Spec Kit Agent
 * ═══════════════════════════════════════════════════════════════════════════
 */

const LLMDebugLogger = {
    // ═══════════════════════════════════════════════════════════════════════
    // 配置選項
    // ═══════════════════════════════════════════════════════════════════════
    config: {
        enabled: true,
        logToConsole: true,
        logToFile: true,
        logPrompts: true,           // 是否記錄完整 Prompt
        logResponses: true,         // 是否記錄完整 Response
        logSkillLoading: true,      // 是否記錄技能載入過程
        maxPromptPreview: 2000,     // Prompt 預覽最大字符數
        maxResponsePreview: 1000,   // Response 預覽最大字符數
        colorEnabled: true          // 是否使用顏色輸出
    },

    // 日誌緩衝區
    _buffer: [],
    _sessionId: null,
    _requestCounter: 0,

    // ═══════════════════════════════════════════════════════════════════════
    // 初始化
    // ═══════════════════════════════════════════════════════════════════════
    init(options = {}) {
        Object.assign(this.config, options);
        this._buffer = [];
        this._sessionId = `LLM-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
        this._requestCounter = 0;

        this._logHeader('🔍 LLM Debug Logger 已啟動');
        this._log('CONFIG', `Session ID: ${this._sessionId}`);
        this._log('CONFIG', `設定: logPrompts=${this.config.logPrompts}, logResponses=${this.config.logResponses}`);
    },

    // ═══════════════════════════════════════════════════════════════════════
    // 技能載入追蹤
    // ═══════════════════════════════════════════════════════════════════════

    /**
     * 記錄技能發現階段開始
     */
    startSkillDiscovery(skillNames) {
        if (!this.config.logSkillLoading) return;

        this._logSection('🔌 SKILL DISCOVERY 階段開始');
        this._log('SKILL', `待載入技能清單 (${skillNames.length} 個):`);
        skillNames.forEach((name, i) => {
            this._log('SKILL', `  [${i + 1}] ${name}`);
        });
    },

    /**
     * 記錄單個技能載入
     */
    logSkillLoad(skillName, status, details = {}) {
        if (!this.config.logSkillLoading) return;

        const statusIcon = status === 'success' ? '✅' : status === 'warn' ? '⚠️' : '❌';
        const color = status === 'success' ? '#22c55e' : status === 'warn' ? '#eab308' : '#ef4444';

        this._log('SKILL', `${statusIcon} ${skillName}`, { color, ...details });

        if (details.path) {
            this._log('SKILL', `   📂 Path: ${details.path}`);
        }
        if (details.contentLength) {
            this._log('SKILL', `   📏 Content: ${details.contentLength} bytes`);
        }
        if (details.hasGlueCode) {
            this._log('SKILL', `   🔗 膠水代碼: 已識別`);
        }
    },

    /**
     * 記錄技能載入完成
     */
    endSkillDiscovery(loadedSkills, totalContent) {
        if (!this.config.logSkillLoading) return;

        this._log('SKILL', `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
        this._log('SKILL', `✅ 技能載入完成: ${loadedSkills.length} 個成功`);
        this._log('SKILL', `📦 總技能內容大小: ${(totalContent.length / 1024).toFixed(2)} KB`);
    },

    // ═══════════════════════════════════════════════════════════════════════
    // Prompt 構建追蹤
    // ═══════════════════════════════════════════════════════════════════════

    /**
     * 記錄 Prompt 構建階段
     */
    logPromptBuild(options) {
        if (!this.config.logPrompts) return;

        this._logSection('📝 PROMPT 構建階段');

        this._log('PROMPT', `模板類型: ${options.templateType || 'implement'}`);
        this._log('PROMPT', `上下文組件:`);

        if (options.context) {
            const ctx = options.context;
            this._log('PROMPT', `  📄 Spec: ${ctx.spec ? `${(ctx.spec.length / 1024).toFixed(1)} KB` : '(無)'}`);
            this._log('PROMPT', `  📋 Plan: ${ctx.plan ? `${(ctx.plan.length / 1024).toFixed(1)} KB` : '(無)'}`);
            this._log('PROMPT', `  ✅ Tasks: ${ctx.tasks ? `${(ctx.tasks.length / 1024).toFixed(1)} KB` : '(無)'}`);
            this._log('PROMPT', `  📜 Constitution: ${ctx.constitution ? `${(ctx.constitution.length / 1024).toFixed(1)} KB` : '(無)'}`);
            this._log('PROMPT', `  🔍 Analysis: ${ctx.analysis ? `${(ctx.analysis.length / 1024).toFixed(1)} KB` : '(無)'}`);
            this._log('PROMPT', `  🧪 Test Script: ${ctx.testScript ? `${(ctx.testScript.length / 1024).toFixed(1)} KB` : '(無)'}`);
        }

        if (options.skills) {
            this._log('PROMPT', `  🔌 Skills 內容: ${(options.skills.length / 1024).toFixed(1)} KB`);
        }
    },

    /**
     * 記錄最終 Prompt (可選顯示完整內容)
     */
    logFinalPrompt(prompt, showFullContent = false) {
        if (!this.config.logPrompts) return;

        this._log('PROMPT', `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
        this._log('PROMPT', `📦 最終 Prompt 大小: ${(prompt.length / 1024).toFixed(2)} KB (${prompt.length} chars)`);

        if (showFullContent || this.config.logPrompts === 'full') {
            this._log('PROMPT', `\n${'═'.repeat(60)}`);
            this._log('PROMPT', `FULL PROMPT CONTENT:`);
            this._log('PROMPT', `${'═'.repeat(60)}\n`);
            this._log('PROMPT', prompt);
            this._log('PROMPT', `\n${'═'.repeat(60)}`);
        } else {
            // 預覽模式
            const preview = prompt.substring(0, this.config.maxPromptPreview);
            this._log('PROMPT', `📋 預覽 (前 ${this.config.maxPromptPreview} 字符):`);
            this._log('PROMPT', `${'─'.repeat(40)}`);
            this._log('PROMPT', preview + (prompt.length > this.config.maxPromptPreview ? '\n... [已截斷]' : ''));
            this._log('PROMPT', `${'─'.repeat(40)}`);
        }
    },

    // ═══════════════════════════════════════════════════════════════════════
    // API 請求追蹤
    // ═══════════════════════════════════════════════════════════════════════

    /**
     * 記錄 API 請求開始
     */
    logAPIRequest(options) {
        this._requestCounter++;
        const reqId = `REQ-${this._requestCounter.toString().padStart(3, '0')}`;

        this._logSection(`🌐 API REQUEST ${reqId}`);

        this._log('API', `📍 Provider: ${options.provider || 'unknown'}`);
        this._log('API', `🤖 Model: ${options.model}`);
        this._log('API', `🔑 API Key: ${options.apiKey ? options.apiKey.substring(0, 8) + '...' : '(無)'}`);
        this._log('API', `📡 URL: ${options.url ? options.url.split('?')[0] : '(default)'}`);

        if (options.systemPrompt) {
            this._log('API', `📋 System Prompt: ${options.systemPrompt.substring(0, 100)}...`);
        }

        if (options.promptSize) {
            this._log('API', `📦 Request Size: ${(options.promptSize / 1024).toFixed(2)} KB`);
        }

        this._log('API', `⏱️ 請求時間: ${new Date().toISOString()}`);

        return reqId;
    },

    /**
     * 記錄 API 回應
     */
    logAPIResponse(reqId, response, options = {}) {
        if (!this.config.logResponses) return;

        this._log('API', `━━━━━━━━━━ ${reqId} RESPONSE ━━━━━━━━━━`);

        if (options.success) {
            this._log('API', `✅ 請求成功`, { color: '#22c55e' });
            this._log('API', `📦 Response Size: ${response ? (response.length / 1024).toFixed(2) + ' KB' : '(empty)'}`);
            this._log('API', `⏱️ 耗時: ${options.duration ? options.duration + 'ms' : 'N/A'}`);

            if (response && this.config.logResponses === 'full') {
                this._log('API', `\n${'─'.repeat(40)}`);
                this._log('API', response);
                this._log('API', `${'─'.repeat(40)}\n`);
            } else if (response) {
                const preview = response.substring(0, this.config.maxResponsePreview);
                this._log('API', `📋 Response 預覽:`);
                this._log('API', preview + (response.length > this.config.maxResponsePreview ? '\n... [已截斷]' : ''));
            }
        } else {
            this._log('API', `❌ 請求失敗`, { color: '#ef4444' });
            this._log('API', `📛 錯誤: ${options.error || 'Unknown error'}`);
            if (options.statusCode) {
                this._log('API', `📊 HTTP Status: ${options.statusCode}`);
            }
        }
    },

    /**
     * 記錄 API 重試
     */
    logAPIRetry(reason, attempt, maxAttempts, waitTime) {
        this._log('API', `⚠️ 重試 (${attempt}/${maxAttempts})`, { color: '#eab308' });
        this._log('API', `   原因: ${reason}`);
        this._log('API', `   等待: ${(waitTime / 1000).toFixed(1)} 秒`);
    },

    // ═══════════════════════════════════════════════════════════════════════
    // 膠水代碼追蹤
    // ═══════════════════════════════════════════════════════════════════════

    /**
     * 記錄膠水合約生成
     */
    logGlueContract(loadedSkills, contractPrompt) {
        this._logSection('🔗 GLUE CODE CONTRACT');

        this._log('GLUE', `已載入技能: ${loadedSkills.join(', ')}`);
        this._log('GLUE', `合約 Prompt 大小: ${contractPrompt.length} chars`);

        if (contractPrompt.length < 500) {
            this._log('GLUE', `合約內容:\n${contractPrompt}`);
        }
    },

    // ═══════════════════════════════════════════════════════════════════════
    // Phase 追蹤 (Optimization Loop)
    // ═══════════════════════════════════════════════════════════════════════

    /**
     * 記錄 Phase 1: 逆向工程
     */
    logPhase1Start(codeSize) {
        this._logSection('🔄 OPTIMIZATION LOOP - PHASE 1');
        this._log('PHASE1', `輸入代碼大小: ${(codeSize / 1024).toFixed(2)} KB`);
        this._log('PHASE1', `目標: 將 HTML 代碼轉換為規格文檔`);
    },

    logPhase1End(specSize) {
        this._log('PHASE1', `✅ Phase 1 完成`);
        this._log('PHASE1', `生成規格大小: ${(specSize / 1024).toFixed(2)} KB`);
    },

    /**
     * 記錄 Phase 2: 重新生成
     */
    logPhase2Start(specSize) {
        this._logSection('🔄 OPTIMIZATION LOOP - PHASE 2');
        this._log('PHASE2', `輸入規格大小: ${(specSize / 1024).toFixed(2)} KB`);
        this._log('PHASE2', `目標: 從規格重新生成優化版 HTML`);
    },

    logPhase2End(codeSize, source) {
        this._log('PHASE2', `✅ Phase 2 完成`);
        this._log('PHASE2', `輸出代碼大小: ${(codeSize / 1024).toFixed(2)} KB`);
        this._log('PHASE2', `最終來源: ${source}`);
    },

    // ═══════════════════════════════════════════════════════════════════════
    // 內部輔助方法
    // ═══════════════════════════════════════════════════════════════════════

    _logHeader(message) {
        this._log('SYSTEM', `\n${'═'.repeat(60)}`);
        this._log('SYSTEM', message);
        this._log('SYSTEM', `${'═'.repeat(60)}\n`);
    },

    _logSection(title) {
        this._log('SECTION', `\n${'━'.repeat(50)}`);
        this._log('SECTION', title);
        this._log('SECTION', `${'━'.repeat(50)}`);
    },

    _log(module, message, options = {}) {
        if (!this.config.enabled) return;

        const timestamp = new Date().toISOString().split('T')[1].split('.')[0];
        const entry = {
            timestamp,
            module,
            message,
            ...options
        };

        this._buffer.push(entry);

        if (this.config.logToConsole) {
            const prefix = `[${timestamp}][${module.padEnd(8)}]`;

            if (typeof window !== 'undefined' && this.config.colorEnabled) {
                // 瀏覽器環境 - 彩色輸出
                const colors = {
                    SYSTEM: 'color: #a855f7',
                    SECTION: 'color: #06b6d4; font-weight: bold',
                    SKILL: 'color: #8b5cf6',
                    PROMPT: 'color: #3b82f6',
                    API: 'color: #10b981',
                    GLUE: 'color: #f59e0b',
                    PHASE1: 'color: #ec4899',
                    PHASE2: 'color: #14b8a6',
                    CONFIG: 'color: #6b7280'
                };
                const style = options.color ? `color: ${options.color}` : (colors[module] || 'color: #9ca3af');
                console.log(`%c${prefix} ${message}`, style);
            } else {
                // Node.js 環境或無色模式
                console.log(`${prefix} ${message}`);
            }
        }
    },

    // ═══════════════════════════════════════════════════════════════════════
    // 導出功能
    // ═══════════════════════════════════════════════════════════════════════

    /**
     * 導出完整日誌為文本
     */
    exportAsText() {
        const lines = [
            '═══════════════════════════════════════════════════════════════════════════',
            '                    LLM DEBUG LOG - ' + this._sessionId,
            '                    Generated: ' + new Date().toISOString(),
            '═══════════════════════════════════════════════════════════════════════════',
            '',
        ];

        for (const entry of this._buffer) {
            lines.push(`[${entry.timestamp}][${entry.module.padEnd(8)}] ${entry.message}`);
        }

        lines.push('');
        lines.push('═══════════════════════════════════════════════════════════════════════════');
        lines.push('                              END OF LOG');
        lines.push('═══════════════════════════════════════════════════════════════════════════');

        return lines.join('\n');
    },

    /**
     * 下載日誌文件
     */
    downloadLog(filename = 'llm-debug.log') {
        if (typeof window === 'undefined') {
            console.warn('[LLMDebugLogger] downloadLog only works in browser environment');
            return;
        }

        const content = this.exportAsText();
        const blob = new Blob([content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);

        this._log('SYSTEM', `📥 日誌已下載: ${filename}`);
    },

    /**
     * 獲取日誌摘要
     */
    getSummary() {
        return {
            sessionId: this._sessionId,
            totalEntries: this._buffer.length,
            totalRequests: this._requestCounter,
            byModule: this._buffer.reduce((acc, entry) => {
                acc[entry.module] = (acc[entry.module] || 0) + 1;
                return acc;
            }, {})
        };
    },

    /**
     * 清空日誌
     */
    clear() {
        this._buffer = [];
        this._requestCounter = 0;
        this._log('SYSTEM', '日誌已清空');
    }
};

// 自動初始化
LLMDebugLogger.init();

// ═══════════════════════════════════════════════════════════════════════════
// 導出模組
// ═══════════════════════════════════════════════════════════════════════════

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { LLMDebugLogger };
}

if (typeof window !== 'undefined') {
    window.LLMDebugLogger = LLMDebugLogger;
}
