# PDF 문서 요약 웹 애플리케이션

## 개요

이 프로젝트는 PDF 문서를 업로드하여 텍스트를 추출하고 AI를 활용해 요약하는 웹 애플리케이션입니다. 모든 백엔드 로직이 클라이언트 사이드에서 실행되며, 모듈화된 아키텍처로 설계되어 확장성과 유지보수성을 고려했습니다.

## 주요 기능

### 📁 PDF 파일 처리
- **드래그 앤 드롭 업로드**: 직관적인 파일 업로드 인터페이스
- **파일 유효성 검증**: PDF 형식 및 50MB 크기 제한 검증
- **진행률 표시**: 실시간 처리 상태 모니터링
- **메타데이터 추출**: 파일 정보 및 문서 속성 분석

### 🔍 텍스트 추출 및 처리
- **PDF.js 활용**: 브라우저 네이티브 PDF 처리
- **페이지별 추출**: 모든 페이지에서 텍스트 추출
- **텍스트 정리**: 연속된 공백 및 특수문자 정리
- **에러 처리**: 손상된 페이지에 대한 안전한 처리

### 🧩 지능형 텍스트 청킹
- **적응형 분할**: 단락, 문장, 단어 단위 계층적 분할
- **컨텍스트 보존**: 청크 간 오버랩으로 의미 연결성 유지
- **크기 최적화**: AI API 토큰 제한을 고려한 청크 크기 조정
- **품질 분석**: 청크 품질 평가 및 개선 제안

### 🤖 AI API 연동
- **다중 AI 제공업체 지원**: OpenAI, Claude 등 여러 AI 서비스 연동
- **자동 장애 복구**: 기본 제공업체 실패 시 대안 제공업체 사용
- **배치 처리**: 대용량 문서의 효율적인 병렬 처리
- **요약 타입 선택**: 포괄적, 불릿 포인트, 기술적 요약 등

### 🔧 시스템 관리
- **메모리 최적화**: 자동 메모리 정리 및 가비지 컬렉션
- **에러 추적**: 포괄적인 에러 로깅 및 분석
- **성능 모니터링**: 실시간 메모리 사용량 및 처리 시간 추적
- **상태 대시보드**: 시스템 상태 실시간 모니터링

## 파일 구조

```
Study-05/
├── pdf-summary.html              # 기본 PDF 요약 애플리케이션
├── pdf-summary-modular.html      # 모듈화된 고급 버전
├── pdf-backend-services.js       # 핵심 백엔드 서비스 모듈
├── api-integration-example.js    # AI API 연동 예제 코드
├── README.md                     # 프로젝트 문서
└── CLAUDE.md                     # 개발 가이드라인
```

## 기술 스택

### 프론트엔드
- **HTML5**: 시맨틱 마크업 및 접근성
- **CSS3**: 모던 스타일링 및 반응형 디자인
- **Vanilla JavaScript**: 순수 자바스크립트, 프레임워크 종속성 없음
- **PDF.js**: Mozilla의 PDF 렌더링 및 텍스트 추출 라이브러리

### 백엔드 아키텍처
- **모듈화 설계**: 각 기능별 독립적인 서비스 클래스
- **의존성 주입**: 느슨한 결합을 통한 테스트 용이성
- **에러 바운더리**: 계층적 에러 처리 및 복구
- **메모리 관리**: 자동 정리 및 최적화

### AI 연동
- **OpenAI GPT**: GPT-3.5/4 기반 텍스트 요약
- **Anthropic Claude**: Claude 3 모델 지원
- **범용 AI 인터페이스**: 새로운 AI 서비스 쉬운 추가

## 사용 방법

### 1. 기본 사용

1. `pdf-summary.html` 파일을 브라우저에서 열기
2. PDF 파일을 드래그 앤 드롭하거나 파일 선택 버튼 클릭
3. 텍스트 추출 완료 후 결과 확인
4. "AI로 요약하기" 버튼 클릭하여 요약 처리

### 2. 고급 사용 (모듈화 버전)

1. `pdf-summary-modular.html` 파일을 브라우저에서 열기
2. 동일한 업로드 과정 진행
3. 상세한 파일 정보 및 청크 분석 결과 확인
4. 시스템 상태 모니터링 대시보드 활용
5. 데이터 다운로드 기능으로 분석 결과 저장

### 3. 서버 배포 (Node.js 환경)

