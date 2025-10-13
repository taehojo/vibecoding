"""
FridgeChef - Step 2: Recipe Generation System
Enhanced Streamlit application with recipe generation
"""
import streamlit as st
import time
import json
import pandas as pd
from datetime import datetime
import uuid

# Import backend modules
from backend.config import Config
from backend.openrouter_client import OpenRouterClient
from backend.image_service import ImageProcessor
from backend.recipe_generator import RecipeGenerator
from backend.ingredient_manager import IngredientManager
from backend.database import RecipeDatabase

# Page configuration
st.set_page_config(
    page_title="FridgeChef - 레시피 생성 시스템",
    page_icon="🍳",
    layout="wide",
    initial_sidebar_state="expanded"
)

# Initialize session state
if 'recognized_ingredients' not in st.session_state:
    st.session_state.recognized_ingredients = None
if 'processing' not in st.session_state:
    st.session_state.processing = False
if 'generated_recipes' not in st.session_state:
    st.session_state.generated_recipes = None
if 'ingredient_manager' not in st.session_state:
    st.session_state.ingredient_manager = IngredientManager()
if 'session_id' not in st.session_state:
    st.session_state.session_id = str(uuid.uuid4())
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

    # Header
    st.title("🍳 FridgeChef - Step 2")
    st.subheader("AI 기반 레시피 생성 시스템")

    # Create tabs
    tab1, tab2, tab3, tab4 = st.tabs([
        "📷 재료 인식",
        "✏️ 재료 편집",
        "🍽️ 레시피 생성",
        "📚 레시피 목록"
    ])

    with tab1:
        ingredient_recognition_tab()

    with tab2:
        ingredient_editing_tab()

    with tab3:
        recipe_generation_tab()

    with tab4:
        recipe_list_tab()

    # Sidebar
    with st.sidebar:
        sidebar_content()

def ingredient_recognition_tab():
    """Tab for ingredient recognition from image"""
    st.header("냉장고 사진에서 재료 인식")

    col1, col2 = st.columns([1, 1])

    with col1:
        # File uploader
        uploaded_file = st.file_uploader(
            "냉장고 사진을 선택하세요",
            type=['jpg', 'jpeg', 'png', 'webp'],
            accept_multiple_files=False,
            help="냉장고 내부가 잘 보이는 사진을 업로드해주세요"
        )

        if uploaded_file is not None:
            st.image(uploaded_file, caption="업로드된 이미지", use_container_width=True)

            processor = ImageProcessor()
            is_valid, error_msg = processor.validate_image(uploaded_file)

            if not is_valid:
                st.error(error_msg)
            else:
                st.success("✅ 이미지 업로드 완료")

                if st.button("🔍 재료 인식 시작", type="primary", use_container_width=True):
                    recognize_ingredients(uploaded_file)

    with col2:
        st.subheader("인식된 재료")

        if st.session_state.recognized_ingredients:
            display_recognized_ingredients(st.session_state.recognized_ingredients)
        else:
            st.info("이미지를 업로드하고 재료 인식을 시작하세요")

def ingredient_editing_tab():
    """Tab for editing ingredients"""
    st.header("재료 편집 및 관리")

    manager = st.session_state.ingredient_manager

    # Load ingredients if available
    if st.session_state.recognized_ingredients:
        ingredients = st.session_state.recognized_ingredients.get('ingredients', {})
        if ingredients and not manager.get_ingredients():
            manager.set_ingredients(ingredients)

    # Current ingredients display
    col1, col2 = st.columns([2, 1])

    with col1:
        st.subheader("현재 재료 목록")

        current_ingredients = manager.get_ingredients()

        if current_ingredients:
            for category, items in current_ingredients.items():
                with st.expander(f"**{category}** ({len(items)}개)", expanded=True):
                    for idx, item in enumerate(items):
                        col_item, col_btn = st.columns([4, 1])

                        with col_item:
                            # Editable text input
                            new_value = st.text_input(
                                f"재료 {idx+1}",
                                value=item,
                                key=f"edit_{category}_{idx}",
                                label_visibility="collapsed"
                            )

                            if new_value != item:
                                manager.update_ingredient(category, item, new_value)
                                st.rerun()

                        with col_btn:
                            if st.button("❌", key=f"del_{category}_{idx}"):
                                manager.remove_ingredient(category, item)
                                st.rerun()
        else:
            st.info("재료가 없습니다. 이미지를 업로드하거나 수동으로 추가하세요.")

    with col2:
        st.subheader("재료 추가")

        # Category selection
        category = st.selectbox(
            "카테고리",
            ["vegetables", "meat", "seafood", "dairy", "condiments", "grains", "fruits", "기타"]
        )

        # Ingredient input with autocomplete
        ingredient_name = st.text_input("재료명", key="new_ingredient")

        # Show suggestions
        if ingredient_name:
            suggestions = manager.get_suggestions(ingredient_name, category)
            if suggestions:
                st.caption("추천:")
                for sugg in suggestions[:5]:
                    if st.button(sugg, key=f"sugg_{sugg}"):
                        ingredient_name = sugg

        quantity = st.text_input("수량 (선택사항)", key="new_quantity")

        if st.button("➕ 재료 추가", type="primary", use_container_width=True):
            if ingredient_name:
                if manager.add_ingredient(category, ingredient_name, quantity):
                    st.success(f"'{ingredient_name}' 추가됨")
                    st.rerun()
                else:
                    st.warning("이미 존재하는 재료입니다")

        # Statistics
        st.divider()
        st.subheader("📊 통계")
        stats = manager.get_statistics()
        st.metric("총 재료 수", stats['total_ingredients'])
        st.metric("카테고리 수", stats['total_categories'])

        # Validation
        validation = manager.validate_ingredients()
        if not validation['valid']:
            for error in validation['errors']:
                st.error(error)
        for warning in validation['warnings']:
            st.warning(warning)

