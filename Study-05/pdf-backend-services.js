/**
 * PDF 문서 요약 애플리케이션 백엔드 서비스 모듈
 * 클라이언트 사이드에서 실행되는 모든 백엔드 로직을 포함
 */

// PDF 파일 검증 서비스
class PDFValidationService {
    constructor() {
        this.maxFileSize = 50 * 1024 * 1024; // 50MB
        this.allowedMimeTypes = ['application/pdf'];
        this.allowedExtensions = ['.pdf'];
    }

    /**
     * 파일 유효성 검증
     * @param {File} file - 검증할 파일
     * @returns {Object} 검증 결과
     */
    validateFile(file) {
        const errors = [];
        const warnings = [];

        // 파일 존재 확인
        if (!file) {
            errors.push('파일이 선택되지 않았습니다.');
            return { isValid: false, errors, warnings };
        }

        // 파일 크기 검증
        if (file.size === 0) {
            errors.push('빈 파일은 업로드할 수 없습니다.');
        } else if (file.size > this.maxFileSize) {
            errors.push(`파일 크기가 너무 큽니다. 최대 ${this.formatFileSize(this.maxFileSize)}까지 업로드 가능합니다.`);
        } else if (file.size > 10 * 1024 * 1024) { // 10MB 이상 시 경고
            warnings.push('파일이 큽니다. 처리 시간이 오래 걸릴 수 있습니다.');
        }

        // MIME 타입 검증
        if (!this.allowedMimeTypes.includes(file.type)) {
            errors.push('PDF 파일만 업로드 가능합니다.');
        }

        // 파일 확장자 검증
        const fileName = file.name.toLowerCase();
        const hasValidExtension = this.allowedExtensions.some(ext => fileName.endsWith(ext));
        if (!hasValidExtension) {
            errors.push('파일 확장자가 올바르지 않습니다. PDF 파일만 업로드 가능합니다.');
        }

        // 파일명 검증
        if (file.name.length > 255) {
            warnings.push('파일명이 너무 깁니다.');
        }

        return {
            isValid: errors.length === 0,
            errors,
            warnings,
            fileInfo: {
                name: file.name,
                size: file.size,
                type: file.type,
                lastModified: new Date(file.lastModified)
            }
        };
    }

    /**
     * 파일 크기 포맷팅
     * @param {number} bytes - 바이트 수
     * @returns {string} 포맷된 크기
     */
    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
}

// PDF 텍스트 추출 서비스
class PDFExtractionService {
    constructor() {
        this.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
        this.initializePDFJS();
    }

    /**
     * PDF.js 초기화
     */
    initializePDFJS() {
        if (typeof pdfjsLib !== 'undefined') {
            pdfjsLib.GlobalWorkerOptions.workerSrc = this.workerSrc;
        }
    }

