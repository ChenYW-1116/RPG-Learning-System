# 🏰 Quest Empire - RPG Learning System

<div align="center">

![Quest Empire Banner](https://img.shields.io/badge/Quest%20Empire-v2.1-6366F1?style=for-the-badge&logo=data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9IiNmZmYiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIj48cGF0aCBkPSJtMTIgMy00IDktNCAwIDMgNiAyIDYgMyA2IDQgMCAwLTkgNCAyIDQtMnoiLz48L3N2Zz4=)
[![Made with Gemini](https://img.shields.io/badge/AI-Gemini%203%20Flash-FF6F00?style=for-the-badge&logo=google&logoColor=white)](https://ai.google.dev/)
[![GitHub Integration](https://img.shields.io/badge/GitHub-Integration-181717?style=for-the-badge&logo=github&logoColor=white)](https://github.com)

**一個以遊戲化方式驅動的 IELTS 英語學習與自我精進平台**

*Transform your IELTS preparation into an epic adventure!*

[English](#english) | [繁體中文](#繁體中文)

</div>

---

## 📋 Table of Contents

- [Features](#-features)
- [Architecture](#-architecture)
- [Quick Start](#-quick-start)
- [Core Modules](#-core-modules)
- [AI Integration](#-ai-integration)
- [RPG Gamification System](#-rpg-gamification-system)
- [GitHub Integration](#-github-integration)
- [Deployment](#-deployment)
- [Configuration](#-configuration)
- [API Reference](#-api-reference)
- [Contributing](#-contributing)

---

## ✨ Features

### 🎮 Gamified Learning Experience
- **RPG Progression System** - 等級、經驗值、代幣、成就系統
- **Boss Battle Arena** - 以擊敗「弱點 Boss」的方式進行 IELTS 練習
- **Tool Store** - 使用代幣解鎖強大的學習輔助工具
- **Achievement System** - 多種成就激勵持續學習

### 🤖 AI-Powered Analysis
- **Gemini 3 Flash Integration** - 使用最新的 Google Gemini AI 模型
- **Real-time Scoring** - 四維度即時評分 (TA, CC, LR, GRA)
- **Root Cause Analysis** - 深度診斷學習問題的根本原因
- **AI Coach Feedback** - 個人化的 AI 教練回饋與建議

### 📊 Comprehensive Tracking
- **GitHub Issue Integration** - 自動將練習紀錄同步至 GitHub
- **Progress Visualization** - 視覺化的進度追蹤與數據分析
- **Smart Caching** - 智能快取系統避免重複 API 呼叫
- **Multi-language Support** - 中英文雙語介面

---

## 🏗️ Architecture

```
Quest Empire/
├── 🎮 Core Pages
│   ├── rpg-hub.html              # 主控台 - 挑戰者成長平台入口
│   ├── ielts_challenger_arena.html   # 競技場 - IELTS 挑戰核心
│   └── creare_github_issue_ticket.html  # 任務看板 - GitHub Issue 整合
│
├── 🔧 Tools & Utilities
│   ├── draft_1029.html           # 草稿編輯器
│   ├── createPR_v1.1.html        # GitHub PR 創建器
│   ├── github_pushV2.9.4.1.html  # GitHub 自動推送助手
│   ├── zhihu_publisher.html      # 知乎發布器
│   └── proof-writing-dashboard.html  # 寫作證明儀表板
│
├── 📦 JavaScript Modules
│   ├── DevScribeRPG.js           # RPG 遊戲化核心引擎
│   ├── spec-kit-sdd-core.js      # Spec Kit 代碼生成引擎
│   ├── spec-kit-bridge.js        # 本地橋接伺服器
│   └── modules/
│       ├── gemini-key-manager.js # API Key 管理
│       └── code-generator.js     # AI 代碼生成器
│
├── 🐍 Python Backend
│   ├── arena_api.py              # 競技場 API 伺服器
│   ├── ielts_rca_analyzer.py     # 根因分析引擎
│   ├── zhihu_server.py           # 知乎發布後端
│   └── render-server.js          # Render 部署伺服器
│
├── 🎯 Skills (Agent Capabilities)
│   └── .agent/skills/
│       ├── ai-blind-write-diagnosis/
│       ├── ai-essay-analyzer/
│       ├── ai-essay-rewriter/
│       ├── ai-inspiration-generator/
│       ├── gemini-api-wrapper/
│       └── ui-loader-manager/
│
└── 📁 Resources
    ├── samples/                  # 範例與模板
    ├── essays_to_analyze/        # 待分析文章
    └── exported_articles/        # 匯出的文章
```

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Python 3.9+
- Google Gemini API Key
- GitHub Personal Access Token (optional, for GitHub integration)

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/ChenYW-1116/RPG-Learning-System.git
cd RPG-Learning-System

# 2. Install Node.js dependencies
npm install

# 3. Install Python dependencies
pip install -r requirements.txt

# 4. Start the application
# Option A: Open rpg-hub.html directly in browser
# Option B: Use a local server
python -m http.server 8000
```

### First Time Setup

1. **設定 Gemini API Key**
   - 前往 [Google AI Studio](https://aistudio.google.com/) 取得 API Key
   - 在 Quest Empire 主頁輸入你的 API Key

2. **設定 GitHub Token** (選用)
   - 前往 GitHub Settings > Developer settings > Personal access tokens
   - 創建具有 `repo` 權限的 Token
   - 在 GitHub 相關工具中輸入 Token

3. **開始你的第一場挑戰**
   - 點擊「進入競技場」
   - 選擇你的弱點 Boss
   - 提交你的 IELTS 寫作

---

## 🎯 Core Modules

### 1. Quest Empire Hub (`rpg-hub.html`)
**挑戰者成長平台的中央控制台**

- 玩家狀態總覽 (等級、XP、代幣)
- 競技場入口
- 工具商店
- 成就系統
- 戰鬥紀錄

### 2. IELTS Challenger Arena (`ielts_challenger_arena.html`)
**競技場 - AI 驅動的 IELTS 寫作練習系統**

核心功能：
- **Boss 系統**: 選擇你的弱點維度 (TA/CC/LR/GRA) 作為 Boss
- **AI 即時評分**: Gemini 3 Flash 即時分析你的寫作
- **勝敗判定**: 根據目標分數和實際得分判定勝負
- **獎勵機制**: 勝利獲得 XP 和代幣

```javascript
// Example: Boss Configuration
const BOSSES = {
  'TA': { name: 'Task Achievement Dragon', difficulty: 'Hard' },
  'CC': { name: 'Coherence Phantom', difficulty: 'Medium' },
  'LR': { name: 'Lexical Titan', difficulty: 'Hard' },
  'GRA': { name: 'Grammar Golem', difficulty: 'Expert' }
};
```

### 3. Mission Board (`creare_github_issue_ticket_1.10.2.html`)
**任務看板 - 將練習紀錄同步至 GitHub**

特色功能：
- 自動生成格式化的 GitHub Issue
- AI 教練講評同步發布至 Issue
- 支援圖片上傳與 Markdown 格式化
- 匯出/匯入 ZIP 壓縮檔功能

### 4. DevScribeRPG Engine (`DevScribeRPG.js`)
**遊戲化核心引擎**

```javascript
// RPG System API
DevScribeRPG.recordModuleAction('arena', 'boss_defeated');
DevScribeRPG.getPlayerStatus(); // { level, xp, tokens, victories, defeats }
DevScribeRPG.showXPNotification(result);
```

---

## 🤖 AI Integration

### Gemini 3 Flash Preview
本專案使用 Google 最新的 **Gemini 3 Flash Preview** 模型進行 AI 分析。

```javascript
// AI Model Configuration
const GEMINI_MODEL = 'gemini-3-flash-preview';
const API_ENDPOINT = 'https://generativelanguage.googleapis.com/v1beta/models/';
```

### AI Capabilities

| 功能 | 說明 | 使用場景 |
|------|------|----------|
| **Essay Analysis** | 四維度寫作評分 | 競技場挑戰 |
| **RCA Analysis** | 根因分析 | 深度診斷 |
| **Coach Feedback** | AI 教練回饋 | Issue 創建後 |
| **Content Understanding** | 圖表理解 | TA/CC 驗證 |
| **Essay Rewriting** | 高級改寫 | 範文學習 |

### Skills System
專案內建多種 AI Skills (位於 `.agent/skills/`):

- `ai-blind-write-diagnosis` - 盲寫練習診斷
- `ai-essay-analyzer` - 雅思範文分析
- `ai-essay-rewriter` - AI 高階改寫
- `ai-inspiration-generator` - 寫作靈感生成
- `gemini-api-wrapper` - Gemini API 封裝

---

## 🎮 RPG Gamification System

### Rank System (等級系統)

| Level | Rank | Icon | XP Required |
|-------|------|------|-------------|
| 1 | 新手挑戰者 | 🌱 | 0 |
| 2 | 學徒冒險者 | 🌿 | 150 |
| 3 | 探索者 | 🌲 | 400 |
| 4 | 挑戰大師 | ⭐ | 800 |
| 5 | 菁英戰士 | 🔥 | 1500 |
| 6 | 專家嚮導 | 💎 | 2500 |
| 7 | 創造大師 | 👑 | 4000 |
| 8 | 煉金術大師 | 🏆 | 6000 |
| 9 | 傳奇奠基者 | 🌟 | 8500 |
| 10 | 帝國領袖 | 🏰 | 12000 |

### Reward Mechanics

```
勝利獎勵:
├── 基礎 XP: 50
├── Boss 加成: +10-30 (依難度)
├── 連續天數加成: +5/天
└── 代幣: 15-25

失敗獎勵:
├── 參與 XP: 15
└── 代幣: 5

反思獎勵 (50+ 字):
└── 額外 XP: +25 (有效果時 +50%)
```

---

## 🔗 GitHub Integration

### Automated Issue Creation
Mission Board 可自動創建格式化的 GitHub Issue:

```markdown
### ⚠️ 文章內容
[原始寫作內容]

### 📚 逐句解析內容
[AI 格式化的解析]

### 2️⃣ 自我評估分數
| 維度 | 分數 |
|------|------|
| TA | 6.5 |
| CC | 7.0 |
...

### 🤖 AI 教練講評
[Gemini 生成的個人化回饋]
```

### AI Coach Feedback
Issue 創建後，系統會自動:
1. 呼叫 Gemini AI 生成教練講評
2. 將講評發布至 GitHub Issue 留言
3. 在頁面上同步顯示講評內容

---

## 🚢 Deployment

### Render.com Deployment
```bash
# 使用 render-server.js 部署
node render-server.js

# 環境變數設定
GEMINI_API_KEY=your_key
GITHUB_TOKEN=your_token
PORT=3000
```

### Docker Deployment
```dockerfile
# 使用專案內的 Dockerfile
docker build -t quest-empire .
docker run -p 3000:3000 quest-empire
```

### Local Development
```bash
# 啟動本地橋接伺服器 (用於代碼驗證)
.\start-precision-bridge.ps1

# 或手動執行
node spec-kit-bridge.js
```

---

## ⚙️ Configuration

### LocalStorage Keys
```javascript
// Player Data
localStorage.getItem('questempire_player'); // RPG 玩家狀態

// API Keys
localStorage.getItem('gemini_api_key');     // Gemini API Key
localStorage.getItem('github_pat_token');   // GitHub Token

// Settings
localStorage.getItem('i18n_language');      // 語言設定 ('zh' | 'en')
localStorage.getItem('speckit_config');     // Spec Kit 配置
```

### Gemini API Configuration
```javascript
// 在 modules/gemini-key-manager.js 中設定
GeminiKeyManager.init({
  storageKey: 'gemini_api_key',
  autoSync: true
});
```

---

## 📚 API Reference

### DevScribeRPG API
```javascript
// 記錄模組動作
DevScribeRPG.recordModuleAction(moduleName, actionType);

// 取得玩家狀態
const status = DevScribeRPG.getPlayerStatus();
// Returns: { level, xp, xpForNextLevel, tokens, victories, defeats, rank }

// 生成狀態卡片 HTML
const html = DevScribeRPG.generateStatusCardHTML();

// 顯示 XP 通知
DevScribeRPG.showXPNotification({ xpGained, tokensGained, levelUp });
```

### Arena API (Python)
```python
# arena_api.py 端點
POST /analyze     # 分析文章
POST /rca         # 根因分析
GET  /scores      # 取得快取分數
```

---

## 🌐 Internationalization (i18n)

系統支援中英文雙語切換:

```javascript
// 切換語言
window.toggleLanguage(); // 在 'zh' 和 'en' 之間切換

// 手動設定
window.i18n.currentLang = 'en';
window.i18n.applyTranslations();
```

在 HTML 中使用:
```html
<span data-i18n="arenaTitle">挑戰者競技場</span>
<input data-i18n-placeholder="placeholderTaskName" placeholder="預設文字">
```

---

## 🤝 Contributing

歡迎貢獻！請遵循以下步驟:

1. Fork 本專案
2. 創建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交變更 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 開啟 Pull Request

### Development Guidelines
- 使用 `gemini-3-flash-preview` 作為 AI 模型
- 遵循現有的 i18n 模式添加翻譯
- 確保 RPG 獎勵機制的一致性

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- [Google Gemini](https://ai.google.dev/) - AI 模型提供
- [Tailwind CSS](https://tailwindcss.com/) - UI 框架
- [Font Awesome](https://fontawesome.com/) - 圖標庫

---

<div align="center">

**Built with ❤️ for IELTS learners worldwide**

⚔️ *Challenge your weaknesses. Level up your skills.* 🏰

</div>
