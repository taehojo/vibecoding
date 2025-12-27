"""Share modal component."""
import streamlit as st
from urllib.parse import quote

from services.sharing import SharingService


def render_share_modal(
    recipe_data: dict,
    saved_recipe_id: int | None = None,
    key_prefix: str = "",
) -> None:
    """Render share modal dialog.

    Args:
        recipe_data: Recipe data dict.
        saved_recipe_id: Optional saved recipe ID for persistent sharing.
        key_prefix: Unique key prefix.
    """
    with st.expander("📤 레시피 공유하기", expanded=True):
        # Generate share link if saved
        share_url = None
        if saved_recipe_id:
            share_id = SharingService.enable_sharing(saved_recipe_id)
            if share_id:
                share_url = SharingService.create_share_link(share_id)
                st.markdown("**🔗 공유 링크**")
                st.code(share_url)

        st.divider()

        # Formatted text for messaging
        st.markdown("**📝 텍스트로 복사 (카카오톡/문자용)**")
        formatted_text = SharingService.format_recipe_for_sharing(recipe_data)
        st.text_area(
            "레시피 텍스트",
            value=formatted_text,
            height=250,
            key=f"{key_prefix}_share_text",
            label_visibility="collapsed",
        )

        # QR Code
        if share_url:
            st.divider()
            st.markdown("**📱 QR 코드**")
            qr_buffer = SharingService.generate_qr_code(share_url)
            st.image(qr_buffer, width=200, caption="스마트폰으로 스캔하세요")

        st.divider()

        # Social share buttons (URL schemes)
        st.markdown("**📱 SNS 공유**")
        cols = st.columns(4)

        share_text = f"맛있는 레시피를 공유합니다: {recipe_data.get('name', '레시피')}"
        # URL encode the share text and URL for safe use in URLs
        encoded_text = quote(share_text, safe='')
        encoded_url = quote(share_url, safe='') if share_url else ''

        with cols[0]:
            # KakaoTalk (uses system share on mobile)
            st.markdown(f"[카카오톡](kakaotalk://msg/text?text={encoded_text})")

        with cols[1]:
            # Twitter/X
            if share_url:
                st.markdown(f"[트위터](https://twitter.com/intent/tweet?text={encoded_text}&url={encoded_url})")
            else:
                st.markdown(f"[트위터](https://twitter.com/intent/tweet?text={encoded_text})")

        with cols[2]:
            # Facebook
            if share_url:
                st.markdown(f"[페이스북](https://www.facebook.com/sharer/sharer.php?u={encoded_url})")
            else:
                st.caption("페이스북")

        with cols[3]:
            # Copy to clipboard button
            st.caption("📋 텍스트 복사는 위 텍스트 박스에서")

        st.divider()

        # Close button
        if st.button("❌ 닫기", key=f"{key_prefix}_close_share"):
            st.session_state.share_recipe_id = None
            st.rerun()