    /**
     * 파일을 ArrayBuffer로 변환
     * @param {File} file - 변환할 파일
     * @returns {Promise<ArrayBuffer>} ArrayBuffer
     */
    fileToArrayBuffer(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = () => reject(new Error('파일을 읽을 수 없습니다.'));
            reader.readAsArrayBuffer(file);
        });
    }

    /**
     * PDF 문서에서 텍스트 추출
     * @param {File} file - PDF 파일
     * @param {Function} progressCallback - 진행률 콜백
     * @returns {Promise<Object>} 추출 결과
     */
    async extractTextFromPDF(file, progressCallback = () => {}) {
        try {
            progressCallback(0, 'PDF 파일을 읽는 중...');

            // 파일을 ArrayBuffer로 변환
            const arrayBuffer = await this.fileToArrayBuffer(file);
            progressCallback(20, 'PDF 문서를 분석하는 중...');

            // PDF 문서 로드
            const pdf = await pdfjsLib.getDocument(arrayBuffer).promise;
            progressCallback(40, '텍스트를 추출하는 중...');

            const extractionResult = {
                totalPages: pdf.numPages,
                pages: [],
                fullText: '',
                metadata: {
                    extractedAt: new Date().toISOString(),
                    fileName: file.name,
                    fileSize: file.size
                }
            };

            // 각 페이지에서 텍스트 추출
            for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
                try {
                    const page = await pdf.getPage(pageNum);
                    const textContent = await page.getTextContent();

                    let pageText = '';
                    const textItems = [];

                    textContent.items.forEach(item => {
                        if (item.str && item.str.trim()) {
                            pageText += item.str + ' ';
                            textItems.push({
                                text: item.str,
                                x: item.transform[4],
                                y: item.transform[5],
                                width: item.width,
                                height: item.height
                            });
                        }
                    });

                    const pageResult = {
                        pageNumber: pageNum,
                        text: pageText.trim(),
                        items: textItems,
                        extractedAt: new Date().toISOString()
                    };

                    extractionResult.pages.push(pageResult);

                    if (pageText.trim()) {
                        extractionResult.fullText += `\n--- 페이지 ${pageNum} ---\n${pageText.trim()}\n`;
                    }

                    // 진행률 업데이트
                    const progress = 40 + (pageNum / pdf.numPages) * 40;
                    progressCallback(progress, `페이지 ${pageNum}/${pdf.numPages} 처리 중...`);

                    // 메모리 최적화를 위해 잠시 대기
                    if (pageNum % 10 === 0) {
                        await new Promise(resolve => setTimeout(resolve, 10));
                    }

                } catch (error) {
                    console.error(`페이지 ${pageNum} 처리 중 오류:`, error);
                    extractionResult.pages.push({
                        pageNumber: pageNum,
                        text: '',
                        error: error.message,
                        extractedAt: new Date().toISOString()
                    });
                }
            }

            progressCallback(80, '텍스트를 정리하는 중...');

            // 텍스트 정리
            extractionResult.cleanedText = this.cleanText(extractionResult.fullText);

            progressCallback(100, '완료!');

            return extractionResult;

        } catch (error) {
            throw new Error(`PDF 텍스트 추출 실패: ${error.message}`);
        }
    }

    /**
     * 텍스트 정리
     * @param {string} text - 원본 텍스트
     * @returns {string} 정리된 텍스트
     */
    cleanText(text) {
        return text
            .replace(/\s+/g, ' ')  // 연속된 공백 제거
            .replace(/\n\s*\n/g, '\n')  // 연속된 빈 줄 제거
            .replace(/[^\w\s\uAC00-\uD7AF\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF.,!?;:()\-"']/g, '') // 특수문자 정리
            .trim();
    }

    /**
     * 메타데이터 추출
     * @param {Object} pdf - PDF 문서 객체
     * @returns {Promise<Object>} 메타데이터
     */
    async extractMetadata(pdf) {
        try {
            const metadata = await pdf.getMetadata();
            return {
                title: metadata.info.Title || '',
                author: metadata.info.Author || '',
                subject: metadata.info.Subject || '',
                creator: metadata.info.Creator || '',
                producer: metadata.info.Producer || '',
                creationDate: metadata.info.CreationDate || null,
                modificationDate: metadata.info.ModDate || null,
                pdfVersion: metadata.info.PDFFormatVersion || ''
            };
        } catch (error) {
            console.error('메타데이터 추출 실패:', error);
            return {};
        }
    }
}

// 텍스트 청킹 서비스
class TextChunkingService {
    constructor(options = {}) {
        this.maxChunkSize = options.maxChunkSize || 4000;
        this.overlapSize = options.overlapSize || 200;
        this.preserveContext = options.preserveContext !== false;
    }

    /**
     * 텍스트를 청크로 분할
     * @param {string} text - 분할할 텍스트
     * @param {Object} options - 옵션
     * @returns {Array} 청크 배열
     */
    createChunks(text, options = {}) {
        const chunkSize = options.maxChunkSize || this.maxChunkSize;
        const overlap = options.overlapSize || this.overlapSize;

        if (!text || text.trim().length === 0) {
            return [];
        }

        // 단락 기반 분할 시도
        const paragraphs = this.splitIntoParagraphs(text);
        if (paragraphs.length > 1) {
            return this.chunkByParagraphs(paragraphs, chunkSize, overlap);
        }

        // 문장 기반 분할
        const sentences = this.splitIntoSentences(text);
        if (sentences.length > 1) {
            return this.chunkBySentences(sentences, chunkSize, overlap);
        }

        // 단어 기반 분할
        return this.chunkByWords(text, chunkSize, overlap);
    }

    /**
     * 단락으로 분할
     * @param {string} text - 텍스트
     * @returns {Array} 단락 배열
     */
    splitIntoParagraphs(text) {
        return text.split(/\n\s*\n/).filter(p => p.trim().length > 0);
    }

    /**
     * 문장으로 분할
     * @param {string} text - 텍스트
     * @returns {Array} 문장 배열
     */
    splitIntoSentences(text) {
        return text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    }

    /**
     * 단락 기반 청킹
     * @param {Array} paragraphs - 단락 배열
     * @param {number} maxSize - 최대 크기
     * @param {number} overlap - 오버랩 크기
     * @returns {Array} 청크 배열
     */
    chunkByParagraphs(paragraphs, maxSize, overlap) {
        const chunks = [];
        let currentChunk = '';
        let currentParagraphs = [];

        for (const paragraph of paragraphs) {
            const potentialChunk = currentChunk + (currentChunk ? '\n\n' : '') + paragraph;

            if (potentialChunk.length <= maxSize) {
                currentChunk = potentialChunk;
                currentParagraphs.push(paragraph);
            } else {
                if (currentChunk) {
                    chunks.push(this.createChunkObject(currentChunk, chunks.length + 1, 'paragraph'));
                }

                if (paragraph.length > maxSize) {
                    // 단락이 너무 크면 문장으로 분할
                    const sentenceChunks = this.chunkBySentences(this.splitIntoSentences(paragraph), maxSize, overlap);
                    chunks.push(...sentenceChunks);
                    currentChunk = '';
                    currentParagraphs = [];
                } else {
                    currentChunk = paragraph;
                    currentParagraphs = [paragraph];
                }
            }
        }

        if (currentChunk) {
            chunks.push(this.createChunkObject(currentChunk, chunks.length + 1, 'paragraph'));
        }

        return this.addOverlap(chunks, overlap);
    }

    /**
     * 문장 기반 청킹
     * @param {Array} sentences - 문장 배열
     * @param {number} maxSize - 최대 크기
     * @param {number} overlap - 오버랩 크기
     * @returns {Array} 청크 배열
     */
    chunkBySentences(sentences, maxSize, overlap) {
        const chunks = [];
        let currentChunk = '';

        for (const sentence of sentences) {
            const trimmedSentence = sentence.trim();
            if (!trimmedSentence) continue;

            const potentialChunk = currentChunk + (currentChunk ? '. ' : '') + trimmedSentence;

            if (potentialChunk.length <= maxSize) {
                currentChunk = potentialChunk;
            } else {
                if (currentChunk) {
                    chunks.push(this.createChunkObject(currentChunk + '.', chunks.length + 1, 'sentence'));
                }

                if (trimmedSentence.length > maxSize) {
                    // 문장이 너무 크면 단어로 분할
                    const wordChunks = this.chunkByWords(trimmedSentence, maxSize, overlap);
                    chunks.push(...wordChunks);
                    currentChunk = '';
                } else {
                    currentChunk = trimmedSentence;
                }
            }
        }

        if (currentChunk) {
            chunks.push(this.createChunkObject(currentChunk + '.', chunks.length + 1, 'sentence'));
        }

        return this.addOverlap(chunks, overlap);
    }

    /**
     * 단어 기반 청킹
     * @param {string} text - 텍스트
     * @param {number} maxSize - 최대 크기
     * @param {number} overlap - 오버랩 크기
     * @returns {Array} 청크 배열
     */
    chunkByWords(text, maxSize, overlap) {
        const words = text.split(/\s+/).filter(w => w.trim().length > 0);
        const chunks = [];
        let currentChunk = '';

        for (const word of words) {
            const potentialChunk = currentChunk + (currentChunk ? ' ' : '') + word;

            if (potentialChunk.length <= maxSize) {
                currentChunk = potentialChunk;
            } else {
                if (currentChunk) {
                    chunks.push(this.createChunkObject(currentChunk, chunks.length + 1, 'word'));
                }
                currentChunk = word;
            }
        }

        if (currentChunk) {
            chunks.push(this.createChunkObject(currentChunk, chunks.length + 1, 'word'));
        }

        return this.addOverlap(chunks, overlap);
    }

    /**
     * 청크 객체 생성
     * @param {string} text - 청크 텍스트
     * @param {number} id - 청크 ID
     * @param {string} splitMethod - 분할 방법
     * @returns {Object} 청크 객체
     */
    createChunkObject(text, id, splitMethod) {
        return {
            id,
            text: text.trim(),
            length: text.trim().length,
            wordCount: text.trim().split(/\s+/).length,
            splitMethod,
            createdAt: new Date().toISOString()
        };
    }

    /**
     * 청크 간 오버랩 추가
     * @param {Array} chunks - 청크 배열
     * @param {number} overlapSize - 오버랩 크기
     * @returns {Array} 오버랩이 추가된 청크 배열
     */
    addOverlap(chunks, overlapSize) {
        if (!this.preserveContext || overlapSize <= 0 || chunks.length <= 1) {
            return chunks;
        }

        const overlappedChunks = [];

        for (let i = 0; i < chunks.length; i++) {
            const chunk = { ...chunks[i] };

            // 이전 청크의 끝부분 추가
            if (i > 0 && overlapSize > 0) {
                const prevChunk = chunks[i - 1];
                const prevOverlap = prevChunk.text.slice(-overlapSize);
                chunk.text = prevOverlap + ' ' + chunk.text;
                chunk.hasOverlapBefore = true;
            }

            // 다음 청크의 시작부분 추가
            if (i < chunks.length - 1 && overlapSize > 0) {
                const nextChunk = chunks[i + 1];
                const nextOverlap = nextChunk.text.slice(0, overlapSize);
                chunk.text = chunk.text + ' ' + nextOverlap;
                chunk.hasOverlapAfter = true;
            }

            chunk.length = chunk.text.length;
            overlappedChunks.push(chunk);
        }

        return overlappedChunks;
    }

    /**
     * 청크 품질 분석
     * @param {Array} chunks - 청크 배열
     * @returns {Object} 품질 분석 결과
     */
    analyzeChunkQuality(chunks) {
        if (!chunks || chunks.length === 0) {
            return { quality: 'empty', issues: ['No chunks provided'] };
        }

        const analysis = {
            totalChunks: chunks.length,
            averageLength: chunks.reduce((sum, chunk) => sum + chunk.length, 0) / chunks.length,
            minLength: Math.min(...chunks.map(c => c.length)),
            maxLength: Math.max(...chunks.map(c => c.length)),
            lengthVariance: this.calculateVariance(chunks.map(c => c.length)),
            splitMethods: [...new Set(chunks.map(c => c.splitMethod))],
            issues: [],
            recommendations: []
        };

        // 품질 이슈 분석
        if (analysis.averageLength < this.maxChunkSize * 0.3) {
            analysis.issues.push('청크 크기가 너무 작습니다');
            analysis.recommendations.push('maxChunkSize를 줄이거나 텍스트를 더 큰 단위로 그룹화하세요');
        }

        if (analysis.lengthVariance > analysis.averageLength * 0.5) {
            analysis.issues.push('청크 크기 편차가 큽니다');
            analysis.recommendations.push('더 일관된 분할 전략을 사용하세요');
        }

        if (chunks.some(c => c.length > this.maxChunkSize)) {
            analysis.issues.push('일부 청크가 최대 크기를 초과합니다');
            analysis.recommendations.push('maxChunkSize 설정을 확인하세요');
        }

        // 품질 점수 계산
        analysis.quality = this.calculateQualityScore(analysis);

        return analysis;
    }

    /**
     * 분산 계산
     * @param {Array} numbers - 숫자 배열
     * @returns {number} 분산
     */
    calculateVariance(numbers) {
        const mean = numbers.reduce((sum, num) => sum + num, 0) / numbers.length;
        const squaredDiffs = numbers.map(num => Math.pow(num - mean, 2));
        return squaredDiffs.reduce((sum, diff) => sum + diff, 0) / numbers.length;
    }

    /**
     * 품질 점수 계산
     * @param {Object} analysis - 분석 결과
     * @returns {string} 품질 점수
     */
    calculateQualityScore(analysis) {
        let score = 100;

        // 이슈에 따른 점수 차감
        score -= analysis.issues.length * 15;

        // 길이 편차에 따른 점수 차감
        if (analysis.lengthVariance > analysis.averageLength * 0.3) {
            score -= 20;
        }

        // 청크 수에 따른 점수 조정
        if (analysis.totalChunks === 1) {
            score += 10; // 청킹이 필요 없는 경우
        } else if (analysis.totalChunks > 20) {
            score -= 10; // 너무 많은 청크
        }

        if (score >= 80) return 'excellent';
        if (score >= 60) return 'good';
        if (score >= 40) return 'fair';
        return 'poor';
    }
}

// AI API 연동 서비스
class AIIntegrationService {
    constructor(options = {}) {
        this.apiEndpoint = options.apiEndpoint || '/api/summarize';
        this.timeout = options.timeout || 30000;
        this.retryAttempts = options.retryAttempts || 3;
        this.retryDelay = options.retryDelay || 1000;
    }

    /**
     * AI API용 데이터 준비
     * @param {Object} extractionResult - 추출 결과
     * @param {Array} chunks - 청크 배열
     * @param {Object} metadata - 추가 메타데이터
     * @returns {Object} AI API용 데이터
     */
    prepareDataForAI(extractionResult, chunks, metadata = {}) {
        return {
            document: {
                fileName: extractionResult.metadata.fileName,
                fileSize: extractionResult.metadata.fileSize,
                totalPages: extractionResult.totalPages,
                extractedAt: extractionResult.metadata.extractedAt
            },
            content: {
                fullText: extractionResult.cleanedText,
                totalChunks: chunks.length,
                chunks: chunks.map(chunk => ({
                    id: chunk.id,
                    text: chunk.text,
                    length: chunk.length,
                    wordCount: chunk.wordCount,
                    splitMethod: chunk.splitMethod
                }))
            },
            processing: {
                timestamp: new Date().toISOString(),
                version: '1.0.0',
                ...metadata
            }
        };
    }

    /**
     * AI API 호출
     * @param {Object} data - 전송할 데이터
     * @param {Object} options - 옵션
     * @returns {Promise<Object>} API 응답
     */
    async callAI(data, options = {}) {
        const requestOptions = {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            },
            body: JSON.stringify(data),
            signal: AbortSignal.timeout(options.timeout || this.timeout)
        };

        let lastError;

        for (let attempt = 1; attempt <= this.retryAttempts; attempt++) {
            try {
                const response = await fetch(this.apiEndpoint, requestOptions);

                if (!response.ok) {
                    throw new Error(`API 호출 실패: ${response.status} ${response.statusText}`);
                }

                const result = await response.json();
                return this.processAPIResponse(result, data);

            } catch (error) {
                lastError = error;
                console.error(`AI API 호출 시도 ${attempt} 실패:`, error);

                if (attempt < this.retryAttempts) {
                    await this.delay(this.retryDelay * attempt);
                }
            }
        }

        throw new Error(`AI API 호출 실패 (${this.retryAttempts}회 시도): ${lastError.message}`);
    }

    /**
     * API 응답 처리
     * @param {Object} response - API 응답
     * @param {Object} originalData - 원본 데이터
     * @returns {Object} 처리된 응답
     */
    processAPIResponse(response, originalData) {
        return {
            summary: response.summary || '',
            keyPoints: response.keyPoints || [],
            sentiment: response.sentiment || 'neutral',
            confidence: response.confidence || 0,
            metadata: {
                processedAt: new Date().toISOString(),
                originalDocument: originalData.document.fileName,
                processingTime: response.processingTime || 0,
                model: response.model || 'unknown'
            }
        };
    }

    /**
     * 지연 함수
     * @param {number} ms - 지연 시간 (밀리초)
     * @returns {Promise} 지연 Promise
     */
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * 청크별 개별 처리
     * @param {Array} chunks - 청크 배열
     * @param {Object} options - 옵션
     * @returns {Promise<Array>} 처리 결과 배열
     */
    async processChunksIndividually(chunks, options = {}) {
        const results = [];
        const batchSize = options.batchSize || 5;

        for (let i = 0; i < chunks.length; i += batchSize) {
            const batch = chunks.slice(i, i + batchSize);
            const batchPromises = batch.map(chunk =>
                this.callAI({ content: { text: chunk.text } }, options)
            );

            try {
                const batchResults = await Promise.allSettled(batchPromises);
                results.push(...batchResults);
            } catch (error) {
                console.error(`배치 ${Math.floor(i / batchSize) + 1} 처리 실패:`, error);
                results.push(...batch.map(() => ({ status: 'rejected', reason: error })));
            }
        }

        return results;
    }
}

