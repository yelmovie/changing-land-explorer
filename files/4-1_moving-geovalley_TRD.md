# TRD — 움직이는 지오밸리

- **Project:** Moving GeoValley
- **Repository:** `moving-geovalley`
- **Topic ID:** `topic-11-land-change`
- **Target:** Tablet-first Web / PWA-ready
- **Structure:** 5 Stages / 10 Screens
- **Primary stack:** Vite + TypeScript + Phaser 3 + Three.js + HTML/CSS/SVG
- **Persistence:** IndexedDB 우선 + localStorage 폴백
- **Architecture:** Screen 단위 Runtime 전환 + DOM Overlay + EventBus
- **3D Screens:** 01, 03, 05, 06, 10
- **문서 버전:** 1.0
- **작성일:** 2026-08-24

---

## 1. 기술 목표

1. Phaser, Three.js, DOM을 역할별로 분리하고 현재 Screen에 필요한 렌더러만 활성화한다.
2. 3D는 공간 관찰과 회전이 학습적으로 필요한 Screen에만 사용한다.
3. 흐르는 물, 화산, 지진을 정밀 물리엔진으로 흉내 내기보다 **검수 가능한 교육용 결정론적 상태 모델**로 구현한다.
4. 학습 규칙을 렌더링 코드와 분리하여 과학 내용 검수와 유지보수가 가능해야 한다.
5. 모든 한글 UI는 DOM/SVG로 구현하고 3D 텍스처에 굽지 않는다.
6. 학생의 예상, 증거핀, 관찰핀, 오류 태그를 serializable state로 저장한다.
7. 백엔드 없이도 단독 실행·이어하기가 가능해야 한다.
8. Science World 허브와는 `MissionResult` 계약으로 결합한다.
9. Android 학교 태블릿과 iPad Safari에서 핵심 플레이를 안정적으로 실행한다.
10. 화면 전환 시 WebGL context, RAF, EventBus listener, AnimationMixer가 누적되지 않도록 한다.

---

## 2. 권장 기술 스택

```text
Vite
TypeScript (strict: true)

Phaser 3
  - Screen 02, 04, 07, 08, 09
  - 2D/2.5D, drag, pointer trail, route drawing, state animation

Three.js
  - Screen 01, 03, 05, 06, 10
  - 3D diorama, terrain morph, volcano viewer, rock object viewer

HTML / CSS / SVG
  - 모든 한글
  - HUD
  - MissionPanel
  - ResearchNotebook
  - EvidencePanel
  - TimelineScrubber
  - Modal / Toast / Settings

IndexedDB
  - 진행 상태
  - 증거 기록
  - 실험 로그
  - 복구 태그

localStorage
  - 설정과 IndexedDB 실패 시 작은 폴백

Canvas 2D
  - 결과 카드 PNG
  - 일부 route/evidence snapshot

Web Audio API 또는 HTMLAudioElement
  - BGM / SFX

PWA / Service Worker
  - 앱 셸과 저용량 필수 자산만 캐시
```

대형 rigid-body physics, CFD, volumetric fluid, 실시간 terrain erosion library는 필수 의존성으로 추가하지 않는다.

---

## 3. 런타임 아키텍처

```text
Science World Hub (Three.js)
        │ portal enter
        ▼
HubSnapshot save
        ▼
Hub suspend
        ▼
MovingGeoValleyHost
 ├─ TopicStateMachine
 ├─ RuntimeCoordinator
 │   ├─ PhaserRoot
 │   ├─ ThreeRoot
 │   └─ DOMOverlay
 ├─ TopicEventBus
 ├─ GeoValleyStore
 ├─ PersistenceService
 ├─ AssetManager
 ├─ AudioManager
 ├─ AssessmentService
 ├─ RecoveryMissionService
 └─ MissionResultAdapter
        │
        ├─ P01/P03/P05/P06/P10 -> Three.js
        └─ P02/P04/P07/P08/P09 -> Phaser / DOM / SVG
        ▼
MissionResult
        ▼
Hub resume
```

