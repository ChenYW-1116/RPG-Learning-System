/**
 * ╔══════════════════════════════════════════════════════════════════════════════╗
 * ║           QUEST EMPIRE - 挑戰者成長平台 v2.0                                   ║
 * ║                    The Global Game State Manager                              ║
 * ╚══════════════════════════════════════════════════════════════════════════════╝
 * 
 * 🎮 核心遊戲引擎：管理自訂挑戰（打怪）、代幣、XP、等級、Plugin 系統
 * 
 * 核心 Entity：
 * - Player：玩家資料（等級、XP、代幣）
 * - Challenge：自訂挑戰目標與完成狀態
 * - Reflection：挑戰後的檢討文章
 * - Plugin：可解鎖的個人工具
 * - PluginListing：玩家上傳的工具項目
 */

const DevScribeRPG = (function () {
    'use strict';

    // ═══════════════════════════════════════════════════════════════════════════
    // 🎯 CONSTANTS & CONFIGURATION
    // ═══════════════════════════════════════════════════════════════════════════

    const STORAGE_KEY = 'quest_empire_state';
    const VERSION = '2.0.0';

    // 等級階層定義
    const RANKS = [
        { level: 1, title: '新手挑戰者', xpRequired: 0, icon: '🌱', color: '#9CA3AF' },
        { level: 2, title: '見習冒險家', xpRequired: 150, icon: '📖', color: '#60A5FA' },
        { level: 3, title: '探索者', xpRequired: 400, icon: '🔍', color: '#34D399' },
        { level: 4, title: '挑戰達人', xpRequired: 750, icon: '🔧', color: '#FBBF24' },
        { level: 5, title: '精英戰士', xpRequired: 1200, icon: '⚡', color: '#F97316' },
        { level: 6, title: '專家引導者', xpRequired: 1800, icon: '🎯', color: '#EF4444' },
        { level: 7, title: '大師創造者', xpRequired: 2600, icon: '👑', color: '#A855F7' },
        { level: 8, title: '宗師煉金師', xpRequired: 3600, icon: '🏆', color: '#EC4899' },
        { level: 9, title: '傳奇締造者', xpRequired: 5000, icon: '🌟', color: '#F59E0B' },
        { level: 10, title: '帝國領袖', xpRequired: 7000, icon: '💎', color: '#8B5CF6' }
    ];

    // ═══════════════════════════════════════════════════════════════════════════
    // 🌍 LOCALIZATION HELPER
    // ═══════════════════════════════════════════════════════════════════════════

    /**
     * Internal translation helper
     * Priority: 
     * 1. Hub's window.i18n.t
     * 2. Arena's window.i18n.t
     * 3. Fallback to key itself
     */
    function _t(key, params = {}) {
        if (typeof window !== 'undefined' && window.i18n && typeof window.i18n.t === 'function') {
            return window.i18n.t(key, params);
        }
        return key;
    }

    // 挑戰難度定義
    const CHALLENGE_DIFFICULTIES = {
        easy: { name: '簡單', icon: '🟢', xpMultiplier: 1.0, tokenReward: 5 },
        medium: { name: '中等', icon: '🟡', xpMultiplier: 1.5, tokenReward: 10 },
        hard: { name: '困難', icon: '🟠', xpMultiplier: 2.0, tokenReward: 20 },
        legendary: { name: '傳奇', icon: '🔴', xpMultiplier: 3.0, tokenReward: 50 }
    };

    // 挑戰類型定義
    const CHALLENGE_TYPES = {
        learning: { name: '學習挑戰', icon: '📚', baseXP: 30, description: '閱讀、觀看、學習新知識' },
        project: { name: '專案挑戰', icon: '🛠️', baseXP: 50, description: '完成具體的專案或任務' },
        habit: { name: '習慣挑戰', icon: '🔄', baseXP: 20, description: '建立持續的好習慣' },
        skill: { name: '技能挑戰', icon: '⚡', baseXP: 40, description: '提升特定技能' },
        creative: { name: '創作挑戰', icon: '🎨', baseXP: 45, description: '創作內容或作品' }
    };

    // Plugin 品質等級定義
    const PLUGIN_TIERS = {
        prototype: { name: '原型', icon: '⚙️', color: '#9CA3AF', minUsages: 0 },
        bronze: { name: '青銅', icon: '🥉', color: '#CD7F32', minUsages: 3 },
        silver: { name: '白銀', icon: '🥈', color: '#C0C0C0', minUsages: 10 },
        gold: { name: '黃金', icon: '🥇', color: '#FFD700', minUsages: 30 },
        legendary: { name: '傳奇', icon: '💎', color: '#8B5CF6', minUsages: 100 }
    };

    // 預設 Plugin 商店
    const DEFAULT_PLUGINS = [
        {
            id: 'plugin_xp_boost',
            name: '經驗值加速器',
            description: '完成挑戰時獲得額外 20% XP 加成',
            icon: '⚡',
            tokenCost: 100,
            tier: 'bronze',
            effect: { type: 'xp_multiplier', value: 1.2 },
            usages: 15,
            rating: 4.5,
            developerId: 'system'
        },
        {
            id: 'plugin_token_boost',
            name: '代幣收集器',
            description: '完成挑戰時獲得額外 30% 代幣',
            icon: '💰',
            tokenCost: 150,
            tier: 'silver',
            effect: { type: 'token_multiplier', value: 1.3 },
            usages: 25,
            rating: 4.7,
            developerId: 'system'
        },
        {
            id: 'plugin_streak_shield',
            name: '連續天數護盾',
            description: '保護一次中斷的連續天數紀錄',
            icon: '🛡️',
            tokenCost: 200,
            tier: 'gold',
            effect: { type: 'streak_shield', value: 1 },
            usages: 45,
            rating: 4.8,
            developerId: 'system'
        },
        {
            id: 'plugin_reflection_bonus',
            name: '深度反思增幅',
            description: '撰寫檢討文章時獲得額外 50% XP',
            icon: '📝',
            tokenCost: 120,
            tier: 'bronze',
            effect: { type: 'reflection_bonus', value: 1.5 },
            usages: 20,
            rating: 4.3,
            developerId: 'system'
        },
        {
            id: 'plugin_challenge_radar',
            name: '挑戰雷達',
            description: '推薦適合你的挑戰類型',
            icon: '📡',
            tokenCost: 80,
            tier: 'prototype',
            effect: { type: 'recommendation', value: true },
            usages: 8,
            rating: 3.9,
            developerId: 'system'
        }
    ];

    // HTML 工具分類
    const TOOL_CATEGORIES = {
        github: { name: 'GitHub 工具', icon: '🔧', color: '#6e5494' },
        writing: { name: '寫作輔助', icon: '✍️', color: '#10B981' },
        analysis: { name: '分析工具', icon: '📊', color: '#3B82F6' },
        practice: { name: '練習工具', icon: '🎯', color: '#F59E0B' },
        utility: { name: '其他工具', icon: '⚙️', color: '#6B7280' }
    };

    // 預設 HTML 工具（系統內建）
    const DEFAULT_HTML_TOOLS = [
        {
            id: 'tool_github_push',
            name: 'GitHub Push 助手',
            description: '一鍵推送代碼到 GitHub，支援 Exe 文件、AI 路徑解析、同步功能',
            icon: '🚀',
            category: 'github',
            tokenCost: 80,
            tier: 'gold',
            fileName: 'github_pushV2.9.4.1(Exe Support + AI Path + Sync+CompStrictly+GitHitMaps).html',
            usages: 45,
            rating: 4.8,
            developerId: 'system',
            features: ['Exe 支援', 'AI 路徑', '同步功能', '組件嚴格模式', 'GitHitMaps']
        },
        {
            id: 'tool_create_pr',
            name: 'PR 創建器',
            description: '快速創建 GitHub Pull Request，自動生成描述和標籤',
            icon: '📤',
            category: 'github',
            tokenCost: 50,
            tier: 'silver',
            fileName: 'createPR_v1.1.html',
            usages: 32,
            rating: 4.5,
            developerId: 'system',
            features: ['自動描述', '標籤生成', '模板支援']
        },
        {
            id: 'tool_draft_editor',
            name: '草稿編輯器',
            description: '強大的寫作草稿編輯工具，支援多種格式和自動保存',
            icon: '📝',
            category: 'writing',
            tokenCost: 60,
            tier: 'silver',
            fileName: 'draft_1029.html',
            usages: 28,
            rating: 4.6,
            developerId: 'system',
            features: ['自動保存', '多格式支援', '版本控制']
        },
        {
            id: 'tool_github_issue',
            name: 'Issue 票據創建器',
            description: '快速創建 GitHub Issue，支援模板和自動分類',
            icon: '🎫',
            category: 'github',
            tokenCost: 40,
            tier: 'bronze',
            fileName: 'creare_github_issue_ticket_1.10.2.html',
            usages: 20,
            rating: 4.3,
            developerId: 'system',
            features: ['模板系統', '自動分類', '優先級設定']
        },
        {
            id: 'tool_immerse_practice',
            name: '沉浸式練習器',
            description: '英語沉浸式練習工具，支援 WT1 類型的寫作訓練',
            icon: '🎓',
            category: 'practice',
            tokenCost: 70,
            tier: 'silver',
            fileName: 'Immerse practice_WT1_process_typeV2.2.1.html',
            usages: 35,
            rating: 4.7,
            developerId: 'system',
            features: ['沉浸式學習', 'WT1 專用', '進度追蹤']
        },
        {
            id: 'tool_proof_writing',
            name: '寫作證明儀表板',
            description: '追蹤和展示你的寫作進度，生成專業的成果報告',
            icon: '📊',
            category: 'analysis',
            tokenCost: 55,
            tier: 'silver',
            fileName: 'proof-writing-dashboard_v1.2.1.html',
            usages: 25,
            rating: 4.4,
            developerId: 'system',
            features: ['進度追蹤', '報告生成', '數據視覺化']
        },
        {
            id: 'tool_learning_coach',
            name: '個人學習教練',
            description: 'AI 驅動的個人化學習互動工具',
            icon: '🤖',
            category: 'practice',
            tokenCost: 90,
            tier: 'gold',
            fileName: 'personal_learning_coach_interaction.html',
            usages: 40,
            rating: 4.9,
            developerId: 'system',
            features: ['AI 互動', '個人化建議', '學習追蹤']
        },
        {
            id: 'tool_deliberate_practice',
            name: '刻意練習對策幫手',
            description: '根據你的弱點提供針對性的練習策略',
            icon: '🎯',
            category: 'practice',
            tokenCost: 65,
            tier: 'silver',
            fileName: '刻意練習對策幫手.html',
            usages: 30,
            rating: 4.5,
            developerId: 'system',
            features: ['弱點分析', '策略建議', '練習計劃']
        },
        {
            id: 'tool_spec_kit_agent',
            name: 'Spec Kit AI Agent',
            description: '基於 Spec-Driven Development 方法論的 AI 代碼生成器，輕鬆創建前端應用',
            icon: '🤖',
            category: 'utility',
            tokenCost: 100,
            tier: 'gold',
            fileName: 'spec-kit-agent.html',
            usages: 50,
            rating: 4.9,
            developerId: 'system',
            features: ['AI 生成', 'SDD 方法論', '自動添加裝備', '響應式設計']
        },
        {
            id: 'tool_zhihu_poster',
            name: 'Zhihu 發文助手',
            description: '自動化知乎文章發布工具，支援 Markdown 預覽與指令生成',
            icon: '🐼',
            category: 'utility',
            tokenCost: 120,
            tier: 'gold',
            fileName: 'zhihu_poster_tool.html',
            usages: 10,
            rating: 4.8,
            developerId: 'system',
            features: ['自動化發布', '多帳號管理', '指令生成']
        }
    ];

    // 成就系統
    const ACHIEVEMENTS = [
        { id: 'first_challenge', name: '初次挑戰', icon: '🎯', description: '完成第一個挑戰', condition: (s) => s.totalChallengesCompleted >= 1 },
        { id: 'first_reflection', name: '反思者', icon: '📝', description: '撰寫第一篇檢討文章', condition: (s) => s.totalReflections >= 1 },
        { id: 'challenge_10', name: '挑戰達人', icon: '⚔️', description: '完成 10 個挑戰', condition: (s) => s.totalChallengesCompleted >= 10 },
        { id: 'challenge_50', name: '挑戰大師', icon: '🏆', description: '完成 50 個挑戰', condition: (s) => s.totalChallengesCompleted >= 50 },
        { id: 'token_500', name: '財富累積者', icon: '💰', description: '累積 500 代幣', condition: (s) => s.tokens >= 500 },
        { id: 'token_2000', name: '代幣大亨', icon: '🏦', description: '累積 2000 代幣', condition: (s) => s.tokens >= 2000 },
        { id: 'unlock_plugin', name: '工具解鎖者', icon: '🔓', description: '解鎖第一個 Plugin', condition: (s) => s.unlockedPlugins.length >= 1 },
        { id: 'unlock_5_plugins', name: '工具收藏家', icon: '🗃️', description: '解鎖 5 個 Plugin', condition: (s) => s.unlockedPlugins.length >= 5 },
        { id: 'create_plugin', name: '創造者', icon: '🛠️', description: '創建第一個自製 Plugin', condition: (s) => s.createdPlugins.length >= 1 },
        { id: 'plugin_sold', name: '開發商', icon: '🏪', description: '自製 Plugin 被他人兌換', condition: (s) => s.pluginSales >= 1 },
        { id: 'streak_7', name: '週末戰士', icon: '📅', description: '連續 7 天活動', condition: (s) => s.currentStreak >= 7 },
        { id: 'level_10', name: '帝國領袖', icon: '💎', description: '達到最高等級', condition: (s) => s.level >= 10 }
    ];

    // ═══════════════════════════════════════════════════════════════════════════
    // 🔧 STATE MANAGEMENT
    // ═══════════════════════════════════════════════════════════════════════════

    // 預設遊戲狀態
    const DEFAULT_STATE = {
        version: VERSION,
        playerName: '挑戰者',
        totalXP: 0,
        tokens: 1000,  // 新增代幣系統
        level: 1,
        currentStreak: 0,
        maxStreak: 0,
        lastLoginDate: null,

        // 挑戰相關
        challenges: [],  // 玩家建立的挑戰
        totalChallengesCompleted: 0,
        totalChallengesAbandoned: 0,

        // 檢討文章相關
        reflections: [],  // 檢討文章列表
        totalReflections: 0,

        // Plugin 系統
        unlockedPlugins: [],  // 已解鎖的 Plugin ID
        activePlugins: [],     // 啟用中的 Plugin ID
        createdPlugins: [],    // 玩家自製的 Plugin
        pluginSales: 0,        // 插件銷售數量

        // HTML 工具系統
        unlockedTools: [],     // 已兌換的工具 ID
        uploadedTools: [],     // 玩家上傳的工具
        toolUsageHistory: [],  // 工具使用歷史
        toolSales: 0,          // 工具銷售數量

        // 成就與統計
        achievements: [],
        stats: {
            totalXPFromChallenges: 0,
            totalXPFromReflections: 0,
            totalTokensEarned: 0,
            totalTokensSpent: 0,
            challengesByType: {},
            challengesByDifficulty: {}
        },

        eventLog: [],
        ritualCompleted: false, // 儀式是否已完成
        createdAt: new Date().toISOString()
    };

    // 載入狀態
    function loadState() {
        try {
            const saved = localStorage.getItem(STORAGE_KEY);
            if (saved) {
                const state = JSON.parse(saved);
                // 合併預設值以處理新增欄位
                const merged = {
                    ...DEFAULT_STATE,
                    ...state,
                    stats: { ...DEFAULT_STATE.stats, ...(state.stats || {}) }
                };

                // 確保數組欄位存在（處理舊版本相容性）
                merged.unlockedTools = merged.unlockedTools || [];
                merged.uploadedTools = merged.uploadedTools || [];
                merged.toolUsageHistory = merged.toolUsageHistory || [];
                merged.unlockedPlugins = merged.unlockedPlugins || [];
                merged.activePlugins = merged.activePlugins || [];
                merged.createdPlugins = merged.createdPlugins || [];
                merged.challenges = merged.challenges || [];
                merged.reflections = merged.reflections || [];
                merged.achievements = merged.achievements || [];
                merged.eventLog = merged.eventLog || [];

                return merged;
            }
        } catch (e) {
            console.error('[QuestEmpire] Failed to load state:', e);
        }
        return { ...DEFAULT_STATE };
    }

    // 儲存狀態
    function saveState(state) {
        try {
            state.version = VERSION;
            localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
            return true;
        } catch (e) {
            console.error('[QuestEmpire] Failed to save state:', e);
            return false;
        }
    }

    // 單例狀態
    let _state = loadState();

    // ═══════════════════════════════════════════════════════════════════════════
    // 🎮 CORE GAME MECHANICS
    // ═══════════════════════════════════════════════════════════════════════════

    // 計算當前等級
    function calculateLevel(xp) {
        let currentRank = RANKS[0];
        for (const rank of RANKS) {
            if (xp >= rank.xpRequired) {
                currentRank = rank;
            } else {
                break;
            }
        }
        return currentRank;
    }

    // 計算到下一級的進度
    function getProgressToNextLevel(xp) {
        const currentRank = calculateLevel(xp);
        const nextRank = RANKS.find(r => r.level === currentRank.level + 1);

        if (!nextRank) {
            return { progress: 100, xpNeeded: 0, currentInLevel: 0, totalInLevel: 0 };
        }

        const xpInCurrentLevel = xp - currentRank.xpRequired;
        const xpForThisLevel = nextRank.xpRequired - currentRank.xpRequired;
        const progress = Math.floor((xpInCurrentLevel / xpForThisLevel) * 100);

        return {
            progress: Math.min(progress, 100),
            xpNeeded: nextRank.xpRequired - xp,
            currentInLevel: xpInCurrentLevel,
            totalInLevel: xpForThisLevel
        };
    }

    // 獲取有效的 XP 加成 (來自 Plugins)
    function getXPMultiplier() {
        let multiplier = 1.0;
        for (const pluginId of _state.activePlugins) {
            const plugin = getPluginById(pluginId);
            if (plugin && plugin.effect.type === 'xp_multiplier') {
                multiplier *= plugin.effect.value;
            }
        }
        return multiplier;
    }

    // 獲取有效的代幣加成
    function getTokenMultiplier() {
        let multiplier = 1.0;
        for (const pluginId of _state.activePlugins) {
            const plugin = getPluginById(pluginId);
            if (plugin && plugin.effect.type === 'token_multiplier') {
                multiplier *= plugin.effect.value;
            }
        }
        return multiplier;
    }

    // 獲取反思加成
    function getReflectionBonus() {
        let bonus = 1.0;
        for (const pluginId of _state.activePlugins) {
            const plugin = getPluginById(pluginId);
            if (plugin && plugin.effect.type === 'reflection_bonus') {
                bonus *= plugin.effect.value;
            }
        }
        return bonus;
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // ⚔️ CHALLENGE SYSTEM (打怪系統)
    // ═══════════════════════════════════════════════════════════════════════════

    // 建立新挑戰
    function createChallenge(params) {
        const { title, description, type, difficulty, deadline, verificationMethod } = params;

        // 驗證必要參數
        if (!title || title.trim().length < 3) {
            return { success: false, error: '挑戰標題至少需要 3 個字元' };
        }
        if (!CHALLENGE_TYPES[type]) {
            return { success: false, error: '無效的挑戰類型' };
        }
        if (!CHALLENGE_DIFFICULTIES[difficulty]) {
            return { success: false, error: '無效的難度等級' };
        }

        // 檢查是否過於模糊
        if (!verificationMethod || verificationMethod.trim().length < 10) {
            return { success: false, error: '請提供可驗證的完成條件（至少 10 個字元），以確保挑戰可驗證' };
        }

        const challenge = {
            id: 'challenge_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
            title: title.trim(),
            description: description?.trim() || '',
            type,
            difficulty,
            deadline: deadline || null,
            verificationMethod: verificationMethod.trim(),
            status: 'active',  // active, completed, abandoned
            createdAt: new Date().toISOString(),
            completedAt: null,
            reflection: null,  // 關聯的檢討文章 ID
            xpEarned: 0,
            tokensEarned: 0
        };

        _state.challenges.push(challenge);

        // 更新統計
        _state.stats.challengesByType[type] = (_state.stats.challengesByType[type] || 0) + 1;
        _state.stats.challengesByDifficulty[difficulty] = (_state.stats.challengesByDifficulty[difficulty] || 0) + 1;

        saveState(_state);
        dispatchEvent('challengeCreated', { challenge });

        logEvent('challenge_created', `建立挑戰：${title}`, { challengeId: challenge.id });

        return { success: true, challenge };
    }

    // 完成挑戰
    function completeChallenge(challengeId, completionNotes = '') {
        const challenge = _state.challenges.find(c => c.id === challengeId);

        if (!challenge) {
            return { success: false, error: '找不到此挑戰' };
        }
        if (challenge.status !== 'active') {
            return { success: false, error: '此挑戰已完成或已放棄' };
        }

        const typeInfo = CHALLENGE_TYPES[challenge.type];
        const difficultyInfo = CHALLENGE_DIFFICULTIES[challenge.difficulty];

        // 計算 XP 和代幣
        const baseXP = typeInfo.baseXP;
        const xpMultiplier = difficultyInfo.xpMultiplier * getXPMultiplier();
        const earnedXP = Math.floor(baseXP * xpMultiplier);

        const baseTokens = difficultyInfo.tokenReward;
        const tokenMultiplier = getTokenMultiplier();
        const earnedTokens = Math.floor(baseTokens * tokenMultiplier);

        // 更新挑戰狀態
        challenge.status = 'completed';
        challenge.completedAt = new Date().toISOString();
        challenge.completionNotes = completionNotes;
        challenge.xpEarned = earnedXP;
        challenge.tokensEarned = earnedTokens;

        // 更新玩家狀態
        const oldLevel = _state.level;
        _state.totalXP += earnedXP;
        _state.tokens += earnedTokens;
        _state.totalChallengesCompleted++;
        _state.stats.totalXPFromChallenges += earnedXP;
        _state.stats.totalTokensEarned += earnedTokens;

        // 更新等級
        const newRank = calculateLevel(_state.totalXP);
        _state.level = newRank.level;

        // 更新連續天數
        updateStreak();

        // 檢查成就
        const newAchievements = checkAchievements();

        saveState(_state);

        const result = {
            challenge,
            earnedXP,
            earnedTokens,
            totalXP: _state.totalXP,
            totalTokens: _state.tokens,
            level: _state.level,
            rank: newRank,
            leveledUp: newRank.level > oldLevel,
            newAchievements,
            canWriteReflection: true  // 提示可以撰寫檢討文章
        };

        dispatchEvent('challengeCompleted', result);
        logEvent('challenge_completed', `完成挑戰：${challenge.title}`, {
            challengeId, earnedXP, earnedTokens
        });

        if (result.leveledUp) {
            dispatchEvent('levelUp', { oldLevel, newLevel: newRank.level, rank: newRank });
        }

        return { success: true, ...result };
    }

    // 放棄挑戰
    function abandonChallenge(challengeId, reason = '') {
        const challenge = _state.challenges.find(c => c.id === challengeId);

        if (!challenge) {
            return { success: false, error: '找不到此挑戰' };
        }
        if (challenge.status !== 'active') {
            return { success: false, error: '此挑戰已完成或已放棄' };
        }

        challenge.status = 'abandoned';
        challenge.abandonedAt = new Date().toISOString();
        challenge.abandonReason = reason;
        challenge.xpEarned = 0;
        challenge.tokensEarned = 0;

        _state.totalChallengesAbandoned++;

        saveState(_state);
        dispatchEvent('challengeAbandoned', { challenge });
        logEvent('challenge_abandoned', `放棄挑戰：${challenge.title}`, { challengeId });

        return { success: true, challenge };
    }

    // 取得挑戰列表
    function getChallenges(filter = 'all') {
        switch (filter) {
            case 'active':
                return _state.challenges.filter(c => c.status === 'active');
            case 'completed':
                return _state.challenges.filter(c => c.status === 'completed');
            case 'abandoned':
                return _state.challenges.filter(c => c.status === 'abandoned');
            default:
                return [..._state.challenges];
        }
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // 📝 REFLECTION SYSTEM (檢討文章系統)
    // ═══════════════════════════════════════════════════════════════════════════

    // 撰寫檢討文章
    function writeReflection(challengeId, content) {
        const challenge = _state.challenges.find(c => c.id === challengeId);

        if (!challenge) {
            return { success: false, errorKey: 'errToolNotFound', error: '找不到此挑戰' };
        }
        if (challenge.status !== 'completed') {
            return { success: false, errorKey: 'errNotCompleted', error: '只能對已完成的挑戰撰寫檢討' };
        }
        if (challenge.reflection) {
            return { success: false, errorKey: 'errAlreadyReflected', error: '此挑戰已有檢討文章' };
        }
        if (!content || content.trim().length < 50) {
            return { success: false, errorKey: 'errMinLengthReflection', error: '檢討文章至少需要 50 個字元' };
        }

        // 計算反思品質分數 (基於字數和內容)
        const wordCount = content.trim().split(/\s+/).length;
        const qualityScore = Math.min(100, Math.floor(wordCount / 5) + 20); // 最高 100 分

        const reflection = {
            id: 'reflection_' + Date.now(),
            challengeId,
            content: content.trim(),
            wordCount: content.trim().length,
            qualityScore,
            createdAt: new Date().toISOString()
        };

        _state.reflections.push(reflection);
        _state.totalReflections++;
        challenge.reflection = reflection.id;

        // 計算額外 XP (基於品質分數和 Plugin 加成)
        const baseReflectionXP = 30;
        const qualityBonus = qualityScore / 100;
        const reflectionBonus = getReflectionBonus();
        const bonusXP = Math.floor(baseReflectionXP * qualityBonus * reflectionBonus);

        const oldLevel = _state.level;
        _state.totalXP += bonusXP;
        _state.stats.totalXPFromReflections += bonusXP;

        // 更新等級
        const newRank = calculateLevel(_state.totalXP);
        _state.level = newRank.level;

        // 檢查成就
        const newAchievements = checkAchievements();

        saveState(_state);

        const result = {
            reflection,
            bonusXP,
            qualityScore,
            totalXP: _state.totalXP,
            level: _state.level,
            rank: newRank,
            leveledUp: newRank.level > oldLevel,
            newAchievements
        };

        dispatchEvent('reflectionWritten', result);
        logEvent('reflection_written', `撰寫檢討：${challenge.title}`, {
            reflectionId: reflection.id, bonusXP, qualityScore
        });

        if (result.leveledUp) {
            dispatchEvent('levelUp', { oldLevel, newLevel: newRank.level, rank: newRank });
        }

        return { success: true, ...result };
    }

    // 取得檢討文章
    function getReflections(challengeId = null) {
        if (challengeId) {
            return _state.reflections.filter(r => r.challengeId === challengeId);
        }
        return [..._state.reflections];
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // 🔌 PLUGIN SYSTEM (工具系統)
    // ═══════════════════════════════════════════════════════════════════════════

    // 取得所有可用 Plugin（含系統預設 + 玩家上傳）
    function getAllPlugins() {
        // 從 localStorage 讀取社群 Plugin
        let communityPlugins = [];
        try {
            const saved = localStorage.getItem('quest_empire_community_plugins');
            if (saved) {
                communityPlugins = JSON.parse(saved);
            }
        } catch (e) {
            console.error('[QuestEmpire] Failed to load community plugins:', e);
        }

        return [...DEFAULT_PLUGINS, ...communityPlugins];
    }

    // 根據 ID 取得 Plugin
    function getPluginById(pluginId) {
        return getAllPlugins().find(p => p.id === pluginId);
    }

    // 解鎖 Plugin
    function unlockPlugin(pluginId) {
        const plugin = getPluginById(pluginId);

        if (!plugin) {
            return { success: false, errorKey: 'errPluginNotFound', error: '找不到此 Plugin' };
        }
        if (_state.unlockedPlugins.includes(pluginId)) {
            return { success: false, errorKey: 'errAlreadyOwned', error: '你已經擁有此 Plugin' };
        }
        if (_state.tokens < plugin.tokenCost) {
            return {
                success: false,
                errorKey: 'errInsufficientTokens',
                params: { cost: plugin.tokenCost, balance: _state.tokens },
                error: `代幣不足！需要 ${plugin.tokenCost} 代幣，你只有 ${_state.tokens} 代幣`
            };
        }

        // 扣除代幣
        _state.tokens -= plugin.tokenCost;
        _state.stats.totalTokensSpent += plugin.tokenCost;
        _state.unlockedPlugins.push(pluginId);

        // 更新 Plugin 使用次數 (用於品質系統)
        updatePluginUsage(pluginId);

        // 如果是玩家創建的 Plugin，增加銷售數據
        if (plugin.developerId && plugin.developerId !== 'system') {
            recordPluginSale(pluginId);
        }

        // 檢查成就
        const newAchievements = checkAchievements();

        saveState(_state);

        const result = {
            plugin,
            tokensSpent: plugin.tokenCost,
            remainingTokens: _state.tokens,
            newAchievements
        };

        dispatchEvent('pluginUnlocked', result);
        logEvent('plugin_unlocked', `解鎖工具：${plugin.name}`, { pluginId, cost: plugin.tokenCost });

        return { success: true, ...result };
    }

    // 啟用 Plugin
    function activatePlugin(pluginId) {
        if (!_state.unlockedPlugins.includes(pluginId)) {
            return { success: false, errorKey: 'errNotUnlockedPlugin', error: '你還沒有解鎖此 Plugin' };
        }
        if (_state.activePlugins.includes(pluginId)) {
            return { success: false, errorKey: 'errAlreadyActivePlugin', error: '此 Plugin 已經啟用' };
        }

        // 最多同時啟用 3 個 Plugin
        if (_state.activePlugins.length >= 3) {
            return { success: false, errorKey: 'errMaxActivePlugins', error: '最多同時啟用 3 個 Plugin' };
        }

        _state.activePlugins.push(pluginId);
        saveState(_state);

        dispatchEvent('pluginActivated', { pluginId });
        return { success: true };
    }

    // 停用 Plugin
    function deactivatePlugin(pluginId) {
        const index = _state.activePlugins.indexOf(pluginId);
        if (index === -1) {
            return { success: false, errorKey: 'errNotActivePlugin', error: '此 Plugin 未啟用' };
        }

        _state.activePlugins.splice(index, 1);
        saveState(_state);

        dispatchEvent('pluginDeactivated', { pluginId });
        return { success: true };
    }

    // 更新 Plugin 使用次數（用於品質系統）
    function updatePluginUsage(pluginId) {
        let communityPlugins = [];
        try {
            const saved = localStorage.getItem('quest_empire_community_plugins');
            if (saved) {
                communityPlugins = JSON.parse(saved);
            }
        } catch (e) {
            return;
        }

        const plugin = communityPlugins.find(p => p.id === pluginId);
        if (plugin) {
            plugin.usages = (plugin.usages || 0) + 1;
            plugin.tier = calculatePluginTier(plugin.usages);
            localStorage.setItem('quest_empire_community_plugins', JSON.stringify(communityPlugins));
        }
    }

    // 計算 Plugin 等級
    function calculatePluginTier(usages) {
        if (usages >= PLUGIN_TIERS.legendary.minUsages) return 'legendary';
        if (usages >= PLUGIN_TIERS.gold.minUsages) return 'gold';
        if (usages >= PLUGIN_TIERS.silver.minUsages) return 'silver';
        if (usages >= PLUGIN_TIERS.bronze.minUsages) return 'bronze';
        return 'prototype';
    }

    // 創建自製 Plugin
    function createPlugin(params) {
        const { name, description, icon, tokenCost, effectType, effectValue } = params;

        if (!name || name.trim().length < 2) {
            return { success: false, errorKey: 'errMinLengthName', error: 'Plugin 名稱至少需要 2 個字元' };
        }
        if (!description || description.trim().length < 10) {
            return { success: false, errorKey: 'errMinLengthDesc', error: '描述至少需要 10 個字元' };
        }
        if (!tokenCost || tokenCost < 10 || tokenCost > 500) {
            return { success: false, errorKey: 'errTokenRange', error: '代幣價格需在 10-500 之間' };
        }

        const plugin = {
            id: 'custom_plugin_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
            name: name.trim(),
            description: description.trim(),
            icon: icon || '🔧',
            tokenCost,
            tier: 'prototype',
            effect: { type: effectType || 'custom', value: effectValue || 1 },
            usages: 0,
            rating: 0,
            developerId: _state.playerName,
            createdAt: new Date().toISOString()
        };

        // 儲存到社群 Plugin
        let communityPlugins = [];
        try {
            const saved = localStorage.getItem('quest_empire_community_plugins');
            if (saved) {
                communityPlugins = JSON.parse(saved);
            }
        } catch (e) {
            communityPlugins = [];
        }

        communityPlugins.push(plugin);
        localStorage.setItem('quest_empire_community_plugins', JSON.stringify(communityPlugins));

        // 記錄到玩家狀態
        _state.createdPlugins.push(plugin.id);

        // 檢查成就
        const newAchievements = checkAchievements();

        saveState(_state);

        dispatchEvent('pluginCreated', { plugin, newAchievements });
        logEvent('plugin_created', `創建工具：${plugin.name}`, { pluginId: plugin.id });

        return { success: true, plugin, newAchievements };
    }

    // 記錄 Plugin 銷售
    function recordPluginSale(pluginId) {
        const plugin = getPluginById(pluginId);
        if (plugin && plugin.developerId === _state.playerName) {
            _state.pluginSales++;
            saveState(_state);
        }
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // 🧰 HTML TOOLS SYSTEM (HTML 工具系統)
    // ═══════════════════════════════════════════════════════════════════════════

    // 取得所有可用的 HTML 工具（含系統預設 + 玩家上傳）
    function getAllTools() {
        // 從 localStorage 讀取社群工具
        let communityTools = [];
        try {
            const saved = localStorage.getItem('quest_empire_community_tools');
            if (saved) {
                communityTools = JSON.parse(saved);
            }
        } catch (e) {
            console.error('[QuestEmpire] Failed to load community tools:', e);
        }

        return [...DEFAULT_HTML_TOOLS, ...communityTools];
    }

    // 根據 ID 取得工具
    function getToolById(toolId) {
        return getAllTools().find(t => t.id === toolId);
    }

    // 根據分類取得工具
    function getToolsByCategory(category) {
        return getAllTools().filter(t => t.category === category);
    }

    // 取得已兌換的工具（個人裝備）
    function getOwnedTools() {
        const allTools = getAllTools();
        return allTools.filter(t => _state.unlockedTools.includes(t.id));
    }

    // 兌換工具
    function unlockTool(toolId) {
        const tool = getToolById(toolId);

        if (!tool) {
            return { success: false, errorKey: 'errToolNotFound', error: '找不到此工具' };
        }
        if (!_state.unlockedTools) _state.unlockedTools = [];

        if (_state.unlockedTools.includes(toolId)) {
            return { success: false, errorKey: 'errAlreadyOwned', error: '你已經擁有此工具' };
        }
        if (_state.tokens < tool.tokenCost) {
            return {
                success: false,
                errorKey: 'errInsufficientTokens',
                params: { cost: tool.tokenCost, balance: _state.tokens },
                error: `代幣不足！需要 ${tool.tokenCost} 代幣，你只有 ${_state.tokens} 代幣`
            };
        }

        // 扣除代幣
        _state.tokens -= tool.tokenCost;
        _state.stats.totalTokensSpent += tool.tokenCost;
        _state.unlockedTools.push(toolId);

        // 更新工具使用次數
        updateToolUsage(toolId);

        // 如果是玩家上傳的工具，增加銷售數據並給予創作者獎勵
        if (tool.developerId && tool.developerId !== 'system') {
            recordToolSale(toolId);
        }

        // 檢查成就
        const newAchievements = checkAchievements();

        saveState(_state);

        const result = {
            tool,
            tokensSpent: tool.tokenCost,
            remainingTokens: _state.tokens,
            newAchievements
        };

        dispatchEvent('toolUnlocked', result);
        logEvent('tool_unlocked', `兌換工具：${tool.name}`, { toolId, cost: tool.tokenCost });

        return { success: true, ...result };
    }

    // 更新工具使用次數
    function updateToolUsage(toolId) {
        let communityTools = [];
        try {
            const saved = localStorage.getItem('quest_empire_community_tools');
            if (saved) {
                communityTools = JSON.parse(saved);
            }
        } catch (e) {
            return;
        }

        const tool = communityTools.find(t => t.id === toolId);
        if (tool) {
            tool.usages = (tool.usages || 0) + 1;
            tool.tier = calculatePluginTier(tool.usages);
            localStorage.setItem('quest_empire_community_tools', JSON.stringify(communityTools));
        }
    }

    // 記錄工具銷售
    function recordToolSale(toolId) {
        const tool = getToolById(toolId);
        if (tool && tool.developerId === _state.playerName) {
            _state.toolSales++;
            // 創作者獲得 20% 的代幣回饋
            const creatorReward = Math.floor(tool.tokenCost * 0.2);
            _state.tokens += creatorReward;
            _state.stats.totalTokensEarned += creatorReward;
            saveState(_state);

            showNotification(_t('notifyToolSaleTitle'), _t('notifyToolSaleMsg', { reward: creatorReward }), 'success', '🏪');
        }
    }

    // 使用工具（開啟工具頁面）
    function useTool(toolId) {
        const tool = getToolById(toolId);

        if (!tool) {
            return { success: false, errorKey: 'errToolNotFound', error: '找不到此工具' };
        }
        if (!_state.unlockedTools) _state.unlockedTools = [];

        if (!_state.unlockedTools.includes(toolId)) {
            return { success: false, errorKey: 'errNotUnlockedPlugin', error: '你還沒有兌換此工具' };
        }

        // 記錄使用歷史
        if (!_state.toolUsageHistory) _state.toolUsageHistory = [];

        _state.toolUsageHistory.unshift({
            toolId,
            toolName: tool.name,
            usedAt: new Date().toISOString()
        });

        if (_state.toolUsageHistory.length > 50) _state.toolUsageHistory.pop();

        saveState(_state);
        dispatchEvent('toolUsed', { tool });
        logEvent('tool_used', `使用工具：${tool.name}`, { toolId });

        // 返回工具檔案名稱以便開啟
        return { success: true, tool, fileName: tool.fileName };
    }

    // 上傳新工具
    function uploadTool(params) {
        const { name, description, icon, tokenCost, category, fileName, features } = params;

        if (!name || name.trim().length < 2) {
            return { success: false, errorKey: 'errMinLengthName', error: '工具名稱至少需要 2 個字元' };
        }
        if (!description || description.trim().length < 10) {
            return { success: false, errorKey: 'errMinLengthDesc', error: '描述至少需要 10 個字元' };
        }
        if (!tokenCost || tokenCost < 10 || tokenCost > 500) {
            return { success: false, errorKey: 'errTokenRange', error: '代幣價格需在 10-500 之間' };
        }
        if (!fileName || !fileName.endsWith('.html')) {
            return { success: false, errorKey: 'errInvalidFileName', error: '請提供有效的 HTML 檔案名稱' };
        }
        if (!TOOL_CATEGORIES[category]) {
            return { success: false, errorKey: 'errInvalidCategory', error: '請選擇有效的工具分類' };
        }

        const tool = {
            id: 'custom_tool_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
            name: name.trim(),
            description: description.trim(),
            icon: icon || '🔧',
            category: category || 'utility',
            tokenCost,
            tier: 'prototype',
            fileName: fileName.trim(),
            features: features || [],
            usages: 0,
            rating: 0,
            developerId: _state.playerName,
            createdAt: new Date().toISOString()
        };

        // 儲存到社群工具
        let communityTools = [];
        try {
            const saved = localStorage.getItem('quest_empire_community_tools');
            if (saved) {
                communityTools = JSON.parse(saved);
            }
        } catch (e) {
            communityTools = [];
        }

        communityTools.push(tool);
        localStorage.setItem('quest_empire_community_tools', JSON.stringify(communityTools));

        // 記錄到玩家狀態（確保數組存在）
        if (!_state.uploadedTools) _state.uploadedTools = [];
        if (!_state.unlockedTools) _state.unlockedTools = [];

        _state.uploadedTools.push(tool.id);

        // 創作者自動擁有自己的工具
        _state.unlockedTools.push(tool.id);

        // 獎勵上傳者 XP
        const uploadXP = 25;
        _state.totalXP += uploadXP;

        // 檢查成就
        const newAchievements = checkAchievements();

        saveState(_state);

        dispatchEvent('toolUploaded', { tool, newAchievements, bonusXP: uploadXP });
        logEvent('tool_uploaded', `上傳工具：${tool.name}`, { toolId: tool.id });

        return { success: true, tool, newAchievements, bonusXP: uploadXP };
    }

    // 取得工具分類列表
    function getToolCategories() {
        return { ...TOOL_CATEGORIES };
    }

    // 取得工具使用歷史
    function getToolUsageHistory() {
        return [..._state.toolUsageHistory];
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // 📅 STREAK SYSTEM (連續天數系統)
    // ═══════════════════════════════════════════════════════════════════════════

    function updateStreak() {
        const now = new Date();
        const today = now.toISOString().split('T')[0];

        if (_state.lastLoginDate !== today) {
            const yesterday = new Date(now);
            yesterday.setDate(yesterday.getDate() - 1);
            const yesterdayStr = yesterday.toISOString().split('T')[0];

            if (_state.lastLoginDate === yesterdayStr) {
                _state.currentStreak++;
            } else if (_state.lastLoginDate !== today) {
                // 檢查是否有護盾
                const hasShield = _state.activePlugins.some(id => {
                    const plugin = getPluginById(id);
                    return plugin && plugin.effect.type === 'streak_shield';
                });

                if (!hasShield) {
                    _state.currentStreak = 1;
                }
            }

            _state.maxStreak = Math.max(_state.maxStreak, _state.currentStreak);
            _state.lastLoginDate = today;
        }
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // 🏆 ACHIEVEMENT SYSTEM
    // ═══════════════════════════════════════════════════════════════════════════

    function checkAchievements() {
        const newlyUnlocked = [];
        for (const achievement of ACHIEVEMENTS) {
            if (!_state.achievements.includes(achievement.id)) {
                if (achievement.condition(_state)) {
                    _state.achievements.push(achievement.id);
                    newlyUnlocked.push(achievement);
                }
            }
        }
        return newlyUnlocked;
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // 📜 EVENT LOG
    // ═══════════════════════════════════════════════════════════════════════════

    function logEvent(type, message, data = {}) {
        const event = {
            type,
            message,
            data,
            timestamp: new Date().toISOString()
        };
        _state.eventLog.unshift(event);
        if (_state.eventLog.length > 100) {
            _state.eventLog = _state.eventLog.slice(0, 100);
        }
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // 📢 EVENT SYSTEM
    // ═══════════════════════════════════════════════════════════════════════════

    const eventListeners = {};

    function addEventListener(eventName, callback) {
        if (!eventListeners[eventName]) {
            eventListeners[eventName] = [];
        }
        eventListeners[eventName].push(callback);
    }

    function removeEventListener(eventName, callback) {
        if (eventListeners[eventName]) {
            eventListeners[eventName] = eventListeners[eventName].filter(cb => cb !== callback);
        }
    }

    function dispatchEvent(eventName, data) {
        if (eventListeners[eventName]) {
            for (const callback of eventListeners[eventName]) {
                try {
                    callback(data);
                } catch (e) {
                    console.error(`[QuestEmpire] Event handler error for ${eventName}:`, e);
                }
            }
        }
        window.dispatchEvent(new CustomEvent(`questempire:${eventName}`, { detail: data }));
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // 🎨 UI COMPONENTS
    // ═══════════════════════════════════════════════════════════════════════════

    // 生成玩家狀態卡片 HTML (向後相容)
    function generateStatusCardHTML() {
        const rank = calculateLevel(_state.totalXP);
        const progress = getProgressToNextLevel(_state.totalXP);

        // i18n support
        let rankTitle = rank.title;
        let xpMsg = `還需 ${progress.xpNeeded} XP 升級`;

        if (typeof window !== 'undefined' && window.i18n && typeof window.i18n.t === 'function') {
            try {
                const tKey = `rpgRank${rank.level}`;
                const translatedTitle = window.i18n.t(tKey);
                if (translatedTitle && !translatedTitle.startsWith('[Missing')) {
                    rankTitle = translatedTitle;
                }

                const xpKey = 'rpgXpNeeded';
                const translatedMsg = window.i18n.t(xpKey);
                if (translatedMsg && !translatedMsg.startsWith('[Missing')) {
                    xpMsg = translatedMsg.replace('{xp}', progress.xpNeeded);
                }
            } catch (e) {
                // Ignore if i18n fails
            }
        }

        return `
        <div class="devscribe-status-card" style="
            background: linear-gradient(135deg, #1E293B 0%, #0F172A 100%);
            border: 1px solid #334155;
            border-radius: 12px;
            padding: 16px;
            font-family: 'Inter', sans-serif;
            color: #E2E8F0;
            box-shadow: 0 4px 20px rgba(0,0,0,0.3);
        ">
            <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 12px;">
                <span style="font-size: 32px;">${rank.icon}</span>
                <div>
                    <div style="font-size: 14px; color: #94A3B8;">Lv.${rank.level}</div>
                    <div style="font-size: 18px; font-weight: 600; color: ${rank.color};">${rankTitle}</div>
                </div>
                <div style="margin-left: auto; text-align: right;">
                    <div style="font-size: 22px; font-weight: 700; color: #FBBF24;">${_state.totalXP} XP</div>
                    <div style="font-size: 14px; color: #F59E0B;">💰 ${_state.tokens || 0}</div>
                </div>
            </div>
            <div style="background: #1F2937; border-radius: 8px; height: 8px; overflow: hidden;">
                <div style="
                    background: linear-gradient(90deg, ${rank.color}, #F59E0B);
                    height: 100%;
                    width: ${progress.progress}%;
                    border-radius: 8px;
                    transition: width 0.5s ease;
                "></div>
            </div>
            <div style="display: flex; justify-content: space-between; margin-top: 6px; font-size: 11px; color: #64748B;">
                <span>${progress.currentInLevel} / ${progress.totalInLevel} XP</span>
                <span>${xpMsg}</span>
            </div>
        </div>
        `;
    }

    // 顯示通知
    function showNotification(title, message, type = 'info', icon = '✨') {
        const colors = {
            info: '#6366F1',
            success: '#10B981',
            warning: '#F59E0B',
            error: '#EF4444'
        };

        const notification = document.createElement('div');
        notification.innerHTML = `
            <div style="
                position: fixed;
                top: 20px;
                right: 20px;
                background: linear-gradient(135deg, #1E293B 0%, #0F172A 100%);
                border: 2px solid ${colors[type]};
                border-radius: 12px;
                padding: 16px 20px;
                font-family: 'Inter', sans-serif;
                color: #E2E8F0;
                box-shadow: 0 8px 32px rgba(0,0,0,0.4);
                z-index: 99999;
                animation: slideIn 0.3s ease, fadeOut 0.5s ease 3.5s forwards;
                max-width: 350px;
            ">
                <div style="display: flex; align-items: center; gap: 10px;">
                    <span style="font-size: 28px;">${icon}</span>
                    <div>
                        <div style="font-size: 14px; font-weight: 600; color: ${colors[type]};">${title}</div>
                        <div style="font-size: 13px; color: #94A3B8;">${message}</div>
                    </div>
                </div>
            </div>
            <style>
                @keyframes slideIn {
                    from { transform: translateX(100px); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
                @keyframes fadeOut {
                    to { opacity: 0; transform: translateY(-20px); }
                }
            </style>
        `;
        document.body.appendChild(notification);
        setTimeout(() => notification.remove(), 4000);
    }

    // 顯示成就解鎖通知
    function showAchievementNotification(achievement) {
        const notification = document.createElement('div');
        notification.innerHTML = `
            <div style="
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                background: linear-gradient(135deg, #7C3AED 0%, #4C1D95 100%);
                border: 3px solid #A78BFA;
                border-radius: 16px;
                padding: 24px 32px;
                font-family: 'Inter', sans-serif;
                color: white;
                box-shadow: 0 0 60px rgba(124, 58, 237, 0.6);
                z-index: 99999;
                text-align: center;
                animation: achievementPop 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55);
            ">
                <div style="font-size: 48px; margin-bottom: 10px;">${achievement.icon}</div>
                <div style="font-size: 12px; color: #C4B5FD; text-transform: uppercase; letter-spacing: 2px;">${_t('notifyAchievementUnlocked')}</div>
                <div style="font-size: 22px; font-weight: 700; margin: 8px 0;">${_t('ach_' + achievement.id + '_name') || achievement.name}</div>
                <div style="font-size: 13px; color: #DDD6FE;">${_t('ach_' + achievement.id + '_desc') || achievement.description}</div>
            </div>
            <style>
                @keyframes achievementPop {
                    0% { transform: translate(-50%, -50%) scale(0); opacity: 0; }
                    100% { transform: translate(-50%, -50%) scale(1); opacity: 1; }
                }
            </style>
        `;
        document.body.appendChild(notification);
        setTimeout(() => {
            notification.style.transition = 'all 0.5s ease';
            notification.style.opacity = '0';
            notification.style.transform = 'translate(-50%, -50%) scale(0.8)';
            setTimeout(() => notification.remove(), 500);
        }, 3000);
    }

    /**
     * 記錄模組相關動作並給予獎勵
     * @param {string} module - 模組名稱 (如 'guild', 'arena')
     * @param {string} actionType - 動作類型
     * @returns {Object|null} 獎勵結果
     */
    function recordModuleAction(module, actionType) {
        let earnedXP = 0;
        let earnedTokens = 0;
        let actionMsg = "";

        if (module === 'guild') {
            if (actionType === 'pr_merged' || actionType === 'file_pushed') {
                earnedXP = 25;
                earnedTokens = 5;
                actionMsg = _t('rpgContrib');
            }
        } else if (module === 'arena') {
            if (actionType === 'challenge_won') {
                earnedXP = 50;
                earnedTokens = 15;
                actionMsg = _t('rpgArenaWin');
            }
        } else if (module === 'ritual') {
            if (actionType === 'ritual_complete') {
                earnedXP = 25;
                earnedTokens = 5;
                actionMsg = _t('rpgRitualComplete') || '校準儀式完成';
            }
        }

        if (earnedXP > 0) {
            const oldLevel = _state.level;
            _state.totalXP += earnedXP;
            _state.tokens += (earnedTokens || 0);

            // 更新等級
            const newRank = calculateLevel(_state.totalXP);
            _state.level = newRank.level;

            const leveledUp = newRank.level > oldLevel;
            const newAchievements = checkAchievements();

            saveState(_state);

            const result = {
                earnedXP,
                earnedTokens,
                title: actionMsg,
                leveledUp,
                newRank: leveledUp ? newRank : null,
                newAchievements
            };

            if (leveledUp) {
                dispatchEvent('levelUp', { oldLevel, newLevel: newRank.level, rank: newRank });
            }

            // 通知卡片更新 (如果卡片在頁面上)
            dispatchEvent('action', result);

            return result;
        }

        return null;
    }

    /**
     * 顯示 XP 獲得通知
     * @param {Object} result - recordModuleAction 的結果
     */
    function showXPNotification(result) {
        if (!result) return;

        let msg = _t('notifyEarnedXP', { xp: result.earnedXP });
        if (result.earnedTokens) msg += ` & ${result.earnedTokens} 💰`;

        showNotification(result.title || _t('rpgGainXP'), msg, 'success', '✨');

        if (result.leveledUp) {
            setTimeout(() => {
                const rankTitle = _t('rpgRank' + result.newRank.level) || result.newRank.title;
                showNotification(_t('notifyLevelUpTitle'), _t('notifyLevelUpMsg', { level: result.newRank.level, title: rankTitle }), 'success', '🎊');
            }, 1000);
        }

        if (result.newAchievements && result.newAchievements.length > 0) {
            result.newAchievements.forEach((ach, i) => {
                setTimeout(() => showAchievementNotification(ach), (i + 1) * 2000);
            });
        }
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // 📊 API
    // ═══════════════════════════════════════════════════════════════════════════

    return {
        // State
        getState: () => ({ ..._state }),
        resetState: () => {
            _state = { ...DEFAULT_STATE };
            saveState(_state);
            localStorage.removeItem('quest_empire_community_plugins');
            localStorage.removeItem('quest_empire_community_tools');
            dispatchEvent('reset', {});
        },
        setPlayerName: (name) => {
            _state.playerName = name;
            saveState(_state);
        },
        setRitualCompleted: (completed) => {
            _state.ritualCompleted = completed;
            saveState(_state);
        },

        // Core Mechanics
        calculateLevel,
        getProgressToNextLevel,
        getXPMultiplier,
        getTokenMultiplier,

        // Challenge System
        createChallenge,
        completeChallenge,
        abandonChallenge,
        getChallenges,

        // Reflection System
        writeReflection,
        getReflections,

        // Plugin System
        getAllPlugins,
        getPluginById,
        unlockPlugin,
        activatePlugin,
        deactivatePlugin,
        createPlugin,

        // HTML Tools System
        getAllTools,
        getToolById,
        getToolsByCategory,
        getOwnedTools,
        unlockTool,
        useTool,
        uploadTool,
        getToolCategories,
        getToolUsageHistory,

        // Data
        RANKS,
        CHALLENGE_TYPES,
        CHALLENGE_DIFFICULTIES,
        PLUGIN_TIERS,
        TOOL_CATEGORIES,
        ACHIEVEMENTS,

        // Events
        addEventListener,
        removeEventListener,

        // UI
        generateStatusCardHTML,
        showNotification,
        showAchievementNotification,
        showXPNotification,

        // Mechanics
        recordModuleAction,

        // Version
        VERSION
    };
})();

// 監聽新成就
DevScribeRPG.addEventListener('challengeCompleted', (result) => {
    if (result.newAchievements && result.newAchievements.length > 0) {
        result.newAchievements.forEach((ach, i) => {
            setTimeout(() => DevScribeRPG.showAchievementNotification(ach), i * 3500);
        });
    }
});

DevScribeRPG.addEventListener('reflectionWritten', (result) => {
    if (result.newAchievements && result.newAchievements.length > 0) {
        result.newAchievements.forEach((ach, i) => {
            setTimeout(() => DevScribeRPG.showAchievementNotification(ach), i * 3500);
        });
    }
});

DevScribeRPG.addEventListener('pluginUnlocked', (result) => {
    if (result.newAchievements && result.newAchievements.length > 0) {
        result.newAchievements.forEach((ach, i) => {
            setTimeout(() => DevScribeRPG.showAchievementNotification(ach), i * 3500);
        });
    }
});

// 全域輸出
window.DevScribeRPG = DevScribeRPG;

console.log('%c🎮 Quest Empire v' + DevScribeRPG.VERSION + ' 已載入！',
    'background: linear-gradient(90deg, #6366F1, #8B5CF6); color: white; padding: 8px 16px; border-radius: 4px; font-weight: bold;');