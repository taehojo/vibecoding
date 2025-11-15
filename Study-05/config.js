/**
 * Configuration Management Module
 *
 * This module provides centralized configuration management for the
 * PDF summarization application with OpenRouter API integration.
 *
 * Features:
 * - Environment-specific configurations
 * - Security best practices
 * - API endpoint management
 * - Model parameter optimization
 * - Cost and usage limits
 */

class AppConfig {
    constructor(environment = 'development') {
        this.environment = environment;
        this.config = this.loadConfiguration();
        this.validateConfiguration();
    }

    /**
     * Load configuration based on environment
     */
    loadConfiguration() {
        const baseConfig = {
            // API Configuration
            api: {
                baseUrl: 'https://openrouter.ai/api/v1',
                timeout: 60000,
                maxRetries: 3,
                retryDelay: 1000,
                rateLimit: {
                    requestsPerMinute: 60,
                    requestsPerHour: 1000
                }
            },

            // Model Configuration
            models: {
                default: 'deepseek/deepseek-chat',
                available: [
                    {
                        id: 'deepseek/deepseek-chat',
                        name: 'DeepSeek V3.1',
                        description: '고성능 대화형 모델 (추천)',
                        costPerToken: 0.000001,
                        maxTokens: 8192,
                        contextWindow: 32768,
                        recommended: true
                    },
                    {
                        id: 'deepseek/deepseek-coder',
                        name: 'DeepSeek Coder',
                        description: '코드 및 기술 문서 특화',
                        costPerToken: 0.000001,
                        maxTokens: 8192,
                        contextWindow: 32768,
                        specialized: ['code', 'technical']
                    }
                ]
            },

            // Token Management
            tokens: {
                maxPerRequest: 4000,
                reserveForResponse: 1000,
                chunkOverlap: 200,
                estimationMultipliers: {
                    korean: 2.5,
                    english: 4,
                    mixed: 3
                }
            },

            // Summarization Settings
            summarization: {
                modes: {
                    brief: {
                        maxTokens: 300,
                        temperature: 0.2,
                        compressionRatio: 0.1,
                        description: '핵심 내용만 간단히'
                    },
                    standard: {
                        maxTokens: 800,
                        temperature: 0.3,
                        compressionRatio: 0.2,
                        description: '주요 내용을 균형있게'
                    },
                    detailed: {
                        maxTokens: 1500,
                        temperature: 0.3,
                        compressionRatio: 0.3,
                        description: '상세한 내용 포함'
                    }
                },
                defaultMode: 'standard',
                language: 'korean',
                includeKeyPoints: true,
                structuredOutput: true
            },

            // File Processing
            files: {
                maxSize: 50 * 1024 * 1024, // 50MB
                allowedTypes: ['application/pdf'],
                maxPages: 1000,
                textExtractionTimeout: 30000
            },

            // Error Handling
            errorHandling: {
                maxRetries: 3,
                retryDelay: 1000,
                circuitBreakerThreshold: 5,
                circuitBreakerWindow: 60000,
                timeoutDuration: 60000
            },

            // Security
            security: {
                apiKeyValidation: true,
                corsEnabled: true,
                sanitizeInput: true,
                maxInputLength: 500000, // 500K characters
                rateLimiting: true
            },

            // UI/UX
            ui: {
                theme: 'light',
                animations: true,
                autoSave: true,
                showAdvancedOptions: false,
                progressUpdates: true,
                realTimeUpdates: false
            },

            // Analytics & Monitoring
            monitoring: {
                trackUsage: true,
                trackErrors: true,
                trackPerformance: true,
                maxHistorySize: 1000,
                enableMetrics: true
            },

            // Cache Settings
            cache: {
                enabled: true,
                maxSize: 100,
                ttl: 3600000, // 1 hour
                storageType: 'memory' // 'memory' | 'localStorage'
            }
        };

        // Environment-specific overrides
        const environmentConfigs = {
            development: {
                api: {
                    timeout: 120000, // Longer timeout for debugging
                    maxRetries: 5
                },
                security: {
                    apiKeyValidation: false // More lenient for development
                },
                ui: {
                    showAdvancedOptions: true,
                    animations: false // Disable for faster testing
                },
                monitoring: {
                    trackUsage: true,
                    enableMetrics: true
                }
            },

            production: {
                api: {
                    timeout: 45000, // Stricter timeout
                    maxRetries: 3
                },
                security: {
                    apiKeyValidation: true,
                    sanitizeInput: true,
                    rateLimiting: true
                },
                ui: {
                    showAdvancedOptions: false,
                    animations: true
                },
                monitoring: {
                    trackUsage: true,
                    trackErrors: true,
                    trackPerformance: true
                },
                cache: {
                    enabled: true,
                    maxSize: 50 // Smaller cache for production
                }
            },

            testing: {
                api: {
                    timeout: 10000,
                    maxRetries: 1
                },
                files: {
                    maxSize: 10 * 1024 * 1024 // 10MB for testing
                },
                monitoring: {
                    trackUsage: false,
                    trackErrors: true
                },
                cache: {
                    enabled: false
                }
            }
        };

        // Merge base config with environment-specific config
        return this.deepMerge(baseConfig, environmentConfigs[this.environment] || {});
    }

