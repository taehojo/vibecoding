"""Statistics widget components."""
import streamlit as st


def render_stat_card(
    value: int | float | str,
    label: str,
    icon: str = "",
    delta: int | float | None = None,
    delta_color: str = "normal",
) -> None:
    """Render a statistics card.

    Args:
        value: Main value to display.
        label: Label text.
        icon: Emoji icon.
        delta: Optional delta value.
        delta_color: Delta color (normal, inverse, off).
    """
    st.metric(
        label=f"{icon} {label}",
        value=value,
        delta=delta,
        delta_color=delta_color,
    )


def render_stats_row(stats: dict) -> None:
    """Render a row of statistics cards.

    Args:
        stats: Dict with stat data.
    """
    col1, col2, col3, col4 = st.columns(4)

    with col1:
        render_stat_card(
            value=stats.get("saved_count", 0),
            label="저장한 레시피",
            icon="💾",
        )

    with col2:
        render_stat_card(
            value=stats.get("cooked_count", 0),
            label="요리한 횟수",
            icon="🍳",
        )

    with col3:
        render_stat_card(
            value=f"{stats.get('avg_rating', 0)}⭐",
            label="평균 평점",
            icon="📊",
        )

    with col4:
        render_stat_card(
            value=f"{stats.get('streak', 0)}일 🔥",
            label="연속 요리",
            icon="📅",
        )
