"""Vision service for ingredient recognition using OpenRouter API."""
import base64
import re
import requests
from .config import Config


class VisionService:
    """Service for recognizing ingredients from images."""

    def __init__(self):
        self.api_key = Config.OPENROUTER_API_KEY
        self.base_url = Config.OPENROUTER_BASE_URL
        self.model = Config.VISION_MODEL
        self.timeout = Config.API_TIMEOUT

    def _get_headers(self) -> dict:
        """Get API request headers."""
        return {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
        }

    def _encode_image(self, image_bytes: bytes, content_type: str = "image/jpeg") -> str:
        """Encode image bytes to base64 data URL."""
        base64_image = base64.b64encode(image_bytes).decode("utf-8")
        return f"data:{content_type};base64,{base64_image}"

    def _build_prompt(self) -> str:
        """Build the ingredient recognition prompt."""
        return """당신은 냉장고 재료 인식 전문가입니다.
이 이미지에서 보이는 모든 식재료를 한국어로 나열해주세요.

형식:
- 재료명1
- 재료명2
- 재료명3

이미지에서 명확히 보이는 재료만 나열하세요.
조미료, 소스류도 포함해주세요."""

    def _parse_ingredients(self, response_text: str) -> list[str]:
        """Parse ingredient list from API response."""
        ingredients = []

        # Split by lines and look for bullet points or dashes
        lines = response_text.strip().split("\n")
        for line in lines:
            line = line.strip()
            # Remove bullet points, dashes, numbers
            cleaned = re.sub(r"^[-•*·]\s*", "", line)
            cleaned = re.sub(r"^\d+[.)]\s*", "", cleaned)
            cleaned = cleaned.strip()

            if cleaned and len(cleaned) > 0:
                # Skip lines that are clearly not ingredients
                skip_keywords = ["이미지", "보이는", "재료", "다음", "없", "확인"]
                if not any(kw in cleaned for kw in skip_keywords):
                    ingredients.append(cleaned)

        return ingredients

    def recognize_ingredients(self, image_bytes: bytes, content_type: str = "image/jpeg") -> list[str]:
        """Recognize ingredients from image bytes.

        Args:
            image_bytes: Raw image bytes
            content_type: MIME type of the image

        Returns:
            List of recognized ingredient names in Korean

        Raises:
            ValueError: If API key is not configured
            requests.RequestException: If API request fails
        """
        if not self.api_key:
            raise ValueError("OPENROUTER_API_KEY is not configured")

        data_url = self._encode_image(image_bytes, content_type)

        payload = {
            "model": self.model,
            "messages": [
                {
                    "role": "user",
                    "content": [
                        {"type": "text", "text": self._build_prompt()},
                        {"type": "image_url", "image_url": {"url": data_url}},
                    ],
                }
            ],
        }

        response = requests.post(
            self.base_url,
            headers=self._get_headers(),
            json=payload,
            timeout=self.timeout,
        )
        response.raise_for_status()

        result = response.json()
        content = result["choices"][0]["message"]["content"]

        return self._parse_ingredients(content)
