# createPR_v1.1.html 多語言實現總結

## ✅ 已完成的功能

### 1. **完整的 i18n 國際化系統**
- ✅ 中文 (zh) 和英文 (en) 雙語支援
- ✅ 語言切換按鈕（右上角顯示 "EN" 或 "中文"）
- ✅ localStorage 持久化存儲（key: `github_manager_lang`）
- ✅ 與主畫面 `github_pushV2.9.4.1.html` 語言設定同步

### 2. **支援翻譯的 UI 元素**

#### 靜態文字翻譯（使用 `data-i18n` 屬性）
- 頁面標題
- 校準儀式警告
- 認證與倉庫設定
- 分支設定
- 檔案變更
- Pull Request 資訊
- 日誌與執行結果
- 所有按鈕文字

#### Placeholder 翻譯（使用 `data-i18n-placeholder` 屬性）
- ✅ GitHub PAT 權杖輸入框
- ✅ 倉庫名稱輸入框
- ✅ 目標分支輸入框
- ✅ 來源分支輸入框
- ✅ PR 標題輸入框
- ✅ PR 描述文字框
- ✅ Issue 號碼輸入框

#### 動態生成的 Placeholder（在 `addFileBlock()` 函數中）
- ✅ 檔案路徑輸入框
- ✅ 提交訊息輸入框
- ✅ 檔案內容文字框

### 3. **RPG 等級翻譯**
使用與主畫面一致的編號式命名：
- `rpgRank1` → 新手挑戰者 / Novice Challenger
- `rpgRank2` → 見習冒險家 / Apprentice Adventurer
- `rpgRank3` → 探索者 / Explorer
- `rpgRank4` → 挑戰達人 / Challenge Master
- `rpgRank5` → 精英戰士 / Elite Warrior
- `rpgRank6` → 專家引導者 / Expert Guide
- `rpgRank7` → 大師創造者 / Master Creator
- `rpgRank8` → 宗師煉金師 / Grandmaster Alchemist
- `rpgRank9` → 傳奇締造者 / Legendary Founder
- `rpgRank10` → 帝國領袖 / Empire Leader

## 📋 翻譯 Key 命名規範

### 靜態文字 Key
使用描述性命名，例如：
- `pageTitle` - 頁面標題
- `authAndRepo` - 認證與倉庫
- `branchSettings` - 分支設定
- `generatePRTitle` - 產生 PR 標題按鈕

### Placeholder Key
使用 `placeholder` 前綴 + 描述，例如：
- `placeholderToken` - 權杖輸入框提示
- `placeholderRepo` - 倉庫名稱提示
- `placeholderPrTitle` - PR 標題提示

### RPG 等級 Key
使用編號式命名（與主畫面一致）：
- `rpgRank1` - `rpgRank10`
- `rpgXpNeeded` - XP 需求提示

## 🔧 技術實現

### HTML 屬性
```html
<!-- 靜態文字翻譯 -->
<h2 data-i18n="pageTitle">頁面標題</h2>

<!-- Placeholder 翻譯 -->
<input data-i18n-placeholder="placeholderToken" placeholder="ghp_...">
```

### JavaScript i18n 物件
```javascript
const i18n = {
    currentLang: 'zh',
    translations: { zh: {...}, en: {...} },
    t(key, params) { ... },
    setLanguage(lang) { ... },
    loadSavedLanguage() { ... },
    applyTranslations() { ... }
};
```

### applyTranslations() 函數邏輯
1. 處理所有 `[data-i18n]` 元素的內容
2. 處理所有 `[data-i18n-placeholder]` 元素的 placeholder
3. 更新頁面標題
4. 更新語言切換按鈕
5. 刷新 RPG 狀態卡（如果存在）

## 🎯 跨頁面語言同步

使用統一的 localStorage key：`github_manager_lang`

已實現語言同步的頁面：
1. `github_pushV2.9.4.1.html` - GitHub 檔案管理終端（主畫面）
2. `createPR_v1.1.html` - GitHub PR 自動化工具

任一頁面切換語言後，其他頁面也會自動同步！

## 測試方法

1. 打開 `i18n_test.html` 查看所有支援語言切換的頁面
2. 點擊頁面右上角的語言切換按鈕
3. 觀察所有文字和 placeholder 是否正確切換
4. 打開另一個頁面確認語言設定已同步

## 維護指南

### 添加新的翻譯項目

1. **在 translations 物件中添加 key**
```javascript
zh: {
    newKey: '中文翻譯',
    // ...
},
en: {
    newKey: 'English Translation',
    // ...
}
```

2. **在 HTML 中使用**
```html
<!-- 靜態文字 -->
<span data-i18n="newKey">預設文字</span>

<!-- Placeholder -->
<input data-i18n-placeholder="newKey" placeholder="預設提示">
```

### 命名規範建議

- ✅ 使用描述性命名：`generatePRTitle`, `authAndRepo`
- ✅ Placeholder 使用前綴：`placeholderToken`, `placeholderRepo`
- ✅ 保持一致性：與主畫面使用相同的 key 名稱
- ❌ 避免過於簡短：`btn1`, `txt2`
- ❌ 避免中文拼音：`anniu`, `shuru`

---

**最後更新**: 2026-01-27
**實現人員**: Antigravity AI Assistant
**狀態**: ✅ 完成並測試
