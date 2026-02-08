/**
 * AI Inspiration Generator Module
 * 
 * 使用 Gemini API 根據雅思作文題目生成：
 * - 正面觀點 (Pros)
 * - 反面觀點 (Cons)
 * - 學術詞彙 (Academic Vocabulary)
 * 
 * @module AIInspirationGenerator
 * @version 1.0.0
 * @skill ai-inspiration-generator
 * @depends gemini-api-wrapper
 */

class AIInspirationGenerator {
    /**
     * 創建 AI 寫作靈感生成器實例
     * @param {GeminiAPIWrapper} geminiApi - Gemini API 實例
     */
    constructor(geminiApi) {
        this.api = geminiApi;
        this.systemPrompt = `You are an IELTS writing expert helping students brainstorm ideas.

For the given topic, provide:

1. **3 Pros (Supporting Arguments)**:
   - Each argument should be specific and substantive
   - Include potential examples or evidence
   - Focus on commonly accepted viewpoints

2. **3 Cons (Opposing Arguments)**:
   - Each argument should be specific and substantive
   - Include potential examples or evidence
   - Consider counter-arguments

3. **5 Academic Vocabulary Words**:
   - Relevant to the topic
   - Band 7+ level vocabulary
   - Include usage examples in complete sentences

Return JSON format:
{
    "pros": [
        "Argument 1 with brief explanation",
        "Argument 2 with brief explanation",
        "Argument 3 with brief explanation"
    ],
    "cons": [
        "Counter-argument 1 with brief explanation",
        "Counter-argument 2 with brief explanation",
        "Counter-argument 3 with brief explanation"
    ],
    "vocab": [
        {"word": "ameliorate", "usage": "Governments can ameliorate the situation by investing in public transportation."},
        {"word": "detrimental", "usage": "This approach may prove detrimental to local businesses."}
    ]
}`;
    }

    /**
     * 生成議題靈感
     * @param {string} topic - 作文題目
     * @returns {Promise<InspirationResult>} 靈感內容
     * @throws {Error} 當題目為空或 API 調用失敗時拋出錯誤
     */
    async generate(topic) {
        if (!topic || topic.trim().length === 0) {
            throw new Error("Topic cannot be empty");
        }

        if (topic.trim().length < 10) {
            throw new Error("Topic should be more descriptive (at least 10 characters)");
        }

        const result = await this.api.call(
            `Generate brainstorming ideas for this IELTS topic:\n\n${topic}`,
            this.systemPrompt,
            true
        );

        // 驗證結果結構
        if (!result.pros || !result.cons || !result.vocab) {
            throw new Error("Invalid inspiration result structure");
        }

        return result;
    }
}

/**
 * @typedef {Object} InspirationResult
 * @property {string[]} pros - 正面觀點列表
 * @property {string[]} cons - 反面觀點列表
 * @property {VocabEntry[]} vocab - 主題詞彙列表
 */

/**
 * @typedef {Object} VocabEntry
 * @property {string} word - 詞彙
 * @property {string} usage - 用法示例
 */

// Export for ES Module
export { AIInspirationGenerator };

// Export for CommonJS / Browser global
if (typeof window !== 'undefined') {
    window.AIInspirationGenerator = AIInspirationGenerator;
}
