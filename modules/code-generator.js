/**
 * ═══════════════════════════════════════════════════════════════════════════
 * 🔧 CODE GENERATOR MODULE
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * 模組化的代碼生成器，負責 /implement 指令中的核心代碼生成邏輯
 * 
 * 主要功能：
 * 1. Prompt 構建 (PromptBuilder)
 * 2. AI API 調用與自動續寫 (CodeGenerationPipeline) 
 * 3. HTML 代碼提取與清理 (CodeExtractor)
 * 4. 逆向工程優化循環 (OptimizationLoop)
 * 
 * ═══════════════════════════════════════════════════════════════════════════
 * 🔌 SKILL MOUNTING MANIFEST
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * @slot:api_service_layer
 *   - Skill: gemini-api-wrapper
 *   - Mode: Reference
 *   - Purpose: 封裝 Gemini API 調用，提供指數退避重試機制
 * 
 * @slot:logging_system
 *   - Module: CodeGenLogger
 *   - Purpose: 統一日誌系統，支持 console + 文件輸出
 * 
 * @author Spec Kit Agent
 * @version 1.2.0 - 新增日誌系統和調試點
 */

// ═══════════════════════════════════════════════════════════════════════════
// @slot:logging_system - 統一日誌系統
// ═══════════════════════════════════════════════════════════════════════════

/**
 * 🔍 CodeGenLogger - 代碼生成日誌系統
 * 
 * 功能：
 * 1. 多級別日誌 (DEBUG, INFO, WARN, ERROR)
 * 2. Console 彩色輸出
 * 3. 日誌文件生成 (瀏覽器環境可下載)
 * 4. 執行時間追蹤
 * 5. 調試點標記
 */
const CodeGenLogger = {
    // 日誌級別
    LEVELS: {
        DEBUG: 0,
        INFO: 1,
        WARN: 2,
        ERROR: 3
    },

    // 配置
    config: {
        level: 0,           // 預設顯示所有級別
        enableConsole: true,
        enableBuffer: true,  // 是否緩存日誌用於導出
        maxBufferSize: 1000,
        showTimestamp: true,
        showModule: true
    },

    // 日誌緩衝區
    _buffer: [],
    _startTime: null,
    _checkpoints: {},

    /**
     * 初始化 Logger
     * @param {Object} options - 配置選項
     */
    init(options = {}) {
        Object.assign(this.config, options);
        this._buffer = [];
        this._startTime = performance.now();
        this._checkpoints = {};
        this._log('INFO', 'LOGGER', '═══════════════════════════════════════════════════════');
        this._log('INFO', 'LOGGER', `🚀 CodeGenLogger 初始化 @ ${new Date().toISOString()}`);
        this._log('INFO', 'LOGGER', `   Level: ${Object.keys(this.LEVELS)[this.config.level]}`);
        this._log('INFO', 'LOGGER', '═══════════════════════════════════════════════════════');
    },

    /**
     * 內部日誌方法
     */
    _log(level, module, message, data = null) {
        const levelNum = this.LEVELS[level] ?? 1;
        if (levelNum < this.config.level) return;

        const elapsed = this._startTime ? ((performance.now() - this._startTime) / 1000).toFixed(3) : '0.000';
        const timestamp = this.config.showTimestamp ? `[${elapsed}s]` : '';
        const moduleTag = this.config.showModule ? `[${module}]` : '';

        const entry = {
            time: new Date().toISOString(),
            elapsed,
            level,
            module,
            message,
            data
        };

        // 緩衝區
        if (this.config.enableBuffer) {
            this._buffer.push(entry);
            if (this._buffer.length > this.config.maxBufferSize) {
                this._buffer.shift();
            }
        }

        // Console 輸出
        if (this.config.enableConsole) {
            const colors = {
                DEBUG: '\x1b[36m',   // Cyan
                INFO: '\x1b[32m',    // Green
                WARN: '\x1b[33m',    // Yellow
                ERROR: '\x1b[31m',   // Red
                RESET: '\x1b[0m'
            };

            const prefix = `${colors[level] || ''}${timestamp} ${moduleTag} [${level}]${colors.RESET}`;

            if (typeof window !== 'undefined') {
                // 瀏覽器環境
                const browserStyles = {
                    DEBUG: 'color: #06b6d4',
                    INFO: 'color: #22c55e',
                    WARN: 'color: #eab308',
                    ERROR: 'color: #ef4444; font-weight: bold'
                };
                console.log(`%c${timestamp} ${moduleTag} [${level}]`, browserStyles[level], message, data || '');
            } else {
                // Node.js 環境
                if (data) {
                    console.log(prefix, message, data);
                } else {
                    console.log(prefix, message);
                }
            }
        }
    },

    // 便捷方法
    debug(module, message, data) { this._log('DEBUG', module, message, data); },
    info(module, message, data) { this._log('INFO', module, message, data); },
    warn(module, message, data) { this._log('WARN', module, message, data); },
    error(module, message, data) { this._log('ERROR', module, message, data); },

    /**
     * 🔖 檢查點 - 標記執行階段
     * @param {string} name - 檢查點名稱
     * @param {string} description - 描述
     */
    checkpoint(name, description = '') {
        const now = performance.now();
        const elapsed = this._startTime ? ((now - this._startTime) / 1000).toFixed(3) : '0.000';

        // 計算與上一個檢查點的差異
        const lastCheckpoint = Object.values(this._checkpoints).pop();
        const delta = lastCheckpoint ? ((now - lastCheckpoint.time) / 1000).toFixed(3) : elapsed;

        this._checkpoints[name] = { time: now, description };

        this._log('INFO', 'CHECKPOINT', `════════════════════════════════════════`);
        this._log('INFO', 'CHECKPOINT', `🔖 [${name}] ${description}`);
        this._log('INFO', 'CHECKPOINT', `   ⏱️ 總耗時: ${elapsed}s | 階段耗時: ${delta}s`);
        this._log('INFO', 'CHECKPOINT', `════════════════════════════════════════`);
    },

    /**
     * 📊 導出日誌為文本
     * @returns {string} 格式化的日誌文本
     */
    exportAsText() {
        const lines = [
            '═══════════════════════════════════════════════════════════════════════════',
            '                    CODE GENERATOR EXECUTION LOG',
            `                    Generated: ${new Date().toISOString()}`,
            '═══════════════════════════════════════════════════════════════════════════',
            ''
        ];

        for (const entry of this._buffer) {
            const line = `[${entry.elapsed}s] [${entry.level.padEnd(5)}] [${entry.module.padEnd(15)}] ${entry.message}`;
            lines.push(line);
            if (entry.data) {
                lines.push(`         └─ Data: ${JSON.stringify(entry.data).substring(0, 200)}...`);
            }
        }

        lines.push('');
        lines.push('═══════════════════════════════════════════════════════════════════════════');
        lines.push('                              END OF LOG');
        lines.push('═══════════════════════════════════════════════════════════════════════════');

        return lines.join('\n');
    },

    /**
     * 📥 下載日誌文件 (瀏覽器環境)
     * @param {string} filename - 文件名
     */
    downloadLog(filename = 'code-generator.log') {
        if (typeof window === 'undefined') {
            console.warn('[Logger] downloadLog only works in browser environment');
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

        this.info('LOGGER', `📥 日誌已下載: ${filename}`);
    },

    /**
     * 💾 保存日誌到文件 (Node.js 環境)
     * @param {string} filepath - 文件路徑
     */
    async saveToFile(filepath = './code-generator.log') {
        if (typeof require === 'undefined') {
            console.warn('[Logger] saveToFile only works in Node.js environment');
            return;
        }

        try {
            const fs = require('fs').promises;
            const content = this.exportAsText();
            await fs.writeFile(filepath, content, 'utf-8');
            this.info('LOGGER', `💾 日誌已保存: ${filepath}`);
        } catch (e) {
            this.error('LOGGER', `保存日誌失敗: ${e.message}`);
        }
    },

    /**
     * 📋 獲取日誌摘要
     * @returns {Object} 摘要對象
     */
    getSummary() {
        const summary = {
            totalEntries: this._buffer.length,
            byLevel: { DEBUG: 0, INFO: 0, WARN: 0, ERROR: 0 },
            checkpoints: Object.keys(this._checkpoints),
            totalDuration: this._startTime ? ((performance.now() - this._startTime) / 1000).toFixed(3) + 's' : 'N/A'
        };

        for (const entry of this._buffer) {
            summary.byLevel[entry.level] = (summary.byLevel[entry.level] || 0) + 1;
        }

        return summary;
    },

    /**
     * 🧹 清空日誌
     */
    clear() {
        this._buffer = [];
        this._checkpoints = {};
        this._startTime = performance.now();
        this.info('LOGGER', '日誌已清空');
    }
};

// 自動初始化
CodeGenLogger.init();

// ═══════════════════════════════════════════════════════════════════════════
// END @slot:logging_system
// ═══════════════════════════════════════════════════════════════════════════

// ═══════════════════════════════════════════════════════════════════════════
// @slot:api_service_layer - Gemini API Wrapper (掛載自 gemini-api-wrapper skill)
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Gemini API Wrapper with Exponential Backoff Retry
 * 來源: .agent/skills/gemini-api-wrapper/SKILL.md
 * 
 * @class GeminiAPIWrapper
 */
class GeminiAPIWrapper {
    constructor(config = {}) {
        this.apiKey = config.apiKey || "";
        this.model = config.model || "gemini-3-flash-preview";
        this.retryDelays = config.retryDelays || [1000, 2000, 4000];
        this.baseUrl = "https://generativelanguage.googleapis.com/v1beta/models";
    }

    /**
     * 調用 Gemini API（符合 skill 接口契約）
     * @param {string} prompt - 用戶提示詞
     * @param {string} systemPrompt - 系統指令
     * @param {boolean} useJson - 是否返回 JSON 格式
     * @param {Object} genConfig - 額外的生成配置
     * @returns {Promise<{success: boolean, data?: any, error?: string}>}
     */
    async call(prompt, systemPrompt, useJson = true, genConfig = {}) {
        if (typeof GeminiKeyManager !== 'undefined') {
            await GeminiKeyManager.checkQuotaAndAlert();
        }
        CodeGenLogger.debug('API', `🔌 GeminiAPIWrapper.call() 開始`, {
            model: this.model,
            useJson,
            promptLength: prompt?.length || 0,
            hasSystemPrompt: !!systemPrompt
        });

        const url = `/api/bridge/gemini`;

        const payload = {
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
                ...(useJson ? { responseMimeType: "application/json" } : {}),
                ...genConfig
            }
        };

        // 系統指令作為可選項
        if (systemPrompt) {
            payload.system_instruction = { parts: [{ text: systemPrompt }] };
        }

        // 指數退避重試邏輯
        for (let delay of [...this.retryDelays, 0]) {
            try {
                const response = await fetch(url, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        model: this.model,
                        contents: payload.contents,
                        generationConfig: payload.generationConfig,
                        system_instruction: payload.system_instruction,
                        key: this.apiKey.trim()
                    })
                });

                if (!response.ok) {
                    const errText = await response.text();
                    throw new Error(`HTTP ${response.status}: ${errText}`);
                }

                const data = await response.json();

                // 驗證響應結構
                if (!data.candidates?.[0]?.content?.parts?.[0]?.text) {
                    throw new Error("Invalid API response structure");
                }

                const text = data.candidates[0].content.parts[0].text;
                CodeGenLogger.info('API', `✅ API 調用成功`, {
                    responseLength: text?.length || 0,
                    useJson
                });
                return {
                    success: true,
                    data: useJson ? JSON.parse(text) : text
                };

            } catch (e) {
                CodeGenLogger.warn('API', `⚠️ API 調用失敗，準備重試`, {
                    error: e.message,
                    delay: delay,
                    willRetry: delay > 0
                });
                if (delay === 0) {
                    CodeGenLogger.error('API', `❌ 所有重試已耗盡`, { error: e.message });
                    return { success: false, error: e.message };
                }
                await new Promise(r => setTimeout(r, delay));
            }
        }

        return { success: false, error: "All retries exhausted" };
    }

    /**
     * 原始調用（為向後兼容保留）
     * @deprecated 使用 call() 代替
     */
    async rawCall(prompt, systemPrompt, genConfig = {}) {
        const result = await this.call(prompt, systemPrompt, false, genConfig);
        return result.success ? result.data : null;
    }

    setApiKey(key) { this.apiKey = key; }
    setModel(model) { this.model = model; }
}

