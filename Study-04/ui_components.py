"""
Enhanced UI/UX Components for FridgeChef Application
Provides reusable, accessible, and visually appealing Streamlit components
"""

import streamlit as st
import time
from typing import Dict, List, Optional, Tuple, Any
import random
from datetime import datetime

class UITheme:
    """Consistent theme and styling for the application"""

    # Color palette
    PRIMARY = "#FF6B35"  # Warm orange for food/cooking theme
    SECONDARY = "#004E89"  # Deep blue for trust
    SUCCESS = "#28A745"  # Green for success
    WARNING = "#FFC107"  # Amber for warnings
    ERROR = "#DC3545"  # Red for errors
    INFO = "#17A2B8"  # Cyan for info

    # Neutral colors
    DARK = "#2C3E50"
    LIGHT = "#F8F9FA"
    GRAY = "#6C757D"
    BORDER = "#DEE2E6"

    # Typography
    FONT_FAMILY = "'Pretendard', 'Noto Sans KR', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"

    @staticmethod
    def inject_custom_css():
        """Inject custom CSS for better styling"""
        st.markdown(f"""
        <style>
        /* Global font and colors */
        @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@300;400;500;700&display=swap');

        * {{
            font-family: {UITheme.FONT_FAMILY};
        }}

        /* Improved button styling */
        .stButton > button {{
            border-radius: 8px;
            font-weight: 500;
            transition: all 0.3s ease;
            border: none;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }}

        .stButton > button:hover {{
            transform: translateY(-2px);
            box-shadow: 0 4px 8px rgba(0,0,0,0.15);
        }}

        /* Primary button styling */
        div[data-testid="stButton"] button[kind="primary"] {{
            background: linear-gradient(135deg, {UITheme.PRIMARY}, #FF8C42);
            color: white;
        }}

        /* Card-like containers */
        .element-container {{
            transition: all 0.3s ease;
        }}

        /* Improved file uploader */
        div[data-testid="stFileUploader"] {{
            border: 2px dashed {UITheme.BORDER};
            border-radius: 12px;
            padding: 20px;
            background: {UITheme.LIGHT};
            transition: all 0.3s ease;
        }}

        div[data-testid="stFileUploader"]:hover {{
            border-color: {UITheme.PRIMARY};
            background: white;
        }}

        /* Improved expanders */
        .streamlit-expander {{
            border: 1px solid {UITheme.BORDER};
            border-radius: 8px;
            overflow: hidden;
            margin-bottom: 1rem;
            box-shadow: 0 1px 3px rgba(0,0,0,0.05);
        }}

        /* Better metrics display */
        div[data-testid="metric-container"] {{
            background: white;
            padding: 1rem;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.05);
        }}

        /* Improved tabs */
        .stTabs [data-baseweb="tab-list"] {{
            gap: 8px;
        }}

        .stTabs [data-baseweb="tab"] {{
            border-radius: 8px 8px 0 0;
            font-weight: 500;
        }}

        /* Loading animation */
        @keyframes pulse {{
            0% {{ opacity: 1; }}
            50% {{ opacity: 0.5; }}
            100% {{ opacity: 1; }}
        }}

        .loading {{
            animation: pulse 1.5s ease-in-out infinite;
        }}

        /* Success animation */
        @keyframes slideInUp {{
            from {{
                transform: translateY(20px);
                opacity: 0;
            }}
            to {{
                transform: translateY(0);
                opacity: 1;
            }}
        }}

        .success-message {{
            animation: slideInUp 0.3s ease-out;
        }}

        /* Improved input fields */
        .stTextInput input {{
            border-radius: 8px;
            border: 1px solid {UITheme.BORDER};
            padding: 10px 12px;
            transition: all 0.3s ease;
        }}

        .stTextInput input:focus {{
            border-color: {UITheme.PRIMARY};
            box-shadow: 0 0 0 2px rgba(255, 107, 53, 0.1);
        }}

        /* Better sidebar */
        section[data-testid="stSidebar"] {{
            background: linear-gradient(180deg, {UITheme.LIGHT} 0%, white 100%);
        }}

        /* Accessibility improvements */
        button:focus-visible,
        input:focus-visible,
        select:focus-visible,
        textarea:focus-visible {{
            outline: 2px solid {UITheme.PRIMARY};
            outline-offset: 2px;
        }}

        /* Dark mode support */
        @media (prefers-color-scheme: dark) {{
            .stApp {{
                background-color: #1a1a1a;
                color: #ffffff;
            }}
        }}
        </style>
        """, unsafe_allow_html=True)