    /**
     * Deep merge two objects
     */
    deepMerge(target, source) {
        const result = { ...target };

        for (const key in source) {
            if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
                result[key] = this.deepMerge(target[key] || {}, source[key]);
            } else {
                result[key] = source[key];
            }
        }

        return result;
    }

    /**
     * Validate configuration
     */
    validateConfiguration() {
        const errors = [];

        // Validate API configuration
        if (!this.config.api.baseUrl) {
            errors.push('API base URL is required');
        }

        if (this.config.api.timeout < 1000) {
            errors.push('API timeout must be at least 1000ms');
        }

        // Validate model configuration
        if (!this.config.models.default) {
            errors.push('Default model must be specified');
        }

        if (!this.config.models.available || this.config.models.available.length === 0) {
            errors.push('At least one model must be available');
        }

        // Validate token limits
        if (this.config.tokens.maxPerRequest < 100) {
            errors.push('Max tokens per request must be at least 100');
        }

        if (this.config.tokens.reserveForResponse >= this.config.tokens.maxPerRequest) {
            errors.push('Reserved tokens must be less than max tokens per request');
        }

        // Validate file limits
        if (this.config.files.maxSize < 1024) {
            errors.push('File size limit must be at least 1KB');
        }

        if (errors.length > 0) {
            throw new Error(`Configuration validation failed: ${errors.join(', ')}`);
        }
    }

    /**
     * Get configuration value by path
     */
    get(path, defaultValue = null) {
        const keys = path.split('.');
        let value = this.config;

        for (const key of keys) {
            if (value && typeof value === 'object' && key in value) {
                value = value[key];
            } else {
                return defaultValue;
            }
        }

        return value;
    }

    /**
     * Set configuration value by path
     */
    set(path, value) {
        const keys = path.split('.');
        let target = this.config;

        for (let i = 0; i < keys.length - 1; i++) {
            const key = keys[i];
            if (!(key in target) || typeof target[key] !== 'object') {
                target[key] = {};
            }
            target = target[key];
        }

        target[keys[keys.length - 1]] = value;
        this.validateConfiguration();
    }

    /**
     * Get model configuration
     */
    getModel(modelId = null) {
        const id = modelId || this.config.models.default;
        return this.config.models.available.find(model => model.id === id);
    }

    /**
     * Get summarization mode configuration
     */
    getSummarizationMode(mode = null) {
        const modeId = mode || this.config.summarization.defaultMode;
        return this.config.summarization.modes[modeId];
    }

    /**
     * Get security settings
     */
    getSecuritySettings() {
        return this.config.security;
    }

    /**
     * Check if feature is enabled
     */
    isFeatureEnabled(feature) {
        const featureMap = {
            'streaming': this.config.ui.realTimeUpdates,
            'animations': this.config.ui.animations,
            'autoSave': this.config.ui.autoSave,
            'advancedOptions': this.config.ui.showAdvancedOptions,
            'monitoring': this.config.monitoring.enableMetrics,
            'cache': this.config.cache.enabled,
            'rateLimiting': this.config.security.rateLimiting
        };

        return featureMap[feature] || false;
    }

    /**
     * Get environment-specific settings
     */
    getEnvironmentSettings() {
        return {
            environment: this.environment,
            debug: this.environment === 'development',
            production: this.environment === 'production',
            testing: this.environment === 'testing'
        };
    }

    /**
     * Export configuration for client use
     */
    exportClientConfig() {
        // Only export safe configuration for client-side use
        return {
            models: this.config.models,
            summarization: this.config.summarization,
            files: this.config.files,
            ui: this.config.ui,
            tokens: {
                maxPerRequest: this.config.tokens.maxPerRequest,
                estimationMultipliers: this.config.tokens.estimationMultipliers
            },
            environment: this.environment
        };
    }

    /**
     * Load configuration from URL parameters
     */
    loadFromUrlParams() {
        const urlParams = new URLSearchParams(window.location.search);
        const overrides = {};

        // Map URL parameters to config paths
        const paramMap = {
            'model': 'models.default',
            'mode': 'summarization.defaultMode',
            'lang': 'summarization.language',
            'streaming': 'ui.realTimeUpdates',
            'advanced': 'ui.showAdvancedOptions'
        };

        for (const [param, configPath] of Object.entries(paramMap)) {
            if (urlParams.has(param)) {
                let value = urlParams.get(param);

                // Convert string values to appropriate types
                if (value === 'true') value = true;
                else if (value === 'false') value = false;
                else if (/^\d+$/.test(value)) value = parseInt(value);

                this.set(configPath, value);
            }
        }
    }

    /**
     * Save user preferences to localStorage
     */
    saveUserPreferences(preferences) {
        try {
            const safePreferences = {
                model: preferences.model,
                mode: preferences.mode,
                language: preferences.language,
                theme: preferences.theme,
                showAdvanced: preferences.showAdvanced
                // Don't save sensitive data like API keys
            };

            localStorage.setItem('pdfSummarizerPreferences', JSON.stringify(safePreferences));
        } catch (error) {
            console.warn('Failed to save user preferences:', error);
        }
    }

    /**
     * Load user preferences from localStorage
     */
    loadUserPreferences() {
        try {
            const saved = localStorage.getItem('pdfSummarizerPreferences');
            if (saved) {
                const preferences = JSON.parse(saved);

                // Apply safe preferences to configuration
                if (preferences.model) {
                    this.set('models.default', preferences.model);
                }
                if (preferences.mode) {
                    this.set('summarization.defaultMode', preferences.mode);
                }
                if (preferences.language) {
                    this.set('summarization.language', preferences.language);
                }
                if (preferences.theme) {
                    this.set('ui.theme', preferences.theme);
                }
                if (typeof preferences.showAdvanced === 'boolean') {
                    this.set('ui.showAdvancedOptions', preferences.showAdvanced);
                }

                return preferences;
            }
        } catch (error) {
            console.warn('Failed to load user preferences:', error);
        }

        return null;
    }

    /**
     * Reset configuration to defaults
     */
    resetToDefaults() {
        this.config = this.loadConfiguration();
    }

    /**
     * Get configuration summary for debugging
     */
    getConfigSummary() {
        return {
            environment: this.environment,
            api: {
                baseUrl: this.config.api.baseUrl,
                timeout: this.config.api.timeout,
                maxRetries: this.config.api.maxRetries
            },
            model: this.config.models.default,
            mode: this.config.summarization.defaultMode,
            language: this.config.summarization.language,
            features: {
                streaming: this.isFeatureEnabled('streaming'),
                cache: this.isFeatureEnabled('cache'),
                monitoring: this.isFeatureEnabled('monitoring')
            }
        };
    }
}

// Factory function to create configuration instances
function createConfig(environment = null) {
    // Auto-detect environment if not specified
    if (!environment) {
        if (typeof window !== 'undefined') {
            // Browser environment
            if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
                environment = 'development';
            } else {
                environment = 'production';
            }
        } else {
            // Node.js environment
            environment = process.env.NODE_ENV || 'development';
        }
    }

    return new AppConfig(environment);
}

// Export for both Node.js and browser environments
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { AppConfig, createConfig };
} else if (typeof window !== 'undefined') {
    window.AppConfig = AppConfig;
    window.createConfig = createConfig;
}