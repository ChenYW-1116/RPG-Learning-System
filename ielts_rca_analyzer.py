import pandas as pd
print("🔥 NEW VERSION LOADED - With natural agency fix!")
import numpy as np
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import seaborn as sns
import json
import time
import requests
import os
from sklearn.ensemble import RandomForestRegressor
from sklearn.preprocessing import RobustScaler
import io
import sys
import re
import argparse

# 設定編碼以支援中文顯示
try:
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
except Exception:
    pass

# --- 核心配置 ---
# LOAD ENV VARS
try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass # python-dotenv not installed, rely on system env vars

# GITCODE (KIMI) CONFIG
KIMI_API_KEY = "bvGprYx1-5Jai4qCuKTydCQs"
KIMI_API_URL = "https://api-ai.gitcode.com/v1/chat/completions"
KIMI_MODEL_NAME = "moonshotai/Kimi-K2-Instruct-0905"

# GEMINI CONFIG
gemini_api_key = os.environ.get("GEMINI_API_KEY") 
GEMINI_MODEL_NAME ="gemini-3-flash-preview" # "gemini-2.5-flash-preview-09-2025"

# Try to import google.generativeai, handle if missing
try:
    import google.generativeai as genai
    HAS_GEMINI_LIB = True
except ImportError:
    HAS_GEMINI_LIB = False

# DEFAULT PROVIDER
DEFAULT_PROVIDER = 'kimi' # 'kimi' or 'gemini'
CURRENT_PROVIDER = DEFAULT_PROVIDER  # 全局變數，可被外部模組修改
ESSAY_FOLDER = "essays_to_analyze" # 使用者存放文章的資料夾
CACHE_FILE = "ai_scores_cache.json"

# --- IELTS Writing Task 1 Evaluation Metrics ---
# --- IELTS Writing Task 1 Process Evaluation Metrics ---
TASK1_METRICS = {
    # Task Achievement (TA) - How well you cover requirements
    'ta_overview_clarity': 'TA: Overview Clarity',         # Is the summary clear and highlights key trends/stages?
    'ta_step_coverage': 'TA: Key Step Coverage',          # Are all major stages/steps included?
    'ta_logic_accuracy': 'TA: Logic Accuracy',           # Is the diagram logic/interpretation correct?

    # Coherence & Cohesion (CC) - Logic & Linking
    'cc_sequencing_markers': 'CC: Sequencing Markers',     # e.g., First, Then, Subsequently
    'cc_referencing': 'CC: Referencing',                  # e.g., This stage, It, Which (avoiding repetition)
    'cc_paragraphing': 'CC: Logical Paragraphing',         # Is grouping logical (e.g., input vs output, or split by stage)?

    # Lexical Resource (LR) - Vocabulary
    'lr_process_verbs': 'LR: Process Verbs',              # Variety of verbs (heated, extracted, distributed)
    'lr_topic_nouns': 'LR: Topic Vocabulary',             # Correct technical nouns (furnace, turbine, pipe)
    'lr_paraphrasing': 'LR: Paraphrasing Power',          # avoiding copying prompt words directly
    'lr_conciseness': 'LR: Precision & Conciseness',      # Precision and Refinement (avoiding wordiness)

    # Grammatical Range & Accuracy (GRA) - Grammar
    'gra_passive_voice': 'GRA: Passive Voice Control',     # Appropriate use for process (Object-focused)
    'gra_complex_structures': 'GRA: Sentence Variety',     # Relative clauses, time clauses (Once X is done, Y follows)
    'gra_error_free_density': 'GRA: Error-Free Sentences', # Proportion of perfectly correct sentences
}

def _query_gemini_api(messages):
    """
    Helper to query Google Gemini API
    """
    if not HAS_GEMINI_LIB:
        print("[Error] google-generativeai library not installed. Pip install google-generativeai")
        return None
    
    if not gemini_api_key:
        print("[Error] GEMINI_API_KEY not found in environment variables.")
        return None

    try:
        genai.configure(api_key=gemini_api_key)
        
        # Convert standard "messages" format to Gemini format
        # System prompt is usually passed partly in configuration or as first message
        system_instruction = None
        prompt_parts = []
        
        for msg in messages:
            if msg['role'] == 'system':
                system_instruction = msg['content']
            elif msg['role'] == 'user':
                prompt_parts.append(msg['content'])
        
        # Simple concat for single-turn logic used here
        full_prompt = "\n\n".join(prompt_parts)
        
        model = genai.GenerativeModel(GEMINI_MODEL_NAME, system_instruction=system_instruction)
        
        response = model.generate_content(full_prompt)
        return response.text
        
    except Exception as e:
        print(f"  [Error] Gemini API Request Failed: {str(e)}")
        return None

