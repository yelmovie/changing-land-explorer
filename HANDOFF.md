# 지오밸리 인계
프로젝트: D:\iscreammedia_sc34\7 earthchange

목표: 스테이지 개념 영상·효과음·리버 힌트와 태블릿/전자칠판 UI·상호작용 개선.

확정: 기존 5곳×활동 2개×발견 3단계와 저장·보상을 유지. 활동 완료→8초 개념 영상→다음 활동/보상. 닫기는 진행하지 않음. 자막은 DOM, 영상은 무음. 동작 줄이기는 직접 재생.

완료: 영상 10개(MP4/WebM/포스터), 30단계 힌트, CC0 효과음 9종, 중앙 팝업·큰 글자·간격·스크롤 개선. 선택→놓기, 직접 먼지 털기, 안전길 점 찍기, 시간 처음/끝 조작 추가. 캔버스 크기 갱신·WebGL 자원 반환·영상 실패 대체 적용.

검증: 1024×768·1280×720·1920×1080 검사 261/261, 기능 테스트 38/38, 학생 모드 30개 발견→영상 10개→보상 5개→저장 복귀 및 빌드 통과.

다음: 실제 태블릿·전자칠판에서 터치·가독성·음량 확인. 사용자 피드백 범위만 수정.

파일/자료: docs/CONCEPT_MOTION.md, src/learning.css, src/concepts.js, src/sound.js, src/adventure/{index,hints,river,rocks,city,safety}.js. public/assets/{concepts,audio}/에 결과·음원 출처. scripts/concepts/에 제작 도구, scripts/check-learning-{ui,flow}.mjs에 검사. .work/learning-verification/에 결과·캡처, .work/media-sources/에 원본.

주의: npm run dev는 localhost:5177. 브라우저 검사는 Playwright+Chrome과 PLAYWRIGHT_PATH 필요. 실제 기기 미검증. 커밋·푸시·배포는 안 했음. 자료·캐시·출력은 D: 유지.
