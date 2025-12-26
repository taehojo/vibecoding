"""Fridge Chef - 냉장고 재료 기반 AI 레시피 추천 서비스"""
import streamlit as st

st.set_page_config(
    page_title="Fridge Chef",
    page_icon="🍳",
    layout="wide",
    initial_sidebar_state="expanded",
)


def init_session_state():
    """Initialize session state variables."""
    if "recognized_ingredients" not in st.session_state:
        st.session_state.recognized_ingredients = []
    if "uploaded_image" not in st.session_state:
        st.session_state.uploaded_image = None


def main():
    """Main application entry point."""
    init_session_state()

    st.title("🍳 Fridge Chef")
    st.subheader("냉장고 재료로 만드는 맞춤 레시피")

    st.markdown("""
    ### 사용 방법
    1. **📷 재료 인식**: 냉장고 사진을 업로드하면 AI가 재료를 인식합니다
    2. **📖 레시피 생성**: 인식된 재료로 맞춤 레시피를 추천받습니다
    3. **👤 내 프로필**: 좋아하는 레시피를 저장하고 관리합니다

    ---

    👈 왼쪽 사이드바에서 시작하세요!
    """)

    # Quick status
    if st.session_state.recognized_ingredients:
        st.success(f"✅ 인식된 재료: {len(st.session_state.recognized_ingredients)}개")
        st.write(", ".join(st.session_state.recognized_ingredients[:5]))
        if len(st.session_state.recognized_ingredients) > 5:
            st.write(f"... 외 {len(st.session_state.recognized_ingredients) - 5}개")


if __name__ == "__main__":
    main()
