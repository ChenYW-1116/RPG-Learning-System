---
name: spec-kit-ui-hardening
description: Best practices for User Experience (UX) resilience, error handling, and visual feedback. Use this to prevent "silent failures" where the user clicks and nothing happens, or where inputs are accepted without validation.
---

# 🛡️ UI Hardening & UX Resilience

A "working" function is not enough. The user must **feel** the system responding. This skill fixes "Silent Failures" and "Ghost Clicks".

## 1. 🚫 Problem: Silent Async
**Bad Code:**
```javascript
async function handleSubmit() {
    await saveData(); // If this takes 2s, the user clicks 10 times
    render();
}
```

## 2. ✅ Solution: The "Loading-Lock" Pattern
Always provide immediate visual feedback and prevent double-submission.

### ✨ Reference Implementation

> **Full Source File**: [examples/reference-ui.js](examples/reference-ui.js)

```javascript
async handleSubmit() {
    const btn = document.getElementById('btn-submit');
    
    // 1. LOCK & FEEDBACK
    if (this.isProcessing) return;
    this.isProcessing = true;
    
    const originalText = btn.textContent;
    btn.textContent = 'Processing...';
    btn.disabled = true; // Visual gray-out
    btn.classList.add('cursor-wait');

    try {
        // 2. EXECUTE
        await this.service.saveData();
        
        // 3. SUCCESS FEEDBACK
        this.showToast('Successfully saved!', 'success');
        
    } catch (error) {
        // 4. ERROR FEEDBACK
        console.error(error);
        this.showToast(`Error: ${error.message}`, 'error');
        
    } finally {
        // 5. RESTORE
        this.isProcessing = false;
        btn.textContent = originalText;
        btn.disabled = false;
        btn.classList.remove('cursor-wait');
    }
}
```

## 3. 🧩 The Toast System (Micro-Skill)
Don't rely on `alert()`. Embed a simple notification system.

```html
<!-- Add this to HTML -->
<div id="toast-container" class="fixed bottom-4 right-4 space-y-2 z-50"></div>

<!-- Add this logic -->
showToast(msg, type = 'info') {
    const container = document.getElementById('toast-container');
    const colors = { success: 'bg-green-500', error: 'bg-red-500', info: 'bg-blue-500' };
    
    const toast = document.createElement('div');
    toast.className = `${colors[type]} text-white px-4 py-2 rounded shadow-lg transform transition-all translate-y-2 opacity-0`;
    toast.textContent = msg;
    
    container.appendChild(toast);
    
    // Animate In
    requestAnimationFrame(() => toast.classList.remove('translate-y-2', 'opacity-0'));
    
    // Animate Out
    setTimeout(() => {
        toast.classList.add('translate-y-2', 'opacity-0');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}
```

## 4. 🛑 Input Hardening
Never trust user input.
- **Empty Checks**: `if (!val.trim()) return this.showToast('Field required', 'error');`
- **Type Checks**: `const num = parseFloat(val); if (isNaN(num)) ...`
- **Sanitization**: Use `textContent` instead of `innerHTML` when displaying user input to prevent XSS.
