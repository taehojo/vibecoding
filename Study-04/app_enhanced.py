"""
FridgeChef - Enhanced UX Version
AI-powered recipe recommendation system with improved user experience
"""

import streamlit as st
import time
import json
from datetime import datetime
import uuid

# Import backend modules
from backend.config import Config
from backend.openrouter_client import OpenRouterClient
from backend.image_service import ImageProcessor
from backend.recipe_generator import RecipeGenerator
from backend.ingredient_manager import IngredientManager
from backend.database import RecipeDatabase
from backend.auth import AuthManager
from backend.user_profile import UserProfileManager

# Import enhanced UI components
from ui_components import (
    UITheme,
    EnhancedMessages,
    LoadingStates,
    RecipeCard,
    OnboardingFlow,
    FormValidation,
    AccessibilityFeatures,
    ResponsiveLayout,
    EmptyStates,
    PerformanceOptimizations
)

# Page configuration
st.set_page_config(
    page_title="FridgeChef - AI 레시피 추천",
    page_icon="🍳",
    layout="wide",
    initial_sidebar_state="collapsed",  # Better mobile experience
    menu_items={
        'Get Help': 'https://fridgechef.help',
        'Report a bug': "https://fridgechef.help/bug",
        'About': "FridgeChef v2.0 - AI로 만드는 맛있는 일상"
    }
)

# Apply custom theme
UITheme.inject_custom_css()

# Initialize session state with better defaults
def init_session_state():
    """Initialize session state variables with enhanced defaults"""
    defaults = {
        'auth_manager': AuthManager(),
        'profile_manager': UserProfileManager(),
        'user': None,
        'token': None,
        'page': 'welcome',  # Start with welcome page
        'recognized_ingredients': None,
        'generated_recipes': None,
        'ingredient_manager': IngredientManager(),
        'db': RecipeDatabase(),
        'first_visit': True,
        'tutorial_completed': False,
        'ui_preferences': {
            'theme': 'light',
            'font_size': 'normal',
            'animations': True,
            'high_contrast': False
        },
        'last_action': None,
        'notification_queue': []
    }

    for key, value in defaults.items():
        if key not in st.session_state:
            st.session_state[key] = value

init_session_state()


def main():
    """Main application with enhanced UX flow"""

    # Validate configuration with user-friendly error
    try:
        Config.validate()
    except ValueError as e:
        EnhancedMessages.error(
            "시스템 설정에 문제가 있습니다",
            "관리자에게 문의해주세요",
            error_code="CONFIG_001"
        )
        st.stop()

    # Route based on user state
    if st.session_state.first_visit and not st.session_state.user:
        show_welcome_experience()
    elif st.session_state.user is None:
        show_enhanced_auth()
    else:
        show_main_application()


def show_welcome_experience():
    """Enhanced first-time user experience"""
    if OnboardingFlow.welcome_screen():
        st.session_state.first_visit = False
        st.session_state.page = 'auth'
        st.rerun()


def show_enhanced_auth():
    """Enhanced authentication with better UX"""
    # Clean, centered layout
    col1, col2, col3 = st.columns([1, 2, 1])

    with col2:
        # Logo and tagline
        st.markdown(f"""
        <div style="text-align: center; margin-bottom: 40px;">
            <h1 style="color: {UITheme.PRIMARY}; font-size: 2.5em; margin-bottom: 8px;">
                🍳 FridgeChef
            </h1>
            <p style="color: {UITheme.GRAY}; font-size: 1.1em;">
                냉장고 속 재료로 만드는 특별한 요리
            </p>
        </div>
        """, unsafe_allow_html=True)

        tab1, tab2 = st.tabs(["로그인", "회원가입"])

        with tab1:
            show_enhanced_login()

        with tab2:
            show_enhanced_register()

        # Quick start option
        st.divider()
        st.markdown(f"""
        <div style="text-align: center; margin: 20px 0;">
            <p style="color: {UITheme.GRAY};">또는</p>
        </div>
        """, unsafe_allow_html=True)

        if st.button("🚀 체험하기 (로그인 없이)", use_container_width=True):
            demo_login()


