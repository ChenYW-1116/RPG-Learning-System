/**
 * AI Essay Analyzer Module
 * 
 * 使用 Gemini API 對雅思範文進行深度分析：
 * - 識別被動句 (Grammar Range)
 * - 提取高級詞彙 (Lexical Resource)
 * - 預估雅思分數
 * 
 * @module AIEssayAnalyzer
 * @version 1.0.0
 * @skill ai-essay-analyzer
 * @depends gemini-api-wrapper
 */

class AIEssayAnalyzer {
    /**
     * 創建 AI 範文分析器實例
     * @param {GeminiAPIWrapper} geminiApi - Gemini API 實例
     */
    constructor(geminiApi) {
        this.api = geminiApi;
        this.systemPrompt = `You are an IELTS expert. Analyze the essay thoroughly.
Return JSON format:
{
    "passive_sentences": ["sentence1", "sentence2"],
    "advanced_verbs": [
        {"word": "elucidate", "meaning": "to explain clearly"},
        {"word": "mitigate", "meaning": "to reduce severity"}
    ],
    "passive_ratio": 0.15,
    "score_estimate": "7.5"
}

Rules:
1. passive_sentences: List all sentences using passive voice
2. advanced_verbs: Extract 5-8 advanced academic verbs with meanings
3. passive_ratio: Calculate as (passive sentences count / total sentences)
4. score_estimate: Estimate IELTS band score (5.0-9.0) based on grammar and vocabulary`;
    }

    /**
     * 分析範文
     * @param {string} text - 範文文本
     * @returns {Promise<AnalysisResult>} 分析結果
     * @throws {Error} 當文本為空或 API 調用失敗時拋出錯誤
     */
    async analyze(text) {
        if (!text || text.trim().length === 0) {
            throw new Error("Essay text cannot be empty");
        }

        if (text.trim().split(/\s+/).length < 50) {
            throw new Error("Essay should be at least 50 words for meaningful analysis");
        }

        const result = await this.api.call(`Analyze this IELTS essay:\n\n${text}`, this.systemPrompt, true);

        // 驗證結果結構
        if (!result.passive_sentences || !result.advanced_verbs) {
            throw new Error("Invalid analysis result structure");
        }

        return result;
    }
}

/**
 * @typedef {Object} AnalysisResult
 * @property {string[]} passive_sentences - 被動句列表
 * @property {VerbEntry[]} advanced_verbs - 高級動詞列表
 * @property {number} passive_ratio - 被動句比例 (0-1)
 * @property {string} score_estimate - 預估分數
 */

/**
 * @typedef {Object} VerbEntry
 * @property {string} word - 動詞
 * @property {string} meaning - 中文含義
 */

// Export for ES Module
export { AIEssayAnalyzer };

// Export for CommonJS / Browser global
if (typeof window !== 'undefined') {
    window.AIEssayAnalyzer = AIEssayAnalyzer;
}
