# PDF 요약 애플리케이션 배포 가이드

## 📋 개요

이 가이드는 OpenRouter API와 DeepSeek V3.1 모델을 사용하는 PDF 요약 웹 애플리케이션의 배포 방법을 설명합니다.

## 🏗️ 아키텍처

### 클라이언트 사이드 구조
```
pdf-summarizer-app/
├── pdf-summarizer-app.html     # 메인 애플리케이션
├── openrouter-client.js        # OpenRouter API 클라이언트
├── text-summarization-service.js # 요약 서비스
├── prompt-templates.js         # 프롬프트 템플릿
├── error-handler.js           # 에러 처리
├── token-manager.js           # 토큰 관리
├── config.js                  # 설정 관리
└── deployment-guide.md        # 이 파일
```

## 🚀 배포 옵션

### 1. 정적 웹사이트 배포 (권장)

#### Netlify 배포
```bash
# 1. 프로젝트 빌드 (필요시)
npm run build

# 2. Netlify CLI 설치
npm install -g netlify-cli

# 3. 배포
netlify deploy --prod --dir=./
```

#### Vercel 배포
```bash
# 1. Vercel CLI 설치
npm install -g vercel

# 2. 배포
vercel --prod
```

#### GitHub Pages 배포
1. GitHub 저장소에 코드 업로드
2. Settings > Pages에서 배포 설정
3. Branch를 `main`으로 설정

### 2. CDN 배포

#### HTML에 직접 포함
```html
<!DOCTYPE html>
<html>
<head>
    <title>PDF 요약 서비스</title>
</head>
<body>
    <!-- 애플리케이션 컨텐츠 -->

    <!-- 스크립트 로드 -->
    <script src="https://your-cdn.com/openrouter-client.js"></script>
    <script src="https://your-cdn.com/text-summarization-service.js"></script>
    <!-- 기타 모듈들 -->
</body>
</html>
```

### 3. 서버 사이드 프록시 (보안 권장)

#### Express.js 프록시 서버
```javascript
const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());

// API 프록시 엔드포인트
app.post('/api/summarize', async (req, res) => {
    try {
        const { text, mode, options } = req.body;

        // OpenRouter API 호출 (서버에서 API 키 사용)
        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: 'deepseek/deepseek-chat',
                messages: [
                    { role: 'system', content: '요약 시스템 프롬프트' },
                    { role: 'user', content: text }
                ]
            })
        });

        const result = await response.json();
        res.json(result);

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.listen(3000, () => {
    console.log('서버가 포트 3000에서 실행 중입니다.');
});
```

## 🔒 보안 고려사항

### 1. API 키 보안

#### 클라이언트 사이드 (현재 구현)
- ⚠️ API 키가 브라우저에 노출됨
- 개발/테스트 환경에만 적합
- 사용량 제한 설정 필요

#### 서버 사이드 (권장)
- ✅ API 키가 서버에서만 사용됨
- 환경 변수로 관리
- 클라이언트 인증 시스템 구현

### 2. CORS 설정

OpenRouter API는 CORS를 지원하므로 클라이언트에서 직접 호출 가능하지만, 보안상 프록시 서버 사용을 권장합니다.

```javascript
// CORS 헤더 설정 예시
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', 'https://your-domain.com');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.header('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
    next();
});
```

### 3. 입력 검증 및 sanitization

```javascript
// 서버 사이드 입력 검증
const validator = require('validator');

function validateInput(text) {
    if (!text || typeof text !== 'string') {
        throw new Error('유효하지 않은 입력입니다.');
    }

    if (text.length > 500000) { // 500KB 제한
        throw new Error('텍스트가 너무 큽니다.');
    }

    // XSS 방지
    return validator.escape(text);
}
```

## 🌍 환경 설정

### 1. 환경 변수 (.env)
```env
# API 설정
OPENROUTER_API_KEY=sk-or-v1-your-api-key-here
OPENROUTER_BASE_URL=https://openrouter.ai/api/v1

# 애플리케이션 설정
NODE_ENV=production
PORT=3000
CORS_ORIGIN=https://your-domain.com

# 보안 설정
RATE_LIMIT_REQUESTS_PER_MINUTE=60
MAX_FILE_SIZE=52428800  # 50MB
MAX_TEXT_LENGTH=500000  # 500K characters

# 모니터링
ENABLE_ANALYTICS=true
LOG_LEVEL=info
```

### 2. 설정 파일 (config/production.js)
```javascript
module.exports = {
    api: {
        baseUrl: process.env.OPENROUTER_BASE_URL,
        apiKey: process.env.OPENROUTER_API_KEY,
        timeout: 45000,
        maxRetries: 3
    },

    security: {
        corsOrigin: process.env.CORS_ORIGIN,
        rateLimitRpm: parseInt(process.env.RATE_LIMIT_REQUESTS_PER_MINUTE),
        maxFileSize: parseInt(process.env.MAX_FILE_SIZE),
        maxTextLength: parseInt(process.env.MAX_TEXT_LENGTH)
    },

    monitoring: {
        enableAnalytics: process.env.ENABLE_ANALYTICS === 'true',
        logLevel: process.env.LOG_LEVEL || 'info'
    }
};
```

## 📊 모니터링 및 로깅

### 1. 요청 로깅
```javascript
const winston = require('winston');

const logger = winston.createLogger({
    level: 'info',
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
    ),
    transports: [
        new winston.transports.File({ filename: 'error.log', level: 'error' }),
        new winston.transports.File({ filename: 'combined.log' })
    ]
});

// API 호출 로깅
app.use((req, res, next) => {
    logger.info({
        method: req.method,
        url: req.url,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        timestamp: new Date().toISOString()
    });
    next();
});
```

