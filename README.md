# Korean Fashion Archive (Fashion Mixer 2.0)

2D/3D 인터랙티브 웨어러블 아카이브 웹 애플리케이션입니다.

## 📌 주요 기능
- **3D/2D 모드 전환**: 3D 실린더 뷰와 2D 펼침 뷰 간의 부드러운 트랜지션
- **카테고리별 룩 믹스앤매치**: 아우터, 상의, 하의 룩 조합 및 스크롤 컨트롤
- **인터랙티브 UI & 사운드**: BGM 재생/음소거, 커스텀 커서, 전체화면 지원

## 🚀 GitHub Pages를 통한 무료 웹사이트 공유 방법

이 프로젝트는 별도의 서버 빌드(Node/React 등) 과정이 필요 없는 정적 웹사이트(Static Web App)입니다.  
GitHub에 저장소를 만든 후 올려두면 **GitHub Pages** 기능으로 즉시 웹사이트 링크를 만들어 공유할 수 있습니다.

### 1단계: GitHub에 코드 올리기

1. [GitHub](https://github.com/)에 로그인 후 우측 상단의 **`+` -> `New repository`**를 클릭합니다.
2. Repository name(예: `fashion-mixer`)을 입력하고 **`Create repository`**를 클릭합니다.
3. 내 컴퓨터의 터미널에서 프로젝트 폴더로 이동한 후 아래 명령어를 순서대로 실행합니다:

```bash
git init
git add .
git commit -m "Initial commit: Fashion Mixer 2.0"
git branch -M main
git remote add origin https://github.com/<본인-GitHub-아이디>/<레포지토리-이름>.git
git push -u origin main
```

---

### 2단계: GitHub Pages 무료 공유 링크 만들기 (30초 소요)

1. GitHub 레포지토리 페이지 상단의 **`Settings`** 탭으로 이동합니다.
2. 좌측 메뉴에서 **`Pages`**를 클릭합니다.
3. **Build and deployment** 섹션의 **Source**를 **`Deploy from a branch`**로 설정합니다.
4. **Branch** 설정을 `main` / `/(root)`로 지정하고 **`Save`** 버튼을 누릅니다.
5. 1~2분 후 상단에 생성된 배포 URL (`https://<username>.github.io/<repository-name>/`)로 접속하면 **웹사이트가 그대로 라이브로 작동**하며 이 링크를 누구에게나 공유할 수 있습니다!
