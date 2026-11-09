# 효과음·NPC 음성 변경과 권리 범위

기존 강·화산·암석·마을·안전 탐험의 효과음과 25개 주민 음성을 유지했다. 주민이 말하는 동안 이미 재생 중이거나 새로 시작하는 효과음·지연 효과음을 30%로 낮추며, 음성 종료·실패·중지 시 현재 사용자의 음량으로 복원한다. 효과음 CC0 출처는 public/assets/audio/CREDITS.md, 음성 대사·Momo preset ID·원본 UUID는 scripts/voices.json에 있다. 2026-11-09 원본 UUID 25개의 Momo JSON 메타데이터를 모두 대조했으며 model=qwen3tts, license=Apache-2.0으로 확인했다. preset과 등장인물 매핑도 일치한다. 원본 경로는 scripts/voices.json의 sourceDir을 따른다. 이 문서는 각 원본을 다시 합성하거나 재라이선스하지 않는다.

## 라이선스 구분

- 이번 변경은 프로젝트 재생 코드와 외부 샘플을 사용하지 않는 Web Audio 합성 수식이다. 새 외부 녹음이나 음성 생성 서비스는 사용하지 않았다.
- CC0는 해당 효과음에만 적용한다. 기존 제공 배경 음악·AI 음성·영상 전체가 무저작권이라는 뜻은 아니다.
- Qwen3-TTS 공식 코드/CustomVoice 모델은 Apache-2.0이다. 모델 라이선스와 생성 오디오의 저작권 지위는 별개이며, 교육 목적의 자체 대사 합성을 공공영역으로 재표시하지 않는다. 공식 모델: https://huggingface.co/Qwen/Qwen3-TTS-12Hz-1.7B-CustomVoice
- Supertonic 3 모델은 OpenRAIL-M이다. 제6조는 제한사항을 제외하고 라이선서가 생성 결과에 권리를 주장하지 않는다고 규정한다. 사용 제한은 계속 적용되며 CC0가 아니다: https://huggingface.co/Supertone/supertonic-3/blob/main/LICENSE
- macOS say 음성을 새로 생성하지 않았고, 그 출력의 상업 재배포 권리를 주장하지 않는다. 마이크·음성인식 기능이나 외부 음성 전송을 추가하지 않았다.
- 기존 자막·저장 설정·음량 조절·사용자 입력 후 재생 동작은 유지한다. 실제 스피커의 청감 평가는 별도 확인 대상이다.

## 검증

- `npm test`: 105개 통과. 새 회귀 검사는 음성 중 효과음 감쇠·음소거 알림·테마별 합성음·음성 자원 해제 중 해당 프로젝트 변경을 검사한다.
- `npm run build`: 통과. `npm run check` 구문 검사도 통과.
- 실제 설치된 Chrome: 각 프로젝트 음성 모듈과 실제 NPC 파일로 사용자 클릭 후 재생 시간 증가, 음소거 즉시 정지 확인. 미디어 오류와 페이지 오류 0. 재현 명령은 5magnet에서 `node scripts/audio-series-lifecycle.cjs`이다. 테스트 서버는 루프백 주소만 사용하고 종료 시 닫는다.
- 파일 전체의 청감·모든 대사 끝까지 듣기·iPad 실제 장치 출력은 이번 검사 범위가 아니다.
