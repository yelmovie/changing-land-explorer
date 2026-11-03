# 리버 방향별 걷기 스프라이트 제작 프롬프트

내장 OpenAI 이미지 생성 도구 사용. 캐릭터 기준: `public/assets/hero-lens.webp`. 배경·시점 기준: `public/assets/map-adventure.webp`.

- 원본: `assets/raw-png/characters/river-walk-20261103/`
- 실행용: `public/assets/characters/river-walk.webp`
- 프레임 정보: `public/assets/characters/river-walk.json`
- 가공: `scripts/prepare-river-sprite.mjs` (현재 OS용 Sharp 필요)
- 방향 순서: 앞, 왼쪽 앞, 왼쪽, 왼쪽 뒤, 뒤, 오른쪽 뒤, 오른쪽, 오른쪽 앞.
- 코드 제어: `src/river-walk.js`. 이동 거리만큼 걷기 프레임을 진행하며 정지·대화·숨김 탭에서는 발을 멈춘다.

## 최초 생성

```text
Use case: illustration-story. Asset type: production 2D game walking sprite sheet with TRUE TRANSPARENT alpha. Create a single complete sprite sheet of River, the exact friendly otter explorer from reference image 1. Reference image 2 is ONLY the map's soft painted 3D storybook style, sunlight and elevated viewpoint; do not draw a map. Preserve River's warm brown fur, cream muzzle and tummy, small round ears, olive safari hat with brown band and little leaf, teal neckerchief, cream vest, ochre leather satchel, brown hiking boots and thick otter tail. Both hands free for walking, no magnifying glass. Same character proportions in EVERY frame. Viewpoint elevated about 25 degrees downward appropriate to the reference isometric map, NOT overhead and NOT pixel art.
SHEET LAYOUT CRITICAL: 1024 pixels wide by 2048 pixels tall. Exactly 4 columns by 8 rows, 32 sprites, regular equal 256x256 cells, no gaps or drawn grid. Each sprite completely contained with 20 pixel transparent margins, entire hat/tail/boots visible, fixed scale about 192px tall. Center hips on the cell horizontal center, baseline boot soles at y=224 in each cell. Each ROW is one distinct world-facing direction. Row 1: south, fully front facing toward camera. Row 2: southwest, facing screen bottom-left 45 degrees. Row 3: west, true left side view. Row 4: northwest, back three-quarter facing upper-left, mostly see back of head/hat. Row 5: north, FULL BACK VIEW, back of hat, NO EYES OR FACE visible, tail clearly seen. Row 6: northeast, back three-quarter facing upper-right. Row 7: east, true right side view. Row 8: southeast, facing bottom-right 45 degrees.
Columns in EVERY row: four consecutive loopable walking phases: (1) left foot forward right foot behind, opposite arm swing; (2) feet passing beneath hips, slight rise; (3) right foot forward left foot behind, opposite arm swing; (4) feet passing beneath hips, slight drop. Real legs stepping and knees bending, soft alternating arm and tail swing; torso and hat consistent, body sizes identical, continuous walk cycle, not four still duplicated portraits. Anatomically consistent, two arms two legs one tail. Flat transparent background, no opaque backdrop, no contact shadow, no flooring, no scenery, no lettering, no text, no labels, no numbers, no borders. Production sprite art, sharp alpha edges, clean shapes readable at very small map scale, polished children's adventure game quality. ALL 32 SPRITES present, directions correct.
```

## 걸음 교정

```text
Use case: identity-preserve. Edit this supplied River otter game sprite sheet. Keep the EXACT eight-direction layout (4 columns by 8 rows), transparent alpha, soft painted game style, face, safari hat, teal scarf, vest, leather satchel and boots. KEEP columns 1 and 2 visually unchanged. The sheet has an animation error: columns 1 and 3 advance the SAME leg instead of alternating. Correct ONLY columns 3 and 4 in each of the eight rows, to finish a natural four-frame walking loop. Column 1 = anatomical LEFT leg forward and RIGHT leg back; column 2 = neutral passing pose. Column 3 must be the OPPOSITE gait of column 1: RIGHT leg forward and LEFT leg back, the opposite arm swings forward too. Column 4 is the opposite passing pose, anatomical left heel lifted, right boot grounded. To be very clear: in the FRONT-FACING first row, column 1 has the boot on the viewer's RIGHT extended toward the viewer, so in row1 column3 the boot on the viewer's LEFT must be extended toward the viewer, and the viewer-right boot must be behind! Do NOT copy column1 into column3. In all side-facing and diagonal rows preserve the facing direction while swapping which leg is front and which arm swings forward. Eight rows remain south, southwest, west, northwest, north full back, northeast, east, southeast. Never mirror the satchel, scarf, hat leaf or whole character: actually change the leg poses. All 32 sprites same scale and fixed foot baseline, each fully inside its equal cell, clean transparent margins. No shadows, no text, no grid lines, no background, no new items. Same 1:2 portrait aspect ratio, full complete sheet. This is an animation cleanup: alternating legs and opposite arm swing are essential.
```

