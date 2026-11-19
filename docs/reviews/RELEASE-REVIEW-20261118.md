# 배포 검토 보고서 — 움직이는 지오밸리 (놀이 화면 비율·중복 버튼 정리 뒤)

> 작성일: 2026-11-19 새벽(작업명 2026-11-18) · 브랜치: main · 기준 커밋: `b025bbe` + 이번 변경 · 배포 대상: Cloudflare Pages `geovalley` (https://geovalley.pages.dev)

## 최종 판정

**조건부 배포 가능**

### 왜 이 판정인가

- 이번 범위(화면 비율·배경 조화·중복 버튼·화면 겹침)에서 찾은 FAIL은 모두 고쳤다: 기록탑 주 버튼이 1280×800·1024×768에서 첫 화면 밖으로 잘림(C6), 1920에서 기록탑 벽이 화면의 33%로 작게 뜸(C1), 도구 메뉴가 뜨는 활동(암석 확대·대피 3D 등)에서 「도구」 버튼이 지시문 첫 글자를 가림(C4, `check-activity-fit` 140→150/150), 주민 대화·보상 카드의 같은 일을 하는 X(C18 중복 닫힘 경로).
- 11-12 납품 검수(`RELEASE-REVIEW-20261112.md`, 조건부)에서 남긴 사람·실물 확인 항목이 그대로다: 교사 문구 검토(A12 `reviewer=null`), 40분 수업(B16), 실물 태블릿·확대·제스처(C19·C25·D10), 기존 자산 이용 조건(F10·F11).
- 프로젝트 브라우저 검사 중 4개(`check-learning-flow`, `check-safety-touch`, `check-guide-arrivals`, `check-requested-fixes`)는 **변경 전 HEAD에서도 똑같이 실패**한다. 화면 설계가 바뀌며 사라진 버튼(`[data-operation="move:east"]`, `#safety-mark-window`, `#confirm-stop`)과 늘어난 음성 수(27→437)를 찾는 낡은 기대값이라 제품 결함은 아니다(E12 WARNING). 그래서 전체 완주는 이번에 직접 쓴 클릭 완주(`.tmp/layout-balance-20261118/flow.mjs`)와 남아 있는 검사로 대신 확인했다.

### 배포 전 처리할 조건

1. 없음(이번 범위의 FAIL 해결, 단위·문법·빌드 통과).

### 배포 후 확인할 것

1. 운영 주소에서 바뀐 CSS 해시와 화면(기록탑 1920, 작전 판 유리, 보상 카드) 확인 — 6절.
2. 담당 교사·납품 담당자: 실물 태블릿(1280×800급)에서 기록탑 주 버튼이 첫 화면에 보이는지, 작전 판 위 지시 글자가 배경 위에서 잘 읽히는지.
3. 낡은 검사 4개를 현재 설계에 맞게 고치는 일은 별도 작업으로 남긴다.

---

## 요약

이번에 직접 다시 본 항목과 11-12 판정을 그대로 쓰는 항목을 구분했다(근거 열에 「11-12」 표시).

| 영역 | PASS | WARNING | FAIL | NOT TESTED | N/A |
|---|---|---|---|---|---|
| A 교육적 품질 | 16 | 0 | 0 | 1 | 0 |
| B 기능 | 16 | 1 | 0 | 2 | 0 |
| C 태블릿·UI | 18 | 4 | 0 | 3 | 0 |
| D 성능 | 9 | 2 | 0 | 2 | 1 |
| E 코드 품질 | 9 | 4 | 0 | 0 | 1 |
| F 데이터·안전 | 11 | 2 | 0 | 1 | 1 |
| G 배포 | 16 | 0 | 0 | 2 | 2 |
| **합계** | 95 | 13 | 0 | 11 | 5 |

## 실행 환경 (실측)

| 항목 | 값 |
|---|---|
| package manager | npm (lock 파일 없음, 의존성 없음 — 바닐라 JS + `public/` 내장 라이브러리) |
| 실행 명령 | `npm run dev`(scripts/serve.mjs), `npm run build`, `npm run preview` |
| 배포 URL | https://geovalley.pages.dev |

| 명령 | 결과 |
|---|---|
| install | N/A (의존성 없음) |
| lint | **정의 안 됨** |
| typecheck | **정의 안 됨** (JS) |
| test (`npm test`) | 184/184 통과 |
| check (`npm run check`) | 문법 검사 통과 |
| build (`npm run build`) | 통과, 236파일 프리캐시 |

브라우저 확인: 함 — 헤드리스 Chrome(Playwright), 과학34 공통 잠금(`_shared/run-stage-lock.sh browser`)으로 한 번에 하나씩. 관리자 미리보기 모드(위 52px 시연 띠 포함)로 쟀으므로 학생 화면은 같거나 더 넉넉하다.

| 브라우저 검사 | 변경 전 HEAD | 변경 후 |
|---|---|---|
| 놀이 영역 측정 `measure.mjs` (5크기 × 최대 25화면) | 콘솔 오류 0 | 콘솔 오류 0 |
| `check-activity-fit` (150장면 × 5크기) | 140/150 (암석 확대 단계 heading covers navigation) | **150/150** |
| `check-field-operations` | — | 224/224 |
| `check-map-residents` | — | 통과(구 저장 데이터, 주민 5, 응답, 포커스, 저장) |
| `check-rock-accessibility` | — | 10 시나리오 통과(보상 카드 → 「마을로 돌아가기」 포함) |
| `check-map-keyboard` | — | 통과 |
| `check-learning-ui`(사라진 도구 메뉴 단정만 뺀 임시 복사본, 4크기) | 1024 설정 창 48px 미만 버튼·관리자 지도 안내 20px 미만 FAIL 2줄, 영상 선택자 strict 오류로 중단 | **같음**(회귀 없음) |
| 클릭 완주 `flow.mjs` | — | 통과: 학생 홈 → 인트로 → 지도 → 임무 카드 → 활동 → 새로고침 같은 활동 / 교사 시연 5장소 → 기록탑(주 버튼 화면 안) → 엔딩 → 인증서, 오류 0 |
| `check-learning-flow`·`check-safety-touch`·`check-guide-arrivals`·`check-requested-fixes` | 실패(낡은 기대값) | 같은 이유로 실패 |

---

## A. 교육적 품질

이번 작업은 학습 문구·판정·저장·진행 로직을 바꾸지 않았다(`git diff`는 CSS 5파일 + 포커스 2줄). A1~A17은 11-12 판정과 11-12 이후 과학 학습 고도화 검토(`SCIENCE-UPGRADE-20261112.md`)를 그대로 쓴다.

| # | 항목 | 판정 | 근거 |
|---|---|---|---|
| A1~A11, A13~A17 | 목표–활동, 성취기준, 판단 근거, 오개념 피드백, 힌트, 어휘·어조, 조작 다양성 | PASS(추정·11-12 확인됨) | 11-12 보고서 A절, `src/science-learning.js` 단위 검사 포함 184개 통과 |
| A12 | 검수 메타데이터 | NOT TESTED | `review.needsReview=true`, `reviewer=null` 유지 — 교사 검토 대기 |

## B. 기능

| # | 항목 | 판정 | 근거 |
|---|---|---|---|
| B1 시작 | PASS(확인됨) | 홈 → 「리버와 탐험 시작」 → 인트로 건너뛰기 → 지도(`flow.mjs`) |
| B3 스테이지 이동 | PASS(확인됨) | 지도 → 장소 → 활동 → 개념 영상 → 보상 → 지도(`flow.mjs`, `check-rock-accessibility`) |
| B8 보상 | PASS(확인됨) | 보상 카드 X를 숨긴 뒤에도 「마을로 돌아가기」로 지도 복귀(`check-rock-accessibility` 10/10), Esc 닫기 유지 |
| B9 자동 저장·B10 이어하기 | PASS(확인됨) | `check-map-residents` 저장 보존, 단위 검사 `data-safety`·`model` |
| B14 새로고침 복원 | PASS(확인됨) | 학생 모드 활동 화면에서 새로고침 → 같은 활동 지시문(`flow.mjs`) |
| B17 중복 보상 방지 | PASS(11-12 확인됨) | 로직 변경 없음 |
| B2·B4~B7·B11~B13·B15·B19 | PASS(11-12 확인됨) | 로직 변경 없음 |
| B16 40분 분량 | NOT TESTED | 실제 수업 필요 |
| B18 피드백 동기화(실제 스피커) | NOT TESTED | 실기기 청취 필요 |
| 전체 완주 자동 검사 | WARNING | `check-learning-flow`가 사라진 작전 버튼을 기다려 HEAD에서도 멈춤 → 클릭 완주 스크립트로 대신 확인 |

## C. 태블릿·UI

| # | 항목 | 판정 | 근거 |
|---|---|---|---|
| C1 16:9 가로·놀이 영역 | PASS(확인됨) | 활동 5곳 면적 .66~.76, 작전 판 .68~.77, 기록탑 1920 .332→.54 — `docs/LAYOUT-BALANCE-20261118.md` |
| C4 버튼 겹침 | PASS(확인됨) | 도구 메뉴가 지시문을 가리던 문제 수정(`src/rounded-ui.css` 선택자 우선순위), `check-activity-fit` 150/150 |
| C6 화면 밖 요소 | PASS(확인됨) | 기록탑 「기록탑 완성하기」 1280×800 810→760px, 1024×768 764→721px(뷰포트 안) |
| C12 디자인 일관성 | PASS(확인됨) | 작전 판도 다른 화면처럼 유리 재질로(`src/field-operation.css`) |
| C18 모달 닫힘 경로 | PASS(확인됨) | 주민 대화·보상 카드는 닫힘 경로 1개 + Esc. 주민 목록 화면은 X 유지 |
| C23 5초 안 다음 행동 | PASS(확인됨) | 화면별 주 버튼 1개(조작 목록 `report.json`) |
| C3·C5·C7~C11·C13~C15·C17·C21·C22·C24 | PASS(11-12·11-18 3초 작업 확인됨) | 이번 변경과 무관 |
| C16 긴 제목 줄바꿈 | WARNING(11-12) | 좁은 화면 |
| C20 글자 하한 | WARNING(11-12) | 소형폰 일부 캔버스 글자 |
| C3 터치 영역 | WARNING(확인됨) | 학생 화면은 48px 이상. 설정 창의 일부 버튼(인트로·엔딩 영상 다시 보기 등)이 1024에서 48px 미만 — 변경 전부터 있음 |
| 개념 영상 창 X + 「다음 활동으로」 | WARNING(확인됨) | 같은 일을 하는 닫기 2개. 개념 영상 자막 세션이 `src/concepts.js`·`concept-focus.css`를 수정 중이라 손대지 않음 |
| C19 safe-area·제스처, C25 확대 | NOT TESTED | 실물 기기 필요 |
| C11 캔버스 키보드 동등 조작 전체 | NOT TESTED(11-12) | 지도·현장 임무·암석은 통과, 전체 캔버스 동등 경로 미확인 |

## D. 성능

| # | 항목 | 판정 | 근거 |
|---|---|---|---|
| D1 초기 로딩 | PASS(확인됨) | 빌드본, 10Mbps·RTT 40ms·CPU 4배, 새 컨텍스트, 서비스워커 차단: 1.516 / 1.512 / 1.51초, 55요청, 2,004,597바이트, 오류 0 |
| D12 런타임 외부 요청 | PASS(확인됨) | 위 측정에서 origin 1개(자기 자신) |
| D9 frame | WARNING(추정) | `backdrop-filter: blur(3px)` 1곳 추가(작전 판). 실측 FPS 없음 — 저사양에서 확인 필요 |
| D13 정적 모션·그림자 | WARNING(11-12) | |
| D2~D5·D7·D8·D11·D14 | PASS(11-12 확인됨) | 자산 변경 없음 |
| D6 미사용 자산 전수, D10 저사양 실기 | NOT TESTED | |

## E. 코드 품질

| # | 항목 | 판정 | 근거 |
|---|---|---|---|
| E5 console 오류 | PASS(확인됨) | 측정·검사 전 화면에서 pageerror·console error 0 |
| E11 빌드 | PASS(확인됨) | |
| E12 테스트 | WARNING(확인됨) | 단위 184/184 통과. 브라우저 검사 4개가 현재 설계와 안 맞는 낡은 기대값(HEAD에서도 실패) |
| E1·E2·F15성 | WARNING(11-12) | 이전 모듈 공존, 큰 파일 |
| E3·E6~E10·E13·E14 | PASS(11-12) | 의존성 0, lock 파일 없음 |
| E4 any | N/A | JS |

## F. 데이터·안전

이번 변경은 저장 구조를 건드리지 않았다. 11-12 판정 유지: F1~F9·F13~F15 PASS, F11 이용조건·F12 출처 일부 WARNING, F10 제공 원본 권리 조건 NOT TESTED. 별명 입력은 저장·전송하지 않는다(인증서 화면 문구). 비밀키 없음.

## G. 배포

11-12 판정 유지(G1~G17 PASS, G18 카카오 공유·G19 iOS 인쇄 NOT TESTED). 이번 배포는 `_scratch/deploy-20261118/deploy.sh 07 "7 earthchange" pages geovalley`로 커밋된 `origin/main`만 빌드해 올리고 `cmp.sh`로 운영 파일 해시를 대조한다(6절).

## 6. 배포 결과

- 커밋 `883cb42`(개념 영상 자막 세션의 `d3eeae5` 위)를 main에 푸시하고 `_scratch/deploy-20261118/deploy.sh 07 "7 earthchange" pages geovalley`로 `origin/main`만 빌드해 올렸다. Pages 배포 `b0d287b0` (https://b0d287b0.geovalley.pages.dev), 8파일 새로 올림·897파일 재사용.
- 운영 주소 해시 대조: `src/residents.js`·`index.html`(cmp.sh) MATCH, `src/record-tower.css`·`src/layout-fixes.css`·`src/rounded-ui.css`·`src/field-operation.css`·`src/resident-stage.css`·`src/main.js`·`src/concepts.js`·`sw.js` MATCH.
- 운영 주소 화면: 아래 7절.

## 7. 운영 주소 화면 확인

https://geovalley.pages.dev 를 서비스워커 없이 열어 같은 측정을 돌렸다(`.tmp/layout-balance-20261118/after-prod/`): 기록탑 1280×800 면적 .642·「기록탑 완성하기」 아래 끝 764/800px, 1920×1080 면적 .542, 작전 판 .697/.765, 주민 대화에 X 없음, 콘솔 오류 0. 보상 카드 화면은 운영 파일 해시(`src/layout-fixes.css`, `src/main.js`) 일치로 확인했다.
