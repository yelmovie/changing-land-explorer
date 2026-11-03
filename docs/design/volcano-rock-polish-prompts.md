# 화산·암석 관찰 이미지 제작 기록

제작: 2026-11-03 · OpenAI 내장 이미지 생성. 사용자가 이미지 생성 크레딧 사용을 요청한 작업. 별도 유료 구독이나 외부 서비스 결제는 하지 않음. 실제 차감 크레딧은 도구에서 반환하지 않아 기재하지 않음.

## 적용 파일

- 배포: public/assets/art/rock-basalt-study-v1.webp, rock-granite-study-v1.webp (1200×800, 투명 배경)
- 배포: public/assets/art/volcano-ash-puff-0-v1.webp ~ volcano-ash-puff-2-v1.webp (256×256)
- 원본: assets/raw-png/stage-polish-20261103/ (최종 암석 2장과 화산재 아틀라스 1장)
- 기존 rock-0/rock-1 논리 키는 유지. stage-art.js에서 새 이미지로 매핑해 저장된 관찰 기록도 같은 그림 사용.
- 일반화를 위한 표본 C/D와 기존 3D 모델은 보존. 붉은 물은 그래픽 반사광·젖은 흔적으로 표현하며 뜨거운 용암의 발광을 적용하지 않음.

## 학습 표현 기준

현무암의 구멍을 광물 알갱이로 표현하지 않음. 화강암은 서로 맞물린 불규칙한 광물 무늬로 표현. 암석 그림은 학습용 재현이며 크기·광물 비율을 실측한 사진이 아님. 확대 배율 2.4는 화면 표시 크기의 비율임.

화산재는 연소 연기가 아니라 잘게 부서진 암석·광물·화산 유리 알갱이로 표현. 용암은 경사면을 따라 아래로 흐르고, 고체 조각은 포물선으로 떨어지게 표현. 생성 구름은 낮은 투명도로 기존 화산재 영역에만 사용. 기체 설명과 화산재 설명을 구분하고 관찰 핀 선택은 학습자가 수행.

참고: [USGS 화산재](https://volcanoes.usgs.gov/volcanic_ash/ash.html), [NPS 화성암](https://www.nps.gov/subjects/geology/igneous.htm), [USGS 화성암 설명](https://www.usgs.gov/faqs/what-are-igneous-rocks).

## 현무암 표본 A

```text
Use case: precise-object-edit / scientific-educational. Edit the reference rock specimen to make a high-resolution, sharply focused museum-quality educational cutout. Preserve this exact specimen's silhouette, proportions, orientation, natural dark charcoal color, shape and locations of all pores, and its transparent background. This is vesicular BASALT, with a fine-grained groundmass: individual constituent mineral crystals must NOT become large visible glittering grains. The circular holes are gas vesicles, not mineral grains. Refine natural tiny roughness and diffuse highlights inside pits; retain a matte dark body, soft realistic top-left studio light and gentle self-shading. Clean crisp alpha edges, all specimen fully within frame with transparent padding. No labels, scale bars, UI, hands, new rocks, pedestal, glitter, enlarged crystals, saturated blue, toy plastic or dramatic color change. Use maximum material microdetail without inventing diagnostic features. Horizontal 3:2 canvas, object geometry matching reference.
```

## 화강암 표본 B — 최종

```text
Use case: precise-object-edit. Improve resolution and material realism of the exact granite rock in this original image WITHOUT redesigning its mineral pattern. Keep every existing mineral patch boundary in the same position and size. Preserve the original silhouette, orientation, off-white overall color and black flecks. The rock is a continuous mass of interlocking IRREGULAR ANGULAR crystals. Quartz/feldspar mineral regions must have uneven polygonal outlines, fractured faces and unequal sizes. Absolutely no circular slices, round pebbles, circles, faceted gemstones, loose gravel, uniform crystal size or repeating pattern. Do NOT enlarge any mineral grain. Fine surface fracture detail and subtle diffuse light, scientifically faithful untreated granite rock. Perfectly transparent empty background with NO halo, glow, shadow or gradient outside the exact rock outline. No scene, base, hands, labels, graphics or text. 1536x1024 landscape framing.
```

## 화산재 입자 구름

```text
Create a transparent VFX texture atlas for a warm painterly 3D elementary science adventure game. Six isolated volcanic ash cloud puffs arranged precisely as a 3 columns by 2 rows regular grid, each fully contained within its cell with generous transparent margins. Each puff is a different irregular billowing shape of fine cool gray-brown volcanic ash particles, dense in the center and softly dispersing at the edges, softly lit from upper left, volumetric shaded, realistic small turbulent cauliflower-like curls. No fire, no orange glow, no sparks, no lava, no rocks, no scenery, no text, no symbols, no ground shadow. These are floating ash cloud textures made from tiny fragmented rock particles, not combustion smoke. True transparent background throughout all space outside the puffs. Landscape 1536x1024 canvas, exactly six cloud puffs.
```
