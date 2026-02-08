
import { parseArgs } from "util";
import { runEmbeddedPiAgent } from "../../../src/agents/pi-embedded-runner/run.ts";
import { loadConfig } from "../../../src/config/config.ts";
import { defaultRuntime } from "../../../src/runtime.ts";
import { resolveAgentWorkspaceDir, resolveAgentDir } from "../../../src/agents/agent-scope.ts";
import * as fs from "node:fs/promises";

import * as path from "node:path";

async function main() {
    const { values } = parseArgs({
        args: process.argv.slice(2),
        options: {
            prompt: { type: "string" },
            promptFile: { type: "string" }, // 🔥 NEW: Support for large prompts
            model: { type: "string" },
            apiKey: { type: "string" },
            verbose: { type: "boolean" },
            target: { type: "string" },
        },
        strict: true,
        allowPositionals: true,
    });

    let prompt = values.prompt || "";

    // 🔥 FIX: Handle unquoted paths with spaces (reconstruct from positionals)
    const { existsSync } = await import("node:fs");

    async function reconstructPath(initialPath: string, extraArgs: string[]): Promise<string> {
        if (!initialPath) return initialPath;
        if (existsSync(initialPath)) return initialPath;

        const candidates = [initialPath];
        let current = initialPath;

        // Try appending positionals one by one
        for (const arg of extraArgs) {
            current = `${current} ${arg}`;
            candidates.push(current);
            if (existsSync(current)) {
                console.log(`[run-task] 🔧 Auto-reconstructed path: "${current}"`);
                return current;
            }
        }

        return initialPath; // Return original if reconstruction fails
    }

    // Clean path helper
    const cleanPath = (p: string) => p ? p.replace(/^['"]|['"]$/g, '').trim() : "";

    if (values.promptFile) {
        // @ts-ignore - positionals is available in recent node versions of parseArgs but types might be lagging
        const extraArgs = (parseArgs({ args: process.argv.slice(2), strict: false }).positionals || []).filter(p => !p.startsWith('-'));
        values.promptFile = await reconstructPath(cleanPath(values.promptFile), extraArgs);
    }

    if (values.target) {
        // @ts-ignore
        const extraArgs = (parseArgs({ args: process.argv.slice(2), strict: false }).positionals || []).filter(p => !p.startsWith('-'));
        values.target = await reconstructPath(cleanPath(values.target), extraArgs);
    }

    // 🔥 If promptFile is provided, read the full content (bypasses CMD length limits)
    if (values.promptFile) {
        try {
            prompt = await fs.readFile(values.promptFile, "utf-8");
            console.log(`[run-task] Prompt loaded from file: ${values.promptFile} (${prompt.length} bytes)`);
        } catch (err) {
            console.error(`Error reading prompt file:`, err);
            process.exit(1);
        }
    }

    if (!prompt) {
        console.error("Error: --prompt or --promptFile is required");
        process.exit(1);
    }

    let fileContent = "";
    if (values.target) {
        try {
            fileContent = await fs.readFile(values.target, "utf-8");
            console.log(`Loaded target file: ${values.target} (${fileContent.length} bytes)`);
        } catch (err) {
            console.error(`Error reading target file ${values.target}:`, err);
            process.exit(1);
        }
    }

    console.log("Initializing Precise Execution Agent...");
    console.log("Context: Hybrid Memory + CoT Enforced");

    // 🔥 DETECT ACTIVE SKILLS FROM PROMPT (Robust Regex)
    console.log(`[run-task] Prompt length: ${prompt.length} chars`);

    const skillRegex = /ACTIVE SKILL:\s*([\w\- ]+)/gi;
    const activeSkills: string[] = [];
    let match;
    while ((match = skillRegex.exec(prompt)) !== null) {
        const skillName = match[1].trim();
        if (!activeSkills.includes(skillName)) {
            activeSkills.push(skillName);
        }
    }

    if (activeSkills.length > 0) {
        console.log(`\x1b[32m[SKILLS] Active Knowledge Base: ${activeSkills.join(", ")}\x1b[0m`);
    } else {
        console.log(`\x1b[33m[SKILLS] No specific additional skills detected in prompt.\x1b[0m`);
    }

    // Load config
    const config = loadConfig();

    const sessionId = `precise-run-${Date.now()}`;
    const agentId = "main";

    let agentDir = resolveAgentDir(config, agentId);
    let workspaceDir = resolveAgentWorkspaceDir(config, agentId);

    // Fallback logic
    if (!agentDir) {
        agentDir = path.join(process.cwd(), ".openclaw", "agents", agentId);
    }
    if (!workspaceDir) {
        workspaceDir = process.cwd();
    }

    // Construct session file path explicitly to avoid undefined error
    const sessionFile = path.join(agentDir, "sessions", `${sessionId}.jsonl`);

    // Ensure session directory exists
    try {
        await fs.mkdir(path.dirname(sessionFile), { recursive: true });
    } catch (e) {
        // ignore if exists
    }

    let effectivePrompt = prompt;
    if (fileContent) {
        effectivePrompt += `\n\n--- TARGET FILE CONTENT (${values.target}) ---\n${fileContent}\n\n--- CRITICAL VERIFICATION INSTRUCTIONS ---
You MUST perform a thorough analysis of the HTML file above before responding. Follow these steps:

**STEP 1: UI Content Verification (MANDATORY)**
Check if the UI has ACTUAL visible content, not just empty placeholders:
- [ ] Does the HTML contain actual text labels, not just empty strings?
- [ ] Are there visible UI elements with meaningful content?
- [ ] Do form inputs have proper labels and placeholders with real text?
- [ ] Are CSS styles properly applied (not all white/blank)?

**STEP 2: Functional Requirements Check**
Based on the original prompt requirements:
- [ ] Does the generated code implement ALL requested features?
- [ ] Are interactive elements (buttons, inputs) properly connected to event handlers?
- [ ] Does the state management logic exist and work correctly?

**STEP 3: Visual Rendering Check**
Simulate what a user would SEE when opening this file:
- [ ] Would elements be visible (not hidden, 0 opacity, or off-screen)?
- [ ] Are there proper colors and contrasts (not all white on white)?
- [ ] Would the layout render correctly with proper spacing?

**STEP 4: EXECUTION FLOW VERIFICATION (CRITICAL - Anti-Hallucination)**
Trace the ACTUAL execution path when the page loads:
- [ ] Is there a clear entry point that runs automatically (DOMContentLoaded, window.onload, or immediate invocation)?
- [ ] Are ALL initialization functions ACTUALLY CALLED, not just defined?
- [ ] Follow the call chain: Does every function that sets up event listeners get invoked from the entry point?
- [ ] Check for "dead functions": functions defined but never called in the execution path
- [ ] If a function depends on being called by external code (like a test runner), is there ALSO a standalone initialization?

COMMON BUG PATTERN TO DETECT:
\`\`\`javascript
// BAD: setupListeners() is only called inside injectTestRunner()
// injectTestRunner() requires external runner parameter and is never called
function injectTestRunner(runner) {
    // ...tests...
    setupListeners();  // ❌ This will NEVER execute!
}

// CORRECT: setupListeners() must be called at page load
document.addEventListener('DOMContentLoaded', setupListeners);
\`\`\`

**CRITICAL FAILURE CONDITIONS (automatic FAIL):**
1. If ALL text content areas are empty or contain only whitespace
2. If major UI sections are invisible or have no rendered content
3. If CSS styles result in a blank/white page
4. If required functionality (per original prompt) is completely missing
5. **NEW**: If initialization/setup functions are DEFINED but NOT CALLED at page load

**YOUR RESPONSE:**
- If ANY critical failure is found, output the CORRECTED full file content in a code block
- ONLY say "PASS" if the file genuinely implements ALL requirements with VISIBLE, WORKING UI
- When in doubt, provide the corrected code rather than passing a broken file`;
    }

    // Parse primary model from config or command line (format: "provider/model" or just "model")
    const primaryModelConfig = config.agents?.defaults?.model?.primary;
    let modelId = values.model;
    let provider: string | undefined;

    // Handle "provider/model" format from command line (e.g., "moonshotai/Kimi-K2-Instruct")
    if (modelId && modelId.includes('/')) {
        const parts = modelId.split('/');
        // Check if first part looks like a provider (common patterns)
        const firstPart = parts[0].toLowerCase();
        if (firstPart.includes('moonshot') || firstPart === 'google' || firstPart === 'anthropic' || firstPart === 'openai') {
            provider = parts[0];
            modelId = parts.slice(1).join('/');
        }
    }

    // If no model from CLI, try config
    if (!modelId && primaryModelConfig && typeof primaryModelConfig === 'string') {
        if (primaryModelConfig.includes('/')) {
            const parts = primaryModelConfig.split('/');
            provider = parts[0];
            modelId = parts.slice(1).join('/');
        } else {
            modelId = primaryModelConfig;
        }
    }
    modelId = modelId || "claude-3-5-sonnet";

    // Auto-detect provider based on model ID strings (case-insensitive)
    const modelIdLower = modelId.toLowerCase();
    const providerLower = (provider || '').toLowerCase();

    if (modelIdLower.includes("gemini")) {
        provider = "google";
    } else if (modelIdLower.includes("moonshot") || modelIdLower.includes("kimi") || providerLower.includes("moonshot")) {
        provider = "moonshot";
    } else if (modelIdLower.includes("claude") || modelIdLower.includes("opus") || modelIdLower.includes("sonnet") || modelIdLower.includes("haiku")) {
        provider = "anthropic";
    }

    // Fallback to anthropic if still not set
    if (!provider) {
        provider = "anthropic";
    }

    // 🔥 HANDLE API KEY INJECTION & ROTATION
    let apiKeys: string[] = [];
    if (values.apiKey) {
        apiKeys = values.apiKey.split(',').map(k => k.trim()).filter(k => k.length > 0);
    }

    // Attempt to load from local keys.json if exists
    try {
        const keysPath = path.join(await resolveAgentWorkspaceDir(), "api_keys.json");
        if (await fs.stat(keysPath).catch(() => false)) {
            const keysContent = await fs.readFile(keysPath, 'utf-8');
            const keysConfig = JSON.parse(keysContent);
            const providerKeys = keysConfig[provider || 'google'];
            if (Array.isArray(providerKeys)) {
                apiKeys.push(...providerKeys);
                console.log(`[run-task] Loaded ${providerKeys.length} backup keys from api_keys.json`);
            }
        }
    } catch (e) { /* ignore */ }

    // Remove duplicates
    apiKeys = [...new Set(apiKeys)];

    if (apiKeys.length === 0 && values.apiKey) apiKeys.push(values.apiKey);

    console.log(`[run-task] Prepared ${apiKeys.length} API keys for provider: ${provider}`);

    let lastError: any;
    let result: any = null;

    for (const currentKey of apiKeys) {
        if (currentKey) console.log(`[run-task] 🔄 Attempting execution with Key ending in ...${currentKey.slice(-4)}`);

        // Inject into Environment
        if (provider === 'google') {
            process.env.GOOGLE_API_KEY = currentKey;
            process.env.GEMINI_API_KEY = currentKey;
        } else if (provider === 'moonshot') {
            process.env.MOONSHOT_API_KEY = currentKey;
        } else if (provider === 'anthropic') {
            process.env.ANTHROPIC_API_KEY = currentKey;
        } else if (provider === 'openai') {
            process.env.OPENAI_API_KEY = currentKey;
        }

        // Inject into Config object (Runtime override) if available
        // @ts-ignore
        if (typeof config !== 'undefined') {
            // @ts-ignore
            if (!config.apiKeys) config.apiKeys = {};
            // @ts-ignore
            config.apiKeys[provider] = currentKey;

            /* @ts-ignore */
            /* Legacy config path */
            if (!config.models) config.models = {};
            /* @ts-ignore */
            if (!config.models[provider]) config.models[provider] = {};
            /* @ts-ignore */
            config.models[provider].apiKey = currentKey;
        }

        try {
            console.log(`[run-task] Resolved: provider=${provider}, modelId=${modelId}`);

            // @ts-ignore
            result = await runEmbeddedPiAgent({
                // @ts-ignore
                runId: typeof sessionId !== 'undefined' ? sessionId : "temp_session",
                // @ts-ignore
                sessionId: typeof sessionId !== 'undefined' ? sessionId : "temp_session",
                // @ts-ignore
                sessionKey: typeof agentId !== 'undefined' ? `${agentId}:${sessionId}` : "default:session",
                // @ts-ignore
                sessionFile: typeof sessionFile !== 'undefined' ? sessionFile : undefined,
                prompt: effectivePrompt,
                // @ts-ignore
                config: typeof config !== 'undefined' ? config : {},
                // @ts-ignore
                agentDir: typeof agentDir !== 'undefined' ? agentDir : process.cwd(),
                // @ts-ignore
                workspaceDir: typeof workspaceDir !== 'undefined' ? workspaceDir : process.cwd(),
                thinkLevel: "high",
                reasoningLevel: "on",
                provider,
                model: modelId,
                timeoutMs: 180000,
                verboseLevel: (values.verbose || values.target) ? "full" : "on",
                shouldEmitToolOutput: () => true,
                shouldEmitToolResult: () => true,
                interactive: false,
                htmlPreviewTarget: values.target,
                initialPrompt: effectivePrompt
            }, defaultRuntime);

            // If successful, break the loop
            console.log(`[run-task] ✅ Execution successful with key ending in ...${currentKey ? currentKey.slice(-4) : 'DEFAULT'}`);
            break;

        } catch (error: any) {
            lastError = error;
            const errorMsg = error?.message || String(error);
            console.error(`[run-task] ❌ Error with key ...${currentKey ? currentKey.slice(-4) : 'DEFAULT'}: ${errorMsg}`);

            // Only retry on Quota/Rate Limit/Auth errors
            const isQuotaError = errorMsg.includes("429") ||
                errorMsg.includes("quota") ||
                errorMsg.includes("billing") ||
                errorMsg.includes("403") ||
                errorMsg.includes("401");

            if (!isQuotaError) {
                console.error("[run-task] Non-quota error, aborting retries.");
                break;
            }
            console.log("[run-task] ⚠️ Quota/Auth error detected. Switching to next key...");
        }
    }

    if (!result) {
        console.error("[run-task] 💥 All API keys failed or execution aborted.");
        if (lastError) console.error("Last Error:", lastError);
        process.exit(1);
    }

    let finalResponseText = "";
    if (result.payloads && result.payloads.length > 0) {
        console.log("\n--- Final Response ---\n");
        for (const payload of result.payloads) {
            if (payload.text) {
                console.log(payload.text);
                finalResponseText += payload.text;
            }
        }
    } else {
        console.log("\nNo text response generated.");
    }

    if (result.meta?.error) {
        console.error("\nExecution Error:", result.meta.error);
        process.exit(1);
    }

    if (values.target && finalResponseText) {
        const codeBlockRegex = /```(?:\w+)?\s*([\s\S]*?)```/g;
        let match;
        let lastCodeBlock = null;

        while ((match = codeBlockRegex.exec(finalResponseText)) !== null) {
            lastCodeBlock = match[1];
        }

        if (lastCodeBlock) {
            // Enhanced validation for the corrected code
            const codeContent = lastCodeBlock.trim();
            const hasHtmlStructure = codeContent.includes("<!DOCTYPE") || codeContent.includes("<html");
            const hasVisibleContent = codeContent.includes("<body") &&
                (codeContent.match(/>[\u4e00-\u9fff\w\s]{5,}</g)?.length || 0) > 3; // At least 3 text elements with 5+ chars
            const hasStyles = codeContent.includes("<style") || codeContent.includes("class=");
            const isNotJustPass = !codeContent.toUpperCase().includes("PASS") || codeContent.length > 200;
            const minValidLength = 500; // A proper HTML file should be at least 500 bytes

            console.log(`\n[Auto-Fix] Code Analysis:`);
            console.log(`  - Length: ${codeContent.length} bytes (min: ${minValidLength})`);
            console.log(`  - Has HTML structure: ${hasHtmlStructure}`);
            console.log(`  - Has visible content: ${hasVisibleContent}`);
            console.log(`  - Has styles: ${hasStyles}`);

            if (codeContent.length >= minValidLength && hasHtmlStructure && isNotJustPass) {
                if (!hasVisibleContent) {
                    console.warn("[Auto-Fix] ⚠️ WARNING: Code may lack visible text content. Proceeding with caution...");
                }
                console.log(`\n[Auto-Fix] ✅ Detected valid code block (${codeContent.length} bytes). Overwriting ${values.target}...`);
                await fs.writeFile(values.target, codeContent, "utf-8");
                console.log("[Auto-Fix] File updated successfully.");
            } else {
                console.log("\n[Auto-Fix] ❌ Code block validation FAILED:");
                if (codeContent.length < minValidLength) console.log(`  - Too short: ${codeContent.length} < ${minValidLength}`);
                if (!hasHtmlStructure) console.log("  - Missing HTML structure (<!DOCTYPE or <html>)");
                if (!isNotJustPass) console.log("  - Appears to be just a PASS message");
                console.log("[Auto-Fix] Skipping write to prevent corrupting target file.");
            }
        } else {
            if (finalResponseText.toUpperCase().includes("PASS")) {
                console.log("\n[Auto-Fix] ✅ Verification Passed. No changes made.");
            } else {
                console.log("\n[Auto-Fix] ⚠️ No code block found in response. Skipping write.");
                console.log("[Auto-Fix] Response preview:", finalResponseText.substring(0, 200) + "...");
            }
        }
    }
}

main().catch((err) => {
    console.error("Fatal Error:", err);
    process.exit(1);
});
