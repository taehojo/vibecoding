# 냉장고를 부탁해 - 웹 버전

AI가 냉장고 사진을 분석하고 맞춤 레시피를 추천하는 웹 애플리케이션입니다.

## 🚀 Vercel 배포 가이드

### 1. Vercel 계정 생성
1. [Vercel](https://vercel.com) 접속
2. "Sign Up" 클릭
3. GitHub 계정으로 로그인

### 2. 프로젝트 가져오기
1. Vercel 대시보드에서 "Add New..." → "Project" 클릭
2. GitHub에서 `vibecoding` 저장소 선택
3. "Import" 클릭

### 3. 배포 설정
- **Framework Preset**: Other
- **Root Directory**: `Study-04/web` 입력 (Browse 클릭하여 선택)
- **Build Command**: 비워두기 (정적 사이트)
- **Output Directory**: 비워두기 (현재 디렉토리)
- **Install Command**: 비워두기

### 4. 환경변수 설정 (중요!)
배포하기 전에 API 키를 환경변수로 설정해야 합니다:

1. Vercel 프로젝트 설정 페이지에서 "Environment Variables" 탭 클릭
2. 다음 환경변수 추가:
   - **Name**: `OPENROUTER_API_KEY`
   - **Value**: [OpenRouter에서 발급받은 API 키](https://openrouter.ai/)
   - **Environments**: Production, Preview, Development 모두 체크
3. "Save" 클릭

⚠️ **중요**: API 키를 환경변수로 설정하지 않으면 앱이 작동하지 않습니다!

### 5. 배포 시작
1. "Deploy" 버튼 클릭
2. 1-2분 대기
3. 배포 완료! 🎉

### 5. 도메인 확인
배포가 완료되면 다음과 같은 URL이 생성됩니다:
```
https://your-project-name.vercel.app
```

### 6. 커스텀 도메인 (선택사항)
1. Vercel 프로젝트 → Settings → Domains
2. 원하는 도메인 입력
3. DNS 설정 변경

## 💡 사용 방법

### 🎉 별도 API 키 불필요!
✅ 이 앱은 **서버리스 API**를 사용하므로 사용자가 API 키를 입력할 필요가 없습니다!
✅ 관리자가 Vercel 환경변수에 API 키를 설정하면, 모든 사용자가 바로 사용 가능합니다.

### 로컬 개발 시 API 키 설정 (선택사항)
로컬에서 개발하거나 자신의 API 키를 사용하려면:
1. [OpenRouter](https://openrouter.ai/)에서 무료 API 키 발급
   - 회원가입 후 Credits 메뉴 접속
   - "Create Key" 클릭
2. 앱에서 ⚙️ 설정 버튼 클릭
3. API 키 입력 및 저장
4. backend.js에서 `this.useServerlessAPI = false;`로 변경

### 레시피 추천받기
1. **방법 1: 이미지로 재료 인식**
   - 냉장고 사진 업로드
   - "재료 분석하기" 클릭
   - 인식된 재료 확인 (수정 가능)
   - "레시피 추천받기" 클릭

2. **방법 2: 직접 입력**
   - 재료를 직접 입력
   - "레시피 추천받기" 클릭

## 🛠 기술 스택

- **Frontend**: Vanilla JavaScript, HTML5, CSS3
- **Backend**: Vercel Serverless Functions (Node.js)
- **AI Model**: Meta Llama 4 Maverick (via OpenRouter)
- **Hosting**: Vercel
- **Storage**: LocalStorage (저장된 레시피)

## 📝 주요 기능

- ✅ 이미지 기반 재료 인식 (AI 비전 모델)
- ✅ 맞춤 레시피 추천
- ✅ 레시피 저장 기능 (최대 10개)
- ✅ 반응형 디자인
- ✅ 드래그 앤 드롭 이미지 업로드
- ✅ **서버리스 API로 보안 강화** (사용자 API 키 불필요)

## 🔒 보안

- **API 키는 서버 측(Vercel 환경변수)에서 안전하게 관리**
- 사용자 브라우저에 API 키가 노출되지 않음
- HTTPS를 통한 안전한 통신
- CORS 정책으로 무단 사용 방지

## 📄 라이선스

이 프로젝트는 VibeCoding 교재의 일부입니다.
