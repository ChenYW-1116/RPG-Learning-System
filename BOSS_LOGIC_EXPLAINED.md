# 🐉 Boss 判斷邏輯說明

## 📋 概述

在 IELTS Challenger Arena 中，**Boss** 代表你的**最大弱點**。系統會自動分析你的歷史作文表現，識別出最需要改進的 3 個指標作為 Boss。

---

## 🔍 Boss 計算邏輯

### 1. 計算平均分數
```javascript
// 位置: ielts_challenger_arena.html, 第 552-575 行
function calculateBosses(essays) {
    // 計算每個指標的平均分數
    const avgScores = {};
    Object.keys(METRICS).forEach(metric => {
        const values = essays.map(e => e.scores[metric]).filter(v => v !== undefined);
        avgScores[metric] = values.reduce((a, b) => a + b, 0) / values.length;
    });
    
    // ...
}
```

**說明：**
- 遍歷所有歷史作文
- 對每個指標（如 `ta_overview_clarity`, `lr_process_verbs` 等）計算平均分數
- 分數範圍：0.0 - 1.0（1.0 = 完美）

### 2. 計算 Boss HP（弱點程度）
```javascript
const bosses = Object.keys(METRICS)
    .map(metric => ({
        id: metric,
        name: METRICS[metric],
        hp: Math.round((1 - avgScores[metric]) * 100),  // ← 核心公式
        avgScore: avgScores[metric],
        defeated: gameState.bossDefeated[metric] || false
    }))
    .sort((a, b) => b.hp - a.hp)  // 按 HP 降序排列
    .slice(0, 3);  // 取前 3 名
```

**核心公式：**
```
Boss HP = (1 - 平均分數) × 100
```

**範例：**
| 指標 | 平均分數 | Boss HP | 解釋 |
|------|----------|---------|------|
| `lr_paraphrasing` | 0.3 | **70%** | 分數很低 → HP 很高 → 大 Boss |
| `ta_overview_clarity` | 0.7 | **30%** | 分數中等 → HP 中等 → 中 Boss |
| `gra_error_free_density` | 0.95 | **5%** | 分數很高 → HP 很低 → 小 Boss |

### 3. 排序與選擇
```javascript
.sort((a, b) => b.hp - a.hp)  // HP 從高到低排序
.slice(0, 3);                 // 取前 3 個最弱的指標
```

**結果：**
- 🐉 **Boss #1** - HP 最高（最弱的指標）
- 👹 **Boss #2** - HP 次高
- 🦹 **Boss #3** - HP 第三高

---

## ⚔️ 戰鬥結果判斷邏輯

### 前端模式（`ielts_challenger_arena.html`）

```javascript
// 位置: 第 693-724 行
function calculateBattleResult(newEssay) {
    const prevEssays = gameState.essays.slice(0, -1);
    
    // 首次提交
    if (prevEssays.length === 0) {
        return { 
            victory: true, 
            improvements: ['首次提交！'], 
            regressions: [], 
            isFirstBattle: true 
        };
    }
    
    // 計算歷史平均
    const prevAvg = {};
    Object.keys(METRICS).forEach(metric => {
        const values = prevEssays.map(e => e.scores[metric]).filter(v => v !== undefined);
        prevAvg[metric] = values.reduce((a, b) => a + b, 0) / values.length;
    });
    
    // 比較新作文與歷史平均
    const improvements = [];
    const regressions = [];
    
    Object.keys(METRICS).forEach(metric => {
        const diff = (newEssay.scores[metric] || 0) - prevAvg[metric];
        
        if (diff >= 0.05) {  // 進步閾值：5%
            improvements.push({ metric: METRICS[metric], diff: diff });
            
            // Boss 擊敗條件：進步 >= 10%
            if (diff >= 0.1) {
                gameState.bossDefeated[metric] = true;
            }
        } else if (diff <= -0.05) {  // 退步閾值：-5%
            regressions.push({ metric: METRICS[metric], diff: diff });
        }
    });
    
    // 勝利條件
    const victory = improvements.length >= regressions.length && improvements.length > 0;
    
    return { victory, improvements, regressions, isFirstBattle: false };
}
```

### 後端模式（`arena_api.py`）

```python
# 位置: arena_api.py, 第 256-299 行
def calculate_battle_result(df, new_scores, rca_results):
    """計算戰鬥結果（勝/敗）"""
    if len(df) <= 1:
        return {
            "victory": True,
            "is_first_battle": True,
            "improvements": ["首次提交！"],
            "regressions": []
        }
    
    # 計算之前的平均值
    prev_df = df.iloc[:-1]
    improvements = []
    regressions = []
    
    for metric in analyzer.TASK1_METRICS.keys():
        if metric not in new_scores or metric not in prev_df.columns:
            continue
            
        prev_avg = prev_df[metric].mean()
        new_val = new_scores[metric]
        diff = new_val - prev_avg
        
        if diff >= 0.05:  # 進步閾值：5%
            improvements.append({
                "metric": analyzer.TASK1_METRICS[metric],
                "diff": round(diff * 100, 1)
            })
        elif diff <= -0.05:  # 退步閾值：-5%
            regressions.append({
                "metric": analyzer.TASK1_METRICS[metric],
                "diff": round(diff * 100, 1)
            })
    
    # 勝利條件
    victory = len(improvements) >= len(regressions) and len(improvements) > 0
    
    return {
        "victory": victory,
        "is_first_battle": False,
        "improvements": improvements,
        "regressions": regressions,
        "improvement_count": len(improvements),
        "regression_count": len(regressions)
    }
```

