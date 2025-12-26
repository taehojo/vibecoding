"""Chart utilities for dashboard visualization."""
import plotly.express as px
import plotly.graph_objects as go
from datetime import datetime
import calendar


def create_ingredient_bar_chart(
    ingredients: list[tuple[str, int]],
    title: str = "자주 사용한 재료 TOP 10",
) -> go.Figure:
    """Create horizontal bar chart for ingredient usage.

    Args:
        ingredients: List of (ingredient_name, count) tuples.
        title: Chart title.

    Returns:
        Plotly figure.
    """
    if not ingredients:
        fig = go.Figure()
        fig.add_annotation(
            text="아직 사용 기록이 없습니다",
            xref="paper", yref="paper",
            x=0.5, y=0.5, showarrow=False,
            font=dict(size=16)
        )
        fig.update_layout(
            title=title,
            height=300,
        )
        return fig

    names = [i[0] for i in ingredients]
    counts = [i[1] for i in ingredients]

    fig = go.Figure(go.Bar(
        x=counts,
        y=names,
        orientation="h",
        marker_color="#FF6B6B",
        text=counts,
        textposition="outside",
    ))

    fig.update_layout(
        title=title,
        xaxis_title="사용 횟수",
        yaxis_title="",
        yaxis=dict(autorange="reversed"),
        height=max(300, len(ingredients) * 40),
        margin=dict(l=100, r=50, t=50, b=50),
    )

    return fig


def create_cuisine_pie_chart(
    cuisine_data: dict[str, int],
    title: str = "요리 카테고리 분포",
) -> go.Figure:
    """Create pie chart for cuisine distribution.

    Args:
        cuisine_data: Dict mapping cuisine to count.
        title: Chart title.

    Returns:
        Plotly figure.
    """
    if not cuisine_data:
        fig = go.Figure()
        fig.add_annotation(
            text="아직 데이터가 없습니다",
            xref="paper", yref="paper",
            x=0.5, y=0.5, showarrow=False,
            font=dict(size=16)
        )
        fig.update_layout(
            title=title,
            height=300,
        )
        return fig

    labels = list(cuisine_data.keys())
    values = list(cuisine_data.values())

    colors = ["#FF6B6B", "#4ECDC4", "#45B7D1", "#96CEB4", "#FFEAA7", "#DDA0DD"]

    fig = go.Figure(go.Pie(
        labels=labels,
        values=values,
        hole=0.4,
        marker_colors=colors[:len(labels)],
        textinfo="label+percent",
        textposition="outside",
    ))

    fig.update_layout(
        title=title,
        height=350,
        showlegend=True,
        legend=dict(orientation="h", yanchor="bottom", y=-0.2),
    )

    return fig


def create_cooking_calendar(
    cooking_data: dict[str, int],
    year: int,
    month: int,
    title: str = "요리 캘린더",
) -> go.Figure:
    """Create calendar heatmap for cooking activity.

    Args:
        cooking_data: Dict mapping date strings to counts.
        year: Year.
        month: Month.
        title: Chart title.

    Returns:
        Plotly figure.
    """
    # Get calendar data
    cal = calendar.Calendar(firstweekday=6)  # Start with Sunday
    month_days = cal.monthdayscalendar(year, month)

    # Create heatmap data
    z_data = []
    text_data = []
    weekdays = ["일", "월", "화", "수", "목", "금", "토"]

    for week in month_days:
        week_values = []
        week_text = []
        for day in week:
            if day == 0:
                week_values.append(None)
                week_text.append("")
            else:
                date_str = f"{year}-{month:02d}-{day:02d}"
                count = cooking_data.get(date_str, 0)
                week_values.append(count)
                week_text.append(f"{day}일: {count}회" if count else str(day))
        z_data.append(week_values)
        text_data.append(week_text)

    fig = go.Figure(go.Heatmap(
        z=z_data,
        x=weekdays,
        y=[f"Week {i+1}" for i in range(len(z_data))],
        text=text_data,
        texttemplate="%{text}",
        colorscale=[
            [0, "#f0f0f0"],
            [0.5, "#90EE90"],
            [1, "#228B22"]
        ],
        showscale=False,
        hovertemplate="%{text}<extra></extra>",
    ))

    month_name = calendar.month_name[month]
    fig.update_layout(
        title=f"{title} - {year}년 {month}월",
        height=250,
        xaxis=dict(side="top"),
        yaxis=dict(autorange="reversed"),
    )

    return fig


def create_stats_metric(
    value: int | float,
    label: str,
    icon: str = "",
    delta: int | float | None = None,
) -> dict:
    """Create metric data for display.

    Args:
        value: Metric value.
        label: Metric label.
        icon: Optional emoji icon.
        delta: Optional delta value.

    Returns:
        Dict with metric data.
    """
    return {
        "value": value,
        "label": label,
        "icon": icon,
        "delta": delta,
    }
