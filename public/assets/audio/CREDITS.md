# 지오밸리 효과음

확인·다운로드: 2026-10-22. 배포 시 외부 요청 없이 로컬 MP3로 재생해.

| 파일 | 원본 | 제작자·출처 | 라이선스 |
|---|---|---|---|
| click.mp3 | click_003.ogg | Kenney Interface Sounds | CC0 1.0 |
| pickup.mp3 | select_002.ogg | 위와 같음 | CC0 1.0 |
| place.mp3 | drop_002.ogg | 위와 같음 | CC0 1.0 |
| observe.mp3 | pluck_001.ogg | 위와 같음 | CC0 1.0 |
| complete.mp3 | confirmation_002.ogg | 위와 같음 | CC0 1.0 |
| hint.mp3 | open_002.ogg | 위와 같음 | CC0 1.0 |
| brush.mp3 | scratch_003.ogg | 위와 같음 | CC0 1.0 |
| move.mp3 | switch_002.ogg | 위와 같음 | CC0 1.0 |
| water.mp3 | bubbles-single3.wav | Brian MacIntosh / BMacZero | CC0 1.0 |

- Kenney 원본: https://kenney.nl/assets/interface-sounds
- 원본 라이선스: [Kenney-CC0.txt](Kenney-CC0.txt)
- 물소리 원본·라이선스 표시: https://opengameart.org/content/bubble-sound-effects
- CC0 원문: https://creativecommons.org/publicdomain/zero/1.0/legalcode
- 수정: FFmpeg로 모노 MP3 변환. 소리 끄기·배경 탭 정지·동시 1개 재생 적용.
- 2026-11-10 음량 보정: `water.mp3`는 평균 -41dB로 다른 효과음(-13~-22dB)보다 너무 작아 FFmpeg `volume=20dB`로 키웠어(최대 -2.5dB).
- 원본 다운로드는 프로젝트 `.work/media-sources/`에 보존. 활동별 개념 영상은 프로젝트에서 직접 작성한 SVG를 사용해 무음으로 제작했어.

## 탐험과 수첩 소리

2026-11-02에 제작자 Kenney가 OpenGameArt에 게시한 CC0 원본을 받았어. 아래 Ogg 파일은 원본 오디오를 그대로 사용하고, 게임에서 재생할 때 음량만 조절해. 2026-11-10에 너무 작게 들리던 `notebook-open.ogg`(+11dB)와 `notebook-page.ogg`(+8dB)만 FFmpeg로 음량을 키워 다시 저장했어. Vorbis를 지원하지 않는 브라우저는 기존 MP3 신호음을 사용해.

메인 테마(`main-theme.mp3`, 원본 보관 `assets/source-media/audio/main-theme.mp3`, 전달 당시 `intro.mp3`)와 엔딩 테마(`final-theme.mp3`, 원본 보관 `assets/source-media/audio/final-theme.mp3`)는 프로젝트 제작자가 제공한 음악이야. 아래 CC0 표기는 외부 효과음에만 해당해.

| 게임 파일 | 원본 파일 | 쓰는 곳 |
|---|---|---|
| trail-step.ogg | OGG/footstep01.ogg | 지도를 걸어서 출발할 때 한 번 |
| notebook-open.ogg | OGG/bookOpen.ogg | 관찰 수첩 열기 |
| notebook-page.ogg | OGG/bookFlip2.ogg | 수첩이나 기록 목록에서 장 넘기기 |
| tool-reward.ogg | OGG/jingles_PIZZA/jingles_PIZZA03.ogg | 장소를 마치고 새 도구 받기 |

