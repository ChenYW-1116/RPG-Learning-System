/**
 * ═══════════════════════════════════════════════════════════════════════════
 * 🔗 SPEC KIT INTEGRATION MODULE
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * 用途：將 Spec Kit Agent 的代碼生成功能整合到其他頁面
 * 通訊方式：使用隱藏的 iframe 和 postMessage 進行跨頁面通訊
 * 
 * 使用方法：
 * 1. 在頁面中引入此模組
 * 2. 調用 SpecKitIntegration.launchAutoGeneration(actionContent) 開始生成
 * 3. 監聽進度更新和完成事件
 */

const SpecKitIntegration = (function () {
    // 私有變量
    let _iframe = null;
    let _progressCallback = null;
    let _completeCallback = null;
    let _errorCallback = null;
    let _isRunning = false;
    let _generatedCode = null;
    let _toolName = null;

    // 生成步驟定義
    const STEPS = [
        { id: 'init', label: '初始化連接...', labelEn: 'Initializing connection...' },
        { id: 'specify', label: '📝 分析需求 (Specify)', labelEn: '📝 Analyzing requirements (Specify)' },
        { id: 'plan', label: '🗺️ 技術規劃 (Plan)', labelEn: '🗺️ Technical planning (Plan)' },
        { id: 'tasks', label: '📋 任務分解 (Tasks)', labelEn: '📋 Task breakdown (Tasks)' },
        { id: 'checklist', label: '✅ 品質檢查 (Checklist)', labelEn: '✅ Quality checklist (Checklist)' },
        { id: 'analyze', label: '🔍 一致性分析 (Analyze)', labelEn: '🔍 Consistency analysis (Analyze)' },
        { id: 'constitution', label: '📜 專案憲章 (Constitution)', labelEn: '📜 Project constitution (Constitution)' },
        { id: 'implement', label: '🚀 生成代碼 (Implement)', labelEn: '🚀 Generating code (Implement)' },
        { id: 'complete', label: '✨ 完成！', labelEn: '✨ Complete!' }
    ];

    let _currentStepIndex = 0;
    let _language = 'zh';

    /**
     * 初始化 iframe 通訊
     */
    function _initIframe() {
        if (_iframe) return _iframe;

        // 創建隱藏的 iframe
        _iframe = document.createElement('iframe');
        _iframe.id = 'spec-kit-integration-iframe';
        _iframe.src = 'spec-kit-agent.html';
        _iframe.style.cssText = 'position: absolute; left: -9999px; top: -9999px; width: 1px; height: 1px; border: none; visibility: hidden;';
        document.body.appendChild(_iframe);

        // 監聽來自 iframe 的消息
        window.addEventListener('message', _handleMessage);

        return _iframe;
    }

    /**
     * 處理來自 iframe 的消息
     */
    function _handleMessage(event) {
        // 安全檢查 - 只接受來自同源的消息
        if (event.origin !== window.location.origin) return;

        const data = event.data;
        if (!data || !data.type || !data.source || data.source !== 'spec-kit-agent') return;

        console.log('[SpecKitIntegration] Received message:', data.type, data);

        switch (data.type) {
            case 'ready':
                // iframe 準備就緒
                console.log('[SpecKitIntegration] Spec Kit Agent ready');
                break;

            case 'progress':
                // 進度更新
                _updateProgress(data.step, data.message);
                break;

            case 'code-generated':
                // 代碼生成完成
                _generatedCode = data.code;
                _toolName = data.toolName || 'generated_app';
                _onComplete();
                break;

            case 'error':
                // 錯誤
                _onError(data.message);
                break;
        }
    }

    /**
     * 更新進度
     */
    function _updateProgress(step, message) {
        // 找到當前步驟索引
        const stepIndex = STEPS.findIndex(s => s.id === step);
        if (stepIndex >= 0) {
            _currentStepIndex = stepIndex;
        }

        const stepInfo = STEPS[_currentStepIndex] || STEPS[0];
        const stepLabel = _language === 'zh' ? stepInfo.label : stepInfo.labelEn;

        if (_progressCallback) {
            _progressCallback({
                currentStep: _currentStepIndex + 1,
                totalSteps: STEPS.length,
                stepId: stepInfo.id,
                stepLabel: stepLabel,
                message: message || stepLabel,
                progress: ((_currentStepIndex + 1) / STEPS.length) * 100
            });
        }
    }

    /**
     * 完成時的處理
     */
    function _onComplete() {
        _isRunning = false;
        _currentStepIndex = STEPS.length - 1;
        _updateProgress('complete', _language === 'zh' ? '代碼生成完成！' : 'Code generation complete!');

        if (_completeCallback) {
            _completeCallback({
                code: _generatedCode,
                toolName: _toolName
            });
        }
    }

    /**
     * 錯誤處理
     */
    function _onError(message) {
        _isRunning = false;
        console.error('[SpecKitIntegration] Error:', message);

        if (_errorCallback) {
            _errorCallback(message);
        }
    }

    /**
     * 格式化需求文字
     */
    function _formatRequirement(actionContent) {
        return `/auto Generate an application that fulfills the following **user requirements**:\n${actionContent}`;
    }

    /**
     * 發送消息到 iframe
     */
    function _postToIframe(type, data) {
        if (!_iframe || !_iframe.contentWindow) {
            console.error('[SpecKitIntegration] Iframe not ready');
            return false;
        }

        _iframe.contentWindow.postMessage({
            source: 'spec-kit-integration',
            type: type,
            ...data
        }, window.location.origin);

        return true;
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // 公開 API
    // ═══════════════════════════════════════════════════════════════════════════

    return {
        /**
         * 設置語言
         */
        setLanguage(lang) {
            _language = lang || 'zh';
        },

        /**
         * 設置進度回調
         */
        onProgress(callback) {
            _progressCallback = callback;
        },

        /**
         * 設置完成回調
         */
        onComplete(callback) {
            _completeCallback = callback;
        },

        /**
         * 設置錯誤回調
         */
        onError(callback) {
            _errorCallback = callback;
        },

        /**
         * 檢查是否正在運行
         */
        isRunning() {
            return _isRunning;
        },

        /**
         * 獲取生成的代碼
         */
        getGeneratedCode() {
            return _generatedCode;
        },

        /**
         * 獲取工具名稱
         */
        getToolName() {
            return _toolName;
        },

        /**
         * 獲取步驟列表
         */
        getSteps() {
            return STEPS.map(s => ({
                id: s.id,
                label: _language === 'zh' ? s.label : s.labelEn
            }));
        },

        /**
         * 啟動自動生成流程
         * @param {string} actionContent - AI recommendation 中的 Action 內容
         * @returns {Promise} - 返回生成結果的 Promise
         */
        async launchAutoGeneration(actionContent) {
            if (_isRunning) {
                return Promise.reject(new Error('Generation already in progress'));
            }

            _isRunning = true;
            _currentStepIndex = 0;
            _generatedCode = null;
            _toolName = null;

            // 初始化 iframe
            _initIframe();

            // 等待 iframe 加載完成
            await new Promise((resolve) => {
                if (_iframe.contentDocument?.readyState === 'complete') {
                    resolve();
                } else {
                    _iframe.onload = resolve;
                }
            });

            // 額外等待 Spec Kit 初始化
            await new Promise(r => setTimeout(r, 2000));

            // 更新初始進度
            _updateProgress('init', _language === 'zh' ? '正在連接 Spec Kit Agent...' : 'Connecting to Spec Kit Agent...');

            // 格式化需求
            const formattedRequirement = _formatRequirement(actionContent);
            console.log('[SpecKitIntegration] Sending requirement:', formattedRequirement);

            // 發送生成請求
            _postToIframe('start-generation', {
                requirement: formattedRequirement
            });

            // 返回 Promise，會在完成或錯誤時 resolve/reject
            return new Promise((resolve, reject) => {
                const originalComplete = _completeCallback;
                const originalError = _errorCallback;

                _completeCallback = (result) => {
                    if (originalComplete) originalComplete(result);
                    resolve(result);
                };

                _errorCallback = (error) => {
                    if (originalError) originalError(error);
                    reject(new Error(error));
                };
            });
        },

        /**
         * 下載生成的代碼
         */
        downloadCode() {
            if (!_generatedCode) {
                console.warn('[SpecKitIntegration] No code to download');
                return false;
            }

            const blob = new Blob([_generatedCode], { type: 'text/html' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${(_toolName || 'generated_app').replace(/\s+/g, '_')}.html`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            return true;
        },

        /**
         * 清理資源
         */
        cleanup() {
            if (_iframe) {
                window.removeEventListener('message', _handleMessage);
                _iframe.remove();
                _iframe = null;
            }
            _isRunning = false;
            _generatedCode = null;
            _toolName = null;
        }
    };
})();

// 導出到 window
if (typeof window !== 'undefined') {
    window.SpecKitIntegration = SpecKitIntegration;
}
