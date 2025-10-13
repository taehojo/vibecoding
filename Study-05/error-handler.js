/**
 * Error Handling and Retry Logic Module
 *
 * This module provides comprehensive error handling, retry logic,
 * and resilience patterns for OpenRouter API interactions.
 *
 * Features:
 * - Intelligent retry strategies with exponential backoff
 * - Circuit breaker pattern for API protection
 * - Detailed error classification and handling
 * - Monitoring and alerting capabilities
 * - Graceful degradation and fallback mechanisms
 */

class ErrorHandler {
    constructor(config = {}) {
        this.config = {
            maxRetries: config.maxRetries || 3,
            baseDelay: config.baseDelay || 1000,
            maxDelay: config.maxDelay || 30000,
            backoffFactor: config.backoffFactor || 2,
            jitterEnabled: config.jitterEnabled !== false,
            circuitBreakerThreshold: config.circuitBreakerThreshold || 5,
            circuitBreakerWindow: config.circuitBreakerWindow || 60000,
            timeoutDuration: config.timeoutDuration || 60000,
            ...config
        };

        // Circuit breaker state
        this.circuitBreaker = {
            state: 'CLOSED', // CLOSED, OPEN, HALF_OPEN
            failureCount: 0,
            lastFailureTime: null,
            nextRetryTime: null,
            successCount: 0
        };

        // Error tracking
        this.errorHistory = [];
        this.errorCounts = new Map();

        // Monitoring
        this.metrics = {
            totalRequests: 0,
            totalErrors: 0,
            retriedRequests: 0,
            circuitBreakerActivations: 0,
            averageRetryCount: 0
        };
    }

    /**
     * Error types classification
     */
    static ErrorTypes = {
        // Network errors
        NETWORK_ERROR: 'NETWORK_ERROR',
        TIMEOUT_ERROR: 'TIMEOUT_ERROR',
        CONNECTION_ERROR: 'CONNECTION_ERROR',

        // API errors
        AUTHENTICATION_ERROR: 'AUTHENTICATION_ERROR',
        AUTHORIZATION_ERROR: 'AUTHORIZATION_ERROR',
        RATE_LIMIT_ERROR: 'RATE_LIMIT_ERROR',
        QUOTA_EXCEEDED_ERROR: 'QUOTA_EXCEEDED_ERROR',
        INVALID_REQUEST_ERROR: 'INVALID_REQUEST_ERROR',

        // Server errors
        SERVER_ERROR: 'SERVER_ERROR',
        SERVICE_UNAVAILABLE_ERROR: 'SERVICE_UNAVAILABLE_ERROR',
        GATEWAY_ERROR: 'GATEWAY_ERROR',

        // Application errors
        VALIDATION_ERROR: 'VALIDATION_ERROR',
        PROCESSING_ERROR: 'PROCESSING_ERROR',
        CONFIGURATION_ERROR: 'CONFIGURATION_ERROR',

        // Unknown errors
        UNKNOWN_ERROR: 'UNKNOWN_ERROR'
    };

    /**
     * Classify error based on error object or response
     */
    classifyError(error) {
        const { ErrorTypes } = ErrorHandler;

        // Network and timeout errors
        if (error.name === 'AbortError' || error.message.includes('timeout')) {
            return ErrorTypes.TIMEOUT_ERROR;
        }

        if (error.name === 'TypeError' && error.message.includes('fetch')) {
            return ErrorTypes.NETWORK_ERROR;
        }

        if (error.message.includes('network') || error.message.includes('connection')) {
            return ErrorTypes.CONNECTION_ERROR;
        }

        // HTTP status code based classification
        if (error.status || error.response?.status) {
            const status = error.status || error.response.status;

            switch (status) {
                case 401:
                    return ErrorTypes.AUTHENTICATION_ERROR;
                case 403:
                    return ErrorTypes.AUTHORIZATION_ERROR;
                case 429:
                    return ErrorTypes.RATE_LIMIT_ERROR;
                case 400:
                    return ErrorTypes.INVALID_REQUEST_ERROR;
                case 500:
                    return ErrorTypes.SERVER_ERROR;
                case 502:
                case 504:
                    return ErrorTypes.GATEWAY_ERROR;
                case 503:
                    return ErrorTypes.SERVICE_UNAVAILABLE_ERROR;
                default:
                    if (status >= 400 && status < 500) {
                        return ErrorTypes.INVALID_REQUEST_ERROR;
                    } else if (status >= 500) {
                        return ErrorTypes.SERVER_ERROR;
                    }
            }
        }

        // API specific errors
        if (error.message.includes('API key') || error.message.includes('authentication')) {
            return ErrorTypes.AUTHENTICATION_ERROR;
        }

        if (error.message.includes('rate limit') || error.message.includes('quota')) {
            return ErrorTypes.RATE_LIMIT_ERROR;
        }

        if (error.message.includes('validation') || error.message.includes('invalid')) {
            return ErrorTypes.VALIDATION_ERROR;
        }

        return ErrorTypes.UNKNOWN_ERROR;
    }

