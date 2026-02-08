# 🗂️ 完整技能庫清單 (Skill Registry)

本文檔記錄了所有可用的技能來源，按優先順序排列。

---

## 📍 技能庫優先順序

```
┌─────────────────────────────────────────────────────────────────┐
│                     技能發現順序 (Priority Order)                │
└─────────────────────────────────────────────────────────────────┘

優先級 1: .agent/skills/          ← 專案專屬技能 (Project-Specific)
    │
    ▼
優先級 2: openclaw-main/skills/   ← 通用技能庫 (Universal Library)
```

---

## 📁 優先級 1: `.agent/skills/` (專案專屬)

| Skill 名稱 | 用途 | Mounting Mode |
|-----------|------|---------------|
| `gemini-api-wrapper` | Gemini API 調用封裝 + 指數退避重試 | Reference |
| `ai-essay-analyzer` | 雅思範文分析 (被動句、高級詞彙) | Reference |
| `ai-essay-rewriter` | AI 高階文章改寫 (Band 9) | Reference |
| `ai-inspiration-generator` | AI 寫作靈感助手 | Reference |
| `ai-blind-write-diagnosis` | 盲寫表現診斷 | Snippet |
| `ui-loader-manager` | UI 加載狀態管理 | Snippet |

---

## 📁 優先級 2: `openclaw-main/skills/` (通用庫)

### 🔧 代碼生成 & 修復類

| Skill 名稱 | 用途 | 適用場景 |
|-----------|------|---------|
| `spec-app-runtime-hardening` | SPA 應用強化 (DataService, UIHandler, Lifecycle) | 生成健壯的 Web 應用 |
| `robust-test-runner` | 測試執行器最佳實踐 (防止 context 丟失) | 編寫 E2E 測試 |
| `spec-kit-app-repair` | 修復生成的 Web 應用 (邏輯、測試、i18n) | 修復截斷或錯誤代碼 |
| `spec-html-css-js-debug` | 前端調試 (HTML/CSS/JS檢查清單) | 調試 UI 問題 |
| `spec-alignment-strategy` | 代碼與測試規格對齊 | 修復測試失敗 |
| `precise-execution` | 高精度執行 (反幻覺) | 複雜重構任務 |
| `coding-agent` | 調用 Codex/Claude Code 等工具 | 並行編碼任務 |

### 🌐 API & 服務類

| Skill 名稱 | 用途 | 適用場景 |
|-----------|------|---------|
| `gemini` | Gemini CLI 一次性調用 | 快速 Q&A |
| `openai-image-gen` | OpenAI 圖像生成 | 生成 UI 素材 |
| `openai-whisper` | Whisper 語音轉文字 | 語音輸入 |
| `github` | GitHub API 操作 | PR/Issue 管理 |

### 📊 數據 & 分析類

| Skill 名稱 | 用途 | 適用場景 |
|-----------|------|---------|
| `spec-kit-data-simulation` | 數據模擬層 (含延遲) | 前端開發測試 |
| `spec-kit-compliance-checker` | 合規性檢查 | 代碼審查 |
| `spec-kit-triangulation` | 三角驗證 | 複雜問題分析 |
| `summarize` | 內容摘要 | 文檔處理 |

### 🔄 工作流 & 自動化類

| Skill 名稱 | 用途 | 適用場景 |
|-----------|------|---------|
| `skill-creator` | 創建新技能 | 擴展技能庫 |
| `auto-fix-styling` | 自動修復樣式 | 格式化代碼 |
| `frontend-robust-boot` | 前端健壯啟動 | 項目初始化 |
| `session-logs` | 會話日誌 | 調試追蹤 |

### 📱 第三方整合類

| Skill 名稱 | 用途 | 適用場景 |
|-----------|------|---------|
| `slack` | Slack 集成 | 通知 |
| `discord` | Discord 集成 | 通知 |
| `notion` | Notion 集成 | 文檔同步 |
| `obsidian` | Obsidian 集成 | 知識庫 |
| `trello` | Trello 集成 | 任務管理 |
| `github` | GitHub 集成 | 版本控制 |

---

## 🔍 技能發現流程

```javascript
/**
 * 技能發現算法
 * @param {string} requirement - 用戶需求描述
 * @returns {Promise<Skill[]>} 匹配的技能列表
 */
async function discoverSkills(requirement) {
    const results = [];
    
    // Step 1: 優先搜索專案專屬技能
    const projectSkills = await scanDirectory('.agent/skills/');
    for (const skill of projectSkills) {
        if (matchesRequirement(skill, requirement)) {
            results.push({ ...skill, priority: 1 });
        }
    }
    
    // Step 2: 如果專案技能不足，搜索通用技能庫
    if (results.length === 0 || needsMoreSkills(requirement)) {
        const universalSkills = await scanDirectory('openclaw-main/skills/');
        for (const skill of universalSkills) {
            if (matchesRequirement(skill, requirement)) {
                results.push({ ...skill, priority: 2 });
            }
        }
    }
    
    // Step 3: 按優先級和相關性排序
    return results.sort((a, b) => {
        if (a.priority !== b.priority) return a.priority - b.priority;
        return b.relevance - a.relevance;
    });
}
```

