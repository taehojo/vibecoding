# PRD Step 2: 레시피 생성 시스템
**Phase 2 - AI 기반 레시피 추천 및 생성**

## 1. 프로젝트 개요

### 1.1 목표
Step 1에서 인식된 재료를 바탕으로 DeepSeek 모델을 활용하여 맞춤형 레시피를 생성하고 추천하는 시스템 구축

### 1.2 범위
- DeepSeek 모델 연동
- 레시피 생성 알고리즘
- 재료 편집 기능
- 레시피 상세 보기
- 필터링 및 검색 기능

### 1.3 개발 기간
7일 (1.5주)

### 1.4 성공 지표
- 레시피 생성 성공률 95% 이상
- 레시피 관련성 점수 80% 이상
- 사용자 만족도 4.0/5.0 이상

## 2. 기술 스택 (추가)

```yaml
Backend (추가):
  - deepseek/deepseek-chat-v3.1:free
  - SQLite (레시피 저장)
  - Pandas (데이터 처리)

Frontend (추가):
  - Streamlit components
  - Plotly (시각화)
  - Bootstrap CSS

Features:
  - 레시피 생성 엔진
  - 재료 매칭 알고리즘
  - 영양 정보 계산
```

## 3. 시스템 아키텍처 (확장)

```
┌─────────────────┐
│   Web Browser   │
└────────┬────────┘
         │
┌────────▼────────┐
│   Streamlit UI  │
└────────┬────────┘
         │
┌────────▼────────────────┐
│   Application Layer      │
├─────────┬───────────────┤
│ Image   │    Recipe     │
│ Service │   Generator   │
└─────────┴───────┬───────┘
                  │
┌─────────────────▼───────┐
│     OpenRouter API      │
├─────────┬───────────────┤
│ Llama-4 │   DeepSeek    │
└─────────┴───────────────┘
```

## 4. 핵심 기능 상세

### 4.1 레시피 생성 엔진

#### 4.1.1 DeepSeek 연동
```python
class RecipeGenerator:
    def __init__(self):
        self.model = "deepseek/deepseek-chat-v3.1:free"
        self.client = OpenRouterClient()

    def generate_recipes(self, ingredients, preferences=None):
        prompt = self._create_recipe_prompt(ingredients, preferences)
        response = self.client.chat(
            model=self.model,
            messages=[{
                "role": "system",
                "content": "You are a professional chef specializing in Korean cuisine."
            }, {
                "role": "user",
                "content": prompt
            }]
        )
        return self._parse_recipes(response)
```

#### 4.1.2 프롬프트 템플릿
```python
RECIPE_PROMPT = """
다음 재료들로 만들 수 있는 한국 요리 레시피를 3개 추천해주세요.

재료:
{ingredients}

요구사항:
- 난이도: {difficulty}
- 조리 시간: {cooking_time}
- 인분: {servings}

각 레시피는 다음 형식으로 작성해주세요:

레시피명: [요리 이름]
난이도: [쉬움/보통/어려움]
조리시간: [분]
인분: [인분 수]

재료:
- [재료명]: [양]

조리법:
1. [단계별 설명]
2. ...

팁: [요리 팁]
영양정보: [칼로리, 단백질, 탄수화물, 지방]
"""
```

### 4.2 재료 편집 기능

#### 4.2.1 재료 관리 UI
```python
# 재료 편집 인터페이스
st.subheader("재료 수정")

# 현재 재료 표시
for idx, ingredient in enumerate(st.session_state.ingredients):
    col1, col2, col3 = st.columns([3, 2, 1])

    with col1:
        # 재료명 수정
        new_name = st.text_input(f"재료 {idx+1}",
                                 value=ingredient['name'],
                                 key=f"ing_{idx}")

    with col2:
        # 수량 수정
        new_qty = st.text_input("수량",
                               value=ingredient.get('quantity', ''),
                               key=f"qty_{idx}")

    with col3:
        # 삭제 버튼
        if st.button("삭제", key=f"del_{idx}"):
            st.session_state.ingredients.pop(idx)
            st.rerun()

# 재료 추가
if st.button("+ 재료 추가"):
    st.session_state.ingredients.append({"name": "", "quantity": ""})
```

