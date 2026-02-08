# IELTS 寫作衝刺教練 - 意圖描述文件 (程式碼現狀)

## 文件來源
基於 `IELTS_Writing-Sprint_Coach.html` 程式碼逆向工程分析

---

## US-1: 5-Day Verb Sprint (寫作衝刺系統)

### 1. 業務邏輯型意圖 (Rule-Based Intent)

**定時器規格**
> 在 [用戶開始衝刺] 的場景下，系統實際根據 [SPRINT_DURATION_SECONDS = 900] 執行 [setInterval 每秒更新 timer，顯示 MM:SS 格式]，實際行為符合預期。

**計時控制**
> 在 [衝刺過程中] 的場景下，系統實際根據 [status 狀態判斷] 執行 [顯示不同按鈕: ready→Start, running→Pause, paused→Resume, finished→disabled]。**問題：按鈕事件監聽器僅在 initSprintListeners() 中綁定一次，若按鈕 DOM 被重新渲染，事件會丟失。**

**編輯器鎖定**
> 在 [時間結束或提交後] 的場景下，系統實際執行 [isLocked = s.status === 'finished' || s.analysisResult !== null]。**現狀符合規格。**

**提交驗證**
> 在 [用戶點擊提交] 的場景下，系統實際執行 [allUsed = s.mandatoryVerbs.every(v => v.used)]，若未通過則顯示 toast 錯誤。**現狀符合規格。**

### 2. 數據轉換/算法型意圖 (Data Processing Intent)

**每日任務生成**
> 當輸入為 [今日日期] 時，程式碼實際執行步驟是 [1. 檢查 taskDate === today && mandatoryVerbs.length > 0，2. 若否則隨機選 6 個動詞，3. 隨機選 1 個題目]。**問題：初次載入時若 taskDate 為 null，系統會正確生成任務，但若 state 損壞導致 mandatoryVerbs 為空陣列且 taskDate 為今日，任務不會重新生成。**

**動詞追蹤**
> 當輸入為 [用戶作文] 時，程式碼實際執行 [正則匹配 /\b${v.verb}\b/i 檢查每個動詞]。**現狀符合規格。**

**AI 分析整合**
> 當輸入為 [用戶作文] 時，程式碼實際執行 [模擬 API 調用，返回硬編碼的 mock 數據]。**問題：GeminiAPIWrapper.call() 始終返回模擬數據，從未實際調用 Gemini API。即使設置了 API Key，也只是執行 setTimeout 模擬延遲。**

### 3. 使用者路徑/狀態型意圖 (State Machine Intent)