### 렌더링 수명주기

1. Screen 진입 전 필요한 자산만 lazy load
2. 이전 runtime pause
3. 새 runtime mount
4. DOMOverlay는 공통 유지
5. Screen 종료 시 `serialize()`
6. store 저장
7. geometry/material/texture/listener/mixer dispose
8. runtime unmount
9. 다음 runtime 시작

Phaser RAF와 Three.js RAF를 같은 Screen에서 불필요하게 지속 실행하지 않는다.

---

## 4. Scene Mode Matrix

| Page | Page ID | Runtime | Camera | 핵심 로직 |
|---|---|---|---|---|
| 01 | `geovalley-hub-3d` | Three.js + DOM | fixed 3/4 + limited orbit | anomaly raycast + world state |
| 02 | `observation-hq` | Phaser/DOM | fixed | stage map + progress |
| 03 | `flowing-water-lab-3d` | Three.js + DOM/SVG | limited orbit | deterministic flow + terrain morph + evidence pins |
| 04 | `river-evidence` | Phaser 2.5D + DOM | horizontal travel | evidence collection + relation validator |
| 05 | `volcano-lab-3d` | Three.js + DOM | limited orbit + cutaway | model state machine + compare |
| 06 | `rock-lab-3d` | Three.js + DOM | object viewer | orbit/zoom + observation anchors + classification |
| 07 | `volcano-city-timeline` | Phaser 2.5D + DOM | fixed isometric | timeline state + impact evidence |
| 08 | `volcano-observation-center` | Phaser/DOM/SVG | fixed | multi-source compare + priority board |
| 09 | `earthquake-safety-sim` | Phaser 2.5D + DOM | scene-dependent | safety state machine + route drawing |
| 10 | `geovalley-restoration-3d` | Three.js + DOM | same as P01 | adaptive recovery + final world state |

---

## 5. 권장 프로젝트 구조

