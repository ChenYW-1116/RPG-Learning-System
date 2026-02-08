/**
 * AI Essay Rewriter Module
 * 
 * 使用 Gemini API 將用戶的雅思文章改寫為 Band 9 水準：
 * - 提升詞彙資源 (Lexical Resource)
 * - 增強語法範圍 (Grammatical Range)
 * - 保持原意不變
 * 
 * @module AIEssayRewriter
 * @version 1.0.0
 * @skill ai-essay-rewriter
 * @depends gemini-api-wrapper
 */

class AIEssayRewriter {
    /**
     * 創建 AI 高階文章改寫器實例
     * @param {GeminiAPIWrapper} geminiApi - Gemini API 實例
     */
    constructor(geminiApi) {
        this.api = geminiApi;
        this.systemPrompt = `You are an expert IELTS writing tutor specializing in Band 9 essays.

Rewrite the user's essay to achieve Band 9 standard by:

1. **Lexical Resource Enhancement**:
   - Replace common words with sophisticated academic vocabulary
   - Use precise collocations and idiomatic expressions
   - Demonstrate awareness of style and register

2. **Grammatical Range Improvement**:
   - Use a variety of complex sentence structures
   - Incorporate advanced grammatical features (inversion, cleft sentences, etc.)
   - Ensure error-free grammar

3. **Coherence and Cohesion**:
   - Use sophisticated linking devices
   - Ensure logical flow between ideas
   - Maintain clear paragraphing

Return the rewritten essay as raw text, preserving the original meaning and structure.`;
    }

    /**
     * 改寫文章至 Band 9 水準
     * @param {string} text - 原文
     * @returns {Promise<string>} 改寫後的文本
     * @throws {Error} 當文本為空或 API 調用失敗時拋出錯誤
     */
    async rewrite(text) {
        if (!text || text.trim().length === 0) {
            throw new Error("Essay text cannot be empty");
        }

        if (text.trim().split(/\s+/).length < 30) {
            throw new Error("Essay should be at least 30 words for meaningful rewriting");
        }

        const result = await this.api.call(
            `Please rewrite this essay to Band 9 standard:\n\n${text}`,
            this.systemPrompt,
            false
        );

        return result;
    }
}

// Export for ES Module
export { AIEssayRewriter };

// Export for CommonJS / Browser global
if (typeof window !== 'undefined') {
    window.AIEssayRewriter = AIEssayRewriter;
}