def show_enhanced_login():
    """Enhanced login form with validation"""
    with st.form("enhanced_login", clear_on_submit=False):
        # Email with validation
        email, email_valid = FormValidation.email_input("이메일", "login_email")

        # Password field
        password = st.text_input(
            "비밀번호",
            type="password",
            key="login_password",
            help="비밀번호를 잊으셨나요? 하단의 '비밀번호 찾기'를 클릭하세요"
        )

        # Remember me option
        col1, col2 = st.columns([1, 1])
        with col1:
            remember = st.checkbox("로그인 유지", value=True)
        with col2:
            st.markdown(f"""
            <div style="text-align: right; padding-top: 8px;">
                <a href="#" style="color: {UITheme.PRIMARY}; text-decoration: none; font-size: 0.9em;">
                    비밀번호 찾기
                </a>
            </div>
            """, unsafe_allow_html=True)

        # Submit button
        submitted = st.form_submit_button(
            "로그인",
            type="primary",
            use_container_width=True,
            disabled=not (email and password)
        )

        if submitted:
            if not email_valid:
                EnhancedMessages.error(
                    "올바른 이메일 주소를 입력해주세요",
                    "example@email.com 형식으로 입력해주세요"
                )
            else:
                with st.spinner("로그인 중..."):
                    auth = st.session_state.auth_manager
                    result = auth.login(email, password)

                    if result['success']:
                        st.session_state.user = result['user']
                        st.session_state.token = result['token']

                        # Welcome back message
                        EnhancedMessages.success(
                            f"환영합니다, {result['user']['username']}님! 👋",
                            duration=2
                        )
                        time.sleep(1)
                        st.rerun()
                    else:
                        # User-friendly error messages
                        if "not found" in result.get('error', '').lower():
                            EnhancedMessages.error(
                                "등록되지 않은 이메일입니다",
                                "이메일을 확인하거나 회원가입을 진행해주세요"
                            )
                        elif "password" in result.get('error', '').lower():
                            EnhancedMessages.error(
                                "비밀번호가 일치하지 않습니다",
                                "비밀번호를 다시 확인해주세요"
                            )
                        else:
                            EnhancedMessages.error(
                                "로그인에 실패했습니다",
                                "잠시 후 다시 시도해주세요",
                                error_code="AUTH_001"
                            )


def show_enhanced_register():
    """Enhanced registration with real-time validation"""
    with st.form("enhanced_register", clear_on_submit=False):
        # Email validation
        email, email_valid = FormValidation.email_input("이메일", "register_email")

        # Username with availability check
        username = st.text_input(
            "사용자명",
            key="register_username",
            help="다른 사용자에게 표시될 이름입니다"
        )

        # Password with strength indicator
        password = FormValidation.password_input_with_strength(
            "비밀번호",
            "register_password"
        )

        # Password confirmation
        password_confirm = st.text_input(
            "비밀번호 확인",
            type="password",
            key="register_password_confirm"
        )

        # Password match check
        if password and password_confirm:
            if password == password_confirm:
                st.markdown(f"""
                <div style="color: {UITheme.SUCCESS}; font-size: 0.85em; margin-top: -10px;">
                    ✓ 비밀번호가 일치합니다
                </div>
                """, unsafe_allow_html=True)
            else:
                st.markdown(f"""
                <div style="color: {UITheme.ERROR}; font-size: 0.85em; margin-top: -10px;">
                    ✗ 비밀번호가 일치하지 않습니다
                </div>
                """, unsafe_allow_html=True)

        # Terms and conditions with better UX
        st.markdown(f"""
        <div style="
            background: {UITheme.LIGHT};
            padding: 12px;
            border-radius: 8px;
            margin: 16px 0;
            font-size: 0.9em;
        ">
            <label>
                <input type="checkbox" id="terms" style="margin-right: 8px;">
                <a href="#" style="color: {UITheme.PRIMARY};">이용약관</a> 및
                <a href="#" style="color: {UITheme.PRIMARY};">개인정보 처리방침</a>에 동의합니다
            </label>
        </div>
        """, unsafe_allow_html=True)

        terms = st.checkbox("위 약관에 동의합니다", key="terms_checkbox")

        # Marketing consent (optional)
        marketing = st.checkbox(
            "마케팅 정보 수신 동의 (선택)",
            value=False,
            help="새로운 레시피와 요리 팁을 이메일로 받아보세요"
        )

        # Submit button
        submitted = st.form_submit_button(
            "가입하기",
            type="primary",
            use_container_width=True,
            disabled=not all([email, username, password, password_confirm, terms])
        )

        if submitted:
            # Validation
            errors = []

            if not email_valid:
                errors.append("올바른 이메일 주소를 입력해주세요")

            if len(username) < 2:
                errors.append("사용자명은 2자 이상이어야 합니다")

            if len(password) < 6:
                errors.append("비밀번호는 6자 이상이어야 합니다")

            if password != password_confirm:
                errors.append("비밀번호가 일치하지 않습니다")

            if errors:
                for error in errors:
                    EnhancedMessages.error(error)
            else:
                with st.spinner("계정 생성 중..."):
                    auth = st.session_state.auth_manager
                    result = auth.register(email, username, password)

                    if result['success']:
                        EnhancedMessages.success(
                            "회원가입이 완료되었습니다! 🎉",
                            duration=2
                        )
                        EnhancedMessages.info(
                            "이제 로그인 탭에서 로그인할 수 있습니다"
                        )
                    else:
                        if "already exists" in result.get('error', '').lower():
                            EnhancedMessages.error(
                                "이미 사용중인 이메일입니다",
                                "다른 이메일을 사용하거나 로그인해주세요"
                            )
                        else:
                            EnhancedMessages.error(
                                "회원가입에 실패했습니다",
                                "잠시 후 다시 시도해주세요",
                                error_code="REG_001"
                            )


