/**
 * Token Management and Text Chunking Utilities
 *
 * This module provides advanced token counting, text chunking, and cost optimization
 * utilities for efficient API usage with OpenRouter and DeepSeek models.
 *
 * Features:
 * - Accurate token estimation for multiple languages
 * - Intelligent text chunking with context preservation
 * - Cost optimization and budget management
 * - Semantic-aware splitting
 * - Performance monitoring and analytics
 */

class TokenManager {
    constructor(config = {}) {
        this.config = {
            model: config.model || 'deepseek/deepseek-chat',
            maxTokensPerRequest: config.maxTokensPerRequest || 4000,
            reserveTokensForResponse: config.reserveTokensForResponse || 1000,
            overlapTokens: config.overlapTokens || 200,
            costPerToken: config.costPerToken || 0.000001, // DeepSeek pricing
            budgetLimit: config.budgetLimit || null,
            language: config.language || 'korean',
            chunkingStrategy: config.chunkingStrategy || 'semantic',
            ...config
        };

        // Token patterns for different languages
        this.tokenPatterns = {
            korean: {
                // Korean characters count differently
                hangul: /[\uac00-\ud7a3]/g,
                jamo: /[\u3131-\u3163]/g,
                punctuation: /[\u3000-\u303f]/g,
                multiplier: 2.5 // Korean tokens are roughly 2.5 chars
            },
            english: {
                word: /\b\w+\b/g,
                punctuation: /[^\w\s]/g,
                multiplier: 4 // English tokens are roughly 4 chars
            },
            mixed: {
                multiplier: 3 // Conservative estimate for mixed content
            }
        };

        // Sentence boundaries for different languages
        this.sentenceBoundaries = {
            korean: /[.!?。！？][\s]*(?=[A-Z가-힣]|$)/g,
            english: /[.!?][\s]*(?=[A-Z]|$)/g,
            universal: /[.!?。！？]\s+/g
        };

        // Usage tracking
        this.usage = {
            totalTokensUsed: 0,
            totalCost: 0,
            requestCount: 0,
            chunksGenerated: 0,
            averageTokensPerRequest: 0,
            budgetUsed: 0
        };

        // Chunk cache for performance
        this.chunkCache = new Map();
        this.maxCacheSize = config.maxCacheSize || 100;
    }

    /**
     * Estimate token count for text
     */
    estimateTokens(text, language = this.config.language) {
        if (!text || typeof text !== 'string') return 0;

        const patterns = this.tokenPatterns[language] || this.tokenPatterns.mixed;

        if (language === 'korean') {
            const hangulChars = (text.match(patterns.hangul) || []).length;
            const jamoChars = (text.match(patterns.jamo) || []).length;
            const otherChars = text.length - hangulChars - jamoChars;

            // Korean characters are more token-dense
            return Math.ceil(
                (hangulChars / patterns.multiplier) +
                (jamoChars / patterns.multiplier) +
                (otherChars / 4)
            );
        } else if (language === 'english') {
            const words = (text.match(patterns.word) || []).length;
            const punctuation = (text.match(patterns.punctuation) || []).length;

            // Rough estimation: 1.3 tokens per word + punctuation
            return Math.ceil(words * 1.3 + punctuation * 0.5);
        } else {
            // Mixed or unknown language
            return Math.ceil(text.length / patterns.multiplier);
        }
    }

    /**
     * Calculate cost for token count
     */
    calculateCost(tokenCount) {
        return tokenCount * this.config.costPerToken;
    }

    /**
     * Check if operation is within budget
     */
    checkBudget(estimatedTokens) {
        if (!this.config.budgetLimit) return true;

        const estimatedCost = this.calculateCost(estimatedTokens);
        const totalCostAfter = this.usage.totalCost + estimatedCost;

        return totalCostAfter <= this.config.budgetLimit;
    }

    /**
     * Get available token budget
     */
    getAvailableTokens() {
        if (!this.config.budgetLimit) return Infinity;

        const remainingBudget = this.config.budgetLimit - this.usage.totalCost;
        return Math.floor(remainingBudget / this.config.costPerToken);
    }

    /**
     * Detect language of text
     */
    detectLanguage(text) {
        const koreanChars = (text.match(/[\uac00-\ud7a3]/g) || []).length;
        const englishChars = (text.match(/[a-zA-Z]/g) || []).length;
        const totalChars = text.length;

        const koreanRatio = koreanChars / totalChars;
        const englishRatio = englishChars / totalChars;

        if (koreanRatio > 0.3) return 'korean';
        if (englishRatio > 0.7) return 'english';
        return 'mixed';
    }

