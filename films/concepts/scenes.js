// Ten GeoValley concept films as data. Coordinates are frame pixels (1920×1080).
// Each film: question → the experiment the student just did → a close look with a
// name tag on the object → one-line conclusion → 리버 reacts. Cue times line up with
// the app's three captions at 0 s, 5 s and 10 s (src/concepts.js CONCEPT_CUES).
(function () {
  const { el, samplePath, seeded } = window.GeoKit;
  const img = (id, src, x, y, w, extra = '') => `<img class="art-img" id="${id}" src="assets/art/${src}" style="left:${x}px;top:${y}px;width:${w}px;${extra}" alt="">`;
  const frame = (id, src, x, y, w, h, extra = '') => `<div class="frame" id="${id}" style="left:${x}px;top:${y}px;width:${w}px;height:${h}px;${extra}"><img src="assets/art/${src}" alt=""></div>`;

  // A stroke that draws along its path (water, red water, route).
  function flow(api, { d, color, width, at, dur, cap = 'round', opacity = 1, under, dash }) {
    const p = el('svg:path', { d, fill: 'none', stroke: color, 'stroke-width': width, 'stroke-linecap': cap, 'stroke-linejoin': 'round', opacity }, api.fx);
    if (under) api.fx.insertBefore(p, api.fx.firstChild);
    const len = p.getTotalLength();
    if (dash) { p.setAttribute('stroke-dasharray', dash); api.tl.fromTo(p, { opacity: 0 }, { opacity, duration: 0.3 }, at); return p; }
    p.setAttribute('stroke-dasharray', `${len} ${len}`);
    api.tl.fromTo(p, { strokeDashoffset: len }, { strokeDashoffset: 0, duration: dur, ease: 'none' }, at);
    return p;
  }
  // Small grains travelling along a path, one after another.
  function grains(api, { d, n, at, travel, gap, r = 9, colors = ['#8a5a32', '#a87445', '#6f4a2b'], seed = 7, spread = 10, endFade = true }) {
    const { pts } = samplePath(d, 40);
    const rnd = seeded(seed);
    for (let i = 0; i < n; i++) {
      const dx = (rnd() - 0.5) * spread, dy = (rnd() - 0.5) * spread;
      const c = el('svg:circle', { r: r * (0.7 + rnd() * 0.6), fill: colors[i % colors.length], opacity: 0 }, api.fx);
      const t0 = at + i * gap;
      api.tl.set(c, { attr: { cx: pts[0][0] + dx, cy: pts[0][1] + dy } }, 0);
      api.tl.to(c, { opacity: 1, duration: 0.2 }, t0);
      api.tl.to(c, { keyframes: pts.slice(1).map((p) => ({ attr: { cx: p[0] + dx, cy: p[1] + dy }, duration: travel / (pts.length - 1), ease: 'none' })) }, t0);
      if (endFade) api.tl.to(c, { opacity: 0, duration: 0.3 }, t0 + travel - 0.1);
    }
  }
  const arrowDown = (api, x, y, at, until) => {
    const g = el('svg:g', { opacity: 0 }, api.fx);
    el('svg:path', { d: `M${x} ${y - 70} V${y} M${x - 26} ${y - 26} L${x} ${y} L${x + 26} ${y - 26}`, stroke: '#69501c', 'stroke-width': 12, fill: 'none', 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, g);
    api.tl.fromTo(g, { opacity: 0, y: -18 }, { opacity: 1, y: 0, duration: 0.35, ease: 'expo.out' }, at);
    api.tl.to(g, { y: 14, duration: 0.5, ease: 'power2.inOut', yoyo: true, repeat: 3 }, at + 0.4);
    api.tl.to(g, { opacity: 0, duration: 0.25 }, until);
  };
  const hazard = (api, x, y, at) => {
    const g = el('svg:g', { opacity: 0 }, api.fx);
    el('svg:circle', { cx: x, cy: y, r: 40, fill: '#fff5dd', stroke: '#c1442e', 'stroke-width': 8 }, g);
    el('svg:path', { d: `M${x} ${y - 20} V${y + 4}`, stroke: '#c1442e', 'stroke-width': 9, 'stroke-linecap': 'round' }, g);
    el('svg:circle', { cx: x, cy: y + 19, r: 5.5, fill: '#c1442e' }, g);
    api.tl.fromTo(g, { opacity: 0, scale: 0.5, transformOrigin: `${x}px ${y}px` }, { opacity: 1, scale: 1, duration: 0.35, ease: 'back.out(2)' }, at);
  };
  // Ash clumps drift from the plume; deterministic paths.
  function ash(api, { from, n, at, span, area, seed = 3, size = 150, stay = false, fadeAt }) {
    const rnd = seeded(seed);
    for (let i = 0; i < n; i++) {
      const im = el('img', { class: 'art-img', src: `assets/art/volcano-ash-puff-${i % 3}-v1.webp`, alt: '' }, api.art);
      const s = size * (0.7 + rnd() * 0.6);
      Object.assign(im.style, { width: s + 'px', left: '0px', top: '0px', opacity: 0 });
      const tx = area[0] + rnd() * (area[2] - area[0]), ty = area[1] + rnd() * (area[3] - area[1]);
      const t0 = at + (i / n) * span;
      api.tl.set(im, { x: from[0] - s / 2, y: from[1] - s / 2 }, 0);
      api.tl.to(im, { opacity: 0.9, duration: 0.3 }, t0);
      api.tl.to(im, { x: tx - s / 2, y: ty - s / 2, duration: 2.4, ease: 'power1.out' }, t0);
      if (!stay) api.tl.to(im, { opacity: 0, duration: 0.6 }, t0 + 2.0);
      else if (fadeAt) api.tl.to(im, { opacity: 0, duration: 0.6 }, fadeAt + i * 0.2);
    }
  }

  window.GEO_FILMS = {
    // ── 강 1: 모래 언덕에 물을 흘린 실험 ──────────────────────────────
    'river-0': {
      question: '흐르는 물은 땅을 어떻게 바꿀까?',
      conclusion: '물은 땅을 깎고, 옮기고, 쌓아.',
      art: img('dry', 'river-sand-model.webp', 140, 250, 1280) + img('wet', 'river-sand-wet-v1.webp', 140, 250, 1280, 'opacity:0') +
        img('fan', 'river-sediment-fan-v1.webp', 1120, 704, 380, 'opacity:0;transform-origin:100% 50%') + img('can', 'tool-water.webp', 170, 170, 230, 'opacity:0'),
      build(api) {
        const { tl } = api;
        tl.fromTo('#can', { opacity: 0, x: -40, rotation: 0 }, { opacity: 1, x: 0, duration: 0.5, ease: 'expo.out' }, 0.4);
        tl.to('#can', { rotation: 18, transformOrigin: '30% 70%', duration: 0.5, ease: 'power2.inOut' }, 0.9);
        const water = 'M396 330 C420 380 440 420 470 460 C560 545 650 600 780 646 S1000 690 1100 704 S1300 732 1400 748';
        flow(api, { d: water, color: '#58bbd1', width: 26, at: 1.1, dur: 2.2, opacity: 0.85 });
        flow(api, { d: water, color: '#c9eef6', width: 7, at: 1.25, dur: 2.2, opacity: 0.9 });
        tl.to('#wet', { opacity: 1, duration: 6, ease: 'power1.inOut' }, 1.6);
        grains(api, { d: 'M470 470 C560 545 650 600 780 646 S1000 690 1100 704 S1260 728 1330 736', n: 16, at: 2.6, travel: 3.6, gap: 0.5, r: 9, spread: 26, endFade: false });
        tl.fromTo('#fan', { opacity: 0, scaleX: 0.2, scaleY: 0.6 }, { opacity: 1, scaleX: 1, scaleY: 1, duration: 5.5, ease: 'power1.out' }, 6.0);
        tl.to('#can', { opacity: 0, duration: 0.4 }, 11.0);
      },
      cams: [{ at: 4.9, dur: 0.9, s: 1.5, c: [880, 640] }, { at: 9.5, dur: 0.9, s: 1 }],
      tags: [
        { text: '침식 · 깎임', at: 1.9, a: [520, 505], box: [560, 250] },
        { text: '운반 · 이동', at: 5.9, a: [900, 668], box: [860, 380], zbox: [760, 300] },
        { text: '퇴적 · 쌓임', at: 10.5, a: [1300, 730], box: [1130, 520] }
      ],
      river: { pose: 'hero-cheer.webp', h: 440 }
    },

    // ── 강 2: 상류에서 하류까지 ─────────────────────────────────────
    'river-1': {
      question: '강의 위쪽과 아래쪽은 어떻게 다를까?',
      conclusion: '상류는 좁고 급하고, 하류는 넓고 완만해.',
      art: frame('field', 'river-field.webp', 160, 200, 1280, 720),
      build(api) {
        grains(api, { d: 'M352 470 C360 540 380 600 442 646 S600 684 700 692 S900 676 960 662 S1080 650 1120 646', n: 14, at: 5.4, travel: 4.2, gap: 0.3, r: 6, colors: ['#7b7b74', '#9b8f7a', '#5f625c'], spread: 14 });
      },
      cams: [{ at: 0, s: 1.7, c: [380, 500] }, { at: 4.9, dur: 1.1, s: 1.7, c: [720, 670] }, { at: 9.5, dur: 1.0, s: 1 }],
      tags: [
        { text: '상류 · 좁고 급해', at: 1.2, a: [352, 520], box: [210, 250], zbox: [430, 300] },
        { text: '흙과 돌의 이동', at: 6.2, a: [700, 692], box: [560, 760], zbox: [520, 330] },
        { text: '하류 · 넓고 완만해', at: 10.7, a: [1110, 680], box: [960, 300] }
      ],
      river: { pose: 'hero-lens.webp', h: 420 }
    },

    // ── 화산 1: 화산 모형에서 붉은 물의 흐름 ─────────────────────────
    'volcano-0': {
      question: '모형에서 붉은 물은 어디로 갈까?',
      conclusion: '붉은 물로 흐르는 모습만 나타냈어.',
      art: img('tray', 'volcano-tray.webp', 240, 742, 1000) + img('mountain', 'volcano-mountain.webp', 420, 318, 640) + img('syringe', 'volcano-syringe.webp', 1250, 250, 170),
      build(api) {
        const { tl } = api;
        // tube from the syringe tip, under the tray edge, into the model's base
        flow(api, { d: 'M1335 640 C1335 700 1300 760 1200 800 L760 800', color: '#a9b8b1', width: 16, at: 0, dur: 0.01 });
        arrowDown(api, 1335, 230, 0.7, 3.8);
        flow(api, { d: 'M1335 640 C1335 700 1300 760 1200 800 L760 800', color: '#d5543b', width: 9, at: 1.4, dur: 1.6 });
        flow(api, { d: 'M760 800 C740 600 740 450 742 340', color: '#d5543b', width: 9, at: 3.0, dur: 1.2, opacity: 0.35, dash: '14 16' });
        const pool = el('svg:ellipse', { cx: 742, cy: 334, rx: 44, ry: 13, fill: '#d5543b', opacity: 0 }, api.fx);
        tl.fromTo(pool, { opacity: 0, attr: { rx: 8 } }, { opacity: 1, attr: { rx: 44 }, duration: 0.8, ease: 'power2.out' }, 4.4);
        flow(api, { d: 'M760 340 C790 400 800 450 840 500 S900 600 930 650 S990 730 1030 760', color: '#d5543b', width: 20, at: 5.3, dur: 4.5 });
        flow(api, { d: 'M726 340 C700 410 690 470 650 540 S600 640 560 700', color: '#d5543b', width: 14, at: 6.4, dur: 4.0, opacity: 0.85 });
      },
      cams: [{ at: 4.9, dur: 0.9, s: 1.6, c: [742, 420] }, { at: 9.5, dur: 0.9, s: 1 }],
      tags: [
        { text: '손잡이 밀기', at: 1.2, a: [1335, 268], box: [1460, 320] },
        { text: '꼭대기로 나옴', at: 5.9, a: [742, 334], box: [820, 190], zbox: [880, 250] },
        { text: '경사면 따라 흐름', at: 10.5, a: [920, 640], box: [1060, 560] }
      ],
      river: { pose: 'hero-lens.webp', h: 400 }
    },

    // ── 화산 2: 모형과 실제 화산 비교 ───────────────────────────────
    'volcano-1': {
      question: '모형과 실제 화산은 무엇이 같고 다를까?',
      conclusion: '실제 화산에서는 기체와 화산재도 나와.',
      art: img('tray', 'volcano-tray.webp', 140, 700, 640) + img('mountain', 'volcano-mountain.webp', 200, 400, 520) + frame('real', 'volcano-eruption.webp', 860, 210, 900, 506),
      build(api) {
        const { tl } = api;
        flow(api, { d: 'M470 412 C495 470 505 520 540 570 S600 660 640 715', color: '#d5543b', width: 18, at: 0.6, dur: 3.2 });
        const pool = el('svg:ellipse', { cx: 460, cy: 408, rx: 34, ry: 10, fill: '#d5543b' }, api.fx);
        tl.fromTo(pool, { opacity: 0 }, { opacity: 1, duration: 0.4 }, 0.4);
        tl.fromTo('#real', { opacity: 0, x: 40 }, { opacity: 1, x: 0, duration: 0.6, ease: 'expo.out' }, 0.3);
      },
      cams: [{ at: 4.9, dur: 0.9, s: 1.45, c: [1310, 470] }, { at: 9.5, dur: 0.9, s: 1 }],
      tags: [
        { text: '모형: 붉은 물', at: 1.3, a: [560, 600], box: [170, 260] },
        { text: '실제: 용암', at: 5.9, a: [1370, 610], box: [1190, 760], zbox: [1100, 860] },
        { text: '화산재', at: 6.3, a: [1150, 330], box: [930, 240], zbox: [300, 230], minor: true },
        { text: '기체', at: 6.6, a: [1500, 270], box: [1560, 140], zbox: [1440, 150], minor: true },
        { text: '같은 점: 아래로 흘러\n다른 점: 기체·화산재', at: 10.5, a: [800, 650], box: [430, 770], noLeader: true }
      ],
      conclusionAt: 12.2,
      river: { pose: 'hero-cheer.webp', h: 360 }
    },

    // ── 암석 1: 색과 알갱이 ─────────────────────────────────────────
    'rocks-0': {
      question: '두 돌은 무엇이 다를까?',
      conclusion: '색과 알갱이가 돌 이름의 단서야.',
      art: img('rockA', 'rock-basalt-study-v1.webp', 170, 250, 620) + img('rockB', 'rock-granite-study-v1.webp', 900, 250, 620) +
        `<div id="lens" style="position:absolute;left:0;top:0;width:300px;height:300px;border-radius:50%;overflow:hidden;border:12px solid #69501c;background:#fff5dd;box-shadow:0 6px 0 #c9b582;opacity:0">` +
        `<img id="lensA" src="assets/art/rock-basalt-study-v1.webp" style="position:absolute;left:0;top:0;width:1364px" alt=""><img id="lensB" src="assets/art/rock-granite-study-v1.webp" style="position:absolute;left:0;top:0;width:1364px;opacity:0" alt=""></div>` +
        `<div id="handle" style="position:absolute;left:0;top:0;width:34px;height:150px;border-radius:17px;background:#69501c;opacity:0"></div>` +
        `<div id="nameA" class="tag minor" style="left:330px;top:700px;opacity:0">현무암</div><div id="nameB" class="tag minor" style="left:1060px;top:700px;opacity:0">화강암</div>`,
      build(api) {
        const { tl } = api;
        const K = 2.2, R = 150; // lens shows the rock at 2.2× through a 300 px window
        const lensAt = (rock, p) => {
          const o = rock === 'A' ? [170, 250] : [900, 250];
          return { lens: { x: p[0] - R, y: p[1] - R }, inner: { x: R - (p[0] - o[0]) * K, y: R - (p[1] - o[1]) * K } };
        };
        const a1 = lensAt('A', [470, 440]), a2 = lensAt('A', [540, 470]);
        tl.set('#lens', a1.lens, 0); tl.set('#lensA', a1.inner, 0); tl.set('#lensB', lensAt('B', [470, 440]).inner, 0);
        tl.set('#handle', { x: a1.lens.x + 238, y: a1.lens.y + 250, rotation: -40 }, 0);
        tl.to(['#lens', '#handle'], { opacity: 1, duration: 0.4 }, 0.8);
        tl.to('#lens', { ...a2.lens, duration: 3.2, ease: 'sine.inOut' }, 1.2);
        tl.to('#lensA', { ...a2.inner, duration: 3.2, ease: 'sine.inOut' }, 1.2);
        tl.to('#handle', { x: a2.lens.x + 238, y: a2.lens.y + 250, duration: 3.2, ease: 'sine.inOut' }, 1.2);
        const b1 = lensAt('B', [1200, 450]), b2 = lensAt('B', [1250, 430]);
        tl.to('#lens', { ...b1.lens, duration: 0.9, ease: 'power2.inOut' }, 4.9);
        tl.to('#lensA', { x: lensAt('A', [1200, 450]).inner.x, y: lensAt('A', [1200, 450]).inner.y, duration: 0.9, ease: 'power2.inOut' }, 4.9);
        tl.to('#lensB', { ...b1.inner, duration: 0.9, ease: 'power2.inOut' }, 4.9);
        tl.to('#handle', { x: b1.lens.x + 238, y: b1.lens.y + 250, duration: 0.9, ease: 'power2.inOut' }, 4.9);
        tl.to('#lensA', { opacity: 0, duration: 0.3 }, 5.3); tl.to('#lensB', { opacity: 1, duration: 0.3 }, 5.3);
        tl.to('#lens', { ...b2.lens, duration: 3.0, ease: 'sine.inOut' }, 6.0);
        tl.to('#lensB', { ...b2.inner, duration: 3.0, ease: 'sine.inOut' }, 6.0);
        tl.to('#handle', { x: b2.lens.x + 238, y: b2.lens.y + 250, duration: 3.0, ease: 'sine.inOut' }, 6.0);
        tl.to(['#lens', '#handle'], { opacity: 0, duration: 0.35 }, 9.6);
        tl.fromTo('#nameA', { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 0.4, ease: 'expo.out' }, 10.4);
        tl.fromTo('#nameB', { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 0.4, ease: 'expo.out' }, 10.6);
      },
      tags: [
        { text: 'A · 어두운색, 알갱이가 잘 안 보임', at: 1.8, a: [440, 330], box: [170, 196] },
        { text: 'B · 밝은색, 알갱이가 뚜렷함', at: 6.0, a: [1150, 330], box: [960, 196] },
        { text: '두 표본 비교', at: 10.9, a: [850, 470], box: [700, 800], noLeader: true }
      ],
      river: { pose: 'hero-brush.webp', h: 380 }
    },

    // ── 암석 2: 증거로 분류 ─────────────────────────────────────────
    'rocks-1': {
      question: '새 표본은 어느 쪽과 같을까?',
      conclusion: '증거 두 개로 기준 돌과 비교해.',
      art: `<div class="frame" id="trayA" style="left:180px;top:620px;width:560px;height:250px;background:#efe3c4;border-color:#d8c79e"></div><div class="frame" id="trayB" style="left:820px;top:620px;width:560px;height:250px;background:#efe3c4;border-color:#d8c79e"></div>` +
        img('refA', 'rock-0.webp', 220, 660, 250) + img('refB', 'rock-1.webp', 860, 660, 250) +
        `<div class="tag minor" style="left:200px;top:548px">현무암</div><div class="tag minor" style="left:840px;top:548px">화강암</div>` +
        img('newC', 'rock-2.webp', 620, 250, 330) +
        `<div id="ev1" class="tag minor" style="left:1010px;top:270px;opacity:0">전체가 어두운색</div><div id="ev2" class="tag minor" style="left:1010px;top:370px;opacity:0">알갱이가 잘 안 보임</div>`,
      build(api) {
        const { tl } = api;
        tl.fromTo('#newC', { opacity: 0, y: -30 }, { opacity: 1, y: 0, duration: 0.6, ease: 'expo.out' }, 0.5);
        tl.fromTo('#ev1', { opacity: 0, x: -30 }, { opacity: 1, x: 0, duration: 0.4, ease: 'expo.out' }, 3.0);
        tl.fromTo('#ev2', { opacity: 0, x: -30 }, { opacity: 1, x: 0, duration: 0.4, ease: 'expo.out' }, 3.6);
        // evidence links to the matching reference stone
        flow(api, { d: 'M1010 300 C900 420 560 520 360 660', color: '#69501c', width: 6, at: 5.4, dur: 1.2, opacity: 0.8 });
        flow(api, { d: 'M1010 400 C900 480 600 560 400 670', color: '#69501c', width: 6, at: 5.8, dur: 1.2, opacity: 0.8 });
        tl.to(['#ev1', '#ev2'], { opacity: 0.5, duration: 0.4 }, 9.4);
        tl.to('#newC', { x: -220, y: 410, scale: 0.62, transformOrigin: '50% 50%', duration: 1.1, ease: 'power3.inOut' }, 9.6);
      },
      tags: [
        { text: '돌 관찰', at: 1.2, a: [780, 330], box: [330, 230], until: 9.5 },
        { text: '두 증거 연결', at: 5.9, a: [1100, 480], box: [1040, 470], noLeader: true },
        { text: '분류: 현무암', at: 10.8, a: [575, 720], box: [470, 420] }
      ],
      conclusionAt: 11.8,
      river: { pose: 'hero-brush.webp', h: 380 }
    },

    // ── 도시 1: 화산의 영향과 시간 ──────────────────────────────────
    'city-0': {
      question: '화산의 영향은 시간이 지나면 어떻게 될까?',
      conclusion: '좋은 흙이 되기까지는 아주 오랜 시간이 걸려.',
      art: frame('erupt', 'city-eruption.webp', 160, 200, 1280, 720) + frame('calm', 'city-calm.webp', 160, 200, 1280, 720, 'opacity:0'),
      build(api) {
        const { tl } = api;
        ash(api, { from: [960, 260], n: 9, at: 0.8, span: 3.4, area: [400, 330, 1100, 620], size: 170 });
        tl.to('#calm', { opacity: 1, duration: 0.8, ease: 'power1.inOut' }, 4.7);
        // ash left on the fields after the eruption, cleared during recovery
        ash(api, { from: [700, 300], n: 8, at: 4.9, span: 0.6, area: [560, 380, 860, 500], size: 130, seed: 11, stay: true, fadeAt: 6.6 });
        // a time line along the top edge of the picture: dot moves with the story
        flow(api, { d: 'M200 186 H1400', color: '#d8c79e', width: 10, at: 0, dur: 0.01 });
        const dot = el('svg:circle', { cx: 200, cy: 186, r: 16, fill: '#234d43' }, api.fx);
        tl.fromTo(dot, { attr: { cx: 200 } }, { attr: { cx: 1400 }, duration: 11, ease: 'none' }, 0.5);
      },
      cams: [{ at: 4.9, dur: 0.9, s: 1.5, c: [710, 440] }, { at: 9.5, dur: 0.9, s: 1 }],
      tags: [
        { text: '분출 당시: 화산재 피해', at: 1.4, a: [930, 270], box: [980, 250] },
        { text: '피해 복구', at: 6.0, a: [690, 450], box: [210, 640], zbox: [520, 230] },
        { text: '아주 오랜 시간 뒤: 기름진 흙', at: 10.5, a: [780, 470], box: [560, 780] }
      ],
      conclusionAt: 11.8,
      river: { pose: 'hero-cheer.webp', h: 400 }
    },

    // ── 도시 2: 관찰 → 까닭 → 안전한 행동 ──────────────────────────
    'city-1': {
      question: '화산재가 남아 있으면 어떻게 할까?',
      conclusion: '사실과 까닭을 이어서 안전하게 행동해.',
      art: frame('calm', 'city-calm.webp', 160, 200, 1280, 720),
      build(api) {
        ash(api, { from: [900, 160], n: 10, at: 0.6, span: 3.6, area: [260, 330, 1200, 700], size: 150, seed: 5, stay: true });
      },
      cams: [{ at: 4.9, dur: 0.9, s: 1.7, c: [330, 430] }, { at: 9.4, dur: 0.9, s: 1 }],
      tags: [
        { text: '관찰한 사실: 화산재', at: 1.8, a: [700, 520], box: [760, 230] },
        { text: '까닭: 비행·건강에 영향', at: 6.0, a: [314, 430], box: [200, 760], zbox: [430, 260] },
        { text: '안전한 행동: 안내 확인', at: 10.9, a: [1640, 700], box: [1010, 560] }
      ],
      conclusionAt: 12.0,
      river: { pose: 'hero-protect-mask.webp', h: 420, at: 10.3 }
    },

    // ── 안전 1: 흔들릴 때 몸 보호 ───────────────────────────────────
    'safety-0': {
      question: '땅이 흔들리면 무엇부터 할까?',
      conclusion: '흔들림이 멈출 때까지 몸을 보호해.',
      art: frame('room', 'classroom.webp', 160, 200, 1280, 720) +
        `<div id="desk" style="position:absolute;left:470px;top:520px;width:720px;height:420px">` +
        `<div style="position:absolute;left:0;top:0;width:720px;height:46px;border-radius:12px;background:#c98d4e;box-shadow:0 10px 0 #8d5a2c"></div>` +
        `<div id="legL" style="position:absolute;left:40px;top:50px;width:30px;height:340px;background:#8d969a;border-radius:6px"></div>` +
        `<div id="legR" style="position:absolute;left:650px;top:50px;width:30px;height:340px;background:#8d969a;border-radius:6px"></div></div>` +
        img('protect', 'hero-protect.webp', 770, 590, 330, 'opacity:0') + img('hold', 'hero-hold-leg-v1.webp', 805, 590, 347, 'opacity:0'),
      build(api) {
        const { tl } = api;
        // gentle, small shake (6 px) that stops when the shaking ends
        tl.to('#room', { x: 6, duration: 0.09, ease: 'sine.inOut', yoyo: true, repeat: 51 }, 0.3);
        tl.to('#room', { x: 0, duration: 0.2 }, 9.7);
        tl.to('#room', { x: 4, duration: 0.09, ease: 'sine.inOut', yoyo: true, repeat: 9 }, 10.0);
        tl.to('#room', { x: 0, duration: 0.3, ease: 'power2.out' }, 11.0);
        tl.fromTo('#protect', { opacity: 0, x: -360 }, { opacity: 1, x: 0, duration: 1.1, ease: 'power3.out' }, 0.7);
        tl.to('#protect', { opacity: 0, duration: 0.4 }, 9.8);
        tl.fromTo('#hold', { opacity: 0 }, { opacity: 1, duration: 0.4 }, 9.8);
      },
      cams: [{ at: 4.9, dur: 0.9, s: 1.5, c: [930, 700] }, { at: 9.4, dur: 0.9, s: 1 }],
      tags: [
        { text: '책상 아래', at: 2.0, a: [760, 545], box: [520, 260] },
        { text: '머리·몸 보호', at: 6.0, a: [930, 650], box: [560, 380], zbox: [1060, 240] },
        { text: '다리 잡고 기다리기', at: 10.6, a: [1135, 790], box: [1200, 440] }
      ],
      conclusionAt: 11.9,
      river: null
    },

    // ── 안전 2: 멈춘 뒤 안전한 길 ───────────────────────────────────
    'safety-1': {
      question: '흔들림이 멈추면 어디로 갈까?',
      conclusion: '안내를 따라 넓은 곳으로 걸어가.',
      art: frame('school', 'school.webp', 160, 200, 1280, 720) + img('walker', 'river-pose-0.webp', 0, 0, 80, 'opacity:0'),
      build(api) {
        const { tl } = api;
        hazard(api, 838, 290, 2.6); hazard(api, 940, 345, 3.0);
        const route = 'M340 350 L506 438 L506 632 L736 718 L1056 760 L1170 690 L1270 600';
        flow(api, { d: route, color: '#fffaf0', width: 26, at: 4.8, dur: 4.4 });
        flow(api, { d: route, color: '#2f8a6f', width: 12, at: 4.8, dur: 4.4 });
        const { pts } = samplePath(route, 30);
        tl.set('#walker', { x: pts[0][0] - 40, y: pts[0][1] - 90 }, 0);
        tl.to('#walker', { opacity: 1, duration: 0.3 }, 0.6);
        tl.to('#walker', { keyframes: pts.slice(1).map((p) => ({ x: p[0] - 40, y: p[1] - 90, duration: 4.4 / (pts.length - 1), ease: 'none' })) }, 4.8);
        const ring = el('svg:circle', { cx: 340, cy: 350, r: 60, fill: 'none', stroke: '#234d43', 'stroke-width': 8, opacity: 0 }, api.fx);
        tl.fromTo(ring, { opacity: 0, attr: { r: 40 } }, { opacity: 1, attr: { r: 70 }, duration: 0.6, ease: 'expo.out' }, 1.0);
        tl.to(ring, { opacity: 0, duration: 0.3 }, 4.7);
      },
      cams: [{ at: 0, s: 1.4, c: [520, 420] }, { at: 4.9, dur: 0.9, s: 1.4, c: [780, 560] }, { at: 9.3, dur: 0.9, s: 1 }],
      tags: [
        { text: '흔들림 멈춤 확인', at: 1.3, a: [340, 330], box: [140, 120 + 120] },
        { text: '위험에서 떨어지기', at: 6.0, a: [880, 310], box: [960, 380], zbox: [950, 250] },
        { text: '안내 따라 넓은 곳으로', at: 10.5, a: [1270, 600], box: [1000, 820] }
      ],
      conclusionAt: 11.9,
      river: { pose: 'hero-protect.webp', h: 360 }
    }
  };
})();
