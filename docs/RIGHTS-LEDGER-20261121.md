# 07 「움직이는 지오밸리」 권리 대장 (2026-11-21)

배포본에 들어가는 그림·영상·음악·효과음·목소리·글꼴·3D 모델·라이브러리를 하나씩 확인해, 누가 무엇으로 만들었고 어떤 조건으로 쓰는지와 그 근거 파일을 모은 대장이다. 기록이 없는 것은 추측해서 채우지 않고 **출처 미확인**으로 두었다.

- 대상: `npm run build`가 만드는 `dist/assets/` 전체 813개 파일. `_scratch/deploy-20261118/wt/07/dist/`(2026-11-21 08:26 빌드)의 목록이 저장소 `public/assets/`에서 `*.png`와 `jua-*.woff2`를 뺀 목록과 한 개도 다르지 않음을 확인했다.
- 읽은 근거: `public/assets/CREDITS.md`(배포본), `assets/CREDITS.md`, `public/assets/audio/CREDITS.md`, 각 폴더의 `manifest.json`·`*-SOURCE.json`·`*-OFL.txt`·라이선스 파일, `docs/`(STORY-MEDIA, AUDIO-PROVENANCE-20261109, VOICE-FILL-20261118.json, story-narration-20261113.json, design/*-prompts.md 등), `assets/generated/*`, `assets/source-media/README.md`, `README.md`, `scripts/prepare-*.mjs`, `scripts/voices.json`, `films/concepts/`, `output/airport-video*`, `.work/bridge-art-20261115/`, git 추가 이력, `_shared/voice-provenance-20261118.md`, `_shared/sfx-library-20261117/manifest.json`, `_shared/reward-cards/`, `_scratch/reward-cards-20261118/`, `_shared/BGM-APPLY-BRIEF-20261117.md`, Obsidian 프로젝트 노트.
- 이 문서는 기록을 모은 것이고 법률 판단이 아니다.

## 요약

**상태별 행 수 (전체 53행)**

| 상태 | 행 수 |
|---|---|
| 확인됨 | 16 |
| 근거 약함 | 23 |
| **출처 미확인** | 14 |

**출처 미확인 14행** (쓰는 화면)

1. V-1 `story/intro.mp4`·`final.mp4`와 첫 화면 그림 — 처음 시작 인트로, 기록탑 완료 엔딩, 설정의 다시 보기
2. V-3 `city/airport-flight-suspended.mp4`·`airport-flight-resumed.mp4` — 도시(주민 광장) 활동의 공항 운항 중단·재개 비교 (`src/airport-clips.js` → `src/adventure/city.js`)
3. V-5 개념 영상 `volcano-1`·`city-0`·`city-1` — 화산·도시 활동 뒤 개념 영상 창 (안에 출처 미확인 그림이 들어 있음)
4. M-1 `audio/main-theme.mp3`·`final-theme.mp3` — 인트로·지도·탐구 활동 내내 / 엔딩·탐험 기록·인증서·지도 파이널 창
5. I-2 `volcano-eruption.webp` — 화산 활동 장면(`src/volcano.js`, `src/nature.js`, `src/explore-ui.js`)
6. I-3 `map.webp` — 옛 지도 캔버스(`src/map.js`)와 마지막 장면 배경(`src/style.css` `.final-scene`)
7. I-4 `title-logo.webp` — 시작 화면 제목(`src/main.js`), 지도 머리 로고(`src/map-adventure.js`)
8. I-5 `river-sprite.webp` — 옛 지도 리버 그림(`src/map.js`, `src/river-walk.js`)
9. I-6 `city-calm.webp` — 도시 활동의 시기 비교(`src/observations.js`, `src/visuals.js`), 지도(`src/map-adventure.js`)
10. I-9 `hero-protect-mask.webp` — 도시 활동의 마스크 쓴 리버(`src/adventure/city.js`)
11. I-10 `og-image.jpg` — 메신저 링크 미리보기 카드(`index.html` og/twitter 메타)
12. I-12 `npc-expressions/*.webp` 15장 — 주민 대화창 초상(`src/residents.js`)
13. I-23 `art/river-upper-photo-v1.webp`·`river-lower-photo-v1.webp` — 강 활동 윗물·아랫물 관찰(`src/adventure/river.js`)
14. I-27 `art/river-connection-map-v1.webp` — 강 활동의 물길 연결 지도(`src/adventure/river.js`)

## 상태 기준

- **확인됨**: 만든 도구·제공처와 날짜가 기록돼 있고, 프롬프트·생성 ID·원본 등 생성 기록이 남아 있으며, 이용 조건(라이선스 원문 동봉, 또는 유료 요금제·상업 이용을 사용자가 확인한 기록)이 저장소나 `_shared`에 적혀 있다.
- **근거 약함**: 도구는 알 수 있지만 이용 조건(요금제·약관) 기록이 없거나, 생성 기록이 부족하거나, 도구를 스크립트 경로·커밋 메시지로만 알 수 있다. 또는 근거 약함인 그림을 안에 담은 합성물이다.
- **출처 미확인**: 만든 도구·제공처 기록이 없다. 또는 출처 미확인 그림·소리를 안에 담은 합성물이다.

OpenAI(ChatGPT·Codex 내장) 이미지 생성은 도구·날짜·프롬프트가 있어도 **어느 계정·요금제로 만들었는지 기록이 저장소에 없어** 모두 근거 약함으로 두었다. 배포본 `public/assets/CREDITS.md`도 같은 묶음을 "WARNING · 생성 당시 요금제·계정 조건 기록은 없음"으로 적고 있다.

## 1. 이미지

| # | 파일(묶음) | 개수·용량 | 만든 곳(생성 도구·제공처·라이브러리) | 만든 날·기록 위치(프롬프트 기록, 생성 로그, CREDITS, 계약) | 이용 조건 | 근거 파일 경로 | 상태 |
|---|---|---|---|---|---|---|---|
| I-1 | 장면 그림 `river-lab`, `river-field`, `volcano-lab`, `volcano-field`, `rocks-lab`, `rocks-table`, `city-before`, `city-eruption`, `classroom`, `school` (.webp) | 10개 · 2.1MB | 원본 파일 이름이 `ChatGPT 이미지 2026년 9월 25일 오후 09_38_37-1.png`~`09_38_52-10.png`. 프로젝트 초기 전달 자료에 있던 그림을 Sharp로 줄여 WebP로 바꿈 | 원본 이름의 날짜 2026-09-25, 저장소 등록 2026-10-18(`3decda2`). 변환: `scripts/prepare-assets.mjs`. 원본 식별표: `README.md` 「원본 이미지 식별표」. 원본 `image/`(Git 제외). 프롬프트 기록 없음 | 기록 없음. CREDITS는 "기존 프로젝트 제공 이미지 · 확인 필요" | `scripts/prepare-assets.mjs`, `README.md`, `public/assets/CREDITS.md` 「기존 프로젝트 제공 이미지」 | 근거 약함 |
| I-2 | `volcano-eruption.webp` | 1개 · 402KB | 기록 없음. `prepare-assets.mjs`의 10장 목록에도 없음 | 저장소 첫 등록 2026-10-18(`3decda2`). 생성·전달 기록 없음 | 기록 없음 | `public/assets/CREDITS.md` 「기존 프로젝트 제공 이미지」(확인 필요로 적힘) | **출처 미확인** |
| I-3 | `map.webp` (원본 `map-original.png`, PNG는 배포 제외) | 1개 · 702KB | 기록 없음. `map-original.png`를 WebP로 바꾼 스크립트만 있음 | 저장소 첫 등록 2026-10-18. `scripts/prepare-assets.mjs` 9행 | 기록 없음 | `scripts/prepare-assets.mjs`, `public/assets/CREDITS.md` | **출처 미확인** |
| I-4 | `title-logo.webp` | 1개 · 83KB | 기록 없음. `README.md`에 ChatGPT 로고 원본(`09_38_28.png`)이 "메인 로고 후보"로 적혀 있으나 이 파일과 연결한 기록은 없음 | 저장소 첫 등록 2026-10-18 | 기록 없음 | `README.md`, `public/assets/CREDITS.md` | **출처 미확인** |
| I-5 | `river-sprite.webp` | 1개 · 9KB | 기록 없음 | 저장소 첫 등록 2026-10-18 | 기록 없음 | `public/assets/CREDITS.md` | **출처 미확인** |
| I-6 | `city-calm.webp` | 1개 · 315KB | 기록 없음. 변환 스크립트도 없음 | 저장소 첫 등록 2026-10-18 | 기록 없음 | `public/assets/CREDITS.md` | **출처 미확인** |
| I-7 | 초기 리버·표본 `river-hero.webp`, `rock-0`~`rock-3.webp`, `river-pose-0`~`river-pose-3.webp` | 9개 · 672KB | Codex 내장 이미지 생성(스크립트가 `C:/Users/.../.codex/generated_images/...png`를 읽음) | 저장소 첫 등록 2026-10-18. `scripts/prepare-assets.mjs`(river-hero), `scripts/prepare-extra-assets.mjs`(표본 4·포즈 4). 프롬프트 기록 없음 | 계정·요금제 기록 없음 | 위 두 스크립트, `public/assets/CREDITS.md`(확인 필요로 적힘) | 근거 약함 |
| I-8 | 2026-10-18 묶음 `map-adventure`, `tool-water`·`tool-lens`·`tool-camera`·`tool-box`·`tool-compass`·`tool-flag`, `hero-lens`·`hero-brush`·`hero-cheer`·`hero-protect` (.webp) + `generated-manifest.json` | 12개 · 1.2MB | OpenAI image generation(Codex 내장, 스크립트 원본 경로 `.codex/generated_images`) | 2026-10-18. `public/assets/generated-manifest.json`, 원본 `image/generated-20261018/`, 가공 `scripts/prepare-adventure-assets.mjs`. 프롬프트 기록 없음 | 요금제 기록 없음(CREDITS: WARNING) | `public/assets/generated-manifest.json`, `public/assets/CREDITS.md` | 근거 약함 |
| I-9 | `hero-protect-mask.webp` | 1개 · 238KB | 기록 없음. 원본 PNG `assets/raw-png/hero-protect-mask.png`만 있음(`.work/masked-river-reference/`에 2026-11-09 생성 이미지 흔적이 있으나 도구 기록 없음) | 2026-11-09(`9a94020`, 커밋 본문에 출처 없음) | 기록 없음 | `assets/raw-png/hero-protect-mask.png` | **출처 미확인** |
| I-10 | `og-image.jpg` (링크 미리보기) | 1개 · 235KB | 프로젝트에서 기존 지도·제목·리버 그림을 합성(1200×630) | 2026-11-09(`6511716`), `docs/reviews/UPGRADE-RESULT-20261109.md`. 합성 자체는 기록 있음 | 들어간 제목 로고(I-4)와 지도 원본의 출처가 미확인 | `docs/reviews/UPGRADE-RESULT-20261109.md` | **출처 미확인** |
| I-11 | `residents/{river,volcano,rocks,city,safety}.webp` | 5개 · 334KB | OpenAI image generation, 기준 그림 `hero-lens.webp` | 2026-11-02. `generated-manifest.json`의 `residentSet`. 프롬프트 기록 없음 | 요금제 기록 없음 | `public/assets/generated-manifest.json` | 근거 약함 |
| I-12 | `npc-expressions/{river,volcano,rocks,city,safety}-{neutral,happy,think}.webp` | 15개 · 2.1MB | 기록 없음 | 2026-11-13(`7223101` "Refresh resident dialogue and River narration", 본문 없음). 매니페스트·프롬프트·CREDITS 항목 없음 | 기록 없음 | (근거 없음) git 이력만 | **출처 미확인** |
| I-13 | `characters/river-walk.webp` + `river-walk.json` | 2개 · 230KB | 내장 OpenAI 이미지 생성 | 2026-11-03. 프롬프트 `docs/design/river-walk-prompts.md`, 원본 `assets/raw-png/characters/river-walk-20261103/`, 가공 `scripts/prepare-river-sprite.mjs` | 요금제 기록 없음 | `public/assets/characters/river-walk.json`, `docs/design/river-walk-prompts.md` | 근거 약함 |
| I-14 | 2026-10-24 배경·소품 `art/expedition-base`, `discovery-observatory`, `field-workbench`, `river-sand-model`, `volcano-mountain`, `volcano-tray`, `volcano-syringe`, `geologist-brush`, `safety-cushion`, `expedition-medallion` + `art/manifest.json` | 11개 · 1.8MB | OpenAI built-in image generation | 2026-10-24. `public/assets/art/manifest.json`, 원본 `assets/raw-png/art-20261024/`, 프롬프트 핵심 `docs/ART-UPGRADE-20261024.md` | 요금제 기록 없음 | `public/assets/art/manifest.json`, `assets/CREDITS.md` 「AI 아트 고도화」 | 근거 약함 |
| I-15 | 스테이지 배경 `art/*-v2.webp` 10장(river-observatory, river-canyon, volcano-workshop, volcano-caldera, rocks-crystal-cave, rocks-quarry-atelier, city-harbor, city-message-square, safety-island-classroom, safety-evacuation-garden) + `art/stage-backgrounds.json` | 11개 · 3.8MB | OpenAI built-in image generation, 화풍 기준 `map-adventure.webp` | 2026-10-24. `public/assets/art/stage-backgrounds.json`, 원본 `assets/raw-png/stage-backgrounds-20261024/`, 프롬프트 조건 `docs/STAGE-BACKGROUNDS-20261024.md` | 요금제 기록 없음 | `public/assets/art/stage-backgrounds.json` | 근거 약함 |
| I-16 | `art/ui/*.webp` 23장(parchment-panel, paper-card, certificate-frame, dust-crust, specimen-tray, notice-board, indoor-wall, window-frame, glass-pane, dust-mask, time-knob, warning-sign, school-desk, school-floor, flowerbed, broken-glass, fallen-shelf, exit-mat, playground, town-ground, house-roof, brick-wall, utility-pole) + `manifest.json` | 24개 · 1021KB | Higgsfield `gpt_image_2_5`(high, 1k), 기준 그림 `tool-box.webp`·`classroom.webp` | 2026-10-25. `public/assets/art/ui/manifest.json`, 원본 `image/generated-20261025-design/`, 가공 `scripts/prepare-design-art.mjs` | "Basic 요금제 크레딧 사용"만 기록. 상업 이용 조건 확인 기록 없음(`_shared/voice-provenance-20261118.md`: Higgsfield "저장소에 요금제 문구 없음") | `public/assets/art/ui/manifest.json`, `public/assets/CREDITS.md` 「디자인 고도화 소품」 | 근거 약함 |
| I-17 | `art/hero-hold-leg-v1.webp` | 1개 · 127KB | 내장 `image_gen`으로 기존 보호 자세 그림을 편집 | 2026-10-25. `docs/reviews/REQUESTED-FIXES-20261025.md` 55행, 원본·프롬프트 `image/generated-20261025/hero-hold-leg-source.png`, `hero-hold-leg-prompt.txt` | 요금제 기록 없음 | `docs/reviews/REQUESTED-FIXES-20261025.md` | 근거 약함 |
| I-18 | `art/river-sand-wet-v1.webp`, `art/river-sediment-fan-v1.webp` | 2개 · 155KB | OpenAI 내장 이미지 생성 | 2026-11-03. 프롬프트 `docs/design/river-water-prompts.md`, 원본 `assets/raw-png/river-water-20261103/` | 요금제 기록 없음 | `public/assets/CREDITS.md` 「물길 실험 물·흙 표현」 | 근거 약함 |
| I-19 | `art/rock-basalt-study-v1`, `art/rock-granite-study-v1`, `art/volcano-ash-puff-{0,1,2}-v1` (.webp) | 5개 · 557KB | OpenAI 내장 이미지 생성 | 2026-11-03. 프롬프트 `docs/design/volcano-rock-polish-prompts.md`, 원본 `assets/raw-png/stage-polish-20261103/` | 요금제 기록 없음 | `public/assets/CREDITS.md` 「화산·암석 관찰 표현」 | 근거 약함 |
| I-20 | `art/record-tower-restored-v1.webp` | 1개 · 317KB | OpenAI 내장 이미지 생성, 참고 `references/video-storyboard/final-03.png` | 2026-11-05. 프롬프트 `docs/design/record-tower-restored-prompt.md`, 원본 `assets/raw-png/record-tower-20261105/` | 요금제 기록 없음 | `public/assets/CREDITS.md` 「복구된 기록탑」 | 근거 약함 |
| I-21 | `art/river-water-current-v2.webp`, `art/river-sediment-bank-v2.webp` | 2개 · 204KB | built-in image_gen | 2026-11-07. 프롬프트·원본 `assets/generated/river-materials-20261107/generation.json` | 요금제 기록 없음 | `assets/generated/river-materials-20261107/generation.json` | 근거 약함 |
| I-22 | 전투 스프라이트 `art/geo-rubble-sprites`, `geo-rubble-sprites-v2`, `river-combat`, `river-combat-v2`, `river-combat-v3` (.webp + 같은 이름 .json) | 10개 · 474KB | OpenAI built-in image generation(각 json의 `generator`) | 2026-11-09·11-10·11-14. 각 json(날짜·원본 해시), 가공 `scripts/prepare-river-combat-v2.mjs`, `docs/2026-11-10-river-combat-polish.md`. 프롬프트 기록 없음 | 요금제 기록 없음 | `public/assets/art/*.json` | 근거 약함 |
| I-23 | `art/river-upper-photo-v1.webp`, `art/river-lower-photo-v1.webp` + `river-photo-v1.json` | 3개 · 571KB | "AI-generated original educational landscapes"라고만 적힘. 생성 도구 이름 없음 | 2026-11-10(`706248c`). `public/assets/art/river-photo-v1.json`, `docs/2026-11-10-river-combat-polish.md` 12행 | 기록 없음 | `public/assets/art/river-photo-v1.json` | **출처 미확인** |
| I-24 | `art/river-field-clues-v3.webp`, `art/ash-classroom-v3.webp` | 2개 · 410KB | ElevenLabs creative connector `gpt-image-2.5-sunburst`(각 4안 중 1안) | 2026-11-12. 프롬프트·생성 ID·flow ID `assets/generated/science-20261112/generation.json`, 원본 `image/generated-20261112/` | ElevenLabs Starter 유료 요금제, 상업 이용 가능(2026-11-18 사용자 확인, `assets/CREDITS.md`). 단 `generation.json`의 `licenseReview`는 "독립 확인 안 함"으로 남아 있음 | `assets/generated/science-20261112/generation.json`, `assets/CREDITS.md` 「과학 관찰 삽화 추가」 | 확인됨 |
| I-25 | `art/posters/{airport,farm,spa}-{guide,retry}.webp` | 6개 · 609KB | Codex 기본 이미지 생성 도구, 한 장씩 | 2026-11-15(`a23298a`). 프롬프트 전문 `assets/generated/city-posters-20261115/prompts.md` | 요금제 기록 없음 | `assets/CREDITS.md` 「도시 안내 포스터」 | 근거 약함 |
| I-26 | `art/river-footbridge-v1.webp` | 1개 · 109KB | 이미지 생성(커밋 "Use generated bridge art", 프롬프트 파일 이름 `imagegen-prompt.txt`). 도구 이름은 명시 안 됨 | 2026-11-15(`0161c84`). 프롬프트 `.work/bridge-art-20261115/imagegen-prompt.txt`(Git 제외) | 요금제 기록 없음 | `.work/bridge-art-20261115/imagegen-prompt.txt` | 근거 약함 |
| I-27 | `art/river-connection-map-v1.webp` | 1개 · 255KB | 기록 없음 | 2026-11-15(`a76b8a8`, 본문 없음). 매니페스트·프롬프트 없음 | 기록 없음 | (근거 없음) git 이력만 | **출처 미확인** |
| I-28 | 활동 소품 `art/stages/{city,river,rocks,safety,volcano}/*.webp` 16장 + 각 `manifest.json` 5개 | 21개 · 309KB | Higgsfield `gpt_image_2_6`(low·medium) | 2026-11-16(`86d1d38`). 각 `manifest.json`, 원본 `image/generated-20261116-*/`, 가공 `scripts/prepare-{city,river,rocks,safety,volcano}-stage-art.mjs`. 프롬프트 기록 없음 | Higgsfield 요금제 기록 없음 | `public/assets/art/stages/*/manifest.json` | 근거 약함 |
| I-29 | 기록탑 `art/tower/*.webp` 11장(wall, frame, hook, lamp-off, lamp-on, rail-tile, sketch-×5) + `manifest.json` | 12개 · 249KB | Higgsfield `gpt_image_2_6`(medium, 1k) | 2026-11-16. `public/assets/art/tower/manifest.json`, 원본 `image/generated-20261116-record-tower/`, 가공 `scripts/prepare-record-tower-art.mjs` | Higgsfield 요금제 기록 없음 | `public/assets/art/tower/manifest.json` | 근거 약함 |
| I-30 | `art/rocks-basalt-granite-v1.webp` | 1개 · 217KB | Codex 기본 이미지 생성(`gpt-imagegen` 스킬) | 2026-11-17(`ab6571a`). 프롬프트 전문 `assets/CREDITS.md` 「기록탑 암석 액자」 | 요금제 기록 없음 | `assets/CREDITS.md` | 근거 약함 |
| I-31 | 성취 카드 `reward-cards/card-{1..5}-*.webp`, `thumb-{1..5}-*.webp` | 10개 · 723KB | ChatGPT 앱의 Codex 내장 이미지 도구(`gpt-imagegen`), 리버·탐험 기지 그림 참고 | 2026-11-18 12:19~12:25. 생성 로그 `_scratch/reward-cards-20261118/queue.log`, 장면 설정 `specs/07.json`, 공통 프롬프트 `queue.mjs`, 원본 `gen/07/` | 요금제 기록 없음 | `public/assets/CREDITS.md` 「성취 카드」, `_scratch/reward-cards-20261118/` | 근거 약함 |

## 2. 영상

| # | 파일(묶음) | 개수·용량 | 만든 곳(생성 도구·제공처·라이브러리) | 만든 날·기록 위치(프롬프트 기록, 생성 로그, CREDITS, 계약) | 이용 조건 | 근거 파일 경로 | 상태 |
|---|---|---|---|---|---|---|---|
| V-1 | 이야기 영상 `story/intro.mp4`(약 17초), `story/final.mp4`(약 17초)와 첫 화면 `intro.webp`·`final.webp` — **영상 그림과 원음(배경 소리)** | 4개 · 10.1MB | "프로젝트 제작자가 제공한 파일"이라고만 적힘. 만든 사람·업체·생성 도구 기록 없음 | 원본 전달 2026-11-03(`assets/source-media/video/intro.mp4`, `final.mp4`, Git 제외), 앱 적용 2026-11-04(`8966c38`), 5MB 아래 재인코딩 2026-11-09(`292b8ef`), 내레이션 교체 2026-11-13(`7223101`), 자막 입힘 2026-11-18(`b025bbe`, `docs/film-captions-20261118/`). 스토리보드 그림 `references/video-storyboard/`(출처 기록 없음). 계약·발주 기록 없음 | 기록 없음 | `docs/STORY-MEDIA.md`, `assets/source-media/README.md`, `public/assets/CREDITS.md` 「효과음」 첫 문단, `docs/story-narration-20261113.json`("Original film ambience ... retained") | **출처 미확인** |
| V-2 | V-1 두 영상 소리 트랙 안의 리버 내레이션 | 10줄(V-1 파일 안) | ElevenLabs `eleven_v4`, 목소리 Hun 훈(`AjALR5PRxl87zOoe9Q31`) | 2026-11-13. 줄별 생성 ID·받아쓰기·해시 `docs/story-narration-20261113.json` | ElevenLabs 유료 요금제(당시 Starter), 상업 이용(`_shared/voice-provenance-20261118.md` 사용자 확인) | `docs/story-narration-20261113.json`, `_shared/voice-provenance-20261118.md` 7번 표 | 확인됨 |
| V-3 | `city/airport-flight-suspended.mp4`, `city/airport-flight-resumed.mp4` | 2개 · 5.3MB | **영상 생성 도구 기록 없음.** 시작 그림은 Codex 기본 이미지 생성으로 만들었고(`output/airport-video-references-20261115/reference-image-prompts.md`), 영상 도구에 넣을 프롬프트만 남아 있음 | 2026-11-15(`8446b65`, 본문 없음). 프롬프트 `output/airport-video-references-20261115/영상-프롬프트.md`, `output/airport-video/video-prompts.md`(Git 제외) | 기록 없음 | `output/airport-video-references-20261115/` | **출처 미확인** |
| V-4 | 개념 영상 7편 `concepts/{river-0,river-1,volcano-0,rocks-0,rocks-1,safety-0,safety-1}.{mp4,webm,webp}` + `concepts/manifest.json` | 22개 · 약 12.3MB | 프로젝트 자체 제작: HyperFrames 0.9.26 장면(`films/concepts/`)을 FFmpeg로 인코딩한 15초 무음 클립. 그림은 전부 게임에 있던 것(새 생성 0장), 이름표·물줄기 등은 코드 | 2026-11-09 재제작(처음 등록 2026-10-25 `5254860`, 최근 2026-11-19 `d3eeae5` 자막 위치). 검토 `films/concepts/REVIEW.md`, 재렌더 `node films/concepts/render.mjs` | 제작 코드는 자체 작성. 안에 든 그림은 I-1·I-7·I-8·I-14·I-18·I-19·I-17·I-16(school-desk) 등 근거 약함 그림 | `films/concepts/REVIEW.md`, `films/concepts/scenes.js`, `assets/CREDITS.md` 「개념 영상·프로그램·글꼴」 | 근거 약함 |
| V-5 | 개념 영상 3편 `concepts/{volcano-1,city-0,city-1}.{mp4,webm,webp}` | 9개 · 약 8.3MB | V-4와 같음(HyperFrames 자체 제작) | V-4와 같음 | 안에 출처 미확인 그림이 들어 있음: volcano-1 ← `volcano-eruption.webp`(I-2), city-0·city-1 ← `city-calm.webp`(I-6), city-1 ← `hero-protect-mask.webp`(I-9) | `films/concepts/scenes.js`, `films/concepts/assets/art/` | **출처 미확인** |

## 3. 음악

| # | 파일(묶음) | 개수·용량 | 만든 곳(생성 도구·제공처·라이브러리) | 만든 날·기록 위치(프롬프트 기록, 생성 로그, CREDITS, 계약) | 이용 조건 | 근거 파일 경로 | 상태 |
|---|---|---|---|---|---|---|---|
| M-1 | 메인 테마 `audio/main-theme.mp3`(전달 이름 `intro.mp3`), 파이널 테마 `audio/final-theme.mp3`(전달 이름 `final.mp3`, 24초) | 2개 · 4.0MB | "프로젝트 제작자가 제공한 음악"이라고만 적힘. 작곡자·생성 도구 기록 없음. 10~16번에 쓴 Suno 배경음 지침(`_shared/BGM-APPLY-BRIEF-20261117.md`)은 07번이 대상이 아니고, 07번 곡은 그보다 먼저(2026-11-03) 들어옴 | 원본 전달 2026-11-03(`assets/source-media/audio/`, Git 제외), 앱 적용 2026-11-04(`8966c38`). 생성 기록·계약 없음 | 기록 없음. `public/assets/audio/CREDITS.md`: "아래 CC0 표기는 외부 효과음에만 해당" | `docs/STORY-MEDIA.md`, `assets/source-media/README.md`, `public/assets/audio/CREDITS.md` 「탐험과 수첩 소리」 | **출처 미확인** |

## 4. 효과음

| # | 파일(묶음) | 개수·용량 | 만든 곳(생성 도구·제공처·라이브러리) | 만든 날·기록 위치(프롬프트 기록, 생성 로그, CREDITS, 계약) | 이용 조건 | 근거 파일 경로 | 상태 |
|---|---|---|---|---|---|---|---|
| S-1 | `audio/click`, `pickup`, `place`, `observe`, `complete`, `hint`, `brush`, `move` (.mp3) + `Kenney-CC0.txt` | 9개 · 22KB | Kenney Interface Sounds(원본 `click_003.ogg` 등), FFmpeg 모노 MP3 변환 | 받은 날 2026-10-22, 등록 2026-10-25. 파일별 원본 이름 `public/assets/audio/CREDITS.md` 첫 표. 원본 `.work/media-sources/` | CC0 1.0, 라이선스 원문 동봉 | `public/assets/audio/CREDITS.md`, `public/assets/audio/Kenney-CC0.txt` | 확인됨 |
| S-2 | `audio/water.mp3` | 1개 · 4KB | Brian MacIntosh / BMacZero, Bubble Sound Effects(`bubbles-single3.wav`), 2026-11-10 +20dB | 2026-10-22. 출처 https://opengameart.org/content/bubble-sound-effects | CC0 1.0 | `public/assets/audio/CREDITS.md` | 확인됨 |
| S-3 | Kenney OGG 11개: `trail-step`, `notebook-open`, `notebook-page`, `tool-reward`, `workplace-open`, `lamp-light`, `resident-pop`, `village-wake`, `stamp`, `festival`, `letter-open` (.ogg) | 11개 · 159KB | Kenney 「50 RPG sound effects」「85 Short music jingles」「Interface Sounds」(OpenGameArt·kenney.nl) | 2026-11-02·11-07 받음, 2026-11-10 두 파일 음량만 조절. 파일별 원본 이름 `public/assets/audio/CREDITS.md` 두 표 | CC0 1.0(원본 페이지 표기) | `public/assets/audio/CREDITS.md` 「탐험과 수첩 소리」「마을이 살아나는 소리」 | 확인됨 |
| S-4 | 합성음 14개: `success`, `good`, `coin`, `lift`, `retry`, `twinkle`, `capture`, `alert`, `hit`, `defeat`, `reward`, `village-rise`, `stamp-ding`, `fanfare` (.mp3) | 14개 · 119KB | 프로젝트 자체 제작: `scripts/make-sfx.mjs`가 사인파 계산으로 합성(외부 샘플 없음) | 2026-11-16(`0e1f2f0`). 다시 만들기 `node scripts/make-sfx.mjs` | 자체 제작물 | `public/assets/audio/CREDITS.md` 「성취 효과음」, `scripts/make-sfx.mjs` | 확인됨 |
| S-5 | 지도 전투음 `audio/map-{swing,hit-1,hit-2,hit-heavy,exit,appear,bump,victory}.mp3` | 8개 · 86KB | Freesound 제작자 7명(qubodup, sgossner, Yoyodaman234, insanity54, valeofhearts, IanStarGem, Faulkin, Fupicat) → 과학34 공통 효과음 라이브러리 → 이름만 바꿔 복사 | 2026-11-17 라이브러리, 2026-11-18 적용(`f10a36e`). 파일별 원본 주소 `public/assets/audio/CREDITS.md`, 라이브러리 `_shared/sfx-library-20261117/manifest.json`(13개 모두 `license: CC0`, `license_rechecked: true` 확인) | CC0 1.0 | `public/assets/audio/CREDITS.md` 「지도 돌먼지 대장 전투음」 | 확인됨 |
| S-6 | 성취 카드음 `audio/card-{whoosh,reveal,epic,slot,complete}.mp3` | 5개 · 98KB | Freesound(qubodup, ZenithInfinitiveStudios, CogFireStudios, DeltaCode, el_boss) → 같은 라이브러리 | 2026-11-18(`9dab5e6`). 파일별 원본 주소 `public/assets/audio/CREDITS.md` | CC0 1.0 | `public/assets/audio/CREDITS.md` 「성취 카드 효과음」, `_shared/sfx-library-20261117/manifest.json` | 확인됨 |

## 5. 목소리

| # | 파일(묶음) | 개수·용량 | 만든 곳(생성 도구·제공처·라이브러리) | 만든 날·기록 위치(프롬프트 기록, 생성 로그, CREDITS, 계약) | 이용 조건 | 근거 파일 경로 | 상태 |
|---|---|---|---|---|---|---|---|
| VO-1 | 리버 안내 `voices/guide-*.mp3` + `river-elevenlabs-manifest.json` | 28개 · 1.7MB | ElevenLabs `eleven_v4`, Hun 훈(`AjALR5PRxl87zOoe9Q31`), flow `YYzDclBHKNghr6tlgt9j` | 2026-11-13(`7223101`). 27줄 모두 생성 ID·받아쓰기·해시 기록 | ElevenLabs 유료 요금제(Starter), 상업 이용(사용자 확인). 실제 사람 목소리 복제 아님 | `public/assets/voices/river-elevenlabs-manifest.json`, `_shared/voice-provenance-20261118.md` | 확인됨 |
| VO-2 | 리버 팝업·개념·힌트·작전 `voices/el/*.mp3`(guide-speech 208, guide-hint 90, guide-concept 40, guide-op 36, guide-map 17 등) | 410개 · 22.5MB | ElevenLabs `eleven_v4`, Hun 훈. 일부는 MCP, 2026-11-18 밤 추가분은 ElevenLabs 공식 API(`requestId` 기록) | 2026-11-18(`6f90e62` 등). 줄별 기록 `docs/VOICE-FILL-20261118.json`(410개 모두 대응 확인) | ElevenLabs 유료 요금제(11-18 당일 Starter → Creator), 상업 이용(사용자 확인) | `docs/VOICE-FILL-20261118.json`, `_shared/voice-provenance-20261118.md` | 확인됨 |
| VO-3 | 돌먼지 대장 `voices/villain/*.mp3` | 25개 · 1.0MB | ElevenLabs `eleven_v4`, Harry - Character(`wMrz30qBeYiSkAtnZGtn`) | 2026-11-18(`f151607`). 줄별 기록 `docs/VOICE-FILL-20261118.json` | 위와 같음 | `docs/VOICE-FILL-20261118.json` | 확인됨 |
| VO-4 | 주민 `voices/npc-elevenlabs/*.mp3` + `manifest.json` | 26개 · 1.7MB | ElevenLabs Voice Library `eleven_v4`: 나루 Rowan, 마그 Klamon, 지오 Taek, 타임 Rumi, 세이프 Jisun | hello·chat·stamp 20개 2026-11-13(`manifest.json`, 생성 ID·해시), thanks 5개 2026-11-18(`docs/VOICE-FILL-20261118.json`) | 위와 같음 | `public/assets/voices/npc-elevenlabs/manifest.json`, `docs/VOICE-FILL-20261118.json` | 확인됨 |
| VO-5 | 옛 주민 음성 `voices/*-{hello,chat0,chat1,stamp,thanks}.m4a` 25개 + `MOMO-SOURCE.txt`, `momo-manifest-20261110.json` (**앱에서 재생 안 함**, 배포에는 포함) | 27개 · 1.4MB | 모모(Momo) 로컬 Qwen3-TTS(preset 목소리), afconvert로 AAC 변환 | 2026-11-07 생성, 2026-11-09 등록(`e9e3b90`). 대사·preset·원본 UUID `scripts/voices.json`, 2026-11-09 UUID 25개 대조 `docs/AUDIO-PROVENANCE-20261109.md` | 모델 라이선스 Apache-2.0. 생성 음성의 저작권 지위는 별개라고 문서가 밝힘 | `scripts/voices.json`, `docs/AUDIO-PROVENANCE-20261109.md`, `public/assets/voices/MOMO-SOURCE.txt` | 근거 약함 |
| VO-6 | 옛 주민 감사 `voices/npc-reward/*-thanks.mp3` 5개 + `manifest.json` (**앱에서 재생 안 함**, 배포에는 포함) | 6개 · 411KB | Higgsfield Seed Audio 1.0(기존 주민 녹음을 참조) | 2026-11-14(`73196b6`). job ID·해시 `public/assets/voices/npc-reward/manifest.json` | Higgsfield 요금제 기록 없음 | `public/assets/voices/npc-reward/manifest.json`, `docs/VOICE-FILL-20261118.json` `unused` | 근거 약함 |

## 6. 글꼴

| # | 파일(묶음) | 개수·용량 | 만든 곳(생성 도구·제공처·라이브러리) | 만든 날·기록 위치(프롬프트 기록, 생성 로그, CREDITS, 계약) | 이용 조건 | 근거 파일 경로 | 상태 |
|---|---|---|---|---|---|---|---|
| F-1 | `fonts/NanumSquareNeoTTF-bRg.woff2`, `NanumSquareNeoTTF-cBd.woff2` + `NanumSquareNeo-OFL.txt`, `NanumSquareNeo-SOURCE.json` | 4개 · 766KB | 네이버 나눔스퀘어 네오(공식 배포 ZIP) | 2026-11-10 받음(`c730a78`). 공급처·파일 해시 `NanumSquareNeo-SOURCE.json` | SIL OFL 1.1, 원문 동봉. 글꼴 자체 판매 외 상업 사용 가능 | `public/assets/fonts/NanumSquareNeo-SOURCE.json`, `NanumSquareNeo-OFL.txt` | 확인됨 |

참고: `fonts/Jua-OFL.txt`(4KB)는 배포에 들어가지만 Jua 글꼴 파일(`jua-*.woff2`)은 빌드에서 빠진다. 옛 화면 기록용 라이선스 문서일 뿐이라 행으로 세지 않았다.

## 7. 3D 모델

| # | 파일(묶음) | 개수·용량 | 만든 곳(생성 도구·제공처·라이브러리) | 만든 날·기록 위치(프롬프트 기록, 생성 로그, CREDITS, 계약) | 이용 조건 | 근거 파일 경로 | 상태 |
|---|---|---|---|---|---|---|---|
| 3D-1 | `models/rock-basalt-porous.glb`, `rock-granite-white.glb`, `volcano-exterior.glb`, `terrain-soil-block.glb` + `README.md` | 5개 · 4.1MB | Meshy image-to-3D. 입력 그림은 프로젝트 자체 AI 그림(`image/3d-base/`, Higgsfield·게임 그림) | 2026-10-26(`1bc2eb9`). 계획·프롬프트 `docs/3D-ASSETS.md`, 원본 GLB `assets/raw-glb/`, 텍스처만 축소 `scripts/prepare-models.mjs` | Meshy 상업 이용 가능한 플랜(2026-10-26 사용자 확인) | `public/assets/CREDITS.md` 「3D 모델 (Meshy image-to-3D)」, `docs/3D-ASSETS.md` | 확인됨 |

## 8. 라이브러리

| # | 파일(묶음) | 개수·용량 | 만든 곳(생성 도구·제공처·라이브러리) | 만든 날·기록 위치(프롬프트 기록, 생성 로그, CREDITS, 계약) | 이용 조건 | 근거 파일 경로 | 상태 |
|---|---|---|---|---|---|---|---|
| L-1 | `vendor/phaser-3.90.0.min.js` + `Phaser-LICENSE.md` | 2개 · 1.1MB | Phaser 3.90.0, Richard Davey · Phaser Studio Inc. | 2026-10-18 등록 | MIT, 원문 동봉 | `public/assets/vendor/Phaser-LICENSE.md` | 확인됨 |
| L-2 | `vendor/three/three.module.min.js`, `three.core.min.js`, `addons/loaders/GLTFLoader.js`, `addons/utils/BufferGeometryUtils.js`, `addons/utils/SkeletonUtils.js` + `three-LICENSE.txt` | 6개 · 895KB | three.js r185(0.185.1), Three.js Authors | 2026-10-25 등록(`92189a1`). 파일 머리 `@license` 주석 | MIT, 원문 동봉, CDN 없이 로컬 | `public/assets/vendor/three/three-LICENSE.txt` | 확인됨 |

`package.json`에는 런타임 npm 의존성이 없다. `src/`·`index.html`에 다른 외부 코드의 라이선스 주석은 없고, `index.html`이 부르는 외부 주소는 자기 운영 주소(`geovalley.pages.dev`)뿐이다. 조작 아이콘은 `src/ui.js`의 자체 SVG, 성취 카드 모듈 `src/reward-cards.js`·`.css`는 `_shared/reward-cards/`의 과학34 공통 자체 코드다.

## 배포에 함께 들어가는 기록 문서 (행으로 세지 않음)

`CREDITS.md`, `audio/CREDITS.md`, `audio/Kenney-CC0.txt`, `fonts/*-OFL.txt`, `fonts/NanumSquareNeo-SOURCE.json`, `vendor/Phaser-LICENSE.md`, `vendor/three/three-LICENSE.txt`, `generated-manifest.json`, `art/**/manifest.json`·`*.json`, `voices/**/manifest.json`, `voices/MOMO-SOURCE.txt`, `voices/momo-manifest-20261110.json`, `models/README.md`, `concepts/manifest.json`. 위 표의 해당 묶음 개수에 포함했다.

## 대장을 만들며 본 점 (고치지 않음)

- 배포되는 `public/assets/CREDITS.md`와 저장소 `assets/CREDITS.md`의 내용이 갈라져 있다. 배포본에는 나눔스퀘어 네오, ElevenLabs 목소리, 지도 전투음 표 줄, 2026-11-12 과학 삽화, 도시 포스터, 기록탑 암석 액자 항목이 없고 Jua를 현재 글꼴처럼 적고 있다. 반대로 `assets/CREDITS.md`에는 3D 모델·성취 카드 항목이 없다.
- `_shared/voice-provenance-20261118.md`는 07번 리버 2026-11-18분을 161개로 적었지만, 실제 배포본 `voices/el/`은 410개이고 `docs/VOICE-FILL-20261118.json`에 410개가 모두 기록돼 있다. 색인 쪽 숫자가 낡았다.
- 앱에서 재생하지 않는 파일이 배포에 들어간다: VO-5 옛 주민 `.m4a` 25개, VO-6 Higgsfield 감사 음원 5개, 기록용으로 남긴 옛 효과음(`complete`·`place`·`pickup`·`hint`·`observe`·`tool-reward`·`village-wake`·`stamp`·`festival`·`hit`·`defeat`, 출처는 확인됨). 근거가 약한 VO-5·VO-6은 빌드에서 빼면 대장에서 사라진다(뺄지는 사용자 결정).
- I-24의 `generation.json`은 아직 "상업 조건 독립 확인 안 함"으로 적혀 있어, `assets/CREDITS.md`의 사용자 확인(2026-11-18)과 문구가 다르다.

## 사용자가 줘야 하는 자료

받으면 해당 행을 다시 판정할 수 있다. 굵은 것은 출처 미확인 행이라 먼저 필요하다.

1. **인트로·엔딩 영상(V-1)**: 2026-11-03에 받은 `intro.mp4`·`final.mp4`를 누가(업체·사람) 또는 무슨 도구로 만들었는지. 업체 제작이면 계약서·발주서나 납품 메일, 이용 범위가 적힌 문서. 생성 도구로 직접 만들었으면 도구 이름, 생성 화면 캡처나 작업 페이지 주소, 그 당시 요금제(상업 이용) 화면 캡처. 영상 안의 원음(배경 소리)과 `references/video-storyboard/` 그림을 어디서 가져왔는지도.
2. **메인·파이널 테마(M-1)**: 처음 받은 `intro.mp3`·`final.mp3`의 작곡자·업체 계약서나 메일, 또는 생성 도구(예: Suno)의 곡 페이지 주소·생성일과 생성 당시 유료 요금제 캡처.
3. **공항 영상 2편(V-3)**: 2026-11-15에 `output/airport-video-references-20261115/`의 그림·프롬프트로 영상을 만든 도구 이름, 생성 기록(작업 페이지·작업 ID), 그 도구의 요금제·상업 이용 화면 캡처.
4. **출처 미확인 단독 그림(I-2·I-3·I-4·I-5·I-6·I-9·I-12·I-23·I-27)**: `volcano-eruption`, `map-original.png`(→`map.webp`), `title-logo`, `river-sprite`, `city-calm`, `hero-protect-mask`, `npc-expressions` 15장, `river-upper/lower-photo-v1`, `river-connection-map-v1`를 만든 도구·날짜·원본 파일·대화 공유 링크(ChatGPT로 만들었다면 그 대화 주소). `title-logo`가 `ChatGPT 이미지 2026년 9월 25일 오후 09_38_28.png`에서 나온 것이 맞는지 확인. 이 기록이 오면 I-10(og-image)과 V-5(개념 영상 3편)도 함께 다시 판정한다.
5. ChatGPT·Codex 이미지 생성 계정의 요금제 화면 캡처(생성 기간 2026-09-25~2026-11-18)와 OpenAI 이용약관의 출력물 권리 조항 캡처. 2026-09-25 ChatGPT 그림 원본(I-1)이 본인 계정에서 만든 것인지 확인. 대상: I-1, I-7, I-8, I-11, I-13, I-14, I-15, I-17, I-18, I-19, I-20, I-21, I-22, I-25, I-26, I-30, I-31 → 받으면 V-4도 다시 판정.
6. Higgsfield 요금제 캡처(2026-10-25 Basic 사용분, 2026-11-14·11-16 생성분)와 그 요금제의 상업 이용 조건 화면. 대상: I-16, I-28, I-29, VO-6.
7. 모모(Qwen3-TTS) 옛 주민 음성(VO-5)은 따로 받을 자료가 없다. 앱에서 쓰지 않으니 빌드에서 뺄지만 정해 주면 된다.
8. (선택, 이미 확인됨 행 보강) ElevenLabs 결제·요금제 내역 캡처(Starter 2026-11-12~11-17, Creator 2026-11-18) — I-24, V-2, VO-1~VO-4. Meshy 요금제 캡처(2026-10-26) — 3D-1. 효과음 원본 페이지 캡처(OpenGameArt 「50 RPG sound effects」「85 Short music jingles」「Bubble Sound Effects」, Freesound 13개 페이지) — S-2, S-3, S-5, S-6. CC0라 표기 의무는 없지만 원문을 같이 두면 근거가 더 단단해진다.