class EnhancedMessages:
    """Enhanced message display with better UX"""

    @staticmethod
    def success(message: str, icon: str = "✅", duration: int = 3):
        """Display enhanced success message"""
        container = st.container()
        with container:
            st.markdown(f"""
            <div class="success-message" style="
                background: linear-gradient(135deg, {UITheme.SUCCESS}15, {UITheme.SUCCESS}10);
                border-left: 4px solid {UITheme.SUCCESS};
                padding: 12px 16px;
                border-radius: 8px;
                margin: 8px 0;
            ">
                <span style="font-size: 1.2em; margin-right: 8px;">{icon}</span>
                <span style="color: {UITheme.SUCCESS}; font-weight: 500;">{message}</span>
            </div>
            """, unsafe_allow_html=True)

        # Auto-dismiss after duration
        if duration > 0:
            time.sleep(duration)
            container.empty()

    @staticmethod
    def error(message: str, suggestion: str = None, error_code: str = None):
        """Display user-friendly error message with recovery suggestion"""
        error_messages = {
            "connection": "인터넷 연결을 확인해주세요",
            "api": "잠시 후 다시 시도해주세요",
            "auth": "로그인 정보를 확인해주세요",
            "file": "올바른 파일 형식을 선택해주세요",
            "data": "입력 정보를 확인해주세요"
        }

        # Determine error type and suggestion
        if not suggestion:
            for key, value in error_messages.items():
                if key in message.lower():
                    suggestion = value
                    break
            suggestion = suggestion or "문제가 지속되면 고객 지원팀에 문의해주세요"

        st.markdown(f"""
        <div style="
            background: {UITheme.ERROR}10;
            border: 1px solid {UITheme.ERROR};
            border-radius: 8px;
            padding: 16px;
            margin: 8px 0;
        ">
            <div style="display: flex; align-items: start;">
                <span style="font-size: 1.5em; margin-right: 12px;">⚠️</span>
                <div style="flex: 1;">
                    <div style="color: {UITheme.ERROR}; font-weight: 600; margin-bottom: 8px;">
                        문제가 발생했습니다
                    </div>
                    <div style="color: {UITheme.DARK}; margin-bottom: 8px;">
                        {message}
                    </div>
                    <div style="color: {UITheme.GRAY}; font-size: 0.9em;">
                        💡 해결방법: {suggestion}
                    </div>
                    {f'<div style="color: {UITheme.GRAY}; font-size: 0.8em; margin-top: 8px;">오류 코드: {error_code}</div>' if error_code else ''}
                </div>
            </div>
        </div>
        """, unsafe_allow_html=True)

    @staticmethod
    def info(message: str, icon: str = "ℹ️"):
        """Display informative message"""
        st.markdown(f"""
        <div style="
            background: {UITheme.INFO}10;
            border-left: 4px solid {UITheme.INFO};
            padding: 12px 16px;
            border-radius: 8px;
            margin: 8px 0;
        ">
            <span style="margin-right: 8px;">{icon}</span>
            <span style="color: {UITheme.DARK};">{message}</span>
        </div>
        """, unsafe_allow_html=True)

    @staticmethod
    def warning(message: str, action: str = None):
        """Display warning message with optional action"""
        st.markdown(f"""
        <div style="
            background: {UITheme.WARNING}15;
            border: 1px solid {UITheme.WARNING};
            border-radius: 8px;
            padding: 12px 16px;
            margin: 8px 0;
        ">
            <div style="display: flex; align-items: center;">
                <span style="font-size: 1.2em; margin-right: 8px;">⚠️</span>
                <div style="flex: 1;">
                    <div style="color: {UITheme.DARK}; font-weight: 500;">{message}</div>
                    {f'<div style="color: {UITheme.GRAY}; font-size: 0.9em; margin-top: 4px;">→ {action}</div>' if action else ''}
                </div>
            </div>
        </div>
        """, unsafe_allow_html=True)


