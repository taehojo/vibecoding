"""
Optimized image processing service with memory protection and streaming
"""
import base64
import io
import os
import hashlib
import tempfile
from PIL import Image
from typing import Optional, Tuple, BinaryIO
import threading
import time
from concurrent.futures import ThreadPoolExecutor
import logging

logger = logging.getLogger(__name__)

class OptimizedImageProcessor:
    """Optimized image processor with memory protection and efficient processing"""

    # Memory limits
    MAX_IMAGE_SIZE = 10 * 1024 * 1024  # 10MB
    MAX_IMAGE_DIMENSION = 4096  # Max width/height
    CHUNK_SIZE = 8192  # 8KB chunks for streaming

    # Supported formats
    ALLOWED_EXTENSIONS = {'jpg', 'jpeg', 'png', 'webp'}

    # Image processing pool
    _executor = ThreadPoolExecutor(max_workers=4)

    # File operation lock for thread safety
    _file_lock = threading.Lock()

    @classmethod
    def validate_image_stream(cls, file_stream: BinaryIO) -> Tuple[bool, str, int]:
        """
        Validate image file before loading into memory

        Args:
            file_stream: File stream object

        Returns:
            Tuple of (is_valid, error_message, file_size)
        """
        try:
            # Get file size without loading into memory
            file_stream.seek(0, 2)  # Seek to end
            file_size = file_stream.tell()
            file_stream.seek(0)  # Reset to beginning

            # Check file size BEFORE loading
            if file_size > cls.MAX_IMAGE_SIZE:
                return False, f"File too large: {file_size / (1024*1024):.1f}MB (max {cls.MAX_IMAGE_SIZE / (1024*1024)}MB)", file_size

            if file_size == 0:
                return False, "File is empty", file_size

            # Read just the header to validate format (first 32 bytes)
            header = file_stream.read(32)
            file_stream.seek(0)  # Reset

            # Check file signatures
            if not cls._validate_image_header(header):
                return False, "Invalid image format", file_size

            return True, "", file_size

        except Exception as e:
            return False, f"Validation error: {str(e)}", 0

    @staticmethod
    def _validate_image_header(header: bytes) -> bool:
        """Validate image file header for supported formats"""
        if len(header) < 8:
            return False

        # Check common image signatures
        signatures = {
            b'\xFF\xD8\xFF': 'jpeg',  # JPEG
            b'\x89\x50\x4E\x47': 'png',  # PNG
            b'RIFF': 'webp',  # WebP (partial check)
        }

        for sig, _ in signatures.items():
            if header.startswith(sig):
                return True

        # Check WebP more thoroughly
        if header[:4] == b'RIFF' and header[8:12] == b'WEBP':
            return True

        return False

    @classmethod
    def process_image_safe(cls, file_stream: BinaryIO,
                           filename: Optional[str] = None) -> Tuple[Optional[str], str]:
        """
        Safely process image with memory limits

        Args:
            file_stream: File stream object
            filename: Optional filename for extension check

        Returns:
            Tuple of (base64_string or None, error_message)
        """
        # First validate without loading
        is_valid, error_msg, file_size = cls.validate_image_stream(file_stream)

        if not is_valid:
            return None, error_msg

        # Check filename extension if provided
        if filename:
            ext = filename.lower().split('.')[-1] if '.' in filename else ''
            if ext not in cls.ALLOWED_EXTENSIONS:
                return None, f"Unsupported file extension: {ext}"

        try:
            # Process in chunks to avoid memory issues
            with tempfile.NamedTemporaryFile(delete=False) as tmp_file:
                tmp_path = tmp_file.name

                # Stream copy with size limit enforcement
                total_written = 0
                while True:
                    chunk = file_stream.read(cls.CHUNK_SIZE)
                    if not chunk:
                        break

                    total_written += len(chunk)
                    if total_written > cls.MAX_IMAGE_SIZE:
                        os.unlink(tmp_path)
                        return None, "File size exceeded during streaming"

                    tmp_file.write(chunk)

            # Process the temporary file
            try:
                with Image.open(tmp_path) as image:
                    # Validate dimensions
                    if image.width > cls.MAX_IMAGE_DIMENSION or image.height > cls.MAX_IMAGE_DIMENSION:
                        return None, f"Image dimensions too large: {image.width}x{image.height}"

                    # Convert and optimize
                    processed_image = cls._optimize_image(image)

                    # Convert to base64
                    buffered = io.BytesIO()
                    processed_image.save(buffered, format="JPEG",
                                       quality=85, optimize=True)

                    # Check output size
                    output_size = buffered.tell()
                    if output_size > cls.MAX_IMAGE_SIZE:
                        return None, "Processed image still too large"

                    img_base64 = base64.b64encode(buffered.getvalue()).decode('utf-8')

                    return img_base64, ""

            finally:
                # Clean up temp file
                try:
                    os.unlink(tmp_path)
                except:
                    pass

        except Exception as e:
            logger.error(f"Image processing error: {e}")
            return None, f"Processing error: {str(e)}"

    @staticmethod
    def _optimize_image(image: Image.Image) -> Image.Image:
        """
        Optimize image for processing

        Args:
            image: PIL Image object

        Returns:
            Optimized PIL Image
        """
        # Convert RGBA to RGB if necessary
        if image.mode in ('RGBA', 'LA', 'P'):
            rgb_image = Image.new('RGB', image.size, (255, 255, 255))

            if image.mode == 'RGBA':
                rgb_image.paste(image, mask=image.split()[-1])
            else:
                rgb_image.paste(image)

            image = rgb_image

        # Smart resizing to maintain quality while reducing size
        max_dim = 2048  # Reduced from 4096 for better performance

        if image.width > max_dim or image.height > max_dim:
            # Calculate new dimensions maintaining aspect ratio
            ratio = min(max_dim / image.width, max_dim / image.height)
            new_size = (int(image.width * ratio), int(image.height * ratio))

            # Use high-quality resampling
            image = image.resize(new_size, Image.Resampling.LANCZOS)

        return image

    @classmethod
    def process_image_async(cls, file_stream: BinaryIO,
                           callback=None) -> threading.Thread:
        """
        Process image asynchronously

        Args:
            file_stream: File stream object
            callback: Optional callback function(result, error)

        Returns:
            Thread object for monitoring
        """
        def _process():
            result, error = cls.process_image_safe(file_stream)
            if callback:
                callback(result, error)

        thread = threading.Thread(target=_process)
        thread.daemon = True
        thread.start()
        return thread

    @classmethod
    def batch_process_images(cls, file_streams: list) -> list:
        """
        Process multiple images efficiently in parallel

        Args:
            file_streams: List of file stream objects

        Returns:
            List of (base64_string or None, error_message) tuples
        """
        futures = []

        for stream in file_streams:
            future = cls._executor.submit(cls.process_image_safe, stream)
            futures.append(future)

        results = []
        for future in futures:
            try:
                result = future.result(timeout=30)
                results.append(result)
            except Exception as e:
                results.append((None, f"Processing timeout: {str(e)}"))

        return results

    @classmethod
    def save_temp_image_safe(cls, file_stream: BinaryIO,
                            filename: Optional[str] = None) -> Tuple[Optional[str], str]:
        """
        Safely save uploaded image to temp folder with validation

        Args:
            file_stream: File stream object
            filename: Optional custom filename

        Returns:
            Tuple of (filepath or None, error_message)
        """
        # Validate first
        is_valid, error_msg, file_size = cls.validate_image_stream(file_stream)

        if not is_valid:
            return None, error_msg

        try:
            # Generate safe filename
            if not filename:
                # Generate unique filename using hash
                file_stream.seek(0)
                file_hash = hashlib.md5(file_stream.read(1024)).hexdigest()[:8]
                file_stream.seek(0)
                filename = f"img_{file_hash}_{int(time.time())}.jpg"

            # Ensure temp directory exists
            temp_dir = tempfile.gettempdir()
            os.makedirs(temp_dir, exist_ok=True)

            filepath = os.path.join(temp_dir, filename)

            # Thread-safe file writing
            with cls._file_lock:
                # Stream copy with validation
                with open(filepath, 'wb') as f:
                    total_written = 0

                    while True:
                        chunk = file_stream.read(cls.CHUNK_SIZE)
                        if not chunk:
                            break

                        total_written += len(chunk)
                        if total_written > cls.MAX_IMAGE_SIZE:
                            # Clean up partial file
                            f.close()
                            os.unlink(filepath)
                            return None, "File size exceeded during save"

                        f.write(chunk)

            return filepath, ""

        except Exception as e:
            logger.error(f"Error saving image: {e}")
            return None, f"Save error: {str(e)}"

    @staticmethod
    def cleanup_temp_files(max_age_hours: int = 1):
        """
        Clean up old temporary image files

        Args:
            max_age_hours: Maximum age of files in hours
        """
        try:
            temp_dir = tempfile.gettempdir()
            current_time = time.time()
            max_age_seconds = max_age_hours * 3600

            cleaned_count = 0
            cleaned_size = 0

            for filename in os.listdir(temp_dir):
                if not filename.startswith('img_'):
                    continue

                filepath = os.path.join(temp_dir, filename)

                try:
                    file_stats = os.stat(filepath)
                    file_age = current_time - file_stats.st_mtime

                    if file_age > max_age_seconds:
                        file_size = file_stats.st_size
                        os.unlink(filepath)
                        cleaned_count += 1
                        cleaned_size += file_size

                except Exception as e:
                    logger.debug(f"Could not clean {filename}: {e}")

            if cleaned_count > 0:
                logger.info(f"Cleaned {cleaned_count} files ({cleaned_size / 1024:.1f}KB)")

        except Exception as e:
            logger.error(f"Cleanup error: {e}")

    @classmethod
    def get_image_info(cls, file_stream: BinaryIO) -> Optional[dict]:
        """
        Get image information without fully loading it

        Args:
            file_stream: File stream object

        Returns:
            Dictionary with image info or None
        """
        try:
            # Save current position
            original_pos = file_stream.tell()

            # Get file size
            file_stream.seek(0, 2)
            file_size = file_stream.tell()
            file_stream.seek(0)

            # Read image headers only
            with Image.open(file_stream) as img:
                info = {
                    'format': img.format,
                    'mode': img.mode,
                    'width': img.width,
                    'height': img.height,
                    'file_size': file_size,
                    'file_size_mb': round(file_size / (1024 * 1024), 2)
                }

            # Restore original position
            file_stream.seek(original_pos)

            return info

        except Exception as e:
            logger.error(f"Error getting image info: {e}")
            return None

    @classmethod
    def create_thumbnail(cls, file_stream: BinaryIO,
                         max_size: Tuple[int, int] = (256, 256)) -> Optional[str]:
        """
        Create a thumbnail version of the image

        Args:
            file_stream: File stream object
            max_size: Maximum thumbnail dimensions

        Returns:
            Base64 encoded thumbnail or None
        """
        try:
            with Image.open(file_stream) as img:
                # Create thumbnail
                img.thumbnail(max_size, Image.Resampling.LANCZOS)

                # Convert to RGB if necessary
                if img.mode not in ('RGB', 'L'):
                    img = img.convert('RGB')

                # Save as base64
                buffered = io.BytesIO()
                img.save(buffered, format="JPEG", quality=75, optimize=True)

                thumb_base64 = base64.b64encode(buffered.getvalue()).decode('utf-8')

                return thumb_base64

        except Exception as e:
            logger.error(f"Error creating thumbnail: {e}")
            return None