// 메모리 관리 서비스
class MemoryManagementService {
    constructor() {
        this.memoryThresholds = {
            warning: 100 * 1024 * 1024,  // 100MB
            critical: 200 * 1024 * 1024  // 200MB
        };
        this.cleanupIntervals = new Set();
    }

    /**
     * 메모리 사용량 모니터링
     * @returns {Object} 메모리 정보
     */
    getMemoryInfo() {
        if ('memory' in performance) {
            return {
                used: performance.memory.usedJSHeapSize,
                total: performance.memory.totalJSHeapSize,
                limit: performance.memory.jsHeapSizeLimit,
                available: performance.memory.jsHeapSizeLimit - performance.memory.usedJSHeapSize
            };
        }
        return { available: 'unknown' };
    }

    /**
     * 메모리 정리
     * @param {Object} context - 정리할 컨텍스트
     */
    cleanup(context) {
        if (context.currentFile) {
            context.currentFile = null;
        }

        if (context.extractedText) {
            context.extractedText = '';
        }

        if (context.textChunks) {
            context.textChunks = [];
        }

        // 강제 가비지 컬렉션 (가능한 경우)
        if (typeof window !== 'undefined' && window.gc) {
            window.gc();
        }
    }

    /**
     * 자동 정리 설정
     * @param {number} interval - 정리 간격 (밀리초)
     * @param {Function} cleanupFn - 정리 함수
     * @returns {number} 인터벌 ID
     */
    scheduleCleanup(interval, cleanupFn) {
        const intervalId = setInterval(() => {
            const memoryInfo = this.getMemoryInfo();
            if (memoryInfo.used && memoryInfo.used > this.memoryThresholds.warning) {
                console.warn('메모리 사용량이 높습니다. 정리를 수행합니다.');
                cleanupFn();
            }
        }, interval);

        this.cleanupIntervals.add(intervalId);
        return intervalId;
    }