class LoadingStates:
    """Enhanced loading states and progress indicators"""

    @staticmethod
    def skeleton_loader(rows: int = 3):
        """Display skeleton loader for content"""
        for i in range(rows):
            st.markdown(f"""
            <div class="loading" style="
                background: linear-gradient(90deg, {UITheme.LIGHT} 0%, {UITheme.BORDER} 50%, {UITheme.LIGHT} 100%);
                height: 60px;
                border-radius: 8px;
                margin-bottom: 12px;
                background-size: 200% 100%;
            "></div>
            """, unsafe_allow_html=True)

    @staticmethod
    def progress_with_status(message: str, steps: List[str]):
        """Enhanced progress bar with status messages"""
        progress_container = st.empty()
        status_container = st.empty()

        for i, step in enumerate(steps):
            progress = (i + 1) / len(steps)
            progress_container.progress(progress)

            status_container.markdown(f"""
            <div style="text-align: center; padding: 8px;">
                <div style="color: {UITheme.PRIMARY}; font-weight: 500;">
                    {message}
                </div>
                <div style="color: {UITheme.GRAY}; font-size: 0.9em; margin-top: 4px;">
                    {step} ({i + 1}/{len(steps)})
                </div>
            </div>
            """, unsafe_allow_html=True)

            time.sleep(0.5)  # Simulate processing

        return progress_container, status_container

    @staticmethod
    def loading_animation(message: str = "처리중...", emoji: str = "🍳"):
        """Animated loading indicator"""
        animations = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"]
        placeholder = st.empty()

        for i in range(20):
            placeholder.markdown(f"""
            <div style="
                text-align: center;
                padding: 20px;
                background: {UITheme.LIGHT};
                border-radius: 12px;
            ">
                <div style="font-size: 3em; margin-bottom: 12px;">
                    {emoji}
                </div>
                <div style="color: {UITheme.PRIMARY}; font-weight: 500;">
                    {animations[i % len(animations)]} {message}
                </div>
            </div>
            """, unsafe_allow_html=True)
            time.sleep(0.1)

        return placeholder


