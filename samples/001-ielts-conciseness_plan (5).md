---
featureName: IELTS Writing Conciseness Coach
---

# 實作計畫: IELTS Writing Conciseness Coach

## 摘要  
在單一 HTML 檔內實作「48h 五篇精簡重寫 → 一週雙欄範本評分 → Mock 成績晉級」完整流程，所有狀態離線保存在 LocalStorage；透過 gemini-3-flash-preview API 完成 NLP 評分與建議。無後端、零部署成本，監考官僅需上傳 CSV／貼上 API Key 即可啟用。

## 技術上下文
- **語言/版本**: JavaScript ES2022  
- **主要相依性**: TailwindCSS（CDN）、Vanilla JS、SheetJS（讀 csv）、docx.js（讀 docx）  
- **儲存方式**: LocalStorage（含匯出/重置）  
- **AI 模型**: gemini-3-flash-preview  
- **語言支援**: UI & Email Template：繁體中文 / English i18n switcher  
- **專案類型**: single-file SPA (index.html)

## 架構設計
```
┌-------------------------┐
│ index.html (唯一檔案)   │
│ ├─ TailwindCSS CDN      │
│ ├─ <body>               │
│ │   ├─ Header           │
│ │   ├─ Router (hash)    │
│ │   │   ├─ Step1TimerView ─► TimerCore + WordCountApi + RewriteStore
│ │   │   ├─ Step2UploadView ─► DocxParser + NLPScorer + TemplateStore
│ │   │   └─ Step3MockView ───► CsvImporter + AdvanceJudge + Notifier
│ │   └─ SettingsModal     ◄── ApiKeyConfig / EmailTemplateConfig / ExportDataBtn
└-------------------------┘

```

**資料流**  
1. TimerCore：15 min countdown → pause/resume → submit trigger WordCountApi (COM-like shim via ActiveX／OfficeScript fallback) → RewriteStore.push({ts,orig,rew,pct})  
2. FiveRewriteGate：滑動窗口以 RewriteStore[0].ts+48h；不足五筆鎖住「下一步」按鈕。達標解鎖並觸發 Notifier.send("48h_complete")  
3. DocxParser：左欄=process verbs、右欄=linkers；tokenize→依存解析交給 gemini prompt→回傳命中清單→Conciseness & ProcessVerbs≥0.85？Pass: list failed sentences+AI advice。首次上傳 ts→DeadlineService.set7d()；到期未 Pass→ReopenWorkflow.reset()＋Notifier.send("week_fail")  
4. CsvImporter：band_score、internal_sd；AdvanceJudge.check(latest,prev)→status="ADVANCED_TO_TASK_22" if both ≥8 && latest_sd<0.4 else loop warning＋下次Mock日期  

**離線優先**：LocalStorage schema v1，升版時自動 migration。提供「匯出 JSON」「重置進度」防呆。

## AI Prompt Engineering（gemini）
```
【角色】你是IELTS官方Writing Examiner，請依據以下規則給分：
1) Conciseness = (原字數−新字數)/原字數，保留三位小數。
2) Process Verbs Ratio = （命中官方Process Verb清單之token數）/總token。
3) Linkers分類正確率。
4) List未達標句子並提出具體修改建議(中英雙語)。
輸出JSON:{conciseness:0.xxx,processVerbs:0.xxx,linkersAcc:0.xxx,fails:[{s:"...",advice:"..."}]}
```

## Word Count API Shim(純前端)
```js
// ActiveX for Win32 Office; fallback Office Online ScriptLab or manual paste box with live counter diff.
async function getWordStats(){
 if(window.ActiveXObject){ /* ... */ }
 else { return manualBoxDialog(); }
}
```

## Notifier Engine(Email)
使用 EmailJS browser SDK＋模板變量{{userName}}{{deadline}}等；事件①②③④於對應生命週期鉤子呼叫 send(serviceID,tmplID)。

## Migration & Versioning 
LocalStorage key=`ielts-conciseness-v{schema}`; app.js啟動時比對 currentSchema!==storedSchema?migrate()。

## Error Handling 
所有外部呼叫包 try/catch→UI toast+i18n code；"資料遺失率"指標制由 local backup每30s auto-save保證。

---

# src/
```
src/
├── index.html          # SPA殼層+Router(hash)+i18n切換器+SettingsModal入口
├── styles.css          # TailwindCSS自訂主題色&列印樣式(雙欄預覽)
└── app.js              # Vanilla JS bundle(ESM)，拆模組如下：
    ├── router.js         # hash change dispatcher (#step1|#step2|#step3|settings)
    ├── stores/
    │     ├── rewriteStore.js      # CRUD LS+滑窗邏輯+fiveRewriteGate()
    │     ├── templateStore.js     # docx二進位快取+評分結果暫存+deadlineSvc()
    └── components/
          ├── TimerCore.jsx        # setInterval worker(postMessage防阻塞)
          ├── WordCountApi.jsx     # COM/office shim or manual dialog wrapper promise()
          ├── DocxParser.jsx       # docx.load()+col splitter regex+NLP caller()
          ├── NLPScorer.jsx        # callGemini(prompt).then(JSON.parse).catch(fallback scorer)
          ├── CsvImporter.jsx      # SheetJS readAsArrayBuffer then validate header [band_score,internal_sd]
          ├── AdvanceJudge.jsx     #
Not applicable