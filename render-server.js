const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const path = require('path');
const { spawn } = require('child_process');

const app = express();
const PORT = process.env.PORT || 10000;

// ═══════════════════════════════════════════════════════════════════════════
// 1. Start Support Services
// ═══════════════════════════════════════════════════════════════════════════

function startBackend(name, command, args, port) {
    console.log(`[Manager] Starting ${name} on port ${port}...`);
    const proc = spawn(command, args, {
        shell: true,
        env: { ...process.env, PORT: port.toString() }
    });

    proc.stdout.on('data', (data) => console.log(`[${name}] ${data}`));
    proc.stderr.on('data', (data) => console.error(`[${name} ERR] ${data}`));

    proc.on('close', (code) => {
        console.log(`[${name}] Process exited with code ${code}. Restarting...`);
        setTimeout(() => startBackend(name, command, args, port), 5000);
    });

    return proc;
}

// Start Python Backends
startBackend('Arena-API', 'python', ['arena_api.py'], 3000);
startBackend('Zhihu-API', 'python', ['zhihu_server.py'], 5000);
startBackend('Bridge-API', 'node', ['spec-kit-bridge.js'], 3333);

// ═══════════════════════════════════════════════════════════════════════════
// 2. Gateway Proxy Routing
// ═══════════════════════════════════════════════════════════════════════════

// Route to Arena AI
app.use('/api/arena', createProxyMiddleware({
    target: 'http://127.0.0.1:3000',
    changeOrigin: true,
    pathRewrite: { '^/api/arena': '' }
}));

// Route to Zhihu Assistant
app.use('/api/zhihu', createProxyMiddleware({
    target: 'http://127.0.0.1:5000',
    changeOrigin: true,
    pathRewrite: { '^/api/zhihu': '' }
}));

// Route to Spec Kit Bridge
app.use('/api/bridge', createProxyMiddleware({
    target: 'http://127.0.0.1:3333',
    changeOrigin: true,
    pathRewrite: { '^/api/bridge': '' }
}));

// ═══════════════════════════════════════════════════════════════════════════
// NEW: Config Endpoint for GitHub Token (from Render Environment Variables)
// ═══════════════════════════════════════════════════════════════════════════
app.get('/api/config/github-token', (req, res) => {
    res.json({ token: process.env.GITHUB_TOKEN || '' });
});

// ═══════════════════════════════════════════════════════════════════════════
// Gemini API Key Management Endpoints
// ═══════════════════════════════════════════════════════════════════════════

// Enable JSON body parsing
app.use(express.json());

// Get Gemini key status (without revealing the key)
app.get('/api/config/gemini-status', (req, res) => {
    const adminKey = process.env.GEMINI_API_KEY;
    res.json({
        hasAdminKey: !!adminKey,
        maskedKey: adminKey ? `${adminKey.slice(0, 8)}...${adminKey.slice(-4)}` : null
    });
});

// Validate Gemini API key
app.post('/api/gemini/validate', async (req, res) => {
    const userKey = req.body.key;
    const adminKey = process.env.GEMINI_API_KEY;
    const keyToValidate = userKey || adminKey;

    if (!keyToValidate) {
        return res.json({ valid: false, error: 'no_key', message: 'No API key provided' });
    }

    const maskedKey = `${keyToValidate.slice(0, 8)}...${keyToValidate.slice(-4)}`;
    const model = 'gemini-2.5-flash';
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${keyToValidate}`;

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: 'Reply OK' }] }],
                generationConfig: { maxOutputTokens: 5 }
            })
        });

        if (response.ok) {
            res.json({
                valid: true,
                maskedKey,
                source: userKey ? 'user' : 'admin',
                message: 'API key is valid'
            });
        } else {
            const errorData = await response.json().catch(() => ({}));
            res.json({
                valid: false,
                maskedKey,
                error: 'invalid_key',
                message: errorData?.error?.message || `HTTP ${response.status}`
            });
        }
    } catch (err) {
        res.json({
            valid: false,
            error: 'network_error',
            message: err.message
        });
    }
});

// ═══════════════════════════════════════════════════════════════════════════
// 3. Static File Hosting
// ═══════════════════════════════════════════════════════════════════════════

app.use(express.static(path.join(__dirname, '.')));

// Fallback to index.html or rpg-hub.html
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'rpg-hub.html'));
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`====================================================`);
    console.log(`🏰 Quest Empire Unified Gateway Running!`);
    console.log(`URL: http://0.0.0.0:${PORT}`);
    console.log(`====================================================`);
});
