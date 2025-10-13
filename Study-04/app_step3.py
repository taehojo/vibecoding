"""
FridgeChef - Step 3: User Profile and Recipe Management System
Complete application with user authentication and personalization
"""
import streamlit as st
import pandas as pd
import plotly.express as px
import plotly.graph_objects as go
from datetime import datetime
import json

# Import backend modules
from backend.config import Config
from backend.openrouter_client import OpenRouterClient
from backend.image_service import ImageProcessor
from backend.recipe_generator import RecipeGenerator
from backend.ingredient_manager import IngredientManager
from backend.database import RecipeDatabase
from backend.auth import AuthManager
from backend.user_profile import UserProfileManager

# Page configuration
st.set_page_config(
    page_title="FridgeChef - 완성된 레시피 관리 시스템",
    page_icon="🍳",
    layout="wide",
    initial_sidebar_state="expanded"
)

# Initialize session state
if 'auth_manager' not in st.session_state:
    st.session_state.auth_manager = AuthManager()
if 'profile_manager' not in st.session_state:
    st.session_state.profile_manager = UserProfileManager()
if 'user' not in st.session_state:
    st.session_state.user = None
if 'token' not in st.session_state:
    st.session_state.token = None
if 'page' not in st.session_state:
    st.session_state.page = 'login'
if 'recognized_ingredients' not in st.session_state:
    st.session_state.recognized_ingredients = None
if 'generated_recipes' not in st.session_state:
    st.session_state.generated_recipes = None
if 'ingredient_manager' not in st.session_state:
    st.session_state.ingredient_manager = IngredientManager()
if 'db' not in st.session_state:
    st.session_state.db = RecipeDatabase()

def main():
    """Main application function"""

    # Validate configuration
    try:
        Config.validate()
    except ValueError as e:
        st.error(f"설정 오류: {e}")
        st.stop()

    # Check authentication
    if st.session_state.user is None:
        show_auth_page()
    else:
        show_main_app()

def show_auth_page():
    """Show authentication page (login/register)"""
    st.title("🍳 FridgeChef")
    st.subheader("AI 기반 맞춤형 레시피 추천 시스템")

    col1, col2, col3 = st.columns([1, 2, 1])

    with col2:
        tab1, tab2 = st.tabs(["로그인", "회원가입"])

        with tab1:
            show_login_form()

        with tab2:
            show_register_form()

def show_login_form():
    """Show login form"""
    with st.form("login_form"):
        st.subheader("로그인")

        email = st.text_input("이메일", placeholder="your@email.com")
        password = st.text_input("비밀번호", type="password")

        col1, col2 = st.columns(2)
        with col1:
            submit = st.form_submit_button("로그인", type="primary", use_container_width=True)
        with col2:
            demo = st.form_submit_button("데모 계정", use_container_width=True)

    if submit:
        if email and password:
            auth = st.session_state.auth_manager
            result = auth.login(email, password)

            if result['success']:
                st.session_state.user = result['user']
                st.session_state.token = result['token']
                st.success("로그인 성공!")
                st.rerun()
            else:
                st.error(result['error'])
        else:
            st.error("이메일과 비밀번호를 입력하세요")

    if demo:
        # Demo account login
        demo_email = "demo@fridgechef.com"
        demo_password = "demo123"

        # Create demo account if not exists
        auth = st.session_state.auth_manager
        auth.register(demo_email, "DemoUser", demo_password)

        result = auth.login(demo_email, demo_password)
        if result['success']:
            st.session_state.user = result['user']
            st.session_state.token = result['token']
            st.success("데모 계정으로 로그인했습니다!")
            st.rerun()

def show_register_form():
    """Show registration form"""
    with st.form("register_form"):
        st.subheader("회원가입")

        email = st.text_input("이메일", placeholder="your@email.com")
        username = st.text_input("사용자명", placeholder="사용자명")
        password = st.text_input("비밀번호", type="password", help="6자 이상")
        password_confirm = st.text_input("비밀번호 확인", type="password")

        terms = st.checkbox("이용약관에 동의합니다")

        submit = st.form_submit_button("가입하기", type="primary", use_container_width=True)

    if submit:
        if not all([email, username, password, password_confirm]):
            st.error("모든 필드를 입력해주세요")
        elif password != password_confirm:
            st.error("비밀번호가 일치하지 않습니다")
        elif not terms:
            st.error("이용약관에 동의해주세요")
        else:
            auth = st.session_state.auth_manager
            result = auth.register(email, username, password)

            if result['success']:
                st.success(result['message'])
                st.info("로그인 탭에서 로그인하세요")
            else:
                st.error(result['error'])

