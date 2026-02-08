"""
⚔️ IELTS Challenger Arena - Flask API Server
整合 ielts_rca_analyzer.py 的完整 RCA 分析能力
"""

from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
import os
import sys
import json
import base64
import tempfile
import time
import hashlib

# 設定 Python 路徑以載入 analyzer
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

app = Flask(__name__)
CORS(app)  # 允許跨域請求

# 導入 RCA 分析器的核心功能
try:
    import ielts_rca_analyzer as analyzer
    HAS_ANALYZER = True
except ImportError as e:
    print(f"[Warning] Could not import analyzer: {e}")
    HAS_ANALYZER = False

# 配置
ESSAYS_FOLDER = "essays_to_analyze"
REPORT_IMAGE = "ielts_task1_report.png"
CACHE_FILE = "ai_scores_cache.json"

# ═══════════════════════════════════════════════════════════════════════════
# 🔧 HELPER FUNCTIONS FOR SMART CACHING
# ═══════════════════════════════════════════════════════════════════════════

def get_essay_hash(essay_text):
    """Generate a unique MD5 hash from essay content for cache lookup."""
    normalized = essay_text.strip().lower()
    return hashlib.md5(normalized.encode('utf-8')).hexdigest()

def load_score_cache():
    """Load the AI scores cache from disk."""
    if os.path.exists(CACHE_FILE):
        try:
            with open(CACHE_FILE, 'r', encoding='utf-8') as f:
                return json.load(f)
        except json.JSONDecodeError:
            print("[Warning] Cache file corrupted, starting fresh.")
    return {}

def save_score_cache(cache_data):
    """Save the AI scores cache to disk."""
    with open(CACHE_FILE, 'w', encoding='utf-8') as f:
        json.dump(cache_data, f, ensure_ascii=False, indent=2)

def save_essay_to_folder(essay_text, essay_hash):
    """Save a new essay to the essays folder with a timestamped filename."""
    if not os.path.exists(ESSAYS_FOLDER):
        os.makedirs(ESSAYS_FOLDER)
    
    timestamp = time.strftime("%Y%m%d_%H%M%S")
    filename = f"arena_{timestamp}_{essay_hash[:8]}.txt"
    filepath = os.path.join(ESSAYS_FOLDER, filename)
    
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(essay_text)
    
    print(f"[系統] ✨ 新作文已存檔: {filepath}")
    return filename

@app.route('/api/health', methods=['GET'])
def health_check():
    """健康檢查端點"""
    return jsonify({
        "status": "ok",
        "analyzer_loaded": HAS_ANALYZER,
        "timestamp": time.strftime("%Y-%m-%d %H:%M:%S")
    })