    /**
     * Split text into sentences
     */
    splitIntoSentences(text, language = null) {
        if (!language) language = this.detectLanguage(text);

        const boundary = this.sentenceBoundaries[language] || this.sentenceBoundaries.universal;

        return text.split(boundary)
            .map(sentence => sentence.trim())
            .filter(sentence => sentence.length > 0);
    }

    /**
     * Split text into paragraphs
     */
    splitIntoParagraphs(text) {
        return text.split(/\n\s*\n/)
            .map(paragraph => paragraph.trim())
            .filter(paragraph => paragraph.length > 0);
    }

    /**
     * Basic chunking strategy
     */
    basicChunking(text, maxTokens) {
        const sentences = this.splitIntoSentences(text);
        const chunks = [];
        let currentChunk = '';
        let currentTokens = 0;

        for (const sentence of sentences) {
            const sentenceTokens = this.estimateTokens(sentence);

            if (currentTokens + sentenceTokens > maxTokens && currentChunk) {
                chunks.push(currentChunk.trim());
                currentChunk = sentence;
                currentTokens = sentenceTokens;
            } else {
                currentChunk += (currentChunk ? ' ' : '') + sentence;
                currentTokens += sentenceTokens;
            }
        }

        if (currentChunk) {
            chunks.push(currentChunk.trim());
        }

        return chunks;
    }

    /**
     * Semantic chunking strategy
     */
    semanticChunking(text, maxTokens) {
        const paragraphs = this.splitIntoParagraphs(text);
        const chunks = [];

        for (const paragraph of paragraphs) {
            const paragraphTokens = this.estimateTokens(paragraph);

            if (paragraphTokens <= maxTokens) {
                // Paragraph fits in one chunk
                if (chunks.length > 0) {
                    const lastChunkTokens = this.estimateTokens(chunks[chunks.length - 1]);
                    if (lastChunkTokens + paragraphTokens <= maxTokens) {
                        // Combine with previous chunk
                        chunks[chunks.length - 1] += '\n\n' + paragraph;
                        continue;
                    }
                }
                chunks.push(paragraph);
            } else {
                // Split paragraph using basic chunking
                const subChunks = this.basicChunking(paragraph, maxTokens);
                chunks.push(...subChunks);
            }
        }

        return chunks;
    }

    /**
     * Sliding window chunking with overlap
     */
    slidingWindowChunking(text, maxTokens, overlapTokens = this.config.overlapTokens) {
        const sentences = this.splitIntoSentences(text);
        const chunks = [];
        let startIndex = 0;

        while (startIndex < sentences.length) {
            let currentChunk = '';
            let currentTokens = 0;
            let endIndex = startIndex;

            // Build chunk from start index
            while (endIndex < sentences.length) {
                const sentence = sentences[endIndex];
                const sentenceTokens = this.estimateTokens(sentence);

                if (currentTokens + sentenceTokens > maxTokens && currentChunk) {
                    break;
                }

                currentChunk += (currentChunk ? ' ' : '') + sentence;
                currentTokens += sentenceTokens;
                endIndex++;
            }

            if (currentChunk) {
                chunks.push(currentChunk.trim());
            }

            // Calculate next start index with overlap
            if (endIndex >= sentences.length) break;

            // Find overlap boundary
            let overlapStart = endIndex;
            let overlapSize = 0;

            while (overlapStart > startIndex && overlapSize < overlapTokens) {
                overlapStart--;
                overlapSize += this.estimateTokens(sentences[overlapStart]);
            }

            startIndex = Math.max(startIndex + 1, overlapStart);
        }

        return chunks;
    }

