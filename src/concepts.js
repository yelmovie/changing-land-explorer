import {$, icon, escapeHTML} from './ui.js';
import {playSound, stopSounds} from './sound.js';

// All captions remain DOM text, so a teacher can read them from a whiteboard.
export const CONCEPTS = {
  river: [
    {title:'물이 땅을 바꾸는 세 가지 일', labels:['깎임','이동','쌓임'], cues:['흐르는 물이 땅을 깎아. 이것을 침식이라고 해.','깎인 흙과 돌은 물과 함께 이동해.','물의 흐름이 느려지면 쌓여. 이것을 퇴적이라고 해.'], summary:'같은 지형에서 물의 양을 바꾸면, 깎이고 옮겨지는 흙의 양도 달라져.'},
    {title:'상류에서 하류까지', labels:['상류','흙과 돌의 이동','하류'], cues:['상류는 대체로 물길이 좁고 경사가 급해.','물은 흙과 돌을 아래쪽으로 옮겨.','하류는 대체로 넓고 완만해. 모래와 고운 흙이 쌓여.'], summary:'네가 찾은 물길의 넓이와 돌의 크기가 상류·하류를 구별하는 단서야.'}
  ],
  volcano: [
    {title:'화산 모형에서 관찰한 흐름', labels:['손잡이 밀기','꼭대기로 나옴','경사면 따라 흐름'], cues:['주사기 손잡이를 밀면 붉은 물이 관을 따라 올라가.','붉은 물이 산 모형 꼭대기로 나와.','붉은 물이 경사면을 따라 아래로 흘러.'], summary:'이것은 가상 모형이야. 붉은 물은 용암이 아니며 실제 화산의 열과 기체를 재현하지 않아.'},
    {title:'모형과 실제 화산을 비교해', labels:['모형: 붉은 물','실제: 용암·기체·재','같은 점과 다른 점'], cues:['모형의 붉은 물처럼 용암도 아래로 흘러.','실제 화산에서는 뜨거운 용암과 기체, 화산재, 암석 조각이 나올 수 있어.','모형은 흐름을 보여 주지만 실제 화산의 모든 현상을 나타내지는 못해.'], summary:'모형과 실제 화산의 같은 점·다른 점을 나누어 설명할 수 있어.'}
  ],
  rocks: [
    {title:'돌의 색과 알갱이가 단서야', labels:['전체 색','확대 관찰','알갱이'], cues:['현무암은 대체로 어두운색이야.','화강암은 대체로 밝고 여러 색의 알갱이가 보여.','여러 부분을 확대해서 색과 알갱이를 함께 살펴봐.'], summary:'색 하나만으로 정하지 말고 알갱이가 구별되는지도 함께 관찰해.'},
    {title:'이름보다 관찰 증거가 먼저', labels:['돌 관찰','두 증거 연결','분류'], cues:['이름을 모르는 돌도 먼저 관찰해.','전체 색과 알갱이, 두 가지 증거를 모아.','기준 표본과 비교하면 알맞은 이름으로 분류할 수 있어.'], summary:'방향이나 크기가 달라져도, 색과 알갱이를 근거로 돌을 설명해.'}
  ],
  city: [
    {title:'화산의 영향은 시간에 따라 달라져', labels:['분출 당시','피해 복구','오랜 시간 뒤'], cues:['분출 당시 화산재는 비행과 농작물에 피해를 줄 수 있어.','피해를 복구하고 안전을 확인하는 과정이 필요해.','아주 오랜 시간이 지나 화산 물질이 변하면 비옥한 토양이 될 수 있어.'], summary:'분출 직후에 바로 풍년이 되는 건 아니야. 변화에는 오랜 시간이 걸려.'},
    {title:'관찰을 생활 속 판단으로', labels:['관찰한 사실','까닭','안전한 행동'], cues:['관찰한 사실을 먼저 확인해. 화산재가 남아 있니?','화산재는 비행과 건강에 영향을 줄 수 있어.','위험할 때는 출입을 피하고 어른과 함께 공식 안전 안내를 확인해.'], summary:'위험이 사라졌는지 확인하고, 관찰한 사실과 까닭을 연결해 행동해.'}
  ],
  safety: [
    {title:'흔들릴 때는 몸부터 보호해', labels:['책상 아래','머리·몸 보호','다리 잡고 기다리기'], cues:['흔들릴 때는 튼튼한 책상 아래에서 몸을 보호해.','방석 등으로 머리를 보호하고 책상 다리를 잡아.','흔들림이 멈춘 뒤 선생님의 안내에 따라 이동해.'], summary:'흔들리는 동안 밖으로 뛰어나가지 않아. 창문과 넘어질 물건에서 떨어져 몸을 보호해.'},
    {title:'안전한 길은 직접 확인해', labels:['멈춤 확인','위험에서 떨어지기','안내 따라 이동'], cues:['흔들림이 멈추면 선생님의 안내를 확인해.','건물·담장·전신주 등 위험한 곳에서 떨어져 걸어가.','안내에 따라 넓고 안전한 장소로 이동해.'], summary:'가상 지도에서 연습한 뒤, 우리 학교의 실제 대피 안내와 경로도 확인하자.'}
  ]
};

