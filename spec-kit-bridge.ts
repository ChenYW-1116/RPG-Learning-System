
import { serve } from "bun";
import { join, resolve } from "path";
import { writeFile, readFile } from "fs/promises";
import { spawn } from "child_process";

// Configuration (Assuming relative path from script location)
// This script is intended to be run from c:\2026 Tasks\07. Empire\
const OPENCLAW_DIR = resolve("./openclaw-main");
const SCRIPT_PATH = "skills/precise-execution/scripts/run-task.ts"; // Relative to OPENCLAW_DIR

console.log("Starting Spec Kit Bridge Server...");
console.log(`OpenClaw Dir: ${OPENCLAW_DIR}`);
console.log(`Run Task Script: ${SCRIPT_PATH}`);

serve({
    port: 3000,
    async fetch(req) {
        // CORS Headers
        const corsHeaders = {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "POST, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type",
        };

        if (req.method === "OPTIONS") {
            return new Response(null, { headers: corsHeaders });
        }

        if (req.url.endsWith("/verify") && req.method === "POST") {
            try {
                const { code, prompt } = await req.json();

                if (!code) {
                    return new Response(JSON.stringify({ error: "No code provided" }), { status: 400, headers: corsHeaders });
                }

                // 1. Write the code to a temp file in OpenClaw dir
                const tempFileName = `temp_verif_${Date.now()}.html`;
                const tempFile = resolve(OPENCLAW_DIR, tempFileName);

                console.log(`[Bridge] Writing temp file: ${tempFile}`);
                await writeFile(tempFile, code, "utf-8");

                // 2. Execute run-task.ts via Bun
                console.log(`[Bridge] Executing verification command...`);
                console.log(`[Bridge] Prompt: ${prompt.substring(0, 50)}...`);

                // We use spawn to run the command in the OpenClaw directory
                const bunPath = "bun"; // Assuming bun is in PATH

                const proc = spawn(bunPath, [
                    SCRIPT_PATH,
                    "--prompt", prompt,
                    "--target", tempFile,
                    "--model", "claude-3-5-sonnet" // Force high quality model for verification
                ], {
                    cwd: OPENCLAW_DIR,
                    stdio: ["ignore", "pipe", "pipe"]
                });

                const stdoutChunks: any[] = [];
                const stderrChunks: any[] = [];

                proc.stdout.on("data", (data) => stdoutChunks.push(data));
                proc.stderr.on("data", (data) => stderrChunks.push(data));

                const exitCode = await new Promise((resolve) => {
                    proc.on("close", (code) => resolve(code));
                });

                const stdoutLogs = Buffer.concat(stdoutChunks).toString();
                const stderrLogs = Buffer.concat(stderrChunks).toString();

                console.log(`[Bridge] Process exited with code ${exitCode}`);

                if (exitCode !== 0) {
                    console.error(`[Bridge] Error execution logs: ${stderrLogs}`);
                    return new Response(JSON.stringify({
                        error: "Execution failed",
                        logs: stdoutLogs + "\n" + stderrLogs
                    }), { status: 500, headers: corsHeaders });
                }

                // 3. Read the potentially modified file back
                const updatedCode = await readFile(tempFile, "utf-8");

                // Clean up temp file (optional, maybe keep for debug?)
                // await unlink(tempFile); 

                return new Response(JSON.stringify({
                    correctedCode: updatedCode,
                    logs: stdoutLogs
                }), { headers: { "Content-Type": "application/json", ...corsHeaders } });

            } catch (err) {
                console.error("[Bridge] Internal Error:", err);
                return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: corsHeaders });
            }
        }

        return new Response("Not Found", { status: 404, headers: corsHeaders });
    },
});

console.log("Bridge listening on http://localhost:3000");