def recipe_generation_tab():
    """Tab for recipe generation"""
    st.header("레시피 생성")

    manager = st.session_state.ingredient_manager
    current_ingredients = manager.get_ingredients()

    if not current_ingredients:
        st.warning("먼저 재료를 인식하거나 추가해주세요")
        return

    # Display current ingredients summary
    with st.expander("사용 가능한 재료 보기", expanded=False):
        for category, items in current_ingredients.items():
            st.write(f"**{category}**: {', '.join(items)}")

    # Recipe preferences
    st.subheader("레시피 설정")

    col1, col2, col3 = st.columns(3)

    with col1:
        difficulty = st.select_slider(
            "난이도",
            options=["쉬움", "보통", "어려움"],
            value="보통"
        )

    with col2:
        cooking_time = st.slider(
            "최대 조리 시간(분)",
            min_value=10,
            max_value=120,
            value=30,
            step=10
        )

    with col3:
        servings = st.number_input(
            "인분",
            min_value=1,
            max_value=10,
            value=4
        )

    # Additional preferences
    col1, col2 = st.columns(2)

    with col1:
        cuisine = st.selectbox(
            "요리 종류",
            ["한식", "중식", "일식", "양식", "동남아", "퓨전"]
        )

    with col2:
        diet_restrictions = st.multiselect(
            "식단 제한",
            ["채식", "비건", "글루텐프리", "저염식", "저당식"]
        )

    # Generate button
    if st.button("🍳 레시피 생성", type="primary", use_container_width=True):
        generate_recipes(current_ingredients, {
            'difficulty': difficulty,
            'cooking_time': f"{cooking_time}분 이내",
            'servings': servings,
            'cuisine': cuisine,
            'diet_restrictions': diet_restrictions
        })

    # Display generated recipes
    if st.session_state.generated_recipes:
        display_generated_recipes(st.session_state.generated_recipes)

def recipe_list_tab():
    """Tab for viewing saved recipes"""
    st.header("저장된 레시피")

    db = st.session_state.db

    # Filters
    col1, col2, col3, col4 = st.columns(4)

    with col1:
        filter_cuisine = st.selectbox(
            "요리 종류",
            ["전체", "한식", "중식", "일식", "양식"]
        )

    with col2:
        filter_difficulty = st.selectbox(
            "난이도",
            ["전체", "쉬움", "보통", "어려움"]
        )

    with col3:
        filter_time = st.slider(
            "최대 시간(분)",
            10, 120, 60
        )

    with col4:
        sort_by = st.selectbox(
            "정렬",
            ["최신순", "매칭점수순", "시간순"]
        )

    # Apply filters
    filters = {}
    if filter_cuisine != "전체":
        filters['cuisine'] = filter_cuisine
    if filter_difficulty != "전체":
        filters['difficulty'] = filter_difficulty
    filters['max_time'] = filter_time

    # Get recipes
    recipes = db.get_recipes(filters)

    if recipes:
        # Display recipes in grid
        cols = st.columns(3)
        for idx, recipe in enumerate(recipes):
            with cols[idx % 3]:
                display_recipe_card(recipe)
    else:
        st.info("저장된 레시피가 없습니다")

def sidebar_content():
    """Sidebar content"""
    st.header("ℹ️ FridgeChef Step 2")

    st.info(
        "**새로운 기능:**\n"
        "• DeepSeek 모델로 레시피 생성\n"
        "• 재료 편집 및 관리\n"
        "• 레시피 필터링 및 검색\n"
        "• 데이터베이스 저장"
    )

    # API Test
    if st.button("🔌 API 연결 테스트"):
        with st.spinner("연결 확인 중..."):
            client = OpenRouterClient()
            if client.test_connection():
                st.success("✅ API 연결 성공!")
            else:
                st.error("❌ API 연결 실패")

    # Database stats
    st.divider()
    st.subheader("📊 데이터베이스")

    db = st.session_state.db
    recipes = db.get_recipes()
    st.metric("저장된 레시피", len(recipes))

    recent_sessions = db.get_recent_sessions(3)
    if recent_sessions:
        st.subheader("최근 활동")
        for session in recent_sessions:
            st.caption(f"• {session['created_at'][:16]}")

