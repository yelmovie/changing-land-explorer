# 움직이는 지오밸리 배포

- 공개 주소: https://geovalley.pages.dev
- 소스 저장소: https://github.com/yelmovie/changing-land-explorer
- Cloudflare Pages 프로젝트: `geovalley`
- 운영 브랜치: `main`
- 빌드 결과: `dist/`
- 최초 배포 작업일: 2026-10-25

GitHub에는 소스와 실행 자산을 보관하고, 검증한 정적 빌드를 Cloudflare Pages에 직접 업로드한다. GitHub 푸시만으로 자동 배포되는 구성은 아니다.

## 다시 배포하기

Node.js 20 이상, Git과 Wrangler 4가 필요하다. 기존 인증을 재사용한다.

```sh
npm run check
npm test
npm run build
wrangler pages deploy dist --project-name=geovalley --branch=main
```

배포 후 시작 화면·지도·각 활동의 이미지와 개념 영상이 열리는지 확인한다. `/src/stage-art.js`와 `assets/art/stage-backgrounds.json`을 대조하면 새 배경이 포함됐는지 확인할 수 있다.

원본 PNG, 임시 캡처, 로컬 검사 기록, 환경파일은 Git·공개 빌드에 포함하지 않는다. 자료 출처·이용 조건의 남은 확인 사항은 `assets/CREDITS.md`를 유지한다.

## 콘텐츠 소개

리버와 함께 강·화산·암석·도시·안전길을 탐험하며 땅의 변화를 발견하는 과학 탐구 게임이에요. 직접 실험하고 단서를 비교해 다섯 도구를 모으고, 나만의 탐험 기록과 인증서를 완성해요.