    /**
     * 모든 정리 인터벌 중지
     */
    stopAllCleanup() {
        this.cleanupIntervals.forEach(intervalId => {
            clearInterval(intervalId);
        });
        this.cleanupIntervals.clear();
    }
}

// 에러 처리 서비스
class ErrorHandlingService {
    constructor() {
        this.errorHistory = [];
        this.maxHistorySize = 100;
    }

    /**
     * 에러 처리
     * @param {Error} error - 에러 객체
     * @param {string} context - 에러 발생 컨텍스트
     * @returns {Object} 처리된 에러 정보
     */
    handleError(error, context = 'unknown') {
        const errorInfo = {
            message: error.message,
            stack: error.stack,
            context,
            timestamp: new Date().toISOString(),
            type: error.constructor.name
        };

        this.addToHistory(errorInfo);

        // 사용자 친화적 메시지 생성
        const userMessage = this.generateUserFriendlyMessage(error, context);

        return {
            userMessage,
            technical: errorInfo,
            suggestions: this.generateSuggestions(error, context)
        };
    }

    /**
     * 에러 히스토리에 추가
     * @param {Object} errorInfo - 에러 정보
     */
    addToHistory(errorInfo) {
        this.errorHistory.unshift(errorInfo);
        if (this.errorHistory.length > this.maxHistorySize) {
            this.errorHistory = this.errorHistory.slice(0, this.maxHistorySize);
        }
    }