---

## 📋 技能匹配關鍵字表

| 需求關鍵字 | 推薦技能 |
|-----------|---------|
| `API 調用`, `Gemini`, `重試` | `gemini-api-wrapper`, `gemini` |
| `UI 加載`, `按鈕禁用`, `spinner` | `ui-loader-manager` |
| `SPA`, `強化`, `toast`, `loading` | `spec-app-runtime-hardening` |
| `測試`, `E2E`, `runner` | `robust-test-runner`, `spec-alignment-strategy` |
| `修復`, `截斷`, `錯誤` | `spec-kit-app-repair` |
| `調試`, `CSS`, `JavaScript` | `spec-html-css-js-debug` |
| `高精度`, `複雜`, `反幻覺` | `precise-execution` |
| `並行編碼`, `Codex`, `Claude` | `coding-agent` |

---

## 🔗 技能依賴關係

```
spec-kit-app-repair
├── depends on: robust-test-runner (測試部分)
├── depends on: spec-alignment-strategy (對齊部分)
└── suggests: spec-html-css-js-debug (調試部分)

spec-app-runtime-hardening
├── suggests: spec-kit-data-simulation (數據層)
└── suggests: ui-loader-manager (加載狀態)

gemini-api-wrapper
└── used by: ai-essay-analyzer, ai-essay-rewriter, ai-inspiration-generator, ai-blind-write-diagnosis
```

---

---

## 🛡️ 技能膠水代碼強制執行原則 (Glue Code Enforcement)

為確保技能 (Skills) 不僅被載入模型上下文，還能被**實質性地整合**進最終代碼，系統實施了以下強制策略：

### 1. 強制載入機制 (Mandatory Loading)
在 `code-generator.js` 中定義了 `criticalSkillNames` 清單。不論用戶需求為何，以下技能將**始終被載入**：
- `gemini-api-wrapper` (API 底層)
- `ui-loader-manager` (UI 反饋)
- `spec-app-runtime-hardening` (運行時強化)
- **專案核心業務技能** (如雅思分析、改寫、診斷等)

### 2. 膠水代碼標記規範 (@GLUE:REQUIRED)
所有 `SKILL.md` 的 `### Glue Code` 區塊必須使用特殊註釋包裹，以觸發系統的自動高亮與檢查機制：
```markdown
### Glue Code
<!-- ⚠️ @GLUE:REQUIRED -->
[代碼內容]
<!-- ⚠️ END @GLUE:REQUIRED -->
```

### 3. 自動生成的整合檢查清單 (Auto-Checklist)
系統會根據已載入的技能動態生成檢查清單，並強制 LLM 在輸出前自我核對：
1. **類別實例化**：例如 `const analyzer = new AIEssayAnalyzer(geminiApi);`
2. **依賴順序**：先初始化 `GeminiAPIWrapper`，再初始化依賴它的業務技能。
3. **事件綁定**：確保 `addEventListener` 邏輯被完整複製到 `setupListeners` 函數中。
4. **i18n Key 註冊**：若技能使用了 `translate('key')`，該 Key 必須存在於語系字典中。

### 4. 🚫 反跳過協議 (Anti-Skip Protocol)
- **禁止死代碼**：定義了輔助函數 (如 `handleDiagnosis`) 卻未在初始化邏輯中調用，視為失敗。
- **防止靜默跳過**：若 LLM 輸出 `</html>` 前未完成清單中的項目，代碼將無法通過驗收。
- **高亮強調**：系統會在 Prompt 中使用 `🛡️ MANDATORY SKILL` 標題強化這些技能的存在感。

---

## ✅ 執行與驗收清單 (Updated)

當執行代碼生成任務時，系統遵循以下流程：

1. [x] **自動載入**：讀取 `criticalSkillNames` 指定的強制技能。
2. [x] **膠水加強**：自動包裹 `@GLUE:REQUIRED` 標記。
3. [x] **生成合約**：在 Prompt 中插入 `SKILL GLUE CODE CHECKLIST`。
4. [ ] **AI 實作**：LLM 按照檢查清單進行完整代碼整合。
5. [ ] **驗證檢查**：通過 `injectTestRunner` 驗證所有功能按鈕與邏輯是否正常運作。
