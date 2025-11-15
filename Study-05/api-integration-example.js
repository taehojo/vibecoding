/**
 * PDF 요약 API 연동 예제
 * 실제 서버 환경에서 사용할 수 있는 백엔드 API 연동 코드
 */

// OpenAI API 연동 예제
class OpenAIIntegrationService {
    constructor(apiKey, options = {}) {
        this.apiKey = apiKey;
        this.baseURL = options.baseURL || 'https://api.openai.com/v1';
        this.model = options.model || 'gpt-3.5-turbo';
        this.maxTokens = options.maxTokens || 4000;
        this.temperature = options.temperature || 0.3;
    }

    /**
     * OpenAI API를 사용한 텍스트 요약
     * @param {string} text - 요약할 텍스트
     * @param {Object} options - 요약 옵션
     * @returns {Promise<Object>} 요약 결과
     */
    async summarizeText(text, options = {}) {
        const prompt = this.createSummaryPrompt(text, options);

        try {
            const response = await fetch(`${this.baseURL}/chat/completions`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    model: this.model,
                    messages: [
                        {
                            role: 'system',
                            content: '당신은 전문적인 문서 요약 전문가입니다. 주어진 텍스트를 정확하고 간결하게 요약해주세요.'
                        },
                        {
                            role: 'user',
                            content: prompt
                        }
                    ],
                    max_tokens: this.maxTokens,
                    temperature: this.temperature
                })
            });

            if (!response.ok) {
                throw new Error(`OpenAI API 오류: ${response.status} ${response.statusText}`);
            }

            const data = await response.json();
            return this.parseOpenAIResponse(data);

        } catch (error) {
            throw new Error(`OpenAI API 호출 실패: ${error.message}`);
        }
    }

    /**
     * 요약 프롬프트 생성
     * @param {string} text - 원본 텍스트
     * @param {Object} options - 옵션
     * @returns {string} 프롬프트
     */
    createSummaryPrompt(text, options) {
        const summaryType = options.type || 'comprehensive';
        const language = options.language || 'korean';
        const length = options.length || 'medium';

        let prompt = `다음 문서를 ${language}로 요약해주세요.\n\n`;

        switch (summaryType) {
            case 'bullet-points':
                prompt += '주요 내용을 불릿 포인트 형태로 정리해주세요.\n';
                break;
            case 'executive':
                prompt += '경영진을 위한 핵심 요약을 작성해주세요.\n';
                break;
            case 'technical':
                prompt += '기술적 내용을 중심으로 요약해주세요.\n';
                break;
            default:
                prompt += '전체적인 내용을 포괄적으로 요약해주세요.\n';
        }

        switch (length) {
            case 'short':
                prompt += '요약 길이: 2-3문장\n';
                break;
            case 'long':
                prompt += '요약 길이: 상세한 설명 포함\n';
                break;
            default:
                prompt += '요약 길이: 적절한 길이로\n';
        }

        prompt += `\n문서 내용:\n${text}`;

        return prompt;
    }

    /**
     * OpenAI 응답 파싱
     * @param {Object} response - OpenAI API 응답
     * @returns {Object} 파싱된 결과
     */
    parseOpenAIResponse(response) {
        const content = response.choices[0]?.message?.content || '';

        return {
            summary: content,
            model: response.model,
            usage: response.usage,
            finishReason: response.choices[0]?.finish_reason,
            generatedAt: new Date().toISOString()
        };
    }

    /**
     * 청크별 병렬 요약 처리
     * @param {Array} chunks - 텍스트 청크 배열
     * @param {Object} options - 옵션
     * @returns {Promise<Array>} 요약 결과 배열
     */
    async summarizeChunks(chunks, options = {}) {
        const batchSize = options.batchSize || 3;
        const results = [];

        for (let i = 0; i < chunks.length; i += batchSize) {
            const batch = chunks.slice(i, i + batchSize);
            const batchPromises = batch.map(chunk =>
                this.summarizeText(chunk.text, {
                    ...options,
                    type: 'comprehensive',
                    length: 'short'
                })
            );

            try {
                const batchResults = await Promise.allSettled(batchPromises);
                results.push(...batchResults);

                // API 요청 제한을 고려한 지연
                if (i + batchSize < chunks.length) {
                    await new Promise(resolve => setTimeout(resolve, 1000));
                }
            } catch (error) {
                console.error(`배치 ${Math.floor(i / batchSize) + 1} 처리 실패:`, error);
            }
        }

        return results;
    }
}

