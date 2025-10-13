# PRD Step 1: 이미지 인식 핵심 기능
**Phase 1 - 냉장고 재료 인식 시스템 구축**

## 1. 프로젝트 개요

### 1.1 목표
냉장고 사진을 업로드하면 AI가 자동으로 재료를 인식하는 웹 애플리케이션의 핵심 기능 구현

### 1.2 범위
- 이미지 업로드 인터페이스
- OpenRouter API를 통한 Llama-4-maverick 모델 연동
- 재료 인식 및 결과 표시
- 기본 웹 UI 구축

### 1.3 개발 기간
5일 (1주)

### 1.4 성공 지표
- 이미지 업로드 성공률 95% 이상
- 재료 인식 정확도 70% 이상
- 응답 시간 15초 이내

## 2. 기술 스택

```yaml
Backend:
  - Python 3.9+
  - FastAPI (백엔드 API)
  - Pillow (이미지 처리)
  - python-dotenv (환경 변수)

Frontend:
  - Streamlit (웹 인터페이스)
  - HTML/CSS (스타일링)

AI/ML:
  - OpenRouter API
  - meta-llama/llama-4-maverick:free

Database:
  - JSON 파일 (임시 저장)
```

## 3. 시스템 아키텍처

```
┌─────────────────┐
│   Web Browser   │
└────────┬────────┘
         │
┌────────▼────────┐
│   Streamlit UI  │
└────────┬────────┘
         │
┌────────▼────────┐
│  Image Service  │
└────────┬────────┘
         │
┌────────▼────────┐
│ OpenRouter API  │
│  (Llama-4)      │
└─────────────────┘
```

## 4. 프로젝트 구조

```
Study-04/
├── app.py                    # Streamlit 메인 앱
├── backend/
│   ├── __init__.py
│   ├── config.py            # 설정 관리
│   ├── image_service.py     # 이미지 처리
│   └── openrouter_client.py # API 클라이언트
├── frontend/
│   ├── components.py        # UI 컴포넌트
│   └── styles.css          # 스타일시트
├── data/
│   └── temp/               # 임시 이미지 저장
├── tests/
│   └── test_images/        # 테스트 이미지
├── .env                    # API 키
├── requirements.txt        # 의존성
└── README.md              # 문서
```

## 5. 핵심 기능 상세

### 5.1 이미지 업로드 기능

#### 5.1.1 UI 컴포넌트
```python
# Streamlit 업로드 위젯
uploaded_file = st.file_uploader(
    "냉장고 사진을 업로드하세요",
    type=['jpg', 'jpeg', 'png', 'webp'],
    accept_multiple_files=False
)
```

#### 5.1.2 이미지 전처리
```python
class ImageProcessor:
    def process_image(self, file):
        # 1. 이미지 검증
        # 2. 크기 조정 (max 1024x1024)
        # 3. Base64 인코딩
        # 4. 메타데이터 추출
```

### 5.2 재료 인식 기능

#### 5.2.1 API 호출
```python
class IngredientRecognizer:
    def __init__(self):
        self.client = OpenRouterClient()
        self.model = "meta-llama/llama-4-maverick:free"

    def recognize(self, image_base64):
        prompt = self._create_prompt()
        response = self.client.chat(
            model=self.model,
            messages=[{
                "role": "user",
                "content": [
                    {"type": "text", "text": prompt},
                    {"type": "image_url", "image_url": {"url": f"data:image/jpeg;base64,{image_base64}"}}
                ]
            }]
        )
        return self._parse_response(response)
```

#### 5.2.2 프롬프트 엔지니어링
```python
RECOGNITION_PROMPT = """
You are analyzing a refrigerator image. Please identify all visible food ingredients.

Instructions:
1. List each ingredient you can clearly see
2. Group similar items together
3. Include approximate quantities when visible
4. Categorize by type (vegetables, fruits, meat, dairy, condiments, etc.)

Output Format:
Category: [Category Name]
- [Ingredient]: [Quantity if visible]

Be specific and accurate. Only list items you're confident about.
"""
```

### 5.3 결과 표시

#### 5.3.1 UI 레이아웃
```python
# 결과 표시 레이아웃
col1, col2 = st.columns([1, 1])

with col1:
    st.image(uploaded_image, caption="업로드된 이미지")

with col2:
    st.subheader("인식된 재료")
    for category, items in ingredients.items():
        st.write(f"**{category}**")
        for item in items:
            st.write(f"• {item}")
```

#### 5.3.2 데이터 구조
```json
{
  "timestamp": "2025-01-14T10:30:00",
  "image_id": "img_001",
  "ingredients": {
    "vegetables": ["양파 2개", "당근 1개", "감자 3개"],
    "meat": ["돼지고기 300g", "닭가슴살 200g"],
    "dairy": ["우유 1L", "치즈 100g"],
    "condiments": ["간장", "고추장", "참기름"]
  },
  "confidence": 0.85
}
```

## 6. 사용자 인터페이스

