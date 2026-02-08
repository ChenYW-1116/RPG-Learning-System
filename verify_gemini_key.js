const https = require('https');

// Colors for console output
const colors = {
    reset: "\x1b[0m",
    red: "\x1b[31m",
    green: "\x1b[32m",
    yellow: "\x1b[33m",
    cyan: "\x1b[36m",
    bold: "\x1b[1m"
};

/**
 * 驗證 Gemini API Key 的獨立腳本
 * 使用 Node.js 原生 modules，無需 npm install
 */
async function verifyGeminiKey(apiKey) {
    console.clear();
    console.log(`${colors.cyan}${colors.bold}════════════════════════════════════════════${colors.reset}`);
    console.log(`${colors.cyan}   🔑 Gemini API Key Validator${colors.reset}`);
    console.log(`${colors.cyan}════════════════════════════════════════════${colors.reset}\n`);

    if (!apiKey) {
        console.error(`${colors.red}❌ 未提供 API Key${colors.reset}`);
        console.log(`${colors.yellow}請使用以下方式執行:${colors.reset}`);
        console.log(`   node verify_gemini_key.js ${colors.bold}<YOUR_API_KEY>${colors.reset}`);
        return;
    }

    // 嘗試使用較新的模型
    const model = 'gemini-2.5-flash';
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

    console.log(`📡 正在連線至 Google Gemini API...`);
    console.log(`⚙️ 模型: ${colors.green}${model}${colors.reset}`);
    console.log(`🔑 Key : ${apiKey.substring(0, 8)}...${apiKey.substring(apiKey.length - 4)}\n`);

    const payload = {
        contents: [{
            parts: [{ text: "Reply with 'Valid' if you can read this." }]
        }],
        generationConfig: {
            maxOutputTokens: 20
        }
    };

    const startTime = Date.now();

    const options = {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
    };

    const req = https.request(url, options, (res) => {
        let data = '';

        res.on('data', chunk => data += chunk);

        res.on('end', () => {
            const result = parseResponse(data, res.statusCode);
            const duration = ((Date.now() - startTime) / 1000).toFixed(2);

            if (result.success) {
                console.log(`${colors.green}✅ 驗證成功 (Success)${colors.reset}`);
                console.log(`⏱️ 耗時: ${duration}s`);
                console.log(`🤖 回應: ${result.message}`);
            } else {
                console.log(`${colors.red}❌ 驗證失敗 (Failed)${colors.reset}`);
                console.log(`⏱️ 耗時: ${duration}s`);
                console.log(`⚠️ 原因: ${result.error}`);

                if (res.statusCode === 400) console.log(`${colors.yellow}hint: 檢查 Key 是否格式正確或包含無效字符${colors.reset}`);
                if (res.statusCode === 401) console.log(`${colors.yellow}hint: Key 無效或已過期${colors.reset}`);
                if (res.statusCode === 429) console.log(`${colors.yellow}hint: 達到配額限制 (Quota Exceeded)${colors.reset}`);
            }
            console.log(`\n${colors.cyan}════════════════════════════════════════════${colors.reset}`);
        });
    });

    req.on('error', (e) => {
        console.error(`\n${colors.red}❌ 連線錯誤:${colors.reset} ${e.message}`);
    });

    req.write(JSON.stringify(payload));
    req.end();
}

function parseResponse(data, status) {
    try {
        const json = JSON.parse(data);
        if (status >= 200 && status < 300) {
            const text = json.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
            return { success: true, message: text || '(No content)' };
        } else {
            const msg = json.error?.message || json.error?.status || 'Unknown error';
            return { success: false, error: `${status} ${msg}` };
        }
    } catch (e) {
        return { success: false, error: `${status} Invalid JSON response: ${data.substring(0, 100)}...` };
    }
}

// Get key from args
const argKey = process.argv[2];
verifyGeminiKey(argKey);
