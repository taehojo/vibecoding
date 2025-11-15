"""
FridgeChef - Step 1: Image Recognition Core
Main Streamlit application for refrigerator ingredient recognition
"""
import streamlit as st
import time
import json
from datetime import datetime

# Import backend modules
from backend.config import Config
from backend.openrouter_client import OpenRouterClient
from backend.image_service import ImageProcessor

# Page configuration
st.set_page_config(
    page_title="FridgeChef - 냉장고 재료 인식",
    page_icon="🍳",
    layout="wide",
    initial_sidebar_state="expanded"
)

# Initialize session state
if 'recognized_ingredients' not in st.session_state:
    st.session_state.recognized_ingredients = None
if 'processing' not in st.session_state:
    st.session_state.processing = False
if 'history' not in st.session_state:
    st.session_state.history = []

def main():
    """Main application function"""

    # Validate configuration
    try:
        Config.validate()
    except ValueError as e:
        st.error(f"설정 오류: {e}")
        st.stop()

    # Header
    st.title("🍳 FridgeChef - Step 1")
    st.subheader("AI 기반 냉장고 재료 인식 시스템")

    # Sidebar
    with st.sidebar:
        st.header("ℹ️ 정보")
        st.info(
            "냉장고 사진을 업로드하면 AI가 자동으로 재료를 인식합니다.\n\n"
            "**지원 형식:** JPG, PNG, WEBP\n"
            "**최대 크기:** 10MB"
        )

        # Test connection button
        if st.button("🔌 API 연결 테스트"):
            with st.spinner("연결 확인 중..."):
                client = OpenRouterClient()
                if client.test_connection():
                    st.success("✅ API 연결 성공!")
                else:
                    st.error("❌ API 연결 실패")

        # History
        if st.session_state.history:
            st.divider()
            st.header("📜 최근 기록")
            for item in st.session_state.history[-3:]:
                st.caption(f"• {item['time']} - {item['items']}개 재료")

    # Main content area
    col1, col2 = st.columns([1, 1])

    with col1:
        st.header("📷 이미지 업로드")

        # File uploader
        uploaded_file = st.file_uploader(
            "냉장고 사진을 선택하세요",
            type=['jpg', 'jpeg', 'png', 'webp'],
            accept_multiple_files=False,
            help="냉장고 내부가 잘 보이는 사진을 업로드해주세요"
        )

        if uploaded_file is not None:
            # Display uploaded image
            st.image(uploaded_file, caption="업로드된 이미지", use_container_width=True)

            # Validate image
            processor = ImageProcessor()
            is_valid, error_msg = processor.validate_image(uploaded_file)

            if not is_valid:
                st.error(error_msg)
            else:
                st.success("✅ 이미지 업로드 완료")

                # Recognition button
                if st.button(
                    "🔍 재료 인식 시작",
                    type="primary",
                    use_container_width=True,
                    disabled=st.session_state.processing
                ):
                    recognize_ingredients(uploaded_file)

    with col2:
        st.header("📋 인식 결과")

        if st.session_state.processing:
            with st.spinner("AI가 재료를 인식하고 있습니다..."):
                # Show progress bar
                progress_bar = st.progress(0)
                for i in range(100):
                    time.sleep(0.05)
                    progress_bar.progress(i + 1)

        if st.session_state.recognized_ingredients:
            display_results(st.session_state.recognized_ingredients)
        else:
            st.info("이미지를 업로드하고 '재료 인식 시작' 버튼을 클릭하세요")

    # Footer
    st.divider()
    st.caption(f"FridgeChef v{Config.APP_VERSION} | Step 1: Image Recognition Core")

def recognize_ingredients(uploaded_file):
    """
    Recognize ingredients from uploaded image

    Args:
        uploaded_file: Streamlit UploadedFile object
    """
    st.session_state.processing = True

    try:
        # Process image
        processor = ImageProcessor()
        image_base64 = processor.process_image(uploaded_file)

        if not image_base64:
            st.error("이미지 처리 중 오류가 발생했습니다")
            return

        # Initialize API client
        client = OpenRouterClient()

        # Recognize ingredients
        with st.spinner("재료 인식 중... (최대 30초 소요)"):
            result = client.recognize_ingredients(image_base64)

        if result.get('status') == 'success':
            st.session_state.recognized_ingredients = result

            # Add to history
            history_item = {
                'time': datetime.now().strftime("%H:%M"),
                'items': result.get('total_items', 0)
            }
            st.session_state.history.append(history_item)

            st.success(f"✅ {result.get('total_items', 0)}개의 재료를 인식했습니다!")
            st.balloons()
        else:
            st.error(f"재료 인식 실패: {result.get('error', 'Unknown error')}")

    except Exception as e:
        st.error(f"오류 발생: {str(e)}")

    finally:
        st.session_state.processing = False
        st.rerun()

def display_results(result):
    """
    Display recognized ingredients

    Args:
        result: Recognition result dictionary
    """
    ingredients = result.get('ingredients', {})

    if not ingredients:
        st.warning("인식된 재료가 없습니다")
        return

    # Display by category
    for category, items in ingredients.items():
        if items:  # Only show non-empty categories
            st.subheader(f"**{category}**")

            # Display items in columns
            cols = st.columns(2)
            for idx, item in enumerate(items):
                with cols[idx % 2]:
                    st.write(f"• {item}")

    # Statistics
    st.divider()
    col1, col2, col3 = st.columns(3)

    with col1:
        st.metric("총 재료 수", f"{result.get('total_items', 0)}개")

    with col2:
        st.metric("카테고리 수", f"{len(ingredients)}개")

    with col3:
        st.metric("처리 상태", "완료")

    # Export options
    st.divider()
    st.subheader("💾 내보내기")

    col1, col2 = st.columns(2)

    with col1:
        # Export as JSON
        json_str = json.dumps(ingredients, ensure_ascii=False, indent=2)
        st.download_button(
            label="📄 JSON으로 저장",
            data=json_str,
            file_name=f"ingredients_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json",
            mime="application/json"
        )

    with col2:
        # Export as text
        text_str = format_ingredients_text(ingredients)
        st.download_button(
            label="📝 텍스트로 저장",
            data=text_str,
            file_name=f"ingredients_{datetime.now().strftime('%Y%m%d_%H%M%S')}.txt",
            mime="text/plain"
        )

    # Show raw response in expander
    with st.expander("🔍 상세 응답 보기"):
        st.text(result.get('raw_text', ''))

def format_ingredients_text(ingredients):
    """
    Format ingredients as plain text

    Args:
        ingredients: Dictionary of ingredients by category

    Returns:
        Formatted text string
    """
    text = "=== 인식된 재료 목록 ===\n\n"

    for category, items in ingredients.items():
        if items:
            text += f"[{category}]\n"
            for item in items:
                text += f"  - {item}\n"
            text += "\n"

    text += f"생성 시간: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n"

    return text

if __name__ == "__main__":
    main()