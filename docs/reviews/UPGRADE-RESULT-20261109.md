# 움직이는 지오밸리 · 고도화 결과 — 2026-11-09 밤

브랜치 `claude/upgrade-20261109`(worktree `wt/07`), 시작 `5dc5c3c`(운영본). 배포·push는 하지 않았다(메인 세션 담당). 점수는 `SCORE-20261109.md`, 계획은 `UPGRADE-PLAN-20261109.md`.

## 점수

- 최종스킬 10항목: **65 → 74 / 100**
- 디자인스킬 13항목: **119 → 121 / 130**

## 바꾼 것

| 커밋 | 무엇을 | 왜 |
|---|---|---|
| `d7bdbc6` | 화면 검사기(`check-learning-ui.mjs`) 복구 + 계획서 + 11/07~08 입력 보고서 | 11/09 개념 화면 개편 뒤 숨겨진 `#concept-play`를 눌러 검사기가 멈췄다. 영상 길이는 manifest에서 읽게 |
| `474df32` | 개념 영상 창 글자 18~20px, 높이 480px 이하 배치 | 안내 16px·장면 버튼 16~17.9px(C20), 915×412에서 조작 버튼이 화면 밖(C18) |
| `09c85b3` | `main.js` checklist, `ending.js` icon 미사용 import 제거 | E3 |
| `6511716` | 공유 썸네일 `assets/og-image.jpg`(1200×630, 기존 지도·제목·리버 합성) + og/twitter 메타, 사전 캐시 제외 | G7·G18 |
| `756cb2a` | `STAGES`에 `learningObjectives`·`review{needsReview,source,reviewer}` + 테스트 | A11·A12. 교사 검수 전이라 `needsReview:true` |
| `292b8ef` | 인트로 8.41MB → 4.59MB, 엔딩 6.49MB → 4.56MB(같은 경로·해상도·17초·음성, H.264 2패스, faststart) | D3. 엔딩 SSIM 0.989, 프레임 육안 비교 |
| `3ccc180` | 개념영상 10편 HyperFrames 재제작 + 캡션 시각 `CONCEPT_CUES=[0,5,10]` + 아래 칩 줄 숨김 | 3단계 고도화, 캡션이 2.7초마다 넘어가던 읽기 시간 문제 |
| `1277a96` | `concept-focus.css`를 `index.html`에서 함께 로드, 개념 화면 검사 시간 갱신 | 첫 창이 스타일 없이 그려지던 순간(915×412 검사 실패 원인) |

## 개념영상

| 편 | 길이 | mp4 | webm | 포스터 |
|---|---:|---:|---:|---:|
| river-0 물이 땅을 바꾸는 세 가지 일 | 15초 | 546,078 B | 626,749 B | 73,376 B |
| river-1 상류에서 하류까지 | 15초 | 906,214 B | 1,053,752 B | 126,500 B |
| volcano-0 화산 모형의 흐름 | 15초 | 378,994 B | 417,723 B | 57,934 B |
| volcano-1 모형과 실제 비교 | 15초 | 769,083 B | 782,801 B | 105,778 B |
| rocks-0 색과 알갱이 | 15초 | 388,752 B | 553,986 B | 74,698 B |
| rocks-1 증거로 분류 | 15초 | 183,741 B | 261,063 B | 46,636 B |
| city-0 시간에 따른 영향 | 15초 | 1,213,140 B | 1,252,389 B | 128,768 B |
| city-1 관찰에서 행동으로 | 15초 | 951,802 B | 1,087,497 B | 127,002 B |
| safety-0 몸 보호 | 15초 | 622,079 B | 608,700 B | 72,836 B |
| safety-1 안전한 길 | 15초 | 825,422 B | 920,911 B | 116,132 B |

- 경로 `public/assets/concepts/{편}.mp4|webm|webp`, 1280×720, H.264 faststart(moov 앞) + VP9, 무음, 편당 2.5MB 이하. 원본 프로젝트 `films/concepts/`(공용 `kit.js` + 데이터 `scenes.js`), 검토 `films/concepts/REVIEW.md`, 다시 렌더 `node films/concepts/render.mjs`.
- 옛 렌더러 `scripts/concepts/*`와 `npm run concepts:render`는 그대로 두었다(package.json 변경 금지). 이 명령을 실행하면 옛 8초 영상으로 덮어쓰므로 쓰지 말 것.
- 포스터 10장이 서비스워커 사전 캐시에 들어가 설치 용량이 약 0.1MB → 0.93MB로 늘었다(첫 화면 전송에는 영향 없음, 실측 1.56MB 동일).

## 검증 명령과 실제 결과

| 명령 | 결과 |
|---|---|
| `npm test` | 139/139 통과 |
| `npm run check` | 통과 |
| `npm run build` | 통과, 사전 캐시 165 |
| `check-learning-ui.mjs` 5크기(dist 5110) | 450/450, 런타임 오류 0 (BEFORE 404/450) |
| `check-concept-screen.mjs`(dist) | PASS 240 케이스 |
| `check-learning-flow.mjs`(dist) | 30발견·개념 10·보상 5·최종 3·엔딩·인증서·새로고침, 오류 0 |
| `check-map-keyboard.mjs` | 7/7 |
| 앱 안 개념영상 10편(dist) | 10/10 readyState 4·15초·포스터 디코드·장면 3 이동 |
| 초기 로딩 실측(dist, 10Mbps·40ms ×3) | 1.876~1.940초, 1.56MB/44요청, 외부 origin 0 |
| `hyperframes check --json` | 오류 0, 경고 1(확대 중 무대 밖 넘침, 의도), 무음 info |
| 운영 smoke(읽기 전용, BEFORE) | 200, 로그인 보호 없음, 시작→지도, 오류 0. Range 요청 200 재확인 |

검사 산출물(스크린샷·JSON): `/Volumes/T7 Shield/iscreammedia_sc34/_claude_tmp/upgrade-20261109/tmp/07/{before,after,snap}/`.

## 미검증과 이유

- 이번 변경의 운영 배포 smoke(G11)·카카오톡 카드(G18): 배포하지 않음. 메인 세션 배포 후 확인 필요.
- iPad Safari에서 mp4 재생(Pages가 Range에 200을 줌): 실기기 없음. 앱의 Blob 장면 이동 대체는 Range 없는 경로 검사로 통과했지만 Safari 실재생은 미확인. 새 영상은 0.18~1.21MB라 전체 다운로드 부담은 작다.
- 영상의 소리: 무음 결정(앱이 muted 자동재생). 들어서 확인한 것은 없다.
- 360px 폰 폭에서 영상 안 이름표 가독성: 약 8px로 작다. 같은 낱말은 DOM 장면 버튼(18px)에 있다.
- 학급 40분·학교 태블릿 성능·200% 텍스트 확대·safe-area: 기기 없음.

## 남은 일 (계획서 "다음")

1. 소형 폰 캔버스 드래그 48px·캔버스 활동 키보드 대체(C3·C11) — 접근성 점수의 가장 큰 감점.
2. 옛 모듈 정리·`adventure/index.js` 분리·완료 자격 재계산(E1~E3·F15).
3. 손상 저장 원문 백업(F14), 기존 그림 출처·이용 조건(F10~F12, 사람 확인).
4. 마지막 힌트의 정답 노출 완화(A9, 교사 검토), 터치 기기 가짜 hover 차단.
5. 개념영상 다듬기: 도시 2 화산재 표현, 강 2 이동 알갱이 크기, 안전 2 걷기 스프라이트(`films/concepts/REVIEW.md`).
