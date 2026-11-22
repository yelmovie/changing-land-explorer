# 납품 안내 · 움직이는 지오밸리

옛 인계 문서: [`../HANDOFF.md`](../HANDOFF.md)(날짜별 작업 기록), [`DEPLOYMENT.md`](DEPLOYMENT.md)(배포 방법). 이 문서는 둘을 납품용으로 한 번에 보게 정리한 것입니다. 원래 파일은 그대로 있습니다.

## 1. 한눈에

| 항목 | 내용 |
|---|---|
| 이름 | 움직이는 지오밸리 (패키지 이름 `moving-geovalley` 0.2.0) |
| 운영 주소 | https://geovalley.pages.dev |
| 저장소 | https://github.com/yelmovie/changing-land-explorer (`main`) |
| 현재 앱 커밋 | `bccb1c4` (2026-11-22, 인증서 손기입·PNG·굵은 제목). Pages `5429697d`, 공식 운영 파일 SHA-256 일치 |
| 대상 | 초등 4학년 과학 「땅의 변화」, 5장소 · 활동 10개 · 발견 30개 |

## 2. 폴더 구조

배포되는 것:

- `src/` 화면과 게임 코드, `index.html`
- `public/assets/` 그림·영상·음악·목소리·글꼴·3D. 배포 때 `dist/`로 복사됨
- `functions/assets/{city,concepts,story}/` Pages 함수(영상 Range 처리), `worker/media-range.js`
- `dist/` 빌드 결과(Git 제외)

보관용(배포 안 됨):

- `assets/` 제작 원본과 `CREDITS.md`, `image/` 이미지 원본, `references/` 참고 자료·옛 설계서
- `docs/` 설계·검증 기록, `scripts/` 빌드·검사 도구, `films/concepts/` 개념 영상 제작
- `thumbnails/` 납품 썸네일(`thumbnail-16x8.png`, `thumbnail-1x1.png`), `.work/` 작업 중간 파일

폴더 전체 안내는 [`FOLDER-GUIDE.md`](FOLDER-GUIDE.md)입니다.

## 3. 실행·빌드·검사 명령

Node.js 20 이상, 별도 패키지 설치 없이 실행합니다(`package.json`에 의존성 없음).

| 명령 | 하는 일 |
|---|---|
| `npm run dev` | 개발 서버 `http://localhost:5177` (`scripts/serve.mjs`) |
| `npm run build` | `dist/` 정적 빌드 (`scripts/build.mjs`) |
| `PORT=5197 npm run preview` | 빌드 미리보기 |
| `npm run check` | JavaScript 문법 검사 |
| `npm test` | 학습·저장·진행 규칙 회귀 검사 (192개) |
| `npm run check:layout` `check:flow` `check:keyboard` 등 | 브라우저 검사. 실행 중인 서버와 Playwright + Chrome 필요 |

개념 영상을 다시 만들 때만 `npm run concepts:render`를 씁니다(FFmpeg·Sharp 필요, 앱 실행에는 불필요).

## 4. 배포

- 호스팅: Cloudflare Pages, 프로젝트 `geovalley`. 설정 파일 `wrangler.jsonc`(`pages_build_output_dir: ./dist`).
- 방식: 검증한 `dist/`를 직접 업로드합니다. GitHub 푸시만으로는 배포되지 않습니다(`.github` 워크플로 없음).

```sh
npm run check && npm test && npm run build
wrangler pages deploy dist --project-name=geovalley --branch=main
```

- 영상 탐색(Range) 처리: Cloudflare 정적 자료는 Range 요청에 파일 전체를 돌려줘서 영상 탐색과 iPad 재생이 깨집니다. `functions/assets/story/[[path]].js`, `functions/assets/concepts/[[path]].js`, `functions/assets/city/[[path]].js`가 `worker/media-range.js`를 불러 206 조각으로 응답합니다.
- 배포 뒤에는 시작 화면·지도·활동의 그림과 개념 영상이 열리는지, `index.html`과 코드 파일이 로컬 빌드와 같은지 확인합니다.

## 5. 다른 호스팅으로 옮길 때 챙길 것

- 정적 파일 폴더는 `dist/` 전체입니다.
- 서비스 워커 `dist/sw.js`는 빌드가 만듭니다. 처음 온라인 방문에서 자료를 저장해 오프라인에서 지도와 활동을 엽니다. 새로 배포하면 캐시 이름이 바뀝니다.
- 영상(mp4)에 Range 요청을 206으로 답해야 합니다. 못 하면 영상 장면 이동이 처음으로 돌아가고 iPad Safari가 재생하지 못합니다.
- 환경 값과 비밀 키는 없습니다. 서버로 학습 기록을 보내지 않습니다.
- 학생 기록은 브라우저 `localStorage`에 주소별로 저장되므로, 주소를 바꾸면 기록이 이어지지 않습니다.
- 3D 보기는 `public/assets/` 안의 Three.js와 모델을 씁니다. 글꼴과 Phaser도 앱 안에 들어 있어 바깥 주소 의존이 없습니다.

## 6. 버전과 변경 이력 (앱 코드, 최근)

