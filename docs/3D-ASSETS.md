# 움직이는 지오밸리 · 3D 모델 발주표 (Meshy image-to-3D)

작성 2026-10-25. 기본 이미지는 전부 `image/3d-base/`에 흰 배경 PNG로 모아 두었다. GLB는 Meshy에서 만들어 `public/assets/models/`에 넣는다.

## 0. 어디에 3D를 쓰나 (우선순위)

| 순위 | 화면 | 3D로 하는 일 | 왜 3D인가 |
|---|---|---|---|
| 1 | 암석 공방 (탐험 3) 돋보기 관찰 | 현무암·화강암을 손가락으로 돌려 보며 색·알갱이·구멍을 여러 면에서 관찰 | 성취기준 [4과11-03] "관찰하고 분류". 한 면만 보면 판단이 틀릴 수 있다 |
| 2 | 화산 연구소 (탐험 2) 모형 조립 뒤 | 완성한 화산 모형을 돌려 보고, "단면 보기"로 반 잘린 모형 안의 마그마 통로 확인 | 겉모양과 내부 위치 관계를 한 번에 비교 |
| 3 | 기록탑 엔딩 | 모은 도구 5개가 탑의 홈에 하나씩 끼워지며 탑이 빛나는 연출 | 최종 보상의 성취감. 학습 판단에는 영향 없음 |
| 4 | 도구 보상 팝업 | 받은 도구가 한 바퀴 돌며 등장 | 보상 연출. 선택 |
| 선택 | 리버 | 엔딩 축하·인증서 화면에서 손 흔들기 | 연출 전용. 없어도 된다 |

나머지(강·도시·안전, 지도)는 2D 유지. 지도는 이미 2.5D 그림이다.
3D 화면은 그 화면에 들어갈 때만 불러오고, 3D가 안 되는 기기는 지금의 2D 그림을 그대로 보여 준다.

## 1. 공통 Meshy 설정 (모든 항목에 똑같이)

```
Mode: Image to 3D
Topology: Quad (또는 Triangle)
Target polycount: 아래 표의 숫자 그대로
Texture: ON, PBR OFF(웹 가벼움 우선), 텍스처 1024×1024 1장
Symmetry: 오브젝트에 따라 (표 참고)
Export: GLB
```

| 파일명 | 기본 이미지 | 삼각형 예산 | 대칭 | 비고 |
|---|---|---|---|---|
| `rock-basalt-porous.glb` | `01-basalt-porous.png` | 6,000 | Off | 표면 구멍이 보여야 함 |
| `rock-granite-white.glb` | `02-granite-white.png` | 6,000 | Off | 알갱이 무늬가 텍스처에 살아야 함 |
| `rock-basalt-dense.glb` | `03-basalt-dense.png` | 6,000 | Off | 새 표본(도전용) |
| `rock-granite-pink.glb` | `04-granite-pink.png` | 6,000 | Off | 새 표본(도전용) |
| `volcano-clay-model.glb` | `05-volcano-clay-model.png` | 8,000 | On | 화산 모형 겉모습 |
| `volcano-cross-section.glb` | `06-volcano-cross-section.png` | 8,000 | Off | 단면 보기용 반쪽 모형 |
| `record-tower.glb` | `07-record-tower.png` | 15,000 | On | 엔딩 주역 오브젝트 |
| `tool-lens.glb` | `08-tool-lens.png` | 3,000 | Off | 보상 도구 |
| `tool-camera.glb` | `09-tool-camera.png` | 4,000 | Off | 보상 도구 |
| `tool-specimen-box.glb` | `10-tool-specimen-box.png` | 4,000 | Off | 보상 도구 |
| `tool-compass.glb` | `11-tool-compass.png` | 3,000 | On | 보상 도구 |
| `tool-flag.glb` | `12-tool-flag.png` | 3,000 | Off | 보상 도구 |
| `river-apose.glb` (선택) | `13-river-apose.png` | 12,000 | On | Meshy 리깅·애니메이션(손 흔들기)까지 하면 좋음 |

한 화면 합계: 암석 화면 2개 = 1.2만, 엔딩 탑+도구 5개 = 3.2만. 태블릿 예산(100만) 안쪽으로 넉넉하다.

## 2. Meshy 텍스트 보조 프롬프트 (이미지와 함께 넣기)

이미지만 넣어도 되지만, 결과가 뭉개지면 아래 문장을 같이 넣는다. 끝의 공통 꼬리는 항상 붙인다.

공통 꼬리:
```
Low poly, game-ready for web and tablet (three.js, glTF). Single 1024x1024 texture. Clean closed mesh, no floating parts, no base plate, no background, centered at origin, real-world scale about 20 cm.
```

01 현무암(구멍 많은)
```
A hand-sized basalt rock specimen: dark charcoal grey, fine-grained surface with many small round gas holes (vesicles), irregular angular chunk shape. Keep the holes as real dents in the geometry, not only painted.
```

02 화강암(흰색)
```
A hand-sized granite rock specimen: light grey-white with clearly visible coarse mineral grains — black biotite flecks, white feldspar and glassy grey quartz — irregular rounded chunk. The grain pattern must stay sharp in the texture.
```