class RecipeCard:
    """Enhanced recipe card component"""

    @staticmethod
    def display(recipe: Dict, index: int = 0) -> bool:
        """Display an enhanced recipe card"""
        with st.container():
            st.markdown(f"""
            <div style="
                background: white;
                border: 1px solid {UITheme.BORDER};
                border-radius: 12px;
                padding: 16px;
                margin-bottom: 16px;
                box-shadow: 0 2px 8px rgba(0,0,0,0.05);
                transition: all 0.3s ease;
            "
            onmouseover="this.style.boxShadow='0 4px 12px rgba(0,0,0,0.1)'"
            onmouseout="this.style.boxShadow='0 2px 8px rgba(0,0,0,0.05)'">
                <div style="display: flex; justify-content: space-between; align-items: start;">
                    <div>
                        <h3 style="color: {UITheme.DARK}; margin: 0 0 8px 0;">
                            {recipe.get('name', '이름 없음')}
                        </h3>
                        <div style="display: flex; gap: 16px; color: {UITheme.GRAY}; font-size: 0.9em;">
                            <span>⏱️ {recipe.get('time', 30)}분</span>
                            <span>⭐ {recipe.get('difficulty', '보통')}</span>
                            <span>🔥 {recipe.get('calories', 0)}kcal</span>
                            <span>👥 {recipe.get('servings', 4)}인분</span>
                        </div>
                    </div>
                    <div style="
                        background: {UITheme.PRIMARY}15;
                        color: {UITheme.PRIMARY};
                        padding: 4px 12px;
                        border-radius: 20px;
                        font-weight: 500;
                        font-size: 0.9em;
                    ">
                        {recipe.get('match_score', 85)}% 매칭
                    </div>
                </div>
            </div>
            """, unsafe_allow_html=True)

            col1, col2, col3 = st.columns([2, 2, 1])
            with col1:
                if st.button("자세히 보기", key=f"detail_{index}", use_container_width=True):
                    return True
            with col2:
                if st.button("💾 저장하기", key=f"save_{index}", use_container_width=True):
                    EnhancedMessages.success("레시피가 저장되었습니다!")
            with col3:
                if st.button("🔗", key=f"share_{index}", use_container_width=True):
                    st.info("공유 링크가 복사되었습니다")

        return False


class OnboardingFlow:
    """Enhanced onboarding experience for new users"""

    @staticmethod
    def welcome_screen():
        """Display welcome screen for first-time users"""
        st.markdown(f"""
        <div style="
            text-align: center;
            padding: 40px 20px;
            background: linear-gradient(135deg, {UITheme.PRIMARY}10, {UITheme.SECONDARY}10);
            border-radius: 20px;
            margin: 20px 0;
        ">
            <h1 style="color: {UITheme.PRIMARY}; margin-bottom: 16px;">
                🍳 FridgeChef에 오신 것을 환영합니다!
            </h1>
            <p style="color: {UITheme.DARK}; font-size: 1.1em; margin-bottom: 24px;">
                냉장고 속 재료로 맛있는 요리를 만들어보세요
            </p>
        </div>
        """, unsafe_allow_html=True)

        # Feature highlights
        features = [
            ("📷", "사진 인식", "냉장고 사진만 찍으면 AI가 재료를 자동 인식"),
            ("🤖", "AI 레시피", "보유한 재료로 만들 수 있는 레시피 추천"),
            ("⭐", "맞춤 추천", "취향과 식단을 고려한 개인화 추천"),
            ("📚", "레시피 저장", "마음에 드는 레시피를 저장하고 관리")
        ]

        cols = st.columns(4)
        for col, (emoji, title, desc) in zip(cols, features):
            with col:
                st.markdown(f"""
                <div style="
                    text-align: center;
                    padding: 20px 10px;
                    background: white;
                    border-radius: 12px;
                    height: 150px;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.05);
                ">
                    <div style="font-size: 2em; margin-bottom: 8px;">{emoji}</div>
                    <div style="color: {UITheme.DARK}; font-weight: 600; margin-bottom: 8px;">{title}</div>
                    <div style="color: {UITheme.GRAY}; font-size: 0.85em;">{desc}</div>
                </div>
                """, unsafe_allow_html=True)

        return st.button("시작하기", type="primary", use_container_width=True)

    @staticmethod
    def tutorial_steps():
        """Interactive tutorial for new users"""
        if 'tutorial_step' not in st.session_state:
            st.session_state.tutorial_step = 0

        steps = [
            {
                "title": "1단계: 냉장고 사진 촬영",
                "content": "냉장고 내부가 잘 보이도록 사진을 촬영해주세요",
                "tip": "💡 밝은 조명에서 촬영하면 인식률이 높아집니다"
            },
            {
                "title": "2단계: 재료 확인",
                "content": "AI가 인식한 재료를 확인하고 필요시 수정해주세요",
                "tip": "💡 인식되지 않은 재료는 직접 추가할 수 있습니다"
            },
            {
                "title": "3단계: 레시피 선택",
                "content": "추천된 레시피 중 마음에 드는 것을 선택해주세요",
                "tip": "💡 난이도와 조리시간을 고려해 선택하세요"
            }
        ]

        current = st.session_state.tutorial_step

        # Progress indicator
        progress = (current + 1) / len(steps)
        st.progress(progress)

        # Current step
        step = steps[current]
        st.markdown(f"""
        <div style="
            background: {UITheme.LIGHT};
            border-left: 4px solid {UITheme.PRIMARY};
            padding: 20px;
            border-radius: 8px;
            margin: 20px 0;
        ">
            <h3 style="color: {UITheme.PRIMARY}; margin-bottom: 12px;">
                {step['title']}
            </h3>
            <p style="color: {UITheme.DARK}; margin-bottom: 12px;">
                {step['content']}
            </p>
            <div style="
                background: {UITheme.INFO}10;
                padding: 8px 12px;
                border-radius: 6px;
                color: {UITheme.INFO};
            ">
                {step['tip']}
            </div>
        </div>
        """, unsafe_allow_html=True)

        # Navigation
        col1, col2, col3 = st.columns([1, 1, 1])
        with col1:
            if current > 0:
                if st.button("이전", use_container_width=True):
                    st.session_state.tutorial_step -= 1
                    st.rerun()

        with col3:
            if current < len(steps) - 1:
                if st.button("다음", type="primary", use_container_width=True):
                    st.session_state.tutorial_step += 1
                    st.rerun()
            else:
                if st.button("완료", type="primary", use_container_width=True):
                    st.session_state.tutorial_completed = True
                    st.rerun()