def _query_kimi_api(messages):
    """
    Internal helper to query Kimi API with streaming support
    """
    headers = {
        "Authorization": f"Bearer {KIMI_API_KEY}",
        "Content-Type": "application/json"
    }
    payload = {
        "model": KIMI_MODEL_NAME,
        "messages": messages,
        "stream": True,
        "max_tokens": 4096,
        "temperature": 0.6,
        "top_p": 0.95,
        "top_k": 50,
        "frequency_penalty": 0,
        "thinking_budget": 32768
    }
    
    try:
        response = requests.post(KIMI_API_URL, headers=headers, json=payload, stream=True, timeout=120)
        full_content = ""
        
        for line in response.iter_lines():
            if not line.startswith(b"data:"):
                continue
            if line.strip() == b"data:[DONE]":
                break
            try:
                decoded_line = line.decode("utf-8").lstrip("data:").strip()
                if not decoded_line: 
                    continue
                
                chunk = json.loads(decoded_line)
                if "choices" in chunk and len(chunk["choices"]) > 0:
                    delta = chunk["choices"][0].get("delta", {})
                    content = delta.get("content", "")
                    if content:
                        print(content, end="", flush=True)
                        full_content += content
            except json.JSONDecodeError:
                continue
                
        print()
        return full_content
    except Exception as e:
        print(f"  [Error] API Request Failed: {str(e)}")
        return None

def _query_llm(messages, provider='kimi'):
    if provider == 'gemini':
        print("(Using Gemini)...", end="", flush=True)
        return _query_gemini_api(messages)
    else:
        print("(Using Kimi)...", end="", flush=True)
        return _query_kimi_api(messages)

def get_ai_scores(essay_text):
    """
    調用 AI (Gemini/Kimi) 將作文轉換為量化數值指標 (針對 IELTS Task 1)
    """
    system_prompt = """
    You are an expert IELTS Writing Examiner specializing in **Task 1 Process Diagrams**.
    Evaluate the essay based on **Process-specific criteria** and return ONLY a JSON object.
    
    Required metrics (0.0 to 1.0 scale, where 0.9 is Band 9 equivalent):
    
    [Task Achievement]
    - ta_overview_clarity: Is there a clear overview summarizing the main nature of the process?
    - ta_step_coverage: Are ALL key steps/stages included without missing critical info?
    - ta_logic_accuracy: Is the logic/information accurate (e.g., correct input/output, no misinterpretation of the arrows/cycle)?

    [Coherence & Cohesion]
    - cc_sequencing_markers: Effective use of time sequencers (First, Next, Then, Finally, Subsequently).
    - cc_referencing: Use of pronouns/referencing to link ideas (e.g., "This resulting mixture," "It is then...").
    - cc_paragraphing: Logic of paragraphing (Introduction, Overview, Body Paragraphs split logically).

    [Lexical Resource]
    - lr_process_verbs: Precision and variety of verbs used for actions (e.g., ground, filtered, transported).
    - lr_topic_nouns: Accuracy of nouns describing equipment/substances in the diagram.
    - lr_paraphrasing: Ability to rephrase prompt words (not copying "The diagram shows...").
    - lr_conciseness: Precision and Conciseness. Does the student use precise words instead of wordy phrases? (Refinement).

    [Grammar]
    - gra_passive_voice: Effective use of Passive Voice for object-focused steps. CRITICAL: Do NOT penalize Active Voice if the subject has natural or biological agency (e.g., "The sun heats...", "Rain falls...", "The machine crushes..."). Active voice in these natural contexts is correct and should be rewarded for appropriateness. Focus on logical appropriateness.
    - gra_complex_structures: Use of complex syntax (e.g., "After being heated, the water...", "Which is then...").
    - gra_error_free_density: Frequency of error-free sentences.

    [Overall]
    - overall_band: Overall band score (0.0 to 9.0)
    
    Format: {"ta_overview_clarity": 0.8, "ta_step_coverage": 0.9, ... , "overall_band": 6.5}
    IMPORTANT: Return ONLY the raw JSON string. Do not use Markdown code blocks (```json ... ```).
    IMPORTANT: Evaluate based ONLY on the criteria above. Do NOT penalize for short word count. Ignore word limit requirements.
    """
    
    messages = [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": f"Evaluate this IELTS Task 1 essay:\n\n{essay_text}"}
    ]

    for delay in [1, 2, 4]:
        content = _query_llm(messages, provider=CURRENT_PROVIDER)
        if content:
            # Clean up potential markdown blocks and <think> tags
            clean_content = re.sub(r'<think>.*?</think>', '', content, flags=re.DOTALL)
            clean_content = clean_content.replace('```json', '').replace('```', '').strip()
            try:
                return json.loads(clean_content)
            except json.JSONDecodeError:
                print(f"  [Debug] JSON Parsing Failed. Retrying... content snippet: {clean_content[:50]}...")
        
        time.sleep(delay)
            
    return None

