# Linux에서 클로드 코드 설치하기

이 가이드는 Linux 사용자를 위한 클로드 코드(Claude Code) 설치 안내서입니다.
[클로드 코드 공식 문서](https://code.claude.com/docs)를 참고하여 정리되었습니다.

---

## 시스템 요구사항

클로드 코드를 설치하기 전에 아래 요구사항을 확인하세요.

| 항목 | 요구사항 |
|------|---------|
| 운영체제 | Ubuntu 20.04+ / Debian 10+ 또는 호환 배포판 |
| RAM | 4GB 이상 |
| 네트워크 | 인터넷 연결 필수 |
| 셸 | Bash, Zsh, 또는 Fish |

---

## 설치 방법

### 방법 1: 터미널 명령어로 설치 (권장)

가장 간단한 방법입니다. 터미널을 열고 아래 명령어를 실행하세요:

```bash
curl -fsSL https://claude.ai/install.sh | bash
```

설치가 완료되면 터미널에 성공 메시지가 표시됩니다.

---

### 방법 2: NPM으로 설치

Node.js 18 이상이 설치되어 있다면 NPM으로도 설치할 수 있습니다.

**Node.js가 설치되어 있지 않다면?**

Ubuntu/Debian에서 Node.js 설치:

```bash
# Node.js 공식 저장소 추가
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -

# Node.js 설치
sudo apt-get install -y nodejs
```

**NPM으로 클로드 코드 설치:**

```bash
npm install -g @anthropic-ai/claude-code
```

> **주의**: `sudo npm install -g`를 사용하지 마세요. 권한 문제와 보안 위험이 발생할 수 있습니다.

---

## 배포판별 추가 설정

### Ubuntu / Debian

대부분의 경우 추가 설정 없이 바로 사용할 수 있습니다.

### Alpine Linux (musl 기반)

Alpine Linux나 musl 기반 배포판에서는 추가 패키지가 필요합니다:

```bash
apk add libgcc libstdc++ ripgrep
```

환경 변수도 설정해야 합니다:

```bash
export USE_BUILTIN_RIPGREP=0
```

이 설정을 영구적으로 적용하려면 `~/.bashrc` 또는 `~/.zshrc`에 추가하세요:

```bash
echo 'export USE_BUILTIN_RIPGREP=0' >> ~/.bashrc
source ~/.bashrc
```

### Fedora / CentOS / RHEL

```bash
# curl이 없다면 먼저 설치
sudo dnf install curl

# 클로드 코드 설치
curl -fsSL https://claude.ai/install.sh | bash
```

### Arch Linux

```bash
# curl이 없다면 먼저 설치
sudo pacman -S curl

# 클로드 코드 설치
curl -fsSL https://claude.ai/install.sh | bash
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
cd ~/my-project
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

## PATH 설정 문제 해결

"command not found: claude" 오류가 발생하면 PATH에 설치 경로를 추가해야 합니다.

### Bash 사용자

```bash
echo 'export PATH="$HOME/.local/bin:$PATH"' >> ~/.bashrc
source ~/.bashrc
```

### Zsh 사용자

```bash
echo 'export PATH="$HOME/.local/bin:$PATH"' >> ~/.zshrc
source ~/.zshrc
```

### Fish 사용자

```fish
fish_add_path ~/.local/bin
```

---

## 업데이트

클로드 코드는 자동으로 업데이트됩니다. 수동으로 업데이트하려면:

```bash
claude update
```

---

## 제거 방법

### 터미널 명령어로 설치한 경우

```bash
rm -f ~/.local/bin/claude
rm -rf ~/.claude-code
```

### NPM으로 설치한 경우

```bash
npm uninstall -g @anthropic-ai/claude-code
```

### 설정 파일도 완전히 삭제하려면 (선택사항)

```bash
rm -rf ~/.claude
rm -f ~/.claude.json
```

---

## 문제 해결

### curl이 설치되어 있지 않은 경우

**Ubuntu/Debian:**
```bash
sudo apt-get update && sudo apt-get install -y curl
```

**Fedora/CentOS:**
```bash
sudo dnf install curl
```

**Arch Linux:**
```bash
sudo pacman -S curl
```

### 권한 오류가 발생하면?

설치 스크립트를 `sudo`로 실행하지 마세요. 일반 사용자 권한으로 실행해야 합니다.

### 검색 기능이 작동하지 않으면?

ripgrep이 필요할 수 있습니다:

**Ubuntu/Debian:**
```bash
sudo apt-get install ripgrep
```

**Fedora:**
```bash
sudo dnf install ripgrep
```

**Arch Linux:**
```bash
sudo pacman -S ripgrep
```

---

## 서버 환경에서 사용하기

SSH로 접속한 서버에서도 클로드 코드를 사용할 수 있습니다.

```bash
# 서버에 SSH 접속
ssh user@your-server.com

# 클로드 코드 설치
curl -fsSL https://claude.ai/install.sh | bash

# 프로젝트 폴더로 이동 후 실행
cd /var/www/my-project
claude
```

> **팁**: 서버에서 처음 실행할 때 브라우저 인증이 필요합니다. 터미널에 표시되는 URL을 로컬 브라우저에서 열어 인증을 완료하세요.

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