class FormValidation:
    """Enhanced form validation with real-time feedback"""

    @staticmethod
    def email_input(label: str, key: str) -> Tuple[str, bool]:
        """Email input with validation"""
        email = st.text_input(label, key=key)

        if email:
            import re
            pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
            is_valid = bool(re.match(pattern, email))

            if is_valid:
                st.markdown(f"""
                <div style="color: {UITheme.SUCCESS}; font-size: 0.85em; margin-top: -10px;">
                    ✓ 올바른 이메일 형식입니다
                </div>
                """, unsafe_allow_html=True)
            else:
                st.markdown(f"""
                <div style="color: {UITheme.ERROR}; font-size: 0.85em; margin-top: -10px;">
                    ✗ 올바른 이메일 주소를 입력해주세요
                </div>
                """, unsafe_allow_html=True)

            return email, is_valid

        return email, False

    @staticmethod
    def password_strength(password: str) -> Dict:
        """Check password strength and provide feedback"""
        checks = {
            "length": len(password) >= 8,
            "uppercase": any(c.isupper() for c in password),
            "lowercase": any(c.islower() for c in password),
            "number": any(c.isdigit() for c in password),
            "special": any(c in "!@#$%^&*" for c in password)
        }

        strength = sum(checks.values())

        if strength <= 2:
            level = "약함"
            color = UITheme.ERROR
        elif strength <= 3:
            level = "보통"
            color = UITheme.WARNING
        else:
            level = "강함"
            color = UITheme.SUCCESS

        return {
            "level": level,
            "color": color,
            "score": strength,
            "checks": checks
        }

    @staticmethod
    def password_input_with_strength(label: str, key: str) -> str:
        """Password input with strength indicator"""
        password = st.text_input(label, type="password", key=key)

        if password:
            strength = FormValidation.password_strength(password)

            # Strength bar
            st.markdown(f"""
            <div style="margin-top: -10px; margin-bottom: 10px;">
                <div style="
                    background: {UITheme.LIGHT};
                    height: 6px;
                    border-radius: 3px;
                    overflow: hidden;
                ">
                    <div style="
                        background: {strength['color']};
                        width: {strength['score'] * 20}%;
                        height: 100%;
                        transition: width 0.3s ease;
                    "></div>
                </div>
                <div style="
                    color: {strength['color']};
                    font-size: 0.85em;
                    margin-top: 4px;
                ">
                    비밀번호 강도: {strength['level']}
                </div>
            </div>
            """, unsafe_allow_html=True)

            # Requirements checklist
            requirements = [
                (strength['checks']['length'], "8자 이상"),
                (strength['checks']['uppercase'], "대문자 포함"),
                (strength['checks']['lowercase'], "소문자 포함"),
                (strength['checks']['number'], "숫자 포함"),
                (strength['checks']['special'], "특수문자 포함")
            ]

            req_html = ""
            for passed, req in requirements:
                icon = "✓" if passed else "○"
                color = UITheme.SUCCESS if passed else UITheme.GRAY
                req_html += f'<span style="color: {color}; margin-right: 12px; font-size: 0.85em;">{icon} {req}</span>'

            st.markdown(f'<div style="margin-top: -5px;">{req_html}</div>', unsafe_allow_html=True)

        return password


