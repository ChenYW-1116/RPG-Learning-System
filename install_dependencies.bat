@echo off
setlocal
chcp 65001 >nul

echo ==========================================================
echo   Quest Empire - 一鍵環境安裝腳本 (Dependencies Installer)
echo ==========================================================
echo.

:: 檢查 Python 是否安裝
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] 未檢測到 Python！請先安裝 Python。
    echo         建議版本: Python 3.9 以上
    pause
    exit /b
)

echo [INFO] 檢測到 Python 環境，準備安裝依賴...
echo.

:: 升級 pip
echo [STEP 1/2] 升級 pip 工具...
python -m pip install --upgrade pip

echo.
echo [STEP 2/2] 安裝 requirements.txt 中的套件...
if exist requirements.txt (
    pip install -r requirements.txt
    if %errorlevel% equ 0 (
        echo.
        echo [SUCCESS] 所有依賴安裝成功！
        echo           現在您可以運行 Run_App.bat 啟動應用程式了。
    ) else (
        echo.
        echo [ERROR] 安裝過程中發生錯誤，請檢查上方錯誤訊息。
    )
) else (
    echo [ERROR] 找不到 requirements.txt 檔案！
)

echo.
echo ==========================================================
pause
