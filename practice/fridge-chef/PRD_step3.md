# PRD Step 3: User Profiles, Personalization & Social Features

## Overview

This phase implements user authentication, profile management, recipe storage, personalized recommendations, analytics dashboard, and social sharing functionality. This completes the POC with a full-featured user experience.

## Prerequisites

- Step 1 completed (Image-based ingredient recognition)
- Step 2 completed (Recipe generation)
- SQLite database setup

## Objectives

- Implement user registration and authentication
- Save and organize favorite recipes
- Provide personalized recipe recommendations based on user history
- Display usage statistics and cooking insights
- Enable social sharing of recipes

## Technical Stack

| Component | Technology |
|-----------|------------|
| Runtime | Python 3.14.2 with uv (vibecoding environment) |
| Web Framework | Streamlit (extended from Steps 1-2) |
| Database | SQLite (POC) |
| ORM | SQLAlchemy 2.0 |
| Authentication | streamlit-authenticator or custom session-based |
| Password Hashing | bcrypt |
| Charts | Plotly / Altair (Streamlit native) |

## Functional Requirements

### FR-1: User Authentication
- **FR-1.1**: User registration with username and password
- **FR-1.2**: Secure login/logout with session management
- **FR-1.3**: Password hashing with bcrypt
- **FR-1.4**: "Remember me" functionality
- **FR-1.5**: Guest mode (limited features without login)

### FR-2: User Profile
- **FR-2.1**: Profile information (이름, 닉네임)
- **FR-2.2**: Dietary preferences (채식, 알레르기 등)
- **FR-2.3**: Cooking skill level (초보/중급/고급)
- **FR-2.4**: Favorite cuisines (한식, 일식, 중식 등)
- **FR-2.5**: Profile settings persistence

### FR-3: Recipe Management
- **FR-3.1**: Save recipes to personal collection
- **FR-3.2**: Organize recipes with tags/categories
- **FR-3.3**: Rate recipes (1-5 stars)
- **FR-3.4**: Add personal notes to saved recipes
- **FR-3.5**: Mark recipes as "cooked" with date
- **FR-3.6**: Delete saved recipes

### FR-4: Personalized Recommendation Algorithm
- **FR-4.1**: Recommend based on frequently used ingredients
- **FR-4.2**: Suggest recipes similar to highly-rated ones
- **FR-4.3**: Consider dietary preferences in recommendations
- **FR-4.4**: Time-based suggestions (아침/점심/저녁)
- **FR-4.5**: Seasonal ingredient recommendations

### FR-5: Dashboard & Statistics
- **FR-5.1**: Total recipes saved/cooked count
- **FR-5.2**: Most used ingredients chart
- **FR-5.3**: Cooking frequency calendar heatmap
- **FR-5.4**: Favorite cuisine distribution pie chart
- **FR-5.5**: Skill progression tracking
- **FR-5.6**: Weekly/monthly cooking summary

### FR-6: Social Sharing
- **FR-6.1**: Generate shareable recipe link
- **FR-6.2**: Copy recipe as formatted text (카카오톡용)
- **FR-6.3**: Export recipe as image card
- **FR-6.4**: Share to social platforms (URL scheme)
- **FR-6.5**: QR code generation for recipes

## Streamlit UI Design

### Profile Page
```
┌─────────────────────────────────────────────────────────┐
│  👤 내 프로필                                            │
├─────────────────────────────────────────────────────────┤
│  ┌─────────────┐                                        │
│  │   [아바타]   │  홍길동님, 안녕하세요! 🍳               │
│  │             │  요리 레벨: 중급 (32개 레시피 완료)      │
│  └─────────────┘                                        │
│                                                         │
│  ━━━ 프로필 설정 ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ │
│  닉네임: [요리왕길동        ]                            │
│  요리 실력: ○ 초보  ● 중급  ○ 고급                       │
│                                                         │
│  식이 제한:                                              │
│  ☐ 채식  ☑ 저염식  ☐ 저당  ☐ 글루텐프리                  │
│                                                         │
│  알레르기:                                               │
│  [땅콩, 갑각류                              ] [추가]     │
│                                                         │
│  선호 요리:                                              │
│  ☑ 한식  ☑ 일식  ☐ 중식  ☐ 양식  ☐ 동남아               │
│                                                         │
│  [💾 저장하기]                                           │
└─────────────────────────────────────────────────────────┘
```