---

## 📊 判斷標準總結

### Boss 識別標準
| 條件 | 說明 |
|------|------|
| **計算基礎** | 所有歷史作文的平均分數 |
| **Boss HP** | `(1 - 平均分數) × 100` |
| **Boss 數量** | 前 3 個 HP 最高的指標 |
| **更新時機** | 每次提交新作文後重新計算 |

### 戰鬥勝利標準
| 條件 | 說明 |
|------|------|
| **首次提交** | 自動勝利 ✅ |
| **進步閾值** | 任一指標比歷史平均高 ≥ 5% |
| **退步閾值** | 任一指標比歷史平均低 ≥ 5% |
| **勝利條件** | `進步項目數 ≥ 退步項目數` **且** `進步項目數 > 0` |

### Boss 擊敗標準
| 條件 | 說明 |
|------|------|
| **擊敗閾值** | 該指標進步 ≥ 10% |
| **視覺效果** | Boss 卡片變灰，顯示 💀 |
| **持久化** | 保存在 `gameState.bossDefeated[metric]` |

---

## 💡 實際範例

### 範例 1: 首次提交
```
歷史作文數：0
新作文分數：
  - lr_paraphrasing: 0.6
  - ta_overview_clarity: 0.8
  - ...

結果：
  ✅ 勝利（首次提交自動勝利）
  Boss 列表：尚未生成（需要至少 1 篇作文）
```

### 範例 2: 第二次提交
```
歷史平均：
  - lr_paraphrasing: 0.6
  - ta_overview_clarity: 0.8
  - gra_passive_voice: 0.5

新作文分數：
  - lr_paraphrasing: 0.7 (+0.1 = +10%) → ✅ 進步！Boss 擊敗！
  - ta_overview_clarity: 0.75 (-0.05 = -5%) → ❌ 退步
  - gra_passive_voice: 0.6 (+0.1 = +10%) → ✅ 進步！Boss 擊敗！

進步項目：2
退步項目：1

結果：
  ✅ 勝利（2 ≥ 1 且 2 > 0）
  
Boss 更新：
  🐉 gra_passive_voice (HP: 40%) ← 新的最大弱點
  👹 lr_paraphrasing (HP: 35%) ← 已擊敗 💀
  🦹 ta_overview_clarity (HP: 22.5%)
```

### 範例 3: 失敗案例
```
歷史平均：
  - lr_paraphrasing: 0.7
  - ta_overview_clarity: 0.8

新作文分數：
  - lr_paraphrasing: 0.6 (-0.1 = -10%) → ❌ 退步
  - ta_overview_clarity: 0.75 (-0.05 = -5%) → ❌ 退步

進步項目：0
退步項目：2

結果：
  ❌ 失敗（0 < 2 或 0 = 0）
```

---

## 🎯 關鍵參數

| 參數 | 值 | 說明 |
|------|-----|------|
| **進步閾值** | `≥ 0.05` (5%) | 低於此值視為持平 |
| **退步閾值** | `≤ -0.05` (-5%) | 高於此值視為持平 |
| **Boss 擊敗閾值** | `≥ 0.1` (10%) | 單次進步超過 10% |
| **Boss 數量** | `3` | 顯示前 3 個最弱指標 |
| **分數範圍** | `0.0 - 1.0` | AI 評分範圍 |

---

## 🔧 調整建議

### 如果想讓 Boss 更難擊敗
```javascript
// 提高擊敗閾值
if (diff >= 0.15) {  // 從 0.1 改為 0.15 (15%)
    gameState.bossDefeated[metric] = true;
}
```

### 如果想讓勝利更容易
```javascript
// 降低進步閾值
if (diff >= 0.03) {  // 從 0.05 改為 0.03 (3%)
    improvements.push({ metric: METRICS[metric], diff: diff });
}
```

### 如果想顯示更多 Boss
```javascript
.slice(0, 5);  // 從 3 改為 5
```

---

## 📝 總結

**Boss 判斷邏輯核心：**
1. **Boss = 你的最弱指標**（平均分數最低的前 3 個）
2. **Boss HP = 弱點程度**（`(1 - 平均分數) × 100`）
3. **勝利 = 進步多於退步**（`進步數 ≥ 退步數` 且 `進步數 > 0`）
4. **擊敗 Boss = 單次進步 ≥ 10%**

這個系統鼓勵學生：
- 🎯 **專注弱點** - Boss 自動識別最需要改進的地方
- 📈 **持續進步** - 每次提交都與歷史平均比較
- 🏆 **成就感** - 擊敗 Boss 獲得視覺反饋和 XP 獎勵

---

**文檔版本：** v1.0  
**更新日期：** 2026-01-26  
**相關檔案：**
- `ielts_challenger_arena.html` (前端邏輯)
- `arena_api.py` (後端邏輯)
