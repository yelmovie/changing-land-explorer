# 움직이는 지오밸리 자료·저작권

## 도구·라이선스 검토 (2026-10-24)

| 도구·자료 | 사용 범위 | 확인한 근거 | 판정·남은 확인 |
|---|---|---|---|
| Phaser 3.90.0 | 지도·탐험 활동 | `public/assets/vendor/Phaser-LICENSE.md`, MIT | PASS · 원문 동봉 |
| Jua 웹 글꼴 | 제목·버튼 | `public/assets/fonts/Jua-OFL.txt`, SIL OFL 1.1, Woowahan Brothers Corp. | PASS · 원문 동봉 |
| Kenney Interface Sounds | 버튼·도구 효과음 8종 | `public/assets/audio/Kenney-CC0.txt`, CC0 1.0 | PASS · 출처와 원본 이름 동봉 |
| Brian MacIntosh / BMacZero | 물 효과음 | `public/assets/audio/CREDITS.md`, CC0 1.0 | PASS · 출처 동봉 |
| OpenAI 생성 이미지 | 아래 2026-10-18 제작 목록 | `public/assets/generated-manifest.json` | WARNING · 생성 당시 요금제·계정 조건 기록은 없음 |
| 기존 프로젝트 배경·표본·리버 원본 | 아래 기존 제공 이미지 목록 | 프로젝트 기존 자산 | 확인 필요 · 원본 제작 서비스·이용 조건의 상세 기록이 없음 |
| SVG → FFmpeg 개념 영상 | `public/assets/concepts/` 무음 클립 | `scripts/concepts/`, `docs/CONCEPT_MOTION.md` | 자체 작성 SVG 렌더, Remotion 의존 없음 |

앱 `package.json`은 외부 npm 런타임 의존성을 선언하지 않는다. 배포되는 게임 엔진·글꼴·효과음의 라이선스는 위와 같이 보관한다. 이 검토는 현재 파일에 있는 출처 기록을 확인한 범위이며, 확인이 필요한 기존 이미지의 상업 배포 허가를 보장하지 않는다.

## 이미지

모든 장면 그림은 학습용 재현이다. 실제 현장 사진, 실제 재해의 증거, 과학적 암석 사진으로 취급하지 않는다. 게임 안의 인물·사건 배치·날씨는 실제 사건의 사실 근거로 쓰지 않는다.

### 프로젝트 AI 제작 기록 — 2026-10-18

서비스: OpenAI image generation. 생성 기록: `public/assets/generated-manifest.json`. 원본 보관 경로: `image/generated-20261018/`. 요금제는 기존 제작 기록에 기재되지 않았다.

- 지도: `map-adventure.webp`.
- 탐험 도구: `tool-water.webp`, `tool-lens.webp`, `tool-camera.webp`, `tool-box.webp`, `tool-compass.webp`, `tool-flag.webp`.
- 리버 포즈: `hero-lens.webp`, `hero-brush.webp`, `hero-cheer.webp`, `hero-protect.webp`.

### 기존 프로젝트 제공 이미지

아래 파일의 제작 서비스·날짜·상업 이용 조건 상세는 현재 파일에서 확인되지 않아 추가 원본 기록 확인이 필요하다.

- 지도·제목: `map-original.png`, `map.webp`, `title-logo.webp`.
- 리버: `river-hero.webp`, `river-sprite.webp`, `river-pose-0.webp`~`river-pose-3.webp`.
- 강: `river-field.webp`, `river-lab.webp`.
- 화산: `volcano-eruption.webp`, `volcano-field.webp`, `volcano-lab.webp`.
- 암석: `rocks-lab.webp`, `rocks-table.webp`, `rock-0.webp`~`rock-3.webp`.
- 도시: `city-before.webp`, `city-calm.webp`, `city-eruption.webp`.
- 안전: `classroom.webp`, `school.webp`.

## 효과음

음원 파일은 `public/assets/audio/`에 로컬 보관한다. 배경 음악은 사용하지 않는다. 외부 요청 없이 효과음을 재생하며, 동시 1개·음소거·배경 탭 정지를 적용한다.