#### 4.2.2 재료 자동완성
```python
# 재료 데이터베이스
INGREDIENT_DB = {
    "vegetables": ["양파", "당근", "감자", "무", "배추", ...],
    "meat": ["돼지고기", "소고기", "닭고기", "오리고기", ...],
    "seafood": ["고등어", "갈치", "새우", "오징어", ...],
    "condiments": ["간장", "고추장", "된장", "참기름", ...]
}

def autocomplete_ingredient(partial_name):
    suggestions = []
    for category, items in INGREDIENT_DB.items():
        for item in items:
            if partial_name in item:
                suggestions.append(item)
    return suggestions[:5]
```

### 4.3 레시피 상세 보기

#### 4.3.1 레시피 카드 UI
```python
def display_recipe_card(recipe):
    with st.container():
        col1, col2 = st.columns([1, 2])

        with col1:
            # 레시피 이미지 (placeholder)
            st.image("recipe_placeholder.jpg")

            # 기본 정보
            st.metric("난이도", recipe['difficulty'])
            st.metric("조리시간", f"{recipe['time']}분")
            st.metric("칼로리", f"{recipe['calories']}kcal")

        with col2:
            st.subheader(recipe['name'])

            # 재료 목록
            with st.expander("재료 보기"):
                for ing in recipe['ingredients']:
                    st.write(f"• {ing['name']}: {ing['amount']}")

            # 조리 순서
            st.write("**조리법:**")
            for i, step in enumerate(recipe['steps'], 1):
                st.write(f"{i}. {step}")

            # 영양 정보
            st.write("**영양 정보:**")
            nutrition_df = pd.DataFrame([recipe['nutrition']])
            st.dataframe(nutrition_df)
```

#### 4.3.2 레시피 데이터 구조
```json
{
  "id": "recipe_001",
  "name": "김치찌개",
  "difficulty": "쉬움",
  "time": 30,
  "servings": 4,
  "calories": 250,
  "ingredients": [
    {"name": "김치", "amount": "300g", "available": true},
    {"name": "돼지고기", "amount": "200g", "available": true},
    {"name": "두부", "amount": "1/2모", "available": false}
  ],
  "steps": [
    "돼지고기를 먹기 좋은 크기로 자른다",
    "냄비에 참기름을 두르고 돼지고기를 볶는다",
    "김치를 넣고 함께 볶는다",
    "물을 붓고 끓인다",
    "두부와 파를 넣고 마무리한다"
  ],
  "nutrition": {
    "calories": 250,
    "protein": 18,
    "carbs": 15,
    "fat": 12
  },
  "tips": "신김치를 사용하면 더 맛있습니다"
}
```

### 4.4 필터링 및 검색

#### 4.4.1 필터 옵션
```python
# 사이드바 필터
with st.sidebar:
    st.subheader("레시피 필터")

    # 요리 종류
    cuisine = st.selectbox(
        "요리 종류",
        ["전체", "한식", "중식", "양식", "일식"]
    )

    # 난이도
    difficulty = st.select_slider(
        "난이도",
        options=["쉬움", "보통", "어려움"]
    )

    # 조리 시간
    cook_time = st.slider(
        "최대 조리 시간(분)",
        min_value=10,
        max_value=120,
        value=60,
        step=10
    )

    # 칼로리
    calories = st.slider(
        "최대 칼로리",
        min_value=100,
        max_value=1000,
        value=500,
        step=50
    )

    # 알레르기 필터
    allergies = st.multiselect(
        "제외할 재료 (알레르기)",
        ["땅콩", "우유", "계란", "밀", "갑각류"]
    )
```

