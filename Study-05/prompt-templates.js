/**
 * Prompt Engineering Templates for Text Summarization
 *
 * This module contains carefully crafted prompt templates optimized for
 * DeepSeek V3.1 model to achieve high-quality text summarization results.
 *
 * Features:
 * - Multiple template variations for different content types
 * - Korean language optimization
 * - Domain-specific prompts (academic, business, legal, etc.)
 * - Chain-of-thought reasoning integration
 * - Quality enhancement techniques
 */

class PromptTemplates {
    constructor(config = {}) {
        this.config = {
            language: config.language || 'korean',
            defaultStyle: config.defaultStyle || 'professional',
            includeMetadata: config.includeMetadata !== false,
            ...config
        };

        // Initialize template collections
        this.systemPrompts = new Map();
        this.userPrompts = new Map();
        this.domainPrompts = new Map();
        this.chainOfThoughtPrompts = new Map();

        this.initializeTemplates();
    }

    /**
     * Initialize all prompt templates
     */
    initializeTemplates() {
        this.initializeSystemPrompts();
        this.initializeUserPrompts();
        this.initializeDomainPrompts();
        this.initializeChainOfThoughtPrompts();
    }

    /**
     * Initialize system prompts for different contexts
     */
    initializeSystemPrompts() {
        // Basic summarization prompt
        this.systemPrompts.set('basic_korean', `당신은 한국어 텍스트 요약 전문가입니다. 다음 지침을 따라주세요:

**핵심 원칙**:
1. 원문의 핵심 메시지와 중요한 정보만 추출
2. 논리적 흐름과 구조를 유지하며 간결하게 표현
3. 객관적이고 정확한 정보만 포함, 추측이나 해석 금지
4. 명확하고 자연스러운 한국어로 작성
5. 요약 길이는 요청된 모드에 따라 조절

**품질 기준**:
- 중요도에 따른 정보 우선순위 적용
- 중복 내용 제거 및 핵심 내용 집중
- 읽기 쉽고 이해하기 쉬운 문체 사용
- 전문용어는 필요시 간단한 설명 추가

**금지사항**:
- 원문에 없는 내용 추가 금지
- 개인적 의견이나 평가 포함 금지
- 과도한 축약으로 인한 의미 손실 금지`);

        // Academic paper summarization
        this.systemPrompts.set('academic_korean', `당신은 학술 논문 요약 전문가입니다. 다음 지침을 따라 학술적 품질의 요약을 작성하세요:

**학술 요약 원칙**:
1. 연구 목적, 방법론, 주요 결과, 결론을 명확히 구분
2. 핵심 기여도와 새로운 발견사항 강조
3. 연구의 한계점이나 향후 연구 방향 포함
4. 정확한 학술 용어 사용 및 개념 설명
5. 데이터나 수치는 중요한 것만 선별적 포함

**구조화 요구사항**:
- 배경 및 목적
- 연구 방법
- 주요 결과
- 결론 및 의의
- 한계점 및 제언 (해당시)

**품질 지표**:
- 연구의 독창성과 기여도 명확히 드러내기
- 복잡한 개념을 이해하기 쉽게 설명
- 논리적 일관성 유지`);

        // Business document summarization
        this.systemPrompts.set('business_korean', `당신은 비즈니스 문서 요약 전문가입니다. 경영진과 실무진이 빠르게 이해할 수 있는 요약을 작성하세요:

**비즈니스 요약 원칙**:
1. 핵심 비즈니스 임팩트와 실행 가능한 인사이트 우선
2. 수치, 데이터, KPI 등 정량적 정보 강조
3. 리스크, 기회, 권장사항 명확히 구분
4. 의사결정에 필요한 핵심 정보 우선순위화
5. 간결하고 액션 지향적인 표현 사용

**포함 요소**:
- 핵심 요약 (Executive Summary)
- 주요 발견사항 및 통찰
- 비즈니스 임팩트 분석
- 권장 액션 아이템
- 리스크 및 고려사항

**비즈니스 관점**:
- ROI, 비용, 수익성 관련 정보 우선
- 시장 동향 및 경쟁력 분석
- 운영 효율성 개선 포인트`);

        // Legal document summarization
        this.systemPrompts.set('legal_korean', `당신은 법률 문서 요약 전문가입니다. 법률적 정확성을 유지하면서 핵심 내용을 요약하세요:

**법률 요약 원칙**:
1. 법률적 정확성과 완전성 최우선
2. 핵심 법적 쟁점과 근거 조항 명시
3. 권리, 의무, 책임 관계 명확히 구분
4. 법적 용어의 정확한 사용 및 필요시 설명
5. 중요한 날짜, 기한, 조건 등 누락 금지

**구조화 요소**:
- 주요 법적 쟁점
- 관련 법령 및 근거
- 당사자간 권리 및 의무
- 중요 조건 및 제한사항
- 법적 리스크 및 주의사항

**주의사항**:
- 법률 해석이나 자문 성격의 내용 지양
- 사실관계와 법적 판단 구분
- 전문적 법률 상담 필요성 안내`);

        // News article summarization
        this.systemPrompts.set('news_korean', `당신은 뉴스 기사 요약 전문가입니다. 독자가 빠르게 핵심 정보를 파악할 수 있는 요약을 작성하세요:

**뉴스 요약 원칙**:
1. 5W1H (누가, 언제, 어디서, 무엇을, 왜, 어떻게) 중심 구성
2. 최신성과 중요도에 따른 정보 우선순위
3. 객관적이고 균형잡힌 시각 유지
4. 핵심 인용문이나 발언 포함
5. 시간순 또는 중요도순 정보 배열

**포함 요소**:
- 핵심 사건/이슈 요약
- 주요 관련자 및 발언
- 배경 정보 및 맥락
- 향후 전망 및 영향
- 관련 데이터 및 수치

**뉴스 가치**:
- 시의성, 근접성, 중요성
- 인간적 관심사 및 사회적 영향
- 독자의 관심과 이해도 고려`);
    }