def get_ai_recommendations(rca_df, df):
    """
    調用 AI (Gemini/Kimi) 生成學習建議報告
    """
    # 準備分析資料
    avg_scores = df.drop(columns=['file_name', 'overall_band'], errors='ignore').mean().to_dict()
    
    if rca_df is not None:
        top_drivers = rca_df.head(3).to_dict('records')
    else:
        top_drivers = []
    
    prompt = f"""
    Based on an IELTS Task 1 writing analysis, provide a concise improvement report in BOTH Traditional Chinese and English.
    
    Average Scores (0-1 scale):
    {json.dumps(avg_scores, indent=2)}
    
    Top Score Drivers (most impactful on overall band):
    {json.dumps(top_drivers, indent=2)}
    
    Overall Band Score Trend: {df['overall_band'].tolist()}
    
    ---
    STEP 1: Write the TRADITIONAL CHINESE version using these headers:
    【診斷摘要】
    【關鍵瓶頸分析】
    【具體改進建議】
    【下一步行動計劃】

    STEP 2: Output exactly this delimiter: ===ENGLISH_VERSION_START===

    STEP 3: Write the ENGLISH version using these headers:
    [Diagnostic Summary]
    [Key Bottleneck Analysis]
    [Actionable Advice]
    [Next Steps]
    ---

    Keep both versions practical, technical, and focused on Task 1 skills.
    """
    
    messages = [
        {"role": "user", "content": prompt}
    ]
    
    content = _query_llm(messages, provider=CURRENT_PROVIDER)
    if content:
        # Return the raw combined content; frontend will split it
        return content
    
    return "[無法生成建議] API 請求失敗 / Failed to generate recommendations"

def analyze_latest_progress(rca_df, df):
    """
    分析最新的一篇文章，並針對 RCA 識別出的瓶頸進行「驗收」
    """
    if rca_df is None or len(df) < 2:
        return

    # 假設最後一筆是最新文章 (因為在讀取時有按數字排序)
    latest_essay = df.iloc[-1]
    previous_essays = df.iloc[:-1]
    
    file_name = latest_essay['file_name']
    
    print(f"\n--- 最新文章驗收 ({file_name}) ---")
    print(f"這篇文章是否解決了您的主要問題？\n")
    
    # 取出前三大瓶頸
    top_issues = rca_df.head(3)
    
    for _, row in top_issues.iterrows():
        metric = row['Metric']
        metric_name = row['Metric_Name']
        
        current_score = latest_essay[metric]
        prev_avg = previous_essays[metric].mean()
        
        diff = current_score - prev_avg
        
        # 判斷改善程度
        if diff >= 0.1:
            status = "✅ 顯著改善 (Excellent!)"
        elif diff >= 0.05:
            status = "↗️ 小幅進步 (Improving)"
        elif diff > -0.05:
            status = "➖ 持平 (Stable)"
        else:
            status = "⚠️ 退步/未解決 (Regression)"
            
        print(f"🔥 關鍵指標: {metric_name}")
        print(f"   本次表現: {current_score:.2f} (歷史平均: {prev_avg:.2f}) -> {status}")
        print("-" * 40)

