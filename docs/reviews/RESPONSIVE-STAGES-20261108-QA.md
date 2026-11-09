# 5개 스테이지 반응형·시각 QA — 2026-11-08

범위: `edu-design`의 화면 맞춤·Phaser/DOM 경계 및 `edu-final-check` C 영역에 해당하는 이번 변경 검증. A~G 전체 배포 판정이나 새로운 학습 성과 판정은 포함하지 않는다. 검증 대상은 강·화산·암석·도시·안전의 2활동 × 3발견 = 30장면이다.

## 결과

- **개발본 전수 화면 검사 450/450 PASS**, 런타임 오류 0.
- **30장면 × 5크기 = 150장면의 실제 겹침 재검 PASS**. 헤더↔오른쪽 탐색, 안내↔도구, Phaser 텍스트↔DOM, 텍스트끼리 교차, 화면 밖 텍스트, 페이지 overflow, 스크롤 후 접근 실패가 모두 0이다.
- 마지막으로 발견한 915×412 암석 정리 카드의 2.43px 텍스트 교차는 수정 후 해당 장면을 5크기에서 다시 검증하여 0을 확인했다. 최초 전수 결과를 덮지 않고 [통합 검증 결과](../../.work/responsive-20261108/qa/verified-overlaps.json)에 교체 근거를 남겼다.
- **915×412의 실제 touchStart/Move/End 전체 흐름 PASS**: 발견 30개, 개념 연결 10회, 보상 5개, 최종 도전 3개, 엔딩, 인증서, 새로고침 복원. 정답 좌표를 알고 진행한 자동 조작이므로 학생의 독립적인 학습 성과를 입증하는 결과는 아니다.
- **production `http://localhost:5197` 대표 10장면 PASS**: 5스테이지 × 1280/667, 겹침·가림·스크롤 접근 실패·HTTP/런타임 오류 0. 학생 단계 잠금, 재방문, 중간 작업, Esc 포커스, 회전, 새로고침도 유지됐다.

## 환경과 상태 격리

| 항목 | 조건 |
|---|---|
| 브라우저 | 이 Mac에 설치된 Chrome, Playwright headless |
| 필수 뷰포트 | 1280×800, 1024×768, 915×412, 667×375, 1920×1080 |
| 추가 회전 확인 | 375×812 → 915×412 |
| 전수 상태 | 별도 새 BrowserContext의 관리자 미리보기·격리 seed |
| 실제 흐름 | 별도 학생 BrowserContext에서 실제 입력으로 진행 |
| 캐시·임시·산출물 | 연결·External USB·읽기/쓰기·여유 공간을 확인한 T7 Shield의 프로젝트 하위 경로 |
| 사용자 데이터 | 사용자의 브라우저 프로필, 실제 학생 저장값, 기존 동시 작업 파일은 수정하지 않음 |

`TMPDIR`는 프로젝트 `.tmp`, `XDG_CACHE_HOME`은 `.work/cache`, npm 캐시는 `.npm-cache`로 명시했다. 이 문서는 앱 자체의 자동 저장·캐시 경로를 이전하거나 검증했다는 뜻이 아니다.

## 변경 전후로 확인한 문제

| 장면/문제 | 수정 전 | 최종 확인 |
|---|---|---|
| 667 도시 시간 비교 | footer가 surface 하단 116px를 침범, 기록/선택지 가림 | 왼쪽 장면·오른쪽 안내/도구 분리, 실제 교차 0 |
| 667 암석 관찰 제목 | 3줄·약104px로 장면 축소 | 대표 제목 1줄, 긴 다른 제목은 최대2줄의 실제 높이를 반영 |
| 도시 안내판 미니 기록 | 제목↔시기 1024에서4.43px,1280에서2.72px 교차 | 그림과 분리된 한 Text 흐름, 전수 교차0 |
| 초기 short dock의 controls | 35px 스크롤 창으로48px 버튼 전체를 볼 수 없음 | 대표667에서67px 확보, 스크롤후 모든 대상의 보이는 높이48px 이상 |
| 긴 안내 문장 | dock에서 끝부분이 첫 화면에 보이지 않음 | focus 가능한 region 내부스크롤, Tab→End로 마지막글자까지 확인 |
| 암석 정리의 특징/조작 설명 | 최종 전수에서915에2.43px 교차 추가 발견 | 종이 하단 확장·설명 간격 조정 후5크기 교차0 |

## C 영역 확인 항목

