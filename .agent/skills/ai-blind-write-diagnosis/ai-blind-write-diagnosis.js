/**
 * AI Blind Write Diagnosis Module
 * 
 * 使用 Gemini API 診斷盲寫表現：
 * - 比對原文與用戶嘗試
 * - 識別關鍵語法/詞彙錯誤
 * - 提供鼓勵性反饋
 * 
 * @module AIBlindWriteDiagnosis
 * @version 1.0.0
 * @skill ai-blind-write-diagnosis
 * @depends gemini-api-wrapper
 */

class AIBlindWriteDiagnosis {
    /**
     * 創建 AI 盲寫診斷器實例
     * @param {GeminiAPIWrapper} geminiApi - Gemini API 實例
     */
    constructor(geminiApi) {
        this.api = geminiApi;
        this.systemPrompt = `You are a supportive IELTS writing tutor analyzing a student's blind writing attempt.

The student memorized the source text and tried to reproduce it from memory.

Your task:
1. Compare the source text with the student's attempt
2. Identify the MOST critical mistake (grammar OR vocabulary)
3. Provide brief, actionable feedback
4. Be encouraging and supportive

Rules:
- Keep your response under 50 words
- Focus on ONE specific issue
- End with encouragement
- Use simple, clear language

Example response:
"Great effort! Watch the verb tense in 'has been increased' - it should be 'has increased' (no passive needed here). Your vocabulary retention is impressive - keep practicing! 💪"`;
    }

    /**
     * 診斷盲寫表現
     * @param {string} source - 原文文本
     * @param {string} attempt - 用戶盲寫嘗試
     * @returns {Promise<string>} 診斷反饋
     * @throws {Error} 當文本為空或 API 調用失敗時拋出錯誤
     */
    async diagnose(source, attempt) {
        if (!source || source.trim().length === 0) {
            throw new Error("Source text cannot be empty");
        }

        if (!attempt || attempt.trim().length === 0) {
            throw new Error("Attempt text cannot be empty");
        }

        const prompt = `Source Text (Original):
${source}

Student's Attempt (From Memory):
${attempt}

Please provide brief diagnostic feedback.`;

        const result = await this.api.call(prompt, this.systemPrompt, false);
        return result;
    }

    /**
     * 創建帶有 UI 更新的診斷函數（適用於直接嵌入主程式）
     * @param {GeminiAPIWrapper} geminiApi - Gemini API 實例
     * @returns {Function} 診斷函數
     */
    static createSnippet(geminiApi) {
        return async function diagnoseBlindWrite(source, attempt) {
            const diagLoader = document.getElementById('diagnosisLoader');
            const diagContent = document.getElementById('diagnosisContent');

            if (diagLoader) diagLoader.classList.remove('hidden');

            try {
                const sys = `Compare the source and user attempt. 
                    Briefly point out the most critical grammar or vocabulary mistake. 
                    Keep it under 50 words. Be encouraging.`;

                const result = await geminiApi.call(
                    `Source: ${source}\nAttempt: ${attempt}`,
                    sys,
                    false
                );

                if (diagContent) diagContent.innerText = result;
                return result;
            } catch (e) {
                const fallbackMessage = "暫時無法連接 AI 診斷，請稍後再試。";
                if (diagContent) diagContent.innerText = fallbackMessage;
                return fallbackMessage;
            } finally {
                if (diagLoader) diagLoader.classList.add('hidden');
            }
        };
    }
}

// Export for ES Module
export { AIBlindWriteDiagnosis };

// Export for CommonJS / Browser global
if (typeof window !== 'undefined') {
    window.AIBlindWriteDiagnosis = AIBlindWriteDiagnosis;
}