    /**
     * Initialize user prompt templates
     */
    initializeUserPrompts() {
        // Standard summarization prompt
        this.userPrompts.set('standard', (text, mode, options = {}) => {
            return `다음 텍스트를 ${mode} 모드로 요약해주세요.

**요약 모드**: ${mode}
**요구사항**: ${this.getModeDescription(mode)}

---

${text}

---

위 내용을 지정된 형식에 맞춰 요약해주세요.`;
        });

        // Structured summarization prompt
        this.userPrompts.set('structured', (text, mode, options = {}) => {
            const sections = options.sections || ['주요 내용', '핵심 포인트', '결론'];
            return `다음 텍스트를 ${mode} 모드로 구조화된 요약을 작성해주세요.

**요약 구조**:
${sections.map(section => `- ${section}`).join('\n')}

**요약 모드**: ${mode}
**상세도**: ${this.getModeDescription(mode)}

---

${text}

---

지정된 구조에 맞춰 각 섹션별로 명확히 구분하여 요약해주세요.`;
        });

        // Comparative summarization prompt
        this.userPrompts.set('comparative', (text, mode, options = {}) => {
            return `다음 텍스트를 ${mode} 모드로 요약하되, 비교 분석 관점에서 작성해주세요.

**분석 관점**:
- 주요 차이점 및 공통점
- 장단점 비교
- 상대적 중요도
- 결론 및 권장사항

**텍스트**:
${text}

---

비교 분석이 가능한 요소들을 중심으로 구조화된 요약을 작성해주세요.`;
        });

        // Timeline-based summarization prompt
        this.userPrompts.set('timeline', (text, mode, options = {}) => {
            return `다음 텍스트를 ${mode} 모드로 시간 순서에 따라 요약해주세요.

**시간순 요약 요구사항**:
- 주요 사건/변화의 시간적 흐름
- 각 시점별 핵심 내용
- 원인과 결과 관계
- 현재 상황 및 향후 전망

**텍스트**:
${text}

---

시간적 흐름을 명확히 드러내며 각 단계별 핵심 내용을 요약해주세요.`;
        });
    }

