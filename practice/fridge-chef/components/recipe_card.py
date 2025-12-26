"""Reusable recipe card component."""
import streamlit as st


def render_recipe_card(
    recipe_data: dict,
    saved_recipe: dict | None = None,
    show_actions: bool = True,
    on_save: callable = None,
    on_cook: callable = None,
    on_share: callable = None,
    on_delete: callable = None,
    on_rate: callable = None,
    key_prefix: str = "",
) -> None:
    """Render a recipe card with optional actions.

    Args:
        recipe_data: Recipe data dict.
        saved_recipe: Optional saved recipe metadata.
        show_actions: Whether to show action buttons.
        on_save: Callback for save action.
        on_cook: Callback for cook action.
        on_share: Callback for share action.
        on_delete: Callback for delete action.
        on_rate: Callback for rate action.
        key_prefix: Unique key prefix for widgets.
    """
    with st.container():
        # Header with name and rating
        col1, col2 = st.columns([3, 1])
        with col1:
            st.markdown(f"### 🍽️ {recipe_data.get('name', '레시피')}")
        with col2:
            if saved_recipe and saved_recipe.get("rating"):
                rating = saved_recipe["rating"]
                st.markdown(f"{'⭐' * rating}")

        # Description
        if recipe_data.get("description"):
            st.caption(recipe_data["description"])

        # Metadata row
        col1, col2, col3 = st.columns(3)
        with col1:
            st.markdown(f"⏱️ **{recipe_data.get('cooking_time', 30)}분**")
        with col2:
            difficulty = recipe_data.get("difficulty", "보통")
            emoji = {"쉬움": "🟢", "보통": "🟡", "어려움": "🔴"}.get(difficulty, "🟡")
            st.markdown(f"{emoji} **{difficulty}**")
        with col3:
            st.markdown(f"👥 **{recipe_data.get('servings', 2)}인분**")

        st.divider()

        # Ingredients
        ingredients = recipe_data.get("ingredients", {})
        col_left, col_right = st.columns(2)

        with col_left:
            st.markdown("**✅ 보유 재료**")
            available = ingredients.get("available", [])
            if available:
                st.write(", ".join(available))
            else:
                st.caption("없음")

        with col_right:
            st.markdown("**🛒 필요 재료**")
            additional = ingredients.get("additional_needed", [])
            if additional:
                st.write(", ".join(additional))
            else:
                st.caption("추가 재료 없음")

        # Instructions
        with st.expander("📋 조리 순서 보기", expanded=False):
            for step in recipe_data.get("instructions", []):
                st.markdown(f"{step}")

        # Tips
        tips = recipe_data.get("tips", [])
        if tips:
            st.markdown("**💡 팁**")
            for tip in tips:
                st.info(tip)

        # Tags
        if saved_recipe and saved_recipe.get("tags"):
            tags_str = " ".join([f"`#{tag}`" for tag in saved_recipe["tags"]])
            st.markdown(f"🏷️ {tags_str}")

        # Notes
        if saved_recipe and saved_recipe.get("notes"):
            st.markdown(f"📝 **메모**: {saved_recipe['notes']}")

        # Actions
        if show_actions:
            cols = st.columns(4)

            with cols[0]:
                if on_save:
                    if st.button("💾 저장", key=f"{key_prefix}_save", use_container_width=True):
                        on_save(recipe_data)

            with cols[1]:
                if on_cook:
                    if st.button("🍳 요리완료", key=f"{key_prefix}_cook", use_container_width=True):
                        on_cook(saved_recipe if saved_recipe else recipe_data)

            with cols[2]:
                if on_share:
                    if st.button("📤 공유", key=f"{key_prefix}_share", use_container_width=True):
                        on_share(saved_recipe if saved_recipe else recipe_data)

            with cols[3]:
                if on_delete:
                    if st.button("🗑️ 삭제", key=f"{key_prefix}_delete", use_container_width=True):
                        on_delete(saved_recipe)

        st.markdown("---")