def generate_detailed_rca_report(rca_df, df, essays_list):
    """
    針對 Random Forest 找出的前三大問題，生成詳細的「舉例說明」報告
    """
    if rca_df is None or len(rca_df) == 0:
        return

    top_drivers = rca_df.head(3)['Metric'].tolist()
    top_driver_names = rca_df.head(3)['Metric_Name'].tolist()

    report_content = "# IELTS Task 1 Detailed RCA Report\n\n"
    report_content += "這份報告針對影響您分數最大的前三項因素，提取您實際寫過的低分文章作為案例進行深入分析。\n\n"

    for metric, metric_name in zip(top_drivers, top_driver_names):
        print(f"  > [Deep Dive] 正在深入分析關鍵因子: {metric_name}...")
        
        # 1. 找出該指標分數最低的 5 篇文章 (User request: at least 5 refs)
        low_score_files = df.sort_values(by=metric).head(5)['file_name'].tolist()
        
        evidence_texts = []
        for essay in essays_list:
            if essay['file_name'] in low_score_files:
                # 只擷取文章標題和內容，為了節省 token，可以考慮只截取部分，但 Task 1 文章短，全放通常 OK
                score_val = df[df['file_name'] == essay['file_name']][metric].values[0]
                evidence_texts.append(f"--- Essay: {essay['file_name']} (Score: {score_val}) ---\n{essay['content']}")

        combined_evidence = "\n\n".join(evidence_texts)

        # 2. 建構 AI Prompt
        prompt = f"""
        You are an IELTS Writing Expert.
        
        The student's biggest weakness identified by RCA is: **{metric_name}** ({TASK1_METRICS.get(metric, metric)}).
        
        Here are 5 essay examples from the student where this score was lowest:
        
        {combined_evidence}
        
        Please generate a specific analysis section for this weakness in Traditional Chinese:
        1. **Definition**: Briefly explain what "{metric_name}" requires in IELTS Task 1.
        2. **Problem Analysis with Quotes**: Quote specific sentences from the provided essays that demonstrate this weakness. Explain WHY they are problematic. (e.g., "In file X, the student wrote '...', which implies...")
        3. **Correction & Advice**: specific actionable advice. Show how to rewrite 1-2 of the bad examples.
        
        Format as Markdown.
        """

        messages = [{"role": "user", "content": prompt}]
        analysis = _query_llm(messages, provider=CURRENT_PROVIDER)
        
        if analysis:
             # Remove <think> tags again just in case
            analysis = re.sub(r'<think>.*?</think>', '', analysis, flags=re.DOTALL).strip()
            report_content += f"## Critical Factor: {metric_name}\n\n{analysis}\n\n---\n\n"
        else:
            report_content += f"## Critical Factor: {metric_name}\n\n(AI Analysis Failed)\n\n---\n\n"
        
        time.sleep(2)

    # Save Report
    with open('ielts_detailed_rca_report.md', 'w', encoding='utf-8') as f:
        f.write(report_content)
    
    print("\n[系統] 詳細 RCA 報告已生成: ielts_detailed_rca_report.md")

def get_content_hash(text):
    """
    Generate a unique MD5 hash from content for unified cache lookup.
    Uses the same normalization as arena_api.py for consistency.
    """
    import hashlib
    normalized = text.strip().lower()
    return hashlib.md5(normalized.encode('utf-8')).hexdigest()

def load_cache():
    if os.path.exists(CACHE_FILE):
        try:
            with open(CACHE_FILE, 'r', encoding='utf-8') as f:
                return json.load(f)
        except json.JSONDecodeError:
            print("[Warning] Cache file corrupted, starting fresh.")
    return {}

def save_cache(cache_data):
    with open(CACHE_FILE, 'w', encoding='utf-8') as f:
        json.dump(cache_data, f, ensure_ascii=False, indent=2)