    /**
     * Check if error is retryable
     */
    isRetryableError(errorType) {
        const retryableErrors = [
            ErrorHandler.ErrorTypes.NETWORK_ERROR,
            ErrorHandler.ErrorTypes.TIMEOUT_ERROR,
            ErrorHandler.ErrorTypes.CONNECTION_ERROR,
            ErrorHandler.ErrorTypes.RATE_LIMIT_ERROR,
            ErrorHandler.ErrorTypes.SERVER_ERROR,
            ErrorHandler.ErrorTypes.SERVICE_UNAVAILABLE_ERROR,
            ErrorHandler.ErrorTypes.GATEWAY_ERROR
        ];

        return retryableErrors.includes(errorType);
    }

    /**
     * Calculate retry delay with exponential backoff and jitter
     */
    calculateRetryDelay(attempt, errorType) {
        let delay = this.config.baseDelay * Math.pow(this.config.backoffFactor, attempt);

        // Special handling for rate limits
        if (errorType === ErrorHandler.ErrorTypes.RATE_LIMIT_ERROR) {
            delay = Math.max(delay, 5000); // Minimum 5 seconds for rate limits
        }

        // Add jitter to avoid thundering herd
        if (this.config.jitterEnabled) {
            delay += Math.random() * 1000;
        }

        // Cap at maximum delay
        return Math.min(delay, this.config.maxDelay);
    }

    /**
     * Circuit breaker logic
     */
    shouldAllowRequest() {
        const now = Date.now();

        switch (this.circuitBreaker.state) {
            case 'OPEN':
                if (now >= this.circuitBreaker.nextRetryTime) {
                    this.circuitBreaker.state = 'HALF_OPEN';
                    this.circuitBreaker.successCount = 0;
                    return true;
                }
                return false;

            case 'HALF_OPEN':
                return true;

            case 'CLOSED':
            default:
                return true;
        }
    }

    /**
     * Record request result for circuit breaker
     */
    recordRequestResult(success, error = null) {
        if (success) {
            if (this.circuitBreaker.state === 'HALF_OPEN') {
                this.circuitBreaker.successCount++;
                if (this.circuitBreaker.successCount >= 3) {
                    this.circuitBreaker.state = 'CLOSED';
                    this.circuitBreaker.failureCount = 0;
                }
            } else if (this.circuitBreaker.state === 'CLOSED') {
                this.circuitBreaker.failureCount = Math.max(0, this.circuitBreaker.failureCount - 1);
            }
        } else {
            this.circuitBreaker.failureCount++;
            this.circuitBreaker.lastFailureTime = Date.now();

            if (this.circuitBreaker.failureCount >= this.config.circuitBreakerThreshold) {
                this.circuitBreaker.state = 'OPEN';
                this.circuitBreaker.nextRetryTime = Date.now() + this.config.circuitBreakerWindow;
                this.metrics.circuitBreakerActivations++;
            }

            // Track error for monitoring
            if (error) {
                this.recordError(error);
            }
        }
    }

