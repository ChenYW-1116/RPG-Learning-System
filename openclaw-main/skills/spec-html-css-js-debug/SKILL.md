---
name: spec-html-css-js-debug
description: A comprehensive frontend verification and debugging skill for HTML, CSS, and JavaScript. It systematically checks code against specifications, validates accessibility (A11y), style consistency, and script logic.
use-when: Always use this skill when generating, modifying, or debugging frontend code (HTML/CSS/JS), or when the user asks to "verify", "check", "audit", or "fix" UI/UX issues. Useful for validating compliance with design specs and functional requirements.
disable-model-invocation: false
allowed-tools: Read, Grep, Glob
---

# Spec-HTML-CSS-JS Debug Skill

本技能用於系統性檢查前端實作（HTML/CSS/JS）是否符合規格（Spec）並透過檢查清單發現潛在錯誤。

## 第 1 步：分析需求與規格 (Spec Analysis)

在開始檢查程式碼之前，請先確認當前的規格需求（Spec）：
- 閱讀使用者提供的 Spec 文件或描述。
- 確認目標功能、預期行為、設計樣式規範。

## 第 2 步：載入檢查清單

本技能依賴以下檢查清單，請在執行過程中參考：
- HTML 檢查：`checks/html.md`
- CSS 檢查：`checks/css.md`
- JavaScript 檢查：`checks/js.md`

## 第 3 步：HTML 檢查

請先確認 spec 與實作的 HTML 是否一致，並依 `checks/html.md` 檢查：

1. **結構對應**：
   - spec 中的元件名稱、巢狀結構是否相符？
   - 有無 `id` 重複或 `class` 命名錯誤？

2. **語意與表單**：
   - 表單、按鈕、輸入等是否使用語意標籤？
   - 有無遺漏 `name`、`id`、`label` 與 `required`？

3. **可及性（A11y）**：
   - 所有互動元素是否鍵盤可訪問？
   - `aria-*` 屬性是否正確？

4. **輸出**：
   - 如果發現不符，列出 HTML 層的問題，並提供符合規格的修改範例。

## 第 4 步：CSS 檢查

依 `checks/css.md` 執行 CSS 檢查，並確認是否與規格一致：

1. **選擇器與特異性**：
   - 檢查選擇器是否太寬，`!important`是否過多。
   - 檢查 `id`/`class` 是否與規格要求的命名一致。

2. **盒模型與佈局**：
   - 檢查 `box-sizing`、`margin`/`padding` 是否造成意外位移。
   - 檢查 `flex`/`grid`/`position` 是否與規格設計相符。

3. **視覺與狀態**：
   - 檢查 `color`、`font`、`border`、`shadow` 是否符合設計稿。
   - 檢查 `:hover`、`:focus`、`.loading` 等狀態是否正確觸發。

4. **輸出**：
   - 如果是樣式錯亂，明確指出：
     - 哪個 CSS 規則衝突？
     - 建議如何調整 `z-index`、`position` 或 `flex/grid`？
   - 提供修正後的 CSS 片段與理由。

## 第 5 步：JavaScript 檢查

依 `checks/js.md` 檢查 JavaScript 邏輯：

1. **DOM 與事件**：
   - 是否有元素 `null`／`undefined`？
   - 事件目標是否正確？`preventDefault` 有無遺漏？

2. **非同步**：
   - `fetch`/`API` 呼叫有無 `try`／`catch`？
   - `Promise` 有無 `catch`，或 `async` 有無 `await`？

3. **狀態與條件**：
   - `state` / `props` 是否正確更新？
   - `if` 條件有無 `null`/`undefined` 等漏網之魚？

4. **輸出**：
   - 如果是 JS 不動，明確指出：
     - 哪行程式碼有 `error`？
     - `API` 請求有無問題？
   - 提供修正後的 JS 範例與理由。

## 進階提示：整合工具與流程

- 有 linter（如 `stylelint` / `eslint`）時：
  - 除錯前可先提示：「請先執行 `npm run lint`／`stylelint`，修正靜態錯誤後再分析」。

- 有 `@rules` 時：
  - 在 `spec-html-css-js-debug` 中引用 `.cursor/rules/frontend.md`，統一 `button`、`class` 命名等規則。

- 有 `@hooks` 時：
  - 可在 `SKILL.md` 中加入 hook 指令，讓 Agent 知道：
    ```
    Before committing:
    1. Run `stylelint` on the CSS files
    2. Run `eslint` on the JS files
    3. Run `npm run test` on the component tests
    ```

- 有 `@tests` 時：
  - 分析時可參考 `__tests__/` 或 `tests/` 目錄，確認規格要求的行為是否有對應測試。
  - 建議：未測試的狀態（如 `loading`、`error`）應補測試。