def find_in_cache(cache, filename, content):
    """
    Unified cache lookup supporting both hash-based (from API) and filename-based (from CLI) lookups.
    
    Strategy:
    1. First try hash-based lookup (most reliable, content-based)
    2. Fallback to filename-based lookup (for backward compatibility)
    
    Returns: (cache_entry, cache_key) if found, else (None, None)
    """
    # Strategy 1: Hash-based lookup (preferred, used by API)
    content_hash = get_content_hash(content)
    if content_hash in cache:
        return cache[content_hash], content_hash
    
    # Strategy 2: Filename-based lookup (fallback, for CLI compatibility)
    if filename in cache:
        return cache[filename], filename
    
    return None, None


def load_user_essays(folder_path):
    """
    從資料夾讀取使用者的文章檔案 (.txt)
    """
    essays = []
    if not os.path.exists(folder_path):
        os.makedirs(folder_path)
        print(f"[提示] 已為您建立資料夾 '{folder_path}'，請將您的文章以 .txt 格式放入其中。")
        return essays

    files = [f for f in os.listdir(folder_path) if f.endswith('.txt')]
    # Sort files by the numeric value in the filename
    files.sort(key=lambda f: int(re.search(r'\d+', f).group()) if re.search(r'\d+', f) else 9999)
    for file_name in files:
        with open(os.path.join(folder_path, file_name), 'r', encoding='utf-8') as f:
            essays.append({
                "file_name": file_name,
                "content": f.read()
            })
    return essays

def perform_ml_analysis(df):
    """
    使用隨機森林分析 AI 生成的數值
    """
    features = list(TASK1_METRICS.keys())
    
    # 確保所有特徵都存在
    available_features = [f for f in features if f in df.columns]
    
    if len(available_features) < 3:
        return None
    
    X = df[available_features]
    y = df['overall_band']

    # 隨機森林需要至少 2 個樣本才能運行，理想建議 5 個以上
    if len(df) < 2:
        return None

    scaler = RobustScaler()
    X_scaled = scaler.fit_transform(X)

    model = RandomForestRegressor(n_estimators=100, random_state=42)
    model.fit(X_scaled, y)

    # 計算每個指標的平均分數 (代表 User 現況)
    avg_scores = df[available_features].mean()

    # 計算 Bottleneck Index = Importance * (1 - Score)
    # 邏輯: 越重要且分數越低，越是瓶頸
    
    rca_data = []
    importances = model.feature_importances_
    
    for i, feature in enumerate(available_features):
        imp = importances[i]
        score = avg_scores[feature]
        bottleneck_idx = imp * (1.0 - score)
        
        rca_data.append({
            'Metric': feature,
            'Metric_Name': TASK1_METRICS.get(feature, feature),
            'Impact_Weight': imp,
            'Avg_Score': score,
            'Bottleneck_Index': bottleneck_idx
        })

    rca_df = pd.DataFrame(rca_data).sort_values(by='Bottleneck_Index', ascending=False)

    return rca_df

