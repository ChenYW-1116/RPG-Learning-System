# 規格分析報告

## 發現問題

### 🔴 CRITICAL
- **A1**: 「48 h 內完成五篇」與「每篇限時 15 min」在數學上衝突──5×15 min＝75 min＞48 h；規格未說明是否允許中斷或跨日累計。  
  ‑位置: US-1、FR-002、T005  
  ‑建議: 改為「48 h 滑動窗口內累計提交五篇，單次寫作限時 15 min（可暫停）」，並於 TimerCore 提供「跨日續寫」開關。

- **A2**: Word COM API／OfficeScript Shim「純前端」不可行：ActiveX 僅 IE11、Office Online ScriptLab需後端中繼；規格要求零部署卻依賴本地 Office API，技術不可達。  
  ‑位置: FR-001、T006、計畫章節「Word Count API Shim(純前端)」  
  ‑建議: (a)降規：改手動貼上對話框為唯一模式；(b)增規：提供選配 Electron-wrapper，內嵌 Node-COM API。

### 🟡 HIGH
- **B1**: 「internal SD<0.4」母體未定義→造成驗收情境無法自動化測試。  
   ‑位置: US-3、FR-005、T011 Needs Clarification #22  
   ‑建議: SD=同一考生近兩次 Mock Band分差標準差；補充公式與欄位命名(internal_sd→candidate_band_sd)。

- **B2**: Template Parser僅給命中率公式，卻無附「官方 Process Verb / Linkers清單」檔案或下載來源，導致 NLPScorer無法落地。  
   ‑位置: FR-003、T008 Success Criteria SC-002  
   ‑建議: (a)附件 A：列出完整 verb & linker lexicon（CSV）；(b)允許考官於 SettingsModal維護自訂詞表。

### 🟢 MEDIUM/LOW
| ID | Issue | Location | Severity | Recommendation |
|----|-------|----------|----------|----------------|
| C1 | 「Band≥8,.0」「SD<0,.4」「ADVANCED_TO_TASK_22」等數字含多餘逗號/句號，屬 OCR typo | US-3, FR-005, T011 | Low | Global regex replace `(\d),(\d)` → `$1.$2` |
| C2 | UI i18n switcher列為架構設計但無具體 key list；可能漏譯 email template變數{{userName}}等 | Plan-i18n, T003, Notifier Engine | Medium | Provide i18n JSON skeleton & variable mapping table |
| C3｜LocalStorage schema v1未定義欄位型態與長度上限；可能導致 migration失敗｜Plan-Migration｜Medium｜補充 schema.json & max-length rule（如 essay≤20 k chars）|
| C4｜EmailJS browser SDK每日免費額度200封，若班級使用易超量；合約風險未揭露｜FR‑006,T012｜Medium｜增加 quota guard + fallback SMTP config |

## 🔍 SPEC GAP / NEEDS CLARIFICATION
依照 Needs Clarification章節再追蹤：
N1. Topic bank？→決策：**不限題材**，系統不叠題庫。
N2. SD母體？→見 B1。
N3. Task22功能？→**本期 out-of-scope**，僅留入口按鈕 placeholder。

## ♻️ DUPLICATED / OVERLAPPED TASKS
DUP-T004/T005/T006皆含 Timer&WordCount&Gate邏輯且可平行──需在 app.js拆成同一 use-case service避免狀態不一致。
DUP-T007/T008皆標注【FR‑003】──應合併為子任務 T007-a Parser / T007-b Scorer。

## ✅ COVERAGE vs TASK MAPPING

| Spec Item        │ Tasks Trace            │ Coverage Status |
|------------------|------------------------|------------------|
| US‑1             │ T004,T005,T006         │ Full             |
| US‑2             │ T007,T008,T009         │ Full             |
| US‑3             │ T010,T011              │ Full             |
| FR‑001           │ T004,T006              │ Partial*         |
*(Word COM可行性待修)
SC‑001│T014│E2E腳本待撰寫
SC‑002│T013│抽查流程+100句金檢資料待產生
SC‑003│─(缺任務)|需新增 Mock latency監控 task

## 📊 Quality Metrics

指標              　　數值 
總需求(User Story)    　3 
總功能需求(FR)     　　　6 
Success Criteria      　3 
總任務(task count)    　15（含重複）
覆蓋率(task↔spec)%   　≈80%（COM/API gap）
模糊/待澄清項目       　4(N1-N3+B1)
Critical Issues       　2(A1,A2)
High Issues           　2(B1,B2)

> ✍️ Recommendations Summary:
> -立即修訂 A1,A,B,B並重新估時；
> -刪除或整併重複 task；
> -補充 lexicon & schema文件後再進開發 Sprint Planning。