| 항목 | 결과/근거 |
|---|---|
| 화면 맞춤·잘림·겹침 | 5크기150장면, 글꼴 로드 뒤 DOM 및 Phaser world bounds를 CSS px로 환산하여 확인 |
| 터치 목표 | 1024/1280/1920에서 계측한 Phaser 대화형 목표의48px 미달0. 작은 가로에서는 동등한 DOM 선택 경로를 실제로 사용했고 선택지48px·본문20px 기준 확인 |
| 내부스크롤 | controls의 각 버튼을 실제 스크롤한 뒤 center hit와 보이는 높이 측정. 스크롤 안에서 닿는 항목을 화면 밖 오류로 세지 않음 |
| 제목과 단계 이동 | 긴 제목 높이 자동 반영. 작은 폭은 현재 단계 버튼에서3단계 목록을 열고 닫을 수 있음 |
| 학생 단계 게이트 | 다음 미완료 단계 잠금 거부, 완료 단계 재방문 뒤 기록 보존, 원래 중간 단계 작업값0.42 보존 |
| 모달·포커스 | 힌트·개념·설정·미리보기 크기 검사. 단계 목록 Esc 닫기 뒤 현재 단계 버튼으로 포커스 복원 |
| 회전 | 세로 안내가 뜬 상태에서 설정 사용 가능, 가로 복귀와 작업 보존 확인 |
| 읽기 크기 | 1024의 실효 일반 장면 텍스트 최소14.81px,1920 최소19.78px. 장면 속 미니어처 그림에 포함된 축소 글자는 일반 본문 계측에서 구분 |
| 정오답 유지 | rocks/volcano/safety/field·board·ash의 기존 터치 검사에서 오답 거부·선행 관찰·대기 조건 유지 |
| Phaser↔DOM | 스크롤/리사이즈 뒤 실제 입력 흐름 완료, 잔존 canvas나 도구 가림을 발견하지 않음 |

작은 가로667/915의 축소 장면에 있는 짧은 캡션은 약7.6/10px까지 내려간다. 이 크기에서는 오른쪽20px 안내와48px 동등 DOM 선택 경로가 학습 조작을 담당하며, 장면 안의 모든 캡션이 태블릿과 같은 크기라는 판정은 하지 않는다. 전체 키보드 조작, 200% 텍스트 확대/125% 줌, 실제 학교 태블릿·인앱 브라우저·노치 safe-area는 이번 검사에서 **NOT TESTED**다.

## 학습 시각 확인

정상 모션13캡처와 실제 터치 상호작용12캡처를 별도로 만들고 대표 원본을 직접 열어 봤다.

- 강: 물 양1/2, 진행0.4/0.75/1의 흙 깎임과 아래쪽 퇴적 팬. 얕은 물은 흙과 비슷한 저채도여서 단일 정지 화면보다 실제 조작 흐름에서 구분하기 쉽다.
- 화산: 모형0.55에서 차가운 붉은 물 반사·둥근 주사기 손잡이, 실제 화산에서 분화구와 모션 원점/용암 경로의 정합, 선택한 용암·화산재의 강조.
- 암석: 실제 질감 확대, 원래 표본의 초점과 렌즈를 잇는 선, 확대 배율 설명의 종이 안 배치.
- 도시: 시간 양 끝 변화, 안내판의 미니 그림/기록 간격, 실내 화산재 장면과 창문 닫기 전후.
- 안전: 책상 다리를 잡은 자세, 흔들림 멈춤 뒤 진동 표시 제거, 본인이 그린 경로에서 이미 걸은 구간과 방향 표시.

안전 지도의 위험 이름표가 자기 위험 그림과 겹치는 것, 강 지도 끝의 캐릭터 안내 팻말은 의도된 구성으로 분류했다. 자동 bounds 교차를 모두 오류로 세지 않았다.

## 증거 파일

| 검증 | 산출물 |
|---|---|
| 변경 전 화면/겹침 | [baseline-layout](../../.work/responsive-20261108/qa/baseline-layout/results.json), [baseline-overlaps](../../.work/responsive-20261108/qa/baseline-overlaps/results.json) |
| 450 화면 검사 | [final-layout/results.json](../../.work/responsive-20261108/qa/final-layout/results.json) |
| 최종150 겹침 계측 | [verified-overlaps.json](../../.work/responsive-20261108/qa/verified-overlaps.json) |
| 5개 수정 재검 | [rocks-fixed-overlaps-v2](../../.work/responsive-20261108/qa/rocks-fixed-overlaps-v2/results.json) |
| 실제 터치 전체 흐름 | [flow.json](../../.work/responsive-20261108/qa/final-flow-touch915/flow.json), [실행 로그](../../.work/responsive-20261108/qa/final-flow-touch915.log) |
| 암석/화산 터치 | [rocks.json](../../.work/responsive-20261108/qa/final-rock-touch/rocks.json), [volcano/results.json](../../.work/responsive-20261108/qa/final-volcano-touch/results.json) |
| 안전/강·도시 터치 | [safety/results.json](../../.work/responsive-20261108/qa/final-safety-touch/results.json), [field-board.json](../../.work/responsive-20261108/qa/final-field-board-touch/field-board.json) |
| 학생 단계/회전 | [final-phase-gate](../../.work/responsive-20261108/qa/final-phase-gate/results.json) |
| 정상 모션/상호작용 | [final-motion](../../.work/responsive-20261108/qa/final-motion/results.json), [final-interactions](../../.work/responsive-20261108/qa/final-interactions/results.json) |
| production10장면 | [production-overlaps-v2](../../.work/responsive-20261108/qa/production-overlaps-v2/results.json) |
| production 학생 게이트/복원 | [production-phase-gate](../../.work/responsive-20261108/qa/production-phase-gate/results.json) |

전수 기본 하네스는 `scripts/check-learning-ui.mjs`를 QA 폴더에 복사해 short dock의 의도된 내부스크롤만 구분했다. 별도 QA 하네스는 모두 `.work/responsive-20261108/qa/`에 있으며 소스 파일을 수정하지 않았다. 마지막 전수 후 변경은 암석 정리의 종이 높이/캡션 위치 두 줄이며, 영향을 받는 장면5크기와 production대표를 다시 확인했다.
