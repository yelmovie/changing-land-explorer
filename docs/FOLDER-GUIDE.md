# 폴더와 파일명 안내

| 위치 | 넣을 파일 |
|---|---|
| `src/` | 게임 기능과 화면 코드 |
| `public/assets/` | 앱에서 실제로 쓰는 최적화 이미지·영상·음악·폰트 |
| `assets/source-media/video/` | 받은 인트로·엔딩 영상 원본 |
| `assets/source-media/audio/` | 받은 음악 원본 (`main-theme`, `final-theme`) |
| `assets/raw-png/`, `assets/raw-glb/` | 제작용 이미지·3D 원본 |
| `image/` | 기존 이미지 제작 원본. 기존 가공 스크립트가 사용하는 경로 |
| `references/` | 참고 이미지·스토리보드·기존 설계 자료 |
| `references/archive/original-delivery/` | 예전 `files/`에 있던 전달 자료 묶음 |
| `references/archive/unused/` | 예전 `_unused/`에 있던 미사용 초안과 중복 문서 |
| `docs/` | 현재 설계·작업 안내·검증 기록 |
| `scripts/` | 빌드·에셋 가공·검증 도구 |
| `.work/` | 작업 중간 파일, 스크린샷, 임시 테스트와 결과 |
| `dist/` | `npm run build`로 생성하는 배포 결과 |

## 새 파일을 추가할 때

- 영문 소문자와 하이픈으로 역할을 이름에 쓴다. 예: `main-theme.mp3`, `river-walk.webp`.
- 원본은 `assets/`, 웹에서 쓰는 가공본은 `public/assets/`에 따로 저장한다.
- 임시 결과와 검증 이미지는 루트에 두지 않고 `.work/<작업명>/`에 모은다.
- 경로를 옮기면 코드·안내문·에셋 기록의 연결도 함께 갱신하고 빌드를 확인한다.
- 원본과 보관 자료는 삭제하지 않는다. 새 버전은 버전명이나 날짜로 구분한다.
- `dist/`, 원본 바이너리, 캐시와 임시 폴더는 Git에서 제외한다. 배포에 필요한 파일은 제외하지 않는다.

## 2026-11-03 정리 내역

루트의 `intro.mp4`, `final.mp4`는 `assets/source-media/video/`로 이동했다.
`intro.mp3`는 역할에 맞게 `assets/source-media/audio/main-theme.mp3`로, `final.mp3`는 같은 폴더의 `final-theme.mp3`로 이동했다.
`files/`와 `_unused/`는 위 표의 보관 폴더로 모았다. 총 20개 파일의 이동 전후 SHA-256이 일치한다.

`.npm-cache/`와 `.tmp/`는 기기별 작업 캐시로 Git에서 제외한다. 실행 파일 경로는 유지해서 게임·영상·음악 연결에 영향을 주지 않는다.
이전 검토 보고서의 옛 경로는 당시 기록이며 현재 위치는 이 안내를 기준으로 찾는다.

