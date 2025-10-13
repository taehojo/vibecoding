# PRD Step 3: 사용자 프로필 및 레시피 저장 시스템
**Phase 3 - 개인화 및 데이터 관리 기능**

## 1. 프로젝트 개요

### 1.1 목표
사용자별 프로필을 생성하여 개인의 레시피를 저장, 관리하고 맞춤형 추천을 제공하는 완성도 높은 웹 애플리케이션 구축

### 1.2 범위
- 사용자 인증 시스템
- 프로필 관리 기능
- 레시피 저장/북마크
- 개인화 추천 알고리즘
- 소셜 공유 기능
- 대시보드 및 통계

### 1.3 개발 기간
10일 (2주)

### 1.4 성공 지표
- 사용자 가입률 30% 이상
- 레시피 저장률 50% 이상
- 일일 활성 사용자(DAU) 100명
- 사용자당 평균 저장 레시피 10개

## 2. 기술 스택 (최종)

```yaml
Backend:
  - Python 3.9+
  - FastAPI
  - SQLAlchemy (ORM)
  - PostgreSQL (프로덕션 DB)
  - Redis (세션/캐시)
  - Celery (백그라운드 작업)

Frontend:
  - Streamlit
  - Streamlit-Authenticator
  - JavaScript (커스텀 컴포넌트)
  - CSS3 (애니메이션)

Security:
  - JWT (인증 토큰)
  - bcrypt (비밀번호 해싱)
  - OAuth 2.0 (소셜 로그인)

Cloud:
  - AWS S3 (이미지 저장)
  - CloudFront (CDN)
```

## 3. 시스템 아키텍처 (최종)

```
┌────────────────────────────────┐
│        Web Browser             │
└──────────┬─────────────────────┘
           │
┌──────────▼─────────────────────┐
│     Streamlit Frontend         │
└──────────┬─────────────────────┘
           │
┌──────────▼─────────────────────┐
│      FastAPI Backend           │
├────────────────────────────────┤
│  Auth │ Profile │ Recipe │ AI  │
└──────┬─────────┬────────┬──────┘
       │         │        │
┌──────▼─────────▼────────▼──────┐
│         PostgreSQL             │
└────────────────────────────────┘
       │
┌──────▼─────────────────────────┐
│    Redis Cache & Session       │
└────────────────────────────────┘
```

## 4. 사용자 인증 시스템

### 4.1 회원가입/로그인

#### 4.1.1 회원가입 플로우
```python
class UserRegistration:
    def register(self, user_data):
        # 1. 입력 검증
        validate_email(user_data['email'])
        validate_password(user_data['password'])

        # 2. 중복 확인
        if user_exists(user_data['email']):
            raise ValueError("이미 가입된 이메일입니다")

        # 3. 비밀번호 해싱
        hashed_password = bcrypt.hashpw(
            user_data['password'].encode('utf-8'),
            bcrypt.gensalt()
        )

        # 4. 사용자 생성
        user = User(
            email=user_data['email'],
            username=user_data['username'],
            password=hashed_password
        )

        # 5. 환영 이메일 발송
        send_welcome_email(user.email)

        return user
```

#### 4.1.2 로그인 UI
```python
# Streamlit 로그인 폼
def login_page():
    st.title("🍳 FridgeChef 로그인")

    with st.form("login_form"):
        email = st.text_input("이메일", placeholder="your@email.com")
        password = st.text_input("비밀번호", type="password")
        remember = st.checkbox("로그인 상태 유지")

        col1, col2 = st.columns(2)
        with col1:
            login_btn = st.form_submit_button("로그인", use_container_width=True)
        with col2:
            signup_btn = st.form_submit_button("회원가입", use_container_width=True)

    # 소셜 로그인
    st.divider()
    st.write("소셜 계정으로 로그인")
    col1, col2, col3 = st.columns(3)
    with col1:
        if st.button("🔵 Google", use_container_width=True):
            google_login()
    with col2:
        if st.button("🟢 Naver", use_container_width=True):
            naver_login()
    with col3:
        if st.button("🟡 Kakao", use_container_width=True):
            kakao_login()
```

