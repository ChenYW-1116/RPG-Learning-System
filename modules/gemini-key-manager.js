/**
 * ═══════════════════════════════════════════════════════════════════════════
 * 🔑 GEMINI KEY MANAGER MODULE
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Centralized Gemini API Key management with i18n support.
 * 
 * Features:
 * 1. Single entry point for key input (rpg-hub.html)
 * 2. Status-only display for other pages
 * 3. Admin key fallback (via Render env var)
 * 4. i18n support (zh/en)
 * 
 * ═══════════════════════════════════════════════════════════════════════════
 */

const GeminiKeyManager = {
    // ═══════════════════════════════════════════════════════════════════════
    // i18n Translations
    // ═══════════════════════════════════════════════════════════════════════
    i18n: {
        zh: {
            apiKeyLabel: 'Gemini API Key',
            apiKeyPlaceholder: '輸入您的 Key...',
            apiKeySaveBtn: '保存',
            apiKeyShowHide: '顯示/隱藏',
            keyStatusChecking: '⏳ 驗證中...',
            keyStatusValid: '✅ AI 服務可用',
            keyStatusInvalid: '❌ Key 無效',
            keyStatusNone: '⚠️ 未設定 Key',
            usingUserKey: '使用您的 Key',
            usingAdminKey: '使用系統預設 Key',
            keyStatusGoToHub: '請至主畫面設定',
            quotaLabel: '剩餘',
            requestsMin: '次/分鐘'
        },
        en: {
            apiKeyLabel: 'Gemini API Key',
            apiKeyPlaceholder: 'Enter your key...',
            apiKeySaveBtn: 'Save',
            apiKeyShowHide: 'Show/Hide',
            keyStatusChecking: '⏳ Validating...',
            keyStatusValid: '✅ AI Available',
            keyStatusInvalid: '❌ Invalid Key',
            keyStatusNone: '⚠️ No Key Set',
            usingUserKey: 'Using Your Key',
            usingAdminKey: 'Using Admin Key',
            keyStatusGoToHub: 'Set key in Hub',
            quotaLabel: 'Remaining',
            requestsMin: 'req/min'
        }
    },

    // Current language (synced with page)
    currentLang: 'zh',

    // ═══════════════════════════════════════════════════════════════════════
    // Core Methods
    // ═══════════════════════════════════════════════════════════════════════

    /**
     * Get translation string
     */
    t(key) {
        return this.i18n[this.currentLang]?.[key] || this.i18n['en'][key] || key;
    },

    /**
     * Set language
     */
    setLang(lang) {
        this.currentLang = lang === 'en' ? 'en' : 'zh';
    },

    /**
     * Get the active API key (user key from localStorage, or signal to use admin key)
     * @returns {string|null} - Key string, '__USE_ADMIN_KEY__', or null
     */
    getActiveKey() {
        const userKey = localStorage.getItem('gemini_api_key');
        if (userKey && userKey.trim()) {
            return userKey.trim();
        }
        return '__USE_ADMIN_KEY__'; // Signal backend to use admin key
    },

    /**
     * Save user key to localStorage
     */
    saveUserKey(key) {
        if (key && key.trim()) {
            localStorage.setItem('gemini_api_key', key.trim());
        } else {
            localStorage.removeItem('gemini_api_key');
        }
    },

    /**
     * Validate key via backend API
     * @param {string|null} key - Key to validate (null = use admin key)
     * @returns {Promise<Object>} - { valid, maskedKey, source, message }
     */
    async validateKey(key = null) {
        try {
            const response = await fetch('/api/gemini/validate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ key: key === '__USE_ADMIN_KEY__' ? null : key })
            });
            return await response.json();
        } catch (err) {
            return { valid: false, error: 'network_error', message: err.message };
        }
    },

    /**
     * Check if admin key is available
     * @returns {Promise<Object>} - { hasAdminKey, maskedKey }
     */
    async checkAdminKey() {
        try {
            const response = await fetch('/api/config/gemini-status');
            return await response.json();
        } catch (err) {
            return { hasAdminKey: false, maskedKey: null };
        }
    },

    // ═══════════════════════════════════════════════════════════════════════
    // UI Rendering Methods
    // ═══════════════════════════════════════════════════════════════════════

    /**
     * Render full input UI (for rpg-hub.html)
     * @param {string} containerSelector - CSS selector for container
     */
    async renderInputUI(containerSelector) {
        const container = document.querySelector(containerSelector);
        if (!container) return;

        const userKey = localStorage.getItem('gemini_api_key') || '';

        container.innerHTML = `
            <div class="gemini-key-section p-4 rounded-lg border border-indigo-500/30 bg-slate-800/50">
                <label class="block text-sm font-semibold text-indigo-300 mb-2">
                    🔑 ${this.t('apiKeyLabel')}
                </label>
                <div class="flex gap-2 items-center">
                    <input type="password" id="gemini-key-input" 
                           class="flex-1 px-3 py-2 rounded-lg bg-slate-900 border border-slate-600 text-white placeholder-gray-500 focus:border-indigo-500 focus:outline-none"
                           placeholder="${this.t('apiKeyPlaceholder')}"
                           value="${userKey}">
                    <button id="gemini-key-toggle" 
                            class="px-3 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-gray-300 transition-colors"
                            title="${this.t('apiKeyShowHide')}">
                        👁️
                    </button>
                    <button id="gemini-key-save" 
                            class="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold transition-colors">
                        ${this.t('apiKeySaveBtn')}
                    </button>
                </div>
                <div id="gemini-key-status" class="mt-2 text-sm text-gray-400">
                    ${this.t('keyStatusChecking')}
                </div>
            </div>
        `;

        // Event listeners
        const input = document.getElementById('gemini-key-input');
        const toggleBtn = document.getElementById('gemini-key-toggle');
        const saveBtn = document.getElementById('gemini-key-save');
        const statusEl = document.getElementById('gemini-key-status');

        toggleBtn.addEventListener('click', () => {
            input.type = input.type === 'password' ? 'text' : 'password';
            toggleBtn.textContent = input.type === 'password' ? '👁️' : '🙈';
        });

        saveBtn.addEventListener('click', async () => {
            const key = input.value.trim();
            this.saveUserKey(key);
            statusEl.textContent = this.t('keyStatusChecking');
            const result = await this.validateKey(key || null);
            this._updateStatusElement(statusEl, result);
        });

        // Initial validation
        const activeKey = this.getActiveKey();
        const result = await this.validateKey(activeKey === '__USE_ADMIN_KEY__' ? null : activeKey);
        this._updateStatusElement(statusEl, result);
    },

    /**
     * Render status-only UI (for other pages)
     * @param {string} containerSelector - CSS selector for container
     */
    async renderStatusUI(containerSelector) {
        const container = document.querySelector(containerSelector);
        if (!container) return;

        container.innerHTML = `
            <div class="gemini-status-badge inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-800/80 border border-slate-600 text-sm">
                <span id="gemini-status-icon">⏳</span>
                <span id="gemini-status-text">${this.t('keyStatusChecking')}</span>
            </div>
        `;

        const iconEl = document.getElementById('gemini-status-icon');
        const textEl = document.getElementById('gemini-status-text');

        const activeKey = this.getActiveKey();
        const result = await this.validateKey(activeKey === '__USE_ADMIN_KEY__' ? null : activeKey);

        if (result.valid) {
            iconEl.textContent = '✅';

            // Format status text with quota if available
            let statusText = this.t('keyStatusValid');
            if (result.quota && result.quota.remaining !== null) {
                statusText += ` (${result.quota.remaining}/${result.quota.limit || '?'} ${this.t('requestsMin')})`;
            }
            textEl.textContent = statusText;

            container.querySelector('.gemini-status-badge').classList.add('border-green-500/50');
        } else if (result.error === 'no_key') {
            iconEl.textContent = '⚠️';
            textEl.textContent = `${this.t('keyStatusNone')} - ${this.t('keyStatusGoToHub')}`;
            container.querySelector('.gemini-status-badge').classList.add('border-yellow-500/50');
        } else {
            iconEl.textContent = '❌';
            textEl.textContent = `${this.t('keyStatusInvalid')} - ${this.t('keyStatusGoToHub')}`;
            container.querySelector('.gemini-status-badge').classList.add('border-red-500/50');
        }
    },

    /**
     * Internal: Update status element based on validation result
     */
    _updateStatusElement(el, result) {
        if (result.valid) {
            const sourceText = result.source === 'user' ? this.t('usingUserKey') : this.t('usingAdminKey');
            let quotaText = '';
            if (result.quota && result.quota.remaining !== null) {
                quotaText = ` • <span class="text-indigo-300 font-mono">${this.t('quotaLabel')}: ${result.quota.remaining}/${result.quota.limit || '?'} ${this.t('requestsMin')}</span>`;
            }

            el.innerHTML = `<span class="text-green-400">${this.t('keyStatusValid')}</span> <span class="text-gray-500">(${sourceText})</span>${quotaText}`;
        } else if (result.error === 'no_key') {
            el.innerHTML = `<span class="text-yellow-400">${this.t('keyStatusNone')}</span>`;
        } else {
            el.innerHTML = `<span class="text-red-400">${this.t('keyStatusInvalid')}</span> <span class="text-gray-500">${result.message || ''}</span>`;
        }
    }
};

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = GeminiKeyManager;
}