| 앱 파일 | 원본 | 제작자·출처 | 라이선스 |
|---|---|---|---|
| `click.mp3` | `click_003.ogg` | Kenney Interface Sounds | CC0 1.0 |
| `pickup.mp3` | `select_002.ogg` | Kenney Interface Sounds | CC0 1.0 |
| `place.mp3` | `drop_002.ogg` | Kenney Interface Sounds | CC0 1.0 |
| `observe.mp3` | `pluck_001.ogg` | Kenney Interface Sounds | CC0 1.0 |
| `complete.mp3` | `confirmation_002.ogg` | Kenney Interface Sounds | CC0 1.0 |
| `hint.mp3` | `open_002.ogg` | Kenney Interface Sounds | CC0 1.0 |
| `brush.mp3` | `scratch_003.ogg` | Kenney Interface Sounds | CC0 1.0 |
| `move.mp3` | `switch_002.ogg` | Kenney Interface Sounds | CC0 1.0 |
| `water.mp3` | `bubbles-single3.wav` | Brian MacIntosh / BMacZero, Bubble Sound Effects | CC0 1.0 |

원본·라이선스 상세: `public/assets/audio/CREDITS.md`와 `Kenney-CC0.txt`. FFmpeg로 모노 MP3 변환했다.

## 개념 영상·프로그램·글꼴

- 개념 영상: 자체 작성 SVG를 프레임으로 렌더하고 FFmpeg로 인코딩한 무음 학습 클립. 도구와 자막: `scripts/concepts/`, `src/concepts.js`, `docs/CONCEPT_MOTION.md`.
- Phaser 3.90.0: Copyright (c) 2024 Richard Davey, Phaser Studio Inc. · MIT License.
- Jua: Copyright (c) 2017 Woowahan Brothers Corp., Reserved Font Name Jua. Google Fonts 제공 OFL 글꼴. 한국어·라틴 WOFF2를 동봉했다.
- 게임 조작 아이콘은 프로젝트의 `src/ui.js`에 작성한 SVG 경로다.

## 권리 고지

ⓒ 2026 옐샘 & 아이스크림미디어. All rights reserved.

앱 화면 캡처·자체 제작 일러스트는 무단 복제·재배포·전용·상업적 이용을 금지한다.

외부 효과음·폰트·게임 엔진의 저작권은 각 원저작자에게 있으며, 각 자료의 공개 라이선스와 이용 조건을 따른다.

교육 내용 구성 참고: 교육부 2022 개정 과학과 교육과정과 프로젝트 수업 설계 자료. 세부 활동 설계와 학습 한계는 `docs/ADVENTURE_UPGRADE.md`, `docs/TABLET_EXPLORATION_DESIGN.md`에 기록했다.

## AI 아트 고도화 — 2026-10-24

OpenAI 내장 이미지 생성 도구로 프로젝트용 배경 3장과 소품 7개를 생성했어요. 원본 PNG는 assets/raw-png/art-20261024/, 배포용 WebP와 크기·알파·생성 도구 목록은 public/assets/art/manifest.json에 보관해요. 원본 캐릭터와 지도는 프로젝트 기존 자산을 유지했어요.

- 배경: expedition-base, discovery-observatory, field-workbench.
- 소품: river-sand-model, volcano-mountain, volcano-tray, volcano-syringe, geologist-brush, safety-cushion, expedition-medallion.
- 그림은 학습용 재현이에요. 물의 흐름·표식·판정·자막·버튼은 코드에서 별도로 처리해요.
- 기존 자료의 불명확한 제작 조건은 위의 확인 필요 항목을 그대로 유지해요.

## 스테이지 전용 배경 재생성 — 2026-10-24

초기 지도 map-adventure.webp를 그림체·팔레트 기준으로 OpenAI 내장 이미지 도구에서 배경 10장을 개별 생성했어요. 물길 관측소/강 협곡, 현무암 화산 연구실/분화구, 결정 동굴/채석장 표본 공방, 해안 마을/주민 광장, 섬 학교 교실/대피 정원이에요. 배포용 WebP와 원본·규격 기록은 public/assets/art/stage-backgrounds.json, 원본 PNG는 assets/raw-png/stage-backgrounds-20261024/에 있어요. 모두 학습용 재현이며 UI·조작·판정은 코드로 처리해요. 기존 배경은 덮어쓰지 않고 보존했어요.