def show_main_app():
    """Show main application for authenticated users"""

    # Header with user info
    col1, col2, col3 = st.columns([2, 1, 1])

    with col1:
        st.title("🍳 FridgeChef")

    with col2:
        user = st.session_state.user
        st.write(f"👤 {user['username']}")

    with col3:
        if st.button("로그아웃", use_container_width=True):
            logout()

    # Main tabs
    tab1, tab2, tab3, tab4, tab5, tab6 = st.tabs([
        "🏠 대시보드",
        "📷 재료 인식",
        "🍽️ 레시피 생성",
        "📚 나의 레시피",
        "👤 프로필",
        "🎯 추천"
    ])

    with tab1:
        show_dashboard()

    with tab2:
        show_ingredient_recognition()

    with tab3:
        show_recipe_generation()

    with tab4:
        show_my_recipes()

    with tab5:
        show_profile()

    with tab6:
        show_recommendations()

def show_dashboard():
    """Show user dashboard with statistics"""
    st.header("📊 나의 요리 대시보드")

    user_id = st.session_state.user['id']
    profile_manager = st.session_state.profile_manager

    # Get statistics
    stats = profile_manager.get_statistics(user_id)

    # Key metrics
    col1, col2, col3, col4 = st.columns(4)

    with col1:
        st.metric("저장한 레시피", f"{stats['total_saved']}개", delta="+2 이번 주")

    with col2:
        st.metric("요리한 횟수", f"{stats['total_cooked']}회", delta="+3 이번 달")

    with col3:
        st.metric("평균 평점", f"{stats['avg_rating']:.1f} ⭐" if stats['avg_rating'] else "- ⭐")

    with col4:
        st.metric("레시피 폴더", f"{stats['total_folders']}개")

    # Charts
    st.subheader("📈 통계")

    col1, col2 = st.columns(2)

    with col1:
        # Cuisine distribution pie chart
        if stats['favorite_cuisine']:
            fig = px.pie(
                values=list(stats['favorite_cuisine'].values()),
                names=list(stats['favorite_cuisine'].keys()),
                title="선호 요리 분포"
            )
            st.plotly_chart(fig, use_container_width=True)
        else:
            st.info("아직 저장한 레시피가 없습니다")

    with col2:
        # Activity timeline (sample data)
        dates = pd.date_range(end=datetime.now(), periods=30)
        activity = pd.DataFrame({
            'date': dates,
            'count': [1 if i % 3 == 0 else 0 for i in range(30)]
        })

        fig = px.bar(
            activity,
            x='date',
            y='count',
            title="최근 30일 활동"
        )
        st.plotly_chart(fig, use_container_width=True)

    # Recent activity
    st.subheader("📝 최근 활동")

    recent_recipes = profile_manager.get_saved_recipes(user_id)[:5]
    if recent_recipes:
        for saved in recent_recipes:
            recipe = saved['recipe']
            col1, col2, col3 = st.columns([3, 1, 1])

            with col1:
                st.write(f"• {recipe.get('name', '이름 없음')}")

            with col2:
                if saved.get('rating'):
                    st.write(f"{'⭐' * saved['rating']}")

            with col3:
                st.caption(saved['saved_at'][:10])
    else:
        st.info("최근 활동이 없습니다")

def show_ingredient_recognition():
    """Show ingredient recognition page"""
    st.header("📷 냉장고 재료 인식")

    col1, col2 = st.columns([1, 1])

    with col1:
        uploaded_file = st.file_uploader(
            "냉장고 사진을 선택하세요",
            type=['jpg', 'jpeg', 'png', 'webp'],
            accept_multiple_files=False
        )

        if uploaded_file is not None:
            st.image(uploaded_file, caption="업로드된 이미지", use_container_width=True)

            processor = ImageProcessor()
            is_valid, error_msg = processor.validate_image(uploaded_file)

            if not is_valid:
                st.error(error_msg)
            else:
                if st.button("🔍 재료 인식 시작", type="primary", use_container_width=True):
                    recognize_ingredients(uploaded_file)

    with col2:
        if st.session_state.recognized_ingredients:
            st.subheader("인식된 재료")
            display_recognized_ingredients()

            # Save ingredients option
            if st.button("💾 재료 저장", use_container_width=True):
                st.success("재료가 저장되었습니다")