### Dashboard Page
```
┌─────────────────────────────────────────────────────────┐
│  📊 나의 요리 대시보드                                   │
├─────────────────────────────────────────────────────────┤
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐   │
│  │ 저장한    │ │ 요리한    │ │ 평균     │ │ 연속     │   │
│  │ 레시피    │ │ 횟수     │ │ 평점     │ │ 요리     │   │
│  │   45     │ │   32     │ │  4.2⭐   │ │  7일 🔥  │   │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘   │
│                                                         │
│  ━━━ 요리 캘린더 ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ │
│  ┌─────────────────────────────────────────────────────┐│
│  │  [Monthly Heatmap Calendar - Cooking Activity]     ││
│  │   1월                                              ││
│  │   일 월 화 수 목 금 토                              ││
│  │      1  2  3  4  5  6                              ││
│  │   ░  █  ░  █  █  ░  █  (█ = cooked)                ││
│  └─────────────────────────────────────────────────────┘│
│                                                         │
│  ━━━ 자주 사용한 재료 TOP 10 ━━━━━━━━━━━━━━━━━━━━━━━━━━ │
│  ┌─────────────────────────────────────────────────────┐│
│  │  [Horizontal Bar Chart]                            ││
│  │  양파     ████████████████████ 28회                ││
│  │  계란     ████████████████ 24회                    ││
│  │  마늘     ██████████████ 21회                      ││
│  │  당근     ████████████ 18회                        ││
│  │  대파     ██████████ 15회                          ││
│  └─────────────────────────────────────────────────────┘│
│                                                         │
│  ━━━ 요리 카테고리 분포 ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ │
│  ┌─────────────────────────────────────────────────────┐│
│  │  [Pie Chart]                                       ││
│  │     한식 45%  일식 25%  중식 15%  기타 15%          ││
│  └─────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────┘
```

### Saved Recipes Page
```
┌─────────────────────────────────────────────────────────┐
│  💾 저장된 레시피                                        │
├─────────────────────────────────────────────────────────┤
│  검색: [            ] 정렬: [최근 저장순 ▼]              │
│  태그: [전체] [한식] [간단요리] [다이어트] ...            │
│                                                         │
│  ┌─────────────────────────────────────────────────────┐│
│  │ 🍚 양파 계란 볶음밥                    ⭐⭐⭐⭐⭐    ││
│  │ 저장일: 2024.01.15 | 요리 3회                       ││
│  │ 태그: #아침 #간단요리 #10분요리                      ││
│  │                                                     ││
│  │ 📝 메모: 아이들도 좋아함!                            ││
│  │                                                     ││
│  │ [📖 보기] [🍳 요리완료] [📤 공유] [🗑️ 삭제]         ││
│  └─────────────────────────────────────────────────────┘│
│                                                         │
│  ━━━ 맞춤 추천 레시피 ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ │
│  "양파와 계란을 자주 사용하시네요! 이 레시피는 어때요?"  │
│  ┌─────────────────────────────────────────────────────┐│
│  │ 🥘 스페인식 토르티야                                 ││
│  │ 추천 이유: 자주 사용하는 양파, 계란 기반             ││
│  │ [레시피 보기]                                       ││
│  └─────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────┘
```

### Social Sharing Modal
```
┌─────────────────────────────────────────────────────────┐
│  📤 레시피 공유하기                           [X 닫기]   │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  🔗 공유 링크                                           │
│  ┌─────────────────────────────────────────────────────┐│
│  │ https://fridge-chef.app/r/abc123                   ││
│  └─────────────────────────────────────────────────────┘│
│  [📋 복사하기]                                          │
│                                                         │
│  📱 SNS 공유                                            │
│  [카카오톡] [인스타그램] [트위터] [페이스북]             │
│                                                         │
│  📝 텍스트로 복사 (카카오톡/문자용)                      │
│  ┌─────────────────────────────────────────────────────┐│
│  │ 🍳 양파 계란 볶음밥                                 ││
│  │ ⏱️ 15분 | 👨‍🍳 쉬움 | 🍽️ 2인분                      ││
│  │                                                     ││
│  │ 📦 재료: 양파, 당근, 계란, 간장, 밥                  ││
│  │                                                     ││
│  │ 📝 만드는 법:                                       ││
│  │ 1. 양파와 당근을 잘게 썰어주세요.                   ││
│  │ 2. 팬에 기름을 두르고...                            ││
│  └─────────────────────────────────────────────────────┘│
│  [📋 텍스트 복사]                                       │
│                                                         │
│  🖼️ 이미지로 저장                                       │
│  [레시피 카드 이미지 다운로드]                          │
│                                                         │
│  📱 QR 코드                                             │
│  ┌─────────┐                                            │
│  │ [QR]    │  스마트폰으로 스캔하세요                   │
│  └─────────┘                                            │
└─────────────────────────────────────────────────────────┘
```

