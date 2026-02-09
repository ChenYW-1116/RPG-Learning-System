# 🔍 Skills 系統執行流程分析報告

本文檔詳細說明 Spec Kit Agent 中 Skills 系統的運作機制和 LLM 通信流程。

---

## 📊 系統架構概覽

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          SPEC KIT AGENT 執行流程                              │
└─────────────────────────────────────────────────────────────────────────────┘

 用戶輸入需求
      │
      ▼
┌──────────────────┐     ┌──────────────────┐     ┌──────────────────┐
│  Phase 0:        │ ──▶ │  Phase 1:        │ ──▶ │  Phase 2:        │
│  系統診斷        │     │  技能發現        │     │  Prompt 構建     │
│  (Diagnostics)   │     │  (Skill Disc.)   │     │  (Prompt Build)  │
└──────────────────┘     └──────────────────┘     └──────────────────┘
                                                          │
      ┌───────────────────────────────────────────────────┘
      ▼
┌──────────────────┐     ┌──────────────────┐     ┌──────────────────┐
│  Phase 3:        │ ──▶ │  Phase 4:        │ ──▶ │  Phase 5:        │
│  API 請求        │     │  代碼提取        │     │  優化循環        │
│  (LLM Call)      │     │  (Extraction)    │     │  (Opt. Loop)     │
└──────────────────┘     └──────────────────┘     └──────────────────┘
```

---

## 🔌 Phase 1: 技能發現 (Skill Discovery)

### 執行位置
- **文件**: `modules/code-generator.js`
- **方法**: `SkillInjector.loadMandatorySkills()`

### 執行流程

```javascript
// 1. 定義強制載入的技能清單
const criticalSkillNames = [
    'spec-app-runtime-hardening',     // 通用強化 (在 openclaw-main)
    'spec-kit-compliance-checker',    // 合規檢查 (在 openclaw-main)
    'gemini-api-wrapper',             // API 調用層 (在 .agent/skills)
    'ai-essay-analyzer',              // 範文分析 (在 .agent/skills)
    'ai-blind-write-diagnosis',       // 盲寫診斷 (在 .agent/skills)
    // ... 更多
];

// 2. 調用 Bridge Server 列出可用技能
const allSkills = await listSkills(); // POST /fs/list-skills

