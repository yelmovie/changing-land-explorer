# 3D 모델 넣는 곳

Meshy에서 받은 GLB를 아래 이름 그대로 넣으면 암석 공방의 '돌 돌려 보기' 버튼이 저절로 나타나요.

| 파일 | 표본 |
|---|---|
| `rock-basalt-porous.glb` | 표본 A (rock-0) |
| `rock-granite-white.glb` | 표본 B (rock-1) |
| `rock-basalt-dense.glb` | 새 표본 C (rock-2) |
| `rock-granite-pink.glb` | 새 표본 D (rock-3) |

넣은 뒤 `node scripts/check-models.mjs`로 삼각형·텍스처 예산을 확인해요. 설정·프롬프트는 `docs/3D-ASSETS.md`.