def demo_login():
    """Quick demo account login"""
    with st.spinner("데모 계정 준비 중..."):
        demo_email = f"demo_{uuid.uuid4().hex[:8]}@fridgechef.com"
        demo_password = "demo123"
        demo_username = f"체험사용자_{uuid.uuid4().hex[:4]}"

        auth = st.session_state.auth_manager
        auth.register(demo_email, demo_username, demo_password)

        result = auth.login(demo_email, demo_password)
        if result['success']:
            st.session_state.user = result['user']
            st.session_state.token = result['token']
            st.session_state.tutorial_completed = False  # Show tutorial for demo users

            EnhancedMessages.success(
                "체험 모드로 시작합니다! 🚀",
                duration=2
            )
            time.sleep(1)
            st.rerun()


def show_main_application():
    """Main application with enhanced UX"""

    # Check if tutorial needed
    if not st.session_state.tutorial_completed and st.session_state.first_visit:
        show_tutorial()
        return

    # Modern header with user menu
    show_enhanced_header()

    # Main navigation with icons
    tabs = st.tabs([
        "🏠 홈",
        "📷 재료 인식",
        "🍽️ 레시피 생성",
        "📚 내 레시피",
        "👤 프로필",
        "⚙️ 설정"
    ])

    with tabs[0]:
        show_enhanced_dashboard()

    with tabs[1]:
        show_enhanced_ingredient_recognition()

    with tabs[2]:
        show_enhanced_recipe_generation()

    with tabs[3]:
        show_enhanced_saved_recipes()

    with tabs[4]:
        show_enhanced_profile()

    with tabs[5]:
        show_settings()


def show_tutorial():
    """Interactive tutorial for new users"""
    st.markdown(f"""
    <div style="text-align: center; margin-bottom: 20px;">
        <h2 style="color: {UITheme.PRIMARY};">
            처음이신가요? 함께 시작해봐요! 👩‍🍳
        </h2>
    </div>
    """, unsafe_allow_html=True)

    OnboardingFlow.tutorial_steps()

    if st.session_state.get('tutorial_completed'):
        EnhancedMessages.success("튜토리얼을 완료했습니다! 이제 시작해보세요 🎉")
        time.sleep(2)
        st.rerun()


def show_enhanced_header():
    """Modern application header"""
    col1, col2, col3 = st.columns([2, 3, 1])

    with col1:
        st.markdown(f"""
        <h1 style="
            color: {UITheme.PRIMARY};
            margin: 0;
            font-size: 1.8em;
        ">
            🍳 FridgeChef
        </h1>
        """, unsafe_allow_html=True)

    with col2:
        # Quick search bar
        search = st.text_input(
            "레시피 검색",
            placeholder="재료나 요리명으로 검색...",
            key="global_search",
            label_visibility="collapsed"
        )

    with col3:
        # User menu
        user = st.session_state.user
        with st.popover(f"👤 {user['username']}", use_container_width=True):
            st.write(f"**{user['email']}**")
            st.divider()

            if st.button("⚙️ 설정", use_container_width=True):
                st.session_state.page = 'settings'

            if st.button("❓ 도움말", use_container_width=True):
                st.session_state.page = 'help'

            if st.button("🚪 로그아웃", use_container_width=True):
                logout()


def show_enhanced_dashboard():
    """Enhanced dashboard with better visualizations"""
    st.header("안녕하세요! 오늘은 뭘 만들어볼까요? 👨‍🍳")

    # Quick actions
    st.subheader("빠른 시작")
    cols = ResponsiveLayout.adaptive_columns(mobile=1, tablet=2, desktop=4)

    quick_actions = [
        ("📷", "사진으로 시작", "냉장고 사진 촬영", "photo"),
        ("✏️", "재료 입력", "보유 재료 직접 입력", "manual"),
        ("🎲", "랜덤 추천", "오늘의 추천 레시피", "random"),
        ("⭐", "인기 레시피", "가장 인기있는 레시피", "popular")
    ]

    for col, (emoji, title, desc, action) in zip(cols, quick_actions):
        with col:
            if st.button(
                emoji,
                key=f"quick_{action}",
                use_container_width=True,
                help=desc
            ):
                handle_quick_action(action)

            st.markdown(f"""
            <div style="text-align: center; margin-top: -10px;">
                <div style="font-weight: 600; color: {UITheme.DARK};">
                    {title}
                </div>
                <div style="font-size: 0.85em; color: {UITheme.GRAY};">
                    {desc}
                </div>
            </div>
            """, unsafe_allow_html=True)

    # Statistics with better visualization
    st.divider()
    show_user_statistics()

    # Recent activity with cards
    st.divider()
    show_recent_activity()