    /**
     * Record error for monitoring and analysis
     */
    recordError(error) {
        const errorType = this.classifyError(error);

        this.errorHistory.push({
            timestamp: Date.now(),
            type: errorType,
            message: error.message,
            stack: error.stack,
            status: error.status || error.response?.status
        });

        // Keep only recent errors (last 1000)
        if (this.errorHistory.length > 1000) {
            this.errorHistory.shift();
        }

        // Update error counts
        const count = this.errorCounts.get(errorType) || 0;
        this.errorCounts.set(errorType, count + 1);

        this.metrics.totalErrors++;
    }

    /**
     * Execute operation with retry logic
     */
    async executeWithRetry(operation, context = {}) {
        this.metrics.totalRequests++;

        if (!this.shouldAllowRequest()) {
            const error = new Error('Circuit breaker is OPEN. Service temporarily unavailable.');
            error.type = 'CIRCUIT_BREAKER_OPEN';
            throw error;
        }

        let lastError;
        let attempt = 0;

        while (attempt <= this.config.maxRetries) {
            try {
                const result = await this.executeWithTimeout(operation, context);
                this.recordRequestResult(true);

                if (attempt > 0) {
                    this.metrics.retriedRequests++;
                    this.updateAverageRetryCount(attempt);
                }

                return result;

            } catch (error) {
                lastError = error;
                const errorType = this.classifyError(error);

                // Don't retry if error is not retryable or we've exhausted attempts
                if (!this.isRetryableError(errorType) || attempt >= this.config.maxRetries) {
                    this.recordRequestResult(false, error);
                    throw this.enhanceError(error, {
                        attempt: attempt + 1,
                        errorType,
                        retryable: this.isRetryableError(errorType)
                    });
                }

                attempt++;
                const delay = this.calculateRetryDelay(attempt - 1, errorType);

                console.log(`Retry attempt ${attempt}/${this.config.maxRetries} after ${delay}ms. Error: ${error.message}`);

                // Wait before retry
                await this.sleep(delay);
            }
        }

        // All retries exhausted
        this.recordRequestResult(false, lastError);
        throw this.enhanceError(lastError, {
            attempt: attempt,
            errorType: this.classifyError(lastError),
            allRetriesExhausted: true
        });
    }

