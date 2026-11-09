// GeoValley concept-film kit: the shared parts every film uses.
// A film is data (scenes.js). The kit lays out the "실험 노트" page, then builds one
// paused GSAP timeline: question → experiment → close look + name tag → conclusion → 리버.
// Everything is a pure function of timeline time: no timers, no random numbers.
(function () {
  const STAGE_CENTER = [800, 560]; // a camera at scale 1 shows the stage unmoved
  const svgNS = 'http://www.w3.org/2000/svg';

  const el = (tag, attrs = {}, parent) => {
    const node = tag.startsWith('svg:') ? document.createElementNS(svgNS, tag.slice(4)) : document.createElement(tag);
    for (const [k, v] of Object.entries(attrs)) {
      if (k === 'text') node.textContent = v;
      else if (k === 'html') node.innerHTML = v;
      else node.setAttribute(k, v);
    }
    if (parent) parent.appendChild(node);
    return node;
  };

  // Camera: screen = s * stage + t, so a stage point c lands on the stage centre.
  const camAt = (cam) => {
    if (!cam) return { s: 1, x: 0, y: 0 };
    return { s: cam.s, x: STAGE_CENTER[0] - cam.s * cam.c[0], y: STAGE_CENTER[1] - cam.s * cam.c[1] };
  };
  const project = (p, cam) => {
    const k = camAt(cam);
    return [k.s * p[0] + k.x, k.s * p[1] + k.y];
  };

  function words(node, text) {
    node.textContent = '';
    return text.split(' ').map((w, i, all) => el('span', { class: 'word', text: w + (i < all.length - 1 ? ' ' : '') }, node));
  }

  // A name tag: paper label + leader line + dot on the object it names.
  function makeTag(layer, lines, def, i) {
    const g = el('svg:g', { class: 'leader', id: 'leader-' + i }, lines);
    const path = el('svg:path', { class: 'leader-line' }, g);
    const dot = el('svg:circle', { class: 'leader-dot', r: 11 }, g);
    const box = el('div', { class: 'tag' + (def.minor ? ' minor' : ''), id: 'tag-' + i }, layer);
    el('span', { class: 'tag-text', html: def.text.replace(/\n/g, '<br>') }, box);
    return { def, g, path, dot, box };
  }

  function placeTag(t, anchor, box) {
    // box = top-left corner of the label in screen px; the leader runs to the nearest label edge.
    t.box.style.left = box[0] + 'px';
    t.box.style.top = box[1] + 'px';
    const w = t.box.offsetWidth, h = t.box.offsetHeight;
    const ex = Math.max(box[0], Math.min(anchor[0], box[0] + w));
    const ey = Math.max(box[1], Math.min(anchor[1], box[1] + h));
    t.dot.setAttribute('cx', anchor[0]);
    t.dot.setAttribute('cy', anchor[1]);
    t.path.setAttribute('d', `M${anchor[0]} ${anchor[1]} L${ex} ${ey}`);
    const len = Math.hypot(ex - anchor[0], ey - anchor[1]);
    t.path.setAttribute('stroke-dasharray', `${len} ${len}`);
    t.len = len;
    if (t.def.noLeader) t.g.style.display = 'none';
  }

  // Sample a polyline / svg path once at build time so dots can travel along it.
  function samplePath(d, n) {
    const probe = el('svg:path', { d }, document.getElementById('probe'));
    const len = probe.getTotalLength();
    const pts = [];
    for (let i = 0; i <= n; i++) { const p = probe.getPointAtLength((len * i) / n); pts.push([p.x, p.y]); }
    probe.remove();
    return { pts, len };
  }

  // Deterministic pseudo-random for scatter (seeded, never Math.random).
  function seeded(seed) {
    let s = seed >>> 0;
    return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
  }

  window.GeoKit = { el, words, camAt, project, samplePath, seeded, STAGE_CENTER };

  window.buildFilm = function buildFilm(film) {
    const root = document.getElementById('film');
    const tl = gsap.timeline({ paused: true });
    const stage = document.getElementById('stage');
    const cam = document.getElementById('cam');
    const shake = document.getElementById('shake');
    const art = document.getElementById('art');
    const fx = document.getElementById('fx');
    const tagLayer = document.getElementById('tags');
    const lines = document.getElementById('lines');

    // 1. The experiment: film-specific art and motion.
    art.innerHTML = film.art || '';
    const api = { tl, art, fx, stage, cam, shake, el, samplePath, seeded, svgNS };
    if (film.build) film.build(api);

    // 2. Question: chip lands, words sharpen one by one, then stay still.
    const q = document.getElementById('question-text');
    const qWords = words(q, film.question);
    tl.fromTo('#question', { opacity: 0 }, { opacity: 1, duration: 0.25, ease: 'power2.out' }, 0.1);
    qWords.forEach((w, i) => tl.fromTo(w, { opacity: 0, filter: 'blur(6px)' }, { opacity: 1, filter: 'blur(0px)', duration: 0.14, ease: 'power2.out' }, 0.25 + i * 0.07));

    // 3. Camera states: [{at, dur, s, c}] — the last one should return to s:1.
    const cams = film.cams || [];
    let current = null;
    if (cams.length && cams[0].at === 0) current = cams[0];
    const k0 = camAt(current);
    tl.set(cam, { x: k0.x, y: k0.y, scale: k0.s, transformOrigin: '0 0' }, 0);
    cams.forEach((c) => {
      if (c.at === 0) return;
      const k = camAt(c.s === 1 ? null : c);
      tl.to(cam, { x: k.x, y: k.y, scale: k.s, duration: c.dur || 0.9, ease: 'power2.inOut' }, c.at);
    });
    const camOf = (t) => { let state = cams.length && cams[0].at === 0 ? cams[0] : null; for (const c of cams) if (c.at <= t + 1e-6) state = c.s === 1 ? null : c; return state; };
    const lastMove = cams.reduce((m, c) => Math.max(m, c.at + (c.dur || 0.9)), 0);

    // 4. Name tags: appear on the object as it is named. A tag first shown during a close
    //    look steps back when the camera moves, and a second copy returns on the whole
    //    picture after the last move, in the "already seen" paper style. Two static copies
    //    keep every frame a pure function of time (no callbacks while seeking).
    const finalAt = film.tagsReturn ?? lastMove;
    const PAPER = { backgroundColor: '#fffaf0', borderColor: '#6f7d68', color: '#3d544a' };
    const defs = film.tags || [];
    const reveal = (t, at) => {
      tl.fromTo(t.dot, { opacity: 0, scale: 0.2, transformOrigin: '50% 50%' }, { opacity: 1, scale: 1, duration: 0.3, ease: 'back.out(2)' }, at);
      tl.fromTo(t.path, { opacity: 0, strokeDashoffset: t.len || 1 }, { opacity: 1, strokeDashoffset: 0, duration: 0.3, ease: 'power2.out' }, at + 0.08);
      tl.fromTo(t.box, { opacity: 0, scale: 0.9, transformOrigin: '50% 50%' }, { opacity: 1, scale: 1, duration: 0.4, ease: 'expo.out' }, at + 0.15);
    };
    defs.forEach((d, i) => {
      const camThen = camOf(d.at);
      const nextMove = cams.find((c) => c.at > d.at && c.at < finalAt + 0.01) || null; // any later camera move
      const nextTag = defs.slice(i + 1).find((n) => !n.minor);
      if (nextMove) {
        const first = makeTag(tagLayer, lines, d, i + 'a');
        placeTag(first, project(d.a, camThen), d.zbox || d.box);
        reveal(first, d.at);
        tl.to([first.box, first.g], { opacity: 0, duration: 0.2, ease: 'power2.in' }, nextMove.at);
        const back = makeTag(tagLayer, lines, d, i + 'b');
        placeTag(back, d.a, d.box);
        const late = !nextTag || nextTag.at > finalAt; // still the newest label when it returns
        if (!late && !d.minor) Object.assign(back.box.style, { background: PAPER.backgroundColor, borderColor: PAPER.borderColor, color: PAPER.color });
        tl.fromTo([back.box, back.g], { opacity: 0 }, { opacity: 1, duration: 0.35, ease: 'power2.out' }, finalAt + 0.05);
        if (late && nextTag && !d.minor) tl.to(back.box, { ...PAPER, duration: 0.3 }, nextTag.at);
      } else {
        const t = makeTag(tagLayer, lines, d, i);
        placeTag(t, project(d.a, camThen), d.box);
        reveal(t, d.at);
        if (nextTag && !d.minor) tl.to(t.box, { ...PAPER, duration: 0.3, ease: 'power1.out' }, nextTag.at);
        if (d.until) tl.to([t.box, t.g], { opacity: 0, duration: 0.25, ease: 'power2.in' }, d.until); // the object left
      }
    });

    // 5. Conclusion strip: words go from light grey to ink, then hold to the end.
    const c = document.getElementById('conclusion-text');
    const cWords = words(c, film.conclusion);
    const cAt = film.conclusionAt ?? 11.4;
    tl.fromTo('#conclusion', { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: 0.5, ease: 'expo.out' }, cAt);
    cWords.forEach((w, i) => tl.fromTo(w, { color: '#b9c2b4' }, { color: '#243e36', duration: 0.12, ease: 'none' }, cAt + 0.25 + i * 0.09));

    // 6. 리버 reacts with the pose that fits the place.
    if (film.river) {
      const r = document.getElementById('river');
      r.src = 'assets/art/' + film.river.pose;
      r.style.height = (film.river.h || 430) + 'px';
      if (film.river.flip) r.style.transform = 'scaleX(-1)';
      const at = film.river.at ?? 12.2;
      tl.fromTo('#river-wrap', { y: 320, opacity: 0 }, { y: 0, opacity: 1, duration: 0.65, ease: 'back.out(1.4)' }, at);
      tl.fromTo('#river-wrap', { rotation: 0, transformOrigin: '50% 100%' }, { rotation: -4, duration: 0.22, ease: 'power2.out', yoyo: true, repeat: 1 }, at + 0.9);
    } else {
      document.getElementById('river-wrap').style.display = 'none';
    }

    tl.set({}, {}, 15); // the film is 15 s; the last frame holds the full lesson (poster)
    return { tl };
  };
})();