def show_enhanced_ingredient_recognition():
    """Enhanced ingredient recognition with better UX"""
    st.header("📷 냉장고 재료 인식")

    # Progress indicator for multi-step process
    steps = ["사진 업로드", "재료 인식", "확인 및 수정"]
    current_step = st.session_state.get('recognition_step', 0)

    # Show progress
    progress_cols = st.columns(len(steps))
    for i, (col, step) in enumerate(zip(progress_cols, steps)):
        with col:
            if i < current_step:
                status = "✅"
                color = UITheme.SUCCESS
            elif i == current_step:
                status = "⏳"
                color = UITheme.PRIMARY
            else:
                status = "⭕"
                color = UITheme.GRAY

            st.markdown(f"""
            <div style="text-align: center;">
                <div style="
                    color: {color};
                    font-size: 1.5em;
                    margin-bottom: 4px;
                ">
                    {status}
                </div>
                <div style="
                    color: {color};
                    font-size: 0.9em;
                    font-weight: {'600' if i == current_step else '400'};
                ">
                    {step}
                </div>
            </div>
            """, unsafe_allow_html=True)

    st.divider()

    # Main content based on current step
    if current_step == 0:
        show_photo_upload_step()
    elif current_step == 1:
        show_recognition_step()
    elif current_step == 2:
        show_ingredient_confirmation_step()


def show_photo_upload_step():
    """Photo upload step with enhanced UX"""
    col1, col2 = st.columns([1, 1])

    with col1:
        st.subheader("냉장고 사진 업로드")

        # Enhanced file uploader with drag-and-drop styling
        uploaded_file = st.file_uploader(
            "사진을 선택하거나 여기에 드래그하세요",
            type=['jpg', 'jpeg', 'png', 'webp'],
            accept_multiple_files=False,
            help="💡 팁: 밝은 조명에서 냉장고 내부가 잘 보이도록 촬영하세요"
        )

        if uploaded_file:
            # Show image with loading animation
            with st.spinner("이미지 처리 중..."):
                st.image(uploaded_file, caption="업로드된 이미지", use_container_width=True)

                processor = ImageProcessor()
                is_valid, error_msg = processor.validate_image(uploaded_file)

            if not is_valid:
                EnhancedMessages.error(
                    error_msg,
                    "다른 사진을 선택해주세요"
                )
            else:
                EnhancedMessages.success("사진이 준비되었습니다!")

                if st.button(
                    "🔍 재료 인식 시작",
                    type="primary",
                    use_container_width=True
                ):
                    st.session_state.recognition_step = 1
                    st.session_state.uploaded_file = uploaded_file
                    st.rerun()

    with col2:
        # Tips and guidelines
        st.subheader("📸 촬영 가이드")

        guidelines = [
            ("✅", "냉장고 문을 완전히 열고 촬영"),
            ("✅", "밝은 조명 확보"),
            ("✅", "재료가 겹치지 않도록 배치"),
            ("❌", "흐릿하거나 어두운 사진"),
            ("❌", "너무 가까이서 촬영"),
            ("❌", "재료가 가려진 사진")
        ]

        for icon, guideline in guidelines:
            color = UITheme.SUCCESS if icon == "✅" else UITheme.ERROR
            st.markdown(f"""
            <div style="
                padding: 8px;
                margin: 4px 0;
                border-left: 3px solid {color};
            ">
                <span style="color: {color}; margin-right: 8px;">
                    {icon}
                </span>
                {guideline}
            </div>
            """, unsafe_allow_html=True)


def show_recognition_step():
    """AI recognition step with progress feedback"""
    uploaded_file = st.session_state.get('uploaded_file')

    if not uploaded_file:
        st.session_state.recognition_step = 0
        st.rerun()
        return

    # Show processing animation
    loading_container = st.container()

    with loading_container:
        # Multi-step progress
        steps = [
            "이미지 분석 중...",
            "재료 식별 중...",
            "카테고리 분류 중...",
            "결과 정리 중..."
        ]

        progress_container, status_container = LoadingStates.progress_with_status(
            "AI가 재료를 인식하고 있습니다",
            steps
        )

    # Actual recognition
    try:
        processor = ImageProcessor()
        image_base64 = processor.process_image(uploaded_file)

        client = OpenRouterClient()
        result = client.recognize_ingredients(image_base64)

        if result.get('status') == 'success':
            st.session_state.recognized_ingredients = result
            st.session_state.recognition_step = 2

            # Clear loading and show success
            loading_container.empty()
            EnhancedMessages.success(
                f"{result.get('total_items', 0)}개의 재료를 인식했습니다! 🎉"
            )

            # Auto-proceed after brief pause
            time.sleep(1.5)
            st.rerun()
        else:
            raise Exception(result.get('error', 'Recognition failed'))

    except Exception as e:
        loading_container.empty()
        EnhancedMessages.error(
            "재료 인식에 실패했습니다",
            "다른 사진으로 다시 시도해주세요",
            error_code="RECOG_001"
        )

        if st.button("다시 시도", type="primary"):
            st.session_state.recognition_step = 0
            st.rerun()


