"""대시보드 페이지 - User statistics and analytics."""
import streamlit as st
import sys
from pathlib import Path
from datetime import datetime

# Add project root to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from db.init_db import init_database
from services.recommendation import RecommendationService
from components.stats_widgets import render_stats_row
from utils.charts import (
    create_ingredient_bar_chart,
    create_cuisine_pie_chart,
    create_cooking_calendar,
)

st.set_page_config(
    page_title="대시보드 - Fridge Chef",
    page_icon="📊",
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


def main():
    """Main page function."""
    init_session_state()

    st.title("📊 나의 요리 대시보드")

    if not st.session_state.is_authenticated:
        st.warning("대시보드를 보려면 로그인이 필요합니다.")
        if st.button("👤 로그인하기"):
            st.switch_page("pages/3_👤_내_프로필.py")
        return

    rec_service = RecommendationService(st.session_state.user_id)

    # Get statistics
    stats = rec_service.get_cooking_stats()
    streak = rec_service.get_cooking_streak()
    stats["streak"] = streak

    # Stats row
    st.markdown("### 📈 요약")
    render_stats_row(stats)

    st.divider()

    # Two column layout
    col1, col2 = st.columns(2)

    with col1:
        # Cooking calendar
        st.markdown("### 📅 요리 캘린더")
        now = datetime.now()

        # Month selector
        month_cols = st.columns([1, 1, 2])
        with month_cols[0]:
            year = st.selectbox(
                "년도",
                options=list(range(now.year - 1, now.year + 1)),
                index=1,
            )
        with month_cols[1]:
            month = st.selectbox(
                "월",
                options=list(range(1, 13)),
                index=now.month - 1,
            )

        cooking_data = rec_service.get_cooking_calendar(year, month)
        calendar_fig = create_cooking_calendar(cooking_data, year, month)
        st.plotly_chart(calendar_fig, use_container_width=True)

        # Time-based suggestion
        meal_type = rec_service.get_time_based_suggestion()
        st.info(f"🕐 지금은 **{meal_type}** 시간이에요! {meal_type} 레시피는 어떠세요?")

    with col2:
        # Top ingredients chart
        st.markdown("### 🥬 자주 사용한 재료 TOP 10")
        top_ingredients = rec_service.get_top_ingredients(limit=10)
        ingredients_fig = create_ingredient_bar_chart(top_ingredients)
        st.plotly_chart(ingredients_fig, use_container_width=True)

    st.divider()

    # Cuisine distribution
    st.markdown("### 🍜 요리 카테고리 분포")
    cuisine_data = rec_service.get_cuisine_distribution()
    if cuisine_data:
        cuisine_fig = create_cuisine_pie_chart(cuisine_data)
        st.plotly_chart(cuisine_fig, use_container_width=True)
    else:
        st.info("태그가 지정된 레시피가 없습니다. 저장된 레시피에 태그를 추가해보세요!")

    st.divider()

    # Highly rated recipes
    st.markdown("### ⭐ 높은 평점 레시피")
    favorites = rec_service.get_highly_rated_recipes(min_rating=4)

    if favorites:
        cols = st.columns(min(3, len(favorites)))
        for idx, recipe in enumerate(favorites[:3]):
            with cols[idx]:
                st.markdown(f"**🍽️ {recipe.get('name', '레시피')}**")
                st.caption(f"⏱️ {recipe.get('cooking_time', 30)}분")
                st.caption(f"👨‍🍳 {recipe.get('difficulty', '보통')}")
    else:
        st.info("아직 높은 평점의 레시피가 없습니다. 레시피에 평점을 남겨보세요!")

    st.divider()

    # Recommendations based on usage
    if top_ingredients:
        st.markdown("### 💡 맞춤 추천")
        ingredient_names = [i[0] for i in top_ingredients[:3]]
        st.info(f"**{', '.join(ingredient_names)}**을(를) 자주 사용하시네요! "
                f"이 재료들로 새로운 레시피를 만들어보세요.")

        if st.button("🍳 새 레시피 생성하기"):
            st.session_state.recognized_ingredients = ingredient_names
            st.switch_page("pages/2_📖_레시피_생성.py")


if __name__ == "__main__":
    main()