**衝刺狀態機**
> 當用戶點擊 [Start 按鈕] 後，系統進入 [running 狀態]。**問題：重新渲染 UI 後 (#sprint-pause-btn, #sprint-resume-btn) 的事件監聽器未重新綁定，導致 Pause/Resume 按鈕可能無法響應。**

**計時器顏色變化**
> 當 [timer <= 60 && status === 'running'] 時，計時器文字變為紅色。**現狀符合規格。**

---

## US-2: Blind Write-back (盲寫回譯系統)

### 1. 業務邏輯型意圖 (Rule-Based Intent)

**原文來源**
> 在 [進入盲寫頁面] 的場景下，系統實際執行 [history.find(h => h.essay && h.score)]。**現狀符合規格。**

**遮罩機制**
> 在 [isRevealed === false] 時，系統顯示 [bg-gray-900 bg-opacity-95 遮罩]。**問題：規格要求 95% 透明度，但 `bg-opacity-95` 實際是 95% 不透明度（只有 5% 透明），這與規格文件「95% 透明度」的描述相反。**

**通過標準**
> 在 [遺漏率 < 2%] 時，顯示綠色「優秀」標記。**現狀符合規格。**

### 2. 數據轉換/算法型意圖 (Data Processing Intent)

**遺漏率計算**
> 程式碼實際執行 [逐詞比對，允許前後 5 詞容差]。**問題：算法會累積未標記詞彙到 markedHtml，但重建的文本只包含原文詞彙，未保留原始格式（標點、換行等）。**

**AI 診斷**
> 程式碼實際返回 [硬編碼的模擬診斷文字]。**問題：與 US-1 相同，未實際調用 AI API。**

### 3. 使用者路徑/狀態型意圖 (State Machine Intent)

**盲寫流程**
> 當用戶點擊 [reveal-btn] 後，系統設置 [isRevealed = true] 並調用 [updateBlindWriteUI()]。**問題：updateBlindWriteUI() 完全重新渲染內容並重新綁定事件，這是正確的，但效率較低。**

---

## US-3: AI Tools (AI 寫作工具)

### 1. 業務邏輯型意圖 (Rule-Based Intent)

**API 調用**
> 在 [調用 API] 的場景下，系統實際執行 [迴圈 retryDelays，但 try 塊內只有 setTimeout 模擬，永遠不會拋出錯誤]。**問題：重試機制永遠不會觸發，因為模擬調用永遠成功。**

**API Key 驗證**
> 在 [apiKey 為空] 時，系統拋出錯誤。**現狀符合規格。**

### 2. 數據轉換/算法型意圖 (Data Processing Intent)

**靈感助手**
> 返回 [硬編碼 positive/negative/vocabulary 陣列]。**問題：未實際調用 AI。**

**文章分析器**
> 返回 [隨機生成的 score 和硬編碼被動句/高級動詞]。**問題：未實際調用 AI，分數是 (6.0 + Math.random() * 2.5).toFixed(1)，不反映實際作文品質。**

**高階改寫器**
> 返回 [硬編碼的 Band 9 改寫文字]。**問題：未實際調用 AI。**

### 3. 使用者路徑/狀態型意圖 (State Machine Intent)

**AI 工具使用流程**
> 當用戶點擊工具按鈕後，系統通過 [performAction()] 進入 [isProcessing = true]。**問題：performAction 會以 isProcessing 狀態更新所有按鈕，但 updateUI() 會替換按鈕的 innerHTML 為 loading spinner，破壞原始按鈕文字。雖然有 dataset.originalText 備份機制，但這只在 processing 結束時恢復，若 UI 被重新渲染則備份丟失。**

---

## US-4: Progress Report (進度報告)

### 1. 數據轉換/算法型意圖 (Data Processing Intent)

**瓶頸指數計算**
> 程式碼實際執行 [passiveWeakness = max(0, 10-passive) * 0.5，omissionWeakness = max(0, omission-2) * 1.5]。**現狀符合規格描述。**

**歷史記錄**
> 程式碼實際顯示 [history 陣列中所有記錄]，不限於 10 條。**問題：雖然 handleSprintSubmission 中有 slice(0, 10)，但 renderHistoryTable 顯示 history 中所有記錄，若舊 state 有超過 10 條記錄則全部顯示。**

**雷達圖**
> 程式碼實際執行 [SVG 繪製 4 軸雷達圖]。**問題：Cohesion (C=7) 和 Task Response (T=8) 是硬編碼常數，不反映實際數據。**

---

## 技術層面意圖

### 國際化 (I18N)
> 程式碼實際執行 [querySelectorAll('[data-i18n]') 並替換 textContent]。**問題：部分動態生成的 HTML（如 timer-controls 按鈕）在語言切換後可能未正確更新，因為 renderContent() 會重新生成 HTML，但翻譯鍵可能與當前狀態不匹配。**

### 狀態持久化
> 程式碼實際執行 [JSON.stringify 存儲，JSON.parse 讀取，帶有結構合併]。**問題：loadState() 合併邏輯只處理一層嵌套，若 state 結構變更可能導致屬性丟失。另外，sprint.intervalId 被存儲但在頁面重載後失效（因為 setInterval ID 不可恢復）。**

### UI 鎖定 (performAction)
> 程式碼實際執行 [isProcessing = true，遍歷所有按鈕並 disable]。**問題：updateUI() 會修改按鈕 innerHTML，若異步操作快速完成或失敗，按鈕文字恢復邏輯可能與實際 DOM 狀態不同步。**

### 設定彈窗關閉
> 程式碼實際執行 [點擊 close-settings-btn 關閉]。**問題：規格文件未明確，但點擊彈窗外部遮罩區域不會關閉彈窗，這可能不符合用戶預期的模態行為。**