// Claude API 연동 예제 (Anthropic)
class ClaudeIntegrationService {
    constructor(apiKey, options = {}) {
        this.apiKey = apiKey;
        this.baseURL = options.baseURL || 'https://api.anthropic.com/v1';
        this.model = options.model || 'claude-3-sonnet-20240229';
        this.maxTokens = options.maxTokens || 4000;
    }

    /**
     * Claude API를 사용한 텍스트 요약
     * @param {string} text - 요약할 텍스트
     * @param {Object} options - 요약 옵션
     * @returns {Promise<Object>} 요약 결과
     */
    async summarizeText(text, options = {}) {
        const prompt = this.createClaudePrompt(text, options);

        try {
            const response = await fetch(`${this.baseURL}/messages`, {
                method: 'POST',
                headers: {
                    'x-api-key': this.apiKey,
                    'Content-Type': 'application/json',
                    'anthropic-version': '2023-06-01'
                },
                body: JSON.stringify({
                    model: this.model,
                    max_tokens: this.maxTokens,
                    messages: [
                        {
                            role: 'user',
                            content: prompt
                        }
                    ]
                })
            });

            if (!response.ok) {
                throw new Error(`Claude API 오류: ${response.status} ${response.statusText}`);
            }

            const data = await response.json();
            return this.parseClaudeResponse(data);

        } catch (error) {
            throw new Error(`Claude API 호출 실패: ${error.message}`);
        }
    }

    /**
     * Claude용 프롬프트 생성
     * @param {string} text - 원본 텍스트
     * @param {Object} options - 옵션
     * @returns {string} 프롬프트
     */
    createClaudePrompt(text, options) {
        return `다음 문서를 분석하고 요약해주세요.

요약 요구사항:
- 주요 내용과 핵심 포인트를 포함
- 명확하고 간결한 한국어로 작성
- 원문의 맥락과 의미를 보존

문서 내용:
${text}

위 문서의 요약을 제공해주세요.`;
    }

    /**
     * Claude 응답 파싱
     * @param {Object} response - Claude API 응답
     * @returns {Object} 파싱된 결과
     */
    parseClaudeResponse(response) {
        const content = response.content[0]?.text || '';

        return {
            summary: content,
            model: response.model,
            usage: response.usage,
            generatedAt: new Date().toISOString()
        };
    }
}

// 범용 AI 서비스 매니저
class UniversalAIService {
    constructor() {
        this.providers = new Map();
        this.defaultProvider = null;
    }

    /**
     * AI 제공업체 등록
     * @param {string} name - 제공업체 이름
     * @param {Object} service - 서비스 인스턴스
     * @param {boolean} isDefault - 기본 제공업체 여부
     */
    registerProvider(name, service, isDefault = false) {
        this.providers.set(name, service);
        if (isDefault || !this.defaultProvider) {
            this.defaultProvider = name;
        }
    }

    /**
     * 텍스트 요약 (자동 제공업체 선택)
     * @param {string} text - 요약할 텍스트
     * @param {Object} options - 옵션
     * @returns {Promise<Object>} 요약 결과
     */
    async summarize(text, options = {}) {
        const provider = options.provider || this.defaultProvider;
        const service = this.providers.get(provider);

        if (!service) {
            throw new Error(`AI 제공업체 '${provider}'를 찾을 수 없습니다.`);
        }

        try {
            return await service.summarizeText(text, options);
        } catch (error) {
            // 기본 제공업체 실패 시 다른 제공업체로 시도
            if (provider !== this.defaultProvider) {
                console.warn(`${provider} 실패, 기본 제공업체로 재시도:`, error.message);
                return await this.summarize(text, { ...options, provider: this.defaultProvider });
            }
            throw error;
        }
    }

