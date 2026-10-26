# 지오밸리 인계
프로젝트: D:\iscreammedia_sc34\7 earthchange

현재(2026-10-25): 디자인 고도화·기능 결함 수정 완료, 2차 최종점검 218/253. 상세 `docs/reviews/FINAL-CHECK-20261025-2.md`.

화면 틀: `src/art.css`가 마지막 덮어쓰기 층. 활동은 흐린 배경 + 가운데 캔버스, 위 왼쪽 홈·이전 / 위 오른쪽 소리·설정 / 위 가운데 질문 칩 / 아래 왼쪽 리버 말풍선(진행 숫자 포함) / 아래 오른쪽 할 일 버튼. 높이 변수 `--hud-top`·`--hud-bottom`으로 캔버스 영역을 정한다.

그림: Phaser 공통 부품 `api.paper/panel/card/target`(`src/adventure/index.js`)이 양피지·종이 카드 9-slice를 쓴다. 소품은 `public/assets/art/ui/`, 원본 `image/generated-20261025-design/`, 가공 `node scripts/prepare-design-art.mjs`.

검증: `npm run check`, `npm test`(44), `npm run build`. 화면 검사 `PLAYWRIGHT_PATH=D:/isamgpt/15worldmap/node_modules/playwright/index.mjs CHECK_SIZES=873x580,1280x800 node scripts/check-learning-ui.mjs`. 빌드본 확인은 `.claude/launch.json`의 geovalley-dist(5178).

다음: 교육·게임성 변경(재도전 목표, 보상 예고)은 사용자 승인 대기. 실기기 확인·운영 배포는 아직.

3D(2026-10-26): Meshy GLB 4개 적용(현무암·화강암·실제 화산·흙 언덕). 원본은 `assets/raw-glb/`, 배포본은 `public/assets/models/`. 메시는 깎지 말고 `node scripts/prepare-models.mjs`로 텍스처만 줄인다(Decimate하면 찢어짐). 적용 위치·남은 모델은 `docs/3D-ASSETS.md` 6절. Meshy는 상업 이용 가능한 플랜(사용자 확인).