    /**
     * Initialize domain-specific prompts
     */
    initializeDomainPrompts() {
        // Technology/IT domain
        this.domainPrompts.set('technology', {
            systemAddition: `
**기술 문서 특화 지침**:
- 기술적 정확성과 최신성 유지
- 복잡한 기술 개념의 명확한 설명
- 실용적 적용 방안 및 구현 가능성
- 기술 동향 및 발전 방향성 분석
- 호환성, 확장성, 보안성 등 고려사항`,

            userAddition: `
**기술 요약 관점**:
- 핵심 기술 및 혁신사항
- 기술적 장점 및 한계
- 구현 복잡도 및 비용
- 기존 기술과의 차별점
- 미래 발전 가능성`
        });

        // Healthcare/Medical domain
        this.domainPrompts.set('medical', {
            systemAddition: `
**의료 문서 특화 지침**:
- 의학적 정확성과 엄밀성 최우선
- 환자 안전 및 윤리적 고려사항
- 근거 기반 의학 정보 중심
- 복잡한 의학 용어의 적절한 설명
- 진단, 치료, 예후 정보의 명확한 구분`,

            userAddition: `
**의료 요약 관점**:
- 주요 의학적 발견 및 의의
- 환자에게 미치는 영향
- 치료 옵션 및 권장사항
- 부작용 및 위험요소
- 추가 연구 필요성`
        });

        // Financial/Economic domain
        this.domainPrompts.set('finance', {
            systemAddition: `
**금융 문서 특화 지침**:
- 정확한 수치 및 재무 지표 제시
- 리스크 및 불확실성 요소 명시
- 시장 동향 및 경제적 맥락 고려
- 규제 및 정책 변화 영향 분석
- 투자 의사결정 관련 정보 우선순위화`,

            userAddition: `
**금융 요약 관점**:
- 핵심 재무 성과 및 지표
- 시장 기회 및 위험요소
- 투자 권장사항 및 근거
- 규제 환경 변화 영향
- 향후 전망 및 시나리오`
        });
    }

    /**
     * Initialize chain-of-thought prompts
     */
    initializeChainOfThoughtPrompts() {
        this.chainOfThoughtPrompts.set('analytical', (text, mode) => {
            return `다음 텍스트를 ${mode} 모드로 요약하되, 단계별 분석 과정을 거쳐주세요:

**1단계: 텍스트 구조 분석**
- 주요 섹션 및 논점 식별
- 핵심 주제 및 부주제 구분
- 논리적 흐름 파악

**2단계: 중요도 평가**
- 각 내용의 중요도 순위 매기기
- 핵심 메시지 및 지원 정보 구분
- 삭제 가능한 부차적 내용 식별

**3단계: 요약 구성**
- 선별된 핵심 내용 재구성
- 논리적 흐름에 따른 배열
- 적절한 길이로 압축

**텍스트**:
${text}

---

위 단계를 거쳐 체계적으로 요약을 작성해주세요.`;
        });

        this.chainOfThoughtPrompts.set('critical', (text, mode) => {
            return `다음 텍스트를 ${mode} 모드로 요약하되, 비판적 사고 과정을 적용해주세요:

**비판적 분석 단계**:
1. **사실과 의견 구분**: 객관적 사실과 주관적 의견 식별
2. **논리성 검증**: 논증의 타당성 및 근거의 충분성 평가
3. **다면적 관점**: 다양한 시각에서의 해석 가능성 고려
4. **한계점 인식**: 텍스트의 한계나 편향성 식별
5. **핵심 가치**: 가장 중요하고 신뢰할 수 있는 정보 선별

**텍스트**:
${text}

---

비판적 분석을 통해 신뢰성 있고 균형잡힌 요약을 작성해주세요.`;
        });
    }

    /**
     * Get mode description
     */
    getModeDescription(mode) {
        const descriptions = {
            brief: '핵심 내용만 간단히 (원문의 약 10%)',
            standard: '주요 내용을 균형있게 (원문의 약 20%)',
            detailed: '상세한 내용 포함 (원문의 약 30%)'
        };
        return descriptions[mode] || descriptions.standard;
    }

    /**
     * Generate system prompt
     */
    generateSystemPrompt(options = {}) {
        const {
            type = 'basic',
            domain = null,
            language = this.config.language,
            style = this.config.defaultStyle
        } = options;

        let basePrompt = this.systemPrompts.get(`${type}_${language}`) ||
                        this.systemPrompts.get(`basic_${language}`) ||
                        this.systemPrompts.get('basic_korean');

        // Add domain-specific additions
        if (domain && this.domainPrompts.has(domain)) {
            const domainPrompt = this.domainPrompts.get(domain);
            basePrompt += '\n\n' + domainPrompt.systemAddition;
        }

        // Add style modifications
        if (style === 'formal') {
            basePrompt += '\n\n**문체**: 격식있고 전문적인 어조로 작성';
        } else if (style === 'casual') {
            basePrompt += '\n\n**문체**: 친근하고 이해하기 쉬운 어조로 작성';
        }

        return basePrompt;
    }