    /**
     * 여러 제공업체로 동시 요약 (가장 빠른 결과 반환)
     * @param {string} text - 요약할 텍스트
     * @param {Array} providers - 사용할 제공업체 목록
     * @param {Object} options - 옵션
     * @returns {Promise<Object>} 요약 결과
     */
    async summarizeRace(text, providers = [], options = {}) {
        if (providers.length === 0) {
            providers = Array.from(this.providers.keys());
        }

        const promises = providers.map(provider =>
            this.summarize(text, { ...options, provider })
                .then(result => ({ provider, result, success: true }))
                .catch(error => ({ provider, error, success: false }))
        );

        const results = await Promise.allSettled(promises);
        const successful = results
            .filter(r => r.status === 'fulfilled' && r.value.success)
            .map(r => r.value);

        if (successful.length === 0) {
            throw new Error('모든 AI 제공업체에서 요약 실패');
        }

        return successful[0].result;
    }
}

// Express.js 서버 백엔드 예제
class PDFSummaryServer {
    constructor(options = {}) {
        this.aiService = new UniversalAIService();
        this.port = options.port || 3000;
        this.cors = options.cors !== false;

        this.setupAIProviders(options.ai || {});
    }

    /**
     * AI 제공업체 설정
     * @param {Object} aiConfig - AI 설정
     */
    setupAIProviders(aiConfig) {
        if (aiConfig.openai && aiConfig.openai.apiKey) {
            const openaiService = new OpenAIIntegrationService(
                aiConfig.openai.apiKey,
                aiConfig.openai.options
            );
            this.aiService.registerProvider('openai', openaiService, true);
        }

        if (aiConfig.claude && aiConfig.claude.apiKey) {
            const claudeService = new ClaudeIntegrationService(
                aiConfig.claude.apiKey,
                aiConfig.claude.options
            );
            this.aiService.registerProvider('claude', claudeService);
        }
    }

    /**
     * Express 앱 설정
     * @returns {Object} Express 앱
     */
    createApp() {
        const express = require('express');
        const multer = require('multer');
        const app = express();

        // 미들웨어 설정
        if (this.cors) {
            app.use((req, res, next) => {
                res.header('Access-Control-Allow-Origin', '*');
                res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
                res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
                next();
            });
        }

        app.use(express.json({ limit: '50mb' }));
        app.use(express.urlencoded({ extended: true, limit: '50mb' }));

        // 파일 업로드 설정
        const upload = multer({
            storage: multer.memoryStorage(),
            limits: {
                fileSize: 50 * 1024 * 1024 // 50MB
            },
            fileFilter: (req, file, cb) => {
                if (file.mimetype === 'application/pdf') {
                    cb(null, true);
                } else {
                    cb(new Error('PDF 파일만 업로드 가능합니다.'));
                }
            }
        });

        // 라우트 설정
        this.setupRoutes(app, upload);

        return app;
    }

    /**
     * 라우트 설정
     * @param {Object} app - Express 앱
     * @param {Object} upload - Multer 미들웨어
     */
    setupRoutes(app, upload) {
        // 상태 확인 엔드포인트
        app.get('/health', (req, res) => {
            res.json({
                status: 'healthy',
                timestamp: new Date().toISOString(),
                providers: Array.from(this.aiService.providers.keys())
            });
        });

        // PDF 업로드 및 텍스트 추출 엔드포인트
        app.post('/api/extract', upload.single('pdf'), async (req, res) => {
            try {
                if (!req.file) {
                    return res.status(400).json({ error: 'PDF 파일이 필요합니다.' });
                }

                // 여기서 실제 PDF 텍스트 추출 로직 구현
                // pdf-backend-services.js의 서비스를 서버 측에서 사용

                res.json({
                    success: true,
                    message: 'PDF 텍스트 추출 완료',
                    // 추출 결과 반환
                });

            } catch (error) {
                console.error('PDF 추출 오류:', error);
                res.status(500).json({ error: error.message });
            }
        });

        // 텍스트 요약 엔드포인트
        app.post('/api/summarize', async (req, res) => {
            try {
                const { content, options = {} } = req.body;

                if (!content) {
                    return res.status(400).json({ error: '요약할 내용이 필요합니다.' });
                }

                let result;

                if (content.chunks && content.chunks.length > 0) {
                    // 청크별 요약
                    const summaries = [];
                    for (const chunk of content.chunks) {
                        const summary = await this.aiService.summarize(chunk.text, options);
                        summaries.push({
                            chunkId: chunk.id,
                            summary: summary.summary
                        });
                    }

                    // 전체 요약 생성
                    const combinedText = summaries.map(s => s.summary).join('\n\n');
                    const finalSummary = await this.aiService.summarize(combinedText, {
                        ...options,
                        type: 'comprehensive'
                    });

                    result = {
                        summary: finalSummary.summary,
                        chunkSummaries: summaries,
                        metadata: finalSummary
                    };
                } else {
                    // 단일 텍스트 요약
                    result = await this.aiService.summarize(content.fullText || content.text, options);
                }

                res.json({
                    success: true,
                    data: result,
                    processedAt: new Date().toISOString()
                });

            } catch (error) {
                console.error('요약 오류:', error);
                res.status(500).json({ error: error.message });
            }
        });

        // 배치 처리 엔드포인트
        app.post('/api/batch-summarize', async (req, res) => {
            try {
                const { items, options = {} } = req.body;

                if (!Array.isArray(items) || items.length === 0) {
                    return res.status(400).json({ error: '처리할 항목이 필요합니다.' });
                }

                const results = [];
                for (const item of items) {
                    try {
                        const result = await this.aiService.summarize(item.text, options);
                        results.push({
                            id: item.id,
                            success: true,
                            summary: result.summary
                        });
                    } catch (error) {
                        results.push({
                            id: item.id,
                            success: false,
                            error: error.message
                        });
                    }
                }

                res.json({
                    success: true,
                    results,
                    processedAt: new Date().toISOString()
                });

            } catch (error) {
                console.error('배치 처리 오류:', error);
                res.status(500).json({ error: error.message });
            }
        });
    }