    /**
     * 사용자 친화적 메시지 생성
     * @param {Error} error - 에러 객체
     * @param {string} context - 컨텍스트
     * @returns {string} 사용자 메시지
     */
    generateUserFriendlyMessage(error, context) {
        const errorPatterns = {
            'PDF parsing': 'PDF 파일을 분석할 수 없습니다.',
            'File reading': '파일을 읽을 수 없습니다.',
            'Network': '네트워크 연결에 문제가 있습니다.',
            'Memory': '메모리가 부족합니다.',
            'Timeout': '처리 시간이 초과되었습니다.'
        };

        for (const [pattern, message] of Object.entries(errorPatterns)) {
            if (error.message.includes(pattern) || context.includes(pattern)) {
                return message;
            }
        }

        return '예상치 못한 오류가 발생했습니다.';
    }

    /**
     * 해결 제안 생성
     * @param {Error} error - 에러 객체
     * @param {string} context - 컨텍스트
     * @returns {Array} 제안 배열
     */
    generateSuggestions(error, context) {
        const suggestions = [];

        if (error.message.includes('size') || context.includes('size')) {
            suggestions.push('더 작은 파일을 사용해보세요.');
        }

        if (error.message.includes('network') || error.message.includes('fetch')) {
            suggestions.push('인터넷 연결을 확인하고 다시 시도해보세요.');
        }

        if (error.message.includes('PDF') || error.message.includes('parsing')) {
            suggestions.push('다른 PDF 파일로 시도해보거나 파일이 손상되지 않았는지 확인해보세요.');
        }

        if (error.message.includes('memory') || context.includes('memory')) {
            suggestions.push('브라우저를 새로고침하고 다른 탭을 닫아보세요.');
        }

        if (suggestions.length === 0) {
            suggestions.push('페이지를 새로고침하고 다시 시도해보세요.');
        }

        return suggestions;
    }