```text
moving-geovalley/
├─ public/
│  ├─ assets/
│  │  └─ geovalley/
│  │     ├─ 2d/
│  │     │  ├─ bg/
│  │     │  ├─ props/
│  │     │  ├─ ui/
│  │     │  └─ fx/
│  │     ├─ 3d/
│  │     │  ├─ geovalley_world.glb
│  │     │  ├─ terrain_flow_lab.glb
│  │     │  ├─ volcano_lab.glb
│  │     │  ├─ volcano_cutaway.glb
│  │     │  ├─ basalt_samples.glb
│  │     │  ├─ granite_samples.glb
│  │     │  └─ geo_core.glb
│  │     ├─ audio/
│  │     └─ data/
│  ├─ config/
│  │  └─ geovalley/
│  │     ├─ pages.json
│  │     ├─ missions.json
│  │     ├─ standards.json
│  │     ├─ asset-manifest.json
│  │     ├─ rock-samples.json
│  │     ├─ river-observations.json
│  │     ├─ volcano-impact-timeline.json
│  │     ├─ earthquake-scenarios.json
│  │     └─ recovery-rules.json
│  └─ manifest.webmanifest
├─ src/
│  ├─ app/
│  │  ├─ MovingGeoValleyHost.ts
│  │  ├─ TopicStateMachine.ts
│  │  ├─ RuntimeCoordinator.ts
│  │  └─ lifecycle.ts
│  ├─ core/
│  │  ├─ TopicEventBus.ts
│  │  ├─ AssetManager.ts
│  │  ├─ AudioManager.ts
│  │  ├─ DeviceCapabilities.ts
│  │  └─ MissionResultAdapter.ts
│  ├─ state/
│  │  ├─ GeoValleyState.ts
│  │  ├─ GeoValleyStore.ts
│  │  ├─ PersistenceService.ts
│  │  └─ migrations.ts
│  ├─ pages/
│  │  ├─ p01_geovalley_hub_3d/
│  │  ├─ p02_observation_hq/
│  │  ├─ p03_flowing_water_lab_3d/
│  │  ├─ p04_river_evidence/
│  │  ├─ p05_volcano_lab_3d/
│  │  ├─ p06_rock_lab_3d/
│  │  ├─ p07_volcano_city_timeline/
│  │  ├─ p08_volcano_observation_center/
│  │  ├─ p09_earthquake_safety_sim/
│  │  └─ p10_geovalley_restoration_3d/
│  ├─ phaser/
│  │  ├─ PhaserTopicRuntime.ts
│  │  ├─ BaseLearningScene.ts
│  │  └─ systems/
│  │     ├─ EvidencePinSystem.ts
│  │     ├─ TimelineSystem.ts
│  │     ├─ RouteDrawSystem.ts
│  │     ├─ ScenarioStateMachine.ts
│  │     └─ SnapSystem.ts
│  ├─ three/
│  │  ├─ ThreeTopicRuntime.ts
│  │  ├─ BaseThreeLearningScene.ts
│  │  ├─ CameraController.ts
│  │  ├─ InteractionRaycaster.ts
│  │  ├─ ModelPool.ts
│  │  ├─ TerrainMorphSystem.ts
│  │  ├─ FlowPathSystem.ts
│  │  ├─ VolcanoStateMachine.ts
│  │  └─ RockViewer.ts
│  ├─ domain/
│  │  ├─ river/
│  │  │  ├─ FlowSimulation.ts
│  │  │  ├─ RiverEvidenceValidator.ts
│  │  │  └─ RiverTypes.ts
│  │  ├─ volcano/
│  │  │  ├─ VolcanoModelLab.ts
│  │  │  ├─ VolcanoImpactTimeline.ts
│  │  │  └─ VolcanoTypes.ts
│  │  ├─ rock/
│  │  │  ├─ RockObservationEngine.ts
│  │  │  ├─ RockClassifier.ts
│  │  │  └─ RockTypes.ts
│  │  └─ safety/
│  │     ├─ EarthquakeSafetyEngine.ts
│  │     └─ SafetyTypes.ts
│  ├─ ui/
│  │  ├─ DOMOverlayManager.ts
│  │  ├─ ProgressBar.ts
│  │  ├─ MissionPanel.ts
│  │  ├─ ResearchNotebook.ts
│  │  ├─ TimelineScrubber.ts
│  │  ├─ EvidencePanel.ts
│  │  ├─ HintLayer.ts
│  │  ├─ RewardModal.ts
│  │  ├─ Toast.ts
│  │  └─ ResultPanel.ts
│  ├─ data/
│  │  ├─ standards.ts
│  │  ├─ copy.ko.ts
│  │  ├─ hints.ts
│  │  └─ misconception-tags.ts
│  └─ styles/
│     ├─ tokens.css
│     ├─ layout.css
│     └─ accessibility.css
├─ tests/
│  ├─ unit/
│  ├─ integration/
│  └─ e2e/
├─ package.json
└─ README.md
```

---

## 6. 상태 모델

```ts
type PageId =
  | "p01" | "p02" | "p03" | "p04" | "p05"
  | "p06" | "p07" | "p08" | "p09" | "p10";

type StageId = 1 | 2 | 3 | 4 | 5;

type StandardCode =
  | "4과11-01"
  | "4과11-02"
  | "4과11-03"
  | "4과11-04";

type MisconceptionTag =
  | "erosion_deposition_confusion"
  | "transport_missing"
  | "upstream_downstream_evidence"
  | "volcano_material_state"
  | "model_real_difference"
  | "basalt_granite_grain"
  | "single_feature_rock_rule"
  | "volcano_impact_time"
  | "earthquake_action_sequence"
  | "earthquake_location_rule";

interface GeoValleyState {
  schemaVersion: 1;
  topicId: "topic-11-land-change";
  currentPage: PageId;
  unlockedStage: StageId;
  completedPages: PageId[];
  completedStages: StageId[];
  badges: string[];
  notebook: NotebookEntry[];
  experiments: ExperimentRecord[];
  riverEvidence: RiverEvidenceRecord[];
  rockObservations: RockObservationRecord[];
  volcanoImpactRecords: VolcanoImpactRecord[];
  safetyAttempts: SafetyAttempt[];
  hintCounts: Partial<Record<PageId, number>>;
  misconceptionCounts: Partial<Record<MisconceptionTag, number>>;
  recoveryCompleted: MisconceptionTag[];
  sessionSeed: string;
  settings: {
    mute: boolean;
    reducedMotion: boolean;
    highContrast: boolean;
  };
  updatedAt: number;
}
```

