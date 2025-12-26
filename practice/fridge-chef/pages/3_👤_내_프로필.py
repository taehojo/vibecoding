"""사용자 프로필 페이지 - User profile management."""
import streamlit as st
import sys
from pathlib import Path

# Add project root to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from db.init_db import init_database
from services.auth import AuthService

st.set_page_config(
    page_title="내 프로필 - Fridge Chef",
    page_icon="👤",
    layout="wide",
)

# Initialize database
init_database()


def init_session_state():
    """Initialize session state variables."""
    if "user_id" not in st.session_state:
        st.session_state.user_id = None
    if "is_authenticated" not in st.session_state:
        st.session_state.is_authenticated = False
    if "username" not in st.session_state:
        st.session_state.username = None


def render_login_form():
    """Render login form."""
    st.markdown("### 🔐 로그인")

    with st.form("login_form"):
        username = st.text_input("아이디", placeholder="사용자명 입력")
        password = st.text_input("비밀번호", type="password", placeholder="비밀번호 입력")
        submitted = st.form_submit_button("로그인", type="primary", use_container_width=True)

        if submitted:
            if not username or not password:
                st.error("아이디와 비밀번호를 입력해주세요.")
            else:
                user = AuthService.login(username, password)
                if user:
                    st.session_state.user_id = user.id
                    st.session_state.is_authenticated = True
                    st.session_state.username = user.username
                    st.success("로그인 성공!")
                    st.rerun()
                else:
                    st.error("아이디 또는 비밀번호가 올바르지 않습니다.")


def render_register_form():
    """Render registration form."""
    st.markdown("### 📝 회원가입")

    with st.form("register_form"):
        username = st.text_input("아이디", placeholder="사용할 아이디")
        nickname = st.text_input("닉네임", placeholder="표시될 닉네임")
        password = st.text_input("비밀번호", type="password", placeholder="비밀번호")
        password_confirm = st.text_input("비밀번호 확인", type="password", placeholder="비밀번호 재입력")

        submitted = st.form_submit_button("회원가입", use_container_width=True)

        if submitted:
            if not username or not password:
                st.error("아이디와 비밀번호를 입력해주세요.")
            elif password != password_confirm:
                st.error("비밀번호가 일치하지 않습니다.")
            elif len(password) < 4:
                st.error("비밀번호는 4자 이상이어야 합니다.")
            else:
                user = AuthService.register(username, password, nickname)
                if user:
                    st.success("회원가입이 완료되었습니다! 로그인해주세요.")
                else:
                    st.error("이미 사용 중인 아이디입니다.")


def render_profile_settings():
    """Render profile settings for logged-in user."""
    user = AuthService.get_user_by_id(st.session_state.user_id)
    prefs = AuthService.get_preferences(st.session_state.user_id)

    if not user:
        st.error("사용자 정보를 찾을 수 없습니다.")
        return

    st.markdown(f"### 👤 {user.nickname}님, 안녕하세요!")
    st.caption(f"요리 레벨: {get_skill_label(user.skill_level)}")

    st.divider()

    st.markdown("### ⚙️ 프로필 설정")

    # Basic Info
    with st.form("profile_form"):
        col1, col2 = st.columns(2)

        with col1:
            nickname = st.text_input("닉네임", value=user.nickname or "")

        with col2:
            skill_options = ["초보", "중급", "고급"]
            skill_map = {"beginner": "초보", "intermediate": "중급", "advanced": "고급"}
            reverse_skill_map = {"초보": "beginner", "중급": "intermediate", "고급": "advanced"}
            current_skill = skill_map.get(user.skill_level, "초보")
            skill_level = st.selectbox(
                "요리 실력",
                options=skill_options,
                index=skill_options.index(current_skill)
            )

        st.markdown("**식이 제한**")
        dietary_options = ["채식", "저염식", "저당", "글루텐프리", "할랄", "코셔"]
        current_dietary = prefs.get("dietary_preferences", [])
        dietary = []
        cols = st.columns(len(dietary_options))
        for i, option in enumerate(dietary_options):
            with cols[i]:
                if st.checkbox(option, value=option in current_dietary, key=f"diet_{option}"):
                    dietary.append(option)

        st.markdown("**알레르기**")
        allergies_str = st.text_input(
            "알레르기 재료 (쉼표로 구분)",
            value=", ".join(prefs.get("allergies", [])),
            placeholder="예: 땅콩, 갑각류, 계란"
        )
        allergies = [a.strip() for a in allergies_str.split(",") if a.strip()]

        st.markdown("**선호 요리**")
        cuisine_options = ["한식", "일식", "중식", "양식", "동남아", "인도", "멕시코"]
        current_cuisines = prefs.get("favorite_cuisines", [])
        cuisines = []
        cols = st.columns(len(cuisine_options))
        for i, option in enumerate(cuisine_options):
            with cols[i]:
                if st.checkbox(option, value=option in current_cuisines, key=f"cuisine_{option}"):
                    cuisines.append(option)

        st.markdown("**제외할 재료**")
        excluded_str = st.text_input(
            "제외할 재료 (쉼표로 구분)",
            value=", ".join(prefs.get("excluded_ingredients", [])),
            placeholder="예: 고수, 파"
        )
        excluded = [e.strip() for e in excluded_str.split(",") if e.strip()]

        submitted = st.form_submit_button("💾 저장하기", type="primary", use_container_width=True)

        if submitted:
            # Update profile
            AuthService.update_profile(
                st.session_state.user_id,
                nickname=nickname,
                skill_level=reverse_skill_map[skill_level]
            )
            # Update preferences
            AuthService.update_preferences(
                st.session_state.user_id,
                dietary_preferences=dietary,
                allergies=allergies,
                favorite_cuisines=cuisines,
                excluded_ingredients=excluded
            )
            st.success("프로필이 저장되었습니다!")

    st.divider()

    # Logout button
    col1, col2, col3 = st.columns([1, 1, 1])
    with col2:
        if st.button("🚪 로그아웃", use_container_width=True):
            st.session_state.user_id = None
            st.session_state.is_authenticated = False
            st.session_state.username = None
            st.rerun()


def get_skill_label(skill_level: str) -> str:
    """Get Korean label for skill level."""
    labels = {
        "beginner": "초보 🌱",
        "intermediate": "중급 🍳",
        "advanced": "고급 👨‍🍳",
    }
    return labels.get(skill_level, "초보 🌱")


def main():
    """Main page function."""
    init_session_state()

    st.title("👤 내 프로필")

    if st.session_state.is_authenticated:
        render_profile_settings()
    else:
        st.markdown("로그인하여 레시피를 저장하고 개인화된 추천을 받아보세요!")

        tab1, tab2 = st.tabs(["로그인", "회원가입"])

        with tab1:
            render_login_form()

        with tab2:
            render_register_form()

        st.divider()

        st.info("💡 게스트 모드로도 재료 인식과 레시피 생성을 이용할 수 있습니다.")


if __name__ == "__main__":
    main()
