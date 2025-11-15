/**
 * Usage Examples for PDF Summarization Application
 *
 * This file contains practical examples of how to use the PDF summarization
 * modules with OpenRouter API and DeepSeek V3.1 model.
 */

// =============================================================================
// Example 1: Basic Text Summarization
// =============================================================================

async function basicSummarizationExample() {
    console.log('=== Basic Text Summarization Example ===');

    // Initialize components
    const config = createConfig('development');
    const apiClient = new OpenRouterClient({
        apiKey: 'sk-or-v1-your-api-key-here',
        model: 'deepseek/deepseek-chat'
    });

    const summarizationService = new TextSummarizationService(apiClient, {
        language: 'korean',
        includeKeyPoints: true
    });

    // Sample text
    const sampleText = `
    인공지능(AI) 기술의 발전은 현대 사회의 모든 영역에 혁신적인 변화를 가져오고 있습니다.
    특히 자연어 처리 분야에서는 대규모 언어 모델의 등장으로 텍스트 이해와 생성 능력이
    크게 향상되었습니다. GPT, BERT, T5와 같은 모델들은 번역, 요약, 질의응답 등 다양한
    작업에서 인간 수준의 성능을 보여주고 있습니다.

    이러한 기술 발전은 교육, 의료, 금융, 법률 등 전문 분야에서도 활발히 활용되고 있습니다.
    예를 들어, 의료 분야에서는 AI가 의료 영상 분석과 진단 보조 시스템으로 사용되고 있으며,
    금융 분야에서는 알고리즘 트레이딩과 리스크 관리에 적용되고 있습니다.

    하지만 AI 기술의 급속한 발전과 함께 윤리적 문제와 사회적 영향에 대한 우려도 제기되고
    있습니다. 개인정보 보호, 알고리즘 편향성, 일자리 대체 등의 문제에 대한 신중한 접근이
    필요한 시점입니다.
    `;

    try {
        // Generate summary
        const result = await summarizationService.summarize(sampleText, 'standard');

        console.log('Original text length:', sampleText.length);
        console.log('Summary length:', result.summary.length);
        console.log('Compression ratio:', result.metadata.compressionRatio);
        console.log('\nGenerated Summary:');
        console.log(result.summary);

    } catch (error) {
        console.error('Summarization failed:', error.message);
    }
}

// =============================================================================
// Example 2: PDF File Processing
// =============================================================================

async function pdfProcessingExample() {
    console.log('\n=== PDF File Processing Example ===');

    // This example shows how to integrate with the HTML application
    const fileInput = document.getElementById('fileInput');
    const file = fileInput.files[0];

    if (!file || file.type !== 'application/pdf') {
        console.error('Please select a PDF file');
        return;
    }

    try {
        // Extract text from PDF
        const text = await extractTextFromPDF(file);
        console.log('Extracted text length:', text.length);

        // Initialize services
        const apiClient = new OpenRouterClient({
            apiKey: 'sk-or-v1-your-api-key-here'
        });

        const tokenManager = new TokenManager({
            model: 'deepseek/deepseek-chat',
            maxTokensPerRequest: 4000
        });

        const summarizationService = new TextSummarizationService(apiClient);

        // Estimate cost before processing
        const costEstimate = tokenManager.estimateProcessingCost(text, 'standard');
        console.log('Estimated cost:', costEstimate.estimatedCost);
        console.log('Number of chunks:', costEstimate.chunks);

        if (!tokenManager.checkBudget(costEstimate.totalTokens)) {
            console.error('Insufficient budget for processing');
            return;
        }

        // Process with progress tracking
        const result = await summarizationService.summarize(text, 'standard', {
            onProgress: (progress) => {
                console.log(`Progress: ${progress.phase} - ${progress.current || 0}/${progress.total || 0}`);
            }
        });

        console.log('Processing completed!');
        console.log('Summary:', result.summary);
        console.log('Metadata:', result.metadata);

    } catch (error) {
        console.error('PDF processing failed:', error.message);
    }
}

// =============================================================================
// Example 3: Streaming Summarization
// =============================================================================