식별 가능한 학생 개인정보는 저장하지 않는다.

---

## 7. EventBus 계약

```ts
type GeoValleyEvent =
  | { type: "TOPIC_READY" }
  | { type: "PAGE_ENTER"; page: PageId }
  | { type: "PAGE_EXIT"; page: PageId }
  | { type: "MISSION_START"; page: PageId; missionId: string }
  | { type: "PREDICTION_SET"; payload: unknown }
  | { type: "EXPERIMENT_START"; page: PageId }
  | { type: "TIMELINE_CHANGED"; page: PageId; step: number }
  | { type: "EVIDENCE_ADDED"; payload: unknown }
  | { type: "OBSERVATION_ADDED"; payload: unknown }
  | { type: "CLASSIFICATION_SUBMITTED"; payload: unknown }
  | { type: "ROUTE_SUBMITTED"; payload: unknown }
  | { type: "HINT_REQUESTED"; page: PageId }
  | { type: "MISSION_RETRY"; page: PageId }
  | { type: "PAGE_COMPLETED"; page: PageId }
  | { type: "STAGE_COMPLETED"; stage: StageId }
  | { type: "BONUS_EXPLORE"; stage: StageId }
  | { type: "SAVE_REQUEST" }
  | { type: "TOPIC_COMPLETED" }
  | { type: "TOPIC_EXIT" };
```

규칙:
- Phaser/Three 내부에서 DOM을 직접 수정하지 않는다.
- UI는 EventBus와 Store만 구독한다.
- 각 Screen은 `mount()`, `unmount()`, `serialize()` 계약을 따른다.
- Screen 종료 시 모든 listener cleanup 필수.

---

## 8. Screen 01 — GeoValleyHub3D

### Three.js
- `geovalley_world.glb`
- 카메라: 3/4 perspective, 낮은 FOV
- orbit: yaw 제한, pitch 제한, pan 금지, zoom 제한
- 3~5개 anomaly hotspot raycast
- stage 완료 상태에 따라 emissive/animation 변경

### 학생 상호작용
- 1 finger drag: 제한 회전
- pinch: 보조 줌
- anomaly hotspot tap

### 완료
- 이상 신호 3개를 확인하면 Screen 02 이동 가능

### P10 재사용
- 같은 Scene graph와 카메라 기준을 사용
- world state만 `damaged -> restored`로 변경

---

## 9. Screen 02 — ObservationHQ

Phaser 또는 DOM 중심.

### 기능
- 5개 Stage 지도
- 진행도
- 수집 배지
- ResearchNotebook
- continue
- teacher unlock은 Science World 공통 정책 재사용

### Stage unlock
기본은 순차 진행.
교사용 설정에서 전체 해금 가능.

---

## 10. Screen 03 — FlowingWaterLab3D

### 목표
침식·운반·퇴적의 **현상 관찰 → 증거 표시 → 개념 연결**.

### Terrain
정밀 erosion simulation을 사용하지 않는다.

```ts
interface TerrainFlowTrial {
  trialId: string;
  sourcePreset: "left" | "center" | "right";
  flowLevel: 1 | 2 | 3;
  phase: 0 | 1 | 2 | 3;
  predictionPin?: NormalizedPoint;
  evidencePins: {
    erosion: NormalizedPoint[];
    transport: NormalizedPoint[];
    deposition: NormalizedPoint[];
  };
}
```