### 4.2 세션 관리

#### 4.2.1 JWT 토큰
```python
class TokenManager:
    SECRET_KEY = os.getenv("JWT_SECRET_KEY")
    ALGORITHM = "HS256"
    ACCESS_TOKEN_EXPIRE = timedelta(hours=24)

    @classmethod
    def create_access_token(cls, user_id: int):
        payload = {
            "user_id": user_id,
            "exp": datetime.utcnow() + cls.ACCESS_TOKEN_EXPIRE
        }
        return jwt.encode(payload, cls.SECRET_KEY, algorithm=cls.ALGORITHM)

    @classmethod
    def verify_token(cls, token: str):
        try:
            payload = jwt.decode(token, cls.SECRET_KEY, algorithms=[cls.ALGORITHM])
            return payload["user_id"]
        except jwt.ExpiredSignatureError:
            raise HTTPException(status_code=401, detail="토큰이 만료되었습니다")
```

#### 4.2.2 세션 상태
```python
# Streamlit 세션 관리
class SessionManager:
    @staticmethod
    def init_session():
        if 'user' not in st.session_state:
            st.session_state.user = None
        if 'token' not in st.session_state:
            st.session_state.token = None

    @staticmethod
    def login(user, token):
        st.session_state.user = user
        st.session_state.token = token
        st.session_state.login_time = datetime.now()

    @staticmethod
    def logout():
        st.session_state.user = None
        st.session_state.token = None
        st.rerun()

    @staticmethod
    def is_logged_in():
        return st.session_state.user is not None
```

## 5. 프로필 관리

### 5.1 사용자 프로필

#### 5.1.1 프로필 데이터 모델
```python
class UserProfile(Base):
    __tablename__ = "user_profiles"

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    nickname = Column(String(50))
    bio = Column(Text)
    profile_image = Column(String(255))
    cooking_level = Column(Enum(CookingLevel))
    dietary_preferences = Column(JSON)  # ["vegetarian", "gluten_free"]
    allergies = Column(JSON)  # ["peanuts", "shellfish"]
    favorite_cuisine = Column(JSON)  # ["korean", "italian"]
    household_size = Column(Integer)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, onupdate=datetime.utcnow)
```

#### 5.1.2 프로필 편집 UI
```python
def profile_edit_page():
    st.title("프로필 설정")

    user = st.session_state.user
    profile = get_user_profile(user.id)

    with st.form("profile_form"):
        # 기본 정보
        col1, col2 = st.columns([1, 2])

        with col1:
            # 프로필 이미지
            uploaded_file = st.file_uploader(
                "프로필 사진",
                type=['jpg', 'png'],
                label_visibility="collapsed"
            )
            if uploaded_file:
                st.image(uploaded_file, width=150)

        with col2:
            nickname = st.text_input("닉네임", value=profile.nickname)
            bio = st.text_area("자기소개", value=profile.bio, height=100)

        # 요리 정보
        st.subheader("요리 정보")
        cooking_level = st.select_slider(
            "요리 실력",
            options=["초보", "중급", "고급", "전문가"],
            value=profile.cooking_level
        )

        household = st.number_input(
            "가구 구성원 수",
            min_value=1,
            max_value=10,
            value=profile.household_size
        )

        # 선호도
        st.subheader("음식 선호도")
        cuisine = st.multiselect(
            "선호하는 요리",
            ["한식", "중식", "일식", "양식", "동남아", "기타"],
            default=profile.favorite_cuisine
        )

        dietary = st.multiselect(
            "식단 제한",
            ["채식", "비건", "글루텐프리", "저염식", "저당식"],
            default=profile.dietary_preferences
        )

        allergies = st.multiselect(
            "알레르기",
            ["땅콩", "우유", "계란", "밀", "갑각류", "생선"],
            default=profile.allergies
        )

        if st.form_submit_button("저장", use_container_width=True):
            update_profile(user.id, {
                "nickname": nickname,
                "bio": bio,
                "cooking_level": cooking_level,
                "household_size": household,
                "favorite_cuisine": cuisine,
                "dietary_preferences": dietary,
                "allergies": allergies
            })
            st.success("프로필이 업데이트되었습니다!")
```

