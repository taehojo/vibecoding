# PRD Step 2: AI Recipe Generation

## Overview

This phase implements recipe generation functionality using ingredients identified in Step 1. The system uses the `nex-agi/deepseek-v3.1-nex-n1:free` model via OpenRouter to generate personalized Korean recipes.

## Prerequisites

- Step 1 completed (Image-based ingredient recognition)
- OpenRouter API integration working
- Streamlit multi-page app structure established

## Objectives

- Generate recipes based on recognized ingredients
- Provide multiple recipe options (3 recipes per request)
- Support dietary preferences and cooking skill levels
- Display step-by-step cooking instructions

## Technical Stack

| Component | Technology |
|-----------|------------|
| Runtime | Python 3.14.2 with uv (vibecoding environment) |
| Web Framework | Streamlit (extended from Step 1) |
| AI Model | nex-agi/deepseek-v3.1-nex-n1:free via OpenRouter |
| State Management | Streamlit session_state |

## Functional Requirements

### FR-1: Recipe Generation
- **FR-1.1**: Accept ingredient list from Step 1 via session state
- **FR-1.2**: Generate 3 recipe suggestions per request
- **FR-1.3**: Include difficulty level, cooking time, and serving size
- **FR-1.4**: Provide detailed step-by-step instructions in Korean

### FR-2: Recipe Customization
- **FR-2.1**: Filter by cooking difficulty (쉬움/보통/어려움)
- **FR-2.2**: Filter by cooking time (15분 이하/30분 이하/1시간 이하)
- **FR-2.3**: Support dietary preferences (채식, 저염, 다이어트)
- **FR-2.4**: Allow excluding specific ingredients (allergies)

### FR-3: User Interface
- **FR-3.1**: Display recipe cards with expandable details
- **FR-3.2**: Ingredient checklist (보유 재료 vs 추가 필요 재료)
- **FR-3.3**: Regenerate button for new suggestions
- **FR-3.4**: Save recipe button (connects to Step 3)

## Streamlit UI Design

```
┌─────────────────────────────────────────────────────────┐
│  📖 레시피 생성                                          │
├─────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────┐│
│  │  📦 인식된 재료: 양파, 당근, 계란, 간장, 파          ││
│  │  [재료 수정하기]                                     ││
│  └─────────────────────────────────────────────────────┘│
│                                                         │
│  ┌─── 설정 ───────────────────────────────────────────┐ │
│  │ 난이도: [쉬움 ▼]  조리시간: [30분 이하 ▼]           │ │
│  │ 식이제한: ☐ 채식  ☐ 저염  ☐ 다이어트                │ │
│  │ 제외 재료: [                          ]             │ │
│  └────────────────────────────────────────────────────┘ │
│                                                         │
│  [🍳 레시피 생성하기]                                    │
│                                                         │
│  ┌─────────────────────────────────────────────────────┐│
│  │ 🍚 양파 계란 볶음밥                                  ││
│  │ ⏱️ 15분 | 👨‍🍳 쉬움 | 🍽️ 2인분                        ││
│  │                                                     ││
│  │ ✅ 보유: 양파, 당근, 계란, 간장                      ││
│  │ 🛒 필요: 밥, 소금, 참기름                            ││
│  │                                                     ││
│  │ ▶ 조리 순서 보기                                    ││
│  │ ┌─────────────────────────────────────────────────┐││
│  │ │ 1. 양파와 당근을 잘게 썰어주세요.                │││
│  │ │ 2. 팬에 기름을 두르고 야채를 볶아주세요.         │││
│  │ │ 3. 밥을 넣고 함께 볶아주세요.                    │││
│  │ │ 4. 계란을 넣고 스크램블하듯 섞어주세요.          │││
│  │ │ 5. 간장과 소금으로 간을 맞추고 완성!             │││
│  │ └─────────────────────────────────────────────────┘││
│  │                                                     ││
│  │ 💡 팁: 찬밥을 사용하면 더 맛있어요!                  ││
│  │                                                     ││
│  │ [💾 저장] [🔄 다른 레시피]                           ││
│  └─────────────────────────────────────────────────────┘│
│                                                         │
│  (레시피 카드 2, 3 반복...)                              │
└─────────────────────────────────────────────────────────┘
```

## Implementation Details

### Recipe Generation Prompt

```text
당신은 한국 요리 전문 셰프입니다.
주어진 재료로 만들 수 있는 레시피를 추천해주세요.

사용 가능한 재료: {ingredients}

요구사항:
- 난이도: {difficulty}
- 최대 조리 시간: {max_cooking_time}분
- 식이 제한: {dietary}
- 제외 재료: {exclude_ingredients}

다음 JSON 형식으로 정확히 3개의 레시피를 제공해주세요:

```json
{
  "recipes": [
    {
      "name": "요리 이름",
      "description": "한 줄 설명",
      "difficulty": "쉬움",
      "cooking_time": 15,
      "servings": 2,
      "ingredients": {
        "available": ["보유한 재료들"],
        "additional_needed": ["추가로 필요한 재료들"]
      },
      "instructions": [
        "1. 첫 번째 단계",
        "2. 두 번째 단계"
      ],
      "tips": ["요리 팁"]
    }
  ]
}
```

반드시 유효한 JSON 형식으로만 응답해주세요.
```

