/**
 * Text Summarization Service
 *
 * This service provides intelligent text summarization using OpenRouter API
 * with DeepSeek V3.1 model, optimized for Korean language support.
 *
 * Features:
 * - Multiple summarization modes (brief, standard, detailed)
 * - Korean language optimization
 * - Structured output with key points
 * - Long text handling with chunking
 * - Quality validation and retry logic
 */

class TextSummarizationService {
    constructor(openRouterClient, config = {}) {
        this.client = openRouterClient;
        this.config = {
            defaultMode: config.defaultMode || 'standard',
            maxChunkSize: config.maxChunkSize || 3000,
            minSummaryLength: config.minSummaryLength || 50,
            maxSummaryLength: config.maxSummaryLength || 2000,
            language: config.language || 'korean',
            includeKeyPoints: config.includeKeyPoints !== false,
            structuredOutput: config.structuredOutput !== false,
            ...config
        };

        // Summarization modes configuration
        this.modes = {
            brief: {
                maxTokens: 300,
                temperature: 0.2,
                summaryRatio: 0.1, // 10% of original length
                description: '핵심 내용만 간단히'
            },
            standard: {
                maxTokens: 800,
                temperature: 0.3,
                summaryRatio: 0.2, // 20% of original length
                description: '주요 내용을 균형있게'
            },
            detailed: {
                maxTokens: 1500,
                temperature: 0.3,
                summaryRatio: 0.3, // 30% of original length
                description: '상세한 내용 포함'
            }
        };

        // Quality metrics tracking
        this.qualityMetrics = {
            totalSummarizations: 0,
            averageCompressionRatio: 0,
            averageProcessingTime: 0,
            userSatisfactionRatings: []
        };
    }

    /**
     * Get system prompt for summarization
     */
    getSystemPrompt(mode, language = 'korean') {
        const modeConfig = this.modes[mode] || this.modes.standard;

        if (language === 'korean') {
            return `당신은 전문적인 문서 요약 AI입니다. 다음 지침을 엄격히 따라주세요:

**요약 모드**: ${mode} (${modeConfig.description})
**목표 길이**: 원문의 약 ${Math.round(modeConfig.summaryRatio * 100)}%

**요약 원칙**:
1. 핵심 정보와 중요한 논점만 추출
2. 원문의 논리적 흐름과 구조 유지
3. 객관적이고 정확한 정보만 포함
4. 불필요한 세부사항이나 반복 내용 제거
5. 명확하고 이해하기 쉬운 한국어로 작성

**출력 형식**:
\`\`\`
## 📋 요약

[핵심 내용을 ${mode === 'brief' ? '2-3개 문단' : mode === 'standard' ? '3-5개 문단' : '5-8개 문단'}으로 요약]

## 🔑 핵심 포인트

• [주요 포인트 1]
• [주요 포인트 2]
• [주요 포인트 3]
${mode !== 'brief' ? '• [주요 포인트 4]\n• [주요 포인트 5]' : ''}

${mode === 'detailed' ? '## 📊 상세 분석\n\n[추가적인 분석이나 통찰]' : ''}
\`\`\`

**중요**: 반드시 위 형식을 정확히 따르고, 한국어로만 작성하세요.`;
        } else {
            return `You are a professional document summarization AI. Follow these guidelines strictly:

**Summarization Mode**: ${mode} (${modeConfig.description})
**Target Length**: Approximately ${Math.round(modeConfig.summaryRatio * 100)}% of original

**Principles**:
1. Extract only core information and key arguments
2. Maintain logical flow and structure of original
3. Include only objective and accurate information
4. Remove unnecessary details and repetitive content
5. Write in clear, understandable language

**Output Format**:
\`\`\`
## 📋 Summary

[Core content summarized in ${mode === 'brief' ? '2-3 paragraphs' : mode === 'standard' ? '3-5 paragraphs' : '5-8 paragraphs'}]

## 🔑 Key Points

• [Key point 1]
• [Key point 2]
• [Key point 3]
${mode !== 'brief' ? '• [Key point 4]\n• [Key point 5]' : ''}

${mode === 'detailed' ? '## 📊 Detailed Analysis\n\n[Additional analysis or insights]' : ''}
\`\`\`

**Important**: Follow the format exactly and maintain consistency.`;
        }
    }

    /**
     * Preprocess text for better summarization
     */
    preprocessText(text) {
        // Remove excessive whitespace
        text = text.replace(/\s+/g, ' ').trim();

        // Remove page numbers, headers, footers (common PDF artifacts)
        text = text.replace(/^[\d\s]*페이지.*$/gm, '');
        text = text.replace(/^Page\s+\d+.*$/gm, '');
        text = text.replace(/^\d+\s*$/gm, '');

        // Fix broken sentences from PDF parsing
        text = text.replace(/([가-힣])\s+([가-힣])/g, '$1$2');
        text = text.replace(/(\w)\s+(\w)/g, '$1$2');

        // Normalize punctuation
        text = text.replace(/[""]/g, '"');
        text = text.replace(/['']/g, "'");
        text = text.replace(/…/g, '...');

        return text;
    }

