# Study-04: OpenRouter API Integration

OpenRouter API를 안전하게 사용하기 위한 프로젝트입니다.

## 설정 방법

1. 필요한 패키지 설치:
```bash
pip install -r requirements.txt
```

2. API 키 설정:
   - `.env.example` 파일을 참고하여 `.env` 파일이 이미 생성되어 있습니다
   - API 키는 환경 변수로 안전하게 관리됩니다

## 사용 방법

### Python 예제 실행
```bash
python openrouter_example.py
```

### 코드에서 사용하기
```python
from openrouter_example import OpenRouterClient

client = OpenRouterClient()
messages = [{"role": "user", "content": "Your message here"}]
response = client.chat_completion(messages)
```

## 보안 주의사항

- `.env` 파일은 절대 Git에 커밋하지 마세요 (`.gitignore`에 이미 포함됨)
- API 키를 코드에 직접 하드코딩하지 마세요
- 프로덕션 환경에서는 환경 변수나 시크릿 관리 서비스를 사용하세요

## 지원되는 모델

OpenRouter는 다양한 AI 모델을 지원합니다:
- GPT-3.5, GPT-4
- Claude
- Llama
- 기타 오픈소스 모델들

모델 목록 확인:
```python
client = OpenRouterClient()
models = client.list_models()
```