async function streamingSummarizationExample() {
    console.log('\n=== Streaming Summarization Example ===');

    const apiClient = new OpenRouterClient({
        apiKey: 'sk-or-v1-your-api-key-here'
    });

    const summarizationService = new TextSummarizationService(apiClient);

    const longText = `
    [Long text content that would benefit from streaming...]
    `;

    try {
        console.log('Starting streaming summarization...');

        let streamedContent = '';
        const result = await summarizationService.summarizeStream(
            longText,
            'detailed',
            (chunk) => {
                // Real-time chunk processing
                streamedContent += chunk;
                process.stdout.write(chunk); // Display in real-time
            }
        );

        console.log('\nStreaming completed!');
        console.log('Final result:', result);

    } catch (error) {
        console.error('Streaming failed:', error.message);
    }
}

// =============================================================================
// Example 4: Advanced Configuration and Error Handling
// =============================================================================

async function advancedConfigurationExample() {
    console.log('\n=== Advanced Configuration Example ===');

    // Initialize with custom configuration
    const errorHandler = new ErrorHandler({
        maxRetries: 5,
        baseDelay: 2000,
        circuitBreakerThreshold: 3
    });

    const apiClient = new OpenRouterClient({
        apiKey: 'sk-or-v1-your-api-key-here',
        model: 'deepseek/deepseek-chat',
        maxRetries: 3,
        requestTimeout: 90000
    });

    const promptTemplates = new PromptTemplates({
        language: 'korean'
    });

    const summarizationService = new TextSummarizationService(apiClient, {
        language: 'korean',
        includeKeyPoints: true,
        structuredOutput: true
    });

    const sampleText = 'Your text content here...';

    try {
        // Generate custom prompt
        const promptSet = promptTemplates.generatePromptSet(sampleText, {
            type: 'structured',
            mode: 'detailed',
            domain: 'academic',
            chainOfThought: 'analytical'
        });

        console.log('Generated prompt:', promptSet.messages[0].content);

        // Execute with error handling
        const result = await errorHandler.executeWithRetry(async () => {
            return await summarizationService.summarize(sampleText, 'detailed', {
                domain: 'academic'
            });
        });

        console.log('Summary generated successfully!');
        console.log('Error stats:', errorHandler.getErrorStats());

    } catch (error) {
        console.error('Advanced processing failed:', error.message);
        console.log('Recent errors:', errorHandler.getRecentErrors(5));
    }
}

// =============================================================================
// Example 5: Batch Processing Multiple Documents
// =============================================================================

async function batchProcessingExample() {
    console.log('\n=== Batch Processing Example ===');

    const documents = [
        { id: 'doc1', text: 'First document content...', type: 'news' },
        { id: 'doc2', text: 'Second document content...', type: 'academic' },
        { id: 'doc3', text: 'Third document content...', type: 'business' }
    ];

    const apiClient = new OpenRouterClient({
        apiKey: 'sk-or-v1-your-api-key-here',
        minRequestInterval: 500 // Rate limiting
    });

    const summarizationService = new TextSummarizationService(apiClient);
    const tokenManager = new TokenManager();

    const results = [];

    for (const doc of documents) {
        try {
            console.log(`Processing document ${doc.id}...`);

            // Estimate cost
            const estimate = tokenManager.estimateProcessingCost(doc.text, 'standard');
            console.log(`Estimated cost for ${doc.id}:`, estimate.estimatedCost);

            // Process with domain-specific settings
            const result = await summarizationService.summarize(doc.text, 'standard', {
                domain: doc.type
            });

            results.push({
                documentId: doc.id,
                summary: result.summary,
                metadata: result.metadata
            });

            // Record usage
            if (result.usage) {
                tokenManager.recordUsage(result.usage.total_tokens);
            }

            console.log(`Completed ${doc.id}`);

        } catch (error) {
            console.error(`Failed to process ${doc.id}:`, error.message);
            results.push({
                documentId: doc.id,
                error: error.message
            });
        }
    }

    console.log('\nBatch processing completed!');
    console.log('Results:', results);
    console.log('Usage stats:', tokenManager.getUsageStats());
}