// 3. 逐個載入技能內容
for (const name of skillNames) {
    const skill = allSkills.find(s => s.name === name);
    if (skill) {
        const content = await loadSkillContent(skill.path); // POST /fs/read-file
        // 強調膠水代碼
        const enhanced = _highlightGlueCode(content, skill.name);
        skillContent += enhanced;
    }
}
```

### Console 輸出示例

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔌 SKILL DISCOVERY 階段開始
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
待載入技能清單 (11 個):
  [1] spec-app-runtime-hardening
  [2] spec-kit-compliance-checker
  ...
📂 Bridge Server 返回 6 個可用技能
⚠️ 技能未找到: spec-app-runtime-hardening
⚠️ 技能未找到: spec-kit-compliance-checker
✅ 鎖定技能模組: gemini-api-wrapper
   📂 Path: .agent/skills/gemini-api-wrapper/SKILL.md
   📏 Content: 2.34 KB (2398 chars)
   🔗 膠水代碼: ✓ 已識別
✅ 鎖定技能模組: ai-essay-analyzer
   📂 Path: .agent/skills/ai-essay-analyzer/SKILL.md
   📏 Content: 4.39 KB (4499 chars)
   🔗 膠水代碼: ✓ 已識別
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ 技能載入完成: 6/11 個成功
📦 總技能內容大小: 18.52 KB
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## 📝 Phase 2: Prompt 構建 (Prompt Build)

### 執行位置
- **文件**: `modules/code-generator.js`
- **方法**: `PromptBuilder.buildImplementPrompt()`

### Prompt 組成結構

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                            最終 PROMPT 結構                                   │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│ 1. TEMPLATE (命令模板)                                                        │
│    來源: SDD_COMMANDS.implement.prompt                                        │
│    內容: 角色定義、執行流程、輸出要求等                                            │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ 2. CONTEXT INJECTION (上下文注入)                                             │
│    {CONSTITUTION} → state.constitutionMarkdown                               │
│    {ANALYSIS}     → state.analysisMarkdown                                   │
│    {CHECKLIST}    → state.checklistMarkdown                                  │
│    {PLAN}         → state.planMarkdown                                       │
│    {TASKS}        → state.tasksMarkdown                                      │
│    {SPEC}         → state.specMarkdown                                       │
│    {TEST_SCRIPT}  → state.testCode                                           │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ 3. SKILLS CONTENT (技能內容)                                                  │
│    格式:                                                                      │
│    # 🛡️ MANDATORY SKILL: gemini-api-wrapper                                  │
│    [SKILL.md 全文]                                                            │
│    <!-- ⚠️ @GLUE:REQUIRED -->                                                │
│    [膠水代碼部分]                                                              │
│    <!-- ⚠️ END @GLUE:REQUIRED -->                                            │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ 4. GLUE CONTRACT PROMPT (膠水合約)                                            │
│    # 🔗 SKILL GLUE CODE CHECKLIST (MANDATORY)                                │
│    ## Loaded Skills Checklist:                                               │
│       - [ ] `gemini-api-wrapper`: 類別實例化 + 事件綁定 + i18n Keys           │
│       - [ ] `ai-essay-analyzer`: ...                                         │
│    ## 🚫 ANTI-SKIP PROTOCOL                                                  │
│    (防止 LLM 跳過膠水代碼實現)                                                  │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Console 輸出示例

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📝 PROMPT 構建階段
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📋 上下文組件:
   📄 Template: 3.2 KB
   📄 Spec: 2.1 KB
   📋 Plan: 1.8 KB
   ✅ Tasks: 1.5 KB
   📜 Constitution: 2.3 KB
   🔍 Analysis: 1.2 KB
   ✓ Checklist: 0.8 KB
   🧪 Test Script: 3.5 KB
   🔌 Skills: 18.5 KB

📦 最終 Prompt 統計:
   總大小: 34.90 KB (35737 chars)
   預估 Tokens: ~8935

📋 Prompt 預覽 (前 500 字符):
─────────────────────────────────────────────
# Role: 高級全端軟體架構師 (Senior Full-Stack Architect)

## Context
我現在提供一個專案的完整規格文件集，包含：
1. `CONSTITUTION.md`: 專案憲法（程式碼規範與品質原則）
...
─────────────────────────────────────────────
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## 🌐 Phase 3: LLM API 請求 (API Request)

### 執行位置
- **文件**: `spec-kit-sdd-core.js`
- **方法**: `callKimi()`

### API 請求流程

```javascript
// 1. 決定 Provider 和 Key
const currentConfig = resolveAIConfig(null, phase);
// phase: 'phase1' (規劃用 Kimi), 'phase2' (實現用 Gemini), 'reverse' (優化用 Gemini)

// 2. 構建請求 Body
if (provider === 'gemini') {
    // Gemini Native Format
    requestBody = {
        contents: [
            { role: 'user', parts: [{ text: systemPrompt + '\n\n' + prompt }] }
        ],
        generationConfig: {
            temperature: 0.5,
            maxOutputTokens: 65536
        }
    };
} else {
    // OpenAI Format (for Kimi)
    requestBody = {
        model: activeModel,
        messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: prompt }
        ]
    };
}

// 3. 發送請求
const response = await fetch(finalUrl, {
    method: 'POST',
    headers: headers,
    body: JSON.stringify(requestBody)
});

// 4. 解析回應
// Gemini: data.candidates[0].content.parts[0].text
// OpenAI: data.choices[0].message.content
```

### Console 輸出示例

```
═══════════════════════════════════════════════════════════
🌐 LLM API REQUEST 階段
═══════════════════════════════════════════════════════════
📌 Request ID: REQ-123456
⏱️ 請求時間: 2026-02-05T20:26:08.123Z
📝 Prompt 大小: 34.90 KB (35737 chars)
🤖 System Prompt: 你是一個專業的軟體工程師...
🎯 Phase: phase2
📍 Provider: gemini
🤖 Model: gemini-3-flash-preview
🔑 API Key: AIzaSyBF2...r2l0
📡 URL: (Native Gemini Endpoint)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ API RESPONSE 成功 (Gemini Format)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📦 Response 大小: 89.23 KB (91372 chars)
🎯 回應格式: Gemini