def show_ingredient_confirmation_step():
    """Ingredient confirmation and editing step"""
    st.subheader("인식된 재료 확인")

    result = st.session_state.get('recognized_ingredients')
    if not result:
        st.session_state.recognition_step = 0
        st.rerun()
        return

    ingredients = result.get('ingredients', {})
    manager = st.session_state.ingredient_manager

    # Load ingredients into manager
    if not manager.get_ingredients():
        manager.set_ingredients(ingredients)

    # Display in editable format
    col1, col2 = st.columns([2, 1])

    with col1:
        for category, items in manager.get_ingredients().items():
            if items:
                with st.expander(f"**{category}** ({len(items)}개)", expanded=True):
                    for idx, item in enumerate(items):
                        col_item, col_action = st.columns([5, 1])

                        with col_item:
                            # Inline editing
                            new_value = st.text_input(
                                f"Item {idx}",
                                value=item,
                                key=f"edit_{category}_{idx}",
                                label_visibility="collapsed"
                            )

                            if new_value != item:
                                manager.update_ingredient(category, item, new_value)

                        with col_action:
                            if st.button("❌", key=f"del_{category}_{idx}"):
                                manager.remove_ingredient(category, item)
                                st.rerun()

    with col2:
        # Quick add section
        st.subheader("재료 추가")

        with st.form("add_ingredient", clear_on_submit=True):
            category = st.selectbox(
                "카테고리",
                ["채소", "육류", "해산물", "유제품", "양념", "곡물", "과일", "기타"]
            )

            ingredient = st.text_input("재료명")

            if st.form_submit_button("➕ 추가", use_container_width=True):
                if ingredient:
                    if manager.add_ingredient(category, ingredient):
                        EnhancedMessages.success(f"'{ingredient}' 추가됨")
                        st.rerun()

        # Statistics
        st.divider()
        stats = manager.get_statistics()
        st.metric("총 재료", f"{stats['total_ingredients']}개")
        st.metric("카테고리", f"{stats['total_categories']}개")

    # Action buttons
    st.divider()
    col1, col2, col3 = st.columns([1, 1, 1])

    with col1:
        if st.button("← 다시 촬영", use_container_width=True):
            st.session_state.recognition_step = 0
            st.session_state.recognized_ingredients = None
            manager.clear()
            st.rerun()

    with col3:
        if st.button("레시피 생성 →", type="primary", use_container_width=True):
            st.session_state.page = 'recipe_generation'
            st.rerun()


def show_enhanced_recipe_generation():
    """Enhanced recipe generation with better UX"""
    st.header("🍽️ 맞춤 레시피 생성")

    manager = st.session_state.ingredient_manager
    current_ingredients = manager.get_ingredients()

    if not current_ingredients:
        EmptyStates.no_ingredients()

        if st.button("재료 인식하러 가기", type="primary"):
            st.session_state.page = 'ingredient_recognition'
            st.rerun()
        return

    # Show ingredients summary in a compact way
    with st.expander("📦 사용 가능한 재료", expanded=False):
        ingredient_pills = []
        for category, items in current_ingredients.items():
            for item in items:
                ingredient_pills.append(item)

        # Display as pills/tags
        pills_html = ""
        for ingredient in ingredient_pills:
            pills_html += f"""
            <span style="
                display: inline-block;
                background: {UITheme.PRIMARY}15;
                color: {UITheme.PRIMARY};
                padding: 4px 12px;
                border-radius: 20px;
                margin: 4px;
                font-size: 0.9em;
            ">
                {ingredient}
            </span>
            """

        st.markdown(f'<div style="margin: 10px 0;">{pills_html}</div>', unsafe_allow_html=True)

    # Recipe preferences with better UI
    st.subheader("요리 설정")

    # Use cards for preferences
    pref_cols = st.columns(3)

    with pref_cols[0]:
        st.markdown(f"""
        <div style="
            background: white;
            padding: 16px;
            border-radius: 8px;
            border: 1px solid {UITheme.BORDER};
            margin-bottom: 16px;
        ">
            <div style="font-weight: 600; margin-bottom: 8px;">난이도</div>
        </div>
        """, unsafe_allow_html=True)

        difficulty = st.select_slider(
            "Difficulty",
            options=["쉬움", "보통", "어려움"],
            value="보통",
            label_visibility="collapsed"
        )

    with pref_cols[1]:
        st.markdown(f"""
        <div style="
            background: white;
            padding: 16px;
            border-radius: 8px;
            border: 1px solid {UITheme.BORDER};
            margin-bottom: 16px;
        ">
            <div style="font-weight: 600; margin-bottom: 8px;">조리 시간</div>
        </div>
        """, unsafe_allow_html=True)

        cooking_time = st.slider(
            "Time",
            min_value=10,
            max_value=120,
            value=30,
            step=10,
            format="%d분",
            label_visibility="collapsed"
        )

    with pref_cols[2]:
        st.markdown(f"""
        <div style="
            background: white;
            padding: 16px;
            border-radius: 8px;
            border: 1px solid {UITheme.BORDER};
            margin-bottom: 16px;
        ">
            <div style="font-weight: 600; margin-bottom: 8px;">인분</div>
        </div>
        """, unsafe_allow_html=True)

        servings = st.number_input(
            "Servings",
            min_value=1,
            max_value=10,
            value=4,
            label_visibility="collapsed"
        )

    # Additional preferences in expandable section
    with st.expander("🎯 상세 설정", expanded=False):
        col1, col2 = st.columns(2)

        with col1:
            cuisine = st.selectbox(
                "요리 종류",
                ["자동 선택", "한식", "중식", "일식", "양식", "동남아", "퓨전"]
            )

        with col2:
            diet_restrictions = st.multiselect(
                "식단 제한",
                ["채식", "비건", "글루텐프리", "저염식", "저당식"]
            )

    # Generate button with loading state
    if st.button(
        "🎨 레시피 생성하기",
        type="primary",
        use_container_width=True
    ):
        preferences = {
            'difficulty': difficulty,
            'cooking_time': f"{cooking_time}분",
            'servings': servings,
            'cuisine': cuisine if cuisine != "자동 선택" else None,
            'diet_restrictions': diet_restrictions
        }

        generate_recipes_with_animation(current_ingredients, preferences)

    # Display generated recipes
    if st.session_state.generated_recipes:
        display_enhanced_recipes()