### TerrainMorphSystem
- baseline mesh
- phase1 mesh
- phase2 mesh
- final mesh
- morph target 또는 미리 계산된 vertex state 사용
- flowLevel은 애니메이션 강도/변화량 preset
- 정량 법칙으로 평가하지 않음

### FlowPathSystem
- spline 기반 water ribbon
- particle는 흙 입자 이동을 보조
- particle 하나하나를 실제 입자물리로 해석하지 않음

### TIME SCAN
- phase 0~3 scrub
- 지형 morph와 물 흔적/흙 이동 visual sync
- 학생이 자유롭게 앞뒤 이동 가능

### Evidence validation
- hotspot polygon 기반
- 정확한 픽셀 하나를 요구하지 않고 영역 판정
- 침식/운반/퇴적 각각 최소 1개 이상의 적절한 증거 필요

---

## 11. Screen 04 — RiverEvidenceScene

### 2.5D long map
상류→하류를 horizontal scroll로 이동.

### ObservationPoint
```ts
interface RiverObservationPoint {
  id: string;
  xNormalized: number;
  region: "upper" | "middle" | "lower";
  evidence: Array<
    | "narrow_channel"
    | "steeper_slope"
    | "large_rocks"
    | "wider_channel"
    | "sand_soil_deposit"
    | "gentler_slope"
  >;
}
```

### 규칙
- 한 관측 지점에서 증거 최소 2개 선택
- 상류/하류 판단은 evidence 제출 후 활성화
- “침식은 오직 상류, 퇴적은 오직 하류” 같은 절대 문구는 금지
- 교과 수준에서는 상대적으로 두드러지는 특징을 사용

### Relation validator
`evidence -> region feature -> flowing water process` 연결이 논리적으로 타당한지 검증.

---

## 12. Screen 05 — VolcanoLab3D

### State machine

```ts
type VolcanoLabPhase =
  | "assemble"
  | "predict"
  | "ready"
  | "erupting"
  | "observe"
  | "compare"
  | "complete";
```

### 3D 구성
- volcano model
- eruption material layers
- smoke/ash effect
- lava mesh/path
- optional rock fragments
- cutaway group

### 분출
실제 물리 폭발이 아닌 scripted state animation.

### playback
- pause
- normal
- slow
- fast

### cutaway
- 마그마 위치와 지표의 용암을 관찰하는 보조
- 판구조론/맨틀대류 콘텐츠 없음

### model-vs-real compare
DOM split panel:
- left: model snapshot/playback
- right: education-safe real-volcano simulation clip/visual
- 학생이 common/different evidence connector를 생성

### completion
- 분출물 관찰 3개 이상
- 공통점/차이점 각각 최소 1개
- 분출물 상태/명칭 핵심 연결 완료

---

## 13. Screen 06 — RockLab3D

### Rock data

```ts
type RockKind = "basalt" | "granite";

interface RockSample {
  id: string;
  kind: RockKind;
  modelUrl: string;
  observationAnchors: ObservationAnchor[];
  tags: {
    overallColor: "dark" | "light" | "mixed";
    visibleGrain: "small" | "large";
    vesicles?: "present" | "absent" | "not_obvious";
  };
}
```

### 정확성
- classification 핵심 규칙은 `overallColor + visibleGrain`의 복합 증거
- vesicles는 보조 관찰만 가능
- `vesicles === present`를 basalt 단독 정답 조건으로 사용 금지

### 입력
- 1 finger drag: object rotate
- pinch: zoom
- reset view
- observation anchor tap
- compare tray 2개

### completion
- 표본 4개 이상 관찰
- 현무암/화강암 각 2개 이상 분류
- 분류마다 최소 2개 evidence 제출

---

## 14. Screen 07 — VolcanoCityTimeline

### Timeline

