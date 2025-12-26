"""OpenRouter API 테스트 스크립트"""
import os
import requests
from dotenv import load_dotenv
import base64

load_dotenv(override=True)

API_KEY = os.getenv("OPENROUTER_API_KEY")
BASE_URL = "https://openrouter.ai/api/v1/chat/completions"

HEADERS = {
    "Authorization": f"Bearer {API_KEY}",
    "Content-Type": "application/json",
}


def test_text_model():
    """텍스트 모델 테스트: nvidia/nemotron-nano-12b-v2-vl:free"""
    print("=" * 50)
    print("📝 텍스트 모델 테스트")
    print("모델: nvidia/nemotron-nano-12b-v2-vl:free")
    print("=" * 50)

    payload = {
        "model": "nvidia/nemotron-nano-12b-v2-vl:free",
        "messages": [
            {"role": "user", "content": "안녕하세요! 간단히 자기소개 해주세요."}
        ],
    }

    try:
        response = requests.post(BASE_URL, headers=HEADERS, json=payload, timeout=30)
        response.raise_for_status()
        result = response.json()

        content = result["choices"][0]["message"]["content"]
        print(f"\n✅ 응답 성공!\n")
        print(f"응답: {content[:500]}...")
        return True
    except requests.exceptions.RequestException as e:
        print(f"\n❌ 요청 실패: {e}")
        if hasattr(e, 'response') and e.response is not None:
            print(f"상세: {e.response.text}")
        return False


def test_image_model():
    """이미지 모델 테스트: nvidia/nemotron-nano-12b-v2-vl:free"""
    print("\n" + "=" * 50)
    print("🖼️  이미지 모델 테스트")
    print("모델: nvidia/nemotron-nano-12b-v2-vl:free")
    print("=" * 50)

    # 간단한 테스트 이미지 다운로드 후 base64 인코딩 (picsum 테스트 이미지)
    test_image_url = "https://picsum.photos/200"

    try:
        img_headers = {"User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)"}
        img_response = requests.get(test_image_url, headers=img_headers, timeout=10)
        img_response.raise_for_status()
        img_base64 = base64.b64encode(img_response.content).decode('utf-8')
        data_url = f"data:image/jpeg;base64,{img_base64}"
    except Exception as e:
        print(f"이미지 다운로드 실패: {e}")
        return False

    payload = {
        "model": "nvidia/nemotron-nano-12b-v2-vl:free",
        "messages": [
            {
                "role": "user",
                "content": [
                    {"type": "text", "text": "이 이미지에 무엇이 있나요? 한국어로 간단히 설명해주세요."},
                    {"type": "image_url", "image_url": {"url": data_url}}
                ]
            }
        ],
    }

    try:
        response = requests.post(BASE_URL, headers=HEADERS, json=payload, timeout=60)
        response.raise_for_status()
        result = response.json()

        content = result["choices"][0]["message"]["content"]
        print(f"\n✅ 응답 성공!\n")
        print(f"테스트 이미지: 바나나 이미지")
        print(f"응답: {content[:500]}")
        return True
    except requests.exceptions.RequestException as e:
        print(f"\n❌ 요청 실패: {e}")
        if hasattr(e, 'response') and e.response is not None:
            print(f"상세: {e.response.text}")
        return False


if __name__ == "__main__":
    print("\n🚀 OpenRouter API 테스트 시작\n")

    if not API_KEY:
        print("❌ OPENROUTER_API_KEY가 설정되지 않았습니다.")
        exit(1)

    print(f"API 키: {API_KEY[:20]}...")

    text_ok = test_text_model()
    image_ok = test_image_model()

    print("\n" + "=" * 50)
    print("📊 테스트 결과 요약")
    print("=" * 50)
    print(f"텍스트 모델: {'✅ 성공' if text_ok else '❌ 실패'}")
    print(f"이미지 모델: {'✅ 성공' if image_ok else '❌ 실패'}")