### 2. 에러 추적
```javascript
// 에러 처리 미들웨어
app.use((error, req, res, next) => {
    logger.error({
        error: error.message,
        stack: error.stack,
        url: req.url,
        method: req.method,
        ip: req.ip,
        timestamp: new Date().toISOString()
    });

    res.status(500).json({
        error: '서버 내부 오류가 발생했습니다.',
        requestId: req.id
    });
});
```

### 3. 사용량 모니터링
```javascript
// 사용량 추적
let usageStats = {
    totalRequests: 0,
    totalTokens: 0,
    totalCost: 0,
    errorCount: 0
};

// 사용량 업데이트
function updateUsageStats(tokens, cost, hasError = false) {
    usageStats.totalRequests++;
    usageStats.totalTokens += tokens;
    usageStats.totalCost += cost;
    if (hasError) usageStats.errorCount++;
}

// 사용량 리포트 엔드포인트
app.get('/api/stats', (req, res) => {
    res.json({
        ...usageStats,
        averageCostPerRequest: usageStats.totalCost / usageStats.totalRequests,
        errorRate: (usageStats.errorCount / usageStats.totalRequests * 100).toFixed(2) + '%'
    });
});
```

## 🔧 최적화 팁

### 1. 성능 최적화

#### 압축 활성화
```javascript
const compression = require('compression');
app.use(compression());
```

#### 캐싱 설정
```javascript
// 정적 파일 캐싱
app.use(express.static('public', {
    maxAge: '1d',  // 1일 캐싱
    etag: true
}));

// API 응답 캐싱 (Redis 사용)
const redis = require('redis');
const client = redis.createClient();

app.use('/api/summarize', async (req, res, next) => {
    const cacheKey = crypto.createHash('md5').update(JSON.stringify(req.body)).digest('hex');

    try {
        const cached = await client.get(cacheKey);
        if (cached) {
            return res.json(JSON.parse(cached));
        }
    } catch (error) {
        console.warn('캐시 읽기 실패:', error);
    }

    next();
});
```

### 2. 비용 최적화

#### 토큰 사용량 모니터링
```javascript
// 토큰 사용량 체크
function checkTokenUsage(estimatedTokens) {
    const dailyLimit = 1000000; // 일일 토큰 제한
    const currentUsage = getCurrentDailyUsage();

    if (currentUsage + estimatedTokens > dailyLimit) {
        throw new Error('일일 토큰 사용량을 초과했습니다.');
    }
}
```

#### 요청 최적화
```javascript
// 중복 요청 방지
const requestCache = new Map();

app.post('/api/summarize', (req, res) => {
    const requestHash = hashRequest(req.body);

    if (requestCache.has(requestHash)) {
        return res.json(requestCache.get(requestHash));
    }

    // 요청 처리...
});
```

## 🧪 테스트

### 1. 단위 테스트
```javascript
// test/openrouter-client.test.js
const { OpenRouterClient } = require('../openrouter-client');

describe('OpenRouterClient', () => {
    test('API 키 검증', () => {
        expect(() => {
            new OpenRouterClient({ apiKey: 'invalid-key' });
        }).toThrow('Invalid OpenRouter API key format');
    });

    test('토큰 추정', () => {
        const client = new OpenRouterClient({ apiKey: 'sk-or-v1-test' });
        const tokens = client.estimateTokens('Hello world');
        expect(tokens).toBeGreaterThan(0);
    });
});
```

### 2. 통합 테스트
```javascript
// test/integration.test.js
describe('요약 기능 통합 테스트', () => {
    test('짧은 텍스트 요약', async () => {
        const text = '짧은 테스트 텍스트입니다.';
        const result = await summarizationService.summarize(text, 'brief');

        expect(result.summary).toBeDefined();
        expect(result.metadata.originalLength).toEqual(text.length);
    });
});
```

## 🚨 트러블슈팅

### 1. 일반적인 문제들

#### CORS 오류
```
Access to fetch at 'https://openrouter.ai/api/v1/chat/completions'
from origin 'https://your-domain.com' has been blocked by CORS policy
```

**해결방법:**
- OpenRouter는 CORS를 지원하므로 정확한 헤더 설정 확인
- 프록시 서버 사용 고려

#### API 키 오류
```
401 Unauthorized: Invalid API key
```

**해결방법:**
- API 키 형식 확인 (`sk-or-v1-`로 시작)
- 환경 변수 설정 확인
- OpenRouter 계정 및 크레딧 확인

#### 토큰 제한 오류
```
400 Bad Request: Token limit exceeded
```

**해결방법:**
- 텍스트 청킹 구현 확인
- 토큰 추정 로직 개선
- 최대 토큰 수 조정

### 2. 디버깅 도구

#### 로그 분석
```bash
# 에러 로그 모니터링
tail -f error.log | grep "ERROR"

# 요청량 분석
grep "POST /api/summarize" combined.log | wc -l
```

#### 성능 모니터링
```javascript
// 응답 시간 측정
app.use((req, res, next) => {
    const start = Date.now();

    res.on('finish', () => {
        const duration = Date.now() - start;
        console.log(`${req.method} ${req.url} - ${duration}ms`);
    });

    next();
});
```

## 📞 지원 및 연락처

- **OpenRouter 문서**: https://openrouter.ai/docs
- **DeepSeek 모델 정보**: https://openrouter.ai/models/deepseek/deepseek-chat
- **기술 지원**: 프로젝트 이슈 트래커 또는 개발팀 연락

## 📄 라이선스

이 프로젝트는 MIT 라이선스 하에 배포됩니다. 자세한 내용은 LICENSE 파일을 참조하세요.