@app.route('/api/analyze', methods=['POST'])
def analyze_essay():
    """
    分析單篇作文並返回評分結果 (支援智慧快取)
    """
    if not HAS_ANALYZER:
        return jsonify({"error": "Analyzer not loaded"}), 500
    
    data = request.get_json()
    essay_text = data.get('essay', '')
    
    if not essay_text or len(essay_text) < 50:
        return jsonify({"error": "Essay too short (min 50 chars)"}), 400
    
    try:
        # 設定 provider
        analyzer.CURRENT_PROVIDER = data.get('provider', 'kimi')
        
        # Smart caching
        essay_hash = get_essay_hash(essay_text)
        score_cache = load_score_cache()
        
        if essay_hash in score_cache:
            print(f"[API] 🚀 快取命中！")
            scores = score_cache[essay_hash]
        else:
            print(f"[API] Analyzing essay ({len(essay_text)} chars)...")
            scores = analyzer.get_ai_scores(essay_text)
            
            if not scores:
                return jsonify({"error": "AI scoring failed"}), 500
            
            # Save to folder and cache
            filename = save_essay_to_folder(essay_text, essay_hash)
            scores['file_name'] = filename
            score_cache[essay_hash] = scores.copy()
            save_score_cache(score_cache)
            print(f"[API] 📝 新評分已快取")
        
        return jsonify({
            "success": True,
            "scores": scores,
            "overall_band": scores.get('overall_band', 0)
        })
        
    except Exception as e:
        print(f"[API Error] {str(e)}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/full-rca', methods=['POST'])
def full_rca_analysis():
    """
    執行完整 RCA 分析：
    1. 保存作文到臨時文件
    2. 運行 ML 分析
    3. 生成圖表
    4. 返回結果和圖表
    """
    if not HAS_ANALYZER:
        return jsonify({"error": "Analyzer not loaded"}), 500
    
    data = request.get_json()
    essays = data.get('essays', [])  # 歷史作文列表
    new_essay = data.get('new_essay', '')
    
    if not new_essay:
        return jsonify({"error": "No essay provided"}), 400
    
    try:
        import pandas as pd
        import numpy as np
        
        # 設定 provider
        analyzer.CURRENT_PROVIDER = data.get('provider', 'kimi')
        
        # ═══════════════════════════════════════════════════════════════════
        # 🔍 SMART CACHING LOGIC
        # ═══════════════════════════════════════════════════════════════════
        
        # 1. Calculate content hash
        essay_hash = get_essay_hash(new_essay)
        print(f"[API] Essay hash: {essay_hash[:12]}...")
        
        # 2. Load cache and check if this essay has been scored before
        score_cache = load_score_cache()
        
        if essay_hash in score_cache:
            # 🚀 CACHE HIT - Use existing scores
            print(f"[API] 🚀 快取命中！直接使用已有評分 (跳過 AI 呼叫)")
            new_scores = score_cache[essay_hash].copy()
            filename = new_scores.get('file_name', f"cached_{essay_hash[:8]}.txt")
        else:
            # ✨ NEW ESSAY - Score with AI and persist
            print(f"[API] ✨ 新作文偵測！正在評分...")
            new_scores = analyzer.get_ai_scores(new_essay)
            
            if not new_scores:
                return jsonify({"error": "Failed to score new essay"}), 500
            
            # Save to folder
            filename = save_essay_to_folder(new_essay, essay_hash)
            new_scores['file_name'] = filename
            
            # Update cache
            score_cache[essay_hash] = new_scores.copy()
            save_score_cache(score_cache)
            print(f"[API] 📝 快取已更新")
        
        # 3. 組合歷史數據
        all_scores = []
        for hist in essays:
            if 'scores' in hist:
                score_entry = hist['scores'].copy()
                score_entry['file_name'] = hist.get('id', 'unknown')
                all_scores.append(score_entry)
        all_scores.append(new_scores)
        
        # 4. 創建 DataFrame
        df = pd.DataFrame(all_scores)
        
        # 5. 執行 ML RCA 分析
        print("[API] Running ML RCA analysis...")
        rca_results = None
        rca_prev_results = None
        
        if len(df) >= 2:
            rca_results = analyzer.perform_ml_analysis(df)
            if len(df) > 2:
                rca_prev_results = analyzer.perform_ml_analysis(df.iloc[:-1])
        
        # 5. 生成 AI 建議
        print("[API] Generating recommendations...")
        recommendations = ""
        if rca_results is not None:
            recommendations = analyzer.get_ai_recommendations(rca_results, df)
        
        # 6. 生成圖表
        print("[API] Generating charts...")
        analyzer.plot_results(rca_results, df, recommendations, rca_prev_results)
        
        # 7. 讀取圖片並轉為 base64
        chart_base64 = None
        if os.path.exists(REPORT_IMAGE):
            with open(REPORT_IMAGE, 'rb') as f:
                chart_base64 = base64.b64encode(f.read()).decode('utf-8')
        
        # 8. 計算戰鬥結果
        battle_result = calculate_battle_result(df, new_scores, rca_results)

        # 9. 準備前端繪圖所需的原始數據 (Chart Data)
        chart_data = {
            "radar": [],
            "trend": [],
            "rca": []
        }

        # (A) Radar Chart Data - Skill Groups
        ta_cols = [c for c in df.columns if c.startswith('ta_')]
        cc_cols = [c for c in df.columns if c.startswith('cc_')]
        lr_cols = [c for c in df.columns if c.startswith('lr_')]
        gra_cols = [c for c in df.columns if c.startswith('gra_')]

        radar_values = [
            round(df[ta_cols].mean().mean(), 2) if ta_cols else 0,
            round(df[cc_cols].mean().mean(), 2) if cc_cols else 0,
            round(df[lr_cols].mean().mean(), 2) if lr_cols else 0,
            round(df[gra_cols].mean().mean(), 2) if gra_cols else 0,
        ]
        chart_data["radar"] = {
            "categories": ['Task Achievement', 'Coherence & Cohesion', 'Lexical Resource', 'Grammar'],
            "values": radar_values
        }

        # (B) Trend Chart Data - Overall Band
        chart_data["trend"] = {
            "labels": [f"Essay {i+1}" for i in range(len(df))],
            "data": df['overall_band'].tolist()
        }

        # (C) RCA Bar Chart Data - Full bottleneck analysis
        if rca_results is not None:
            # Convert NaN to None/0 for JSON serialization
            rca_clean = rca_results.replace({np.nan: 0}).to_dict('records')
            
            # Map previous results if available
            prev_map = {}
            if rca_prev_results is not None:
                # IMPORTANT: Must also clean NaN from previous results
                rca_prev_clean = rca_prev_results.replace({np.nan: 0})
                prev_map = dict(zip(rca_prev_clean['Metric'], rca_prev_clean['Bottleneck_Index']))
            
            # Enrich with comparison data
            for item in rca_clean:
                metric = item['Metric']
                prev_val = prev_map.get(metric, 0)
                item['Prev_Bottleneck_Index'] = float(prev_val)
                diff = float(item['Bottleneck_Index']) - float(prev_val)
                item['Diff'] = diff
                
            chart_data["rca"] = rca_clean

        
        # 10. 構建完整響應
        response = {
            "success": True,
            "new_scores": new_scores,
            "overall_band": new_scores.get('overall_band', 0),
            "battle_result": battle_result,
            "rca_summary": None,
            "recommendations": recommendations,
            "chart_image": chart_base64, # Legacy support
            "chart_data": chart_data      # New rich data
        }

        if rca_results is not None:
            response["rca_summary"] = {
                "top_bottlenecks": rca_results.head(3).to_dict('records'),
                "total_essays": len(df)
            }
        
        return jsonify(response)
        
    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500

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
        
        if diff >= 0.05:
            improvements.append({
                "metric": metric,
                "diff": round(diff, 3)
            })
        elif diff <= -0.05:
            regressions.append({
                "metric": metric,
                "diff": round(diff, 3)
            })
    
    victory = len(improvements) >= len(regressions) and len(improvements) > 0
    
    return {
        "victory": victory,
        "is_first_battle": False,
        "improvements": improvements,
        "regressions": regressions,
        "improvement_count": len(improvements),
        "regression_count": len(regressions)
    }

@app.route('/api/chart', methods=['GET'])
def get_chart():
    """獲取最新生成的圖表"""
    if os.path.exists(REPORT_IMAGE):
        return send_file(REPORT_IMAGE, mimetype='image/png')
    return jsonify({"error": "No chart available"}), 404

@app.route('/api/detailed-report', methods=['GET'])
def get_detailed_report():
    """獲取詳細的 RCA 報告"""
    report_file = "ielts_detailed_rca_report.md"
    if os.path.exists(report_file):
        with open(report_file, 'r', encoding='utf-8') as f:
            return jsonify({"report": f.read()})
    return jsonify({"error": "No detailed report available"}), 404

# ═══════════════════════════════════════════════════════════════════
# 🧰 TOOL STORE API
# ═══════════════════════════════════════════════════════════════════

TOOLS_FOLDER = "tools"

@app.route('/api/upload-tool', methods=['POST'])
def upload_tool():
    """上傳 HTML 工具並儲存到工具庫"""
    try:
        if 'file' not in request.files:
            return jsonify({"success": False, "error": "No file part"}), 400
        
        file = request.files['file']
        
        if file.filename == '':
            return jsonify({"success": False, "error": "No selected file"}), 400
        
        if file and file.filename.endswith('.html'):
            if not os.path.exists(TOOLS_FOLDER):
                os.makedirs(TOOLS_FOLDER)
            
            # 使用原始檔名或清理後的檔名
            filename = file.filename
            filepath = os.path.join(TOOLS_FOLDER, filename)
            
            file.save(filepath)
            print(f"[系統] 🧰 新工具已儲存: {filepath}")
            
            return jsonify({
                "success": True, 
                "message": "Tool uploaded successfully",
                "filename": f"tools/{filename}"
            })
        else:
            return jsonify({"success": False, "error": "Invalid file type (must be .html)"}), 400
            
    except Exception as e:
        print(f"[API Error] Upload failed: {str(e)}")
        return jsonify({"success": False, "error": str(e)}), 500

@app.route('/api/tools', methods=['GET'])
def list_tools():
    """列出所有可用的工具檔案"""
    tools = []
    if os.path.exists(TOOLS_FOLDER):
        for f in os.listdir(TOOLS_FOLDER):
            if f.endswith('.html'):
                tools.append(f"tools/{f}")
    return jsonify({"tools": tools})

@app.route('/tools/<path:filename>')
def serve_tool(filename):
    """提供工具檔案訪問"""
    return send_file(os.path.join(TOOLS_FOLDER, filename))

if __name__ == '__main__':
    print("=" * 60)
    print("⚔️ IELTS Challenger Arena API Server")
    print("=" * 60)
    print(f"Analyzer loaded: {HAS_ANALYZER}")
    port = int(os.environ.get('PORT', 3000))
    print(f"Starting server on http://0.0.0.0:{port}")
    app.run(host='0.0.0.0', port=port, debug=False)