```ts
type ImpactTime = "immediate" | "later" | "long_term";

interface CityLocationState {
  locationId: string;
  time: ImpactTime;
  impacts: Array<{
    id: string;
    valence: "harm" | "benefit" | "mixed";
    evidenceId: string;
  }>;
}
```

### UI
- isometric city
- bottom timeline slider
- location hotspots
- evidence cards

### 원칙
- long-term benefit를 immediate benefit처럼 표현 금지
- 피해와 이로움을 같은 원인/시점으로 단순화 금지

### completion
- 4개 이상 장소 조사
- 서로 다른 시간 단계 2개 이상 비교
- 피해와 이로운 영향 모두 근거 제출

---

## 15. Screen 08 — VolcanoObservationCenter

### 학습 범위
관측 장비의 전문 원리는 평가하지 않는다.
자료를 비교하여 생활 영향과 안전 정보를 정리하는 데 초점.

### Data cards
- before/after image
- observation note
- simple status graph
- location map snapshot

### PriorityBoard
학생이 다음 범주로 정리:
- 지금 확인해야 할 변화
- 주민에게 먼저 전달할 정보
- 계속 관찰할 정보

### completion
- source 3개 이상 확인
- 최종 정보 카드에 서로 다른 source 2개 이상 근거 연결

---

## 16. Screen 09 — EarthquakeSafetySim

### Scenario model

```ts
type SafetyLocation =
  | "home"
  | "school"
  | "building"
  | "outdoor"
  | "coast";

type QuakePhase =
  | "shaking"
  | "shaking_stopped"
  | "evacuating"
  | "safe";

interface SafetyScenario {
  id: string;
  location: SafetyLocation;
  steps: SafetyStep[];
  hazards: Hazard[];
  safeZones: SafeZone[];
}
```

### State machine
학생 행동이 현재 phase에 맞는지 검증한다.
“어떤 행동이 맞는가”뿐 아니라 **언제 해야 하는가**도 검증한다.

예: school
```text
shaking
 -> move under desk
 -> protect head/body
 -> hold desk
shaking_stopped
 -> orderly evacuation
 -> stairs/route
 -> playground safe zone
```

### 입력
- tap/drag move
- protection action
- optional hold gesture
- sequence arrange
- route drawing

### route
- pointer trail -> polyline
- hazard intersection 검사
- safe-zone 도달 검사
- 너무 정밀한 선 그리기 요구 금지

### randomization
- run당 3개 시나리오
- seed 기반
- 완료 후 미체험 시나리오 자유 재생

### timeout
- 시간 제한은 긴장감 연출용
- 시간 초과를 학습 실패로 처리하지 않고 힌트 단계로 전환

---

## 17. Screen 10 — GeoValleyRestoration3D

### RecoveryMissionService

```ts
interface RecoveryRule {
  tag: MisconceptionTag;
  threshold: number;
  missionTemplateId: string;
  standardCode: StandardCode;
}
```

1. `misconceptionCounts` 정렬
2. threshold 이상 tag 선택
3. 최대 3개
4. 동점은 현재 attempt의 최근 오류 우선
5. 해당 수행형 micro mission 생성

### 금지
- 복구미션을 객관식 3문항으로 대체
- 오류가 없을 때 가짜 오개념 생성

오류가 거의 없는 학생:
- 통합 응용 미션 1~2개 제공

### final world state
P01 world reuse:
- river area stable/active
- lab lights on
- observation center active
- geo core emissive
- city activity restored

### export
Canvas 결과 카드:
- 수행 영역
- 배지
- 완료 Stage
- 이름은 export 직전 임시 입력
- 저장 state에는 이름 미포함

---

## 18. 공통 보너스 선택

Stage 완료 후 DOM modal:

```ts
type PostStageChoice = "secure_record" | "bonus_explore";
```

- `secure_record`: 즉시 저장 후 다음 Stage
- `bonus_explore`: 추가 수행형 1개
- bonus 실패해도 core progress 유지
- 랜덤 폭탄/점수 손실 없음

---

## 19. 3D 좌표 및 모델 규칙

