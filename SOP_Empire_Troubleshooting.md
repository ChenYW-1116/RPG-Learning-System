# SOP: 專案疑難雜症解決指南 (Troubleshooting Guide)

## 1. 問題描述
當您運行 Python 腳本時，如果終端機顯示以下類型的錯誤訊息：
- `ModuleNotFoundError: No module named 'xxx'`
- `[Warning] Could not import analyzer: No module named 'xxx'`
- `ImportError: ...`

這表示您的 Python 環境中缺少該程式所需的第三方套件 (Libraries)。

**例如：**
```
[Warning] Could not import analyzer: No module named 'pandas'
```
這表示您的環境缺少 `pandas` 套件。

## 2. 解決步驟

### 步驟 1: 確認模組名稱
從錯誤訊息中找出缺失的模組名稱。
例如：`No module named 'pandas'` -> 模組名稱為 `pandas`。

### 步驟 2: 安裝模組
打開終端機 (Terminal) 或命令提示字元 (CMD)，輸入以下指令並按下 Enter：

```bash
pip install [模組名稱]
```

**範例：**
```bash
pip install pandas
```

如果您需要安裝特定版本的套件（例如專案要求舊版本），可以使用：
```bash
pip install pandas==1.5.3
```

### 步驟 3: 重新運行程式
安裝完成後（看到 `Successfully installed ...` 字樣），請重新運行您的 Python 腳本。

```bash
python arena_api.py
```
或
```bash
python zhihu_server.py
```

## 3. 常見缺失模組與依賴
本專案 (`07. Empire`) 常用的套件如下，如果遇到類似問題，可以嘗試安裝：

- **Web 框架**: `flask`, `flask-cors`
- **數據分析**: `pandas`, `numpy`
- **網絡請求**: `requests`
- **環境變數**: `python-dotenv`

### 一鍵安裝所有依賴
如果專案中有 `requirements.txt` 文件，您可以一次安裝所有需要的套件：

```bash
pip install -r requirements.txt
```

## 4. 故障排除

### Q: pip 指令無效？
A: 請確認您已安裝 Python 並將其加入系統環境變數 (PATH)。嘗試使用 `python -m pip install ...` 代替。

### Q: 安裝了但還是報錯？
A: 可能是您有多個 Python 版本。請確認您安裝套件的 Python 環境與運行腳本的 Python 環境是同一個。
- 檢查版本：`python --version`
- 檢查 pip 對應的 python：`pip --version`

---

## 5. Spec Kit Bridge 管理 (Port 3333)

### 5.1 問題描述：EADDRINUSE (Port 佔用)
當您啟動 Bridge 時，如果看到以下錯誤：
`Error: listen EADDRINUSE: address already in use :::3333`

這表示 Port 3333 已被之前的程序佔用（通常是沒關乾淨的舊 Bridge）。

### 5.2 解決步驟

#### 步驟 1: 找出並強制關閉佔用者
在 PowerShell 執行：
```powershell
# 1. 找出佔用 3333 的 PID
netstat -ano | findstr :3333 | findstr LISTENING

# 2. 強制關閉該 PID (假設結果顯示 PID 為 2444)
taskkill /F /PID 2444
```

#### 步驟 2: 重新啟動 Bridge
在專案根目錄執行：
```powershell
powershell -ExecutionPolicy Bypass -File ".\start-precision-bridge.ps1"
```

### 5.3 常用管理腳本
- **啟動 Bridge**: `.\start-precision-bridge.ps1` (Node.js 2.0 版)
- **環境檢查**: `node -v` (應顯示 v24.13.0 或以上)

---
*Created by AI Assistant for Quest Empire Project*