    /**
     * Validate summary quality
     */
    validateSummary(original, summary, mode) {
        const issues = [];

        // Check minimum length
        if (summary.length < this.config.minSummaryLength) {
            issues.push('Summary too short');
        }

        // Check maximum length
        if (summary.length > this.config.maxSummaryLength) {
            issues.push('Summary too long');
        }

        // Check compression ratio
        const compressionRatio = summary.length / original.length;
        const expectedRatio = this.modes[mode].summaryRatio;

        if (compressionRatio > expectedRatio * 2) {
            issues.push('Summary not compressed enough');
        }

        // Check for required format elements
        if (this.config.structuredOutput) {
            if (!summary.includes('## 📋')) {
                issues.push('Missing summary section');
            }
            if (!summary.includes('## 🔑')) {
                issues.push('Missing key points section');
            }
        }

        // Check for repetitive content
        const sentences = summary.split(/[.!?。！？]/);
        const uniqueSentences = new Set(sentences.map(s => s.trim().toLowerCase()));
        if (sentences.length - uniqueSentences.size > 2) {
            issues.push('Contains repetitive content');
        }

        return {
            isValid: issues.length === 0,
            issues: issues,
            compressionRatio: compressionRatio,
            length: summary.length
        };
    }

    /**
     * Summarize single chunk of text
     */
    async summarizeChunk(text, mode = 'standard', options = {}) {
        const modeConfig = this.modes[mode] || this.modes.standard;
        const systemPrompt = this.getSystemPrompt(mode, this.config.language);

        const messages = [
            { role: 'system', content: systemPrompt },
            {
                role: 'user',
                content: `다음 텍스트를 ${mode} 모드로 요약해주세요:\n\n${text}`
            }
        ];

        const requestOptions = {
            maxTokens: modeConfig.maxTokens,
            temperature: modeConfig.temperature,
            topP: 0.9,
            frequencyPenalty: 0.3,
            presencePenalty: 0.1,
            ...options
        };

        let attempts = 0;
        const maxAttempts = 3;

        while (attempts < maxAttempts) {
            try {
                const response = await this.client.generateCompletion(messages, requestOptions);
                const summary = response.choices[0].message.content;

                // Validate quality
                const validation = this.validateSummary(text, summary, mode);

                if (validation.isValid || attempts === maxAttempts - 1) {
                    return {
                        summary: summary,
                        validation: validation,
                        usage: response.usage,
                        attempts: attempts + 1
                    };
                }

                // Adjust parameters for retry
                if (validation.issues.includes('Summary too short')) {
                    requestOptions.maxTokens = Math.min(requestOptions.maxTokens * 1.5, 2000);
                } else if (validation.issues.includes('Summary too long')) {
                    requestOptions.maxTokens = Math.max(requestOptions.maxTokens * 0.7, 200);
                }

                attempts++;
                console.log(`Retrying summarization (attempt ${attempts + 1}): ${validation.issues.join(', ')}`);

            } catch (error) {
                attempts++;
                if (attempts >= maxAttempts) {
                    throw error;
                }
                console.log(`Summarization error, retrying (attempt ${attempts + 1}): ${error.message}`);
                await new Promise(resolve => setTimeout(resolve, 1000 * attempts));
            }
        }
    }

    /**
     * Combine multiple chunk summaries into final summary
     */
    async combineChunkSummaries(summaries, mode = 'standard', originalLength) {
        const modeConfig = this.modes[mode] || this.modes.standard;

        const combinedText = summaries.map(s => s.summary).join('\n\n---\n\n');

        const systemPrompt = `당신은 여러 개의 부분 요약을 하나의 일관성 있는 최종 요약으로 결합하는 전문가입니다.

**목표**:
- 여러 부분 요약들을 하나의 완전한 요약으로 통합
- 중복 내용 제거 및 논리적 흐름 구성
- ${mode} 모드에 맞는 길이와 상세도 유지
- 일관된 형식으로 출력

**최종 요약 형식**:
\`\`\`
## 📋 전체 요약

[통합된 요약 내용]

## 🔑 핵심 포인트

• [통합된 주요 포인트들]

${mode === 'detailed' ? '## 📊 종합 분석\n\n[전체적인 분석]' : ''}
\`\`\``;

        const messages = [
            { role: 'system', content: systemPrompt },
            {
                role: 'user',
                content: `다음은 긴 문서의 여러 부분을 각각 요약한 결과들입니다. 이를 하나의 완전한 최종 요약으로 통합해주세요:\n\n${combinedText}`
            }
        ];

        const response = await this.client.generateCompletion(messages, {
            maxTokens: modeConfig.maxTokens,
            temperature: 0.2,
            topP: 0.9,
            frequencyPenalty: 0.5,
            presencePenalty: 0.3
        });

        return {
            summary: response.choices[0].message.content,
            usage: response.usage,
            originalChunks: summaries.length,
            totalOriginalLength: originalLength
        };
    }

