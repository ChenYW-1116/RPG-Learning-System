# 任務清單: IELTS Writing Conciseness Coach

## 階段一：初始化
- [ ] **T001**: 建立單檔 SPA 骨架 (index.html + TailwindCSS CDN + hash-router)  
- [ ] **T002**: 設計 LocalStorage Schema v1 與自動 migration／匯出／重置功能  
- [ ] **T003**: 完成 i18n switcher（繁中 / EN）與基礎 UI layout（Header、Footer、Toast）  

## 階段二：核心功能
- [ ] **T004**: TimerCore：可暫停15-min倒數，結束觸發 WordCountApi；儲存 original_words、rewritten_words、reduction_pct 【US-1】  
- [ ] **T005**: Five-Rewrite Gate：48 h滑動窗口檢查，未達5篇鎖住「下一步」按鈕並提示剩餘時間 【US-1】  
- [ ] **T006**: WordCountApi Shim：ActiveX／OfficeScript fallback＋手動貼上對話框即時 diff 【FR-001】  
- [ ] **T007**: DocxParser：讀取雙欄 docx（左 process verbs /右 linkers），拆欄 tokenize【FR-003】  
- [ ] **T008**: NLPScorer：呼叫 gemini API，回傳 Concisence & ProcessVerbs ≥0.85？Pass : list fails+AI advice【US-2】【FR-003】  
- [ ] **T009**: One-week Deadline Service：首次上傳記 UTC+0 ts；7×24 h後未 Pass→ReopenWorkflow.reset()【US2】【FR004】  
- [ ] **T010**: CsvImporter：監考官上傳 CSV→驗證 band_score, internal_sd→存入 MockStore【FR005】  
 -[11] AdvanceJudge:若最新+前一band≥8.0且latest_sd<0.4→status="ADVANCED_TO_TASK_22"else警示【U3】【F05]  

##階段三優化與測試
-[12] Notifier Engine:EmailJS整合①48h將到期②週deadline③晉級④退回循環;模板可自訂Logo簽名[F06]
-[13]單元測試:TimerCore/DocxParser/NLPScorer覆蓋≥80%;人工抽查100句準確率≥92%[SC02]
-[14] E2E測試:Cypress腳本「45min內完成五篇重寫無報錯」通過率≥95%[SC01]
-[15]文件&交付:README(部署步驟/常見問題)/使用影片/範例docx&csv

---
**總任務數:**15
**可平行任務:** T004-T006,T007-T008,T010-T011