def generate_recipes_with_animation(ingredients, preferences):
    """Generate recipes with engaging animation"""
    generator = RecipeGenerator()

    # Creative loading messages
    loading_messages = [
        "재료 분석 중... 🔍",
        "레시피 데이터베이스 검색 중... 📚",
        "AI가 창의적인 조합을 찾고 있어요... 🤖",
        "영양 균형을 계산하고 있어요... ⚖️",
        "마지막 손질 중... ✨"
    ]

    # Show animated progress
    progress_placeholder = st.empty()
    message_placeholder = st.empty()

    for i, message in enumerate(loading_messages):
        progress = (i + 1) / len(loading_messages)
        progress_placeholder.progress(progress)
        message_placeholder.info(f"🍳 {message}")
        time.sleep(0.8)

    # Actual generation
    result = generator.generate_recipes(ingredients, preferences)

    # Clear loading
    progress_placeholder.empty()
    message_placeholder.empty()

    if result.get('status') == 'success':
        st.session_state.generated_recipes = result
        EnhancedMessages.success(
            f"{len(result['recipes'])}개의 맛있는 레시피를 찾았습니다! 🎉"
        )
        st.balloons()
    else:
        EnhancedMessages.error(
            "레시피 생성에 실패했습니다",
            "다시 시도하거나 설정을 변경해보세요"
        )


def display_enhanced_recipes():
    """Display recipes with enhanced cards"""
    st.divider()
    st.subheader("추천 레시피")

    recipes = st.session_state.generated_recipes.get('recipes', [])

    # Recipe filter/sort options
    col1, col2 = st.columns([3, 1])
    with col2:
        sort_by = st.selectbox(
            "정렬",
            ["매칭순", "시간순", "난이도순"],
            label_visibility="collapsed"
        )

    # Display recipes as cards
    for idx, recipe in enumerate(recipes):
        if RecipeCard.display(recipe, idx):
            # Show detailed recipe view
            show_recipe_detail(recipe)


def show_recipe_detail(recipe):
    """Show detailed recipe view in modal-like container"""
    with st.container():
        st.markdown(f"""
        <div style="
            background: white;
            padding: 24px;
            border-radius: 12px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.1);
            margin: 20px 0;
        ">
            <h2 style="color: {UITheme.DARK}; margin-bottom: 16px;">
                {recipe['name']}
            </h2>
        </div>
        """, unsafe_allow_html=True)

        # Recipe info tabs
        tab1, tab2, tab3 = st.tabs(["재료", "조리법", "영양정보"])

        with tab1:
            for ingredient in recipe.get('ingredients', []):
                st.write(f"• {ingredient['name']}: {ingredient.get('amount', '')}")

        with tab2:
            for i, step in enumerate(recipe.get('steps', []), 1):
                st.write(f"**{i}단계:** {step}")

        with tab3:
            nutrition_cols = st.columns(4)
            nutrition_data = [
                ("칼로리", f"{recipe.get('calories', 0)}kcal"),
                ("단백질", f"{recipe.get('protein', 0)}g"),
                ("탄수화물", f"{recipe.get('carbs', 0)}g"),
                ("지방", f"{recipe.get('fat', 0)}g")
            ]

            for col, (label, value) in zip(nutrition_cols, nutrition_data):
                with col:
                    st.metric(label, value)


def show_enhanced_saved_recipes():
    """Enhanced saved recipes view"""
    st.header("📚 내 레시피 컬렉션")

    user_id = st.session_state.user['id']
    profile_manager = st.session_state.profile_manager

    # Get saved recipes
    saved_recipes = profile_manager.get_saved_recipes(user_id)

    if not saved_recipes:
        EmptyStates.no_recipes()
        return

    # Filter and search
    col1, col2, col3 = st.columns([2, 1, 1])

    with col1:
        search = st.text_input(
            "검색",
            placeholder="레시피 이름으로 검색...",
            label_visibility="collapsed"
        )

    with col2:
        filter_cuisine = st.selectbox(
            "요리 종류",
            ["전체", "한식", "중식", "일식", "양식"],
            label_visibility="collapsed"
        )

    with col3:
        sort_by = st.selectbox(
            "정렬",
            ["최신순", "평점순", "이름순"],
            label_visibility="collapsed"
        )

    # Display recipes in grid
    cols = st.columns(3)
    for idx, saved in enumerate(saved_recipes):
        with cols[idx % 3]:
            recipe = saved['recipe']
            display_saved_recipe_card(saved, recipe)