03 현무암(구멍 적은)
```
A hand-sized dense basalt rock specimen: dark charcoal grey, very fine-grained matte surface with almost no holes, blocky angular chunk shape.
```

04 화강암(분홍)
```
A hand-sized pink granite rock specimen: pinkish feldspar, white and grey grains with black flecks, coarse visible crystals, irregular rounded chunk.
```

05 화산 모형
```
A classroom clay volcano model: orange-tan sculpted clay cone with a hollow crater on top, rough hand-made surface, wide flat bottom.
```

06 화산 모형 단면
```
A clay volcano model cut in half vertically. The flat cut face shows a red-orange magma chamber at the bottom, one vertical vent pipe up to the crater, and brown-tan layered bands. The cut face must be a flat plane.
```

07 기록탑
```
A stylized round stone record tower, three stories, sandstone blocks, teal copper dome with brass ribs, brass compass-star finial, arched wooden door. Five round brass-rimmed empty sockets evenly spaced around the middle — keep them as real recessed holes.
```

08~12 탐험 도구
```
08: A brass magnifying glass with a teal enamel handle and a clear glass lens.
09: A vintage teal leather explorer camera with brass trim, big lens and a brown strap.
10: An open wooden specimen box with brass corners and two rock samples inside on beige felt.
11: A teal and brass pocket compass with a cream dial and gold compass star, open lid ring on top.
12: A teal cloth expedition flag with a gold mountain emblem on a short wooden pole with a brass knob.
```

13 리버 (선택)
```
A cute cartoon otter explorer character in A-pose: brown fur, cream muzzle and belly, olive safari bucket hat, teal neckerchief, cream explorer vest, small brown satchel, brown boots, thick tail. Stylized, smooth shapes, ready for auto-rigging.
```

## 3. 기본 이미지 생성 프롬프트 (힉스필드, 다시 만들 때)

모델 `gpt_image_2_5` · quality high · 1k · 흰 배경(opaque). 괄호 안은 같이 넣은 기준 그림.

06 화산 단면 (기준: `public/assets/art/volcano-mountain.webp`)
```
Reference for image-to-3D: a classroom clay volcano model cut exactly in half vertically, showing the cross-section inside. Same orange-tan clay material and shape as the reference volcano model. The flat cut face shows simple, clearly separated layers: a rounded red-orange magma chamber at the bottom center, one straight vertical vent pipe (conduit) rising from the chamber to the crater at the top, and a few gently sloped layered bands of brown and tan clay on both sides. Single object standing on nothing, seen from a three-quarter front-left view so both the outer slope and the flat cut face are visible. Soft even studio lighting, no cast shadows, clean pure white background, centered with generous margin, no text, no labels, no arrows.
```

07 기록탑 (기준: `public/assets/tool-box.webp`)
```
Reference for image-to-3D: a small fantasy explorer's 'Record Tower' monument, a round stone tower about three stories tall with a teal copper dome roof and brass trim, warm sandstone blocks, an arched wooden door at the base. Around the middle of the tower are five round empty sockets evenly spaced, each framed by a brass ring, where five explorer tools will be inserted. A small brass compass-star finial on top. Stylized casual adventure-game prop style matching the reference (warm wood, brass, teal palette), simple clean shapes suitable for a low-poly 3D model. Single object seen from a three-quarter front view, full object visible, soft even studio lighting, no cast shadows, clean pure white background, centered with generous margin, no text, no letters.
```

13 리버 A자세 (기준: `public/assets/river-hero.webp`)
```
Character reference for image-to-3D: the same cute otter explorer character as the reference image (brown fur, round cream muzzle, safari bucket hat, teal neckerchief, cream explorer vest, small brown satchel, brown boots, tail), redrawn standing in a neutral A-pose: standing straight, facing directly forward, arms held slightly away from the body pointing down at about 30 degrees, legs slightly apart, empty open hands (no magnifier, no props), tail visible behind to one side, friendly neutral smile, eyes open. Full body visible from hat to boots, front orthographic-like view, soft even studio lighting, no cast shadows, clean pure white background, centered with margin, no text.
```

01~05, 08~12는 이미 게임에 쓰는 그림을 흰 배경 PNG로 뽑은 것이라 새로 만들 필요 없다.
새로 만들고 싶으면 위 06 프롬프트의 마지막 두 문장(three-quarter view ~ no text)을 꼬리로 붙이면 된다.

## 4. 받은 뒤 할 일 (내가 하는 부분)

1. GLB를 `public/assets/models/`에 위 파일명으로 넣는다. 원본은 D 드라이브 `_scratch`에 둔다.
2. 블렌더로 삼각형 수 확인 → 예산 넘으면 Decimate, 텍스처 1024 이하로 줄여 다시 GLB.
3. 암석 화면부터 Three.js 회전 보기 붙이기 → 화산 단면 → 엔딩 탑 순서.
4. `public/assets/CREDITS.md`에 "Meshy image-to-3D, 원본 그림 = 프로젝트 자체 AI 생성" 기록. Meshy 요금제가 상업 이용 가능한 플랜인지 같이 적는다.