Science World 공통 규칙을 따른다.

- Three.js 오른손 좌표계
- Y-up
- 이동 평면 X/Z
- 1 unit = 1 meter
- 바닥 y=0
- rotation은 radians `[x, y, z]`
- imported GLB pivot이 맞지 않으면 원본 수정 대신 wrapper correction

```text
EntityRoot
└─ VisualCorrectionGroup
   └─ ImportedGLB
```

- `Box3`로 실제 크기 검사
- 모델 보정값은 config JSON 관리
- 충돌체는 시각 mesh와 분리
- 3D 화면 내 한글 text mesh 금지

---

## 20. 카메라 규칙

### P01/P10 GeoValley
- 동일 camera preset
- limited orbit
- pan off
- zoom min/max clamp

### P03 Terrain
- limited orbit
- evidence placing mode에서는 camera rotation 잠금
- reset view 제공

### P05 Volcano
- limited orbit
- cutaway toggle 시 camera preset transition
- 자유 비행 금지

### P06 Rocks
- object-centric orbit
- object 중심 고정
- zoom clamp
- double tap reset 선택

---

## 21. Gesture 정책

- 핵심 입력은 Pointer Events
- hover 전용 기능 금지
- tap/drag threshold 적용
- pinch는 보조 zoom
- 멀티터치를 필수 완료 조건으로 사용하지 않는다.
- long press는 보조 몰입 입력만
- drag 대체 선택→위치 탭 제공
- route drawing은 undo/clear 제공
- 3D camera mode와 evidence placing mode를 명확히 분리

---

## 22. 저장

```ts
const STORAGE_KEY = "science-world:moving-geovalley:v1";
```

### 저장 시점
- Page 완료
- Stage 완료
- 실험 trial 완료
- evidence 제출
- rock classification 제출
- safety scenario 완료
- settings 변경
- `visibilitychange`
- topic exit

### IndexedDB stores
```text
progress
notebook
experiments
evidence
safetyAttempts
```

### migration
```ts
type Migration = (state: unknown) => GeoValleyState;
```

---

## 23. MissionResult

```ts
interface MissionResult {
  topicId: "topic-11-land-change";
  attemptId: string;
  completed: boolean;
  completedStages: StageId[];
  standardEvidence: Record<StandardCode, {
    completed: boolean;
    evidenceCount: number;
    retryCount: number;
  }>;
  badges: string[];
  hintCount: number;
  recoveryCompleted: MisconceptionTag[];
  durationSec: number;
  finishedAt: string;
}
```

개인정보는 포함하지 않는다.

---

## 24. 콘텐츠 데이터 분리

과학 내용은 코드에 하드코딩하지 않는다.

```text
standards.json
river-observations.json
rock-samples.json
volcano-impact-timeline.json
earthquake-scenarios.json
recovery-rules.json
copy.ko.json
hints.json
```

검수자가 JSON만 보고 다음을 확인할 수 있어야 한다.
- 성취기준
- 정답/허용 근거
- 금지 단일 규칙
- 피드백
- 시나리오 행동 순서

---

## 25. 에셋 정책

### 3D
- GLB/glTF
- Meshopt/Draco 선택
- KTX2 선택
- Screen별 bundle
- 한 화면의 핵심 3D 오브젝트 수를 보수적으로 제한

### 2D
- WebP 권장
- alpha 필요 시 WebP/PNG
- UI text는 이미지로 제작하지 않는다.

### 페이지당
- 시각적 핵심 foreground asset 10개 이하 권장
- 반복 가능한 소품은 instancing 또는 sprite atlas
- 거대한 3D 한 장면에 불필요한 장식 오브젝트를 쌓지 않는다.

---

## 26. 성능

### 태블릿
- baseline 1280×720
- DPR clamp 1.0 / 1.25 / 1.5
- 3D 핵심 최소 30fps
- 일반 2D 목표 60fps
- low profile에서 real-time shadow off 또는 1개
- postprocessing 기본 off
- high profile에서만 제한적 사용