    /**
     * Main summarization method
     */
    async summarize(text, mode = 'standard', options = {}) {
        const startTime = Date.now();

        try {
            // Preprocess text
            const processedText = this.preprocessText(text);

            // Check if text needs to be chunked
            const estimatedTokens = this.client.estimateTokens(processedText);

            let result;

            if (estimatedTokens <= this.config.maxChunkSize) {
                // Single chunk processing
                result = await this.summarizeChunk(processedText, mode, options);
            } else {
                // Multi-chunk processing
                const chunks = this.client.chunkText(processedText, this.config.maxChunkSize);

                // Show progress for long texts
                if (options.onProgress) {
                    options.onProgress({ phase: 'chunking', chunks: chunks.length });
                }

                const chunkSummaries = [];

                for (let i = 0; i < chunks.length; i++) {
                    if (options.onProgress) {
                        options.onProgress({
                            phase: 'summarizing',
                            current: i + 1,
                            total: chunks.length
                        });
                    }

                    const chunkResult = await this.summarizeChunk(chunks[i], mode, options);
                    chunkSummaries.push(chunkResult);

                    // Small delay between chunks to respect rate limits
                    if (i < chunks.length - 1) {
                        await new Promise(resolve => setTimeout(resolve, 200));
                    }
                }

                if (options.onProgress) {
                    options.onProgress({ phase: 'combining' });
                }

                // Combine chunk summaries
                result = await this.combineChunkSummaries(chunkSummaries, mode, processedText.length);
                result.chunkSummaries = chunkSummaries;
            }

            // Calculate metrics
            const processingTime = Date.now() - startTime;
            const compressionRatio = result.summary.length / processedText.length;

            // Update quality metrics
            this.qualityMetrics.totalSummarizations++;
            this.qualityMetrics.averageCompressionRatio =
                (this.qualityMetrics.averageCompressionRatio * (this.qualityMetrics.totalSummarizations - 1) + compressionRatio) /
                this.qualityMetrics.totalSummarizations;
            this.qualityMetrics.averageProcessingTime =
                (this.qualityMetrics.averageProcessingTime * (this.qualityMetrics.totalSummarizations - 1) + processingTime) /
                this.qualityMetrics.totalSummarizations;

            return {
                ...result,
                metadata: {
                    mode: mode,
                    originalLength: processedText.length,
                    summaryLength: result.summary.length,
                    compressionRatio: compressionRatio,
                    processingTime: processingTime,
                    estimatedTokens: estimatedTokens,
                    chunks: result.chunkSummaries ? result.chunkSummaries.length : 1
                }
            };

        } catch (error) {
            console.error('Summarization failed:', error);
            throw new Error(`요약 생성 중 오류가 발생했습니다: ${error.message}`);
        }
    }

    /**
     * Stream summarization with real-time updates
     */
    async summarizeStream(text, mode = 'standard', onChunk = null, options = {}) {
        const processedText = this.preprocessText(text);
        const modeConfig = this.modes[mode] || this.modes.standard;
        const systemPrompt = this.getSystemPrompt(mode, this.config.language);

        const messages = [
            { role: 'system', content: systemPrompt },
            {
                role: 'user',
                content: `다음 텍스트를 ${mode} 모드로 요약해주세요:\n\n${processedText}`
            }
        ];

        const requestOptions = {
            maxTokens: modeConfig.maxTokens,
            temperature: modeConfig.temperature,
            topP: 0.9,
            frequencyPenalty: 0.3,
            presencePenalty: 0.1,
            ...options
        };

        return this.client.generateStreamCompletion(messages, requestOptions, onChunk);
    }

    /**
     * Get available summarization modes
     */
    getModes() {
        return Object.keys(this.modes).map(key => ({
            key,
            ...this.modes[key]
        }));
    }

    /**
     * Get quality metrics
     */
    getQualityMetrics() {
        return {
            ...this.qualityMetrics,
            averageCompressionRatio: this.qualityMetrics.averageCompressionRatio.toFixed(3),
            averageProcessingTime: Math.round(this.qualityMetrics.averageProcessingTime),
            averageUserSatisfaction: this.qualityMetrics.userSatisfactionRatings.length > 0
                ? (this.qualityMetrics.userSatisfactionRatings.reduce((a, b) => a + b, 0) / this.qualityMetrics.userSatisfactionRatings.length).toFixed(1)
                : 'N/A'
        };
    }

    /**
     * Add user satisfaction rating
     */
    addUserRating(rating) {
        if (rating >= 1 && rating <= 5) {
            this.qualityMetrics.userSatisfactionRatings.push(rating);
            // Keep only last 100 ratings
            if (this.qualityMetrics.userSatisfactionRatings.length > 100) {
                this.qualityMetrics.userSatisfactionRatings.shift();
            }
        }
    }

    /**
     * Reset quality metrics
     */
    resetMetrics() {
        this.qualityMetrics = {
            totalSummarizations: 0,
            averageCompressionRatio: 0,
            averageProcessingTime: 0,
            userSatisfactionRatings: []
        };
    }
}

// Export for both Node.js and browser environments
if (typeof module !== 'undefined' && module.exports) {
    module.exports = TextSummarizationService;
} else if (typeof window !== 'undefined') {
    window.TextSummarizationService = TextSummarizationService;
}