    /**
     * 에러 통계 생성
     * @returns {Object} 에러 통계
     */
    getErrorStatistics() {
        const stats = {
            total: this.errorHistory.length,
            byType: {},
            byContext: {},
            recent: this.errorHistory.slice(0, 10)
        };

        this.errorHistory.forEach(error => {
            stats.byType[error.type] = (stats.byType[error.type] || 0) + 1;
            stats.byContext[error.context] = (stats.byContext[error.context] || 0) + 1;
        });

        return stats;
    }
}

// 통합 백엔드 서비스 매니저
class PDFBackendServiceManager {
    constructor(options = {}) {
        this.validation = new PDFValidationService();
        this.extraction = new PDFExtractionService();
        this.chunking = new TextChunkingService(options.chunking);
        this.aiIntegration = new AIIntegrationService(options.ai);
        this.memoryManagement = new MemoryManagementService();
        this.errorHandling = new ErrorHandlingService();

        this.options = {
            autoCleanup: options.autoCleanup !== false,
            cleanupInterval: options.cleanupInterval || 60000,
            ...options
        };

        if (this.options.autoCleanup) {
            this.setupAutoCleanup();
        }
    }

    /**
     * 자동 정리 설정
     */
    setupAutoCleanup() {
        this.memoryManagement.scheduleCleanup(
            this.options.cleanupInterval,
            () => this.memoryManagement.cleanup(this)
        );
    }

