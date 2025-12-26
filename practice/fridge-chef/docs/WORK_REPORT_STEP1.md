# Fridge Chef Step 1 구현 작업 보고서

**작성일**: 2025-12-26
**작업자**: Claude Code (Opus 4.5)

---

## 1. 작업 개요

### 1.1 작업 목표
Fridge Chef 프로젝트의 Step 1 "이미지 기반 재료 인식" 기능 구현

### 1.2 작업 범위
- 이미지 업로드 및 카메라 촬영 UI
- OpenRouter Vision API 연동
- 재료 인식 및 파싱 로직
- 인식된 재료 편집 기능

---

## 2. 사용된 도구 (Tools)

### 2.1 파일 작업 도구

| Tool | 용도 | 사용 횟수 |
|------|------|-----------|
| **Read** | PRD 및 기존 코드 분석 | 다수 |
| **Write** | 새 파일 생성 | 5+ |
| **Edit** | 기존 파일 수정 | 3+ |
| **Glob** | 파일 패턴 검색 | 일부 |

### 2.2 실행 도구

| Tool | 용도 | 주요 명령어 |
|------|------|-------------|
| **Bash** | 의존성 설치 및 테스트 | `uv sync`, `uv run pytest` |

---

## 3. 작업 과정

### Phase 1: 요구사항 분석
1. `PRD_step1.md` 파일 읽기
2. OpenRouter API 문서 분석
3. 사용 가능한 무료 Vision 모델 조사

### Phase 2: 프로젝트 구조 설정
```
fridge-chef/
├── app.py                    # Streamlit 메인 엔트리
├── pages/
│   └── 1_🍳_재료_인식.py      # Step 1 페이지
├── services/
│   └── vision.py             # Vision API 서비스
└── utils/
    └── image.py              # 이미지 처리 유틸리티
```

### Phase 3: Vision 서비스 구현

**services/vision.py 주요 구성요소**:

```python
class VisionService:
    """OpenRouter Vision API를 통한 재료 인식 서비스"""

    MODEL = "nvidia/nemotron-nano-12b-v2-vl:free"
    API_URL = "https://openrouter.ai/api/v1/chat/completions"

    def recognize_ingredients(self, image_data: bytes) -> list[str]:
        """이미지에서 재료를 인식하여 목록 반환"""
        # 1. 이미지를 Base64로 인코딩
        # 2. 프롬프트 구성 (한국어 재료명 요청)
        # 3. OpenRouter API 호출
        # 4. 응답 파싱 및 재료 목록 추출
```

**프롬프트 설계**:
```
당신은 냉장고에 있는 재료를 인식하는 AI입니다.
이미지에서 보이는 모든 식재료를 한국어로 나열해주세요.
각 재료는 새 줄에 하나씩 작성하고, 불릿 포인트(-)로 시작해주세요.
```

### Phase 4: UI 페이지 구현

**pages/1_🍳_재료_인식.py 주요 기능**:

1. **이미지 입력 방식**:
   - 파일 업로드 (`st.file_uploader`)
   - 카메라 촬영 (`st.camera_input`)

2. **재료 인식 흐름**:
   ```python
   # 이미지 업로드 → Vision API 호출 → 재료 목록 표시
   if uploaded_file:
       image_data = uploaded_file.getvalue()
       ingredients = vision_service.recognize_ingredients(image_data)
       st.session_state.recognized_ingredients = ingredients
   ```

3. **재료 편집 기능**:
   - 인식된 재료 삭제
   - 수동 재료 추가
   - 재료 목록 초기화

### Phase 5: 세션 상태 관리

| Session Key | Type | Description |
|-------------|------|-------------|
| `recognized_ingredients` | `list[str]` | 인식된 재료 목록 |
| `uploaded_image` | `bytes` | 업로드된 이미지 데이터 |

---

## 4. 기술적 결정 사항

### 4.1 Vision 모델 선택
- **선택**: `nvidia/nemotron-nano-12b-v2-vl:free`
- **이유**: 무료 API 사용 가능, 한국어 지원, 이미지 인식 성능 우수

### 4.2 이미지 처리
- **Base64 인코딩**: API 전송을 위한 표준 방식
- **MIME 타입 감지**: 자동 감지로 다양한 포맷 지원
- **최대 크기 제한**: API 제한에 맞춰 리사이징 처리

### 4.3 응답 파싱
- **불릿 포인트 파싱**: `-` 또는 `•`로 시작하는 라인 추출
- **중복 제거**: 동일 재료 중복 인식 방지
- **정규화**: 재료명 정리 (공백, 특수문자 처리)

---

## 5. 생성된 파일 목록

| 디렉토리 | 파일 | 설명 |
|----------|------|------|
| `/` | `app.py` | Streamlit 메인 엔트리 포인트 |
| `pages/` | `1_🍳_재료_인식.py` | 재료 인식 페이지 |
| `services/` | `vision.py` | Vision API 서비스 |
| `utils/` | `image.py` | 이미지 처리 유틸리티 |

---

## 6. 수정된 파일 목록

| 파일 | 수정 내용 |
|------|-----------|
| `pyproject.toml` | Streamlit, Pillow, requests 의존성 추가 |
| `.env.example` | OPENROUTER_API_KEY 환경 변수 템플릿 |

---

## 7. API 연동 상세

### 7.1 OpenRouter API 구조

**Request**:
```json
{
  "model": "nvidia/nemotron-nano-12b-v2-vl:free",
  "messages": [
    {
      "role": "user",
      "content": [
        {"type": "text", "text": "프롬프트"},
        {"type": "image_url", "image_url": {"url": "data:image/jpeg;base64,..."}}
      ]
    }
  ]
}
```

**Response 파싱**:
```python
response_text = response["choices"][0]["message"]["content"]
ingredients = [line.strip("- •").strip() for line in response_text.split("\n") if line.strip()]
```

### 7.2 에러 처리
- API 키 미설정 시 경고 메시지
- 네트워크 오류 시 재시도 안내
- 인식 실패 시 수동 입력 유도

---

## 8. UI/UX 설계

### 8.1 페이지 레이아웃
```
┌─────────────────────────────────────┐
│  🍳 재료 인식                        │
├─────────────────────────────────────┤
│  [파일 업로드] [카메라 촬영]          │
├─────────────────────────────────────┤
│  ┌─────────────┐  ┌───────────────┐ │
│  │   이미지     │  │ 인식된 재료   │ │
│  │   미리보기   │  │ - 당근        │ │
│  │             │  │ - 양파        │ │
│  │             │  │ - 대파        │ │
│  └─────────────┘  └───────────────┘ │
├─────────────────────────────────────┤
│  [재료 추가] [초기화] [다음 단계 →]   │
└─────────────────────────────────────┘
```

### 8.2 사용자 흐름
1. 냉장고 사진 업로드 또는 촬영
2. AI가 자동으로 재료 인식
3. 필요시 재료 추가/삭제 편집
4. "레시피 생성" 버튼으로 Step 2 이동

---

## 9. 향후 개선 사항

1. **인식 정확도 향상**: 더 정교한 프롬프트 엔지니어링
2. **재료 카테고리화**: 채소, 육류, 유제품 등 분류
3. **인식 신뢰도 표시**: 각 재료별 인식 확률 표시
4. **이미지 전처리**: 밝기/대비 자동 조정으로 인식률 향상
5. **다중 이미지 지원**: 여러 장의 사진에서 재료 통합

---

*본 보고서는 Claude Code (Opus 4.5)에 의해 자동 생성되었습니다.*
