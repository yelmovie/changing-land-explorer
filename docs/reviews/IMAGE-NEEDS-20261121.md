# 07 움직이는 지오밸리 · 필요한 그림 목록 (2026-11-21, 3-1단계 ⑤)

근거: 권리 장부 [`../RIGHTS-LEDGER-20261121.md`](../RIGHTS-LEDGER-20261121.md)(배포 파일 813개, 출처 미확인 14행). 그림은 만들지 않았다. 결정(사용자 「추천대로」): 출처 모르는 옛 그림은 자료가 있으면 장부에 연결하고, 없으면 새로 만들어 교체한다(3-3단계).

**요약(3-2a 갱신, 2026-11-21 09:40): 새로 만들 그림 0장**(3-1단계 23장 + 다시 합성 1장 → 0). 권리 장부를 생성 기록·사용자 확인과 대조해 아래 (가)의 그림이 모두 「확인됨」(I-12·I-27은 생성 기록, 나머지는 사용자 확인 「그림은 전부 Codex, 유료 요금제」)으로 바뀌었다. 아래 (가) 표는 3-1단계 판단 기록으로 남긴다. 옛 지도 리버 `river-sprite.webp`는 지금도 안 쓰므로 3-4단계에서 옛 모듈과 함께 배포본에서 뺀다.

3-1단계 요약: 새로 만들 그림 23장 + 다시 합성 1장(가 23·나 0·다 0).

화풍 참고 그림(장부에서 「확인됨」이거나 지금 화풍의 중심인 그림): `public/assets/art/river-field-clues-v3.webp`·`art/ash-classroom-v3.webp`(확인됨, 그림책풍 수채 배경), 지도 `public/assets/map-adventure.webp`, 주민 `public/assets/residents/*.webp`, 리버 `public/assets/river-hero.webp`·`hero-protect.webp`.

## (가) 권리 장부에서 출처 미확인인 그림

| # | 쓰이는 화면 | 지금 파일 | 필요한 크기·비율 | 화풍 참고 | 왜 |
|---|---|---|---|---|---|
| 1 | 화산 1단계 분출물 관찰(`src/adventure/volcano.js:265`)·작은 실제 화산 창(:308)·분출물 기록 카드 | `public/assets/volcano-eruption.webp` | 1600×900(16:9), 분출물 표시 4곳(1000×560 기준 385,395·610,80·260,115·670,245, `src/adventure/volcano.js`) 자리를 지금 그림과 맞춤 | `art/volcano-caldera-v2.webp`, `art/river-field-clues-v3.webp` | 출처 미확인(I-2). 판정 좌표가 그림 위 표시와 묶여 있어 같은 구도로 |
| 2 | 도시 1단계 시기 비교 사진(공항·농장·온천)과 지도 미리보기 | `public/assets/city-calm.webp` | 1600×900(16:9). 공항·농장·온천 세 자리(`CITY_POINTS`)가 지금과 같은 곳에 보이게 | `art/city-harbor-v2.webp`, `art/city-message-square-v2.webp` | 출처 미확인(I-6) |
| 3 | 도시 2단계 마스크 쓴 리버 | `public/assets/hero-protect-mask.webp` | 491×480 투명 배경, 발끝 정렬은 `hero-protect.webp`와 같게 | `hero-protect.webp`, `river-hero.webp` | 출처 미확인(I-9). 원본 PNG만 있고 도구·날짜 기록 없음 |
| 4 | 시작 화면 제목, 지도 왼쪽 위 로고 | `public/assets/title-logo.webp` | 900×290 투명 배경 글자 로고(「움직이는 지오밸리」) | 지금 로고 자체(글꼴 굵기·색 유지) | 출처 미확인(I-4). `README.md`의 ChatGPT 로고 원본(9/25)과 같은 그림이면 그 기록만 받으면 되고 새로 만들 필요 없음 |
| 5 | 기록탑·인증서 뒤 배경(`.final-scene` 배경, 진한 녹색 막 아래) | `public/assets/map.webp`(원본 `map-original.png`) | 1672×941(16:9 가까이). 막 아래라 흐릿해도 됨 | `map-adventure.webp` | 출처 미확인(I-3). `map-adventure.webp`(근거 약함 묶음)로 바꾸면 새 그림 없이 해결 가능 |
| 6~20 | 지도 주민 대화창 초상(`src/residents.js:105`) | `public/assets/npc-expressions/{river,volcano,rocks,city,safety}-{neutral,happy,think}.webp` 15장 | 640×640 정사각, 투명 배경, 주민 5명 × 표정 3(보통·기쁨·생각) | `residents/*.webp`(같은 주민 전신) | 출처 미확인(I-12). 주민 모습이 `residents/`와 같아야 함 |
| 21~22 | 강 1단계 윗물·아랫물 관찰 사진(`src/adventure/river.js:274`) | `public/assets/art/river-upper-photo-v1.webp`, `river-lower-photo-v1.webp` | 1200×640, 관찰 표시 자리(`river-photo-v1.json`)를 그대로 쓸 수 있는 구도 | `art/river-field-clues-v3.webp` | 출처 미확인(I-23). "AI-generated"뿐, 도구 기록 없음 |
| 23 | 강 활동 물길 연결 지도(`src/adventure/river.js:371`) | `public/assets/art/river-connection-map-v1.webp` | 1600×517(약 3.1:1), 화면에는 990×320으로 | `map-adventure.webp`, `art/river-field-clues-v3.webp` | 출처 미확인(I-27) |
| 합성 | 링크 미리보기 | `public/assets/og-image.jpg` | 1200×630 | 1·4·5를 바꾼 뒤 같은 방법으로 다시 합성 | 출처 미확인 로고·지도를 안에 담음(I-10). 새 그림이 아니라 다시 합성 |

새로 만들지 않아도 되는 출처 미확인 그림:
- `public/assets/river-sprite.webp`(I-5): 지금 앱이 불러오지 않는 옛 `src/map.js`에서만 쓴다. 새 그림 대신 다음 단계(3-4 코드 구조 정리)에서 옛 모듈과 함께 배포본에서 빼면 된다.

그림이 아닌 출처 미확인(이 목록 밖, 권리 장부 참고): 이야기 영상 `story/intro.mp4`·`final.mp4`(V-1), 공항 영상 2편(V-3), 메인·파이널 테마 음악(M-1). 개념 영상 3편(V-5)은 위 1·2·3이 바뀌면 다시 렌더링한다.

## (나) 화풍·해상도가 튀거나 임시로 넣은 그림

없음. 화면에 쓰이는 그림 가운데 해상도가 낮거나 화풍이 튀는 것은 위 (가)와 겹친다(옛 지도 `map.webp`는 막 아래 배경이라 눈에 띄지 않음).

## (다) 게임성·화면 보강(A17·C14 등)에 필요한 소품·배경

없음. 07의 할 일 목록(`SCORE-100-TODO-20261120.md`)에 A17·C14 같은 게임성·화면 보강 줄이 없다.

## 학습 문구 초안

만들지 않음. 07의 할 일 목록에 학습 문구·피드백 줄(A4·A5·A8·A9·A13·A14·A15·B15)이 없다. 교사 검수표([`../TEACHER-REVIEW-20261121.md`](../TEACHER-REVIEW-20261121.md))의 「확인 필요」 15행(힌트와 화면 조작이 어긋나는 곳, 「비옥한」·「여진」 같은 어휘)은 교사 검수 뒤 3-2단계 문구 초안 후보다.