    /**
     * 서버 시작
     */
    start() {
        const app = this.createApp();

        app.listen(this.port, () => {
            console.log(`PDF 요약 서버가 포트 ${this.port}에서 실행 중입니다.`);
            console.log(`Health check: http://localhost:${this.port}/health`);
        });

        return app;
    }
}

// 사용 예제
function createPDFSummaryServer() {
    const server = new PDFSummaryServer({
        port: 3000,
        cors: true,
        ai: {
            openai: {
                apiKey: process.env.OPENAI_API_KEY,
                options: {
                    model: 'gpt-3.5-turbo',
                    maxTokens: 4000,
                    temperature: 0.3
                }
            },
            claude: {
                apiKey: process.env.CLAUDE_API_KEY,
                options: {
                    model: 'claude-3-sonnet-20240229',
                    maxTokens: 4000
                }
            }
        }
    });

    return server.start();
}

// 클라이언트 측 API 연동 헬퍼
class ClientAPIService {
    constructor(baseURL = '') {
        this.baseURL = baseURL;
    }

    /**
     * PDF 파일 업로드 및 텍스트 추출
     * @param {File} file - PDF 파일
     * @returns {Promise<Object>} 추출 결과
     */
    async extractPDF(file) {
        const formData = new FormData();
        formData.append('pdf', file);

        const response = await fetch(`${this.baseURL}/api/extract`, {
            method: 'POST',
            body: formData
        });

        if (!response.ok) {
            throw new Error(`서버 오류: ${response.status}`);
        }

        return await response.json();
    }

    /**
     * 텍스트 요약 요청
     * @param {Object} content - 요약할 내용
     * @param {Object} options - 요약 옵션
     * @returns {Promise<Object>} 요약 결과
     */
    async summarize(content, options = {}) {
        const response = await fetch(`${this.baseURL}/api/summarize`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ content, options })
        });

        if (!response.ok) {
            throw new Error(`서버 오류: ${response.status}`);
        }

        return await response.json();
    }

    /**
     * 서버 상태 확인
     * @returns {Promise<Object>} 서버 상태
     */
    async checkHealth() {
        const response = await fetch(`${this.baseURL}/health`);
        return await response.json();
    }
}

// 브라우저 환경에서 사용 가능하도록 전역 등록
if (typeof window !== 'undefined') {
    window.APIIntegration = {
        OpenAIIntegrationService,
        ClaudeIntegrationService,
        UniversalAIService,
        ClientAPIService
    };
}

// Node.js 환경에서 모듈 내보내기
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        OpenAIIntegrationService,
        ClaudeIntegrationService,
        UniversalAIService,
        PDFSummaryServer,
        ClientAPIService,
        createPDFSummaryServer
    };
}