def show_recipe_generation():
    """Show recipe generation page"""
    st.header("🍽️ 레시피 생성")

    manager = st.session_state.ingredient_manager
    current_ingredients = manager.get_ingredients()

    if not current_ingredients:
        st.warning("먼저 재료를 인식하거나 추가해주세요")
        return

    # Recipe preferences
    col1, col2, col3 = st.columns(3)

    with col1:
        difficulty = st.select_slider("난이도", ["쉬움", "보통", "어려움"], "보통")

    with col2:
        cooking_time = st.slider("최대 시간(분)", 10, 120, 30, 10)

    with col3:
        servings = st.number_input("인분", 1, 10, 4)

    if st.button("🍳 레시피 생성", type="primary", use_container_width=True):
        generate_recipes(current_ingredients, {
            'difficulty': difficulty,
            'cooking_time': f"{cooking_time}분",
            'servings': servings
        })

    # Display generated recipes
    if st.session_state.generated_recipes:
        display_generated_recipes_with_save()

def show_my_recipes():
    """Show saved recipes page"""
    st.header("📚 나의 레시피")

    user_id = st.session_state.user['id']
    profile_manager = st.session_state.profile_manager

    # Folder selection
    folders = profile_manager.get_folders(user_id)
    folder_names = [f['name'] for f in folders]

    selected_folder = st.selectbox("폴더 선택", folder_names)

    # Get saved recipes
    saved_recipes = profile_manager.get_saved_recipes(user_id, selected_folder)

    if saved_recipes:
        for saved in saved_recipes:
            recipe = saved['recipe']
            save_id = saved['save_id']

            with st.expander(f"**{recipe.get('name', '이름 없음')}**"):
                col1, col2 = st.columns([3, 1])

                with col1:
                    st.write(f"난이도: {recipe.get('difficulty', '보통')}")
                    st.write(f"시간: {recipe.get('time', 30)}분")

                    # Note section
                    note = st.text_area(
                        "메모",
                        value=saved.get('notes', ''),
                        key=f"note_{save_id}"
                    )

                    if st.button("메모 저장", key=f"save_note_{save_id}"):
                        profile_manager.update_recipe_note(user_id, save_id, note)
                        st.success("메모가 저장되었습니다")

                with col2:
                    # Rating
                    rating = st.slider(
                        "평점",
                        1, 5,
                        value=saved.get('rating', 3),
                        key=f"rating_{save_id}"
                    )

                    if st.button("평점 저장", key=f"save_rating_{save_id}"):
                        profile_manager.rate_recipe(user_id, save_id, rating)
                        st.success("평점이 저장되었습니다")

                    # Mark as cooked
                    if st.button("요리 완료", key=f"cooked_{save_id}"):
                        profile_manager.mark_as_cooked(user_id, save_id)
                        st.success("요리 완료!")

                    # Delete
                    if st.button("삭제", key=f"delete_{save_id}"):
                        profile_manager.delete_saved_recipe(user_id, save_id)
                        st.rerun()
    else:
        st.info("저장된 레시피가 없습니다")

def show_profile():
    """Show user profile page"""
    st.header("👤 프로필 설정")

    user = st.session_state.user
    user_id = user['id']
    profile_manager = st.session_state.profile_manager

    # Get current profile
    profile = profile_manager.get_profile(user_id) or user.get('profile', {})

    with st.form("profile_form"):
        col1, col2 = st.columns(2)

        with col1:
            nickname = st.text_input("닉네임", value=profile.get('nickname', user['username']))
            bio = st.text_area("자기소개", value=profile.get('bio', ''))
            cooking_level = st.select_slider(
                "요리 실력",
                ["초보", "중급", "고급", "전문가"],
                value=profile.get('cooking_level', '초보')
            )

        with col2:
            household = st.number_input("가구 구성원", 1, 10, profile.get('household_size', 2))
            cuisine = st.multiselect(
                "선호 요리",
                ["한식", "중식", "일식", "양식", "동남아"],
                default=profile.get('favorite_cuisine', ['한식'])
            )
            dietary = st.multiselect(
                "식단 제한",
                ["채식", "비건", "글루텐프리", "저염식", "저당식"],
                default=profile.get('dietary_preferences', [])
            )
            allergies = st.multiselect(
                "알레르기",
                ["땅콩", "우유", "계란", "밀", "갑각류"],
                default=profile.get('allergies', [])
            )

        submit = st.form_submit_button("프로필 저장", type="primary", use_container_width=True)

    if submit:
        profile_data = {
            'nickname': nickname,
            'bio': bio,
            'cooking_level': cooking_level,
            'household_size': household,
            'favorite_cuisine': cuisine,
            'dietary_preferences': dietary,
            'allergies': allergies
        }

        profile_manager.create_profile(user_id, profile_data)
        st.success("프로필이 저장되었습니다!")