def display_saved_recipe_card(saved, recipe):
    """Display saved recipe as an enhanced card"""
    st.markdown(f"""
    <div style="
        background: white;
        border: 1px solid {UITheme.BORDER};
        border-radius: 12px;
        padding: 16px;
        margin-bottom: 16px;
        height: 200px;
        position: relative;
    ">
        <h4 style="color: {UITheme.DARK}; margin: 0 0 8px 0;">
            {recipe.get('name', '이름 없음')}
        </h4>
        <div style="color: {UITheme.GRAY}; font-size: 0.9em;">
            <div>⏱️ {recipe.get('time', 30)}분</div>
            <div>⭐ {saved.get('rating', 0)}/5</div>
        </div>
        {f'<div style="position: absolute; top: 16px; right: 16px; background: {UITheme.SUCCESS}15; color: {UITheme.SUCCESS}; padding: 4px 8px; border-radius: 4px; font-size: 0.8em;">요리 완료</div>' if saved.get('cooked') else ''}
    </div>
    """, unsafe_allow_html=True)

    if st.button("상세 보기", key=f"view_saved_{saved['save_id']}", use_container_width=True):
        show_recipe_detail(recipe)


def show_enhanced_profile():
    """Enhanced user profile with better organization"""
    st.header("👤 내 프로필")

    user = st.session_state.user
    user_id = user['id']
    profile_manager = st.session_state.profile_manager

    # Profile tabs
    tab1, tab2, tab3 = st.tabs(["기본 정보", "요리 취향", "활동 통계"])

    with tab1:
        show_basic_profile_info()

    with tab2:
        show_cooking_preferences()

    with tab3:
        show_activity_statistics()


def show_basic_profile_info():
    """Basic profile information section"""
    user = st.session_state.user
    profile_manager = st.session_state.profile_manager
    profile = profile_manager.get_profile(user['id']) or {}

    with st.form("basic_profile"):
        col1, col2 = st.columns(2)

        with col1:
            nickname = st.text_input(
                "닉네임",
                value=profile.get('nickname', user['username'])
            )

            bio = st.text_area(
                "자기소개",
                value=profile.get('bio', ''),
                height=100
            )

        with col2:
            cooking_level = st.select_slider(
                "요리 실력",
                options=["입문", "초급", "중급", "고급", "전문가"],
                value=profile.get('cooking_level', '초급')
            )

            household = st.number_input(
                "가구 구성원 수",
                min_value=1,
                max_value=10,
                value=profile.get('household_size', 2)
            )

        if st.form_submit_button("저장", type="primary", use_container_width=True):
            # Save profile with optimistic update
            PerformanceOptimizations.optimistic_update(
                "프로필 저장 중",
                "프로필이 업데이트되었습니다!"
            )


def show_cooking_preferences():
    """Cooking preferences section"""
    user_id = st.session_state.user['id']
    profile_manager = st.session_state.profile_manager
    profile = profile_manager.get_profile(user_id) or {}

    with st.form("cooking_preferences"):
        st.subheader("선호 요리")
        cuisine_prefs = st.multiselect(
            "좋아하는 요리 종류",
            ["한식", "중식", "일식", "양식", "동남아", "멕시칸", "인도"],
            default=profile.get('favorite_cuisine', ['한식'])
        )

        st.subheader("식단 설정")
        dietary = st.multiselect(
            "식단 제한사항",
            ["채식", "비건", "글루텐프리", "저염식", "저당식", "케토"],
            default=profile.get('dietary_preferences', [])
        )

        st.subheader("알레르기")
        allergies = st.multiselect(
            "알레르기 정보",
            ["땅콩", "우유", "계란", "밀", "갑각류", "생선", "대두"],
            default=profile.get('allergies', [])
        )

        if st.form_submit_button("저장", type="primary", use_container_width=True):
            EnhancedMessages.success("취향이 저장되었습니다!")


def show_activity_statistics():
    """User activity statistics"""
    user_id = st.session_state.user['id']
    profile_manager = st.session_state.profile_manager

    stats = profile_manager.get_statistics(user_id)

    # Key metrics
    cols = st.columns(4)
    metrics = [
        ("📚", "저장한 레시피", f"{stats['total_saved']}개"),
        ("👨‍🍳", "요리한 횟수", f"{stats['total_cooked']}회"),
        ("⭐", "평균 평점", f"{stats['avg_rating']:.1f}" if stats['avg_rating'] else "-"),
        ("📁", "레시피 폴더", f"{stats['total_folders']}개")
    ]

    for col, (icon, label, value) in zip(cols, metrics):
        with col:
            st.markdown(f"""
            <div style="
                background: white;
                padding: 16px;
                border-radius: 8px;
                text-align: center;
                box-shadow: 0 2px 4px rgba(0,0,0,0.05);
            ">
                <div style="font-size: 2em; margin-bottom: 8px;">{icon}</div>
                <div style="color: {UITheme.GRAY}; font-size: 0.9em;">{label}</div>
                <div style="color: {UITheme.DARK}; font-size: 1.2em; font-weight: 600;">{value}</div>
            </div>
            """, unsafe_allow_html=True)