    /**
     * Generate user prompt
     */
    generateUserPrompt(text, options = {}) {
        const {
            mode = 'standard',
            type = 'standard',
            domain = null,
            chainOfThought = false,
            customInstructions = ''
        } = options;

        let promptGenerator;

        // Use chain-of-thought if requested
        if (chainOfThought) {
            const cotType = typeof chainOfThought === 'string' ? chainOfThought : 'analytical';
            promptGenerator = this.chainOfThoughtPrompts.get(cotType);
            if (promptGenerator) {
                return promptGenerator(text, mode);
            }
        }

        // Use standard prompt generator
        promptGenerator = this.userPrompts.get(type) || this.userPrompts.get('standard');
        let prompt = promptGenerator(text, mode, options);

        // Add domain-specific user additions
        if (domain && this.domainPrompts.has(domain)) {
            const domainPrompt = this.domainPrompts.get(domain);
            prompt += '\n\n' + domainPrompt.userAddition;
        }

        // Add custom instructions
        if (customInstructions) {
            prompt += '\n\n**추가 요구사항**:\n' + customInstructions;
        }

        return prompt;
    }

    /**
     * Get available templates
     */
    getAvailableTemplates() {
        return {
            systemPrompts: Array.from(this.systemPrompts.keys()),
            userPrompts: Array.from(this.userPrompts.keys()),
            domainPrompts: Array.from(this.domainPrompts.keys()),
            chainOfThoughtPrompts: Array.from(this.chainOfThoughtPrompts.keys())
        };
    }

    /**
     * Add custom prompt template
     */
    addCustomTemplate(category, name, template) {
        const templateMap = {
            system: this.systemPrompts,
            user: this.userPrompts,
            domain: this.domainPrompts,
            cot: this.chainOfThoughtPrompts
        };

        if (templateMap[category]) {
            templateMap[category].set(name, template);
            return true;
        }
        return false;
    }

    /**
     * Generate complete prompt set
     */
    generatePromptSet(text, options = {}) {
        const systemPrompt = this.generateSystemPrompt(options);
        const userPrompt = this.generateUserPrompt(text, options);

        return {
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userPrompt }
            ],
            metadata: {
                type: options.type || 'standard',
                mode: options.mode || 'standard',
                domain: options.domain || null,
                chainOfThought: options.chainOfThought || false,
                language: options.language || this.config.language,
                style: options.style || this.config.defaultStyle
            }
        };
    }

    /**
     * Optimize prompt for specific model
     */
    optimizeForModel(promptSet, modelName = 'deepseek') {
        // DeepSeek specific optimizations
        if (modelName.includes('deepseek')) {
            // DeepSeek responds well to structured instructions
            promptSet.messages[0].content = promptSet.messages[0].content
                .replace(/\*\*(.*?)\*\*/g, '【$1】'); // Use different emphasis markers

            // Add model-specific instructions
            promptSet.messages[0].content += '\n\n【중요】: 반드시 지정된 형식을 정확히 따르고, 간결하면서도 포괄적인 요약을 작성하세요.';
        }

        return promptSet;
    }

    /**
     * A/B test different prompt variations
     */
    generateVariations(text, options = {}, variationCount = 2) {
        const variations = [];
        const baseOptions = { ...options };

        for (let i = 0; i < variationCount; i++) {
            const variantOptions = { ...baseOptions };

            // Create variations by modifying parameters
            if (i === 1) {
                variantOptions.chainOfThought = 'analytical';
            } else if (i === 2) {
                variantOptions.type = 'structured';
            }

            const promptSet = this.generatePromptSet(text, variantOptions);
            variations.push({
                id: `variant_${i + 1}`,
                promptSet: promptSet,
                options: variantOptions
            });
        }

        return variations;
    }
}

// Export for both Node.js and browser environments
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PromptTemplates;
} else if (typeof window !== 'undefined') {
    window.PromptTemplates = PromptTemplates;
}