class AccessibilityFeatures:
    """Accessibility enhancements for better usability"""

    @staticmethod
    def screen_reader_text(text: str, visible: bool = False):
        """Add screen reader friendly text"""
        if visible:
            st.markdown(f'<span role="status" aria-live="polite">{text}</span>', unsafe_allow_html=True)
        else:
            st.markdown(f'<span class="sr-only" style="position: absolute; left: -10000px;">{text}</span>',
                       unsafe_allow_html=True)

    @staticmethod
    def keyboard_navigation_hint():
        """Display keyboard navigation hints"""
        st.markdown(f"""
        <div style="
            background: {UITheme.INFO}10;
            border: 1px solid {UITheme.INFO};
            padding: 12px;
            border-radius: 8px;
            font-size: 0.9em;
            color: {UITheme.DARK};
        ">
            <strong>키보드 단축키:</strong><br>
            • Tab: 다음 항목으로 이동<br>
            • Shift+Tab: 이전 항목으로 이동<br>
            • Enter: 선택/실행<br>
            • Esc: 닫기/취소
        </div>
        """, unsafe_allow_html=True)

    @staticmethod
    def high_contrast_mode():
        """Enable high contrast mode for better visibility"""
        if st.checkbox("고대비 모드", key="high_contrast"):
            st.markdown("""
            <style>
            * {
                background: #000000 !important;
                color: #FFFFFF !important;
                border-color: #FFFFFF !important;
            }
            button {
                background: #FFFFFF !important;
                color: #000000 !important;
            }
            </style>
            """, unsafe_allow_html=True)

    @staticmethod
    def font_size_selector():
        """Allow users to adjust font size"""
        size = st.select_slider(
            "글자 크기",
            options=["작게", "보통", "크게", "매우 크게"],
            value="보통",
            key="font_size"
        )

        sizes = {
            "작게": "14px",
            "보통": "16px",
            "크게": "18px",
            "매우 크게": "20px"
        }

        st.markdown(f"""
        <style>
        .stApp {{
            font-size: {sizes[size]};
        }}
        </style>
        """, unsafe_allow_html=True)


class ResponsiveLayout:
    """Responsive design utilities"""

    @staticmethod
    def adaptive_columns(mobile: int = 1, tablet: int = 2, desktop: int = 3) -> List:
        """Create adaptive columns based on screen size"""
        st.markdown(f"""
        <style>
        @media (max-width: 640px) {{
            .row-widget.stHorizontal {{
                flex-direction: column;
            }}
        }}
        @media (min-width: 641px) and (max-width: 1024px) {{
            .row-widget.stHorizontal > div {{
                flex: 0 0 {100/tablet}%;
            }}
        }}
        </style>
        """, unsafe_allow_html=True)

        return st.columns(desktop)

    @staticmethod
    def mobile_friendly_tabs(tabs: List[str], icons: List[str] = None):
        """Create mobile-friendly tab navigation"""
        if icons and len(icons) == len(tabs):
            tab_labels = [f"{icon} {label}" for icon, label in zip(icons, tabs)]
        else:
            tab_labels = tabs

        # For mobile, show as select box
        st.markdown("""
        <style>
        @media (max-width: 640px) {
            .stTabs {
                display: none;
            }
        }
        </style>
        """, unsafe_allow_html=True)

        # Mobile selector (hidden on desktop)
        mobile_tab = st.selectbox("메뉴 선택", tab_labels, label_visibility="collapsed")

        # Desktop tabs
        selected_tabs = st.tabs(tab_labels)

        return selected_tabs


