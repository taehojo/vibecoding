/**
 * OpenRouter API Client with DeepSeek V3.1 Integration
 *
 * This module provides a robust client for interacting with OpenRouter API
 * specifically optimized for DeepSeek V3.1 model text summarization tasks.
 *
 * Features:
 * - Automatic retry logic with exponential backoff
 * - Token management and text chunking
 * - Korean text optimization
 * - Error handling and monitoring
 * - Cost-efficient API usage patterns
 */

class OpenRouterClient {
    constructor(config = {}) {
        this.apiKey = config.apiKey || '';
        this.baseUrl = config.baseUrl || 'https://openrouter.ai/api/v1';
        this.model = config.model || 'deepseek/deepseek-chat';
        this.maxRetries = config.maxRetries || 3;
        this.retryDelay = config.retryDelay || 1000;
        this.maxTokensPerRequest = config.maxTokensPerRequest || 4000;
        this.requestTimeout = config.requestTimeout || 60000;

        // Rate limiting
        this.requestQueue = [];
        this.isProcessingQueue = false;
        this.lastRequestTime = 0;
        this.minRequestInterval = config.minRequestInterval || 100; // ms between requests

        // Monitoring
        this.stats = {
            totalRequests: 0,
            successfulRequests: 0,
            failedRequests: 0,
            totalTokensUsed: 0,
            totalCost: 0
        };
    }

    /**
     * Validate API key format
     */
    validateApiKey() {
        if (!this.apiKey) {
            throw new Error('API key is required');
        }
        if (!this.apiKey.startsWith('sk-or-v1-')) {
            throw new Error('Invalid OpenRouter API key format');
        }
    }

    /**
     * Calculate estimated tokens for text (rough approximation)
     */
    estimateTokens(text) {
        // Rough estimation: 1 token ≈ 4 characters for English, 2-3 for Korean
        const koreanChars = (text.match(/[\u3131-\u3163\uac00-\ud7a3]/g) || []).length;
        const otherChars = text.length - koreanChars;
        return Math.ceil((koreanChars / 2.5) + (otherChars / 4));
    }

    /**
     * Split text into chunks that fit within token limits
     */
    chunkText(text, maxTokensPerChunk = 3000) {
        const sentences = text.split(/[.!?。！？]\s+/);
        const chunks = [];
        let currentChunk = '';
        let currentTokens = 0;

        for (const sentence of sentences) {
            const sentenceTokens = this.estimateTokens(sentence);

            if (currentTokens + sentenceTokens > maxTokensPerChunk && currentChunk) {
                chunks.push(currentChunk.trim());
                currentChunk = sentence;
                currentTokens = sentenceTokens;
            } else {
                currentChunk += (currentChunk ? '. ' : '') + sentence;
                currentTokens += sentenceTokens;
            }
        }

        if (currentChunk) {
            chunks.push(currentChunk.trim());
        }

        return chunks;
    }

    /**
     * Sleep utility for retry delays
     */
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Rate-limited request queue processor
     */
    async processRequestQueue() {
        if (this.isProcessingQueue || this.requestQueue.length === 0) {
            return;
        }

        this.isProcessingQueue = true;

        while (this.requestQueue.length > 0) {
            const now = Date.now();
            const timeSinceLastRequest = now - this.lastRequestTime;

            if (timeSinceLastRequest < this.minRequestInterval) {
                await this.sleep(this.minRequestInterval - timeSinceLastRequest);
            }

            const { resolve, reject, requestData } = this.requestQueue.shift();

            try {
                const result = await this.makeApiRequest(requestData);
                this.lastRequestTime = Date.now();
                resolve(result);
            } catch (error) {
                reject(error);
            }
        }

        this.isProcessingQueue = false;
    }

    /**
     * Add request to queue (for rate limiting)
     */
    queueRequest(requestData) {
        return new Promise((resolve, reject) => {
            this.requestQueue.push({ resolve, reject, requestData });
            this.processRequestQueue();
        });
    }

    /**
     * Make actual API request with retry logic
     */
    async makeApiRequest(requestData, retryCount = 0) {
        this.validateApiKey();
        this.stats.totalRequests++;

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.requestTimeout);

