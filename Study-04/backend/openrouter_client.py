"""
OpenRouter API client for AI model interactions
"""
import requests
import json
import time
from typing import Dict, List, Optional
from backend.config import Config

class OpenRouterClient:
    """Client for OpenRouter API"""

    def __init__(self):
        self.api_key = Config.OPENROUTER_API_KEY
        self.base_url = Config.OPENROUTER_BASE_URL
        self.headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
            "HTTP-Referer": "http://localhost:8501",
            "X-Title": Config.APP_NAME
        }

    def chat_completion(self, messages: List[Dict], model: str = None, max_retries: int = 3) -> Optional[Dict]:
        """
        Send chat completion request to OpenRouter API

        Args:
            messages: List of message dictionaries
            model: Model to use (defaults to image recognition model)
            max_retries: Maximum number of retry attempts

        Returns:
            API response dictionary or None if failed
        """
        if model is None:
            model = Config.IMAGE_RECOGNITION_MODEL

        endpoint = f"{self.base_url}/chat/completions"

        data = {
            "model": model,
            "messages": messages,
            "temperature": 0.7,
            "max_tokens": 1000
        }

        for attempt in range(max_retries):
            try:
                response = requests.post(
                    endpoint,
                    headers=self.headers,
                    json=data,
                    timeout=Config.REQUEST_TIMEOUT
                )

                if response.status_code == 200:
                    return response.json()

                elif response.status_code == 429:  # Rate limit
                    wait_time = 2 ** attempt  # Exponential backoff
                    print(f"Rate limited. Waiting {wait_time} seconds...")
                    time.sleep(wait_time)
                    continue

                else:
                    print(f"API Error: {response.status_code} - {response.text}")
                    if attempt < max_retries - 1:
                        time.sleep(1)
                        continue

            except requests.exceptions.RequestException as e:
                print(f"Request failed (attempt {attempt + 1}/{max_retries}): {e}")
                if attempt < max_retries - 1:
                    time.sleep(1)
                    continue

        return None

    def recognize_ingredients(self, image_base64: str) -> Dict:
        """
        Recognize ingredients from an image using Llama-4 model

        Args:
            image_base64: Base64 encoded image

        Returns:
            Dictionary with recognized ingredients
        """
        prompt = """You are analyzing a refrigerator image. Please identify all visible food ingredients.

Instructions:
1. List each ingredient you can clearly see
2. Group similar items together
3. Include approximate quantities when visible
4. Categorize by type (vegetables, fruits, meat, dairy, condiments, etc.)

Output Format:
Category: [Category Name]
- [Ingredient]: [Quantity if visible]

Be specific and accurate. Only list items you're confident about."""

        messages = [
            {
                "role": "user",
                "content": [
                    {"type": "text", "text": prompt},
                    {
                        "type": "image_url",
                        "image_url": {
                            "url": f"data:image/jpeg;base64,{image_base64}"
                        }
                    }
                ]
            }
        ]

        response = self.chat_completion(messages, model=Config.IMAGE_RECOGNITION_MODEL)

        if response and 'choices' in response:
            content = response['choices'][0]['message']['content']
            return self._parse_ingredients(content)

        return {"error": "Failed to recognize ingredients", "ingredients": {}}

    def _parse_ingredients(self, text: str) -> Dict:
        """
        Parse the AI response into structured ingredient data

        Args:
            text: Raw text response from AI

        Returns:
            Structured dictionary of ingredients by category
        """
        ingredients = {}
        current_category = None

        lines = text.strip().split('\n')

        for line in lines:
            line = line.strip()

            # Check if it's a category line
            if line.startswith('Category:') or ':' in line and not line.startswith('-'):
                category = line.split(':')[1].strip() if ':' in line else line
                current_category = category
                ingredients[current_category] = []

            # Check if it's an ingredient line
            elif line.startswith('-') or line.startswith('•'):
                if current_category:
                    ingredient = line.lstrip('-•').strip()
                    ingredients[current_category].append(ingredient)

            # Handle ingredients without clear formatting
            elif line and current_category and not line.lower().startswith(('category', 'instructions')):
                ingredients[current_category].append(line)

        # Remove empty categories
        ingredients = {k: v for k, v in ingredients.items() if v}

        return {
            "status": "success",
            "ingredients": ingredients,
            "raw_text": text,
            "total_items": sum(len(items) for items in ingredients.values())
        }

    def test_connection(self) -> bool:
        """Test API connection"""
        try:
            response = requests.get(
                f"{self.base_url}/models",
                headers=self.headers,
                timeout=10
            )
            return response.status_code == 200
        except:
            return False