    /**
     * Hierarchical chunking for long documents
     */
    hierarchicalChunking(text, maxTokens) {
        const totalTokens = this.estimateTokens(text);

        if (totalTokens <= maxTokens) {
            return [text];
        }

        // First try paragraph-level chunking
        const paragraphs = this.splitIntoParagraphs(text);
        let chunks = [];

        for (const paragraph of paragraphs) {
            const paragraphTokens = this.estimateTokens(paragraph);

            if (paragraphTokens <= maxTokens) {
                chunks.push(paragraph);
            } else {
                // Paragraph too large, use sentence-level chunking
                const sentenceChunks = this.semanticChunking(paragraph, maxTokens);
                chunks.push(...sentenceChunks);
            }
        }

        // Merge small adjacent chunks if possible
        const mergedChunks = [];
        let currentMerged = '';
        let currentTokens = 0;

        for (const chunk of chunks) {
            const chunkTokens = this.estimateTokens(chunk);

            if (currentTokens + chunkTokens <= maxTokens) {
                currentMerged += (currentMerged ? '\n\n' : '') + chunk;
                currentTokens += chunkTokens;
            } else {
                if (currentMerged) {
                    mergedChunks.push(currentMerged);
                }
                currentMerged = chunk;
                currentTokens = chunkTokens;
            }
        }

        if (currentMerged) {
            mergedChunks.push(currentMerged);
        }

        return mergedChunks;
    }

    /**
     * Main chunking method with strategy selection
     */
    chunkText(text, options = {}) {
        const {
            maxTokens = this.config.maxTokensPerRequest - this.config.reserveTokensForResponse,
            strategy = this.config.chunkingStrategy,
            preserveContext = true,
            language = null
        } = options;

        // Check cache first
        const cacheKey = `${text.substring(0, 100)}_${maxTokens}_${strategy}`;
        if (this.chunkCache.has(cacheKey)) {
            return this.chunkCache.get(cacheKey);
        }

        let chunks;

        switch (strategy) {
            case 'basic':
                chunks = this.basicChunking(text, maxTokens);
                break;
            case 'semantic':
                chunks = this.semanticChunking(text, maxTokens);
                break;
            case 'sliding':
                chunks = this.slidingWindowChunking(text, maxTokens);
                break;
            case 'hierarchical':
                chunks = this.hierarchicalChunking(text, maxTokens);
                break;
            default:
                chunks = this.semanticChunking(text, maxTokens);
        }

        // Add context preservation if requested
        if (preserveContext && chunks.length > 1) {
            chunks = this.addContextToChunks(chunks, text);
        }

        // Cache result
        if (this.chunkCache.size >= this.maxCacheSize) {
            const firstKey = this.chunkCache.keys().next().value;
            this.chunkCache.delete(firstKey);
        }
        this.chunkCache.set(cacheKey, chunks);

        // Update usage statistics
        this.usage.chunksGenerated += chunks.length;

        return chunks;
    }

    /**
     * Add context information to chunks
     */
    addContextToChunks(chunks, originalText) {
        // Extract document metadata
        const firstParagraph = originalText.split('\n')[0];
        const isDocumentTitle = firstParagraph.length < 100 && !firstParagraph.includes('.');

        return chunks.map((chunk, index) => {
            let contextualChunk = chunk;

            // Add document context to first chunk
            if (index === 0 && isDocumentTitle) {
                contextualChunk = firstParagraph + '\n\n' + chunk;
            }

            // Add positional context
            if (chunks.length > 1) {
                const contextPrefix = `[문서의 ${index + 1}/${chunks.length} 부분]\n\n`;
                contextualChunk = contextPrefix + contextualChunk;
            }

            return contextualChunk;
        });
    }

    /**
     * Optimize chunks for cost efficiency
     */
    optimizeChunks(chunks, targetUtilization = 0.85) {
        const maxTokens = this.config.maxTokensPerRequest - this.config.reserveTokensForResponse;
        const targetTokens = Math.floor(maxTokens * targetUtilization);

        const optimizedChunks = [];
        let currentChunk = '';
        let currentTokens = 0;

        for (const chunk of chunks) {
            const chunkTokens = this.estimateTokens(chunk);

            if (currentTokens + chunkTokens <= targetTokens) {
                currentChunk += (currentChunk ? '\n\n' : '') + chunk;
                currentTokens += chunkTokens;
            } else {
                if (currentChunk) {
                    optimizedChunks.push(currentChunk);
                }
                currentChunk = chunk;
                currentTokens = chunkTokens;
            }
        }

        if (currentChunk) {
            optimizedChunks.push(currentChunk);
        }

        return optimizedChunks;
    }

