import os
import sys
import io
import time
import json
import requests
import webbrowser
import re
import base64
from datetime import datetime
from flask import Flask, request, jsonify
from flask_cors import CORS

# 強制 UTF-8 編碼
if sys.platform == 'win32':
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='backslashreplace')
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8', errors='backslashreplace')

app = Flask(__name__)
CORS(app)

# 獲取系統下載資料夾
if os.name == 'nt':
    DOWNLOADS_DIR = os.path.join(os.environ['USERPROFILE'], 'Downloads')
else:
    DOWNLOADS_DIR = os.path.join(os.path.expanduser('~'), 'Downloads')

def sanitize_filename(filename):
    return re.sub(r'[\\/*?:"<>|]', "", filename)

def call_gemini_api(api_key, content):
    # Use gemini-3-flash-preview as requested
    url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=" + api_key
    
    system_prompt = """You are a professional bi-lingual technical editor.
    Your task is to polish the user's article AND format it into structured Markdown.
    
    Rules:
    1. Detect the language (Chinese/English).
    2. Polish the text: Improve flow, fix grammar, and use professional vocabulary.
    3. **Markdown Formatting (CRITICAL)**:
       - Identify logical sections and add '## ' (H2) or '### ' (H3) headers.
       - Convert lists into proper bullet points ('- ') or numbered lists ('1. ').
       - Bold key terms using '**term**'.
       - Ensure paragraph spacing is correct (double newline for new paragraph).
    4. Output ONLY the polished content. Do not add explanations."""
    
    payload = {
        "contents": [{
            "parts": [{"text": content}]
        }],
        "systemInstruction": {
            "parts": [{"text": system_prompt}]
        }
    }
    
    try:
        response = requests.post(url, json=payload, headers={'Content-Type': 'application/json'})
        response.raise_for_status()
        data = response.json()
        return data['candidates'][0]['content']['parts'][0]['text']
    except Exception as e:
        print(f"[ERROR] Gemini API Error: {str(e)}")
        raise e

@app.route('/polish', methods=['POST'])
def polish_article():
    data = request.json
    api_key = data.get('apiKey')
    content = data.get('content')
    
    if not api_key:
        return jsonify({"success": False, "message": "請提供 Gemini API Key"}), 400
    if not content:
        return jsonify({"success": False, "message": "內容為空"}), 400

    print(f"[INFO] Polishing article... (Length: {len(content)})")
    try:
        polished_content = call_gemini_api(api_key, content)
        return jsonify({"success": True, "content": polished_content})
    except Exception as e:
        return jsonify({"success": False, "message": f"AI 潤飾失敗: {str(e)}"}), 500

def is_likely_markdown(text):
    if not text: return False
    # Check for MD headers
    return bool(re.search(r'^#+\s', str(text), re.MULTILINE))

def auto_format_markdown(content, api_key):
    print("[INFO] Auto-formatting to Markdown via Gemini...")
    url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=" + api_key
    
    system_prompt = """You are a Markdown formatter. 
    Your ONLY task is to structure the user's text using Markdown syntax (Headers #, ##, Lists -, Bold **).
    Do NOT change the original wording, language, or logical order. 
    Just apply formatting structure.
    Output ONLY the formatted content."""
    
    payload = {
        "contents": [{"parts": [{"text": content}]}],
        "systemInstruction": {"parts": [{"text": system_prompt}]}
    }
    
    try:
        response = requests.post(url, json=payload, headers={'Content-Type': 'application/json'})
        response.raise_for_status()
        data = response.json()
        return data['candidates'][0]['content']['parts'][0]['text']
    except Exception as e:
        print(f"[ERROR] Auto-format failed: {str(e)}")
        return content # Fallback to original

@app.route('/export', methods=['POST'])
def export_article():
    try:
        # 讀取 Form Data
        title = request.form.get('title', 'Untitled')
        content = request.form.get('content', '')
        api_key = request.form.get('apiKey', '')
        
        # 自動格式化檢查
        if api_key and content and not is_likely_markdown(content):
            content = auto_format_markdown(content, api_key)

        # 1. 創建導出資料夾 (~/Downloads/Zhihu_Export_YYYYMMDD_HHMMSS)
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        safe_title = sanitize_filename(title)
        export_folder_name = f"Zhihu_Export_{safe_title[:10]}_{timestamp}"
        export_path = os.path.join(DOWNLOADS_DIR, export_folder_name)
        
        if not os.path.exists(export_path):
            os.makedirs(export_path)
            
        images_dir = os.path.join(export_path, "images")
        if not os.path.exists(images_dir):
            os.makedirs(images_dir)

        # 2. 處理圖片
        saved_images = []
        if 'images' in request.files:
            files = request.files.getlist('images')
            for file in files:
                if file.filename:
                    safe_img_name = sanitize_filename(file.filename)
                    save_path = os.path.join(images_dir, safe_img_name)
                    file.save(save_path)
                    saved_images.append(safe_img_name)
                    print(f"[INFO] Saved image: {safe_img_name}")

        # 3. 處理文章內容，嘗試插入圖片引用 (如果用戶沒有手動從 UI 插入)
        # 這裡我們做一個貼心的功能：如果文章裡沒有引用這些圖片，我們自動在文末添加
        final_content = content
        if saved_images:
            final_content += "\n\n---\n### 📷 附圖 (請將資料夾中的圖片拖入知乎編輯器)\n"
            for img_name in saved_images:
                # 使用相對路徑，雖然知乎無法直接讀取，但這讓本地預覽正常
                final_content += f"\n![{img_name}](images/{img_name})"

        # 3.1 [FIX] 修正知乎表格格式 (移除表格行之間的空行)
        # 使用 Lookahead (?=...) 確保可以處理連續的多行表格
        # 匹配: (行內容) + (2個以上換行) + (預判下一行以 | 開頭)
        table_pattern = r'(^\|.*\|[ \t]*)(?:(?:\r?\n)|\r){2,}(?=[ \t]*\|)'
        final_content = re.sub(table_pattern, r'\1\n', final_content, flags=re.MULTILINE)

        # 4. 保存 .md 檔案
        md_filename = f"{safe_title}.md"
        md_path = os.path.join(export_path, md_filename)
        
        full_file_content = f"# {title}\n\n{final_content}"
        
        with open(md_path, 'w', encoding='utf-8') as f:
            f.write(full_file_content)

        print(f"[INFO] Export success: {export_path}")

        # 5. 開啟導出資料夾 (Windows)
        print("[INFO] Opening local folder...")
        if sys.platform == 'win32':
            os.startfile(export_path)
            
        # 6. 開啟知乎
        print("[INFO] Opening Zhihu...")
        webbrowser.open("https://zhuanlan.zhihu.com/write")

        return jsonify({
            "success": True, 
            "message": "導出成功", 
            "exportPath": export_path,
            "mdFile": md_path
        })

    except Exception as e:
        print(f"[ERROR] Export failed: {e}")
        return jsonify({"success": False, "message": str(e)}), 500

@app.route('/check', methods=['GET'])
def check():
    return jsonify({"status": "running", "message": "Zhihu Assistant Server Running"})

if __name__ == '__main__':
    print("="*50)
    print(f"Zhihu Assistant Server v2.0")
    print(f"Downloads Dir: {DOWNLOADS_DIR}")
    print("正在監聽: http://localhost:5000")
    print("="*50)
    port = int(os.environ.get('PORT', 5000))
    print(f"Starting server on http://0.0.0.0:{port}")
    app.run(host='0.0.0.0', port=port)
