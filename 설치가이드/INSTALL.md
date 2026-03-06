# macOS / Linux에서 클로드 코드 설치하기

---

**1.** `Command + Space` 키를 눌러 Spotlight 검색을 연 뒤, "터미널"이라고 입력하고 Enter 키를 누르세요. 아래와 같이 터미널 창이 열립니다.

> **Note**: 터미널의 배경색은 화면 상단 메뉴바의 터미널 → 설정에서 변경 가능합니다.

**2.** Git이 설치되어 있는지 확인합니다. 터미널에 다음을 입력하고 Enter 키를 누르세요:

```bash
git --version
```

버전 번호가 나타나면 이미 설치되어 있는 것입니다. macOS에는 보통 Git이 기본 포함되어 있습니다. (만약 설치되어 있지 않을 경우 설치 팝업이 뜨는데, 이때 "설치"를 클릭하거나, 터미널에 `xcode-select --install`을 입력하면 설치가 시작됩니다.)

**3.** Git 설치 확인 후 터미널에 다음 명령어를 입력하고 Enter 키를 누르세요:

```bash
curl -fsSL https://claude.ai/install.sh | zsh
```

> **Note**: 필요한 경우 명령어 끝의 `zsh`를 `bash`로 바꿔주세요. `zsh`와 `bash`는 자신의 운영체제의 기본 셸(shell)을 가리킵니다.

**4.** 클로드 코드 설치 완료 안내가 나오면, `Command + Q`로 터미널을 종료한 뒤, 다시 터미널을 엽니다. 이제 명령 프롬프트에 `claude`라고 입력해 클로드를 실행할 수 있습니다.

> **Note**: 만약 claude를 찾을 수 없다고 나오면, 다음과 같이 PATH를 수동으로 등록한 뒤, 터미널을 재실행하고 `claude`를 실행해 주세요.
> ```bash
> echo 'export PATH="$HOME/.local/bin:$PATH"' >> ~/.zshrc
> source ~/.zshrc
> ```