def recognize_ingredients(uploaded_file):
    """Recognize ingredients from uploaded image"""
    st.session_state.processing = True

    try:
        processor = ImageProcessor()
        image_base64 = processor.process_image(uploaded_file)

        if not image_base64:
            st.error("이미지 처리 중 오류가 발생했습니다")
            return

        client = OpenRouterClient()

        with st.spinner("재료 인식 중... (최대 30초 소요)"):
            result = client.recognize_ingredients(image_base64)

        if result.get('status') == 'success':
            st.session_state.recognized_ingredients = result
            st.success(f"✅ {result.get('total_items', 0)}개의 재료를 인식했습니다!")
            st.balloons()
        else:
            st.error(f"재료 인식 실패: {result.get('error', 'Unknown error')}")

    except Exception as e:
        st.error(f"오류 발생: {str(e)}")

    finally:
        st.session_state.processing = False
        st.rerun()

def generate_recipes(ingredients, preferences):
    """Generate recipes based on ingredients"""
    generator = RecipeGenerator()

    with st.spinner("레시피 생성 중... (최대 30초 소요)"):
        result = generator.generate_recipes(ingredients, preferences)

    if result.get('status') == 'success':
        st.session_state.generated_recipes = result
        st.success(f"✅ {len(result['recipes'])}개의 레시피를 생성했습니다!")

        # Save to database
        db = st.session_state.db
        for recipe in result['recipes']:
            db.save_recipe(recipe)

        # Save session
        db.save_session({
            'session_id': st.session_state.session_id,
            'ingredients': ingredients,
            'recipes': result['recipes']
        })

        st.balloons()
    else:
        st.error(f"레시피 생성 실패: {result.get('error', 'Unknown error')}")

def display_recognized_ingredients(result):
    """Display recognized ingredients"""
    ingredients = result.get('ingredients', {})

    if not ingredients:
        st.warning("인식된 재료가 없습니다")
        return

    for category, items in ingredients.items():
        if items:
            st.subheader(f"**{category}**")
            cols = st.columns(2)
            for idx, item in enumerate(items):
                with cols[idx % 2]:
                    st.write(f"• {item}")

def display_generated_recipes(result):
    """Display generated recipes"""
    st.divider()
    st.subheader("생성된 레시피")

    recipes = result.get('recipes', [])

    for idx, recipe in enumerate(recipes, 1):
        with st.expander(f"**{idx}. {recipe['name']}**", expanded=(idx == 1)):
            col1, col2 = st.columns([2, 1])

            with col1:
                # Recipe details
                st.write(f"**난이도:** {recipe.get('difficulty', '보통')}")
                st.write(f"**조리시간:** {recipe.get('time', 30)}분")
                st.write(f"**인분:** {recipe.get('servings', 4)}인분")
                st.write(f"**칼로리:** {recipe.get('calories', 0)}kcal")

                # Ingredients
                st.write("\n**재료:**")
                for ing in recipe.get('ingredients', []):
                    st.write(f"• {ing['name']}: {ing.get('amount', '')}")

                # Steps
                st.write("\n**조리법:**")
                for i, step in enumerate(recipe.get('steps', []), 1):
                    st.write(f"{i}. {step}")

                # Tips
                if recipe.get('tips'):
                    st.write(f"\n**💡 팁:** {recipe['tips']}")

            with col2:
                # Match score
                st.metric("매칭 점수", f"{recipe.get('match_score', 0)}%")

                # Save button
                if st.button(f"💾 저장", key=f"save_{idx}"):
                    st.success("레시피가 저장되었습니다!")

                # Export
                recipe_json = json.dumps(recipe, ensure_ascii=False, indent=2)
                st.download_button(
                    "📄 JSON 내보내기",
                    data=recipe_json,
                    file_name=f"recipe_{recipe['name']}.json",
                    mime="application/json",
                    key=f"export_{idx}"
                )

def display_recipe_card(recipe):
    """Display a recipe card"""
    with st.container():
        st.subheader(recipe['name'])
        st.caption(f"⏱️ {recipe.get('cooking_time', 30)}분 | ⭐ {recipe.get('difficulty', '보통')}")
        st.caption(f"🔥 {recipe.get('calories', 0)}kcal | 👥 {recipe.get('servings', 4)}인분")

        if st.button("자세히 보기", key=f"view_{recipe['id']}"):
            st.write("레시피 상세 보기...")

if __name__ == "__main__":
    main()