| 날짜 | 커밋 | 내용 |
|---|---|---|
| 11-21 | `c78bb85` | 안 쓰는 그림 `river-sprite.webp` 배포본에서 제외 |
| 11-21 | `ec9c052` | 앱에서 부르지 않는 옛 모듈 10개 삭제(화면 108장 차이 0) |
| 11-21 | `66d1a56` | 해금을 저장된 기록에서도 다시 계산(F15) |
| 11-21 | `ac30dea` | 도시 공항 비교 화면을 60fps로(D9) |
| 11-21 | `802af00` | 성취 카드 글자 크기 키움(잠긴 안내 18px) |
| 11-21 | `dfc8168` | 기록탑 125% 확대 규칙을 5열 배치에만 |
| 11-21 | `322df6b` | 활동↔지도 왕복마다 쌓이던 노드·리스너 정리(D8) |
| 11-21 | `1e7b09a` | 콘솔 오류·대비·정리(E5·C9·C25·E3·D6·E12) |
| 11-20 | `b8bf79f` | 지도 악당 말풍선·이름표 위치 |
| 11-20 | `dc70e23` | 지도 악당 글자 18px |

운영 주소와 코드 대조는 기록 기준 Pages 배포 `7f3ed85d`입니다(`1a2c0c5` 기록). 이번 작업에서 다시 대조하지는 않았습니다.

## 7. 권리·출처

[`RIGHTS-LEDGER-20261121.md`](RIGHTS-LEDGER-20261121.md)에 54행을 정리했습니다. 확인됨 47, 근거 약함 5, 출처 미확인 2입니다. 미확인은 이야기 영상 속 원음과 메인·파이널 테마 음악이고, 근거 약함은 Higgsfield 그림 3묶음과 옛 주민 음성 2묶음입니다. 사용자 자료가 오면 판정이 바뀝니다.

## 8. 알려진 한계와 남은 일

성적표 `reviews/SCORE-20261121.md` 기준 91점, 실기기 제외 96점이고 판정은 「조건부 배포 가능」입니다. 남은 감점 9점:

- 사용자 결정 1점: 폰 가로에서 캔버스 장면 글자 20px 아래(C20).
- 자료 대기 3점: 이야기 영상·음악 권리 서류(F10), 라이선스(F11), 에셋 출처 증빙(F12).
- 실기기·수업 대기 5점: 40분 수업(B16), 실제 스피커(B18), iPad 가장자리·제스처(C19), 저사양 태블릿(D10), 도시 비교 화면과 작전 판 효과(D9·D13).
- 교사 검수(A12): 감점은 없지만 판정에 걸려 있습니다. [`TEACHER-REVIEW-20261121.md`](TEACHER-REVIEW-20261121.md)의 「확인 필요」 15행.

## 운영 대조 기록 (2026-11-22 12:56)

- 조율 세션이 운영 주소의 `index`와 스크립트·스타일 파일 40개를 저장소 `origin/main`과 대조했습니다. 결과는 모두 일치입니다(불일치 0).
- 위 본문에 「운영 반영 확인 필요」로 적힌 칸은 이 대조로 확인된 것입니다. 이후 앱을 다시 배포하면 `_scratch/final-recheck-20261120/prodcmp.sh 07`로 다시 대조합니다.

## 최신 인증서 운영 마무리 (2026-11-22)

- 앱 `bccb1c4`: 기존 지오밸리 테두리·색·수여 문장·탐험 도구를 유지하고 학교·학년·반·번호·이름을 출력 후 손으로 쓰는 빈칸과 「PNG 저장」을 추가했습니다. A4 가로 비율이며 진행·성취 숫자 요약은 없고 제목은 900 굵기와 동색 얇은 획으로 표시합니다. PNG에도 화면의 굵기·획·배치를 적용합니다.
- `npm run check`, `npm test` 192/192, `npm run build` 통과. 세 화면 크기(1280×800·1024×768·1920×1080)에서 종이·버튼 전체 표시, 1280px 화면에서 종이 폭 66.7%, 입력 칸·진행 숫자 요약·겹침·콘솔/HTTP 오류 0입니다.
- A4 가로 PDF 1쪽, PNG 2400×1697을 실제로 열어 확인했습니다. PDF 기준 학교 밑줄 59.4mm·이름 65.3mm·쓰기 높이 11.28mm입니다. 설정에서 인증서 진입·탐험 기록으로 돌아가기·동작 줄이기도 확인했습니다.
- 기존 Pages `geovalley` 배포 `5429697d`. 공식 운영 https://geovalley.pages.dev/ 의 index·실제 JS/CSS·인증서 PNG 모듈·기존 테두리를 최신 빌드와 SHA-256으로 대조해 일치했습니다. 운영에서도 세 화면·PDF·PNG·설정 진입·동작 줄이기를 다시 확인했습니다.
- 새 그림·의존성은 없고 학습 판정·진행 저장 형식을 바꾸지 않았습니다. 교사 확인·권리 증빙·실기기·실물 인쇄·수업 대기는 별도 미확인으로 유지합니다.