### 6.1 메인 화면 구성

```
┌─────────────────────────────────────┐
│       🍳 FridgeChef - Step 1        │
├─────────────────────────────────────┤
│                                     │
│    📷 냉장고 사진 업로드             │
│   ┌─────────────────────┐          │
│   │                     │          │
│   │   [Drop Image Here] │          │
│   │         or          │          │
│   │   [Browse Files]    │          │
│   │                     │          │
│   └─────────────────────┘          │
│                                     │
│   [재료 인식 시작] 버튼              │
│                                     │
├─────────────────────────────────────┤
│   📋 인식 결과                       │
│   Loading... / Results              │
└─────────────────────────────────────┘
```

### 6.2 상태 관리

```python
# Streamlit 세션 상태
if 'recognized_ingredients' not in st.session_state:
    st.session_state.recognized_ingredients = None
if 'processing' not in st.session_state:
    st.session_state.processing = False
```

## 7. 에러 처리

### 7.1 에러 유형

| 에러 코드 | 설명 | 사용자 메시지 |
|----------|------|--------------|
| ERR_IMG_001 | 파일 형식 오류 | "JPG, PNG, WEBP 형식만 지원됩니다" |
| ERR_IMG_002 | 파일 크기 초과 | "10MB 이하의 파일만 업로드 가능합니다" |
| ERR_API_001 | API 연결 실패 | "서버 연결에 실패했습니다. 잠시 후 다시 시도해주세요" |
| ERR_API_002 | 응답 시간 초과 | "처리 시간이 초과되었습니다" |

### 7.2 에러 처리 코드

```python
try:
    result = recognize_ingredients(image)
except APIError as e:
    st.error(f"오류가 발생했습니다: {e.user_message}")
    logging.error(f"API Error: {e}")
except Exception as e:
    st.error("예기치 않은 오류가 발생했습니다")
    logging.exception("Unexpected error")
```

## 8. 테스트 계획

### 8.1 테스트 케이스

| ID | 테스트 항목 | 입력 | 예상 결과 |
|----|------------|------|-----------|
| T1-01 | 정상 이미지 업로드 | clear_fridge.jpg | 재료 5개 이상 인식 |
| T1-02 | 빈 냉장고 | empty_fridge.jpg | "재료 없음" 메시지 |
| T1-03 | 흐린 이미지 | blurry.jpg | 일부 재료 인식 |
| T1-04 | 대용량 이미지 | large_image.jpg | 자동 리사이징 후 처리 |
| T1-05 | 잘못된 형식 | document.pdf | 에러 메시지 표시 |

### 8.2 성능 테스트

- 동시 사용자 5명 처리
- 평균 응답 시간 측정
- 메모리 사용량 모니터링

## 9. 보안 및 개인정보

### 9.1 보안 조치
- API 키 환경 변수 관리
- 업로드 파일 검증
- SQL 인젝션 방지
- XSS 공격 방지

### 9.2 개인정보 보호
- 업로드 이미지 임시 저장 후 자동 삭제
- 사용자 데이터 암호화
- 로그에 개인정보 미포함

## 10. 개발 일정

### Day 1: 환경 설정
- [x] 프로젝트 구조 생성
- [x] 의존성 설치
- [x] OpenRouter API 연동 테스트

### Day 2-3: 핵심 기능
- [ ] 이미지 업로드 UI
- [ ] 이미지 처리 서비스
- [ ] Llama-4 연동

### Day 4: 통합 및 테스트
- [ ] 전체 플로우 통합
- [ ] 에러 처리
- [ ] 단위 테스트

### Day 5: 최적화 및 배포
- [ ] UI/UX 개선
- [ ] 성능 최적화
- [ ] 문서 작성

## 11. 리스크 및 대응

### 11.1 기술적 리스크

| 리스크 | 영향도 | 대응 방안 |
|--------|--------|----------|
| API 응답 지연 | 높음 | 타임아웃 설정, 캐싱 |
| 이미지 인식 부정확 | 중간 | 프롬프트 최적화 |
| 서버 과부하 | 중간 | Rate limiting |

### 11.2 비즈니스 리스크
- 무료 API 한도 초과 → 사용량 모니터링
- 사용자 증가 → 확장 가능한 아키텍처

## 12. 완료 기준

### 12.1 필수 기능
- ✅ 이미지 업로드 가능
- ✅ 재료 인식 작동
- ✅ 결과 표시
- ✅ 에러 처리

### 12.2 품질 기준
- ✅ 응답 시간 15초 이내
- ✅ 인식 정확도 70% 이상
- ✅ 테스트 커버리지 60% 이상

## 13. 다음 단계 준비

Step 2에서 추가될 기능:
- DeepSeek 모델을 이용한 레시피 생성
- 재료 편집 기능
- 레시피 필터링
- 고급 UI 개선

---

**문서 정보**
- 작성일: 2025-01-14
- 버전: 1.0
- 작성자: System
- 검토 예정일: Step 1 완료 시