// =============================================================================
// Example 6: Custom Domain-Specific Summarization
// =============================================================================

async function domainSpecificExample() {
    console.log('\n=== Domain-Specific Summarization Example ===');

    const promptTemplates = new PromptTemplates();

    // Add custom domain template
    promptTemplates.addCustomTemplate('domain', 'medical', {
        systemAddition: `
**의료 문서 특화 지침**:
- 의학적 정확성과 환자 안전 최우선
- 진단, 치료, 예후 정보 명확히 구분
- 복잡한 의학 용어의 적절한 설명
- 근거 기반 의학 정보 중심`,

        userAddition: `
**의료 요약 관점**:
- 주요 의학적 발견 및 의의
- 환자에게 미치는 영향
- 치료 옵션 및 권장사항
- 부작용 및 위험요소`
    });

    const medicalText = `
    환자는 65세 남성으로 3일간 지속된 흉통을 주소로 내원하였다.
    심전도 검사 결과 ST분절 상승이 관찰되었으며, 심근효소 수치가 상승하여
    급성 심근경색으로 진단되었다. 응급 심도자술을 시행하여 좌전하행지
    근위부의 완전 폐색을 확인하고 스텐트 삽입술을 성공적으로 완료하였다.
    `;

    const apiClient = new OpenRouterClient({
        apiKey: 'sk-or-v1-your-api-key-here'
    });

    const summarizationService = new TextSummarizationService(apiClient);

    try {
        const result = await summarizationService.summarize(medicalText, 'detailed', {
            domain: 'medical'
        });

        console.log('Medical summary:', result.summary);

    } catch (error) {
        console.error('Medical summarization failed:', error.message);
    }
}

// =============================================================================
// Example 7: Performance Monitoring and Analytics
// =============================================================================

function performanceMonitoringExample() {
    console.log('\n=== Performance Monitoring Example ===');

    const apiClient = new OpenRouterClient({
        apiKey: 'sk-or-v1-your-api-key-here'
    });

    const tokenManager = new TokenManager();
    const errorHandler = new ErrorHandler();

    // Simulate some operations
    setTimeout(() => {
        console.log('API Client Stats:', apiClient.getStats());
        console.log('Token Manager Stats:', tokenManager.getUsageStats());
        console.log('Error Handler Stats:', errorHandler.getErrorStats());

        // Performance summary
        const stats = {
            apiRequests: apiClient.getStats(),
            tokenUsage: tokenManager.getUsageStats(),
            errorMetrics: errorHandler.getErrorStats()
        };

        console.log('\nPerformance Summary:');
        console.log('- Total API requests:', stats.apiRequests.totalRequests);
        console.log('- Success rate:', stats.apiRequests.successRate);
        console.log('- Total tokens used:', stats.tokenUsage.totalTokensUsed);
        console.log('- Total cost:', stats.tokenUsage.totalCost);
        console.log('- Error rate:', stats.errorMetrics.failureRate);

    }, 1000);
}

// =============================================================================
// Example 8: Integration with React Components
// =============================================================================