📋 Response 預覽 (前 300 字符):
─────────────────────────────────────────────
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width...
─────────────────────────────────────────────
🔍 HTML 結構檢查: 開頭標籤=✓, 結尾標籤=✓
═══════════════════════════════════════════════════════════
```

---

## 🔄 Phase 5: 優化循環 (Optimization Loop)

### 執行流程

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                            OPTIMIZATION LOOP                                 │
└─────────────────────────────────────────────────────────────────────────────┘

        Initial HTML Code (Phase 0 輸出)
                    │
                    ▼
┌─────────────────────────────────────────┐
│  Phase 1: HTML → Spec                   │
│  使用 reverse.md 技能                    │
│  將代碼逆向工程為規格文檔                  │
│  輸出: reverseSpec                       │
└─────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────┐
│  Phase 2: Spec → HTML                   │
│  🆕 使用 Skill Agent (Function Calling) │
│  LLM 動態查詢和調度技能                   │
│  確保代碼無縫接軌                         │
│  輸出: optimizedCode                    │
└─────────────────────────────────────────┘
                    │
                    ▼
        Final Optimized HTML Code
```

---

## 🤖 NEW: Skill Agent Function Calling 系統

### 核心概念

**Skill Agent** 是一個讓 LLM 能夠動態查詢和調度技能的系統。LLM 可以：

1. **查詢可用技能** - 了解有哪些功能模組可用
2. **按需載入技能** - 只載入需要的技能內容
3. **獲取膠水代碼** - 獲取必須實現的整合代碼
4. **驗證整合** - 確保代碼正確整合了所有技能
5. **提交最終代碼** - 驗證通過後提交

### LLM 可調用的函數

| 函數名稱 | 描述 | 參數 |
|---------|------|------|
| `list_available_skills` | 列出所有可用技能 | `category?`: 類別過濾 |
| `load_skill_content` | 載入技能完整內容 | `skill_name`: 技能名稱 |
| `get_skill_glue_code` | 獲取膠水代碼片段 | `skill_name`: 技能名稱 |
| `get_skill_dependencies` | 獲取技能依賴關係 | `skill_name`: 技能名稱 |
| `validate_glue_integration` | 驗證代碼整合 | `code`, `used_skills` |
| `finalize_code` | 提交最終代碼 | `final_code`, `integrated_skills` |

### Agent 循環流程

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          SKILL AGENT LOOP                                    │
└─────────────────────────────────────────────────────────────────────────────┘

    ┌──────────────┐
    │ 開始任務     │
    │ (Spec 輸入)  │
    └──────┬───────┘
           │
           ▼
    ┌──────────────────────────────────────┐
    │ LLM 調用 list_available_skills()    │◄──────────────────────┐
    │ 查看有哪些可用技能                    │                       │
    └──────┬───────────────────────────────┘                       │
           │                                                       │
           ▼                                                       │
    ┌──────────────────────────────────────┐                       │
    │ LLM 決定需要哪些技能                  │                       │
    │ 調用 load_skill_content(skill_name)  │                       │
    └──────┬───────────────────────────────┘                       │
           │                                                       │
           ▼                                                       │
    ┌──────────────────────────────────────┐                       │
    │ LLM 檢查依賴關係                      │                       │
    │ 調用 get_skill_dependencies()        │                       │
    └──────┬───────────────────────────────┘                       │
           │                                                       │
           ▼                                                       │
    ┌──────────────────────────────────────┐                       │
    │ LLM 獲取膠水代碼                      │                       │
    │ 調用 get_skill_glue_code()           │          Multi-Turn   │
    └──────┬───────────────────────────────┘          Loop         │
           │                                          (最多 15 輪) │
           ▼                                                       │
    ┌──────────────────────────────────────┐                       │
    │ LLM 生成代碼                          │                       │
    │ 整合膠水代碼到實現中                   │                       │
    └──────┬───────────────────────────────┘                       │
           │                                                       │
           ▼                                                       │
    ┌──────────────────────────────────────┐                       │
    │ LLM 調用 validate_glue_integration() │                       │
    │ 驗證所有技能都已正確整合               │                       │
    └──────┬───────────────────────────────┘                       │
           │                                                       │
           │ 驗證失敗?─────────────────────────────────────────────┘
           │ 驗證通過 ▼
    ┌──────────────────────────────────────┐
    │ LLM 調用 finalize_code()             │
    │ 提交最終代碼                          │
    └──────┬───────────────────────────────┘
           │
           ▼
    ┌──────────────┐
    │ 輸出最終代碼  │
    │ + 整合的技能  │
    └──────────────┘
```

### 代碼無縫接軌驗證

Skill Agent 通過以下機制確保代碼無縫接軌：

#### 1. 類別實例化檢查
```javascript
// 膠水代碼要求
const essayAnalyzer = new AIEssayAnalyzer(geminiApi);