def plot_results(rca_df, df, recommendations, rca_prev_df=None):
    """
    繪製分析圖表並包含摘要報告
    """
    fig = plt.figure(figsize=(16, 12))
    
    # 設定字體以支援中文 (如果可用)
    plt.rcParams['font.sans-serif'] = ['Microsoft JhengHei', 'SimHei', 'DejaVu Sans', 'Arial', 'sans-serif']
    plt.rcParams['axes.unicode_minus'] = False

    # 子圖 1: 瓶頸分析 (如果資料量足夠進行 ML)
    # 子圖 1: 瓶頸分析 (如果資料量足夠進行 ML)
    ax1 = fig.add_subplot(2, 2, 1)
    if rca_df is not None:
        colors = plt.cm.magma(np.linspace(0.8, 0.2, len(rca_df)))
        bars = ax1.barh(rca_df['Metric_Name'], rca_df['Bottleneck_Index'], color=colors, label='Current')
        
        # New: Plot previous state marker if available
        if rca_prev_df is not None:
            # Map metric names to previous indices
            prev_map = dict(zip(rca_prev_df['Metric_Name'], rca_prev_df['Bottleneck_Index']))
            
            y_indices = range(len(rca_df))
            prev_values = [prev_map.get(m, 0) for m in rca_df['Metric_Name']]
            
            ax1.plot(prev_values, y_indices, 'ko', markersize=8, markerfacecolor='white', markeredgewidth=2, label='Pre-Essay Avg')
            
            # Draw arrows if change is significant
            for y, val, prev_val in zip(y_indices, rca_df['Bottleneck_Index'], prev_values):
                if prev_val > 0: # Always check if we have a previous value
                    # Lower threshold to 0.005 to see smaller changes
                    if abs(val - prev_val) > 0.005: 
                        # Green if bottleneck reduced (val < prev_val), Red if increased
                        color = 'green' if val < prev_val else '#D32F2F' 
                        ax1.annotate('', xy=(val, y), xytext=(prev_val, y),
                                     arrowprops=dict(arrowstyle='-|>', color=color, lw=2))

        ax1.set_xlabel('Bottleneck Index (Importance × Unmet Potential)')
        ax1.set_title('Top Improvement Priorities (Current vs Prev)', fontsize=12, fontweight='bold')
        ax1.invert_yaxis()
        ax1.legend(loc='lower right')
    else:
        ax1.text(0.5, 0.5, 'Need at least 2 essays for ML analysis', ha='center', va='center', transform=ax1.transAxes)
        ax1.set_title('RCA Analysis', fontsize=12)

    # 子圖 2: 分數趨勢
    ax2 = fig.add_subplot(2, 2, 2)
    essay_nums = range(1, len(df) + 1)
    ax2.plot(essay_nums, df['overall_band'], marker='o', linestyle='-', color='#2E86AB', linewidth=2, markersize=8)
    ax2.fill_between(essay_nums, df['overall_band'], alpha=0.3, color='#2E86AB')
    ax2.set_title('Your Progress Trend', fontsize=12, fontweight='bold')
    ax2.set_xlabel('Essay Count')
    ax2.set_ylabel('Overall Band Score')
    ax2.set_ylim(0, 9)
    ax2.grid(True, alpha=0.3)
    
    # 標記最高和最低分
    if len(df) > 1:
        max_idx = df['overall_band'].idxmax()
        min_idx = df['overall_band'].idxmin()
        ax2.annotate(f"Best: {df.loc[max_idx, 'overall_band']}", 
                     xy=(list(df.index).index(max_idx)+1, df.loc[max_idx, 'overall_band']),
                     xytext=(5, 10), textcoords='offset points', fontsize=9, color='green')

    # 子圖 3: 雷達圖 - 各項指標平均分
    ax3 = fig.add_subplot(2, 2, 3, polar=True)
    
    # 使用 Task 1 的四大類別
    categories = ['Task Achievement', 'Coherence & Cohesion', 'Lexical Resource', 'Grammar']
    ta_cols = [c for c in df.columns if c.startswith('ta_')]
    cc_cols = [c for c in df.columns if c.startswith('cc_')]
    lr_cols = [c for c in df.columns if c.startswith('lr_')]
    gra_cols = [c for c in df.columns if c.startswith('gra_')]
    
    values = [
        df[ta_cols].mean().mean() if ta_cols else 0,
        df[cc_cols].mean().mean() if cc_cols else 0,
        df[lr_cols].mean().mean() if lr_cols else 0,
        df[gra_cols].mean().mean() if gra_cols else 0,
    ]
    values += values[:1]  # 閉合雷達圖
    
    angles = np.linspace(0, 2 * np.pi, len(categories), endpoint=False).tolist()
    angles += angles[:1]
    
    ax3.fill(angles, values, color='#A23B72', alpha=0.25)
    ax3.plot(angles, values, color='#A23B72', linewidth=2)
    ax3.set_xticks(angles[:-1])
    ax3.set_xticklabels(categories, fontsize=9)
    ax3.set_ylim(0, 1)
    ax3.set_title('Skill Balance Overview', fontsize=12, fontweight='bold', pad=20)

    # 子圖 4: AI 建議報告
    ax4 = fig.add_subplot(2, 2, 4)
    ax4.axis('off')
    
    # Format recommendation text (use English placeholder if Chinese fails)
    report_text = recommendations if recommendations else "No data available for recommendations"
    
    # --- Fix for missing glyphs in Matplotlib fonts ---
    # Replace common problematic characters that triggers UserWarnings or empty boxes
    replacements = {
        '\u2002': ' ',    # EN SPACE
        '\u2003': '  ',   # EM SPACE
        '\u2265': '>=',   # >=
        '\u2264': '<=',   # <=
        '\u2248': '~',    # approx
        '\u2192': '->',   # arrow
        '\u2022': '*',    # bullet
        '\u2027': '*',    # center dot / bullet
        '\u201c': '"',    # left quote
        '\u201d': '"',    # right quote
        '\u2018': "'",    # left single quote
        '\u2019': "'",    # right single quote
        '\u2014': '-',    # em dash
        '\u2013': '-',    # en dash
        '\u2026': '...',  # ellipsis
    }
    for char, replacement in replacements.items():
        report_text = report_text.replace(char, replacement)
    
    # Limit text length and wrap lines more gracefully (preserving paragraphs)
    import textwrap
    max_chars = 1500
    report_text = report_text[:max_chars]
    paragraphs = report_text.split('\n')
    wrapped_paragraphs = [textwrap.fill(p, width=60) for p in paragraphs]
    wrapped_text = "\n".join(wrapped_paragraphs)
    
    ax4.text(0.05, 0.95, "AI Learning Recommendations", fontsize=14, fontweight='bold', 
             transform=ax4.transAxes, verticalalignment='top')
    ax4.text(0.05, 0.88, wrapped_text, fontsize=9, transform=ax4.transAxes, 
             verticalalignment='top', wrap=True)

    plt.tight_layout()
    plt.savefig('ielts_task1_report.png', dpi=150, bbox_inches='tight')
    print("\n[系統] 報告已儲存: ielts_task1_report.png")
    
    # 同時儲存純文字報告
    with open('ielts_task1_report.txt', 'w', encoding='utf-8') as f:
        f.write("=" * 60 + "\n")
        f.write("IELTS Writing Task 1 RCA Analysis Report\n")
        f.write("=" * 60 + "\n\n")
        
        f.write("--- 分數統計 ---\n")
        f.write(df.drop(columns=['file_name'], errors='ignore').describe().loc[['mean', 'min', 'max']].to_string())
        f.write("\n\n")
        
        if rca_df is not None:
            f.write("--- RCA 瓶頸分析 ---\n")
            f.write(rca_df.to_string(index=False))
            f.write("\n\n")
        
        f.write("--- AI 建議報告 ---\n")
        f.write(recommendations if recommendations else "尚無足夠資料生成建議")
        f.write("\n")
    
    print("[系統] 文字報告已儲存: ielts_task1_report.txt")