def show_settings():
    """Application settings"""
    st.header("⚙️ 설정")

    # Settings tabs
    tab1, tab2, tab3 = st.tabs(["디스플레이", "알림", "접근성"])

    with tab1:
        st.subheader("디스플레이 설정")

        # Theme selection
        theme = st.selectbox(
            "테마",
            ["라이트 모드", "다크 모드", "시스템 설정 따르기"]
        )

        # Animation toggle
        animations = st.checkbox(
            "애니메이션 효과",
            value=st.session_state.ui_preferences['animations']
        )

        if st.button("적용", type="primary"):
            st.session_state.ui_preferences['animations'] = animations
            EnhancedMessages.success("설정이 저장되었습니다")

    with tab2:
        st.subheader("알림 설정")

        email_notif = st.checkbox("이메일 알림", value=True)
        push_notif = st.checkbox("푸시 알림", value=False)

        st.subheader("알림 받기")
        notif_types = st.multiselect(
            "알림 종류",
            ["새 레시피 추천", "요리 리마인더", "주간 리포트", "팁과 트릭"],
            default=["새 레시피 추천"]
        )

    with tab3:
        st.subheader("접근성")

        # Font size selector
        AccessibilityFeatures.font_size_selector()

        # High contrast mode
        AccessibilityFeatures.high_contrast_mode()

        # Keyboard shortcuts
        if st.checkbox("키보드 단축키 보기"):
            AccessibilityFeatures.keyboard_navigation_hint()


def show_user_statistics():
    """Show user statistics on dashboard"""
    user_id = st.session_state.user['id']
    profile_manager = st.session_state.profile_manager
    stats = profile_manager.get_statistics(user_id)

    st.subheader("📊 이번 주 활동")

    cols = st.columns(4)
    weekly_stats = [
        ("🍳", "요리한 레시피", "3개", "+2"),
        ("⭐", "평균 평점", "4.5", "+0.3"),
        ("📷", "재료 인식", "5회", "+3"),
        ("💾", "저장한 레시피", "8개", "+5")
    ]

    for col, (icon, label, value, delta) in zip(cols, weekly_stats):
        with col:
            st.metric(label, value, delta)


def show_recent_activity():
    """Show recent activity cards"""
    st.subheader("최근 활동")

    activities = [
        {
            "type": "recipe_saved",
            "title": "김치찌개 레시피 저장",
            "time": "2시간 전",
            "icon": "💾"
        },
        {
            "type": "recipe_cooked",
            "title": "된장찌개 요리 완료",
            "time": "어제",
            "icon": "👨‍🍳"
        },
        {
            "type": "ingredient_scan",
            "title": "냉장고 재료 스캔",
            "time": "2일 전",
            "icon": "📷"
        }
    ]

    for activity in activities:
        st.markdown(f"""
        <div style="
            background: white;
            border-left: 3px solid {UITheme.PRIMARY};
            padding: 12px 16px;
            margin: 8px 0;
            border-radius: 4px;
            display: flex;
            align-items: center;
        ">
            <span style="font-size: 1.5em; margin-right: 12px;">
                {activity['icon']}
            </span>
            <div style="flex: 1;">
                <div style="color: {UITheme.DARK}; font-weight: 500;">
                    {activity['title']}
                </div>
                <div style="color: {UITheme.GRAY}; font-size: 0.85em;">
                    {activity['time']}
                </div>
            </div>
        </div>
        """, unsafe_allow_html=True)


def handle_quick_action(action: str):
    """Handle quick action buttons"""
    if action == "photo":
        st.session_state.page = "ingredient_recognition"
        st.session_state.recognition_step = 0
    elif action == "manual":
        st.session_state.page = "ingredient_manual"
    elif action == "random":
        EnhancedMessages.info("오늘의 추천 레시피를 준비 중입니다...")
    elif action == "popular":
        EnhancedMessages.info("인기 레시피를 불러오는 중입니다...")

    st.rerun()


def logout():
    """Enhanced logout with cleanup"""
    with st.spinner("로그아웃 중..."):
        auth = st.session_state.auth_manager
        if st.session_state.token:
            auth.logout(st.session_state.token)

        # Clear session state
        for key in ['user', 'token', 'recognized_ingredients', 'generated_recipes']:
            if key in st.session_state:
                del st.session_state[key]

        # Reset to welcome page
        st.session_state.page = 'welcome'
        st.session_state.first_visit = True

    EnhancedMessages.success("안전하게 로그아웃되었습니다")
    time.sleep(1)
    st.rerun()


if __name__ == "__main__":
    main()