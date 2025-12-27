"""Empty state UI component for consistent empty states across pages."""
import streamlit as st
from typing import Callable


def render_empty_state(
    icon: str,
    title: str,
    description: str,
    action_label: str | None = None,
    action_page: str | None = None,
    secondary_action_label: str | None = None,
    secondary_action_page: str | None = None,
) -> None:
    """Render a consistent empty state UI component.

    Args:
        icon: Emoji to display.
        title: Main title text.
        description: Description text.
        action_label: Primary action button label.
        action_page: Page to navigate on primary action.
        secondary_action_label: Secondary action button label.
        secondary_action_page: Page to navigate on secondary action.
    """
    st.markdown(f"""
    <div style="
        text-align: center;
        padding: 3rem 1rem;
        background-color: #f8f9fa;
        border-radius: 12px;
        margin: 1rem 0;
    ">
        <div style="font-size: 4rem; margin-bottom: 1rem;">{icon}</div>
        <h3 style="color: #333; margin-bottom: 0.5rem;">{title}</h3>
        <p style="color: #666; margin-bottom: 1.5rem;">{description}</p>
    </div>
    """, unsafe_allow_html=True)

    if action_label and action_page:
        col1, col2, col3 = st.columns([1, 2, 1])
        with col2:
            if st.button(action_label, type="primary", use_container_width=True):
                st.switch_page(action_page)

            if secondary_action_label and secondary_action_page:
                if st.button(secondary_action_label, use_container_width=True):
                    st.switch_page(secondary_action_page)


def render_no_ingredients_state() -> None:
    """Render empty state for no ingredients."""
    render_empty_state(
        icon="🥗",
        title="아직 인식된 재료가 없습니다",
        description="냉장고 사진을 업로드하여 재료를 인식해보세요!",
        action_label="📷 재료 인식하러 가기",
        action_page="pages/1_🍳_재료_인식.py",
    )


def render_no_recipes_state() -> None:
    """Render empty state for no saved recipes."""
    render_empty_state(
        icon="📚",
        title="아직 저장된 레시피가 없어요",
        description="마음에 드는 레시피를 저장하면 여기서 모아볼 수 있습니다",
        action_label="🍳 레시피 둘러보기",
        action_page="pages/2_📖_레시피_생성.py",
        secondary_action_label="📷 재료부터 인식하기",
        secondary_action_page="pages/1_🍳_재료_인식.py",
    )


def render_no_cooking_history_state() -> None:
    """Render empty state for no cooking history."""
    render_empty_state(
        icon="👨‍🍳",
        title="아직 요리 기록이 없어요",
        description="레시피를 보고 요리를 완료하면 기록이 쌓입니다",
        action_label="🍳 레시피 보러 가기",
        action_page="pages/2_📖_레시피_생성.py",
    )


def render_login_required_state(
    feature_name: str = "이 기능",
    return_page: str | None = None,
) -> None:
    """Render empty state for login required.

    Args:
        feature_name: Name of the feature requiring login.
        return_page: Page to return after login.
    """
    if return_page:
        st.session_state.redirect_after_login = return_page

    render_empty_state(
        icon="🔐",
        title=f"{feature_name}을(를) 이용하려면 로그인이 필요합니다",
        description="로그인하면 레시피를 저장하고 개인화된 추천을 받을 수 있어요",
        action_label="👤 로그인하러 가기",
        action_page="pages/3_👤_내_프로필.py",
    )