## Database Schema (SQLite)

```sql
-- Users table
CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    nickname TEXT,
    skill_level TEXT DEFAULT 'beginner',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- User preferences table
CREATE TABLE user_preferences (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    dietary_preferences TEXT DEFAULT '[]',  -- JSON array
    allergies TEXT DEFAULT '[]',            -- JSON array
    favorite_cuisines TEXT DEFAULT '[]',    -- JSON array
    excluded_ingredients TEXT DEFAULT '[]'  -- JSON array
);

-- Saved recipes table
CREATE TABLE saved_recipes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    recipe_data TEXT NOT NULL,              -- JSON object
    tags TEXT DEFAULT '[]',                 -- JSON array
    notes TEXT,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    is_favorite INTEGER DEFAULT 0,
    share_id TEXT UNIQUE,                   -- For sharing URLs
    saved_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Cooking history table
CREATE TABLE cooking_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    saved_recipe_id INTEGER REFERENCES saved_recipes(id) ON DELETE SET NULL,
    recipe_name TEXT NOT NULL,
    ingredients_used TEXT DEFAULT '[]',     -- JSON array
    cooked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    notes TEXT
);

-- Ingredient usage tracking (for recommendations)
CREATE TABLE ingredient_usage (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    ingredient_name TEXT NOT NULL,
    usage_count INTEGER DEFAULT 1,
    last_used TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, ingredient_name)
);

-- Create indexes for performance
CREATE INDEX idx_saved_recipes_user ON saved_recipes(user_id);
CREATE INDEX idx_cooking_history_user ON cooking_history(user_id);
CREATE INDEX idx_cooking_history_date ON cooking_history(cooked_at);
CREATE INDEX idx_ingredient_usage_user ON ingredient_usage(user_id);
```

## Personalization Algorithm

### Recommendation Engine

```python
class RecommendationEngine:
    def __init__(self, user_id: int, db: Database):
        self.user_id = user_id
        self.db = db

    def get_recommendations(self, limit: int = 5) -> list[Recipe]:
        """Generate personalized recipe recommendations."""

        # 1. Get user's frequently used ingredients
        top_ingredients = self._get_top_ingredients(limit=10)

        # 2. Get highly-rated recipes patterns
        favorite_patterns = self._analyze_favorites()

        # 3. Get user preferences
        preferences = self._get_user_preferences()

        # 4. Calculate recommendation score
        candidates = self._generate_candidates(
            ingredients=top_ingredients,
            patterns=favorite_patterns,
            preferences=preferences
        )

        # 5. Apply time-based filtering (아침/점심/저녁)
        candidates = self._apply_time_filter(candidates)

        # 6. Sort by score and return top N
        return sorted(candidates, key=lambda x: x.score, reverse=True)[:limit]

    def _get_top_ingredients(self, limit: int) -> list[str]:
        """Get user's most frequently used ingredients."""
        return self.db.query("""
            SELECT ingredient_name, usage_count
            FROM ingredient_usage
            WHERE user_id = ?
            ORDER BY usage_count DESC
            LIMIT ?
        """, [self.user_id, limit])

    def _analyze_favorites(self) -> dict:
        """Analyze patterns in highly-rated recipes."""
        favorites = self.db.query("""
            SELECT recipe_data, rating
            FROM saved_recipes
            WHERE user_id = ? AND rating >= 4
        """, [self.user_id])

        # Extract common patterns
        patterns = {
            'avg_cooking_time': 0,
            'preferred_difficulty': [],
            'common_ingredients': [],
            'cuisine_types': []
        }
        # ... pattern extraction logic
        return patterns
```

### Recommendation Types

| Type | Logic | Weight |
|------|-------|--------|
| Ingredient-based | Uses top 5 frequently used ingredients | 40% |
| Similarity-based | Similar to highly-rated recipes | 30% |
| Preference-based | Matches dietary/cuisine preferences | 20% |
| Exploration | New recipes user hasn't tried | 10% |

## Project Structure (Final)