#### 4.4.2 검색 및 정렬
```python
def search_recipes(query, filters):
    results = []

    # 텍스트 검색
    if query:
        results = [r for r in all_recipes
                  if query in r['name'] or
                     any(query in ing['name'] for ing in r['ingredients'])]

    # 필터 적용
    if filters['cuisine'] != "전체":
        results = [r for r in results if r['cuisine'] == filters['cuisine']]

    if filters['difficulty']:
        results = [r for r in results if r['difficulty'] == filters['difficulty']]

    if filters['max_time']:
        results = [r for r in results if r['time'] <= filters['max_time']]

    # 정렬
    if filters['sort_by'] == "time":
        results.sort(key=lambda x: x['time'])
    elif filters['sort_by'] == "calories":
        results.sort(key=lambda x: x['calories'])

    return results
```

### 4.5 레시피 평가 시스템

#### 4.5.1 매칭 점수 계산
```python
def calculate_match_score(recipe, available_ingredients):
    """
    레시피와 보유 재료의 매칭 점수 계산
    """
    total_ingredients = len(recipe['ingredients'])
    matched = 0

    for ing in recipe['ingredients']:
        if ing['name'] in available_ingredients:
            matched += 1

    match_score = (matched / total_ingredients) * 100

    # 보너스 점수
    if recipe['difficulty'] == "쉬움":
        match_score += 5

    if recipe['time'] <= 30:
        match_score += 5

    return min(match_score, 100)
```

## 5. 데이터베이스 설계

### 5.1 SQLite 스키마

```sql
-- 레시피 테이블
CREATE TABLE recipes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    difficulty TEXT,
    cooking_time INTEGER,
    servings INTEGER,
    calories INTEGER,
    cuisine TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 재료 테이블
CREATE TABLE ingredients (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT UNIQUE NOT NULL,
    category TEXT,
    unit TEXT
);

-- 레시피-재료 관계 테이블
CREATE TABLE recipe_ingredients (
    recipe_id INTEGER,
    ingredient_id INTEGER,
    amount TEXT,
    FOREIGN KEY (recipe_id) REFERENCES recipes(id),
    FOREIGN KEY (ingredient_id) REFERENCES ingredients(id)
);

-- 조리 단계 테이블
CREATE TABLE cooking_steps (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    recipe_id INTEGER,
    step_number INTEGER,
    description TEXT,
    FOREIGN KEY (recipe_id) REFERENCES recipes(id)
);
```

### 5.2 데이터 접근 계층

```python
class RecipeDatabase:
    def __init__(self, db_path="recipes.db"):
        self.conn = sqlite3.connect(db_path)
        self.cursor = self.conn.cursor()

    def save_recipe(self, recipe_data):
        # 레시피 저장 로직
        pass

    def get_recipes(self, filters=None):
        # 레시피 조회 로직
        pass

    def update_recipe(self, recipe_id, updates):
        # 레시피 수정 로직
        pass
```

## 6. UI/UX 개선

### 6.1 메인 화면 리뉴얼

```
┌──────────────────────────────────────────┐
│         🍳 FridgeChef - Step 2           │
├────────────┬─────────────────────────────┤
│            │                             │
│  사이드바   │         메인 콘텐츠          │
│            │                             │
│  [필터]     │  ┌──────┐ ┌──────┐ ┌──────┐│
│  • 요리종류  │  │레시피1│ │레시피2│ │레시피3││
│  • 난이도   │  │  IMG  │ │  IMG  │ │  IMG  ││
│  • 시간     │  │ ⭐4.5 │ │ ⭐4.2 │ │ ⭐4.8 ││
│  • 칼로리   │  │ 30분  │ │ 45분  │ │ 20분  ││
│            │  └──────┘ └──────┘ └──────┘│
│  [재료편집] │                             │
│            │  [더 많은 레시피 보기]        │
└────────────┴─────────────────────────────┘
```

### 6.2 인터랙션 개선

```python
# 로딩 애니메이션
with st.spinner('레시피를 생성하고 있습니다...'):
    recipes = generate_recipes(ingredients)

# 프로그레스 바
progress_bar = st.progress(0)
for i in range(100):
    progress_bar.progress(i + 1)
    time.sleep(0.01)

# 성공 메시지
st.success('레시피가 성공적으로 생성되었습니다!')

# 토스트 알림
st.toast('레시피가 저장되었습니다', icon='✅')
```

