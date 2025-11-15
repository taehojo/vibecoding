import os
from dotenv import load_dotenv
import requests
import json

load_dotenv()

class OpenRouterClient:
    def __init__(self):
        self.api_key = os.getenv('OPENROUTER_API_KEY')
        if not self.api_key:
            raise ValueError("OPENROUTER_API_KEY not found in environment variables")

        self.base_url = "https://openrouter.ai/api/v1"
        self.headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
            "HTTP-Referer": "http://localhost:3000",
            "X-Title": "Study-04 Project"
        }

    def chat_completion(self, messages, model="openai/gpt-3.5-turbo"):
        endpoint = f"{self.base_url}/chat/completions"

        data = {
            "model": model,
            "messages": messages
        }

        try:
            response = requests.post(endpoint, headers=self.headers, json=data)
            response.raise_for_status()
            return response.json()
        except requests.exceptions.RequestException as e:
            print(f"Error making request: {e}")
            return None

    def list_models(self):
        endpoint = f"{self.base_url}/models"

        try:
            response = requests.get(endpoint, headers=self.headers)
            response.raise_for_status()
            return response.json()
        except requests.exceptions.RequestException as e:
            print(f"Error fetching models: {e}")
            return None

if __name__ == "__main__":
    client = OpenRouterClient()

    messages = [
        {"role": "user", "content": "Hello! Can you help me test the OpenRouter API?"}
    ]

    print("Testing OpenRouter API...")
    response = client.chat_completion(messages)

    if response:
        print("\nAPI Response:")
        print(json.dumps(response, indent=2))
    else:
        print("Failed to get response from API")