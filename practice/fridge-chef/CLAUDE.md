# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Fridge Chef** - 냉장고 재료 기반 레시피 추천 서비스

사용자가 냉장고 사진을 업로드하면 AI가 재료를 인식하고, 해당 재료로 만들 수 있는 레시피를 추천해주는 웹 애플리케이션.

## Project Status

POC (Proof of Concept) - **Step 1~3 구현 완료**

### Development Phases
- **Step 1**: 이미지 기반 재료 인식 (`PRD_step1.md`) ✅
- **Step 2**: AI 레시피 생성 (`PRD_step2.md`) ✅
- **Step 3**: 사용자 프로필 및 개인화 (`PRD_step3.md`) ✅

## Technical Stack

| Component | Technology |
|-----------|------------|
| Language | Python 3.14.2 |
| Package Manager | uv (environment: vibecoding) |
| Web Framework | Streamlit |
| Database | SQLite (POC) |
| ORM | SQLAlchemy 2.0 |
| AI API | OpenRouter |
| Authentication | bcrypt (cost factor 12) |
| Charts | Plotly |
| QR Code | qrcode[pil] |

### AI Models (via OpenRouter)
- **Vision Model**: `nvidia/nemotron-nano-12b-v2-vl:free` - 이미지에서 재료 인식
- **Text Model**: `nex-agi/deepseek-v3.1-nex-n1:free` - 레시피 생성

## Build/Run Commands

```bash
# Install dependencies
uv sync

# Run application
uv run streamlit run app.py

# Run with specific port
uv run streamlit run app.py --server.port 8501

# Run tests
uv run pytest tests/ -v

# Initialize database
uv run python -c "from db.init_db import init_database; init_database()"
```

## Architecture Overview

```
fridge-chef/
├── app.py                    # Streamlit main entry point
├── pages/                    # Streamlit multi-page structure
│   ├── 1_🍳_재료_인식.py      # Step 1: Image → Ingredients
│   ├── 2_📖_레시피_생성.py    # Step 2: Ingredients → Recipes
│   ├── 3_👤_내_프로필.py      # Step 3: User profile & auth
│   ├── 4_💾_저장된_레시피.py  # Step 3: Saved recipes management
│   └── 5_📊_대시보드.py       # Step 3: Statistics dashboard
├── services/                 # Business logic
│   ├── vision.py             # OpenRouter vision API
│   ├── recipe.py             # Recipe generation
│   ├── auth.py               # Authentication (bcrypt)
│   ├── user.py               # User recipe management
│   ├── recommendation.py     # Personalization & stats
│   └── sharing.py            # Social sharing & QR
├── db/                       # Database layer
│   ├── database.py           # SQLite connection
│   ├── models.py             # SQLAlchemy models
│   └── init_db.py            # Schema initialization
├── utils/                    # Utilities
│   └── charts.py             # Plotly chart helpers
├── components/               # Reusable Streamlit components
│   ├── recipe_card.py        # Recipe display card
│   ├── share_modal.py        # Share modal with QR/SNS
│   └── stats_widgets.py      # Dashboard stat widgets
└── tests/                    # Test files (66 tests)
    ├── test_vision.py
    ├── test_recipe.py
    ├── test_auth.py
    ├── test_user.py
    ├── test_recommendation.py
    └── test_sharing.py
```

## Database Models

| Model | Description |
|-------|-------------|
| `User` | 사용자 계정 (username, password_hash, nickname, skill_level) |
| `UserPreferences` | 식이 제한, 알레르기, 선호 요리, 제외 재료 |
| `SavedRecipe` | 저장된 레시피 (recipe_data JSON, tags, notes, rating) |
| `CookingHistory` | 요리 기록 (recipe_name, ingredients_used, rating) |
| `IngredientUsage` | 재료 사용 통계 (ingredient_name, usage_count) |

## Environment Configuration

`.env` 파일 필수 설정:

```env
OPENROUTER_API_KEY=your_api_key_here
```

## Key Dependencies

```toml
dependencies = [
    "streamlit>=1.40.0",
    "python-dotenv>=1.0.0",
    "requests>=2.32.0",
    "pillow>=11.0.0",
    "sqlalchemy>=2.0.0",
    "bcrypt>=4.2.0",
    "plotly>=5.18.0",
    "qrcode[pil]>=7.4.0",
]
```

## Testing

```bash
# Run all tests
uv run pytest tests/ -v

# Run specific test file
uv run pytest tests/test_auth.py -v
```

### Test Coverage (66 tests)
| Test File | Tests | Coverage |
|-----------|-------|----------|
| test_vision.py | 8 | Vision API, image encoding |
| test_recipe.py | 16 | Recipe generation, parsing |
| test_auth.py | 14 | Registration, login, profile |
| test_user.py | 9 | Recipe CRUD, tags |
| test_recommendation.py | 9 | Stats, cooking history |
| test_sharing.py | 10 | Share links, QR codes |

## Session State Keys

Streamlit session state keys used across pages:

| Key | Type | Description |
|-----|------|-------------|
| `recognized_ingredients` | `list[str]` | Step 1에서 인식된 재료 목록 |
| `uploaded_image` | `bytes` | 업로드된 이미지 데이터 |
| `generated_recipes` | `list[Recipe]` | Step 2에서 생성된 레시피 목록 |
| `user_id` | `int` | 로그인된 사용자 ID |
| `is_authenticated` | `bool` | 로그인 상태 |
| `share_recipe_id` | `int \| None` | 공유 모달을 표시할 레시피 ID |

## API Response Formats

### Vision API (재료 인식)
Prompt expects bullet-point list of ingredients in Korean.

### Recipe API (레시피 생성)
Response must be valid JSON with structure:
```json
{
  "recipes": [
    {
      "name": "string",
      "description": "string",
      "difficulty": "쉬움|보통|어려움",
      "cooking_time": number,
      "servings": number,
      "ingredients": { "available": [], "additional_needed": [] },
      "instructions": [],
      "tips": []
    }
  ]
}
```

## Key Features by Step

### Step 1: 재료 인식
- 이미지 업로드 (jpg, png, webp)
- OpenRouter Vision API로 재료 인식
- 재료 목록 편집 (추가/삭제)

### Step 2: 레시피 생성
- 인식된 재료 기반 레시피 추천
- 난이도, 요리 시간, 인분 수 표시
- 로그인 시 레시피 저장 가능

### Step 3: 사용자 프로필 & 개인화
- 회원가입/로그인 (bcrypt 해싱)
- 프로필 설정 (닉네임, 요리 실력)
- 식이 제한, 알레르기, 선호 요리 설정
- 레시피 저장, 태그, 메모, 평점
- 대시보드 (요리 통계, 캘린더 히트맵)
- 공유 기능 (URL, QR 코드, SNS)

## Code Style Guidelines

- 사용자 문서 및 UI 텍스트: 한국어
- 코드 주석 및 개발 문서: 영어
- Type hints 사용 권장
- Docstrings in English
