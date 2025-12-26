"""재료 인식 페이지 - Step 1: Image-based ingredient recognition"""
import streamlit as st
import sys
from pathlib import Path

# Add project root to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent))

from services.vision import VisionService
from services.config import Config
from utils.image import ImageProcessor

st.set_page_config(
    page_title="재료 인식 - Fridge Chef",
    page_icon="🍳",
    layout="wide",
)


def init_session_state():
    """Initialize session state variables."""
    if "recognized_ingredients" not in st.session_state:
        st.session_state.recognized_ingredients = []
    if "uploaded_image" not in st.session_state:
        st.session_state.uploaded_image = None


def render_image_upload():
    """Render image upload section."""
    st.markdown("### 📷 이미지 업로드")

    col1, col2 = st.columns(2)

    with col1:
        uploaded_file = st.file_uploader(
            "냉장고 사진을 업로드하세요",
            type=["jpg", "jpeg", "png", "webp"],
            help="최대 10MB, JPG/PNG/WebP 형식 지원",
        )

    with col2:
        camera_image = st.camera_input(
            "또는 카메라로 촬영하세요",
            help="카메라로 직접 촬영할 수 있습니다",
        )

    # Use camera image if available, otherwise use uploaded file
    image_source = camera_image if camera_image else uploaded_file
    return image_source


def render_image_preview(image_bytes: bytes):
    """Render image preview."""
    st.markdown("### 🖼️ 이미지 미리보기")
    st.image(image_bytes, use_container_width=True)


def render_ingredient_list():
    """Render recognized ingredients with edit capability."""
    st.markdown("### 📦 인식된 재료")

    if not st.session_state.recognized_ingredients:
        st.info("아직 인식된 재료가 없습니다. 이미지를 업로드해주세요.")
        return

    # Display ingredients as tags
    ingredients = st.session_state.recognized_ingredients.copy()

    # Create columns for ingredient chips
    cols = st.columns(4)
    for idx, ingredient in enumerate(ingredients):
        with cols[idx % 4]:
            st.markdown(f"🏷️ **{ingredient}**")

    st.divider()

    # Edit section
    st.markdown("#### ✏️ 재료 수정")

    col1, col2 = st.columns([3, 1])

    with col1:
        new_ingredient = st.text_input(
            "재료 추가",
            placeholder="추가할 재료명을 입력하세요",
            label_visibility="collapsed",
        )

    with col2:
        if st.button("➕ 추가", use_container_width=True):
            if new_ingredient and new_ingredient not in st.session_state.recognized_ingredients:
                st.session_state.recognized_ingredients.append(new_ingredient)
                st.rerun()

    # Multi-select for deletion
    to_remove = st.multiselect(
        "삭제할 재료 선택",
        options=st.session_state.recognized_ingredients,
        help="삭제하려면 재료를 선택하세요",
    )

    if to_remove and st.button("🗑️ 선택 항목 삭제", type="secondary"):
        for item in to_remove:
            if item in st.session_state.recognized_ingredients:
                st.session_state.recognized_ingredients.remove(item)
        st.rerun()


def process_image(image_bytes: bytes, filename: str):
    """Process uploaded image and recognize ingredients."""
    # Validate image
    is_valid, error_msg = ImageProcessor.validate_image(image_bytes, filename)
    if not is_valid:
        st.error(f"❌ {error_msg}")
        return

    # Compress if needed
    if len(image_bytes) > 1024 * 1024:  # > 1MB
        image_bytes = ImageProcessor.compress_image(image_bytes)

    content_type = ImageProcessor.get_content_type(filename)

    # Recognize ingredients
    with st.spinner("🔍 AI가 재료를 인식하고 있습니다..."):
        try:
            vision_service = VisionService()
            ingredients = vision_service.recognize_ingredients(image_bytes, content_type)

            if ingredients:
                st.session_state.recognized_ingredients = ingredients
                st.session_state.uploaded_image = image_bytes
                st.success(f"✅ {len(ingredients)}개의 재료를 인식했습니다!")
            else:
                st.warning("⚠️ 재료를 인식하지 못했습니다. 다른 이미지를 시도해보세요.")

        except ValueError as e:
            st.error(f"❌ 설정 오류: {e}")
        except Exception as e:
            st.error(f"❌ 인식 중 오류가 발생했습니다: {e}")
            st.info("💡 잠시 후 다시 시도해주세요.")


def main():
    """Main page function."""
    init_session_state()

    st.title("🍳 재료 인식")
    st.markdown("냉장고 사진에서 재료를 자동으로 인식합니다.")

    # Check API configuration
    if not Config.validate():
        st.error("❌ API 키가 설정되지 않았습니다. .env 파일을 확인해주세요.")
        st.stop()

    st.divider()

    # Layout
    col_left, col_right = st.columns([1, 1])

    with col_left:
        image_source = render_image_upload()

        if image_source:
            image_bytes = image_source.getvalue()
            filename = getattr(image_source, "name", "camera.jpg")

            render_image_preview(image_bytes)

            if st.button("🔍 재료 인식하기", type="primary", use_container_width=True):
                process_image(image_bytes, filename)

    with col_right:
        render_ingredient_list()

        if st.session_state.recognized_ingredients:
            st.divider()
            if st.button("🍽️ 레시피 추천받기 →", type="primary", use_container_width=True):
                st.switch_page("pages/2_📖_레시피_생성.py")


if __name__ == "__main__":
    main()