// 驗證器檢查
if (!code.includes('new AIEssayAnalyzer')) {
    issues.push('缺少類別實例化: new AIEssayAnalyzer()');
}
```

#### 2. 事件綁定檢查
```javascript
// 膠水代碼要求
document.getElementById('analyzeBtn').addEventListener('click', ...)

// 驗證器檢查
if (!code.includes('analyzeBtn') || !code.includes('addEventListener')) {
    issues.push('缺少事件綁定: analyzeBtn.click');
}
```

#### 3. 依賴關係檢查
```javascript
// ai-essay-analyzer 依賴 gemini-api-wrapper
if (usedSkills.includes('ai-essay-analyzer') && 
    !usedSkills.includes('gemini-api-wrapper')) {
    issues.push('缺少依賴: ai-essay-analyzer 需要 gemini-api-wrapper');
}
```

### Console 輸出示例

```
🤖 Skill Agent 已初始化
🔄 Skill Agent Loop 開始
📍 Iteration 1/15
🔧 Skill Agent 執行: list_available_skills
📋 找到 70 個技能
📍 Iteration 2/15
🔧 Skill Agent 執行: load_skill_content { skill_name: 'gemini-api-wrapper' }
📦 從緩存載入: gemini-api-wrapper
✅ 技能已載入: gemini-api-wrapper (2.34 KB)
📍 Iteration 3/15
🔧 Skill Agent 執行: get_skill_glue_code { skill_name: 'ai-essay-analyzer' }
...
📍 Iteration 8/15
🔧 Skill Agent 執行: validate_glue_integration
✅ 驗證通過！所有 3 個技能都已正確整合。
📍 Iteration 9/15
🔧 Skill Agent 執行: finalize_code
✅ 代碼已完成
✅ Agent Loop 結束 (9 iterations)
```

---

## 📂 重要文件結構

```
C:\2026 Tasks\07. Empire\
├── spec-kit-sdd-core.js          # 主核心文件 (狀態管理, API 調用)
├── spec-kit-bridge.js            # Bridge Server (Node.js 文件系統訪問, 雙層技能掃描)
│
├── modules/
│   ├── code-generator.js         # 代碼生成模組 (Prompt 構建, 技能注入, 優化循環)
│   ├── llm-debug-logger.js       # LLM Debug 日誌模組
│   └── skill-agent.js            # 🆕 Skill Agent 模組 (LLM Function Calling)
│
├── openclaw-main/
│   └── skills/                   # 🥈 Priority 2: 通用技能庫 (64 個技能)
│       ├── spec-app-runtime-hardening/
│       ├── spec-kit-compliance-checker/
│       ├── frontend-robust-boot/
│       └── ... (更多通用技能)
│
└── .agent/
    ├── SKILL_REGISTRY.md         # 技能註冊表 (文檔)
    ├── SKILL_EXECUTION_FLOW.md   # 本文檔
    └── skills/                   # 🥇 Priority 1: 專案專屬技能 (6 個技能)
        ├── gemini-api-wrapper/   # API 調用封裝
        │   └── SKILL.md
        ├── ai-essay-analyzer/    # 範文分析
        │   └── SKILL.md
        ├── ai-blind-write-diagnosis/
        │   └── SKILL.md
        ├── ai-essay-rewriter/
        │   └── SKILL.md
        ├── ai-inspiration-generator/
        │   └── SKILL.md
        └── ui-loader-manager/
            └── SKILL.md
```

---

## 🔧 使用 Debug Logger

現在你可以在瀏覽器 Console 中看到完整的 LLM 通信過程：

1. **技能發現階段**: 紫色輸出，顯示每個技能的載入狀態
2. **Prompt 構建階段**: 藍色輸出，顯示上下文組件和最終 Prompt
3. **API 請求階段**: 綠色輸出，顯示請求參數和回應內容

如需下載完整日誌：

```javascript
// 在瀏覽器 Console 中執行
CodeGenLogger.downloadLog('my-session.log');
```

---

## ✅ 總結

| 階段 | 負責模組 | 主要輸出 |
|------|----------|----------|
| 技能發現 | `SkillInjector.loadMandatorySkills` | 技能內容 + 膠水代碼標記 |
| Prompt 構建 | `PromptBuilder.buildImplementPrompt` | 完整 Prompt (30-50 KB) |
| API 請求 | `callKimi` | HTML 代碼 (50-150 KB) |
| 代碼提取 | `CodeExtractor.extractHTML` | 清理後的 HTML |
| 優化循環 | `OptimizationLoop.execute` | 優化版 HTML |

