"""
Create a sample refrigerator image for testing
"""
from PIL import Image, ImageDraw, ImageFont
import os

def create_sample_fridge_image():
    """Create a sample refrigerator image with text labels"""

    # Create a white background image
    width, height = 800, 600
    image = Image.new('RGB', (width, height), color='#f0f0f0')
    draw = ImageDraw.Draw(image)

    # Draw shelves
    shelf_color = '#d0d0d0'
    for y in [150, 300, 450]:
        draw.rectangle([(50, y), (750, y+10)], fill=shelf_color)

    # Draw items with labels (simulating food items)
    items = [
        # Top shelf
        {"pos": (100, 80), "size": (80, 60), "color": "#ff6b6b", "label": "Tomatoes"},
        {"pos": (200, 90), "size": (60, 50), "color": "#ffd93d", "label": "Cheese"},
        {"pos": (300, 70), "size": (100, 70), "color": "#6bcf7f", "label": "Lettuce"},
        {"pos": (420, 85), "size": (70, 55), "color": "#f4a261", "label": "Eggs"},
        {"pos": (520, 75), "size": (90, 65), "color": "#e76f51", "label": "Meat"},
        {"pos": (640, 80), "size": (80, 60), "color": "#2a9d8f", "label": "Milk"},

        # Middle shelf
        {"pos": (100, 220), "size": (70, 70), "color": "#e9c46a", "label": "Onions"},
        {"pos": (200, 230), "size": (60, 60), "color": "#f4a261", "label": "Carrots"},
        {"pos": (300, 215), "size": (80, 75), "color": "#90be6d", "label": "Broccoli"},
        {"pos": (420, 225), "size": (100, 65), "color": "#577590", "label": "Fish"},
        {"pos": (550, 220), "size": (70, 70), "color": "#43aa8b", "label": "Yogurt"},
        {"pos": (650, 230), "size": (60, 60), "color": "#f94144", "label": "Apples"},

        # Bottom shelf
        {"pos": (100, 370), "size": (90, 70), "color": "#f3722c", "label": "Oranges"},
        {"pos": (220, 380), "size": (80, 60), "color": "#90be6d", "label": "Cucumber"},
        {"pos": (340, 365), "size": (100, 75), "color": "#577590", "label": "Chicken"},
        {"pos": (470, 375), "size": (70, 65), "color": "#43aa8b", "label": "Butter"},
        {"pos": (570, 370), "size": (80, 70), "color": "#f94144", "label": "Kimchi"},
        {"pos": (670, 380), "size": (60, 60), "color": "#277da1", "label": "Juice"},
    ]

    # Draw each item
    for item in items:
        x, y = item["pos"]
        w, h = item["size"]

        # Draw container/package
        draw.rectangle([(x, y), (x+w, y+h)], fill=item["color"], outline='#333', width=2)

        # Add simple label
        text_bbox = draw.textbbox((0, 0), item["label"])
        text_width = text_bbox[2] - text_bbox[0]
        text_height = text_bbox[3] - text_bbox[1]

        # Center text on item
        text_x = x + (w - text_width) // 2
        text_y = y + (h - text_height) // 2

        # Draw text with white background for readability
        padding = 2
        draw.rectangle(
            [(text_x-padding, text_y-padding),
             (text_x+text_width+padding, text_y+text_height+padding)],
            fill='white'
        )
        draw.text((text_x, text_y), item["label"], fill='black')

    # Add title
    draw.text((300, 20), "Sample Refrigerator", fill='black')

    # Save image
    output_path = "tests/test_images/sample_fridge.jpg"
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    image.save(output_path, quality=95)

    print(f"Sample image created: {output_path}")
    print(f"   Size: {width}x{height}")
    print(f"   Items: {len(items)}")

    return output_path

if __name__ == "__main__":
    create_sample_fridge_image()