## 6. 레시피 저장 시스템

### 6.1 저장 기능

#### 6.1.1 레시피 북마크
```python
class RecipeBookmark:
    @staticmethod
    def save_recipe(user_id: int, recipe_id: int, folder_id: int = None):
        bookmark = SavedRecipe(
            user_id=user_id,
            recipe_id=recipe_id,
            folder_id=folder_id,
            saved_at=datetime.utcnow()
        )
        db.session.add(bookmark)
        db.session.commit()

        # 저장 통계 업데이트
        update_user_stats(user_id, 'recipes_saved')

        return bookmark

    @staticmethod
    def create_folder(user_id: int, folder_name: str):
        folder = RecipeFolder(
            user_id=user_id,
            name=folder_name,
            created_at=datetime.utcnow()
        )
        db.session.add(folder)
        db.session.commit()
        return folder
```

#### 6.1.2 레시피 컬렉션 UI
```python
def my_recipes_page():
    st.title("나의 레시피 📚")

    # 탭 메뉴
    tab1, tab2, tab3, tab4 = st.tabs([
        "저장된 레시피", "폴더", "최근 본 레시피", "내가 만든 레시피"
    ])

    with tab1:
        saved_recipes = get_saved_recipes(st.session_state.user.id)

        # 필터 및 정렬
        col1, col2, col3 = st.columns([2, 1, 1])
        with col1:
            search = st.text_input("🔍 레시피 검색", placeholder="레시피명 또는 재료")
        with col2:
            sort_by = st.selectbox("정렬", ["최신순", "이름순", "평점순"])
        with col3:
            view_mode = st.radio("보기", ["카드", "리스트"], horizontal=True)

        # 레시피 표시
        if view_mode == "카드":
            display_recipe_cards(saved_recipes, columns=3)
        else:
            display_recipe_list(saved_recipes)

    with tab2:
        # 폴더 관리
        folders = get_user_folders(st.session_state.user.id)

        col1, col2 = st.columns([3, 1])
        with col1:
            new_folder = st.text_input("새 폴더 만들기")
        with col2:
            if st.button("추가", use_container_width=True):
                create_folder(st.session_state.user.id, new_folder)
                st.rerun()

        # 폴더 목록
        for folder in folders:
            with st.expander(f"📁 {folder.name} ({folder.recipe_count}개)"):
                folder_recipes = get_folder_recipes(folder.id)
                for recipe in folder_recipes:
                    col1, col2 = st.columns([4, 1])
                    with col1:
                        st.write(f"• {recipe.name}")
                    with col2:
                        if st.button("삭제", key=f"del_{recipe.id}"):
                            remove_from_folder(recipe.id, folder.id)
```

### 6.2 레시피 노트

#### 6.2.1 개인 메모 기능
```python
class RecipeNote:
    @staticmethod
    def add_note(user_id: int, recipe_id: int, note: str, rating: int = None):
        recipe_note = UserRecipeNote(
            user_id=user_id,
            recipe_id=recipe_id,
            note=note,
            rating=rating,
            created_at=datetime.utcnow()
        )
        db.session.add(recipe_note)
        db.session.commit()
        return recipe_note

    @staticmethod
    def add_photo(user_id: int, recipe_id: int, photo_url: str):
        photo = UserRecipePhoto(
            user_id=user_id,
            recipe_id=recipe_id,
            photo_url=photo_url,
            uploaded_at=datetime.utcnow()
        )
        db.session.add(photo)
        db.session.commit()
        return photo
```

