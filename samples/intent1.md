# IELTS 寫作衝刺教練 - 意圖描述文件 (規格意圖)

## 文件來源
基於 `001-ielts-wsc_opt_phase1_output_spec.md` 規格文件分析

---

## US-1: 5-Day Verb Sprint (寫作衝刺系統)

### 1. 業務邏輯型意圖 (Rule-Based Intent)

**定時器規格 (T007)**
> 在 [用戶開始衝刺] 的場景下，系統應該根據 [固定 15 分鐘 (900 秒) 倒計時規則] 執行 [顯示剩餘時間 MM:SS 格式，使用等寬數字字體 tabular-nums]，且必須避免 [計時器在時間結束後繼續運行]。

**計時控制**
> 在 [衝刺過程中] 的場景下，系統應該根據 [用戶點擊控制按鈕] 執行 [Start、Pause、Resume 三種狀態切換]，且必須避免 [在錯誤狀態下顯示不適用的按鈕]。

**編輯器鎖定**
> 在 [時間結束或提交後] 的場景下，系統應該根據 [status === 'finished' 或 analysisResult !== null] 執行 [禁用寫作輸入框 #essay-input]，且必須避免 [用戶在鎖定狀態下仍能編輯]。

**提交驗證**
> 在 [用戶點擊提交] 的場景下，系統應該根據 [必須使用全部 6 個必用動詞的規則] 執行 [檢查 mandatoryVerbs.every(v => v.used)]，且必須避免 [未使用完所有動詞就能成功提交]。

### 2. 數據轉換/算法型意圖 (Data Processing Intent)

**每日任務生成 (T006)**
> 當輸入為 [當前日期 getTodayDateString()] 時，預期的處理步驟是 [1. 檢查 taskDate 是否等於今日，2. 若否則從動詞池隨機選取 6 個動詞，3. 從題目池隨機選取 1 個主題]，最後輸出的格式應為 [{ taskDate, topic, mandatoryVerbs: [{verb, used}] }]。

**動詞追蹤 (A2)**
> 當輸入為 [用戶作文文本] 時，預期的處理步驟是 [1. 將文本轉換為小寫，2. 使用正則表達式匹配單詞邊界，3. 對每個必用動詞檢查是否存在]，最後輸出的格式應為 [更新後的 mandatoryVerbs 陣列，每個動詞帶有 used: true/false]。

**即時反饋**
> 當輸入為 [用戶作文文本] 時，預期的處理步驟是 [1. 計算字數 (words.length)，2. 模擬被動語態比例 (words.length / 20)，3. 更新動詞使用狀態]，最後輸出的格式應為 [wordCount: number, passiveRatioMock: string, verbList: HTML]。

**AI 分析整合 (T009, T015)**
> 當輸入為 [用戶提交的作文] 時，預期的處理步驟是 [1. 調用 API 分析作文，2. 獲取精確被動語態比例，3. 識別被動句和高級動詞，4. 獲取預估分數]，最後輸出的格式應為 [{ score, precisePassiveRatio, passiveSentences[], advancedVerbs[{verb, meaning}] }]。

### 3. 使用者路徑/狀態型意圖 (State Machine Intent)

**衝刺狀態機**
> 當用戶點擊 [Start Verb Sprint 按鈕] 後，系統應進入 [running 狀態]，只有在 [計時器歸零或用戶暫停] 時才允許跳轉到 [finished 或 paused 狀態]。

**狀態流程詳細**
> 意圖描述：這是一個衝刺計時系統。理想流程：
> - ready → running (點擊 Start)
> - running → paused (點擊 Pause)
> - paused → running (點擊 Resume)
> - running → finished (計時器歸零)
> - finished → 顯示 AI 分析結果
> 現狀要求：每個狀態轉換都應正確更新 UI，包括按鈕文字、計時器顏色（最後 60 秒變紅）、編輯器狀態。

---

## US-2: Blind Write-back (盲寫回譯系統)

### 1. 業務邏輯型意圖 (Rule-Based Intent)

**原文來源 (T012)**
> 在 [進入盲寫頁面] 的場景下，系統應該根據 [載入 history 中第一個有 essay 和 score 的記錄] 執行 [設置 sourceEssay]，且必須避免 [載入失敗時沒有提示用戶]。

**遮罩機制**
> 在 [原文顯示區域] 的場景下，系統應該根據 [isRevealed === false] 執行 [顯示 95% 透明度深色遮罩]，且必須避免 [遮罩未完全覆蓋原文導致用戶能看到內容]。

**通過標準 (B1)**
> 在 [評估結果顯示] 的場景下，系統應該根據 [遺漏率 < 2%] 執行 [顯示「優秀」標記和綠色樣式]，且必須避免 [遺漏率計算錯誤導致誤判]。

### 2. 數據轉換/算法型意圖 (Data Processing Intent)

**遺漏率計算 (T013)**
> 當輸入為 [原文 originalText, 用戶回寫 userText] 時，預期的處理步驟是 [1. 將兩者轉小寫並分詞，2. 逐詞比對（允許前後 5 詞的容差），3. 統計未匹配詞數]，最後輸出的格式應為 [{ percentage: number, markedHtml: string }]。

**AI 診斷 (ai-blind-write-diagnosis)**
> 當輸入為 [原文和用戶嘗試的對比結果] 時，預期的處理步驟是 [1. 調用 AI 服務分析差異，2. 識別語法或詞彙錯誤]，最後輸出的格式應為 [簡短診斷文字，限制 50 字內]。

### 3. 使用者路徑/狀態型意圖 (State Machine Intent)

**盲寫流程**
> 當用戶點擊 [Click to reveal and grade 按鈕] 後，系統應進入 [isRevealed = true 狀態]，只有在 [用戶已輸入回寫內容] 時才允許跳轉到 [顯示評估結果狀態]。

---

## US-3: AI Tools (AI 寫作工具)

### 1. 業務邏輯型意圖 (Rule-Based Intent)

**API 調用 (GeminiAPIWrapper)**
> 在 [調用 Gemini API] 的場景下，系統應該根據 [內建指數退避重試機制 retryDelays: [1000, 2000, 4000]] 執行 [最多 3 次重試]，且必須避免 [單次失敗就直接報錯給用戶]。

### 2. 數據轉換/算法型意圖 (Data Processing Intent)

**AI 靈感助手 (ai-inspiration-generator)**
> 當輸入為 [作文題目 topic] 時，預期的處理步驟是 [1. 構建提示詞，2. 調用 API，3. 解析 JSON 響應]，最後輸出的格式應為 [{ positive: string[3], negative: string[3], vocabulary: string[5] }]。

**文章分析器 (ai-essay-analyzer)**
> 當輸入為 [用戶作文文本] 時，預期的處理步驟是 [1. 構建分析提示詞，2. 調用 API，3. 解析結構化響應]，最後輸出的格式應為 [{ score, precisePassiveRatio, passiveSentences[], advancedVerbs[] }]。

**高階改寫器 (ai-essay-rewriter)**
> 當輸入為 [用戶作文文本] 時，預期的處理步驟是 [1. 構建改寫提示詞，2. 調用 API]，最後輸出的格式應為 [純文本 Band 9 範文]。

### 3. 使用者路徑/狀態型意圖 (State Machine Intent)

**AI 工具使用流程**
> 當用戶點擊 [工具按鈕 (Generate/Analyze/Rewrite)] 後，系統應進入 [isProcessing = true 狀態，禁用所有按鈕]，只有在 [API 調用完成或失敗] 時才允許跳轉到 [isProcessing = false，顯示結果或錯誤]。

---

## US-4: Progress Report (進度報告)

### 1. 數據轉換/算法型意圖 (Data Processing Intent)

**瓶頸指數計算 (T016 Mock)**
> 當輸入為 [history 陣列，包含 omissionRate 和 passiveRatio] 時，預期的處理步驟是 [1. 過濾有效記錄，2. 計算被動語態弱點 (目標 10%，低於則加分)，3. 計算遺漏率弱點 (目標 2%，高於則加分)，4. 平均計算綜合分數]，最後輸出的格式應為 [{ score: string, advice: string[], passive: number, omission: number }]。

**歷史記錄**
> 當輸入為 [history 陣列] 時，預期的處理步驟是 [1. 取最近 10 條記錄，2. 格式化日期和數值]，最後輸出的格式應為 [HTML 表格，包含日期、遺漏率、被動比例列]。

---

## 技術層面意圖

### 國際化 (I18N) (T004)
> 在 [切換語言] 的場景下，系統應該根據 [data-i18n 屬性和 I18N 字典查找] 執行 [applyTranslations() 替換所有標記元素的文字]，且必須避免 [部分元素未被翻譯]。

### 狀態持久化 (T005)
> 在 [頁面載入/狀態變更] 的場景下，系統應該根據 [localStorage 存儲 IELTS_COACH_STATE_V2] 執行 [saveState()/loadState()]，且必須避免 [狀態丟失或結構不完整]。

### UI 鎖定 (performAction)
> 在 [執行異步操作] 的場景下，系統應該根據 [isProcessing 標誌] 執行 [禁用所有非設定類按鈕，顯示 loading 動畫]，且必須避免 [用戶能重複觸發操作或 UI 卡在 loading 狀態]。