    /**
     * 전체 PDF 처리 파이프라인
     * @param {File} file - PDF 파일
     * @param {Function} progressCallback - 진행률 콜백
     * @param {Object} options - 옵션
     * @returns {Promise<Object>} 처리 결과
     */
    async processPDF(file, progressCallback = () => {}, options = {}) {
        try {
            // 1. 파일 검증
            progressCallback(0, '파일을 검증하는 중...');
            const validationResult = this.validation.validateFile(file);

            if (!validationResult.isValid) {
                throw new Error(validationResult.errors.join(', '));
            }

            // 2. 텍스트 추출
            progressCallback(10, '텍스트를 추출하는 중...');
            const extractionResult = await this.extraction.extractTextFromPDF(
                file,
                (progress, message) => progressCallback(10 + progress * 0.6, message)
            );

            // 3. 텍스트 청킹
            progressCallback(80, '텍스트를 분할하는 중...');
            const chunks = this.chunking.createChunks(extractionResult.cleanedText, options.chunking);
            const chunkQuality = this.chunking.analyzeChunkQuality(chunks);

            // 4. AI API용 데이터 준비
            progressCallback(90, 'AI 연동 데이터를 준비하는 중...');
            const aiData = this.aiIntegration.prepareDataForAI(extractionResult, chunks, options.metadata);

            progressCallback(100, '완료!');

            return {
                validation: validationResult,
                extraction: extractionResult,
                chunks: {
                    items: chunks,
                    quality: chunkQuality
                },
                aiData,
                metadata: {
                    processedAt: new Date().toISOString(),
                    processingTime: Date.now() - (options.startTime || Date.now()),
                    memoryInfo: this.memoryManagement.getMemoryInfo()
                }
            };

        } catch (error) {
            const errorInfo = this.errorHandling.handleError(error, 'PDF processing');
            throw new Error(errorInfo.userMessage);
        }
    }