class EmptyStates:
    """Meaningful empty states instead of blank screens"""

    @staticmethod
    def no_data(message: str, action_text: str = None, icon: str = "📭"):
        """Display empty state with call to action"""
        st.markdown(f"""
        <div style="
            text-align: center;
            padding: 60px 20px;
            background: {UITheme.LIGHT};
            border-radius: 12px;
            margin: 20px 0;
        ">
            <div style="font-size: 4em; margin-bottom: 16px; opacity: 0.5;">
                {icon}
            </div>
            <h3 style="color: {UITheme.DARK}; margin-bottom: 8px;">
                {message}
            </h3>
            {f'<p style="color: {UITheme.GRAY};">{action_text}</p>' if action_text else ''}
        </div>
        """, unsafe_allow_html=True)

    @staticmethod
    def no_recipes():
        """Empty state for no recipes"""
        EmptyStates.no_data(
            "아직 저장된 레시피가 없습니다",
            "냉장고 사진을 업로드하여 첫 레시피를 만들어보세요!",
            "🍽️"
        )

    @staticmethod
    def no_ingredients():
        """Empty state for no ingredients"""
        EmptyStates.no_data(
            "인식된 재료가 없습니다",
            "냉장고 사진을 업로드하거나 재료를 직접 추가해주세요",
            "🥕"
        )


class PerformanceOptimizations:
    """Performance perception improvements"""

    @staticmethod
    def optimistic_update(action: str, success_message: str):
        """Show immediate feedback before actual processing"""
        # Immediate visual feedback
        placeholder = st.empty()
        placeholder.success(f"✓ {action}...")

        # Actual processing would happen here
        time.sleep(0.5)  # Simulate processing

        # Update with final message
        placeholder.success(success_message)

    @staticmethod
    def lazy_load_content(items: List, batch_size: int = 10):
        """Lazy load content for better initial performance"""
        if 'loaded_items' not in st.session_state:
            st.session_state.loaded_items = batch_size

        # Display loaded items
        displayed_items = items[:st.session_state.loaded_items]

        for item in displayed_items:
            yield item

        # Load more button
        if st.session_state.loaded_items < len(items):
            if st.button("더 보기", use_container_width=True):
                st.session_state.loaded_items += batch_size
                st.rerun()

    @staticmethod
    def progressive_image_load(image_url: str, placeholder: str = "🖼️"):
        """Progressive image loading with placeholder"""
        image_container = st.empty()

        # Show placeholder first
        image_container.markdown(f"""
        <div style="
            width: 100%;
            height: 200px;
            background: {UITheme.LIGHT};
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 8px;
        ">
            <span style="font-size: 3em; opacity: 0.3;">{placeholder}</span>
        </div>
        """, unsafe_allow_html=True)

        # Load actual image
        time.sleep(0.3)  # Simulate loading
        image_container.image(image_url)


# Export all components
__all__ = [
    'UITheme',
    'EnhancedMessages',
    'LoadingStates',
    'RecipeCard',
    'OnboardingFlow',
    'FormValidation',
    'AccessibilityFeatures',
    'ResponsiveLayout',
    'EmptyStates',
    'PerformanceOptimizations'
]