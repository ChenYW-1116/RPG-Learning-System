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