def validate_cache_entry(entry):
    """
    Check if a cache entry contains all current required metrics.
    Returns True if valid, False if partial/outdated.
    """
    if not entry:
        return False
    required_keys = TASK1_METRICS.keys()
    for k in required_keys:
        if k not in entry:
            return False
    return True

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="IELTS Task 1 RCA Analyzer")
    parser.add_argument('--mode', type=str, choices=['all', 'score', 'report'], default='all', help='Execution mode')
    parser.add_argument('--provider', type=str, choices=['kimi', 'gemini'], default=DEFAULT_PROVIDER, help='AI Provider (kimi or gemini)')
    parser.add_argument('--file', type=str, help='Specific file to analyze (optional)')
    parser.add_argument('--force-refresh', action='store_true', help='Ignore cache and re-score')
    
    args = parser.parse_args()

    # Set Global Provider
    CURRENT_PROVIDER = args.provider
    if CURRENT_PROVIDER == 'gemini' and not gemini_api_key:
        print("[警告] 尚未設定 GEMINI_API_KEY 環境變數。請設定後再試，或使用 --provider kimi。")
        # Fallback? No, let user decide.
    
    print(f"[系統] 目前使用 AI 模型: {CURRENT_PROVIDER.upper()}")

    # 1. 讀取使用者真實文章
    essays_list = load_user_essays(ESSAY_FOLDER)

    if not essays_list:
        print(f"[停止] 尚未在 '{ESSAY_FOLDER}' 中發現任何 .txt 檔案。")
        sys.exit()

    # Filter by specific file if requested
    if args.file:
        essays_list = [e for e in essays_list if args.file in e['file_name']]
        if not essays_list:
            print(f"[錯誤] 找不到檔案: {args.file}")
            sys.exit()

    # --- Mode: Score (or All) ---
    if args.mode in ['all', 'score']:
        print(f"[系統] 偵測到 {len(essays_list)} 篇文章，開始 AI 量化評分 (Task 1 標準)...")
        
        score_cache = load_cache()
        if args.force_refresh:
            print("[設定] 強制刷新模式: 忽略現有快取")
            score_cache = {}
            
        scored_data = []
        
        for item in essays_list:
            file_name = item['file_name']
            content = item['content']
            
            # Unified cache lookup (supports both hash and filename)
            cached_entry, cache_key = find_in_cache(score_cache, file_name, content)
            
            use_cache = False
            if cached_entry and not args.force_refresh:
                if validate_cache_entry(cached_entry):
                    use_cache = True
                else:
                    print(f"  [Cache] 發現舊版資料 '{file_name}' (缺少新指標)，將重新評分...")

            if use_cache:
                print(f"  [Cache] 🚀 快取命中: {file_name}")
                scores = cached_entry
            else:
                print(f"  > 正在分析: {file_name}...")
                scores = get_ai_scores(content)
                if scores:
                    # Save under BOTH hash (for API compatibility) AND filename (for CLI backward compatibility)
                    content_hash = get_content_hash(content)
                    score_cache[content_hash] = scores  # Primary: hash-based
                    score_cache[file_name] = scores     # Secondary: filename-based (legacy)
                    save_cache(score_cache)
                    time.sleep(1) # 速率限制保護
            
            if scores:
                scores['file_name'] = file_name
                scored_data.append(scores)
        
        if args.mode == 'score':
            print("[系統] 評分完成。")
            sys.exit()

    # --- Mode: Report (or All) ---
    if args.mode in ['all', 'report']:
        # Reload cache to define scored_data if we skipped scoring block
        if 'scored_data' not in locals():
             score_cache = load_cache()
             scored_data = []
             for item in essays_list:
                 # Use unified cache lookup
                 cached_entry, _ = find_in_cache(score_cache, item['file_name'], item['content'])
                 if cached_entry and validate_cache_entry(cached_entry):
                     scores = cached_entry
                     scores['file_name'] = item['file_name']
                     scored_data.append(scores)

        if scored_data:
            df = pd.DataFrame(scored_data)
            
            # 2. 機器學習分析
            # 2. 機器學習分析
            rca_prev_results = None
            if len(df) > 2:
                # Calculate RCA excluding the latest essay to see the "before" state
                rca_prev_results = perform_ml_analysis(df.iloc[:-1])

            rca_results = perform_ml_analysis(df)
            
            print("\n--- AI 量化分析摘要 (Task 1) ---")
            display_cols = [c for c in df.columns if c != 'file_name']
            print(df[display_cols].describe().loc[['mean', 'min', 'max']])

            if rca_results is not None:
                print("\n--- 隨機森林 RCA 診斷 ---")
                print(rca_results.to_string(index=False))
                
                top_driver = rca_results.iloc[0]['Metric_Name']
                print(f"\n[診斷核心]: 你的總分波動主要受 '{top_driver}' 驅動。")
                print(f"這意味著 '{top_driver}' 是你目前最需要改善的瓶頸 (高重要性但表現不佳)。")
            else:
                print("\n[提示] 目前文章數量過少，機器學習診斷精確度受限。請上傳更多文章以獲取深入 RCA 分析。")

            # 3. 生成 AI 建議
            print("\n[系統] 正在生成個人化學習建議...")
            recommendations = get_ai_recommendations(rca_results, df)
            
            print("\n--- AI 學習建議 ---")
            print(recommendations)

            # 4. 生成詳細 RCA 診斷報告
            if rca_results is not None:
                 generate_detailed_rca_report(rca_results, df, essays_list)

            # 5. 視覺化
            # 5. 視覺化
            plot_results(rca_results, df, recommendations, rca_prev_results)

            # 6. 最新成果驗收 (New Feature)
            if rca_results is not None:
                analyze_latest_progress(rca_results, df)
        else:
            print("[錯誤] 無有效評分資料可供分析。請先執行評分模式。")
