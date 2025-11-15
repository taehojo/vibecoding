"""
Image processing service for handling uploaded images
"""
import base64
import io
import os
from PIL import Image
from typing import Optional, Tuple
from backend.config import Config

class ImageProcessor:
    """Service for processing uploaded images"""

    @staticmethod
    def validate_image(file) -> Tuple[bool, str]:
        """
        Validate uploaded image file

        Args:
            file: Streamlit UploadedFile object

        Returns:
            Tuple of (is_valid, error_message)
        """
        if file is None:
            return False, "파일이 선택되지 않았습니다"

        # Check file extension
        filename = file.name.lower()
        extension = filename.split('.')[-1] if '.' in filename else ''

        if extension not in Config.ALLOWED_EXTENSIONS:
            return False, f"지원하지 않는 파일 형식입니다. ({', '.join(Config.ALLOWED_EXTENSIONS)}만 지원)"

        # Check file size
        file.seek(0, 2)  # Move to end of file
        file_size = file.tell()
        file.seek(0)  # Reset to beginning

        if file_size > Config.MAX_IMAGE_SIZE:
            return False, f"파일 크기가 너무 큽니다. (최대 {Config.MAX_IMAGE_SIZE // (1024*1024)}MB)"

        return True, ""

    @staticmethod
    def process_image(file) -> Optional[str]:
        """
        Process uploaded image and convert to base64

        Args:
            file: Streamlit UploadedFile object

        Returns:
            Base64 encoded string or None if processing failed
        """
        try:
            # Read image
            image = Image.open(file)

            # Convert RGBA to RGB if necessary
            if image.mode in ('RGBA', 'LA', 'P'):
                rgb_image = Image.new('RGB', image.size, (255, 255, 255))
                rgb_image.paste(image, mask=image.split()[-1] if image.mode == 'RGBA' else None)
                image = rgb_image

            # Resize if too large
            max_dim = Config.IMAGE_MAX_DIMENSION
            if image.width > max_dim or image.height > max_dim:
                image.thumbnail((max_dim, max_dim), Image.Resampling.LANCZOS)

            # Convert to base64
            buffered = io.BytesIO()
            image.save(buffered, format="JPEG", quality=85)
            img_base64 = base64.b64encode(buffered.getvalue()).decode('utf-8')

            return img_base64

        except Exception as e:
            print(f"Error processing image: {e}")
            return None

    @staticmethod
    def save_temp_image(file, filename: str = None) -> Optional[str]:
        """
        Save uploaded image to temp folder

        Args:
            file: Streamlit UploadedFile object
            filename: Optional custom filename

        Returns:
            Path to saved file or None if failed
        """
        try:
            if filename is None:
                filename = file.name

            filepath = os.path.join(Config.TEMP_FOLDER, filename)

            with open(filepath, "wb") as f:
                f.write(file.getbuffer())

            return filepath

        except Exception as e:
            print(f"Error saving image: {e}")
            return None

    @staticmethod
    def encode_image(image) -> Optional[str]:
        """
        Encode PIL Image to base64 string

        Args:
            image: PIL Image object

        Returns:
            Base64 encoded string or None if failed
        """
        try:
            buffered = io.BytesIO()
            image.save(buffered, format="JPEG", quality=85)
            img_base64 = base64.b64encode(buffered.getvalue()).decode('utf-8')
            return img_base64
        except Exception as e:
            print(f"Error encoding image: {e}")
            return None

    @staticmethod
    def cleanup_temp_folder():
        """Clean up temporary image files older than 1 hour"""
        import time

        try:
            current_time = time.time()
            temp_folder = Config.TEMP_FOLDER

            for filename in os.listdir(temp_folder):
                filepath = os.path.join(temp_folder, filename)

                # Check file age
                file_age = current_time - os.path.getmtime(filepath)

                # Delete files older than 1 hour
                if file_age > 3600:
                    os.remove(filepath)
                    print(f"Cleaned up old temp file: {filename}")

        except Exception as e:
            print(f"Error cleaning temp folder: {e}")

    @staticmethod
    def create_test_image() -> str:
        """
        Create a simple test image for testing purposes

        Returns:
            Base64 encoded test image
        """
        # Create a simple test image with some "ingredients"
        image = Image.new('RGB', (400, 300), color='white')

        # Save as base64
        buffered = io.BytesIO()
        image.save(buffered, format="JPEG")
        img_base64 = base64.b64encode(buffered.getvalue()).decode('utf-8')

        return img_base64