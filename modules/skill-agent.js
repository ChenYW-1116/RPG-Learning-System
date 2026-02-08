/**
 * ═══════════════════════════════════════════════════════════════════════════
 * 🤖 SKILL AGENT MODULE - LLM Function Calling 技能調度系統
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * 實現 LLM 與技能系統之間的動態交互，讓 LLM 可以：
 * 1. 查詢可用技能列表
 * 2. 按需載入技能內容
 * 3. 獲取膠水代碼片段
 * 4. 驗證代碼整合完整性
 * 
 * @version 1.0.0
 * @author Spec Kit Agent
 * ═══════════════════════════════════════════════════════════════════════════
 */

// ═══════════════════════════════════════════════════════════════════════════
// 📋 FUNCTION DEFINITIONS - LLM 可調用的函數定義
// ═══════════════════════════════════════════════════════════════════════════

const SKILL_AGENT_FUNCTIONS = [
    {
        name: "list_available_skills",
        description: "列出所有可用的技能模組。返回技能名稱、描述和優先級。用於在生成代碼前了解有哪些可用的功能模組。",
        parameters: {
            type: "object",
            properties: {
                category: {
                    type: "string",
                    description: "可選的技能類別過濾，如 'ai', 'ui', 'api', 'data' 等",
                    enum: ["all", "ai", "ui", "api", "data", "validation"]
                }
            },
            required: []
        }
    },
    {
        name: "load_skill_content",
        description: "載入指定技能的完整內容（SKILL.md）。包含接口定義、實現參考和膠水代碼。當你決定使用某個技能時，必須先調用此函數獲取其完整規格。",
        parameters: {
            type: "object",
            properties: {
                skill_name: {
                    type: "string",
                    description: "技能的名稱，如 'gemini-api-wrapper', 'ai-essay-analyzer'"
                }
            },
            required: ["skill_name"]
        }
    },
    {
        name: "get_skill_glue_code",
        description: "獲取指定技能的膠水代碼片段。這是你必須在最終代碼中實現的整合代碼。返回的代碼片段可以直接複製到你的實現中。",
        parameters: {
            type: "object",
            properties: {
                skill_name: {
                    type: "string",
                    description: "技能的名稱"
                }
            },
            required: ["skill_name"]
        }
    },
    {
        name: "get_skill_dependencies",
        description: "獲取指定技能的依賴關係。某些技能依賴其他技能（如 ai-essay-analyzer 依賴 gemini-api-wrapper）。調用此函數確保你載入了所有必要的依賴。",
        parameters: {
            type: "object",
            properties: {
                skill_name: {
                    type: "string",
                    description: "技能的名稱"
                }
            },
            required: ["skill_name"]
        }
    },
    {
        name: "validate_glue_integration",
        description: "驗證你生成的代碼是否正確整合了所有使用的技能。在完成代碼生成後調用此函數進行自我檢查。",
        parameters: {
            type: "object",
            properties: {
                code: {
                    type: "string",
                    description: "你生成的完整 HTML/JavaScript 代碼"
                },
                used_skills: {
                    type: "array",
                    items: { type: "string" },
                    description: "你在代碼中使用的技能名稱列表"
                }
            },
            required: ["code", "used_skills"]
        }
    },
    {
        name: "finalize_code",
        description: "當你完成代碼生成並確認所有技能都已正確整合時，調用此函數提交最終代碼。",
        parameters: {
            type: "object",
            properties: {
                final_code: {
                    type: "string",
                    description: "完整的最終 HTML 代碼"
                },
                integrated_skills: {
                    type: "array",
                    items: { type: "string" },
                    description: "已整合的技能列表"
                },
                integration_notes: {
                    type: "string",
                    description: "整合說明或注意事項"
                }
            },
            required: ["final_code", "integrated_skills"]
        }
    }
];

// ═══════════════════════════════════════════════════════════════════════════
// 🔧 SKILL AGENT - 技能調度代理核心
// ═══════════════════════════════════════════════════════════════════════════

