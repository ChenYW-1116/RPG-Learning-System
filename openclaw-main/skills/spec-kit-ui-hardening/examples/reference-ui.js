/**
 * Reference Implementation for UI Hardening
 * Includes: Toast System, Loading-Lock Pattern, Input Validation
 */

class UIHandler {
    constructor() {
        this.injectToastContainer();
    }

    // --- 1. Toast System ---

    injectToastContainer() {
        if (document.getElementById('toast-container')) return;
        const container = document.createElement('div');
        container.id = 'toast-container';
        // Tailwind classes for positioning
        container.className = 'fixed bottom-4 right-4 space-y-2 z-50 pointer-events-none';
        document.body.appendChild(container);
    }

    showToast(message, type = 'info', duration = 3000) {
        const container = document.getElementById('toast-container');

        const colors = {
            success: 'bg-green-600 border-green-700 text-white',
            error: 'bg-red-600 border-red-700 text-white',
            info: 'bg-blue-600 border-blue-700 text-white',
            warning: 'bg-amber-500 border-amber-600 text-black'
        };

        const toast = document.createElement('div');
        // Include pointer-events-auto so users can click/dismiss if needed
        toast.className = `${colors[type]} border px-4 py-3 rounded shadow-lg transform transition-all duration-300 translate-y-4 opacity-0 flex items-center gap-2 pointer-events-auto min-w-[200px]`;

        // Icon Map
        const icons = { success: '✅', error: '⚠️', info: 'ℹ️', warning: '⚡' };

        toast.innerHTML = `<span>${icons[type]}</span><span class="font-medium text-sm">${this._escapeHtml(message)}</span>`;

        container.appendChild(toast);

        // Animate In
        requestAnimationFrame(() => {
            toast.classList.remove('translate-y-4', 'opacity-0');
        });

        // Auto Dismiss
        setTimeout(() => {
            this._dismissToast(toast);
        }, duration);
    }

    _dismissToast(toast) {
        toast.classList.add('opacity-0', 'translate-y-2');
        setTimeout(() => toast.remove(), 300);
    }

    _escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // --- 2. Safe Async Handler (Loading-Lock) ---

    /**
     * Wraps an async function with loading state management on a button.
     * @param {string} btnId - ID of the button to lock
     * @param {Function} asyncFn - The async function to execute
     */
    async handleAction(btnId, asyncFn) {
        const btn = document.getElementById(btnId);
        if (!btn) {
            console.error(`Button #${btnId} not found`);
            return;
        }

        // Prevent double-click
        if (btn.hasAttribute('data-processing')) return;

        // Lock
        btn.setAttribute('data-processing', 'true');
        const originalText = btn.innerHTML;
        const originalClasses = btn.className;

        // Visual Feedback
        btn.disabled = true;
        btn.innerHTML = `<span class="animate-spin inline-block mr-2">⏳</span> Processing...`;
        btn.classList.add('opacity-75', 'cursor-not-allowed');

        try {
            await asyncFn();
            // Success Toast meant to be handled inside asyncFn or here
        } catch (error) {
            console.error("Action Error:", error);
            this.showToast(error.message || "An unexpected error occurred", 'error');
        } finally {
            // Unlock
            btn.removeAttribute('data-processing');
            btn.innerHTML = originalText;
            btn.className = originalClasses;
            btn.disabled = false;
        }
    }
}

// Attach to window
window.ui = new UIHandler();

/** 
 * Example Usage in App:
 * 
 * async function onSaveClick() {
 *     await window.ui.handleAction('btn-save', async () => {
 *         // Validate
 *         const val = document.getElementById('input-name').value;
 *         if (!val.trim()) throw new Error("Name is required");
 *         
 *         // Call Service
 *         await window.service.saveData(val);
 *         
 *         // Success Message
 *         window.ui.showToast("Saved successfully!", "success");
 *     });
 * }
 */
