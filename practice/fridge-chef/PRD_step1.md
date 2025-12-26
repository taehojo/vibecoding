# PRD Step 1: Image-Based Ingredient Recognition

## Overview

This phase implements the core image recognition functionality that identifies food ingredients from refrigerator photos using the OpenRouter API with the `nvidia/nemotron-nano-12b-v2-vl:free` vision model.

## Objectives

- Allow users to upload refrigerator/food images
- Recognize and extract ingredient names from uploaded images
- Return structured ingredient data for use in recipe generation (Step 2)

## Technical Stack

| Component | Technology |
|-----------|------------|
| Runtime | Python 3.14.2 with uv (vibecoding environment) |
| Web Framework | Streamlit |
| AI Model | nvidia/nemotron-nano-12b-v2-vl:free via OpenRouter |
| Image Processing | Base64 encoding, PIL |
| HTTP Client | requests |

## Environment Setup

```bash
# Activate uv environment
uv venv vibecoding --python 3.14.2
source .venv/bin/activate  # or on Windows: .venv\Scripts\activate

# Install dependencies
uv add streamlit python-dotenv requests pillow
```

## Functional Requirements

### FR-1: Image Upload
- **FR-1.1**: Support image upload via Streamlit file uploader
- **FR-1.2**: Support camera capture via `st.camera_input()`
- **FR-1.3**: Accept formats: JPEG, PNG, WebP
- **FR-1.4**: Maximum file size: 10MB
- **FR-1.5**: Image preview before processing

### FR-2: Ingredient Recognition
- **FR-2.1**: Send image to vision model via OpenRouter API
- **FR-2.2**: Extract ingredient names in Korean
- **FR-2.3**: Parse response into structured ingredient list
- **FR-2.4**: Allow user to edit/add/remove detected ingredients

### FR-3: User Interface
- **FR-3.1**: Clean, intuitive Streamlit layout
- **FR-3.2**: Sidebar for navigation and settings
- **FR-3.3**: Progress spinner during API call
- **FR-3.4**: Editable ingredient chips/tags

## Streamlit UI Design

```
┌─────────────────────────────────────────────────────────┐
│  🍳 Fridge Chef - 냉장고 재료 인식                        │
├─────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────┐│
│  │                                                     ││
│  │        📷 이미지를 업로드하거나 카메라로 촬영하세요      ││
│  │                                                     ││
│  │  [파일 선택] 또는 [카메라 촬영]                        ││
│  │                                                     ││
│  └─────────────────────────────────────────────────────┘│
│                                                         │
│  ┌──────────────────┐  ┌──────────────────────────────┐ │
│  │   이미지 미리보기   │  │  인식된 재료                  │ │
│  │                  │  │  ┌────┐ ┌────┐ ┌────┐       │ │
│  │   [업로드된 이미지] │  │  │양파│ │당근│ │계란│ ...   │ │
│  │                  │  │  └────┘ └────┘ └────┘       │ │
│  │                  │  │                              │ │
│  │                  │  │  ➕ 재료 추가                  │ │
│  └──────────────────┘  └──────────────────────────────┘ │
│                                                         │
│         [🍽️ 레시피 추천받기] (→ Step 2로 이동)            │
└─────────────────────────────────────────────────────────┘
```

## Implementation Details

### Vision Model Prompt

```text
당신은 냉장고 재료 인식 전문가입니다.
이 이미지에서 보이는 모든 식재료를 한국어로 나열해주세요.

형식:
- 재료명1
- 재료명2
- 재료명3

이미지에서 명확히 보이는 재료만 나열하세요.
조미료, 소스류도 포함해주세요.
```

### Project Structure

```
fridge-chef/
├── pyproject.toml
├── .env                      # OPENROUTER_API_KEY
├── .python-version           # 3.14.2
├── app.py                    # Streamlit main entry point
├── pages/
│   ├── 1_🍳_재료_인식.py      # Step 1: Ingredient recognition
│   ├── 2_📖_레시피_생성.py    # Step 2: Recipe generation
│   └── 3_👤_내_프로필.py      # Step 3: User profile
├── services/
│   ├── __init__.py
│   ├── vision.py             # OpenRouter vision API service
│   └── config.py             # Configuration management
├── utils/
│   ├── __init__.py
│   └── image.py              # Image processing utilities
└── tests/
    └── test_vision.py
```

### Core Service: vision.py

```python
import os
import base64
import requests
from dotenv import load_dotenv

load_dotenv()

class VisionService:
    def __init__(self):
        self.api_key = os.getenv("OPENROUTER_API_KEY")
        self.base_url = "https://openrouter.ai/api/v1/chat/completions"
        self.model = "nvidia/nemotron-nano-12b-v2-vl:free"

    def recognize_ingredients(self, image_bytes: bytes) -> list[str]:
        """Recognize ingredients from image bytes."""
        # Implementation details...
        pass
```

### Dependencies (pyproject.toml)

```toml
[project]
name = "fridge-chef"
version = "0.1.0"
requires-python = ">=3.14"
dependencies = [
    "streamlit>=1.40.0",
    "python-dotenv>=1.0.0",
    "requests>=2.32.0",
    "pillow>=11.0.0",
]

[tool.uv]
dev-dependencies = [
    "pytest>=8.0.0",
]
```

## Session State Management

```python
# Streamlit session state for cross-page data sharing
if 'recognized_ingredients' not in st.session_state:
    st.session_state.recognized_ingredients = []

if 'uploaded_image' not in st.session_state:
    st.session_state.uploaded_image = None
```

## Non-Functional Requirements

### NFR-1: Performance
- Image processing response time: < 10 seconds
- API timeout: 60 seconds
- Image compression for large files

### NFR-2: Error Handling
- Graceful handling of API failures
- User-friendly error messages in Korean
- Retry button for failed requests

### NFR-3: UX
- Responsive layout (works on mobile browsers)
- Dark/Light mode support (Streamlit default)
- Clear loading indicators

## Success Criteria

1. User can upload image and see ingredient list within 10 seconds
2. Recognition accuracy: ≥80% for common Korean ingredients
3. Mobile browser compatibility (iOS Safari, Android Chrome)
4. Ingredients can be edited before proceeding to Step 2

## Out of Scope (Step 1)

- Recipe generation (Step 2)
- User authentication (Step 3)
- Recipe storage (Step 3)
- Multiple image uploads in single session
- Ingredient quantity estimation

## Milestones

| Milestone | Description | Deliverable |
|-----------|-------------|-------------|
| M1.1 | Project setup with Streamlit | Running app with basic UI |
| M1.2 | Vision service integration | Working ingredient recognition |
| M1.3 | UI polish | Complete upload, preview, edit flow |
| M1.4 | Testing | Validated with 10+ refrigerator images |

## Running the Application

```bash
# Development
uv run streamlit run app.py

# Or with specific port
uv run streamlit run app.py --server.port 8501
```