const SkillAgent = {
    // 已載入的技能緩存
    _skillCache: new Map(),
    // 依賴關係映射
    _dependencyMap: {
        'ai-essay-analyzer': ['gemini-api-wrapper'],
        'ai-blind-write-diagnosis': ['gemini-api-wrapper'],
        'ai-essay-rewriter': ['gemini-api-wrapper'],
        'ai-inspiration-generator': ['gemini-api-wrapper']
    },
    // 技能類別映射
    _categoryMap: {
        'ai': ['ai-essay-analyzer', 'ai-blind-write-diagnosis', 'ai-essay-rewriter', 'ai-inspiration-generator'],
        'api': ['gemini-api-wrapper'],
        'ui': ['ui-loader-manager'],
        'validation': ['spec-kit-compliance-checker'],
        'data': ['spec-kit-data-simulation']
    },

    /**
     * 初始化 Skill Agent
     * @param {Object} options - 配置選項
     * @param {Function} options.listSkills - 列出技能的函數
     * @param {Function} options.loadSkillContent - 載入技能內容的函數
     */
    init(options) {
        this._listSkills = options.listSkills;
        this._loadSkillContent = options.loadSkillContent;
        this._skillCache.clear();

        console.log('%c🤖 Skill Agent 已初始化', 'color: #8b5cf6; font-weight: bold');
    },

    /**
     * 獲取 Gemini Function Calling 的工具定義
     */
    getFunctionDeclarations() {
        return SKILL_AGENT_FUNCTIONS.map(fn => ({
            name: fn.name,
            description: fn.description,
            parameters: fn.parameters
        }));
    },

    /**
     * 執行 Function Call
     * @param {string} functionName - 函數名稱
     * @param {Object} args - 函數參數
     * @returns {Promise<Object>} 函數執行結果
     */
    async executeFunction(functionName, args) {
        console.log(`%c🔧 Skill Agent 執行: ${functionName}`, 'color: #f59e0b', args);

        switch (functionName) {
            case 'list_available_skills':
                return await this._listAvailableSkills(args.category);

            case 'load_skill_content':
                return await this._loadSkill(args.skill_name);

            case 'get_skill_glue_code':
                return await this._getGlueCode(args.skill_name);

            case 'get_skill_dependencies':
                return this._getDependencies(args.skill_name);

            case 'validate_glue_integration':
                return this._validateIntegration(args.code, args.used_skills);

            case 'finalize_code':
                return this._finalizeCode(args.final_code, args.integrated_skills, args.integration_notes);

            default:
                return { error: `Unknown function: ${functionName}` };
        }
    },

    // ─────────────────────────────────────────────────────────────────────────
    // 內部函數實現
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * 列出可用技能
     */
    async _listAvailableSkills(category = 'all') {
        try {
            const allSkills = await this._listSkills();

            let filteredSkills = allSkills;
            if (category && category !== 'all') {
                const categorySkills = this._categoryMap[category] || [];
                filteredSkills = allSkills.filter(s => categorySkills.includes(s.name));
            }

            const result = filteredSkills.map(s => ({
                name: s.name,
                priority: s.priority || 1,
                description: s.contentSnippet?.substring(0, 200) || '(無描述)',
                hasGlueCode: s.contentSnippet?.includes('@GLUE') || s.contentSnippet?.includes('Glue Code')
            }));

            console.log(`%c📋 找到 ${result.length} 個技能`, 'color: #22c55e');
            return {
                success: true,
                count: result.length,
                skills: result
            };
        } catch (err) {
            return { success: false, error: err.message };
        }
    },

    /**
     * 載入技能內容
     */
    async _loadSkill(skillName) {
        // 檢查緩存
        if (this._skillCache.has(skillName)) {
            console.log(`%c📦 從緩存載入: ${skillName}`, 'color: #06b6d4');
            return this._skillCache.get(skillName);
        }

        try {
            const allSkills = await this._listSkills();
            const skill = allSkills.find(s => s.name === skillName);

            if (!skill) {
                return { success: false, error: `技能未找到: ${skillName}` };
            }

            const content = await this._loadSkillContent(skill.path);

            if (!content) {
                return { success: false, error: `無法載入技能內容: ${skillName}` };
            }

            const result = {
                success: true,
                name: skillName,
                path: skill.path,
                priority: skill.priority,
                content: content,
                // 提取關鍵部分
                interfaceContract: this._extractSection(content, 'Interface Contract'),
                implementationRef: this._extractSection(content, 'Implementation Reference'),
                glueCode: this._extractGlueCode(content)
            };

            // 緩存結果
            this._skillCache.set(skillName, result);

            console.log(`%c✅ 技能已載入: ${skillName} (${(content.length / 1024).toFixed(1)} KB)`, 'color: #22c55e');
            return result;
        } catch (err) {
            return { success: false, error: err.message };
        }
    },

    /**
     * 獲取膠水代碼
     */
    async _getGlueCode(skillName) {
        const skillData = await this._loadSkill(skillName);

        if (!skillData.success) {
            return skillData;
        }

        console.log(`%c🔍 [DEBUG] _getGlueCode(${skillName})`, 'color: #f59e0b', {
            hasGlueCode: !!skillData.glueCode,
            length: skillData.glueCode?.length || 0,
            preview: skillData.glueCode ? skillData.glueCode.substring(0, 100) + '...' : 'N/A'
        });

        return {
            success: true,
            name: skillName,
            glueCode: skillData.glueCode,
            instructions: `
【整合指南】
1. 將以下膠水代碼複製到你的 <script> 區塊中的適當位置
2. 確保在 DOMContentLoaded 之後調用初始化函數
3. 確保所有 translate('key') 調用的 key 都存在於 i18n 字典中
4. 如果這個技能有依賴，確保依賴的技能已先初始化

【膠水代碼】
${skillData.glueCode || '(無膠水代碼)'}
`
        };
    },

    /**
     * 獲取依賴關係
     */
    _getDependencies(skillName) {
        const deps = this._dependencyMap[skillName] || [];

        return {
            success: true,
            name: skillName,
            dependencies: deps,
            message: deps.length > 0
                ? `${skillName} 依賴以下技能，你必須先載入它們: ${deps.join(', ')}`
                : `${skillName} 沒有依賴其他技能`
        };
    },

    /**
     * 驗證膠水代碼整合
     */
    _validateIntegration(code, usedSkills) {
        const issues = [];
        const checks = [];

        for (const skillName of usedSkills) {
            const skillData = this._skillCache.get(skillName);

            if (!skillData) {
                issues.push({
                    skill: skillName,
                    severity: 'error',
                    message: `技能 ${skillName} 未被載入。你必須先調用 load_skill_content。`
                });
                continue;
            }

            // 檢查 1: 類別實例化
            const classPatterns = this._extractClassNames(skillData.glueCode);
            for (const className of classPatterns) {
                const hasInstantiation = code.includes(`new ${className}`) || code.includes(`${className}(`);
                if (!hasInstantiation) {
                    issues.push({
                        skill: skillName,
                        severity: 'error',
                        message: `缺少類別實例化: new ${className}()`
                    });
                } else {
                    checks.push(`✅ ${skillName}: ${className} 已實例化`);
                }
            }

            // 檢查 2: 事件綁定
            const eventPatterns = this._extractEventBindings(skillData.glueCode);
            for (const { elementId, event } of eventPatterns) {
                const hasBinding = code.includes(elementId) && code.includes(`addEventListener`);
                if (!hasBinding) {
                    issues.push({
                        skill: skillName,
                        severity: 'warning',
                        message: `可能缺少事件綁定: ${elementId}.${event}`
                    });
                } else {
                    checks.push(`✅ ${skillName}: ${elementId} 事件已綁定`);
                }
            }

            // 檢查 3: 依賴項
            const deps = this._dependencyMap[skillName] || [];
            for (const dep of deps) {
                if (!usedSkills.includes(dep)) {
                    issues.push({
                        skill: skillName,
                        severity: 'error',
                        message: `缺少依賴: ${skillName} 需要 ${dep}，但你未在 used_skills 中列出`
                    });
                }
            }
        }

        const isValid = issues.filter(i => i.severity === 'error').length === 0;

        return {
            success: true,
            isValid,
            summary: isValid
                ? `✅ 驗證通過！所有 ${usedSkills.length} 個技能都已正確整合。`
                : `❌ 驗證失敗！發現 ${issues.length} 個問題。`,
            checks,
            issues,
            recommendations: issues.map(i => `【${i.severity.toUpperCase()}】${i.skill}: ${i.message}`)
        };

        console.log('%c🔍 [DEBUG] _validateIntegration Result:', isValid ? 'color: #22c55e' : 'color: #ef4444', {
            isValid,
            checksCount: checks.length,
            issuesCount: issues.length,
            issuesDetails: issues
        });

        return result;
    },

    /**
     * 完成代碼生成
     */
    _finalizeCode(finalCode, integratedSkills, notes = '') {
        // 最終驗證
        const validation = this._validateIntegration(finalCode, integratedSkills);

        if (!validation.isValid) {
            return {
                success: false,
                message: '代碼驗證失敗，請修復以下問題後重新提交',
                issues: validation.issues,
                code: null
            };
        }

        // 記錄整合統計
        const stats = {
            codeLength: finalCode.length,
            skillCount: integratedSkills.length,
            skills: integratedSkills,
            notes
        };

        console.log('%c✅ 代碼已完成', 'color: #22c55e; font-weight: bold', stats);

        return {
            success: true,
            message: `代碼生成完成！已整合 ${integratedSkills.length} 個技能。`,
            stats,
            code: finalCode,
            // 標記為最終輸出
            __FINAL_OUTPUT__: true
        };
    },

    // ─────────────────────────────────────────────────────────────────────────
    // 輔助函數
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * 提取 Markdown 章節
     */
    _extractSection(content, sectionName) {
        const regex = new RegExp(`### ${sectionName}[\\s\\S]*?(?=###|$)`, 'i');
        const match = content.match(regex);
        return match ? match[0].trim() : null;
    },

    /**
     * 提取膠水代碼
     */
    _extractGlueCode(content) {
        // 嘗試匹配 @GLUE:REQUIRED 標記的區塊
        const glueMatch = content.match(/<!-- ⚠️ @GLUE:REQUIRED[\s\S]*?```javascript([\s\S]*?)```[\s\S]*?<!-- ⚠️ END @GLUE:REQUIRED -->/i);
        if (glueMatch) {
            return glueMatch[1].trim();
        }

        // 回退：匹配 ### Glue Code 章節
        const sectionMatch = content.match(/### Glue Code[\s\S]*?```javascript([\s\S]*?)```/i);
        if (sectionMatch) {
            return sectionMatch[1].trim();
        }

        return null;
    },

    /**
     * 從膠水代碼中提取類名
     */
    _extractClassNames(glueCode) {
        if (!glueCode) return [];
        const matches = glueCode.match(/new (\w+)/g) || [];
        return matches.map(m => m.replace('new ', ''));
    },

    /**
     * 從膠水代碼中提取事件綁定
     */
    _extractEventBindings(glueCode) {
        if (!glueCode) return [];
        const results = [];
        // 匹配 document.getElementById('xxx').addEventListener('click', ...)
        const pattern = /getElementById\(['"](\w+)['"]\)\.addEventListener\(['"](\w+)['"]/g;
        let match;
        while ((match = pattern.exec(glueCode)) !== null) {
            results.push({ elementId: match[1], event: match[2] });
        }
        return results;
    }
};

// ═══════════════════════════════════════════════════════════════════════════
// 🔄 AGENT LOOP - 多輪對話循環
// ═══════════════════════════════════════════════════════════════════════════

const SkillAgentLoop = {
    /**
     * 執行 Agent 循環
     * @param {Object} options - 執行選項
     * @param {string} options.task - 任務描述
     * @param {string} options.specification - 規格文檔
     * @param {Function} options.callGemini - Gemini API 調用函數
     * @param {Object} options.apiConfig - API 配置
     * @param {number} options.maxIterations - 最大迭代次數
     * @returns {Promise<{success: boolean, code: string, log: Array}>}
     */
    async execute(options) {
        const {
            task,
            specification,
            callGemini,
            apiConfig,
            maxIterations = 10
        } = options;

        const log = [];
        let iteration = 0;
        let conversationHistory = [];
        let finalResult = null;

        // 構建初始 System Prompt
        const systemPrompt = this._buildSystemPrompt();

        // 構建初始 User Prompt
        const initialPrompt = this._buildInitialPrompt(task, specification);

        console.log('%c🔄 Skill Agent Loop 開始', 'color: #8b5cf6; font-weight: bold');
        log.push({ type: 'start', message: 'Agent Loop 開始', timestamp: Date.now() });

        // Agent 循環
        while (iteration < maxIterations && !finalResult) {
            iteration++;
            console.log(`%c📍 Iteration ${iteration}/${maxIterations}`, 'color: #f59e0b');
            log.push({ type: 'iteration', iteration, timestamp: Date.now() });

            // 構建當前對話
            const currentPrompt = iteration === 1
                ? initialPrompt
                : this._buildContinuationPrompt(conversationHistory);

            // 調用 Gemini with Function Calling
            const response = await this._callGeminiWithFunctions(
                currentPrompt,
                systemPrompt,
                callGemini,
                apiConfig
            );

            if (!response) {
                log.push({ type: 'error', message: 'API 調用失敗', iteration });
                break;
            }

            // 處理回應
            if (response.functionCalls && response.functionCalls.length > 0) {
                // LLM 請求調用函數
                for (const fc of response.functionCalls) {
                    console.log(`%c🔧 Function Call: ${fc.name}`, 'color: #10b981');
                    log.push({ type: 'function_call', name: fc.name, args: fc.args, iteration });

                    // 執行函數
                    const result = await SkillAgent.executeFunction(fc.name, fc.args);
                    log.push({ type: 'function_result', name: fc.name, result, iteration });

                    // 檢查是否是最終輸出
                    if (result.__FINAL_OUTPUT__) {
                        finalResult = result;
                        break;
                    }

                    // 將結果加入對話歷史
                    conversationHistory.push({
                        role: 'function',
                        name: fc.name,
                        content: JSON.stringify(result)
                    });
                }
            } else if (response.text) {
                // LLM 返回文本（可能是最終代碼）
                conversationHistory.push({
                    role: 'assistant',
                    content: response.text
                });

                // 檢查是否包含完整 HTML
                if (response.text.includes('</html>')) {
                    log.push({ type: 'potential_code', iteration });
                    // 提示 LLM 調用 finalize_code
                    conversationHistory.push({
                        role: 'user',
                        content: '你似乎已生成了代碼。請調用 validate_glue_integration 驗證整合，然後調用 finalize_code 提交最終代碼。'
                    });
                }
            }
        }

        // 結束
        const success = !!finalResult;
        log.push({ type: 'end', success, iterations: iteration, timestamp: Date.now() });

        console.log(`%c${success ? '✅' : '❌'} Agent Loop 結束 (${iteration} iterations)`,
            success ? 'color: #22c55e; font-weight: bold' : 'color: #ef4444; font-weight: bold');

        return {
            success,
            code: finalResult?.code || null,
            integratedSkills: finalResult?.stats?.skills || [],
            log
        };
    },

    /**
     * 構建 System Prompt
     */
    _buildSystemPrompt() {
        return `你是一個專業的全端工程師，正在使用 Skill Agent 系統來生成代碼。

你可以調用以下函數來獲取技能信息並確保代碼正確整合：

1. list_available_skills - 查看有哪些可用的技能模組
2. load_skill_content - 載入技能的完整內容
3. get_skill_glue_code - 獲取技能的膠水代碼（必須整合到你的代碼中）
4. get_skill_dependencies - 檢查技能的依賴關係
5. validate_glue_integration - 驗證你的代碼是否正確整合了所有技能
6. finalize_code - 提交最終代碼

【重要工作流程】
1. 首先調用 list_available_skills 了解有哪些可用技能
2. 根據需求選擇合適的技能，調用 load_skill_content 載入
3. 調用 get_skill_dependencies 確保載入所有依賴
4. 調用 get_skill_glue_code 獲取必須實現的整合代碼
5. 在你的實現中整合膠水代碼
6. 完成後調用 validate_glue_integration 驗證
7. 最後調用 finalize_code 提交

【代碼無縫接軌原則】
- 膠水代碼必須完整複製，不可修改核心邏輯
- 類別名稱和方法簽名必須與技能定義完全一致
- 事件綁定必須使用技能指定的元素 ID
- 依賴項必須按順序初始化`;
    },

    /**
     * 構建初始 Prompt
     */
    _buildInitialPrompt(task, specification) {
        return `【任務】
${task}

【規格文檔】
${specification}

請開始生成代碼。首先調用 list_available_skills 查看可用的技能，然後決定需要使用哪些技能來完成這個任務。`;
    },

    /**
     * 構建續接 Prompt
     */
    _buildContinuationPrompt(history) {
        // 返回最後的函數結果或對話
        const lastEntry = history[history.length - 1];
        if (lastEntry.role === 'function') {
            return `函數 ${lastEntry.name} 返回結果：\n${lastEntry.content}\n\n請根據結果繼續你的工作。`;
        }
        return '請繼續。';
    },

    /**
     * 調用 Gemini with Function Calling
     */
    async _callGeminiWithFunctions(prompt, systemPrompt, callGemini, apiConfig) {
        // 構建帶有 Function Declarations 的請求
        const functionDeclarations = SkillAgent.getFunctionDeclarations();

        // 使用 Gemini 的 Function Calling 格式
        const requestBody = {
            contents: [
                { role: 'user', parts: [{ text: systemPrompt + '\n\n' + prompt }] }
            ],
            tools: [{
                functionDeclarations: functionDeclarations
            }],
            generationConfig: {
                temperature: 0.3,
                maxOutputTokens: 65536
            }
        };

        try {
            // 直接調用 Gemini API (需要原生調用，不是 callKimi)
            const url = `https://generativelanguage.googleapis.com/v1beta/models/${apiConfig.model}:generateContent?key=${encodeURIComponent(apiConfig.key)}`;

            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(requestBody)
            });

            if (!response.ok) {
                console.error('Gemini API Error:', await response.text());
                return null;
            }

            const data = await response.json();

            // 解析回應
            const candidate = data.candidates?.[0];
            if (!candidate) return null;

            const parts = candidate.content?.parts || [];

            // 檢查是否有 Function Calls
            const functionCalls = parts
                .filter(p => p.functionCall)
                .map(p => ({
                    name: p.functionCall.name,
                    args: p.functionCall.args
                }));

            // 檢查是否有文本回應
            const text = parts
                .filter(p => p.text)
                .map(p => p.text)
                .join('');

            return {
                functionCalls: functionCalls.length > 0 ? functionCalls : null,
                text: text || null
            };
        } catch (err) {
            console.error('Gemini Function Calling Error:', err);
            return null;
        }
    }
};

// ═══════════════════════════════════════════════════════════════════════════
// 📦 MODULE EXPORTS
// ═══════════════════════════════════════════════════════════════════════════

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { SkillAgent, SkillAgentLoop, SKILL_AGENT_FUNCTIONS };
}

if (typeof window !== 'undefined') {
    window.SkillAgent = SkillAgent;
    window.SkillAgentLoop = SkillAgentLoop;
    window.SKILL_AGENT_FUNCTIONS = SKILL_AGENT_FUNCTIONS;
}