    /**
     * Execute operation with timeout
     */
    async executeWithTimeout(operation, context = {}) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.config.timeoutDuration);

        try {
            const result = await operation({ ...context, signal: controller.signal });
            clearTimeout(timeoutId);
            return result;
        } catch (error) {
            clearTimeout(timeoutId);
            if (error.name === 'AbortError') {
                const timeoutError = new Error(`Operation timeout after ${this.config.timeoutDuration}ms`);
                timeoutError.name = 'TimeoutError';
                throw timeoutError;
            }
            throw error;
        }
    }

    /**
     * Enhance error with additional context
     */
    enhanceError(error, context = {}) {
        const enhancedError = new Error(error.message);
        enhancedError.name = error.name;
        enhancedError.stack = error.stack;
        enhancedError.originalError = error;
        enhancedError.errorType = context.errorType;
        enhancedError.attempt = context.attempt;
        enhancedError.retryable = context.retryable;
        enhancedError.timestamp = Date.now();
        enhancedError.circuitBreakerState = this.circuitBreaker.state;

        // Copy any additional properties
        Object.keys(error).forEach(key => {
            if (!(key in enhancedError)) {
                enhancedError[key] = error[key];
            }
        });

        return enhancedError;
    }

    /**
     * Sleep utility
     */
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Update average retry count metric
     */
    updateAverageRetryCount(retryCount) {
        const totalRetries = this.metrics.averageRetryCount * (this.metrics.retriedRequests - 1) + retryCount;
        this.metrics.averageRetryCount = totalRetries / this.metrics.retriedRequests;
    }

    /**
     * Get error statistics
     */
    getErrorStats() {
        const recentErrors = this.errorHistory.filter(
            error => Date.now() - error.timestamp < 3600000 // Last hour
        );

        const errorTypeDistribution = {};
        this.errorCounts.forEach((count, type) => {
            errorTypeDistribution[type] = count;
        });

        return {
            totalErrors: this.metrics.totalErrors,
            recentErrors: recentErrors.length,
            errorTypeDistribution,
            circuitBreakerState: this.circuitBreaker.state,
            circuitBreakerActivations: this.metrics.circuitBreakerActivations,
            failureRate: this.metrics.totalRequests > 0
                ? (this.metrics.totalErrors / this.metrics.totalRequests * 100).toFixed(2) + '%'
                : '0%',
            averageRetryCount: this.metrics.averageRetryCount.toFixed(2)
        };
    }

    /**
     * Get recent error details
     */
    getRecentErrors(count = 10) {
        return this.errorHistory
            .slice(-count)
            .reverse()
            .map(error => ({
                timestamp: new Date(error.timestamp).toISOString(),
                type: error.type,
                message: error.message,
                status: error.status
            }));
    }

    /**
     * Reset circuit breaker manually
     */
    resetCircuitBreaker() {
        this.circuitBreaker.state = 'CLOSED';
        this.circuitBreaker.failureCount = 0;
        this.circuitBreaker.lastFailureTime = null;
        this.circuitBreaker.nextRetryTime = null;
        this.circuitBreaker.successCount = 0;
    }

    /**
     * Reset all metrics
     */
    resetMetrics() {
        this.errorHistory = [];
        this.errorCounts.clear();
        this.metrics = {
            totalRequests: 0,
            totalErrors: 0,
            retriedRequests: 0,
            circuitBreakerActivations: 0,
            averageRetryCount: 0
        };
        this.resetCircuitBreaker();
    }

    /**
     * Create error handler middleware for API clients
     */
    createMiddleware() {
        return {
            executeWithRetry: this.executeWithRetry.bind(this),
            classifyError: this.classifyError.bind(this),
            getStats: this.getErrorStats.bind(this),
            getRecentErrors: this.getRecentErrors.bind(this),
            reset: this.resetMetrics.bind(this)
        };
    }

    /**
     * Generate user-friendly error messages
     */
    generateUserMessage(error) {
        const errorType = this.classifyError(error);

        const userMessages = {
            [ErrorHandler.ErrorTypes.NETWORK_ERROR]: '네트워크 연결에 문제가 있습니다. 인터넷 연결을 확인해주세요.',
            [ErrorHandler.ErrorTypes.TIMEOUT_ERROR]: '요청 시간이 초과되었습니다. 잠시 후 다시 시도해주세요.',
            [ErrorHandler.ErrorTypes.AUTHENTICATION_ERROR]: 'API 키가 유효하지 않습니다. 설정을 확인해주세요.',
            [ErrorHandler.ErrorTypes.AUTHORIZATION_ERROR]: '접근 권한이 없습니다. 계정 설정을 확인해주세요.',
            [ErrorHandler.ErrorTypes.RATE_LIMIT_ERROR]: '요청이 너무 많습니다. 잠시 후 다시 시도해주세요.',
            [ErrorHandler.ErrorTypes.QUOTA_EXCEEDED_ERROR]: '사용량 한도를 초과했습니다. 요금제를 확인해주세요.',
            [ErrorHandler.ErrorTypes.SERVER_ERROR]: '서버에 일시적인 문제가 있습니다. 잠시 후 다시 시도해주세요.',
            [ErrorHandler.ErrorTypes.SERVICE_UNAVAILABLE_ERROR]: '서비스가 일시적으로 이용할 수 없습니다.',
            [ErrorHandler.ErrorTypes.VALIDATION_ERROR]: '입력 데이터에 문제가 있습니다. 내용을 확인해주세요.',
            [ErrorHandler.ErrorTypes.UNKNOWN_ERROR]: '알 수 없는 오류가 발생했습니다. 지속될 경우 관리자에게 문의하세요.'
        };

        return userMessages[errorType] || userMessages[ErrorHandler.ErrorTypes.UNKNOWN_ERROR];
    }
}

// Export for both Node.js and browser environments
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ErrorHandler;
} else if (typeof window !== 'undefined') {
    window.ErrorHandler = ErrorHandler;
}