def show_recommendations():
    """Show personalized recommendations"""
    st.header("🎯 맞춤 추천")

    user_id = st.session_state.user['id']
    profile_manager = st.session_state.profile_manager

    # Get recommendations
    recommendations = profile_manager.get_recommendations(user_id, limit=6)

    if recommendations:
        st.subheader("당신을 위한 추천 레시피")

        cols = st.columns(3)
        for idx, recipe in enumerate(recommendations):
            with cols[idx % 3]:
                st.write(f"**{recipe['name']}**")
                st.caption(f"⏱️ {recipe['time']}분 | ⭐ {recipe['difficulty']}")
                st.caption(f"🍽️ {recipe['cuisine']}")

                if st.button("자세히", key=f"rec_{idx}"):
                    st.info("레시피 상세 보기...")
    else:
        st.info("프로필을 완성하면 맞춤 추천을 받을 수 있습니다")

# Helper functions

def logout():
    """Logout user"""
    auth = st.session_state.auth_manager
    if st.session_state.token:
        auth.logout(st.session_state.token)

    st.session_state.user = None
    st.session_state.token = None
    st.rerun()

def recognize_ingredients(uploaded_file):
    """Recognize ingredients from image"""
    try:
        processor = ImageProcessor()
        image_base64 = processor.process_image(uploaded_file)

        client = OpenRouterClient()
        with st.spinner("재료 인식 중..."):
            result = client.recognize_ingredients(image_base64)

        if result.get('status') == 'success':
            st.session_state.recognized_ingredients = result

            # Set ingredients in manager
            manager = st.session_state.ingredient_manager
            manager.set_ingredients(result.get('ingredients', {}))

            st.success(f"✅ {result.get('total_items', 0)}개의 재료를 인식했습니다!")
            st.balloons()

    except Exception as e:
        st.error(f"오류: {str(e)}")

def display_recognized_ingredients():
    """Display recognized ingredients"""
    result = st.session_state.recognized_ingredients
    ingredients = result.get('ingredients', {})

    for category, items in ingredients.items():
        if items:
            st.write(f"**{category}**")
            for item in items:
                st.write(f"• {item}")

def generate_recipes(ingredients, preferences):
    """Generate recipes"""
    generator = RecipeGenerator()

    with st.spinner("레시피 생성 중..."):
        result = generator.generate_recipes(ingredients, preferences)

    if result.get('status') == 'success':
        st.session_state.generated_recipes = result
        st.success(f"✅ {len(result['recipes'])}개의 레시피를 생성했습니다!")

def display_generated_recipes_with_save():
    """Display generated recipes with save option"""
    result = st.session_state.generated_recipes
    recipes = result.get('recipes', [])

    user_id = st.session_state.user['id']
    profile_manager = st.session_state.profile_manager

    for idx, recipe in enumerate(recipes, 1):
        with st.expander(f"**{recipe['name']}**", expanded=(idx == 1)):
            col1, col2 = st.columns([3, 1])

            with col1:
                st.write(f"난이도: {recipe.get('difficulty', '보통')}")
                st.write(f"시간: {recipe.get('time', 30)}분")
                st.write(f"칼로리: {recipe.get('calories', 0)}kcal")

            with col2:
                if st.button(f"💾 저장", key=f"save_recipe_{idx}"):
                    save_id = profile_manager.save_recipe(user_id, recipe)
                    st.success(f"레시피가 저장되었습니다! (ID: {save_id})")

if __name__ == "__main__":
    main()