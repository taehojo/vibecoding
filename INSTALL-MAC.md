# macOS에서 클로드 코드 설치하기

이 가이드는 macOS 사용자를 위한 클로드 코드(Claude Code) 설치 안내서입니다.
[클로드 코드 공식 문서](https://code.claude.com/docs)를 참고하여 정리되었습니다.

---

## 시스템 요구사항

클로드 코드를 설치하기 전에 아래 요구사항을 확인하세요.

| 항목 | 요구사항 |
|------|---------|
| 운영체제 | macOS 10.15 (Catalina) 이상 |
| RAM | 4GB 이상 |
| 네트워크 | 인터넷 연결 필수 |
| 터미널 | 터미널 앱 (기본 설치됨) |

---

## 설치 방법

macOS에서는 두 가지 방법으로 클로드 코드를 설치할 수 있습니다.

### 방법 1: 터미널 명령어로 설치 (권장)

가장 간단한 방법입니다. 터미널을 열고 아래 명령어를 복사해서 붙여넣으세요.

**1단계: 터미널 열기**

- `Command(⌘) + Space`를 눌러 Spotlight 검색을 엽니다
- "터미널" 또는 "Terminal"을 입력하고 Enter를 누릅니다

**2단계: 설치 명령어 실행**

터미널에 아래 명령어를 복사해서 붙여넣고 Enter를 누르세요:

```bash
curl -fsSL https://claude.ai/install.sh | bash
```

설치가 완료되면 터미널에 성공 메시지가 표시됩니다.

---

### 방법 2: Homebrew로 설치

이미 Homebrew를 사용하고 있다면 이 방법이 편리합니다.

**Homebrew가 설치되어 있지 않다면?**

먼저 Homebrew를 설치하세요:

```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

**Homebrew로 클로드 코드 설치:**

```bash
brew install --cask claude-code
```

---

## 설치 확인

설치가 완료되었는지 확인하려면 터미널에서 아래 명령어를 실행하세요:

```bash
claude --version
```

버전 번호가 표시되면 설치가 성공한 것입니다.

---

## 클로드 코드 시작하기

### 1단계: 프로젝트 폴더로 이동

작업하려는 프로젝트 폴더로 이동합니다:

```bash
cd ~/Desktop/my-project
```

### 2단계: 클로드 코드 실행

```bash
claude
```

### 3단계: 로그인

처음 실행하면 로그인 화면이 나타납니다. 두 가지 방법 중 하나를 선택하세요:

**옵션 A: Claude 앱 구독자 (Pro/Max 플랜)**
- Claude.ai 계정으로 로그인
- 브라우저가 자동으로 열리면 로그인을 완료하세요

**옵션 B: API 사용자**
- [Anthropic Console](https://console.anthropic.com)에서 API 키 발급
- 결제 정보 등록 필요

---

## 업데이트

클로드 코드는 자동으로 업데이트됩니다. 수동으로 업데이트하려면:

```bash
claude update
```

---

## 제거 방법

클로드 코드를 제거하려면 설치 방법에 따라 다른 명령어를 사용합니다.

### 터미널 명령어로 설치한 경우

```bash
rm -f ~/.local/bin/claude
rm -rf ~/.claude-code
```

### Homebrew로 설치한 경우

```bash
brew uninstall --cask claude-code
```

### 설정 파일도 완전히 삭제하려면 (선택사항)

```bash
rm -rf ~/.claude
rm -f ~/.claude.json
```

---

## 문제 해결

### "command not found: claude" 오류가 발생하면?

터미널을 완전히 종료했다가 다시 열어보세요. 그래도 안 되면:

```bash
export PATH="$HOME/.local/bin:$PATH"
```

이 명령어를 실행한 후 다시 `claude`를 입력해보세요.

### 권한 오류가 발생하면?

`sudo`를 사용하지 마세요. 대신 아래 명령어로 권한을 확인하세요:

```bash
ls -la ~/.local/bin/
```

---

## 다음 단계

설치가 완료되었다면 이제 클로드 코드와 함께 코딩을 시작할 수 있습니다!

- 프로젝트 폴더에서 `claude`를 실행하세요
- 자연어로 코딩 작업을 요청해보세요
- 예: "이 폴더에 간단한 웹페이지를 만들어줘"

---

## 참고 링크

- [클로드 코드 공식 문서](https://code.claude.com/docs)
- [Anthropic Console](https://console.anthropic.com)
- [Claude.ai](https://claude.ai)