```javascript
// package.json 의존성
{
  "express": "^4.18.0",
  "multer": "^1.4.5",
  "cors": "^2.8.5"
}

// 서버 시작
const { createPDFSummaryServer } = require('./api-integration-example.js');

// 환경 변수 설정
process.env.OPENAI_API_KEY = 'your-openai-api-key';
process.env.CLAUDE_API_KEY = 'your-claude-api-key';

// 서버 시작
createPDFSummaryServer();
```

## 설정 옵션

### 텍스트 청킹 설정

```javascript
const chunkingOptions = {
    maxChunkSize: 4000,        // 최대 청크 크기
    overlapSize: 200,          // 청크 간 오버랩 크기
    preserveContext: true      // 컨텍스트 보존 여부
};
```

### AI API 설정

```javascript
const aiOptions = {
    apiEndpoint: '/api/summarize',
    timeout: 30000,            // 요청 타임아웃 (ms)
    retryAttempts: 3,          // 재시도 횟수
    retryDelay: 1000           // 재시도 간격 (ms)
};
```

### 메모리 관리 설정

```javascript
const memoryOptions = {
    autoCleanup: true,         // 자동 정리 활성화
    cleanupInterval: 60000,    // 정리 간격 (ms)
    memoryThreshold: 100 * 1024 * 1024  // 메모리 임계값 (bytes)
};
```

## API 엔드포인트

### POST /api/extract
PDF 파일 업로드 및 텍스트 추출

**요청:**
```
Content-Type: multipart/form-data
Body: PDF 파일
```

**응답:**
```json
{
    "success": true,
    "extraction": {
        "totalPages": 10,
        "fullText": "추출된 텍스트...",
        "metadata": { ... }
    }
}
```

### POST /api/summarize
텍스트 요약 처리

**요청:**
```json
{
    "content": {
        "fullText": "요약할 텍스트...",
        "chunks": [ ... ]
    },
    "options": {
        "type": "comprehensive",
        "length": "medium",
        "language": "korean"
    }
}
```

**응답:**
```json
{
    "success": true,
    "data": {
        "summary": "요약된 내용...",
        "keyPoints": [ ... ],
        "metadata": { ... }
    }
}
```

### GET /health
서버 상태 확인

**응답:**
```json
{
    "status": "healthy",
    "timestamp": "2024-01-01T00:00:00.000Z",
    "providers": ["openai", "claude"]
}
```

## 성능 특징

### 메모리 효율성
- **스트리밍 처리**: 대용량 파일의 점진적 처리
- **자동 정리**: 주기적인 메모리 해제
- **청크 최적화**: 메모리 사용량 최소화

### 처리 속도
- **병렬 처리**: 페이지별 동시 텍스트 추출
- **캐싱**: 중복 처리 방지
- **배치 처리**: AI API 호출 최적화

### 확장성
- **모듈화 설계**: 새로운 기능 쉬운 추가
- **플러그인 아키텍처**: AI 제공업체 동적 추가
- **설정 기반**: 런타임 설정 변경 지원

## 보안 고려사항

### 클라이언트 사이드 보안
- **파일 검증**: 엄격한 PDF 형식 및 크기 검증
- **메모리 보호**: 자동 정리를 통한 메모리 누수 방지
- **에러 처리**: 안전한 에러 메시지 표시

### 서버 사이드 보안
- **입력 검증**: 모든 입력 데이터 검증
- **파일 업로드 제한**: 크기 및 형식 제한
- **API 키 보호**: 환경 변수를 통한 안전한 키 관리

## 브라우저 호환성

- **Chrome**: 90+ (권장)
- **Firefox**: 88+
- **Safari**: 14+
- **Edge**: 90+

**필수 기능:**
- FileReader API
- Drag and Drop API
- Fetch API
- ES6+ 지원

## 라이선스

MIT License - 자유롭게 사용, 수정, 배포 가능

## 기여 방법

1. Fork 프로젝트
2. Feature 브랜치 생성 (`git checkout -b feature/AmazingFeature`)
3. 변경사항 커밋 (`git commit -m 'Add some AmazingFeature'`)
4. 브랜치에 Push (`git push origin feature/AmazingFeature`)
5. Pull Request 생성

## 지원

문제가 발생하거나 기능 요청이 있으시면 GitHub Issues를 통해 문의해 주세요.

---

**개발자 노트**: 이 애플리케이션은 클라이언트 사이드에서 완전히 동작하는 백엔드 아키텍처를 구현하여, 별도의 서버 없이도 강력한 PDF 처리 기능을 제공합니다. 실제 운영 환경에서는 서버 사이드 구현과 함께 사용하는 것을 권장합니다.