### 자산
- Screen별 lazy load
- 첫 진입에 전체 단원 GLB 다운로드 금지
- 대형 자산 Service Worker 전체 precache 금지
- P01 로딩 후 P03 자산 prefetch 정도만 허용

### dispose QA
3D↔2D 전환 10회 반복 후:
- active RAF 증가 없음
- EventBus listener 증가 없음
- AnimationMixer 증가 없음
- WebGL texture/geometry 증가 추세 없음

---

## 27. 접근성

- touch target 최소 44px / 권장 48px
- 색+형태+텍스트 병행
- focus-visible
- reduced motion
- mute
- captions
- keyboard fallback
- route drawing 대체 waypoint tap
- drag 대체 select→tap
- long press 대체 button
- 결과 animation replay
- 흔들림 연출은 reduced motion에서 화면 전체 shake 대신 테두리/아이콘 경고로 대체

---

## 28. 오디오

### BGM
```text
bgm_main
bgm_stage_1_river
bgm_stage_2_volcano
bgm_stage_3_rock
bgm_stage_4_city
bgm_stage_5_safety
```

### SFX
```text
sfx_scan
sfx_water_start
sfx_soil_move
sfx_pin_place
sfx_timeline
sfx_volcano_start
sfx_ash
sfx_lava
sfx_rock_rotate
sfx_evidence_confirm
sfx_alert
sfx_route_draw
sfx_safe
sfx_geo_core_restore
```

OGG + MP3 fallback.
첫 사용자 입력 전 autoplay 금지.

---

## 29. 힌트 시스템

```ts
interface HintDefinition {
  pageId: PageId;
  level: 1 | 2 | 3 | 4;
  focusTarget?: string;
  text: string;
  revealAnswer: boolean;
}
```

규칙:
- level 1~3은 정답 직접 노출 금지
- level 4만 부분 관계 설명 허용
- 힌트 사용 횟수는 mastery 실패로 직접 환산하지 않는다.

---

## 30. QA

### 기능
1. 10개 Screen 진입/종료
2. 5개 Stage 완료/해금
3. 새로고침 후 상태 복원
4. P01과 P10 camera/world state 일치
5. P03 TIME SCAN 앞뒤 이동 정상
6. P03 evidence pin 영역 판정
7. P04 evidence 2개 전에는 판단 잠금
8. P05 model-vs-real compare 완료 조건
9. P06 암석 회전/줌/관찰핀
10. P06 vesicle 단독 규칙 부재
11. P07 time state 전환
12. P08 multi-source evidence
13. P09 각 phase별 행동 검증
14. P09 route hazard 검사
15. P10 실제 오류 기반 recovery 생성
16. MissionResult schema 검증

### 교육
1. [4과11-01]~[4과11-04] 수행 행동 연결
2. 침식·운반·퇴적을 관찰 전에 답으로 노출하지 않음
3. 상류/하류를 절대적 단일 특징으로 판정하지 않음
4. 모형과 실제 화산의 차이를 명시
5. 현무암/화강암 외 화성암 평가 없음
6. 구멍을 현무암 단독 판별 기준으로 사용하지 않음
7. 화산의 피해와 이로운 영향을 시간적으로 구분
8. 지진 발생 원인 설명 없음
9. 장소별 안전 행동 순서 검증
10. 오답이 즉시 정답 공개로 끝나지 않음

### 디바이스
- Chrome Android
- Samsung Internet
- Safari iPad
- Desktop Chrome

### 접근성
- pointer/touch
- keyboard
- reduced motion
- mute
- route alternative input

---

## 31. 배포

권장:
- GitHub repository: `moving-geovalley`
- Vercel 또는 Science World 통합 빌드
- `npm run build`
- `npm run test`
- `npm run verify`

`verify`에는 최소:
- TypeScript
- lint
- unit tests
- JSON schema validation
- asset manifest missing-file check

를 포함한다.