### Project Structure (Extended)

```
fridge-chef/
├── app.py                    # Main entry
├── pages/
│   ├── 1_🍳_재료_인식.py      # Step 1
│   ├── 2_📖_레시피_생성.py    # Step 2 (this phase)
│   └── 3_👤_내_프로필.py      # Step 3
├── services/
│   ├── __init__.py
│   ├── vision.py             # From Step 1
│   ├── recipe.py             # NEW: Recipe generation service
│   └── config.py
├── models/
│   ├── __init__.py
│   └── recipe.py             # NEW: Recipe data models
└── utils/
    ├── __init__.py
    ├── image.py
    └── parser.py             # NEW: JSON response parser
```

### Core Service: recipe.py

```python
import os
import json
import requests
from dataclasses import dataclass
from dotenv import load_dotenv

load_dotenv()

@dataclass
class Recipe:
    name: str
    description: str
    difficulty: str
    cooking_time: int
    servings: int
    available_ingredients: list[str]
    additional_ingredients: list[str]
    instructions: list[str]
    tips: list[str]

class RecipeService:
    def __init__(self):
        self.api_key = os.getenv("OPENROUTER_API_KEY")
        self.base_url = "https://openrouter.ai/api/v1/chat/completions"
        self.model = "nex-agi/deepseek-v3.1-nex-n1:free"

    def generate_recipes(
        self,
        ingredients: list[str],
        difficulty: str = "보통",
        max_time: int = 30,
        dietary: list[str] = None,
        exclude: list[str] = None
    ) -> list[Recipe]:
        """Generate recipes based on available ingredients."""
        # Implementation details...
        pass
```

### Session State Flow

```python
# Step 1 saves ingredients
st.session_state.recognized_ingredients = ["양파", "당근", "계란"]

# Step 2 reads ingredients and saves recipes
ingredients = st.session_state.get('recognized_ingredients', [])
st.session_state.generated_recipes = recipes

# Step 3 reads saved recipes
saved_recipes = st.session_state.get('saved_recipes', [])
```

### Additional Dependencies

```toml
[project]
dependencies = [
    # ... Step 1 dependencies ...
    # No additional dependencies needed for Step 2
]
```

## Non-Functional Requirements

### NFR-1: Performance
- Recipe generation response time: < 15 seconds
- JSON parsing with error recovery
- Caching of recent recipe generations

### NFR-2: Quality
- Generated recipes must be coherent and executable
- Ingredients should match Korean cooking context
- Instructions must be clear and sequential

### NFR-3: Reliability
- Graceful handling of malformed JSON responses
- Retry mechanism with modified prompts
- Fallback message if generation fails

## User Flow

```
[Step 1: 재료 인식]
        ↓
[세션에 재료 저장]
        ↓
[Step 2: 레시피 페이지 이동]
        ↓
[재료 확인/수정]
        ↓
[설정 선택 (난이도, 시간 등)]
        ↓
[레시피 생성 버튼 클릭]
        ↓
[3개 레시피 카드 표시]
        ↓
[레시피 상세 보기 / 저장]
```

## Error Handling

| Error Type | User Message | Action |
|------------|--------------|--------|
| API Timeout | "서버 응답이 늦어지고 있어요. 다시 시도해주세요." | Show retry button |
| Invalid JSON | "레시피 생성 중 오류가 발생했어요." | Auto-retry once |
| No Recipes | "해당 조건의 레시피를 찾지 못했어요." | Suggest relaxing filters |
| Rate Limit | "잠시 후 다시 시도해주세요." | Show countdown timer |

## Success Criteria

1. Generate 3 relevant recipes within 15 seconds
2. Recipes use ≥70% of provided ingredients
3. Instructions are clear and actionable in Korean
4. UI displays recipes in clean, readable card format
5. Additional needed ingredients are clearly marked

## Out of Scope (Step 2)

- Recipe saving/bookmarking (Step 3)
- User accounts (Step 3)
- Recipe history (Step 3)
- Nutrition information calculation
- Video cooking instructions

## Milestones

| Milestone | Description | Deliverable |
|-----------|-------------|-------------|
| M2.1 | Recipe service implementation | Working API integration |
| M2.2 | Prompt engineering | Reliable JSON output |
| M2.3 | Streamlit UI | Recipe cards with expand/collapse |
| M2.4 | Preference filters | Working filter controls |
| M2.5 | Integration | Seamless flow from Step 1 |
