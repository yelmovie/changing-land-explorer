# 지오밸리 인계
프로젝트: 현재 체크아웃의 루트 (`package.json`이 있는 폴더). 드라이브 문자는 작업 환경마다 다르다.

2026-11-04 배포: `b64d14a`를 커밋·푸시하고 https://geovalley.pages.dev 운영 배포 완료. 공개 주소 파일 216/216 바이트 일치, 서비스워커 74개 캐시·오프라인 새로고침, 공개 주소 학생 완주 통과. 배포 전 `npm test` 73, 화면 522/522, 키보드·주민·요청 수정·끝 화면 검사 통과. 실기기(iPad 등)는 아직 안 봤다. Pages가 mp4 Range 요청에 206이 아닌 200을 주므로 Safari 영상 재생을 실기기에서 확인할 것.

맥(exFAT) 빌드 주의: `npm run build` **전에** `find . -name '._*' -delete`를 돌린다. `src/._*.js`가 있으면 `sw.js` 사전 캐시 목록에 들어가고, 빌드 후 지우면 없는 파일이 되어 서비스워커 설치가 실패한다. 복사로 `dist/`에 다시 생기므로 배포 직전에도 지운다. `build.mjs`는 `dist`를 비우지 않으니 `rm -rf dist` 후 빌드한다.

2026-11-03 지도 메뉴: 오른쪽 아래 도구 보관함 UI와 전용 스타일을 제거하고, 위쪽 `장소 바로가기`에 다섯 스테이지 직접 진입 버튼을 추가했다. 학생 잠금·이어하기를 유지하며 교사 시연에서는 모두 열린다. 도구 기록은 설정의 탐험 가방에서 계속 확인한다. 1280×720·850×420·1920×1080에서 화면/잠금/직접 진입/교사 기록 보호 검사 통과 (`.work/map-shortcuts-20261103/`).

2026-11-03 키보드 수정: 지도에서 버튼에 포커스가 있으면 방향키까지 무시하던 조건을 고쳤다. 방향키·WASD는 지도 버튼에 포커스가 있어도 이동하고, 팝업·입력칸·브라우저 단축키·버튼 Enter는 원래 동작을 유지한다. 재검사: `npm run check:keyboard` (Playwright 필요), 7개 시나리오 통과.

2026-11-03: 리버 8방향 32프레임 걷기 적용, 새 주민 바로 대화, 교사 해금 아이콘 개선 완료. 검증은 `docs/reviews/MAP-CHARACTER-20261103.md`, 제작법은 `docs/design/river-walk-prompts.md`. 실행은 기존처럼 `npm run dev`; 에셋 재가공 때만 현재 OS용 Sharp를 `SHARP_PATH`로 지정한다.

2026-11-03: 인트로·엔딩과 두 음악 테마 적용 완료. 원본은 `assets/source-media/`, 실행 파일은 `public/assets/`, 옛 `files/`·`_unused/`는 `references/archive/`로 정리했다. 경로·이름 규칙은 `docs/FOLDER-GUIDE.md`, 미디어 연결은 `docs/STORY-MEDIA.md` 참고. 원본 이동 전후 SHA-256이 같음을 확인했고 파일을 삭제하지 않았다.

현재(2026-10-30): 납품 점검 **조건부 배포 가능**. 6해상도 화면 검사 522/522, 학생 완주·끝 화면·요청 수정 점검 통과. 상세 `docs/reviews/RELEASE-REVIEW-20261030.md`.

지도(2026-10-29): `src/map-adventure.js`. 화면보다 1.2배 크게 깔고 끌기·휠로 이동(가장자리 안 보이게 범위 제한), 왼쪽 아래 방향키 패드(가운데: 리버 보기/입구에서 들어가기), 다음 목적지 반짝임 + 화면 밖이면 가장자리 안내. Phaser 캔버스는 1920×1080 해상도에 카메라 1.6배(좌표계 1200×675 유지), 크기 바뀌면 `game.scale.setParentSize()`로 넘긴다(`refresh()`만 쓰면 작게 남는 버그). 지도 길 탭은 Phaser 입력이 아니라 DOM 클릭에서 계산한다.

교사 넘기기: 관리자 해금일 때 활동 오른쪽 아래 `#teacher-skip`(`src/adventure/index.js`). 다음 단계 → 다음 활동 → 다음 장소 → 마지막 도전.

이전(2026-10-25): 디자인 고도화·기능 결함 수정 완료, 2차 최종점검 218/253. 상세 `docs/reviews/FINAL-CHECK-20261025-2.md`.

화면 틀: `src/art.css`가 마지막 덮어쓰기 층. 활동은 흐린 배경 + 가운데 캔버스, 위 왼쪽 홈·이전 / 위 오른쪽 소리·설정 / 위 가운데 질문 칩 / 아래 왼쪽 리버 말풍선(진행 숫자 포함) / 아래 오른쪽 할 일 버튼. 높이 변수 `--hud-top`·`--hud-bottom`으로 캔버스 영역을 정한다.

그림: Phaser 공통 부품 `api.paper/panel/card/target`(`src/adventure/index.js`)이 양피지·종이 카드 9-slice를 쓴다. 소품은 `public/assets/art/ui/`, 원본 `image/generated-20261025-design/`, 가공 `node scripts/prepare-design-art.mjs`.

검증: `npm run check`, `npm test`(44), `npm run build`. 화면 검사(맥) `PLAYWRIGHT_PATH="/Volumes/T7 Shield/iscreammedia_sc34/8 creatures/node_modules/playwright/index.mjs" CHECK_SIZES=1024x768,1280x720,1280x800,1920x1080,915x412,830x515 node scripts/check-learning-ui.mjs`. 완주는 `check-learning-flow.mjs`. 빌드본 확인은 `.claude/launch.json`의 geovalley-dist(5178).

다음: 교육·게임성 변경(재도전 목표, 보상 예고)은 사용자 승인 대기. 실기기 확인은 아직.

3D(2026-10-26): Meshy GLB 4개 적용(현무암·화강암·실제 화산·흙 언덕). 원본은 `assets/raw-glb/`, 배포본은 `public/assets/models/`. 메시는 깎지 말고 `node scripts/prepare-models.mjs`로 텍스처만 줄인다(Decimate하면 찢어짐). 적용 위치·남은 모델은 `docs/3D-ASSETS.md` 6절. Meshy는 상업 이용 가능한 플랜(사용자 확인).
