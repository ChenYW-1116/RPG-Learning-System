
const http = require('http');
const { resolve, join } = require('path');
const { writeFile, readFile, readdir } = require('fs/promises');
const { spawn } = require('child_process');

// Configuration
const PROJECT_ROOT = resolve(".");  // C:\2026 Tasks\07. Empire
const OPENCLAW_DIR = resolve("./openclaw-main");
const SCRIPT_PATH = "skills/precise-execution/scripts/run-task.ts";

console.log("Starting Spec Kit Bridge Server (Node.js Mode - V2 with Skills Support)...");
console.log(`OpenClaw Dir: ${OPENCLAW_DIR}`);
console.log(`Run Task Script: ${SCRIPT_PATH}`);

const server = http.createServer(async (req, res) => {
    // CORS Headers
    const headers = {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
        "Content-Type": "application/json"
    };

    if (req.method === "OPTIONS") {
        res.writeHead(204, headers);
        res.end();
        return;
    }

    // GEMINI PROXY ENDPOINT
    if (req.url === "/gemini" && req.method === "POST") {
        let body = '';
        req.on('data', chunk => {
            body += chunk.toString();
        });

        req.on('end', async () => {
            try {
                const { model, contents, generationConfig, system_instruction, key } = JSON.parse(body);
                const googleApiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`;

                const payload = {
                    contents,
                    generationConfig
                };

                if (system_instruction) {
                    payload.system_instruction = system_instruction;
                }

                const googleResponse = await fetch(googleApiUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });

                if (!googleResponse.ok) {
                    const errorText = await googleResponse.text();
                    res.writeHead(googleResponse.status, headers);
                    res.end(errorText);
                    return;
                }

                const data = await googleResponse.json();
                res.writeHead(200, headers);
                res.end(JSON.stringify(data));

            } catch (error) {
                console.error("[Bridge] Gemini Proxy Error:", error);
                res.writeHead(500, headers);
                res.end(JSON.stringify({ error: error.message }));
            }
        });
        return;

        // LIST SKILLS ENDPOINT
        if (req.url === "/fs/list-skills" && req.method === "POST") {
            try {
                // ═══════════════════════════════════════════════════════════════════════
                // 🔄 TWO-TIER SKILL DISCOVERY (符合 SKILL_REGISTRY.md 設計)
                // ═══════════════════════════════════════════════════════════════════════
                // Priority 1: .agent/skills/          ← 專案專屬技能 (Project-Specific)
                // Priority 2: openclaw-main/skills/   ← 通用技能庫 (Universal Library)
                // ═══════════════════════════════════════════════════════════════════════

                const skills = [];
                const loadedNames = new Set(); // 防止重複載入

                // 🥇 PRIORITY 1: Project-Specific Skills (.agent/skills)
                const projectSkillsDir = join(PROJECT_ROOT, ".agent", "skills");
                console.log(`[Bridge] 📂 Scanning Priority 1: ${projectSkillsDir}`);

                try {
                    const entries = await readdir(projectSkillsDir, { withFileTypes: true });
                    for (const entry of entries) {
                        if (entry.isDirectory()) {
                            try {
                                const relativePath = `.agent/skills/${entry.name}/SKILL.md`;
                                const skillPath = join(projectSkillsDir, entry.name, "SKILL.md");
                                const content = await readFile(skillPath, "utf-8");
                                skills.push({
                                    name: entry.name,
                                    path: relativePath,
                                    priority: 1,
                                    contentSnippet: content.substring(0, 500)
                                });
                                loadedNames.add(entry.name);
                                console.log(`[Bridge]   ✅ [P1] ${entry.name}`);
                            } catch (e) {
                                // No SKILL.md, skip
                            }
                        }
                    }
                } catch (err) {
                    if (err.code !== 'ENOENT') throw err;
                    console.log(`[Bridge]   ⚠️ .agent/skills directory not found.`);
                }

                // 🥈 PRIORITY 2: Universal Skills Library (openclaw-main/skills)
                const universalSkillsDir = join(PROJECT_ROOT, "openclaw-main", "skills");
                console.log(`[Bridge] 📂 Scanning Priority 2: ${universalSkillsDir}`);

                try {
                    const entries = await readdir(universalSkillsDir, { withFileTypes: true });
                    for (const entry of entries) {
                        if (entry.isDirectory() && !loadedNames.has(entry.name)) {
                            try {
                                const relativePath = `openclaw-main/skills/${entry.name}/SKILL.md`;
                                const skillPath = join(universalSkillsDir, entry.name, "SKILL.md");
                                const content = await readFile(skillPath, "utf-8");
                                skills.push({
                                    name: entry.name,
                                    path: relativePath,
                                    priority: 2,
                                    contentSnippet: content.substring(0, 500)
                                });
                                console.log(`[Bridge]   ✅ [P2] ${entry.name}`);
                            } catch (e) {
                                // No SKILL.md, skip
                            }
                        } else if (loadedNames.has(entry.name)) {
                            console.log(`[Bridge]   ⏭️ [P2] ${entry.name} (已被 P1 覆蓋)`);
                        }
                    }
                } catch (err) {
                    if (err.code !== 'ENOENT') throw err;
                    console.log(`[Bridge]   ⚠️ openclaw-main/skills directory not found.`);
                }

                console.log(`[Bridge] ✅ Total ${skills.length} skills discovered (P1: ${[...loadedNames].length}, P2: ${skills.length - loadedNames.size})`);
                res.writeHead(200, headers);
                res.end(JSON.stringify({ skills }));
            } catch (err) {
                console.error("[Bridge] List Skills Error:", err);
                res.writeHead(500, headers);
                res.end(JSON.stringify({ error: err.message }));
            }
            return;
        }

        // LOG ENDPOINT (To print frontend logs to OS Terminal)
        if (req.url === "/fs/log" && req.method === "POST") {
            let body = '';
            req.on('data', chunk => { body += chunk.toString(); });
            req.on('end', () => {
                try {
                    const { content, type } = JSON.parse(body);
                    // Premium Colored Logging for Discovery
                    let prefix = '\x1b[34m[UI Log]\x1b[0m';
                    if (type === 'error') prefix = '\x1b[31m[UI Err]\x1b[0m';
                    if (type === 'success') prefix = '\x1b[32m[UI OK ]\x1b[0m';
                    if (content.includes('激活技能')) prefix = '\x1b[35m[SKILL ]\x1b[0m'; // Purple for skills

                    console.log(`${prefix} ${content}`);
                    res.writeHead(200, headers);
                    res.end(JSON.stringify({ status: "ok" }));
                } catch (err) {
                    res.writeHead(400, headers);
                    res.end(JSON.stringify({ error: "Invalid JSON" }));
                }
            });
            return;
        }

        // READ FILE ENDPOINT (For loading full skill content)
        if (req.url === "/fs/read-file" && req.method === "POST") {
            let body = '';
            req.on('data', chunk => { body += chunk.toString(); });
            req.on('end', async () => {
                try {
                    const { path } = JSON.parse(body);
                    // Simple validation
                    if (!path || path.includes('..')) {
                        throw new Error("Invalid path");
                    }
                    // Skills are at PROJECT_ROOT, other files may be at OPENCLAW_DIR
                    // Fix: Include 'openclaw-main' in PROJECT_ROOT check to prevent double nesting
                    const isRootPath = path.startsWith('.agent/skills') || path.startsWith('openclaw-main');
                    const baseDir = isRootPath ? PROJECT_ROOT : OPENCLAW_DIR;
                    const targetPath = join(baseDir, path);
                    console.log(`[Bridge] Reading file: ${targetPath}`);
                    const content = await readFile(targetPath, "utf-8");
                    res.writeHead(200, headers);
                    res.end(JSON.stringify({ content }));
                } catch (err) {
                    console.error("[Bridge] Read File Error:", err);
                    res.writeHead(500, headers);
                    res.end(JSON.stringify({ error: err.message }));
                }
            });
            return;
        }

        // VERIFY ENDPOINT (Original)
        if (req.url === "/verify" && req.method === "POST") {
            let body = '';
            req.on('data', chunk => { body += chunk.toString(); });
            req.on('end', async () => {
                try {
                    const { code, prompt, apiKey, model } = JSON.parse(body);

                    if (!code) {
                        res.writeHead(400, headers);
                        res.end(JSON.stringify({ error: "No code provided" }));
                        return;
                    }

                    // 1. Write temp files
                    const timestamp = Date.now();
                    const tempHtmlName = `temp_verif_${timestamp}.html`;
                    const tempPromptName = `temp_prompt_${timestamp}.txt`;
                    const tempHtmlPath = join(OPENCLAW_DIR, tempHtmlName);
                    const tempPromptPath = join(OPENCLAW_DIR, tempPromptName);

                    await writeFile(tempHtmlPath, code, "utf-8");
                    await writeFile(tempPromptPath, prompt, "utf-8");
                    console.log(`[Bridge] Data saved. Prompt: ${prompt.length} bytes, HTML: ${code.length} bytes`);

                    // 2. Execute run-task.ts using node --import tsx
                    console.log(`[Bridge] Executing verification via node --import tsx...`);
                    // Prepare environment variables
                    const childEnv = { ...process.env };
                    if (apiKey) {
                        childEnv.ANTHROPIC_API_KEY = apiKey;
                        childEnv.OPENAI_API_KEY = apiKey;
                        childEnv.GEMINI_API_KEY = apiKey;
                        childEnv.GOOGLE_API_KEY = apiKey;
                        childEnv.GOOGLE_GENAI_API_KEY = apiKey;
                        childEnv.MOONSHOT_API_KEY = apiKey;
                    }

                    const proc = spawn("node", [
                        "--import", "tsx",
                        SCRIPT_PATH,
                        "--promptFile", `"${tempPromptPath}"`, // 🔥 Quote path for shell: true
                        "--target", `"${tempHtmlPath}"`,       // 🔥 Quote path for shell: true
                        "--model", model || "claude-3-5-sonnet",
                        "--apiKey", apiKey || ""
                    ], {
                        cwd: OPENCLAW_DIR,
                        shell: true,
                        env: childEnv,
                        stdio: ["ignore", "pipe", "pipe"]
                    });

                    const stdoutChunks = [];
                    const stderrChunks = [];

                    proc.stdout.on("data", (data) => {
                        process.stdout.write(`[Child] ${data}`);
                        stdoutChunks.push(data);
                    });
                    proc.stderr.on("data", (data) => {
                        process.stderr.write(`[Child Err] ${data}`);
                        stderrChunks.push(data);
                    });

                    const exitCode = await new Promise((resolve) => {
                        proc.on("close", (code) => resolve(code));
                    });

                    const stdoutLogs = Buffer.concat(stdoutChunks).toString();
                    const stderrLogs = Buffer.concat(stderrChunks).toString();

                    console.log(`[Bridge] Process exited with code ${exitCode}`);

                    if (exitCode !== 0) {
                        console.error(`[Bridge] Execution failed.`);
                        res.writeHead(500, headers);
                        res.end(JSON.stringify({
                            error: "Execution failed",
                            logs: stderrLogs || stdoutLogs
                        }));
                        return;
                    }

                    // 3. Read result
                    const updatedCode = await readFile(tempHtmlPath, "utf-8");
                    // Original code: let updatedCode = await readFile...
                    // Wait, original had `let updatedCode = await readFile(tempFile, "utf-8");`.
                    // I will keep it simple.

                    res.writeHead(200, headers);
                    res.end(JSON.stringify({
                        correctedCode: updatedCode,
                        logs: stdoutLogs
                    }));

                } catch (err) {
                    console.error("[Bridge] Internal Error:", err);
                    res.writeHead(500, headers);
                    res.end(JSON.stringify({ error: err.message }));
                }
            });
            return;
        }

        res.writeHead(404, headers);
        res.end("Not Found");
    });

const port = process.env.PORT || 3333;
server.listen(port, '0.0.0.0', () => {
    console.log(`Bridge listening on http://0.0.0.0:${port}`);
});
