# 🏰 Quest Empire - RPG Learning System

<div align="center">

![Quest Empire Banner](https://img.shields.io/badge/Quest%20Empire-v2.1-6366F1?style=for-the-badge&logo=data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9IiNmZmYiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIj48cGF0aCBkPSJtMTIgMy00IDktNCAwIDMgNiAyIDYgMyA2IDQgMCAwLTkgNCAyIDQtMnoiLz48L3N2Zz4=)
[![Made with Gemini](https://img.shields.io/badge/AI-Gemini%203%20Flash-FF6F00?style=for-the-badge&logo=google&logoColor=white)](https://ai.google.dev/)
[![GitHub Integration](https://img.shields.io/badge/GitHub-Integration-181717?style=for-the-badge&logo=github&logoColor=white)](https://github.com)

**Transform your IELTS preparation into an epic adventure!**

**一個以遊戲化方式驅動的 IELTS 英語學習與自我精進平台**

<a href="#english">English</a> | <a href="#chinese">繁體中文</a>

</div>

---

<div id="english"></div>

<details open>
<summary><h2>🇬🇧 English Version</h2></summary>

### 📋 Table of Contents
- [Features](#-features)
- [Architecture](#-architecture)
- [Quick Start](#-quick-start)
- [Core Modules](#-core-modules)
- [AI Integration](#-ai-integration)
- [Gamification](#-gamification)

### ✨ Features

#### 🎮 Gamified Learning Experience
- **RPG Progression System** - Levels, XP, Tokens, and Achievements
- **Boss Battle Arena** - Challenge "Weakness Bosses" with your essays
- **Tool Store** - Unlock powerful learning tools with earned tokens
- **Achievement System** - Stay motivated with varied milestones

#### 🤖 AI-Powered Analysis
- **Gemini 3 Flash Integration** - Latest Google AI model
- **Real-time Scoring** - 4-dimension scoring (TA, CC, LR, GRA)
- **Root Cause Analysis (RCA)** - Deep dive into your mistakes
- **AI Coach Feedback** - Personalized improvement suggestions

#### 📊 Comprehensive Tracking
- **GitHub Integration** - Sync study records to GitHub Issues
- **Progress Visualization** - Track your growth visually
- **Smart Caching** - Efficient API usage
- **Multi-language Support** - Bilingual interface (EN/ZH)

### 🏗️ Architecture

```
Quest Empire/
├── 🎮 Core Pages
│   ├── rpg-hub.html              # Main Hub - Dashboard
│   ├── ielts_challenger_arena.html   # Arena - Core Challenge
│   └── creare_github_issue_ticket.html  # Mission Board - GitHub Sync
│
├── 🔧 Tools & Utilities
│   ├── draft_1029.html           # Draft Editor
│   ├── createPR_v1.1.html        # PR Creator
│   ├── github_pushV2.9.4.1.html  # Push Helper
│   └── proof-writing-dashboard.html  # Writing Dashboard
│
├── 📦 Logic Layers
│   ├── DevScribeRPG.js           # Gamification Engine
│   ├── spec-kit-sdd-core.js      # Spec Kit AI Engine
│   ├── spec-kit-bridge.js        # Local Bridge Server
│   └── modules/code-generator.js # AI Code Gen
```

### 🚀 Quick Start

#### Prerequisites
- Node.js 18+
- Python 3.9+
- Google Gemini API Key
- GitHub Personal Access Token (optional)

#### Installation

```bash
# 1. Clone the repository
git clone https://github.com/ChenYW-1116/RPG-Learning-System.git
cd RPG-Learning-System

# 2. Install dependencies
npm install
pip install -r requirements.txt

# 3. Start local server
python -m http.server 8000
```

#### First Time Setup
1. **Get Gemini API Key**: Visit [Google AI Studio](https://aistudio.google.com/)
2. **Configure Hub**: Enter your key in `rpg-hub.html` settings
3. **Start Challenge**: Click "Enter Arena" and fight your first boss!

### 🤖 AI Integration

Using **Gemini 3 Flash Preview** via `generativelanguage.googleapis.com`.

| Feature | Description | Use Case |
|---------|-------------|----------|
| **Essay Analysis** | 4-dim scoring | Arena Battles |
| **RCA** | Root Cause Analysis | Deep diagnostics |
| **Coach Feedback** | AI suggestions | Issue Comments |
| **Rewriting** | Native-like rewrite | Improvement |

</details>

<div id="chinese"></div>

---

<details>
<summary><h2>🇹🇼 繁體中文版本</h2></summary>

### 📋 目錄
- [功能特色](#-features-1)
- [系統架構](#-architecture-1)
- [快速開始](#-quick-start-1)
- [核心模組](#-core-modules-1)
- [AI 整合](#-ai-integration-1)
- [遊戲化系統](#-gamification-1)

### ✨ 功能特色

#### 🎮 遊戲化學習體驗
- **RPG 成長系統** - 等級、經驗值、代幣、成就系統
- **Boss 競技場** - 以擊敗「弱點 Boss」的方式進行 IELTS 練習
- **工具商店** - 使用代幣解鎖強大的學習輔助工具
- **成就系統** - 多種成就激勵持續學習

#### 🤖 AI 驅動分析
- **Gemini 3 Flash** - 使用最新的 Google Gemini AI 模型
- **即時評分** - 四維度即時評分 (TA, CC, LR, GRA)
- **根因分析 (RCA)** - 深度診斷學習問題的根本原因
- **AI 教練回饋** - 個人化的 AI 教練回饋與建議

#### 📊 完整追蹤功能
- **GitHub 整合** - 自動將練習紀錄同步至 GitHub Issue
- **進度視覺化** - 視覺化的進度追蹤與數據分析
- **智能快取** - 智能快取系統避免重複 API 呼叫
- **雙語支援** - 中英文雙語介面切換

### 🏗️ 系統架構

```
Quest Empire/
├── 🎮 核心頁面
│   ├── rpg-hub.html              # 主控台 - 挑戰者成長平台入口
│   ├── ielts_challenger_arena.html   # 競技場 - IELTS 挑戰核心
│   └── creare_github_issue_ticket.html  # 任務看板 - GitHub Issue 整合
│
├── 🔧 工具與實用程式
│   ├── draft_1029.html           # 草稿編輯器
│   ├── createPR_v1.1.html        # GitHub PR 創建器
│   ├── github_pushV2.9.4.1.html  # GitHub 自動推送助手
│   └── proof-writing-dashboard.html  # 寫作證明儀表板
│
├── 📦 邏輯層
│   ├── DevScribeRPG.js           # RPG 遊戲化核心引擎
│   ├── spec-kit-sdd-core.js      # Spec Kit 代碼生成引擎
│   ├── spec-kit-bridge.js        # 本地橋接伺服器
│   └── modules/code-generator.js # AI 代碼生成器
```

### 🚀 快速開始

#### 環境需求
- Node.js 18+
- Python 3.9+
- Google Gemini API Key
- GitHub Personal Access Token (選用)

#### 安裝步驟

```bash
# 1. 複製專案
git clone https://github.com/ChenYW-1116/RPG-Learning-System.git
cd RPG-Learning-System

# 2. 安裝依賴
npm install
pip install -r requirements.txt

# 3. 啟動本地伺服器
python -m http.server 8000
```

#### 首次設定
1. **取得 Gemini API Key**: 前往 [Google AI Studio](https://aistudio.google.com/)
2. **設定主控台**: 在 `rpg-hub.html` 設定中輸入 Key
3. **開始挑戰**: 點擊「進入競技場」並挑戰你的第一個 Boss！

### 🤖 AI 整合

本專案全面採用 **Gemini 3 Flash Preview** 模型。

| 功能 | 說明 | 使用場景 |
|------|------|----------|
| **文章分析** | 四維度寫作評分 | 競技場挑戰 |
| **根因分析** | 深度診斷錯誤原因 | 學習診斷 |
| **教練回饋** | 提供改進建議 | Issue 留言 |
| **文章改寫** | 母語級改寫範例 | 寫作提升 |

### 🎮 RPG 遊戲化系統

#### 等級系統 (Rank System)

| 等級 | 稱號 | 圖示 | 所需 XP |
|------|------|------|--------|
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

#### 獎勵機制

```
勝利獎勵:
├── 基礎 XP: 50
├── Boss 加成: +10-30 (依難度)
├── 連續天數加成: +5/天
└── 代幣: 15-25

失敗獎勵:
├── 參與 XP: 15
└── 代幣: 5
```

</details>

---

<div align="center">

**Built with ❤️ for IELTS learners worldwide**

⚔️ *Challenge your weaknesses. Level up your skills.* 🏰

</div>
