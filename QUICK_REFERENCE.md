# 🚀 Smart Cache - 快速參考指南

## 一分鐘快速上手

### 1️⃣ 啟動 API 服務
```bash
python arena_api.py
```

### 2️⃣ 提交作文（Web/API）
```javascript
fetch('http://localhost:5000/api/analyze', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    essay: "Your IELTS Task 1 essay...",
    provider: "kimi"
  })
})
```

### 3️⃣ CLI 分析
```bash
python ielts_rca_analyzer.py
```

---

## 常見場景

### 場景 1: 學生首次提交作文
**發生什麼：**
- ✅ 作文保存到 `essays_to_analyze/arena_[時間]_[雜湊].txt`
- ✅ AI 評分（耗時 ~20s）
- ✅ 結果保存到快取

**終端輸出：**
```
[API] ✨ 新作文偵測！正在評分...
[系統] ✨ 新作文已存檔: arena_20260126_230506_c7dad471.txt
[API] 📝 快取已更新
```

### 場景 2: 學生重複提交相同作文
**發生什麼：**
- ✅ 檢測到相同內容（雜湊匹配）
- ✅ 直接返回快取分數（< 1s）
- ✅ 不創建重複檔案

**終端輸出：**
```
[API] 🚀 快取命中！直接使用已有評分 (跳過 AI 呼叫)
```

### 場景 3: 學生修改作文後重新提交
**發生什麼：**
- ✅ 內容雜湊改變
- ✅ 視為新作文
- ✅ 重新評分並保存

**終端輸出：**
```
[API] ✨ 新作文偵測！正在評分...
```

### 場景 4: 使用 CLI 分析所有作文
**發生什麼：**
- ✅ 讀取 `essays_to_analyze/` 中的所有 `.txt` 檔案
- ✅ 檢查快取（雜湊優先，檔案名回退）
- ✅ 僅對未快取的作文進行 AI 評分

**終端輸出：**
```
[系統] 偵測到 5 篇文章，開始 AI 量化評分...
  [Cache] 🚀 快取命中: arena_20260126_230506_c7dad471.txt
  [Cache] 🚀 快取命中: arena_20260126_231015_a3b2c1d4.txt
  > 正在分析: new_essay.txt...
```

---

## 快取機制說明

### 快取鍵類型

| 鍵類型 | 範例 | 用途 |
|--------|------|------|
| **雜湊鍵** | `c7dad471f01027785ab9a076388e8756` | API 提交（主要） |
| **檔案名鍵** | `arena_20260126_230506.txt` | CLI 分析（向後兼容） |

### 查找優先級
```
1. 雜湊查找（內容級別，最可靠）
   ↓ 未找到
2. 檔案名查找（向後兼容）
   ↓ 未找到
3. 執行 AI 評分
```

### 快取結構
```json
{
  "c7dad471f01027785ab9a076388e8756": {
    "ta_overview_clarity": 0.9,
    "ta_step_coverage": 1.0,
    "overall_band": 7.5,
    "file_name": "arena_20260126_230506_c7dad471.txt"
  }
}
```

---

## 檔案位置

```
07. Empire/
├── ai_scores_cache.json          ← 快取檔案
└── essays_to_analyze/            ← 作文儲存資料夾
    ├── arena_20260126_230506_c7dad471.txt
    ├── arena_20260126_231015_a3b2c1d4.txt
    └── ...
```

---

## 測試與演示

### 自動化測試
```bash
python test_smart_cache.py
```
**測試內容：**
- ✅ 首次提交（檔案創建、快取更新）
- ✅ 重複提交（快取命中、無重複檔案）
- ✅ CLI 交叉引用（跨平台兼容性）

### 互動式演示
```bash
python demo_smart_cache.py
```
**演示場景：**
- 場景 1: 首次提交三篇不同作文
- 場景 2: 重複提交測試快取效能
- 場景 3: 內容修改檢測

---

## 常見問題

### Q1: 如何清除快取？
```bash
# 刪除快取檔案
rm ai_scores_cache.json

# 或使用強制刷新模式
python ielts_rca_analyzer.py --force-refresh
```

### Q2: 如何查看快取內容？
```bash
# Windows
type ai_scores_cache.json

# Linux/Mac
cat ai_scores_cache.json

# 或使用 Python
python -m json.tool ai_scores_cache.json
```

### Q3: 快取會過期嗎？
目前版本不會自動過期。可以手動刪除或使用 `--force-refresh` 重新評分。

### Q4: 如何判斷是否命中快取？
**API 模式：** 查看終端輸出
- `🚀 快取命中！` = 使用快取
- `✨ 新作文偵測！` = 新評分

**CLI 模式：** 查看終端輸出
- `[Cache] 🚀 快取命中: xxx.txt` = 使用快取
- `> 正在分析: xxx.txt...` = 新評分

### Q5: API 和 CLI 的快取會衝突嗎？
不會。系統使用統一的快取查找機制，支援雙重鍵（雜湊 + 檔案名），確保互通性。

---

## 效能參考

| 操作 | 首次提交 | 快取命中 | 提升 |
|------|----------|----------|------|
| AI 呼叫 | 1 次 | 0 次 | 100% ↓ |
| 響應時間 | ~20-30s | < 1s | 95% ↓ |
| 成本 | 正常 | 0 | 100% ↓ |

---

## 進階功能

### 指定 AI Provider
```bash
# 使用 Kimi（預設）
python ielts_rca_analyzer.py --provider kimi

# 使用 Gemini
python ielts_rca_analyzer.py --provider gemini
```

### 僅評分模式
```bash
python ielts_rca_analyzer.py --mode score
```

### 僅報告模式
```bash
python ielts_rca_analyzer.py --mode report
```

### 分析特定檔案
```bash
python ielts_rca_analyzer.py --file arena_20260126_230506
```

---

## 相關文檔

- **`SMART_CACHE_FEATURE.md`** - 完整功能說明
- **`IMPLEMENTATION_COMPLETE.md`** - 實現完成報告
- **`implementation_plan.md.resolved`** - 原始需求

---

**版本：** v1.0  
**更新日期：** 2026-01-26  
**狀態：** ✅ 生產就緒