```
fridge-chef/
├── pyproject.toml
├── .env
├── .python-version
├── fridge_chef.db              # SQLite database
├── app.py                      # Main entry point
├── pages/
│   ├── 1_🍳_재료_인식.py        # Step 1
│   ├── 2_📖_레시피_생성.py      # Step 2
│   ├── 3_👤_내_프로필.py        # Step 3: Profile
│   ├── 4_💾_저장된_레시피.py    # Step 3: Saved recipes
│   └── 5_📊_대시보드.py         # Step 3: Dashboard
├── services/
│   ├── __init__.py
│   ├── vision.py
│   ├── recipe.py
│   ├── auth.py                 # NEW: Authentication service
│   ├── user.py                 # NEW: User management
│   ├── recommendation.py       # NEW: Recommendation engine
│   └── sharing.py              # NEW: Social sharing service
├── db/
│   ├── __init__.py
│   ├── database.py             # NEW: SQLite connection
│   ├── models.py               # NEW: SQLAlchemy models
│   └── init_db.py              # NEW: Database initialization
├── utils/
│   ├── __init__.py
│   ├── image.py
│   ├── parser.py
│   ├── charts.py               # NEW: Chart utilities
│   └── qrcode.py               # NEW: QR code generation
├── components/
│   ├── __init__.py
│   ├── recipe_card.py          # NEW: Reusable recipe card
│   ├── share_modal.py          # NEW: Sharing modal
│   └── stats_widgets.py        # NEW: Dashboard widgets
└── tests/
    ├── test_vision.py
    ├── test_recipe.py
    ├── test_auth.py            # NEW
    ├── test_recommendation.py  # NEW
    └── test_sharing.py         # NEW
```

## Additional Dependencies

```toml
[project]
dependencies = [
    # ... Previous dependencies ...
    "sqlalchemy>=2.0.0",
    "bcrypt>=4.2.0",
    "plotly>=5.18.0",
    "qrcode[pil]>=7.4.0",
    "streamlit-authenticator>=0.3.0",
]
```

## Non-Functional Requirements

### NFR-1: Security
- Password hashing with bcrypt (cost factor 12)
- Session-based authentication
- SQL injection prevention via SQLAlchemy ORM
- Input sanitization for all user inputs

### NFR-2: Performance
- Database queries optimized with indexes
- Lazy loading for recipe lists
- Cached dashboard statistics (5-minute TTL)
- Efficient chart rendering

### NFR-3: Data Privacy
- User data stored locally (SQLite)
- No external data sharing without consent
- Option to export/delete all user data

### NFR-4: Usability
- Intuitive navigation
- Mobile-responsive design
- Consistent UI across pages
- Clear feedback for all actions

## Success Criteria

1. Users can register, login, and manage profiles
2. Recipe saving and retrieval works reliably
3. Dashboard displays accurate statistics
4. Recommendations improve with user activity
5. Sharing generates valid links and formatted text
6. All data persists across sessions

## Social Sharing Implementation

### Share Link Generation

```python
import secrets
import qrcode
from io import BytesIO

def generate_share_id() -> str:
    """Generate unique share ID for recipe."""
    return secrets.token_urlsafe(8)

def create_share_link(share_id: str) -> str:
    """Create shareable URL."""
    base_url = "https://fridge-chef.app"  # or localhost for POC
    return f"{base_url}/r/{share_id}"

def generate_qr_code(url: str) -> BytesIO:
    """Generate QR code image for URL."""
    qr = qrcode.make(url)
    buffer = BytesIO()
    qr.save(buffer, format='PNG')
    buffer.seek(0)
    return buffer

def format_recipe_for_sharing(recipe: dict) -> str:
    """Format recipe as copyable text."""
    return f"""
🍳 {recipe['name']}
⏱️ {recipe['cooking_time']}분 | 👨‍🍳 {recipe['difficulty']} | 🍽️ {recipe['servings']}인분

📦 재료: {', '.join(recipe['ingredients']['available'])}

📝 만드는 법:
{chr(10).join(recipe['instructions'])}

💡 팁: {recipe['tips'][0] if recipe['tips'] else ''}

🍳 Fridge Chef에서 만들어보세요!
"""
```

## Milestones

| Milestone | Description | Deliverable |
|-----------|-------------|-------------|
| M3.1 | Database setup | SQLite schema and connection |
| M3.2 | Authentication | Login/register/session management |
| M3.3 | Profile management | Profile CRUD with preferences |
| M3.4 | Recipe storage | Save/view/delete recipes |
| M3.5 | Recommendation engine | Working personalization |
| M3.6 | Dashboard | Statistics and charts |
| M3.7 | Social sharing | Links, text, QR codes |
| M3.8 | Integration testing | Full user journey tested |

## Running the Complete Application

```bash
# Initialize database
uv run python -c "from db.init_db import init_database; init_database()"

# Run application
uv run streamlit run app.py

# Run tests
uv run pytest tests/ -v
```
