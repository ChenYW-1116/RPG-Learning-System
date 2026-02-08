---
featureName: IELTS Writing Conciseness Coach
shortName: ielts-conciseness
---

# 功能規格說明: IELTS Writing Conciseness Coach

##User Stories

### US-1: 48 時限內完成五篇精簡重寫 (Priority: P1)
身為考生，我需要在48小時內完成五篇「conciseness rewrites」，每篇限時15分分鐘，並自動記錄MS Word字數前後差異，以便追蹤進度。

**驗收情境:**
1. 假設計時器啟動且字數基準已儲存，當我點擊「開始重寫」並於15,分鐘內提交文章，則系統立即顯示字數減少百分比與歷史曲線圖。
2. 假設我已提交第5篇文章，當系統檢查時間仍在48小時窗口內，則標記US-1為完成並解鎖US-2。

### US-2: 一週內提交雙欄範本並達成雙指標≥0.85 (Priority: P1)
身為考生，我希望在一週期限截止前上傳一份雙欄範本（左欄process verbs、右欄linkers），由系統評分後回報Conciseness≥0.85且Process Verbs≥0.85。

**驗收情境:**
1. 假設我上傳docx範本且點擊「評分」，當兩項指標均≥0.85,則狀態變為「通過」；否則列出未達標句號與建議。
2. 假設一週倒數計時歸零而我未上傳或指標未達標，則系統自動退回步驟1–2循環入口並發送提醒郵件。

### US-3: Mock成績判斷是否晉級Task 2訓練 (Priority: P2)
身為考生，我想在下一回Mock中若同時滿足「internal SD<0,.4」與「連續兩次Band≥8,.0」,就自動晉級到Task,2訓練模組；否則留在原循環繼續精簡練習。

**驗收情境:**
1. 假設最新Mock結果已匯入且前一MockBand=8,.5,當本次Band=8,.0且SD=0,.35,則系統彈出晉級提示並切換至Task,2選單。
2. 假設SD=0,.45或任一次Band<8,.0,當我查看Dashboard,則顯示「需再循環步驟1–」的紅色警示與下次Mock日期。


## Functional Requirements

- **FR-001**: Timer & Tracker  
提供可暫停的15,-min倒數計時器；結束後呼叫Word COM API抓取修訂前/後字數並儲存至DB（欄位：original_words、rewritten_words、reduction_pct）。

- **FR--002**: Five-Rewrite Gate  
於首篇文章計時開始起算48,h滑動窗口；僅有在該窗口內累積五筆rewrite紀錄才允許進入US-,否則鎖住下一步按鈕。

-- **FR--003**: Dual-column Template Parser  
支援docx雙欄讀取（左process_verbs、右linkers）；使用NLP依存解析器抽取動詞短語+連接詞類別；依公式Conciseness=(原字數−新字)/原字; Process Verbs=命中process verb清單之token比率。公式輸出小數點三位四捨五入。

-- **FR--004**: One-week Deadline Service  
採用UTC+00記錄首次上傳時間戳；7×24,h後如仍未Pass即觸發Reopen Workflow將進度歸零回到步驟11選單。.

-- **FR--005**: Mock Result Importer  
提供CSV/API端點供監考官上載含band_score、internal_sd之檔案；匯入後立即跑判斷邏輯：若最新＋前一筆band皆≥88&&latest_sd<00..4→更新status="ADVANCED_TO_TASK_22"。

--- **FR---006**: Notification Engine  
於以下事件寄Email+站內信：①48h即將到期②一週deadline到期③晉級成功④退回循環。郵件模板可自訂Logo與簽名。


## Success Criteria

--- **SC---001**: ≥95%的用戶可在45,min内完成全部五篇重寫流程無報錯。.
--- **SC---002**: Template Parser對Conciseness/ProcessVerbs的準確率經人工抽查100句達到92%以上。.
---- *SC*-*003*: Mock結果判斷延遲≤30,s且零資料遺失率。。


## Needs Clarification

11.. 「conciseness rewrites」是否限定題材？若不限定需預置題庫嗎？？
22.. 「internal SD<00..4」之SD母體是指同一篇文章多位考官分差？邁是多次 mock個人波動？？
33.. Taskk,,22訓練模組的具體功能不在本次需求範圍嗎？？