        const requestOptions = {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${this.apiKey}`,
                'Content-Type': 'application/json',
                'HTTP-Referer': window.location.origin,
                'X-Title': 'PDF Summary App'
            },
            body: JSON.stringify(requestData),
            signal: controller.signal
        };

        try {
            const response = await fetch(`${this.baseUrl}/chat/completions`, requestOptions);
            clearTimeout(timeoutId);

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));

                // Handle specific error cases
                if (response.status === 429) { // Rate limit
                    if (retryCount < this.maxRetries) {
                        const delay = this.retryDelay * Math.pow(2, retryCount);
                        console.log(`Rate limited. Retrying in ${delay}ms...`);
                        await this.sleep(delay);
                        return this.makeApiRequest(requestData, retryCount + 1);
                    }
                    throw new Error('Rate limit exceeded. Please try again later.');
                }

                if (response.status === 401) {
                    throw new Error('Invalid API key. Please check your OpenRouter API key.');
                }

                if (response.status === 500 && retryCount < this.maxRetries) {
                    const delay = this.retryDelay * Math.pow(2, retryCount);
                    console.log(`Server error. Retrying in ${delay}ms...`);
                    await this.sleep(delay);
                    return this.makeApiRequest(requestData, retryCount + 1);
                }

                throw new Error(`API request failed: ${response.status} ${response.statusText}. ${errorData.error?.message || ''}`);
            }

            const data = await response.json();

            // Update statistics
            this.stats.successfulRequests++;
            if (data.usage) {
                this.stats.totalTokensUsed += data.usage.total_tokens || 0;
                // Approximate cost calculation (DeepSeek is very cost-effective)
                this.stats.totalCost += (data.usage.total_tokens || 0) * 0.000001; // $0.000001 per token (estimate)
            }

            return data;

        } catch (error) {
            clearTimeout(timeoutId);

            if (error.name === 'AbortError') {
                throw new Error('Request timeout. Please try again.');
            }

            // Retry on network errors
            if (retryCount < this.maxRetries && (
                error.message.includes('fetch') ||
                error.message.includes('network') ||
                error.message.includes('timeout')
            )) {
                const delay = this.retryDelay * Math.pow(2, retryCount);
                console.log(`Network error. Retrying in ${delay}ms...`);
                await this.sleep(delay);
                return this.makeApiRequest(requestData, retryCount + 1);
            }

            this.stats.failedRequests++;
            throw error;
        }
    }

    /**
     * Generate chat completion
     */
    async generateCompletion(messages, options = {}) {
        const requestData = {
            model: this.model,
            messages: messages,
            max_tokens: options.maxTokens || 2000,
            temperature: options.temperature || 0.3,
            top_p: options.topP || 0.9,
            frequency_penalty: options.frequencyPenalty || 0.1,
            presence_penalty: options.presencePenalty || 0.1,
            stream: false,
            ...options.additionalParams
        };

        return this.queueRequest(requestData);
    }

    /**
     * Stream chat completion (for real-time responses)
     */
    async generateStreamCompletion(messages, options = {}, onChunk = null) {
        this.validateApiKey();

        const requestData = {
            model: this.model,
            messages: messages,
            max_tokens: options.maxTokens || 2000,
            temperature: options.temperature || 0.3,
            top_p: options.topP || 0.9,
            frequency_penalty: options.frequencyPenalty || 0.1,
            presence_penalty: options.presencePenalty || 0.1,
            stream: true,
            ...options.additionalParams
        };

        const response = await fetch(`${this.baseUrl}/chat/completions`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${this.apiKey}`,
                'Content-Type': 'application/json',
                'HTTP-Referer': window.location.origin,
                'X-Title': 'PDF Summary App'
            },
            body: JSON.stringify(requestData)
        });

        if (!response.ok) {
            throw new Error(`Streaming request failed: ${response.status} ${response.statusText}`);
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';
        let fullContent = '';

        try {
            while (true) {
                const { value, done } = await reader.read();
                if (done) break;

                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split('\n');
                buffer = lines.pop() || '';

                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        const data = line.slice(6);
                        if (data === '[DONE]') continue;

                        try {
                            const parsed = JSON.parse(data);
                            const content = parsed.choices?.[0]?.delta?.content;
                            if (content) {
                                fullContent += content;
                                if (onChunk) onChunk(content);
                            }
                        } catch (e) {
                            console.warn('Failed to parse streaming chunk:', e);
                        }
                    }
                }
            }
        } finally {
            reader.releaseLock();
        }

        return {
            choices: [{
                message: {
                    content: fullContent,
                    role: 'assistant'
                }
            }]
        };
    }

    /**
     * Get usage statistics
     */
    getStats() {
        return {
            ...this.stats,
            successRate: this.stats.totalRequests > 0
                ? (this.stats.successfulRequests / this.stats.totalRequests * 100).toFixed(2) + '%'
                : '0%',
            averageCostPerRequest: this.stats.successfulRequests > 0
                ? (this.stats.totalCost / this.stats.successfulRequests).toFixed(6)
                : 0
        };
    }

    /**
     * Reset statistics
     */
    resetStats() {
        this.stats = {
            totalRequests: 0,
            successfulRequests: 0,
            failedRequests: 0,
            totalTokensUsed: 0,
            totalCost: 0
        };
    }

    /**
     * Test API connection
     */
    async testConnection() {
        try {
            const response = await this.generateCompletion([
                { role: 'user', content: 'Hello, please respond with "Connection successful"' }
            ], { maxTokens: 20 });

            return {
                success: true,
                model: this.model,
                response: response.choices[0].message.content,
                usage: response.usage
            };
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }
}

// Export for both Node.js and browser environments
if (typeof module !== 'undefined' && module.exports) {
    module.exports = OpenRouterClient;
} else if (typeof window !== 'undefined') {
    window.OpenRouterClient = OpenRouterClient;
}