export function showConcept(ctx, onContinue, {replay = false} = {}) {
  const concept = CONCEPTS[ctx.s.id][ctx.step], key = `${ctx.s.id}-${ctx.step}`;
  let cleanup = () => {};
  ctx.modal(concept.title, `<section class="concept-player"><div class="concept-visual"><video playsinline muted preload="metadata" poster="/assets/concepts/${key}.webp" aria-label="${escapeHTML(concept.title)} 모션 그래픽"><source src="/assets/concepts/${key}.webm" type="video/webm"><source src="/assets/concepts/${key}.mp4" type="video/mp4"></video><div class="concept-labels">${concept.labels.map((label,i)=>`<span data-cue="${i}">${escapeHTML(label)}</span>`).join('')}</div><button class="concept-play primary" id="concept-play">${icon('arrow')} 영상 재생</button></div><p class="concept-caption" aria-live="polite"></p><p class="concept-summary">${escapeHTML(concept.summary)}</p><div class="concept-actions"><button class="secondary" id="concept-replay">다시 보기</button><button class="primary" id="concept-continue">${replay?'탐구로 돌아가기':ctx.step===0?'다음 활동으로':'도구 받기'} ${icon('arrow')}</button></div><p class="concept-error" role="status" hidden>영상을 불러오지 못했어. 아래 핵심 내용을 확인하고 계속할 수 있어.</p></section>`, (dialog, close) => {
    dialog.classList.add('concept-dialog');
    const video = $('video', dialog), caption = $('.concept-caption', dialog), play = $('#concept-play', dialog);
    let reachedEnd = false, departed = false;
    let failedSources=0;
    const update = () => {
      const cue = Math.min(2, Math.floor(video.currentTime / (8 / 3)));
      caption.textContent = concept.cues[cue];
      dialog.querySelectorAll('[data-cue]').forEach((label,i) => label.classList.toggle('active', i === cue));
    };
    const end = () => { reachedEnd = true; play.hidden = true; caption.textContent = concept.cues[2]; };
    const start = () => { stopSounds(); reachedEnd = false; play.hidden = true; video.currentTime = 0; video.play().catch(() => { play.hidden = false; }); };
    cleanup = () => { video.pause(); video.removeAttribute('src'); video.querySelectorAll('source').forEach(s=>s.removeAttribute('src')); video.load(); document.removeEventListener('visibilitychange', visibility); };
    const visibility = () => { if (document.hidden) video.pause(); else if (!reachedEnd) play.hidden = false; };
    const proceed = () => { if (departed) return; departed = true; close(); if (!replay) onContinue?.(); };
    video.addEventListener('timeupdate', update); video.addEventListener('ended', end);
    const fail = () => { if(!dialog.open)return;play.hidden = true; $('.concept-error', dialog).hidden = false; caption.textContent = concept.cues.join(' '); };
    video.addEventListener('error', fail);
    // When child <source> URLs all fail, browsers may emit errors only on them.
    video.querySelectorAll('source').forEach(source=>source.addEventListener('error',()=>{if(++failedSources===video.querySelectorAll('source').length)fail();}));
    document.addEventListener('visibilitychange', visibility);
    play.onclick = start; video.onclick = () => { if (video.paused) start(); else {video.pause(); play.hidden = false;} };
    $('#concept-replay', dialog).onclick = start;
    $('#concept-continue', dialog).onclick = proceed;
    // Closing never advances a learner. The saved activity remains complete.
    dialog.addEventListener('close', () => { cleanup(); });
    update();
    if (!matchMedia('(prefers-reduced-motion: reduce)').matches) start();
    playSound('observe');
  });
}