## 7. API 최적화

### 7.1 캐싱 전략

```python
@st.cache_data(ttl=3600)  # 1시간 캐시
def get_cached_recipes(ingredients_hash):
    return generate_recipes(ingredients)

# 재료 조합별 캐싱
def create_ingredients_hash(ingredients):
    sorted_ing = sorted([ing['name'] for ing in ingredients])
    return hashlib.md5(''.join(sorted_ing).encode()).hexdigest()
```

### 7.2 배치 처리

```python
async def generate_multiple_recipes(ingredient_sets):
    """여러 재료 세트에 대한 레시피 동시 생성"""
    tasks = []
    for ingredients in ingredient_sets:
        task = asyncio.create_task(
            generate_recipes_async(ingredients)
        )
        tasks.append(task)

    results = await asyncio.gather(*tasks)
    return results
```

## 8. 테스트 계획

### 8.1 통합 테스트

| ID | 테스트 항목 | 시나리오 | 예상 결과 |
|----|------------|---------|-----------|
| T2-01 | 레시피 생성 | 5개 재료 입력 | 3개 이상 레시피 |
| T2-02 | 재료 편집 | 재료 추가/삭제 | 실시간 업데이트 |
| T2-03 | 필터링 | 한식+30분 이내 | 조건 맞는 레시피만 |
| T2-04 | 검색 | "김치" 검색 | 김치 포함 레시피 |
| T2-05 | 캐싱 | 동일 재료 재요청 | 즉시 응답 |

### 8.2 사용성 테스트

- A/B 테스트: 레이아웃 비교
- 사용자 피드백 수집
- 클릭 히트맵 분석
- 세션 시간 측정

## 9. 성능 목표

### 9.1 응답 시간
- 레시피 생성: < 10초
- 필터링: < 1초
- 검색: < 0.5초
- 페이지 로드: < 3초

### 9.2 처리량
- 동시 사용자: 20명
- 시간당 요청: 500회
- 일일 레시피 생성: 1000개

## 10. 개발 일정

### Day 1-2: DeepSeek 연동
- [ ] API 클라이언트 구현
- [ ] 프롬프트 템플릿 작성
- [ ] 응답 파싱 로직

### Day 3-4: 레시피 생성
- [ ] 생성 엔진 구현
- [ ] 매칭 알고리즘
- [ ] 영양 정보 계산

### Day 5: 재료 편집
- [ ] 편집 UI 구현
- [ ] 자동완성 기능
- [ ] 재료 DB 구축

### Day 6: 필터 및 검색
- [ ] 필터 UI
- [ ] 검색 로직
- [ ] 정렬 기능

### Day 7: 통합 및 최적화
- [ ] 전체 통합
- [ ] 캐싱 구현
- [ ] 성능 테스트

## 11. 리스크 관리

### 11.1 기술적 리스크

| 리스크 | 영향도 | 대응 방안 |
|--------|--------|----------|
| DeepSeek API 불안정 | 높음 | 재시도 로직, 대체 모델 |
| 레시피 품질 저하 | 중간 | 프롬프트 개선, 후처리 |
| DB 성능 저하 | 낮음 | 인덱싱, 쿼리 최적화 |

## 12. 완료 기준

### 12.1 기능 완료
- ✅ DeepSeek 연동 완료
- ✅ 레시피 3개 이상 생성
- ✅ 재료 편집 가능
- ✅ 필터/검색 작동

### 12.2 품질 기준
- ✅ 레시피 관련성 80% 이상
- ✅ 응답 시간 목표 달성
- ✅ 에러율 1% 미만

## 13. Step 3 준비

다음 단계 기능:
- 사용자 프로필 시스템
- 레시피 저장/북마크
- 개인화 추천
- 소셜 공유

---

**문서 정보**
- 작성일: 2025-01-14
- 버전: 1.0
- 작성자: System
- 검토 예정일: Step 2 완료 시