    /**
     * Record token usage
     */
    recordUsage(tokens, cost = null) {
        this.usage.totalTokensUsed += tokens;
        this.usage.requestCount++;

        if (cost !== null) {
            this.usage.totalCost += cost;
        } else {
            this.usage.totalCost += this.calculateCost(tokens);
        }

        this.usage.averageTokensPerRequest = this.usage.totalTokensUsed / this.usage.requestCount;

        if (this.config.budgetLimit) {
            this.usage.budgetUsed = (this.usage.totalCost / this.config.budgetLimit) * 100;
        }
    }

    /**
     * Get usage statistics
     */
    getUsageStats() {
        return {
            ...this.usage,
            totalCost: parseFloat(this.usage.totalCost.toFixed(6)),
            averageTokensPerRequest: Math.round(this.usage.averageTokensPerRequest),
            budgetUsed: this.usage.budgetUsed ? this.usage.budgetUsed.toFixed(2) + '%' : 'N/A',
            remainingBudget: this.config.budgetLimit
                ? Math.max(0, this.config.budgetLimit - this.usage.totalCost).toFixed(6)
                : 'Unlimited',
            costPerRequest: this.usage.requestCount > 0
                ? (this.usage.totalCost / this.usage.requestCount).toFixed(6)
                : 0,
            efficiency: this.usage.chunksGenerated > 0
                ? (this.usage.requestCount / this.usage.chunksGenerated * 100).toFixed(1) + '%'
                : 'N/A'
        };
    }

    /**
     * Estimate processing cost for text
     */
    estimateProcessingCost(text, summaryMode = 'standard') {
        const inputTokens = this.estimateTokens(text);
        const chunks = this.chunkText(text);

        // Estimate output tokens based on summary mode
        const outputRatios = {
            brief: 0.1,
            standard: 0.2,
            detailed: 0.3
        };

        const outputRatio = outputRatios[summaryMode] || 0.2;
        const estimatedOutputTokens = Math.ceil(inputTokens * outputRatio);

        const totalTokens = inputTokens + estimatedOutputTokens;
        const cost = this.calculateCost(totalTokens);

        return {
            inputTokens,
            estimatedOutputTokens,
            totalTokens,
            estimatedCost: cost,
            chunks: chunks.length,
            withinBudget: this.checkBudget(totalTokens)
        };
    }

    /**
     * Reset usage statistics
     */
    resetUsage() {
        this.usage = {
            totalTokensUsed: 0,
            totalCost: 0,
            requestCount: 0,
            chunksGenerated: 0,
            averageTokensPerRequest: 0,
            budgetUsed: 0
        };
    }

    /**
     * Clear chunk cache
     */
    clearCache() {
        this.chunkCache.clear();
    }

    /**
     * Get optimal chunk size for current configuration
     */
    getOptimalChunkSize(contentType = 'general') {
        const baseSize = this.config.maxTokensPerRequest - this.config.reserveTokensForResponse;

        // Adjust based on content type
        const adjustments = {
            academic: 0.9, // Academic content needs more context
            legal: 0.85,   // Legal content needs careful boundary preservation
            news: 0.95,    // News can be chunked more aggressively
            general: 0.9
        };

        const adjustment = adjustments[contentType] || adjustments.general;
        return Math.floor(baseSize * adjustment);
    }

    /**
     * Validate chunk integrity
     */
    validateChunks(chunks, originalText) {
        const reconstruction = chunks.join(' ').replace(/\s+/g, ' ');
        const original = originalText.replace(/\s+/g, ' ');

        // Check for significant content loss
        const similarity = this.calculateTextSimilarity(reconstruction, original);

        return {
            isValid: similarity > 0.95,
            similarity: similarity,
            contentLoss: 1 - similarity,
            chunksCount: chunks.length,
            averageChunkSize: chunks.reduce((sum, chunk) => sum + this.estimateTokens(chunk), 0) / chunks.length
        };
    }

    /**
     * Calculate text similarity (simple implementation)
     */
    calculateTextSimilarity(text1, text2) {
        const words1 = new Set(text1.toLowerCase().split(/\s+/));
        const words2 = new Set(text2.toLowerCase().split(/\s+/));

        const intersection = new Set([...words1].filter(word => words2.has(word)));
        const union = new Set([...words1, ...words2]);

        return intersection.size / union.size;
    }
}

// Export for both Node.js and browser environments
if (typeof module !== 'undefined' && module.exports) {
    module.exports = TokenManager;
} else if (typeof window !== 'undefined') {
    window.TokenManager = TokenManager;
}