"""Image processing utilities for Fridge Chef."""
import io
from PIL import Image
from services.config import Config


class ImageProcessor:
    """Utility class for image processing operations."""

    MAX_SIZE_BYTES = Config.MAX_IMAGE_SIZE_MB * 1024 * 1024
    SUPPORTED_FORMATS = Config.SUPPORTED_FORMATS

    @classmethod
    def validate_image(cls, file_bytes: bytes, filename: str) -> tuple[bool, str]:
        """Validate uploaded image file.

        Args:
            file_bytes: Raw file bytes
            filename: Original filename

        Returns:
            Tuple of (is_valid, error_message)
        """
        # Check file size
        if len(file_bytes) > cls.MAX_SIZE_BYTES:
            return False, f"파일 크기가 {Config.MAX_IMAGE_SIZE_MB}MB를 초과합니다."

        # Check file extension
        ext = filename.lower().split(".")[-1] if "." in filename else ""
        if ext not in cls.SUPPORTED_FORMATS:
            return False, f"지원하지 않는 형식입니다. 지원 형식: {', '.join(cls.SUPPORTED_FORMATS)}"

        # Try to open as image
        try:
            img = Image.open(io.BytesIO(file_bytes))
            img.verify()
        except Exception:
            return False, "유효하지 않은 이미지 파일입니다."

        return True, ""

    @classmethod
    def get_content_type(cls, filename: str) -> str:
        """Get MIME content type from filename.

        Args:
            filename: Original filename

        Returns:
            MIME content type string
        """
        ext = filename.lower().split(".")[-1] if "." in filename else "jpeg"
        content_types = {
            "jpg": "image/jpeg",
            "jpeg": "image/jpeg",
            "png": "image/png",
            "webp": "image/webp",
        }
        return content_types.get(ext, "image/jpeg")

    @classmethod
    def compress_image(cls, file_bytes: bytes, max_dimension: int = 1024, quality: int = 85) -> bytes:
        """Compress image to reduce size while maintaining quality.

        Args:
            file_bytes: Raw image bytes
            max_dimension: Maximum width or height
            quality: JPEG compression quality (1-100)

        Returns:
            Compressed image bytes
        """
        img = Image.open(io.BytesIO(file_bytes))

        # Convert RGBA to RGB for JPEG
        if img.mode in ("RGBA", "P"):
            img = img.convert("RGB")

        # Resize if larger than max dimension
        if max(img.size) > max_dimension:
            ratio = max_dimension / max(img.size)
            new_size = (int(img.size[0] * ratio), int(img.size[1] * ratio))
            img = img.resize(new_size, Image.Resampling.LANCZOS)

        # Save to bytes
        output = io.BytesIO()
        img.save(output, format="JPEG", quality=quality, optimize=True)
        return output.getvalue()
