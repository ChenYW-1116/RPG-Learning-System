# 需求品質檢查清單

## 需求完整性
- [ ] **CHK001**: US-1~US-3 是否都對應到至少一條功能性需求？
- [ ] **CHK002**: FR-001~FR-006 是否都對應到至少一條驗收情境？
- [ ] **CHK003**: SC-001~SC-003 是否都給出量化指標與測量方法？
- [ ] **CHK004**: Needs Clarification 欄位是否已全數澄清並納入正式需求？

## 需求明確性
### US層級
- [ ] **CHK005**: US-1「48小時內」起算點是首次計時啟動還是帳號開通？需唯一定義。
> ✍️建議：改為「自首次點擊『開始重寫』起算之連續48 h滑動窗口」。
  
### FR層級
#### FR‐001 Timer & Tracker
#### 
 -[ ] CHK006: 「可暫停」的暫停次數、最長累積暫停時間有無上限？若無上限，可能導致計時失效。
> ✍️建議：補充「單篇最多暫停2次，累積≤5 min」。

#### FR‐002 Five-Rewrite Gate  
 -[ ] CHK007: 「48 h滑動窗口」內若用戶刪除一篇重寫紀錄，計數邏輯是否遞減？需明確。
> ✍️建議：補充「已提交即鎖定計數，不允許刪除或修改」。  

#### FR‐003 Dual-column Template Parser  
 -[ ] CHK008: Conciseness公式四捨五入至小數三位後，若原字數=0會導致除以零；需防呆。  
 -[ ] CHK009: Process Verbs清單來源、版本更新週期未說明。  

#### FR‐004 One-week Deadline Service  
 -[ ] CHK010: UTC+00記錄與用戶本地時區差異可能導致爭議；須於UI提示「截止時間以UTC為準」。  

#### Mock Result Importer (FR‐005)  
 -[ ] CHK011: CSV欄位名稱、順序、必填/選填、編碼格式(UTF‑8?)未定義。  

### SC層級
 #### 
-[ ]
CHKO12:
SC ‑00292%以上準確率之人工抽查母體規模（100句僅為示例）與抽樣方法未定義。

##一致性檢查

|編號|比對項目|一致性結果|
|---|---|---|
|CON‑01|US‑1要求15 min/篇 ×5篇 ≤75 min；SC‑001卻要求45 min內完成五篇。|❌衝突；需調整SC或放寬US限時。|
|CON‑02|US‑2指標≥0.85 vs. SC‑002準確率92%；後者為工具精度，前者為用戶達標門檻，維度不同但�值接近易混淆。|⚠️建議文件區分「系統精度」與「用戶達標線」。|
|CON‑03|Mock晉級條件Band≥8.0且SD<0.4；若Band滿分9.0則合理，但規格未給出Band Scale範圍。|⚠️須聲明IELTS Band Scale 0–9。|

##可測試性

-[ ]
TST ‑01:
所有驗收情境皆可由外部輸入（計時器、docx、CSV）+觀察輸出（UI訊息,Email,DB欄位）驗證──✔具備可測性。

-[ ]
TST ‑02:
相依元件Word COM API/NLP Parser/Mail Server需提供Stub或Sandbox供CI自動化測試──待補充〈測試雙重方案〉。

##可追溯性

-[ ]
TRC ‑01:
建立Traceability Matrix將每條FR映射至US/SC/TC(測試案例)，目前缺失──請於Jira/Rally新增Link Rules。

##風險&假設

-[ ]
RISK ‑01:
Word COM API僅支援Windows＋MS Word安裝環境；若考生使用Mac/Web版將失效→須於SRS列為假設或用替代方案(Open XML SDK)。