// 創建單例實例供模組內部使用
let _geminiApiInstance = null;
const getGeminiApi = (config) => {
    if (!_geminiApiInstance || config) {
        _geminiApiInstance = new GeminiAPIWrapper(config);
    }
    return _geminiApiInstance;
};

// ═══════════════════════════════════════════════════════════════════════════
// END @slot:api_service_layer
// ═══════════════════════════════════════════════════════════════════════════

// ═══════════════════════════════════════════════════════════════════════════
// 🔧 PROMPT BUILDER - 負責構建代碼生成的 Prompt
// ═══════════════════════════════════════════════════════════════════════════

const PromptBuilder = {
    /**
     * 構建主要代碼生成 Prompt
     * @param {Object} options - 構建選項
     * @param {string} options.template - Prompt 模板
     * @param {Object} options.context - 上下文數據 (spec, plan, tasks 等)
     * @param {string} options.skills - 已載入的技能內容
     * @returns {string} 完整的 Prompt
     */
    buildImplementPrompt(options) {
        CodeGenLogger.checkpoint('PROMPT_BUILD', '開始構建 Implement Prompt');

        // 🔍 LLM DEBUG: Prompt 構建階段
        console.log('\n%c━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'color: #3b82f6');
        console.log('%c📝 PROMPT 構建階段', 'color: #3b82f6; font-weight: bold');
        console.log('%c━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'color: #3b82f6');

        const { template, context, skills = '' } = options;

        // 🔍 輸出上下文組件大小
        console.log('%c📋 上下文組件:', 'color: #3b82f6');
        const formatSize = (str) => str ? `${(str.length / 1024).toFixed(1)} KB` : '(無)';
        console.log(`%c   📄 Template: ${formatSize(template)}`, 'color: #6b7280');
        console.log(`%c   📄 Spec: ${formatSize(context.spec)}`, 'color: #6b7280');
        console.log(`%c   📋 Plan: ${formatSize(context.plan)}`, 'color: #6b7280');
        console.log(`%c   ✅ Tasks: ${formatSize(context.tasks)}`, 'color: #6b7280');
        console.log(`%c   📜 Constitution: ${formatSize(context.constitution)}`, 'color: #6b7280');
        console.log(`%c   🔍 Analysis: ${formatSize(context.analysis)}`, 'color: #6b7280');
        console.log(`%c   ✓ Checklist: ${formatSize(context.checklist)}`, 'color: #6b7280');
        console.log(`%c   🧪 Test Script: ${formatSize(context.testScript)}`, 'color: #6b7280');
        console.log(`%c   🔌 Skills: ${formatSize(skills)}`, 'color: #8b5cf6');

        let prompt = template;

        // 注入技能 (優先使用佔位符，否則智能插入)
        if (skills) {
            if (prompt.includes('{SKILLS}')) {
                prompt = prompt.replace('{SKILLS}', skills);
                console.log(`%c🔍 [DEBUG] Injected Skills into {SKILLS} placeholder`, 'color: #ec4899');
            } else {
                // 如果沒有佔位符，嘗試插入在 ## Action 之前
                const actionHeader = '## Action';
                if (prompt.includes(actionHeader)) {
                    prompt = prompt.replace(actionHeader, `\n${skills}\n\n${actionHeader}`);
                    console.log(`%c🔍 [DEBUG] Injected Skills before ## Action`, 'color: #ec4899');
                } else {
                    // Fallback: append to end
                    prompt += '\n\n' + skills;
                    console.log(`%c⚠️ [DEBUG] Appended Skills to end (Action header not found)`, 'color: #f59e0b');
                }
            }

            if (skills.length > 0) {
                console.log(`%c   Content Preview: ${skills.substring(0, 200).replace(/\n/g, ' ')}...`, 'color: #fce7f3');
            }
        } else {
            // 如果沒有技能內容，也要清理佔位符
            prompt = prompt.replace('{SKILLS}', '(無其他技能)');
            console.log(`%c⚠️ [DEBUG] No Skills content to inject!`, 'color: #f59e0b');
        }

        // 替換上下文變量
        prompt = prompt
            .replace('{SPEC}', context.spec || '(未提供)')
            .replace('{PLAN}', context.plan || '(未提供)')
            .replace('{TASKS}', context.tasks || '(未提供)')
            .replace('{CONSTITUTION}', context.constitution || '(未提供)')
            .replace('{ANALYSIS}', context.analysis || '(未提供)')
            .replace('{CHECKLIST}', context.checklist || '(未提供)')
            .replace('{TEST_SCRIPT}', context.testScript || '(未提供)');

        // 🔍 LLM DEBUG: 最終 Prompt 統計
        console.log('\n%c📦 最終 Prompt 統計:', 'color: #3b82f6; font-weight: bold');
        console.log(`%c   總大小: ${(prompt.length / 1024).toFixed(2)} KB (${prompt.length} chars)`, 'color: #22c55e');
        console.log(`%c   預估 Tokens: ~${Math.ceil(prompt.length / 4)}`, 'color: #6b7280');

        // 🔍 顯示 Prompt 預覽 (前 500 字符)
        console.log('\n%c📋 Prompt 預覽 (前 500 字符):', 'color: #3b82f6');
        console.log('%c─────────────────────────────────────────────', 'color: #3b82f6');
        console.log(`%c${prompt.substring(0, 500)}...`, 'color: #9ca3af; font-size: 11px');
        console.log('%c─────────────────────────────────────────────', 'color: #3b82f6');

        // 🔍 顯示 Prompt 尾部預覽 (後 300 字符) - 檢查膠水合約
        console.log('\n%c📋 Prompt 尾部預覽 (後 500 字符):', 'color: #3b82f6');
        console.log('%c─────────────────────────────────────────────', 'color: #3b82f6');
        console.log(`%c...${prompt.substring(prompt.length - 500)}`, 'color: #9ca3af; font-size: 11px');
        console.log('%c━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n', 'color: #3b82f6');

        CodeGenLogger.debug('PROMPT', `📝 PromptBuilder.buildImplementPrompt()`, {
            hasTemplate: !!options.template,
            contextKeys: Object.keys(options.context || {}),
            skillsLength: (options.skills || '').length,
            finalPromptLength: prompt.length
        });

        return prompt;
    },

    /**
     * 構建續寫 Prompt
     * @param {string} lastCodeSegment - 上一次生成的代碼片段
     * @returns {string} 續寫 Prompt
     */
    buildContinuationPrompt(lastCodeSegment) {
        const lastChars = lastCodeSegment.slice(-500).replace(/\n/g, ' ');
        return `The previous output was truncated because of length limits.
Please CONTINUE generating the HTML code EXACTLY from where it stopped.

The last part of the code was ending with:
"...${lastChars}"

INSTRUCTIONS:
1. Do NOT repeat the last part provided above.
2. Start immediately with the next character.
3. Output ONLY the remaining code.`;
    },

    /**
     * 構建 Phase 2 優化 Prompt
     * @param {string} reverseSpec - 逆向工程生成的規格
     * @returns {string} Phase 2 Prompt
     */
    buildPhase2Prompt(reverseSpec) {
        return `You are an Elite Full-Stack Engineer specializing in Single-File Executables.

Your goal is to implement the SPECIFICATION below into a **SINGLE, SELF-CONTAINED HTML FILE**.

--- 🏗️ STRICT FILE STRUCTURE (MANDATORY) ---
You MUST follow this exact structure. DO NOT create separate files.

<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <!-- Tailwind CDN -->
    <script src="https://cdn.tailwindcss.com"><\\/script>
    <!-- Fonts -->
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
    <style>
        body { font-family: 'Inter', sans-serif; }
        /* PUT ALL YOUR CUSTOM CSS HERE */
    </style>
</head>
<body class="bg-gray-50 text-gray-800">
    <!-- PUT YOUR HTML UI COMPONENTS HERE -->

    <script>
        // PUT ALL YOUR JAVASCRIPT LOGIC HERE
        // DATA, STATE, FUNCTIONS, EVENTS - EVERYTHING
    <\\/script>
</body>
</html>

--- 🎨 VISUAL VISUAL REFERENCE (MIMIC THIS EXACTLY) ---
1. **Colors**: Primary 'bg-indigo-600', Background 'bg-gray-50'.
2. **Cards**: class="bg-white rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 p-6"
3. **Buttons**: class="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2.5 px-5 rounded-lg active:scale-95"
4. **Charts**: Use raw <svg> logic inside the script. NO PLACEHOLDERS.

--- FUNCTIONAL REQUIREMENTS ---
1. **No External Requests**: Except for Tailwind/Fonts CDN.
2. **Full Logic**: Implement the complete chart rendering and state management in the <script> block.

--- SPECIFICATION ---
${reverseSpec}

--- 🚫 ANTI-HALLUCINATION & INTEGRITY PROTOCOLS ---
1. **NO Phantom Classes**: Do NOT instantiate classes that are not defined in the script (e.g., usually 'new Application()' or 'new TestRunner()' are hallucinations).
2. **Clean End-of-File**: The script MUST end strictly with the application initialization (e.g., 'document.addEventListener("DOMContentLoaded", init);'). Do NOT append incomplete or "example" test suites after the main logic.
3. **Object Initialization Safety**: When defining the main \`app\` object, you MUST explicitly initialize all sub-objects (e.g., \`router: {}, handlers: {}\`) to prevent "Cannot set properties of undefined" errors later.
4. **Strict Syntax Compliance**: Do NOT include Markdown tags (like \`\`\`javascript) inside the <script> tag. The <script> content must be valid, executable JavaScript only.
5. **Standardized Test Hook**: If E2E testing support is required, ONLY add this exact hook at the end:
   \`\`\`javascript
   window.injectTestRunner = function(runner) {
       // Allow external tools to access the app instance
       runner.app = app; 
       console.log("🧪 Test Runner Hook Injected");
   };
   \`\`\`
6. **Verification**: Before outputting '<\\/html>', verify that the last 20 lines of code do not contain 'new TestRunner(...)' or undefined variable references.

--- EXECUTION ---
GENERATE THE HTML CODE NOW. USE THE STRUCTURE ABOVE.`;
    },

    /**
     * 構建 Phase 2 續寫 Prompt  
     * @param {string} lastSegment - 上一次生成的代碼片段
     * @returns {string} Phase 2 續寫 Prompt
     */
    buildPhase2ContinuationPrompt(lastSegment) {
        const lastChars = lastSegment.slice(-500).replace(/\n/g, ' ');
        return `The previous output was truncated.
Please CONTINUE generating the HTML code EXACTLY from where it stopped.

The last part was:
"...${lastChars}"

INSTRUCTIONS:
1. Do NOT repeat the last part.
2. Start immediately with the next character.
3. Output ONLY the remaining code.`;
    }
};

// ═══════════════════════════════════════════════════════════════════════════
// 🧹 CODE EXTRACTOR - 負責從 AI 回應中提取和清理 HTML 代碼
// ═══════════════════════════════════════════════════════════════════════════

const CodeExtractor = {
    /**
     * 移除 AI 思考標籤
     * @param {string} code - 原始代碼
     * @returns {string} 清理後的代碼
     */
    removeThinkTags(code) {
        return code.replace(/<think>[\s\S]*?<\/think>/gi, '');
    },

    /**
     * 移除 Markdown 代碼塊標記
     * @param {string} code - 原始代碼
     * @returns {string} 清理後的代碼
     */
    removeMarkdownCodeBlocks(code) {
        return code.replace(/```html/g, '').replace(/```/g, '').trim();
    },

    /**
     * 移除續寫時的開頭 Markdown 標記
     * @param {string} code - 原始代碼
     * @returns {string} 清理後的代碼
     */
    removeContinuationPrefix(code) {
        return code.replace(/^\s*```html\s*/i, '').replace(/^\s*```\s*/i, '');
    },

    /**
     * 從回應中提取完整 HTML
     * @param {string} response - AI 回應
     * @returns {{ html: string, extracted: boolean }} 提取結果
     */
    extractHTML(response) {
        const cleaned = this.removeThinkTags(response);

        // 嘗試精確匹配完整 HTML
        const htmlMatch = cleaned.match(/<!DOCTYPE html>[\s\S]*?<\/html>/i)
            || cleaned.match(/<html[\s\S]*?<\/html>/i);

        if (htmlMatch) {
            return {
                html: this.removeMarkdownCodeBlocks(htmlMatch[0]),
                extracted: true
            };
        }

        // Fallback: 返回清理後的全部內容
        return {
            html: this.removeMarkdownCodeBlocks(cleaned),
            extracted: false
        };
    },

    /**
     * 檢查代碼是否完整 (包含 </html>)
     * @param {string} code - 代碼
     * @returns {boolean} 是否完整
     */
    isComplete(code) {
        return code.includes('</html>');
    }
};

// ═══════════════════════════════════════════════════════════════════════════
// 🔄 CODE GENERATION PIPELINE - 負責 AI 調用與自動續寫
// ═══════════════════════════════════════════════════════════════════════════

const CodeGenerationPipeline = {
    /**
     * 執行代碼生成（支援自動續寫）
     * @param {Object} options - 生成選項
     * @param {string} options.prompt - 初始 Prompt
     * @param {string} options.systemPrompt - 系統 Prompt
     * @param {Object} options.aiConfig - AI 配置 (model, key, url)
     * @param {Function} options.callAI - AI 調用函數
     * @param {number} options.maxRetries - 最大重試次數
     * @param {Object} options.logger - 日誌記錄器 (addLog, logTerminal)
     * @returns {Promise<{code: string, retryCount: number}>} 生成結果
     */
    async generate(options) {
        CodeGenLogger.checkpoint('PIPELINE_START', '代碼生成管線啟動');

        const {
            prompt,
            systemPrompt,
            aiConfig,
            callAI,
            maxRetries = 3,
            logger = { addLog: console.log, logTerminal: console.log }
        } = options;

        CodeGenLogger.info('PIPELINE', `🚀 CodeGenerationPipeline.generate() 開始`, {
            promptLength: prompt?.length || 0,
            maxRetries,
            model: aiConfig?.model
        });

        let fullResponse = "";
        let retryCount = 0;
        let finishGeneration = false;
        let nextPrompt = prompt;
        let lastCodeSegment = "";

        while (!finishGeneration && retryCount <= maxRetries) {
            // 續寫時構建新 Prompt
            if (retryCount > 0) {
                nextPrompt = PromptBuilder.buildContinuationPrompt(lastCodeSegment);
                logger.addLog && logger.addLog(`檢測到代碼截斷，正在請求續寫 (嘗試 ${retryCount}/${maxRetries})...`, 'warn', 'CODE-GEN');
                logger.logTerminal && logger.logTerminal(`   ⚠️ 代碼截斷，請求續寫...`, 'cmd');
            }

            // 調用 AI
            const chunk = await callAI(
                nextPrompt,
                systemPrompt,
                aiConfig.model,
                aiConfig.key,
                aiConfig.url
            );

            if (!chunk) break;

            // 清理回應
            let cleanChunk = CodeExtractor.removeThinkTags(chunk);
            if (retryCount > 0) {
                cleanChunk = CodeExtractor.removeContinuationPrefix(cleanChunk);
            }

            fullResponse += cleanChunk;
            lastCodeSegment = cleanChunk;

            // 檢查是否完成
            if (CodeExtractor.isComplete(fullResponse)) {
                finishGeneration = true;
                CodeGenLogger.info('PIPELINE', `✅ 代碼生成完成`, {
                    totalLength: fullResponse.length,
                    retryCount
                });
            } else {
                CodeGenLogger.warn('PIPELINE', `⚠️ 代碼截斷，準備續寫`, {
                    currentLength: fullResponse.length,
                    retryAttempt: retryCount + 1
                });
                retryCount++;
            }
        }

        CodeGenLogger.checkpoint('PIPELINE_END', '代碼生成管線結束');
        return { code: fullResponse, retryCount };
    },

    /**
     * 執行 Phase 2 原生 Gemini API 生成（支援自動續寫）
     * 
     * 🔌 現使用掛載的 @slot:api_service_layer (gemini-api-wrapper skill)
     * 主程式只負責：續寫邏輯、截斷檢測、代碼清理
     * API 調用已委託給 GeminiAPIWrapper (含重試機制)
     * 
     * @param {Object} options - 生成選項
     * @param {string} options.prompt - 初始 Prompt
     * @param {string} options.systemPrompt - 系統 Prompt
     * @param {string} options.model - 模型名稱
     * @param {string} options.apiKey - API Key
     * @param {number} options.maxRetries - 最大續寫次數
     * @param {number} options.temperature - 溫度參數
     * @param {number} options.maxOutputTokens - 最大輸出 Token 數
     * @param {Object} options.logger - 日誌記錄器
     * @returns {Promise<{code: string, retryCount: number}>} 生成結果
     */
    async generateWithNativeGemini(options) {
        CodeGenLogger.checkpoint('NATIVE_GEMINI_START', 'Native Gemini API 生成啟動');

        const {
            prompt,
            systemPrompt,
            model,
            apiKey,
            maxRetries = 3,
            temperature = 0.5,
            maxOutputTokens = 65536,
            logger = { logTerminal: console.log },
            delayBetweenRetries = 5000
        } = options;

        CodeGenLogger.info('NATIVE_API', `🔥 generateWithNativeGemini() 開始`, {
            model,
            promptLength: prompt?.length || 0,
            temperature,
            maxOutputTokens,
            maxRetries
        });

        // @slot:api_service_layer - 使用掛載的 GeminiAPIWrapper
        const geminiApi = getGeminiApi({ apiKey, model });

        let fullResponse = "";
        let retryCount = 0;
        let complete = false;
        let nextPrompt = prompt;
        let lastSegment = "";

        while (!complete && retryCount <= maxRetries) {
            // 續寫時構建新 Prompt
            if (retryCount > 0) {
                logger.logTerminal && logger.logTerminal(`   ⏳ 等待 ${delayBetweenRetries / 1000} 秒後再續寫...`, 'info');
                await this._delay(delayBetweenRetries);

                nextPrompt = PromptBuilder.buildPhase2ContinuationPrompt(lastSegment);
                logger.logTerminal && logger.logTerminal(`   ⚠️ Phase 2 截斷，請求續寫 (${retryCount}/${maxRetries})...`, 'warn');
            }

            logger.logTerminal && logger.logTerminal(`   📡 Phase 2 Native API 請求中 (嘗試 ${retryCount + 1})...`, 'info');

            try {
                // 委託 GeminiAPIWrapper 進行 API 調用（含內建重試機制）
                const genConfig = { temperature, maxOutputTokens };
                const currentSystemPrompt = retryCount === 0 ? systemPrompt : null;

                const result = await geminiApi.call(
                    nextPrompt,
                    currentSystemPrompt,
                    false,  // useJson = false，返回原始文本
                    genConfig
                );

                if (!result.success) {
                    logger.logTerminal && logger.logTerminal(`   ❌ API Error: ${result.error}`, 'error');
                    throw new Error(result.error);
                }

                const chunk = result.data;

                if (!chunk) {
                    logger.logTerminal && logger.logTerminal(`   ❌ Phase 2 API 返回空內容`, 'error');
                    break;
                }

                logger.logTerminal && logger.logTerminal(`   ✓ Phase 2 收到回應: ${chunk.length} bytes`, 'success');

                // 清理回應（主程式職責）
                let cleanChunk = CodeExtractor.removeThinkTags(chunk);
                if (retryCount > 0) {
                    cleanChunk = CodeExtractor.removeContinuationPrefix(cleanChunk);
                }

                fullResponse += cleanChunk;
                lastSegment = cleanChunk;

                // 截斷檢測（主程式職責）
                if (CodeExtractor.isComplete(fullResponse)) {
                    complete = true;
                    CodeGenLogger.info('NATIVE_API', `✅ Native Gemini 生成完成`, {
                        totalLength: fullResponse.length,
                        retryCount
                    });
                } else {
                    CodeGenLogger.warn('NATIVE_API', `⚠️ Native Gemini 截斷，準備續寫`, {
                        currentLength: fullResponse.length,
                        retryAttempt: retryCount + 1
                    });
                    retryCount++;
                }

            } catch (err) {
                CodeGenLogger.error('NATIVE_API', `❌ Native Gemini 異常`, { error: err.message });
                logger.logTerminal && logger.logTerminal(`   ❌ Phase 2 Exception: ${err.message}`, 'error');
                retryCount++;
                await this._delay(2000);
            }
        }

        CodeGenLogger.checkpoint('NATIVE_GEMINI_END', 'Native Gemini API 生成結束');
        return { code: fullResponse, retryCount };
    },

    /**
     * 延遲輔助函數
     * @private
     */
    _delay(ms) {
        return new Promise(r => setTimeout(r, ms));
    }
};

// ═══════════════════════════════════════════════════════════════════════════
// 🔄 OPTIMIZATION LOOP - 逆向工程優化循環
// ═══════════════════════════════════════════════════════════════════════════

const OptimizationLoop = {
    /**
     * 執行優化循環 (HTML -> Spec -> HTML)
     * @param {Object} options - 優化選項
     * @param {string} options.initialCode - 初始代碼
     * @param {string} options.reverseSkillContent - reverse.md 內容
     * @param {Object} options.aiConfig - AI 配置
     * @param {Function} options.callAI - AI 調用函數
     * @param {Object} options.logger - 日誌記錄器
     * @param {Function} options.saveState - 狀態保存函數
     * @returns {Promise<{optimizedCode: string, source: string, phase1Output: string, phase2Input: string, phase2Output: string}>}
     */
    async execute(options) {
        const {
            initialCode,
            reverseSkillContent,
            aiConfig,
            callAI,
            logger = { logTerminal: console.log, addLog: console.log },
            saveState = () => { }
        } = options;

        const result = {
            optimizedCode: initialCode,
            source: 'INITIAL_PASS',
            phase1Output: null,
            phase2Input: null,
            phase2Output: null
        };

        if (!reverseSkillContent) {
            logger.logTerminal && logger.logTerminal('⚠️ Skipping optimization: reverse.md not found/loaded.', 'warn');
            return result;
        }

        // ─────────────────────────────────────────────────────────────────────
        // Phase 1: 從代碼生成規格
        // ─────────────────────────────────────────────────────────────────────
        logger.logTerminal && logger.logTerminal('1️⃣ Phase 1: Analyzing Code to Generate Spec...', 'info');

        const phase1Prompt = `${reverseSkillContent}\n\n[USER CODE START]\n${initialCode}\n[USER CODE END]`;
        saveState('optimizationPhase1Input', phase1Prompt);

        const reverseSpec = await callAI(
            phase1Prompt,
            "You are a Code Analyst. Follow the instructions in the prompt perfectly.",
            aiConfig.model,
            aiConfig.key,
            aiConfig.url
        );

        if (!reverseSpec) {
            logger.logTerminal && logger.logTerminal('⚠️ Phase 1 failed, keeping initial code', 'warn');
            return result;
        }

        logger.logTerminal && logger.logTerminal('✓ Spec Generated. Size: ' + reverseSpec.length, 'success');
        result.phase1Output = reverseSpec;
        saveState('optimizationPhase1Output', reverseSpec);

        // ─────────────────────────────────────────────────────────────────────
        // Phase 2: 從規格重新生成 HTML
        // ─────────────────────────────────────────────────────────────────────
        logger.logTerminal && logger.logTerminal('2️⃣ Phase 2: Re-generating HTML from Strict Spec...', 'info');

        const phase2Prompt = PromptBuilder.buildPhase2Prompt(reverseSpec);
        result.phase2Input = phase2Prompt;
        saveState('optimizationPhase2Input', phase2Prompt);

        const NATIVE_SYSTEM_PROMPT = "You are an Elite Full-Stack Engineer specializing in high-performance, self-contained Micro-Applications. You build complex logic within single artifacts.";

        // 等待避免限流
        logger.logTerminal && logger.logTerminal('   ⏳ 等待 3 秒以避免 API 限流...', 'info');
        await CodeGenerationPipeline._delay(3000);

        // 使用原生 Gemini API 生成
        const phase2Result = await CodeGenerationPipeline.generateWithNativeGemini({
            prompt: phase2Prompt,
            systemPrompt: NATIVE_SYSTEM_PROMPT,
            model: aiConfig.model,
            apiKey: aiConfig.key,
            maxRetries: 3,
            temperature: 0.5,
            maxOutputTokens: 65536,
            logger
        });

        result.phase2Output = phase2Result.code;
        saveState('optimizationPhase2Output', phase2Result.code);

        if (phase2Result.code) {
            const extracted = CodeExtractor.extractHTML(phase2Result.code);
            if (extracted.extracted) {
                result.optimizedCode = extracted.html;
                result.source = 'PHASE_2_OPTIMIZED';
                logger.logTerminal && logger.logTerminal('✓ OPTIMIZATION COMPLETE: Final code is from Phase 2 (Optimized Version)', 'success');
                logger.addLog && logger.addLog(`最終代碼來源: Phase 2 優化版本 (${result.optimizedCode.length} bytes)`, 'success', 'OPTIMIZE');
            } else {
                logger.logTerminal && logger.logTerminal('⚠️ Phase 2 輸出無法提取 HTML，保留 Initial Pass 代碼', 'warn');
                result.source = 'INITIAL_PASS_FALLBACK';
            }
        } else {
            logger.logTerminal && logger.logTerminal('⚠️ Phase 2 未返回結果，保留 Initial Pass 代碼', 'warn');
            result.source = 'INITIAL_PASS_FALLBACK';
        }

        return result;
    },

    /**
     * 🆕 使用 Skill Agent 執行優化循環 (支援 LLM Function Calling)
     * @param {Object} options - 優化選項
     * @param {string} options.initialCode - 初始代碼
     * @param {string} options.reverseSkillContent - reverse.md 內容
     * @param {Object} options.aiConfig - AI 配置
     * @param {Function} options.callAI - AI 調用函數
     * @param {Function} options.listSkills - 列出技能的函數
     * @param {Function} options.loadSkillContent - 載入技能內容的函數
     * @param {Object} options.logger - 日誌記錄器
     * @param {Function} options.saveState - 狀態保存函數
     * @param {boolean} options.useSkillAgent - 是否使用 Skill Agent (default: true)
     * @returns {Promise<Object>}
     */
    async executeWithSkillAgent(options) {
        const {
            initialCode,
            reverseSkillContent,
            aiConfig,
            callAI,
            listSkills,
            loadSkillContent,
            logger = { logTerminal: console.log, addLog: console.log },
            saveState = () => { },
            useSkillAgent = true
        } = options;

        const result = {
            optimizedCode: initialCode,
            source: 'INITIAL_PASS',
            phase1Output: null,
            phase2Input: null,
            phase2Output: null,
            skillAgentLog: null,
            integratedSkills: []
        };

        if (!reverseSkillContent) {
            logger.logTerminal && logger.logTerminal('⚠️ Skipping optimization: reverse.md not found/loaded.', 'warn');
            return result;
        }

        // ─────────────────────────────────────────────────────────────────────
        // Phase 1: 從代碼生成規格 (保持不變)
        // ─────────────────────────────────────────────────────────────────────
        logger.logTerminal && logger.logTerminal('1️⃣ Phase 1: Analyzing Code to Generate Spec...', 'info');

        const phase1Prompt = `${reverseSkillContent}\n\n[USER CODE START]\n${initialCode}\n[USER CODE END]`;
        saveState('optimizationPhase1Input', phase1Prompt);

        const reverseSpec = await callAI(
            phase1Prompt,
            "You are a Code Analyst. Follow the instructions in the prompt perfectly.",
            aiConfig.model,
            aiConfig.key,
            aiConfig.url
        );

        if (!reverseSpec) {
            logger.logTerminal && logger.logTerminal('⚠️ Phase 1 failed, keeping initial code', 'warn');
            return result;
        }

        logger.logTerminal && logger.logTerminal('✓ Spec Generated. Size: ' + reverseSpec.length, 'success');
        result.phase1Output = reverseSpec;
        saveState('optimizationPhase1Output', reverseSpec);

        // ─────────────────────────────────────────────────────────────────────
        // Phase 2: 使用 Skill Agent 重新生成 HTML (新增 Function Calling)
        // ─────────────────────────────────────────────────────────────────────

        if (useSkillAgent && typeof SkillAgent !== 'undefined') {
            logger.logTerminal && logger.logTerminal('2️⃣ Phase 2: Re-generating HTML with Skill Agent (Function Calling)...', 'info');
            logger.logTerminal && logger.logTerminal('🤖 LLM 將動態查詢和調度技能...', 'info');

            // 初始化 Skill Agent
            SkillAgent.init({
                listSkills,
                loadSkillContent
            });

            // 等待避免限流
            logger.logTerminal && logger.logTerminal('   ⏳ 等待 3 秒以避免 API 限流...', 'info');
            await CodeGenerationPipeline._delay(3000);

            // 執行 Skill Agent Loop
            const agentResult = await SkillAgentLoop.execute({
                task: '根據規格生成完整的單文件 HTML 應用',
                specification: reverseSpec,
                callGemini: callAI,
                apiConfig: aiConfig,
                maxIterations: 15
            });

            result.skillAgentLog = agentResult.log;
            result.integratedSkills = agentResult.integratedSkills;

            if (agentResult.success && agentResult.code) {
                const extracted = CodeExtractor.extractHTML(agentResult.code);
                if (extracted.extracted) {
                    result.optimizedCode = extracted.html;
                    result.source = 'SKILL_AGENT_OPTIMIZED';
                    result.phase2Output = agentResult.code;
                    saveState('optimizationPhase2Output', agentResult.code);

                    logger.logTerminal && logger.logTerminal(`✓ SKILL AGENT COMPLETE: 整合了 ${agentResult.integratedSkills.length} 個技能`, 'success');
                    logger.logTerminal && logger.logTerminal(`   整合的技能: ${agentResult.integratedSkills.join(', ')}`, 'info');
                    logger.addLog && logger.addLog(`Skill Agent 成功: ${agentResult.integratedSkills.length} 個技能整合`, 'success', 'SKILL-AGENT');
                    return result;
                }
            }

            // Skill Agent 失敗，回退到傳統方法
            logger.logTerminal && logger.logTerminal('⚠️ Skill Agent 未能生成有效代碼，回退到傳統 Phase 2...', 'warn');
        }

        // ─────────────────────────────────────────────────────────────────────
        // Phase 2 回退: 傳統方法 (無 Function Calling)
        // ─────────────────────────────────────────────────────────────────────
        logger.logTerminal && logger.logTerminal('2️⃣ Phase 2 (Fallback): Re-generating HTML from Strict Spec...', 'info');

        const phase2Prompt = PromptBuilder.buildPhase2Prompt(reverseSpec);
        result.phase2Input = phase2Prompt;
        saveState('optimizationPhase2Input', phase2Prompt);

        const NATIVE_SYSTEM_PROMPT = "You are an Elite Full-Stack Engineer specializing in high-performance, self-contained Micro-Applications. You build complex logic within single artifacts.";

        // 等待避免限流
        logger.logTerminal && logger.logTerminal('   ⏳ 等待 3 秒以避免 API 限流...', 'info');
        await CodeGenerationPipeline._delay(3000);

        // 使用原生 Gemini API 生成
        const phase2Result = await CodeGenerationPipeline.generateWithNativeGemini({
            prompt: phase2Prompt,
            systemPrompt: NATIVE_SYSTEM_PROMPT,
            model: aiConfig.model,
            apiKey: aiConfig.key,
            maxRetries: 3,
            temperature: 0.5,
            maxOutputTokens: 65536,
            logger
        });

        result.phase2Output = phase2Result.code;
        saveState('optimizationPhase2Output', phase2Result.code);

        if (phase2Result.code) {
            const extracted = CodeExtractor.extractHTML(phase2Result.code);
            if (extracted.extracted) {
                result.optimizedCode = extracted.html;
                result.source = 'PHASE_2_OPTIMIZED';
                logger.logTerminal && logger.logTerminal('✓ OPTIMIZATION COMPLETE: Final code is from Phase 2 (Optimized Version)', 'success');
                logger.addLog && logger.addLog(`最終代碼來源: Phase 2 優化版本 (${result.optimizedCode.length} bytes)`, 'success', 'OPTIMIZE');
            } else {
                logger.logTerminal && logger.logTerminal('⚠️ Phase 2 輸出無法提取 HTML，保留 Initial Pass 代碼', 'warn');
                result.source = 'INITIAL_PASS_FALLBACK';
            }
        } else {
            logger.logTerminal && logger.logTerminal('⚠️ Phase 2 未返回結果，保留 Initial Pass 代碼', 'warn');
            result.source = 'INITIAL_PASS_FALLBACK';
        }

        return result;
    }
};

// ═══════════════════════════════════════════════════════════════════════════
// 🔗 SKILL INJECTOR - 負責載入和注入技能
// ═══════════════════════════════════════════════════════════════════════════

const SkillInjector = {
    /**
     * 載入並格式化強制技能
     * @param {Array<string>} skillNames - 技能名稱列表
     * @param {Function} listSkills - 列出技能的函數
     * @param {Function} loadSkillContent - 載入技能內容的函數
     * @param {Object} logger - 日誌記錄器
     * @returns {Promise<{content: string, loadedSkills: string[]}>} 格式化的技能內容和已加載列表
     */
    async loadMandatorySkills(skillNames, listSkills, loadSkillContent, logger = {}) {
        let skillContent = "";
        const loadedSkills = [];  // 🆕 追蹤已加載的技能
        const skillStats = [];    // 🔍 追蹤技能載入統計

        // 🔍 LLM DEBUG: 開始技能發現
        console.log('\n%c━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'color: #8b5cf6');
        console.log('%c🔌 SKILL DISCOVERY 階段開始', 'color: #8b5cf6; font-weight: bold');
        console.log('%c━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'color: #8b5cf6');
        console.log(`%c待載入技能清單 (${skillNames.length} 個):`, 'color: #8b5cf6');
        skillNames.forEach((name, i) => {
            console.log(`%c  [${i + 1}] ${name}`, 'color: #a78bfa');
        });

        try {
            const allSkills = await listSkills();
            console.log(`%c📂 Bridge Server 返回 ${allSkills.length} 個可用技能`, 'color: #06b6d4');

            for (const name of skillNames) {
                const skill = allSkills.find(s => s.name === name);
                if (skill) {
                    const content = await loadSkillContent(skill.path);
                    if (content) {
                        // 🔗 強調膠水代碼部分
                        const enhancedContent = this._highlightGlueCode(content, skill.name);
                        const hasGlueCode = content.includes('@GLUE:REQUIRED') || content.includes('### Glue Code');

                        skillContent += `\n\n# 🛡️ MANDATORY SKILL: ${skill.name}\n${enhancedContent}\n`;
                        loadedSkills.push(skill.name);

                        // 🔍 記錄統計
                        skillStats.push({
                            name: skill.name,
                            path: skill.path,
                            size: content.length,
                            hasGlueCode
                        });

                        // 🔍 LLM DEBUG: 詳細輸出
                        console.log(`%c✅ 鎖定技能模組: ${skill.name}`, 'color: #22c55e; font-weight: bold');
                        console.log(`%c   📂 Path: ${skill.path}`, 'color: #6b7280');
                        console.log(`%c   📏 Content: ${(content.length / 1024).toFixed(2)} KB (${content.length} chars)`, 'color: #6b7280');
                        console.log(`%c   🔗 膠水代碼: ${hasGlueCode ? '✓ 已識別' : '○ 無'}`, hasGlueCode ? 'color: #f59e0b' : 'color: #6b7280');

                        logger.addLog && logger.addLog(`✅ 強制載入核心技能: ${skill.name}`, 'success', 'SKILL-SYSTEM');
                    }
                } else {
                    console.log(`%c⚠️ 技能未找到: ${name}`, 'color: #eab308');
                    logger.addLog && logger.addLog(`⚠️ 技能未找到: ${name}`, 'warn', 'SKILL-SYSTEM');
                }
            }
        } catch (e) {
            console.error('Skill injection error', e);
        }

        // 🔍 LLM DEBUG: 技能載入統計
        console.log('\n%c━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'color: #8b5cf6');
        console.log(`%c✅ 技能載入完成: ${loadedSkills.length}/${skillNames.length} 個成功`, 'color: #22c55e; font-weight: bold');
        console.log(`%c📦 總技能內容大小: ${(skillContent.length / 1024).toFixed(2)} KB`, 'color: #3b82f6');
        console.log('%c━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n', 'color: #8b5cf6');

        return { content: skillContent, loadedSkills, skillStats };
    },

    /**
     * 🆕 強調技能中的膠水代碼部分
     * @private
     */
    _highlightGlueCode(content, skillName) {
        // 在 Glue Code 章節前後添加強調標記
        const glueCodePattern = /(### Glue Code[\s\S]*?```javascript[\s\S]*?```)/gi;
        return content.replace(glueCodePattern, (match) => {
            return `\n<!-- ⚠️ @GLUE:REQUIRED - ${skillName} 膠水代碼必須實現 -->\n${match}\n<!-- ⚠️ END @GLUE:REQUIRED -->\n`;
        });
    },

    /**
     * 發現並載入相關技能
     * @param {string} requirement - 用戶需求
     * @param {number} limit - 最大技能數量
     * @param {Function} findRelevantSkills - 發現相關技能的函數
     * @returns {Promise<string>} 格式化的技能內容
     */
    async loadRelevantSkills(requirement, limit, findRelevantSkills) {
        try {
            return await findRelevantSkills(requirement, limit) || "";
        } catch (e) {
            console.error('Relevant skill discovery error', e);
            return "";
        }
    },

    /**
     * 🆕 生成膠水合約檢查清單 Prompt
     * @param {string[]} loadedSkills - 已加載的技能列表
     * @returns {string} 膠水合約 Prompt
     */
    buildGlueContractPrompt(loadedSkills) {
        if (!loadedSkills || loadedSkills.length === 0) return '';

        const skillItems = loadedSkills.map(s => `   - [ ] \`${s}\`: 類別實例化 + 事件綁定 + i18n Keys`).join('\n');

        return `

# 🔗 SKILL GLUE CODE CHECKLIST (MANDATORY)

**CRITICAL**: For EACH skill listed below, you MUST complete ALL of the following:

1. **Instantiate** the skill class (e.g., \`const analyzer = new AIEssayAnalyzer(geminiApi);\`)
2. **Add i18n keys** for any \`translate('key')\` calls referenced in the skill
3. **Bind event listeners** as shown in \`### Glue Code\` section
4. **Verify dependencies** - if skill depends on another (e.g., \`gemini-api-wrapper\`), initialize dependency FIRST

## Loaded Skills Checklist:
${skillItems}

## 🚫 ANTI-SKIP PROTOCOL
- **Before outputting \`</html>\`**, verify that EVERY skill's Glue Code has been implemented.
- If ANY skill's \`@GLUE:REQUIRED\` section is skipped, the application WILL CRASH at runtime.
- **Dead Code Detection**: Do NOT define functions without calling them. Every \`setup*Listeners\` function MUST be invoked.
- **i18n Completeness**: If you use \`translate('some_key')\`, that key MUST exist in the i18n dictionary.

`;
    }
};

// ═══════════════════════════════════════════════════════════════════════════
// 🏥 SYSTEM DIAGNOSTICS - 負責檢查系統健康狀態與資源可用性
// ═══════════════════════════════════════════════════════════════════════════

const SystemDiagnostics = {
    /**
     * 執行資源檢查
     * @param {Object} logger - 日誌記錄器
     * @returns {Promise<boolean>} 是否通過檢查
     */
    async runChecks(logger) {
        if (typeof require === 'undefined') {
            logger.addLog && logger.addLog('SystemDiagnostics skipped (Browser Environment)', 'info', 'DIAGNOSTICS');
            return true;
        }

        const fs = require('fs');
        const path = require('path');

        // 假設運行在根目錄或能通過相對路徑訪問
        // 如果在 modules/code-generator.js，回退一層是根目錄
        const rootDir = path.resolve(__dirname, '..');

        const checks = [
            { type: 'file', path: '.agent/skills/ai-blind-write-diagnosis/ai-blind-write-diagnosis.js', description: 'Blind Write Diagnosis Implementation' },
            { type: 'file', path: '.agent/skills/ai-blind-write-diagnosis/SKILL.md', description: 'Blind Write Diagnosis Skill Doc' },
            { type: 'file', path: '.agent/skills/MODULE_EXTRACTION_REPORT.md', description: 'Module Extraction Report' },
            { type: 'file', path: '.agent/SKILL_REGISTRY.md', description: 'Skill Registry' },
            { type: 'dir', path: '.agent/skills/ai-blind-write-diagnosis', description: 'Skill: Blind Write Diagnosis' },
            { type: 'dir', path: '.agent/skills/ai-essay-analyzer', description: 'Skill: Essay Analyzer' },
            { type: 'dir', path: '.agent/skills/ai-essay-rewriter', description: 'Skill: Essay Rewriter' },
            { type: 'dir', path: '.agent/skills/ai-inspiration-generator', description: 'Skill: Inspiration Generator' },
            { type: 'dir', path: '.agent/skills/gemini-api-wrapper', description: 'Skill: Gemini API Wrapper' },
            { type: 'dir', path: '.agent/skills/ui-loader-manager', description: 'Skill: UI Loader Manager' }
        ];

        logger.checkpoint('SYSTEM_DIAGNOSTICS', '開始系統資源檢查');

        let allPassed = true;

        for (const check of checks) {
            const fullPath = path.join(rootDir, check.path);
            let exists = false;
            try {
                if (check.type === 'file') {
                    exists = fs.existsSync(fullPath) && fs.statSync(fullPath).isFile();
                } else {
                    exists = fs.existsSync(fullPath) && fs.statSync(fullPath).isDirectory();
                }
            } catch (e) {
                exists = false;
            }

            if (exists) {
                logger.info('DIAGNOSTICS', `✅ [OK] ${check.description}`, { path: check.path });
                logger.logTerminal && logger.logTerminal(`   ✓ Found: ${check.description}`, 'success');
            } else {
                logger.error('DIAGNOSTICS', `❌ [MISSING] ${check.description}`, { path: check.path });
                logger.logTerminal && logger.logTerminal(`   ❌ Missing: ${check.description} (${check.path})`, 'error');
                allPassed = false;
            }
        }

        return allPassed;
    }
};

// ═══════════════════════════════════════════════════════════════════════════
// 🚀 CODE GENERATOR - 主入口，整合所有子模組
// ═══════════════════════════════════════════════════════════════════════════

const CodeGenerator = {
    // 導出子模組
    PromptBuilder,
    CodeExtractor,
    CodeGenerationPipeline,
    OptimizationLoop,
    SkillInjector,

    /**
     * 執行完整的代碼生成流程
     * @param {Object} options - 生成選項
     * @param {Object} options.state - 應用狀態
     * @param {Object} options.commands - SDD 指令定義
     * @param {Function} options.callAI - AI 調用函數
     * @param {Function} options.resolveAIConfig - AI 配置解析函數
     * @param {Function} options.listSkills - 列出技能函數
     * @param {Function} options.loadSkillContent - 載入技能內容函數
     * @param {Function} options.findRelevantSkills - 發現相關技能函數
     * @param {Object} options.logger - 日誌記錄器 {addLog, logTerminal}
     * @returns {Promise<{code: string, source: string, success: boolean}>}
     */
    async execute(options) {
        const {
            state,
            commands,
            callAI,
            resolveAIConfig,
            listSkills,
            loadSkillContent,
            findRelevantSkills,
            logger = { addLog: console.log, logTerminal: console.log }
        } = options;

        // ─────────────────────────────────────────────────────────────────────
        // 0. 系統診斷 (Check Points)
        // ─────────────────────────────────────────────────────────────────────
        await SystemDiagnostics.runChecks(logger);

        const result = { code: '', source: '', success: false };

        // ─────────────────────────────────────────────────────────────────────
        // 1. 準備上下文數據
        // ─────────────────────────────────────────────────────────────────────
        const context = {
            spec: state.specMarkdown || JSON.stringify(state.spec, null, 2),
            plan: state.planMarkdown || JSON.stringify(state.plan, null, 2),
            tasks: state.tasksMarkdown || JSON.stringify(state.tasks || {}, null, 2),
            constitution: state.constitutionMarkdown,
            analysis: state.analysisMarkdown,
            checklist: state.checklistMarkdown,
            testScript: state.testCode
        };

        logger.logTerminal(`   Spec: ${(context.spec.length / 1024).toFixed(1)} KB | Plan: ${(context.plan.length / 1024).toFixed(1)} KB | Tasks: ${(context.tasks.length / 1024).toFixed(1)} KB`, 'cmd');

        // ─────────────────────────────────────────────────────────────────────
        // 2. 載入技能
        // ─────────────────────────────────────────────────────────────────────
        // 🔗 EXPANDED: 強制加載所有核心技能 + 專案專屬技能
        const criticalSkillNames = [
            // 通用強化技能
            'spec-app-runtime-hardening',
            'spec-kit-compliance-checker',
            'spec-kit-app-repair',
            'spec-kit-ui-hardening',
            'spec-kit-data-simulation',

            // 🆕 專案專屬技能 (IELTS Coach 系列)
            'gemini-api-wrapper',        // API 調用層
            'ai-essay-analyzer',          // 範文分析
            'ai-blind-write-diagnosis',   // 盲寫診斷
            'ai-essay-rewriter',          // AI 改寫
            'ai-inspiration-generator',   // 靈感生成
            'ui-loader-manager'           // UI 加載狀態
        ];

        // 🔗 載入強制技能 (返回 {content, loadedSkills})
        const mandatoryResult = await SkillInjector.loadMandatorySkills(
            criticalSkillNames, listSkills, loadSkillContent, logger
        );

        const relevantSkills = await SkillInjector.loadRelevantSkills(
            state.userRequirement, 3, findRelevantSkills
        );

        // 🔗 合併技能內容 + 添加膠水合約 Prompt
        const activeSkills = mandatoryResult.content + relevantSkills;
        const glueContractPrompt = SkillInjector.buildGlueContractPrompt(mandatoryResult.loadedSkills);

        logger.addLog(`已載入 ${mandatoryResult.loadedSkills.length} 個強制技能`, 'info', 'SKILL-SYSTEM');
        logger.logTerminal(`   已載入技能: ${mandatoryResult.loadedSkills.join(', ')}`, 'info');

        // ─────────────────────────────────────────────────────────────────────
        // 3. 構建 Prompt (包含膠水合約)
        // ─────────────────────────────────────────────────────────────────────
        const prompt = PromptBuilder.buildImplementPrompt({
            template: commands.implement.prompt,
            context,
            skills: activeSkills + glueContractPrompt  // 🔗 添加膠水合約
        });

        logger.addLog(`Prompt 構建完成，大小: ${(prompt.length / 1024).toFixed(1)} KB`, 'debug', 'IMPLEMENT');
        logger.logTerminal(`   Prompt 總大小: ${(prompt.length / 1024).toFixed(1)} KB`, 'cmd');

        // ─────────────────────────────────────────────────────────────────────
        // 4. 執行初始代碼生成
        // ─────────────────────────────────────────────────────────────────────
        const aiConfig = resolveAIConfig('gemini', 'phase2');

        logger.addLog(`準備調用 AI API. 模型=${aiConfig.model}, Provider=${aiConfig.provider}`, 'info', 'IMPLEMENT');
        logger.logTerminal(`   模型: ${aiConfig.model}`, 'cmd');
        logger.logTerminal(`   Provider: ${aiConfig.provider}`, 'cmd');

        const startTime = performance.now();
        logger.logTerminal(`   開始時間: ${new Date().toLocaleTimeString()}`, 'cmd');

        const genResult = await CodeGenerationPipeline.generate({
            prompt,
            systemPrompt: "You are a top Full-Stack Software Engineer. CRITICAL: Do NOT over-analyze. You have a token limit. Plan briefly and then IMMEDIATELY START CODING. Focus on generating the implementation.",
            aiConfig,
            callAI,
            maxRetries: 3,
            logger
        });

        const duration = ((performance.now() - startTime) / 1000).toFixed(2);
        logger.logTerminal(`   完成時間: ${new Date().toLocaleTimeString()}`, 'cmd');
        logger.logTerminal(`   耗時: ${duration} 秒`, 'cmd');

        if (!genResult.code) {
            logger.addLog('API 回傳空結果', 'error', 'IMPLEMENT');
            logger.logTerminal('✗ 代碼生成失敗: API 無回應', 'error');
            return result;
        }

        // ─────────────────────────────────────────────────────────────────────
        // 5. 提取 HTML
        // ─────────────────────────────────────────────────────────────────────
        const extracted = CodeExtractor.extractHTML(genResult.code);
        let generatedCode = extracted.html;

        if (extracted.extracted) {
            logger.addLog('成功提取 HTML 結構', 'success', 'IMPLEMENT');
            logger.logTerminal('   ✓ 成功提取 HTML 結構', 'success');
        } else {
            logger.addLog('使用回退方式提取代碼 (未找到完整 HTML 標籤)', 'warn', 'IMPLEMENT');
            logger.logTerminal('   ⚠️ 使用回退方式提取代碼', 'cmd');
        }

        logger.addLog(`最終代碼大小: ${(generatedCode.length / 1024).toFixed(1)} KB`, 'info', 'IMPLEMENT');
        logger.logTerminal(`   最終代碼大小: ${(generatedCode.length / 1024).toFixed(1)} KB`, 'cmd');
        logger.logTerminal('✓ 代碼生成完成 (Initial Pass)', 'success');

        // ─────────────────────────────────────────────────────────────────────
        // 6. 執行優化循環 (可選)
        // ─────────────────────────────────────────────────────────────────────
        let reverseSkillContent = "";
        try {
            const allSkills = await listSkills();
            const reverseSkill = allSkills.find(s => s.name === 'reverse' || s.path.includes('reverse.md'));
            if (reverseSkill) {
                reverseSkillContent = await loadSkillContent(reverseSkill.path);
            } else {
                reverseSkillContent = await loadSkillContent('skills/reverse.md');
            }
        } catch (e) {
            console.warn("Could not load reverse.md, skipping optimization loop", e);
            logger.logTerminal('⚠️ 無法載入 reverse.md，跳過優化流程', 'warn');
        }

        if (reverseSkillContent) {
            logger.logTerminal('PS > Optimization Loop: HTML -> Spec -> HTML', 'cmd');

            const optResult = await OptimizationLoop.execute({
                initialCode: generatedCode,
                reverseSkillContent,
                aiConfig: resolveAIConfig('gemini'),
                callAI,
                logger,
                saveState: (key, value) => { state[key] = value; }
            });

            generatedCode = optResult.optimizedCode;
            result.source = optResult.source;
        } else {
            result.source = 'INITIAL_PASS';
        }

        result.code = generatedCode;
        result.success = true;

        return result;
    }
};

// 導出模組 (支援 ES Modules 和全局命名空間)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        CodeGenerator,
        PromptBuilder,
        CodeExtractor,
        CodeGenerationPipeline,
        OptimizationLoop,
        SkillInjector,
        SystemDiagnostics,
        // @slot:api_service_layer - 導出掛載的 Skill
        GeminiAPIWrapper,
        getGeminiApi,
        // @slot:logging_system - 導出日誌系統
        CodeGenLogger
    };
}

// 全局導出 (瀏覽器環境)
if (typeof window !== 'undefined') {
    window.CodeGenerator = CodeGenerator;
    window.PromptBuilder = PromptBuilder;
    window.CodeExtractor = CodeExtractor;
    window.CodeGenerationPipeline = CodeGenerationPipeline;
    window.OptimizationLoop = OptimizationLoop;
    window.SkillInjector = SkillInjector;
    window.SystemDiagnostics = SystemDiagnostics;
    // @slot:api_service_layer - 導出掛載的 Skill
    window.GeminiAPIWrapper = GeminiAPIWrapper;
    window.getGeminiApi = getGeminiApi;
    // @slot:logging_system - 導出日誌系統
    window.CodeGenLogger = CodeGenLogger;
}

