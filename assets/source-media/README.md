# 전달받은 영상·음악 원본

원본은 여기 보관하고, 앱에서 실제로 읽는 가공본은 `public/assets/`에 둔다. 원본을 직접 덮어쓰지 말고 교체본은 날짜나 버전을 붙인다.

| 현재 파일 | 처음 받은 이름 | 용도 |
|---|---|---|
| `video/intro.mp4` | `intro.mp4` | 처음 탐험을 시작하는 이야기 |
| `video/final.mp4` | `final.mp4` | 마지막 도전 뒤 엔딩 |
| `audio/main-theme.mp3` | `intro.mp3` | 인트로와 탐험 중 메인 테마 |
| `audio/final-theme.mp3` | `final.mp3` | 엔딩과 인증서의 파이널 테마 |

파일 내용은 바꾸지 않고 이동·이름 변경만 했다. 원본 바이너리는 Git에서 제외하고 외장 SSD에 보관한다. 앱 실행에 필요한 파일은 별도로 `public/assets/story/`, `public/assets/audio/`에 있다. [상세 적용 기록](../../docs/STORY-MEDIA.md)