## 7. 개인화 추천

### 7.1 추천 알고리즘

#### 7.1.1 협업 필터링
```python
class RecommendationEngine:
    def get_personalized_recipes(self, user_id: int, limit: int = 10):
        # 1. 사용자 프로필 분석
        profile = get_user_profile(user_id)
        preferences = profile.dietary_preferences
        allergies = profile.allergies

        # 2. 과거 행동 분석
        saved_recipes = get_saved_recipes(user_id)
        viewed_recipes = get_viewed_recipes(user_id)

        # 3. 유사 사용자 찾기
        similar_users = find_similar_users(user_id)

        # 4. 추천 점수 계산
        recommendations = []
        for recipe in all_recipes:
            score = 0

            # 선호도 매칭
            if recipe.cuisine in profile.favorite_cuisine:
                score += 20

            # 알레르기 체크
            if not any(allergen in recipe.ingredients for allergen in allergies):
                score += 10

            # 유사 사용자 선호도
            if recipe.id in get_popular_among_similar(similar_users):
                score += 15

            # 난이도 매칭
            if recipe.difficulty == profile.cooking_level:
                score += 10

            recommendations.append((recipe, score))

        # 5. 상위 N개 반환
        recommendations.sort(key=lambda x: x[1], reverse=True)
        return [r[0] for r in recommendations[:limit]]
```

#### 7.1.2 맞춤 추천 UI
```python
def personalized_recommendations():
    st.header("🎯 맞춤 추천")

    user_id = st.session_state.user.id
    recommendations = get_personalized_recipes(user_id)

    # 추천 이유 표시
    for recipe in recommendations:
        with st.container():
            col1, col2, col3 = st.columns([1, 3, 1])

            with col1:
                st.image(recipe.image_url, width=100)

            with col2:
                st.subheader(recipe.name)
                # 추천 이유
                reasons = get_recommendation_reasons(recipe, user_id)
                for reason in reasons:
                    st.caption(f"✨ {reason}")

            with col3:
                if st.button("저장", key=f"save_{recipe.id}"):
                    save_recipe(user_id, recipe.id)
                    st.toast("레시피가 저장되었습니다!")
```

## 8. 대시보드

### 8.1 사용자 통계

#### 8.1.1 통계 수집
```python
class UserStatistics:
    @staticmethod
    def get_user_stats(user_id: int):
        stats = {
            "total_recipes_saved": count_saved_recipes(user_id),
            "total_recipes_cooked": count_cooked_recipes(user_id),
            "favorite_cuisine": get_most_saved_cuisine(user_id),
            "avg_cooking_time": calculate_avg_cooking_time(user_id),
            "calories_saved": calculate_calories_saved(user_id),
            "money_saved": estimate_money_saved(user_id),
            "streak_days": get_cooking_streak(user_id),
            "achievements": get_user_achievements(user_id)
        }
        return stats
```

#### 8.1.2 대시보드 UI
```python
def dashboard_page():
    st.title("📊 나의 요리 대시보드")

    user_id = st.session_state.user.id
    stats = get_user_stats(user_id)

    # 주요 지표
    col1, col2, col3, col4 = st.columns(4)

    with col1:
        st.metric(
            "저장한 레시피",
            stats['total_recipes_saved'],
            delta="+3 이번 주"
        )

    with col2:
        st.metric(
            "요리한 횟수",
            stats['total_recipes_cooked'],
            delta="+5 이번 달"
        )

    with col3:
        st.metric(
            "절약한 금액",
            f"₩{stats['money_saved']:,}",
            delta="+₩15,000"
        )

    with col4:
        st.metric(
            "연속 요리",
            f"{stats['streak_days']}일",
            delta="+2일"
        )

    # 차트
    st.subheader("📈 요리 통계")

    col1, col2 = st.columns(2)

    with col1:
        # 요리 빈도 차트
        cooking_freq = get_cooking_frequency(user_id)
        fig = px.line(
            cooking_freq,
            x='date',
            y='count',
            title='월별 요리 횟수'
        )
        st.plotly_chart(fig, use_container_width=True)

    with col2:
        # 선호 요리 분포
        cuisine_dist = get_cuisine_distribution(user_id)
        fig = px.pie(
            cuisine_dist,
            values='count',
            names='cuisine',
            title='선호 요리 분포'
        )
        st.plotly_chart(fig, use_container_width=True)

    # 업적
    st.subheader("🏆 나의 업적")
    achievements = stats['achievements']

    cols = st.columns(5)
    for idx, achievement in enumerate(achievements[:5]):
        with cols[idx]:
            st.image(achievement['icon'], width=50)
            st.caption(achievement['name'])
```