발걸음과 종이 소리의 출처는 [Kenney의 50 RPG sound effects](https://opengameart.org/content/50-rpg-sound-effects), 보상음은 [Kenney의 85 Short music jingles](https://opengameart.org/content/85-short-music-jingles)야. 두 묶음 모두 제작자가 CC0로 공개했어.

## 마을이 살아나는 소리 (2026-11-07 추가)

지도에서 장소가 다시 열릴 때와 주민 대화·도장에 쓰는 소리야. 모두 Kenney가 CC0로 공개한 원본 Ogg를 바꾸지 않고 그대로 복사했고, 게임에서 재생할 때 음량만 조절해. 원본 묶음은 `.work/media-sources/`에 보관했어.

| 게임 파일 | 원본 파일 | 묶음 | 쓰는 곳 |
|---|---|---|---|
| workplace-open.ogg | OGG/doorOpen_1.ogg | 50 RPG sound effects | 장소 문이 열릴 때 |
| lamp-light.ogg | Audio/glass_002.ogg | Interface Sounds | 창과 기록탑에 불이 켜질 때 |
| resident-pop.ogg | Audio/maximize_006.ogg | Interface Sounds | 주민이 지도에 나타날 때 |
| village-wake.ogg | OGG/jingles_PIZZA/jingles_PIZZA07.ogg | 85 Short music jingles | 마을이 깨어나는 마무리 |
| stamp.ogg | OGG/bookPlace1.ogg | 50 RPG sound effects | 친구 도장 찍기 |
| festival.ogg | OGG/jingles_SAX/jingles_SAX07.ogg | 85 Short music jingles | 도장 다섯 개를 다 모았을 때 |
| letter-open.ogg | OGG/bookFlip1.ogg | 50 RPG sound effects | 주민 대화창이 열릴 때 |

- 50 RPG sound effects: https://opengameart.org/content/50-rpg-sound-effects (CC0)
- 85 Short music jingles: https://opengameart.org/content/85-short-music-jingles (CC0)
- Interface Sounds: https://kenney.nl/assets/interface-sounds (CC0)

## 성취 효과음 (2026-11-16 교체)

예전 `village-wake.ogg`·`festival.ogg`는 음이 반음씩 내려가는(F→E→D#→D) 패턴이라 성공 순간에 '진 것 같은' 느낌을 줬고, `tool-reward.ogg`는 반음을 오르내려 불안하게 들렸어. 정답음 `complete.mp3`도 싸구려 8비트 신호음처럼 들렸어. 그래서 아래 소리를 `scripts/make-sfx.mjs`로 **직접 합성**해 바꿨어. 녹음이나 외부 샘플 없이 사인파 계산만 쓰는 프로젝트 자체 제작물이라 별도 라이선스 표기가 필요 없어. 다시 만들 때는 `node scripts/make-sfx.mjs`.

모든 성공 소리는 C장조로 위로 올라가고, '다시 해 보기'는 같은 높이로 톡톡 두드려 내려가는 느낌이 없게 했어. 맞는 자리 놓기·배지 줍기·악당 맞히기를 3초 안에 이어 하면 반음씩 올라가는 콤보가 되고(최대 5도), 다시 해 보기가 나오면 처음 높이로 돌아가.

| 파일 | 게임 속 이름 | 쓰는 곳 |
|---|---|---|
| success.mp3 | complete | 단계·정답 성공, 대피 중 몸 낮추기 성공 |
| good.mp3 | place, good | 맞는 자리에 놓기, 안전 약속 읽기 |
| coin.mp3 | coin | 대피길 안전 발자국 배지 줍기 |
| lift.mp3 | pickup | 물건 집어 들기 |
| retry.mp3 | retry | 틀린 자리·헛방·현장 작전 다시 해 보기 |
| twinkle.mp3 | hint | 힌트 열기 |
| capture.mp3 | observe | 관찰 증거 기록 |
| alert.mp3 | alert | 대피길 여진 경고 |
| hit.mp3 | hit | 돌먼지 악당 맞히기 |
| defeat.mp3 | defeat | 돌먼지 악당 퇴치 |
| reward.mp3 | tool-reward | 장소를 마치고 새 도구 받기 |
| village-rise.mp3 | village-wake | 마을이 깨어날 때 |
| stamp-ding.mp3 | stamp | 친구 도장 찍기 |
| fanfare.mp3 | festival | 도장 다섯 개 축제 |

earshot으로 들어 본 결과: 새 성공음들은 "success chime" z +3.9~4.3, 분위기 "uplifting and hopeful" z +2.3~2.6으로 읽혔어(옛 정답음은 z +3.2에 "cheap synthesized beep" z +3.8, 옛 도구 보상음의 1순위는 "snare hit"). 사람 귀로 블라인드 비교한 건 아니야.

위 표의 옛 파일(`complete.mp3`, `place.mp3`, `pickup.mp3`, `hint.mp3`, `observe.mp3`, `tool-reward.ogg`, `village-wake.ogg`, `stamp.ogg`, `festival.ogg`)은 더는 재생하지 않지만 기록용으로 남겨 뒀어.
