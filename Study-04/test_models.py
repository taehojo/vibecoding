import os
import sys
import base64
import requests
import json
from dotenv import load_dotenv
from io import BytesIO
from PIL import Image
import time

# UTF-8 인코딩 설정
if sys.platform == 'win32':
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8')

load_dotenv()

class OpenRouterTester:
    def __init__(self):
        self.api_key = os.getenv('OPENROUTER_API_KEY')
        if not self.api_key:
            raise ValueError("OPENROUTER_API_KEY not found in environment variables")

        self.base_url = "https://openrouter.ai/api/v1"
        self.headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
            "HTTP-Referer": "http://localhost:3000",
            "X-Title": "Study-04 Model Testing"
        }

    def test_text_recognition(self):
        """DeepSeek 모델로 텍스트 인식 테스트"""
        print("\n" + "="*50)
        print("텍스트 인식 테스트 - DeepSeek v3.1")
        print("="*50)

        messages = [
            {
                "role": "system",
                "content": "You are a helpful assistant."
            },
            {
                "role": "user",
                "content": "다음 텍스트를 분석해주세요: '인공지능은 우리의 미래를 바꿀 혁신적인 기술입니다. 특히 자연어 처리와 컴퓨터 비전 분야에서 놀라운 발전을 이루고 있습니다.' 이 텍스트의 주제와 핵심 내용을 요약해주세요."
            }
        ]

        data = {
            "model": "deepseek/deepseek-chat-v3.1:free",
            "messages": messages,
            "temperature": 0.7,
            "max_tokens": 500
        }

        try:
            print("DeepSeek 모델에 요청 전송 중...")
            response = requests.post(
                f"{self.base_url}/chat/completions",
                headers=self.headers,
                json=data
            )
            response.raise_for_status()
            result = response.json()

            print("\n✅ DeepSeek 텍스트 인식 성공!")
            print("-" * 40)
            if 'choices' in result and len(result['choices']) > 0:
                content = result['choices'][0]['message']['content']
                print("응답:", content)
            else:
                print("전체 응답:", json.dumps(result, indent=2, ensure_ascii=False))

            return True

        except Exception as e:
            print(f"\n❌ DeepSeek 텍스트 인식 실패: {e}")
            if hasattr(e, 'response') and e.response is not None:
                print("Error details:", e.response.text)
            return False

    def create_test_image(self):
        """테스트용 이미지 생성 및 base64 인코딩"""
        img = Image.new('RGB', (200, 100), color='white')
        from PIL import ImageDraw, ImageFont
        draw = ImageDraw.Draw(img)

        try:
            draw.text((10, 40), "Test Image", fill='black')
        except:
            draw.text((10, 40), "Test Image", fill='black')

        buffered = BytesIO()
        img.save(buffered, format="PNG")
        img_base64 = base64.b64encode(buffered.getvalue()).decode('utf-8')

        img.save("test_image.png")
        print("테스트 이미지 생성됨: test_image.png")

        return f"data:image/png;base64,{img_base64}"

    def test_image_recognition(self):
        """Llama-4-Maverick 모델로 이미지 인식 테스트"""
        print("\n" + "="*50)
        print("이미지 인식 테스트 - Llama-4-Maverick")
        print("="*50)

        image_data = self.create_test_image()

        messages = [
            {
                "role": "user",
                "content": [
                    {
                        "type": "text",
                        "text": "이 이미지에 무엇이 보이나요? 간단히 설명해주세요."
                    },
                    {
                        "type": "image_url",
                        "image_url": {
                            "url": image_data
                        }
                    }
                ]
            }
        ]

        data = {
            "model": "meta-llama/llama-4-maverick:free",
            "messages": messages,
            "temperature": 0.7,
            "max_tokens": 500
        }

        try:
            print("Llama-4-Maverick 모델에 요청 전송 중...")
            response = requests.post(
                f"{self.base_url}/chat/completions",
                headers=self.headers,
                json=data
            )
            response.raise_for_status()
            result = response.json()

            print("\n✅ Llama-4-Maverick 이미지 인식 성공!")
            print("-" * 40)
            if 'choices' in result and len(result['choices']) > 0:
                content = result['choices'][0]['message']['content']
                print("응답:", content)
            else:
                print("전체 응답:", json.dumps(result, indent=2, ensure_ascii=False))

            return True

        except Exception as e:
            print(f"\n❌ Llama-4-Maverick 이미지 인식 실패: {e}")
            if hasattr(e, 'response') and e.response is not None:
                print("Error details:", e.response.text)
            return False

    def check_model_availability(self):
        """모델 사용 가능 여부 확인"""
        print("\n모델 사용 가능 여부 확인 중...")

        try:
            response = requests.get(
                f"{self.base_url}/models",
                headers=self.headers
            )
            response.raise_for_status()
            models = response.json()

            model_dict = {model['id']: model for model in models.get('data', [])}

            deepseek_available = 'deepseek/deepseek-chat-v3.1:free' in model_dict
            llama_available = 'meta-llama/llama-4-maverick:free' in model_dict

            print(f"DeepSeek v3.1: {'✅ 사용 가능' if deepseek_available else '❌ 사용 불가'}")
            print(f"Llama-4-Maverick: {'✅ 사용 가능' if llama_available else '❌ 사용 불가'}")

            if not deepseek_available:
                print("\nDeepSeek 대체 모델 검색 중...")
                deepseek_models = [m for m in model_dict.keys() if 'deepseek' in m.lower()]
                if deepseek_models:
                    print(f"사용 가능한 DeepSeek 모델: {', '.join(deepseek_models[:3])}")

            if not llama_available:
                print("\nLlama 대체 모델 검색 중...")
                vision_models = [m for m in model_dict.keys() if 'vision' in m.lower() or 'llama' in m.lower()]
                if vision_models:
                    print(f"사용 가능한 비전 모델: {', '.join(vision_models[:3])}")

            return deepseek_available, llama_available

        except Exception as e:
            print(f"모델 확인 실패: {e}")
            return False, False

def main():
    print("OpenRouter API 테스트 시작")
    print("="*50)

    tester = OpenRouterTester()

    deepseek_available, llama_available = tester.check_model_availability()

    text_success = False
    image_success = False

    if deepseek_available:
        text_success = tester.test_text_recognition()
    else:
        print("\n⚠️ DeepSeek 모델을 사용할 수 없어 텍스트 인식 테스트를 건너뜁니다.")

    time.sleep(1)

    if llama_available:
        image_success = tester.test_image_recognition()
    else:
        print("\n⚠️ Llama-4-Maverick 모델을 사용할 수 없어 이미지 인식 테스트를 건너뜁니다.")

    print("\n" + "="*50)
    print("테스트 결과 요약")
    print("="*50)
    print(f"텍스트 인식 (DeepSeek): {'✅ 성공' if text_success else '❌ 실패 또는 건너뜀'}")
    print(f"이미지 인식 (Llama-4-Maverick): {'✅ 성공' if image_success else '❌ 실패 또는 건너뜀'}")

if __name__ == "__main__":
    main()