## 9. 소셜 기능

### 9.1 공유 기능

#### 9.1.1 레시피 공유
```python
class SocialSharing:
    @staticmethod
    def share_recipe(recipe_id: int, platform: str):
        recipe = get_recipe(recipe_id)
        share_url = f"https://fridgechef.com/recipe/{recipe_id}"

        if platform == "kakao":
            return create_kakao_share(recipe, share_url)
        elif platform == "facebook":
            return create_facebook_share(recipe, share_url)
        elif platform == "instagram":
            return create_instagram_story(recipe)

    @staticmethod
    def create_recipe_link(recipe_id: int, user_id: int):
        # 공유 링크 생성
        share_token = generate_share_token(recipe_id, user_id)
        return f"https://fridgechef.com/share/{share_token}"
```

#### 9.1.2 커뮤니티 기능
```python
def community_page():
    st.title("👥 커뮤니티")

    tab1, tab2, tab3 = st.tabs(["인기 레시피", "팔로잉", "챌린지"])

    with tab1:
        # 인기 레시피
        popular_recipes = get_popular_recipes(limit=10)
        for recipe in popular_recipes:
            with st.container():
                col1, col2, col3 = st.columns([1, 3, 1])

                with col1:
                    st.image(recipe.user.profile_image, width=50)
                    st.caption(recipe.user.nickname)

                with col2:
                    st.subheader(recipe.name)
                    st.write(f"❤️ {recipe.likes} | 💬 {recipe.comments}")

                with col3:
                    if st.button("자세히", key=f"view_{recipe.id}"):
                        view_recipe(recipe.id)

    with tab2:
        # 팔로잉 사용자의 활동
        following_activities = get_following_activities(st.session_state.user.id)
        for activity in following_activities:
            st.write(f"• {activity.user.nickname}님이 {activity.action}")

    with tab3:
        # 요리 챌린지
        current_challenge = get_current_challenge()
        st.subheader(f"🎯 이번 주 챌린지: {current_challenge.title}")
        st.write(current_challenge.description)

        if st.button("참여하기"):
            join_challenge(st.session_state.user.id, current_challenge.id)
```

## 10. 데이터베이스 스키마 (최종)

### 10.1 사용자 관련 테이블