    /**
     * AI 요약 처리
     * @param {Object} aiData - AI 데이터
     * @param {Object} options - 옵션
     * @returns {Promise<Object>} 요약 결과
     */
    async processWithAI(aiData, options = {}) {
        try {
            return await this.aiIntegration.callAI(aiData, options);
        } catch (error) {
            const errorInfo = this.errorHandling.handleError(error, 'AI processing');
            throw new Error(errorInfo.userMessage);
        }
    }

    /**
     * 서비스 정리
     */
    cleanup() {
        this.memoryManagement.stopAllCleanup();
        this.memoryManagement.cleanup(this);
    }

    /**
     * 서비스 상태 조회
     * @returns {Object} 상태 정보
     */
    getStatus() {
        return {
            memory: this.memoryManagement.getMemoryInfo(),
            errors: this.errorHandling.getErrorStatistics(),
            options: this.options
        };
    }
}

// 전역으로 서비스 매니저 내보내기
if (typeof window !== 'undefined') {
    window.PDFBackendServices = {
        PDFValidationService,
        PDFExtractionService,
        TextChunkingService,
        AIIntegrationService,
        MemoryManagementService,
        ErrorHandlingService,
        PDFBackendServiceManager
    };
}

// Node.js 환경에서의 내보내기
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        PDFValidationService,
        PDFExtractionService,
        TextChunkingService,
        AIIntegrationService,
        MemoryManagementService,
        ErrorHandlingService,
        PDFBackendServiceManager
    };
}