// Example React component for using the summarization service
const SummarizationComponent = () => {
    const [text, setText] = React.useState('');
    const [summary, setSummary] = React.useState('');
    const [loading, setLoading] = React.useState(false);
    const [error, setError] = React.useState('');

    const apiClient = React.useMemo(() => new OpenRouterClient({
        apiKey: process.env.REACT_APP_OPENROUTER_API_KEY
    }), []);

    const summarizationService = React.useMemo(() =>
        new TextSummarizationService(apiClient), [apiClient]);

    const handleSummarize = async () => {
        if (!text.trim()) return;

        setLoading(true);
        setError('');

        try {
            const result = await summarizationService.summarize(text, 'standard');
            setSummary(result.summary);
        } catch (err) {
            setError('요약 생성에 실패했습니다: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div>
            <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="요약할 텍스트를 입력하세요..."
                rows={6}
            />
            <button onClick={handleSummarize} disabled={loading || !text.trim()}>
                {loading ? '요약 생성 중...' : '요약 생성'}
            </button>
            {error && <div className="error">{error}</div>}
            {summary && (
                <div className="summary">
                    <h3>요약 결과:</h3>
                    <div dangerouslySetInnerHTML={{ __html: summary }} />
                </div>
            )}
        </div>
    );
};

// =============================================================================
// Example 9: Node.js Server Implementation
// =============================================================================

// Example Express.js server
function createSummarizationServer() {
    const express = require('express');
    const cors = require('cors');
    const multer = require('multer');

    const app = express();
    const upload = multer({ dest: 'uploads/' });

    app.use(cors());
    app.use(express.json());

    // Initialize services
    const apiClient = new OpenRouterClient({
        apiKey: process.env.OPENROUTER_API_KEY
    });

    const summarizationService = new TextSummarizationService(apiClient);
    const errorHandler = new ErrorHandler();

    // Text summarization endpoint
    app.post('/api/summarize', async (req, res) => {
        try {
            const { text, mode = 'standard', options = {} } = req.body;

            if (!text) {
                return res.status(400).json({ error: 'Text is required' });
            }

            const result = await errorHandler.executeWithRetry(async () => {
                return await summarizationService.summarize(text, mode, options);
            });

            res.json(result);

        } catch (error) {
            console.error('Summarization error:', error);
            res.status(500).json({
                error: 'Summarization failed',
                message: error.message
            });
        }
    });

    // PDF upload and summarization endpoint
    app.post('/api/summarize-pdf', upload.single('pdf'), async (req, res) => {
        try {
            if (!req.file) {
                return res.status(400).json({ error: 'PDF file is required' });
            }

            // Extract text from PDF (implementation depends on PDF library)
            const text = await extractTextFromPDFBuffer(req.file.buffer);

            const result = await summarizationService.summarize(text, req.body.mode || 'standard');

            res.json(result);

        } catch (error) {
            console.error('PDF summarization error:', error);
            res.status(500).json({
                error: 'PDF summarization failed',
                message: error.message
            });
        }
    });

    // Health check endpoint
    app.get('/api/health', async (req, res) => {
        try {
            const connectionTest = await apiClient.testConnection();
            res.json({
                status: 'healthy',
                apiConnection: connectionTest.success,
                timestamp: new Date().toISOString()
            });
        } catch (error) {
            res.status(503).json({
                status: 'unhealthy',
                error: error.message,
                timestamp: new Date().toISOString()
            });
        }
    });

    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
        console.log(`Summarization server running on port ${PORT}`);
    });

    return app;
}

// =============================================================================
// Helper Functions
// =============================================================================

async function extractTextFromPDF(file) {
    return new Promise((resolve, reject) => {
        const fileReader = new FileReader();

        fileReader.onload = async function() {
            try {
                const typedarray = new Uint8Array(this.result);
                const pdf = await pdfjsLib.getDocument(typedarray).promise;
                let fullText = '';

                for (let i = 1; i <= pdf.numPages; i++) {
                    const page = await pdf.getPage(i);
                    const textContent = await page.getTextContent();
                    const pageText = textContent.items.map(item => item.str).join(' ');
                    fullText += pageText + '\n\n';
                }

                resolve(fullText.trim());
            } catch (error) {
                reject(error);
            }
        };

        fileReader.onerror = () => reject(new Error('File reading failed'));
        fileReader.readAsArrayBuffer(file);
    });
}

// Export examples for use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        basicSummarizationExample,
        pdfProcessingExample,
        streamingSummarizationExample,
        advancedConfigurationExample,
        batchProcessingExample,
        domainSpecificExample,
        performanceMonitoringExample,
        createSummarizationServer
    };
} else if (typeof window !== 'undefined') {
    window.SummarizationExamples = {
        basicSummarizationExample,
        pdfProcessingExample,
        streamingSummarizationExample,
        advancedConfigurationExample,
        batchProcessingExample,
        domainSpecificExample,
        performanceMonitoringExample
    };
}