```sql
-- 사용자 테이블
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    username VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 사용자 프로필
CREATE TABLE user_profiles (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    nickname VARCHAR(50),
    bio TEXT,
    profile_image VARCHAR(255),
    cooking_level VARCHAR(20),
    dietary_preferences JSONB,
    allergies JSONB,
    favorite_cuisine JSONB,
    household_size INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP
);

-- 저장된 레시피
CREATE TABLE saved_recipes (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    recipe_id INTEGER REFERENCES recipes(id),
    folder_id INTEGER REFERENCES recipe_folders(id),
    saved_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, recipe_id)
);

-- 레시피 폴더
CREATE TABLE recipe_folders (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    name VARCHAR(100),
    description TEXT,
    is_public BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 사용자 통계
CREATE TABLE user_statistics (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    total_recipes_saved INTEGER DEFAULT 0,
    total_recipes_cooked INTEGER DEFAULT 0,
    total_time_saved INTEGER DEFAULT 0,
    total_money_saved INTEGER DEFAULT 0,
    streak_days INTEGER DEFAULT 0,
    last_activity TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## 11. 보안 강화

### 11.1 보안 조치

```python
class SecurityManager:
    @staticmethod
    def validate_password(password: str):
        """비밀번호 정책 검증"""
        if len(password) < 8:
            raise ValueError("비밀번호는 8자 이상이어야 합니다")

        if not re.search(r"[A-Z]", password):
            raise ValueError("대문자를 포함해야 합니다")

        if not re.search(r"[a-z]", password):
            raise ValueError("소문자를 포함해야 합니다")

        if not re.search(r"[0-9]", password):
            raise ValueError("숫자를 포함해야 합니다")

    @staticmethod
    def rate_limit(user_id: int, action: str):
        """API 호출 제한"""
        key = f"rate_limit:{user_id}:{action}"
        count = redis_client.incr(key)

        if count == 1:
            redis_client.expire(key, 60)  # 1분

        if count > 10:  # 분당 10회 제한
            raise HTTPException(status_code=429, detail="Too many requests")

    @staticmethod
    def sanitize_input(text: str):
        """입력값 살균"""
        # HTML 태그 제거
        text = re.sub('<.*?>', '', text)
        # SQL 인젝션 방지
        text = text.replace("'", "''")
        return text
```

## 12. 성능 최적화

### 12.1 최적화 전략

```python
# 레디스 캐싱
@cache.memoize(timeout=300)
def get_user_recommendations(user_id: int):
    return calculate_recommendations(user_id)

# 데이터베이스 쿼리 최적화
def get_user_recipes_optimized(user_id: int):
    return db.session.query(Recipe)\
        .join(SavedRecipe)\
        .filter(SavedRecipe.user_id == user_id)\
        .options(
            joinedload(Recipe.ingredients),
            joinedload(Recipe.steps)
        ).all()

# 이미지 최적화
def optimize_image(image_file):
    img = Image.open(image_file)
    img.thumbnail((800, 800))
    output = BytesIO()
    img.save(output, format='WEBP', quality=85)
    return output.getvalue()
```

## 13. 개발 일정

### Week 1: 인증 및 프로필
- Day 1-2: 사용자 인증 시스템
- Day 3: 프로필 관리
- Day 4: 세션 관리
- Day 5: 소셜 로그인

### Week 2: 저장 및 개인화
- Day 6-7: 레시피 저장 시스템
- Day 8: 폴더 관리
- Day 9: 개인화 추천
- Day 10: 대시보드

### Week 3: 소셜 및 최적화
- Day 11: 소셜 공유
- Day 12: 커뮤니티 기능
- Day 13: 성능 최적화
- Day 14: 보안 강화
- Day 15: 최종 테스트

## 14. 완료 기준

### 14.1 기능 완료
- ✅ 사용자 인증 시스템
- ✅ 프로필 관리
- ✅ 레시피 저장/폴더
- ✅ 개인화 추천
- ✅ 대시보드
- ✅ 소셜 기능

### 14.2 품질 기준
- ✅ 보안 테스트 통과
- ✅ 성능 목표 달성
- ✅ 사용성 테스트 완료
- ✅ 모바일 최적화

## 15. 배포 및 운영

### 15.1 배포 계획
- Docker 컨테이너화
- AWS EC2 배포
- CloudFront CDN 설정
- RDS PostgreSQL 설정
- ElastiCache Redis 설정

### 15.2 모니터링
- CloudWatch 알람
- Sentry 에러 추적
- Google Analytics
- 사용자 피드백 수집

---

**문서 정보**
- 작성일: 2025-01-14
- 버전: 1.0
- 작성자: System
- 완료 예정일: 2025-02-01