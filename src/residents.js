import {$,$$,icon} from './ui.js';

// Feet are anchored to the painted path. The smaller landmark is anchored to the workplace.
export const RESIDENTS={
 river:{name:'나루',stamp:'물방울',symbol:'water',role:'강나루 뱃사공',feet:[.202,.465],landmark:[.103,.370],mark:'lamp',
  hello:'내 등불 보여? 네가 모래가 쌓인 곳을 지도에 표시해 줘서 다시 나루터를 열었어!',
  chat:[['배는 어디로 다녀?','모래가 쌓인 자리는 얕아졌어. 네 지도를 보고 그곳을 빙 돌아서 배를 몰아.'],['등불은 왜 켰어?','저녁에 돌아오는 배도 나루터를 찾으라고! 오늘 첫 손님은 너야.']]},
 volcano:{name:'마그',stamp:'관측등',symbol:'sun',role:'화산 관측원',feet:[.359,.252],landmark:[.310,.170],mark:'lamp',
  hello:'관측등을 다시 켰어! 네가 모형과 화산 그림을 비교해 준 덕분이야.',
  chat:[['모형에서는 뭘 봤어?','붉은 물이 산비탈을 따라 흘렀지. 흐르는 모습은 비교할 수 있지만, 모형의 물은 용암처럼 뜨겁지 않아.'],['망원경으로 뭐 해?','멀리서 화산을 살펴봐. 오늘은 네가 찾아낸 용암 자국을 내 수첩에도 그렸어.']]},
 rocks:{name:'지오',stamp:'표본 상자',symbol:'box',role:'암석 공방지기',feet:[.604,.279],landmark:[.619,.193],mark:'samples',
  hello:'어서 와! 뒤죽박죽이던 돌에 이름표가 생겼어. 이제 공방 손님도 두 돌을 비교할 수 있어.',
  chat:[['무슨 돌을 들고 있어?','분홍빛 알갱이도 보이지? 내 화강암이야. 돌 이름을 찾을 때는 색과 알갱이 크기를 함께 봐.'],['첫 손님은 누구였어?','바로 너야! 내가 아끼는 돌을 제일 앞에 꺼내 뒀어. 분홍 알갱이가 보이지?']]},
 city:{name:'타임',stamp:'사진기',symbol:'camera',role:'마을 사진 기록가',feet:[.842,.547],landmark:[.804,.468],mark:'board',
  hello:'마을 소식판이 다시 열렸어! 네가 사진 속 장소와 때를 찾아 줘서 소식을 제대로 붙였지.',
  chat:[['왜 같은 곳을 또 찍어?','같은 밭도 분출 당시와 오랜 시간이 지난 뒤의 모습이 달라. 나란히 놓으면 어디가 달라졌는지 잘 보여.'],['오늘의 마을 소식은?','암석 공방이 문을 열었대! 지오가 이름표를 붙인 돌 사진을 소식판에 걸었어.']]},
 safety:{name:'세이프',stamp:'안전 깃발',symbol:'flag',role:'안전 훈련 대장',feet:[.708,.815],landmark:[.737,.715],mark:'flag',
  hello:'훈련 깃발을 올렸어! 네가 그린 대피로를 보며 다 같이 걷는 연습을 할 수 있어.',
  chat:[['교실이 흔들리면?','먼저 튼튼한 책상 아래에서 머리와 몸을 보호하고 책상 다리를 잡아. 흔들림이 멈추면 선생님 안내를 따라 걸어가.'],['깃발은 어디에 꽂아?','오늘 연습할 운동장의 모이는 자리에! 친구들이 다 왔는지 함께 확인할 거야.']]}
};
export const residentArt=id=>`/assets/residents/${id}.webp`;

const signs={
 lamp:'<path fill="#503823" d="M13 8V5a3 3 0 0 1 6 0v3h3l2 4-2 2-1 12H11l-1-12-2-2 2-4z"/><path fill="#ffe598" d="M12 13h8l-1 10h-6z"/><path fill="#fff8be" d="m16 15 2 5-2 2-2-2z"/>',
 samples:'<path fill="#694c30" d="M2 22h28v4H2zM5 25h3v5H5zm19 0h3v5h-3z"/><path fill="#626667" d="m3 20 2-7 7-2 5 6-1 5H3z"/><path fill="#e6c4ac" d="m15 21 2-7 6-5 6 5 1 8z"/><path fill="#fff1b8" d="M6 24h6v2H6zm14 0h6v2h-6z"/>',
 board:'<path fill="#69472b" d="M3 5h26v20H3zM6 23h3v7H6zm17 0h3v7h-3z"/><path fill="#e8c98f" d="M5 7h22v16H5z"/><path fill="#fff6dc" d="m7 9 9 1-1 9-9-1z"/><path fill="#668f79" d="m17 12 8-1 1 9-8 1z"/>',
 flag:'<path fill="#734a2a" d="M7 2h3v27H7z"/><path fill="#13766b" stroke="#f8d793" stroke-width="1.5" d="M10 4c6-5 10 4 18 0l-2 6 2 4c-8 4-12-5-18 0z"/><path fill="#e7be73" d="m8 24 5 6H3z"/>'
};

export function residentMarker(stage,newcomer){
 const r=RESIDENTS[stage.id],at=([x,y])=>`left:${x*100}%;top:${y*100}%`;
 return `<svg class="restored-landmark ${r.mark}" style="${at(r.landmark)}" viewBox="0 0 32 32" aria-hidden="true">${signs[r.mark]}</svg>
 <button class="map-resident${newcomer?' arrived':''}" data-resident="${stage.id}" style="${at(r.feet)}" aria-label="${stage.place}의 ${r.name}에게 말 걸기"><img src="${residentArt(stage.id)}" alt="" draggable="false"><span class="resident-tag">${icon('chat',16)} ${newcomer?'말 걸기':r.name}</span></button>`;
}

function stampBook(stamps){
 const slots=Object.entries(RESIDENTS).map(([id,r])=>`<span class="stamp-slot ${stamps.includes(id)?'inked':''}" title="${r.name}의 ${r.stamp} 도장" aria-label="${r.name} 도장 ${stamps.includes(id)?'받음':'빈자리'}">${icon(r.symbol,19)}</span>`).join('');
 return `<div class="friend-stamps"><strong>친구 도장 <b>${stamps.length}/5</b></strong><div class="stamp-slots">${slots}</div></div>`;
}

export function showResidents(modal,stages,{initial,onGreet,preview,stamps,collect,visitPlaza}){
 const title=preview?'주민 시연':'돌아온 주민';
 modal(title,'',(dialog,close)=>{
  dialog.classList.add('resident-dialog');
  const body=$('.dialog-body',dialog),heading=$('h2',dialog);
  function roster(focus){
   heading.textContent=title;
   body.innerHTML=`${stampBook(stamps)}<div class="resident-roster">${stages.map(st=>`<button class="resident-entry" data-talk="${st.id}"><img src="${residentArt(st.id)}" alt=""><strong>${RESIDENTS[st.id].name}</strong><small>${st.place}</small>${stamps.includes(st.id)?`<span class="entry-stamp" aria-label="도장 받음">${icon(RESIDENTS[st.id].symbol,14)}</span>`:''}</button>`).join('')}</div>${stamps.length===5?'<div class="resident-exit"><button class="primary" data-plaza>축제 광장 보기</button></div>':'<p class="stamp-hint">주민에게 감사 도장을 받아 봐. 다섯 개를 모으면 기록탑에 축제 깃발이 걸려!</p>'}`;
   $('[data-plaza]',body)?.addEventListener('click',()=>{close();visitPlaza();});
   $$('[data-talk]',body).forEach(b=>b.onclick=()=>talk(b.dataset.talk,true));
   if(focus)$(`[data-talk="${focus}"]`,body)?.focus();
  }
  function talk(id,fromList){
   const st=stages.find(s=>s.id===id);if(!st)return;
   onGreet(id);
   const r=RESIDENTS[id];heading.textContent=`${r.name}에게 말 걸기`;
   body.innerHTML=`<div class="resident-conversation"><div class="resident-portrait"><img src="${residentArt(id)}" alt="${r.role} ${r.name}"></div><div class="resident-lines"><span class="resident-place">${st.place} · ${r.role}</span><p class="resident-reply" aria-live="polite"></p><div class="resident-questions">${r.chat.map(([q],i)=>`<button class="secondary" data-ask="${i}" aria-pressed="false">${q}</button>`).join('')}</div></div></div><div class="resident-exit"><button class="stamp-press" data-stamp>${icon(r.symbol,20)} <span></span></button>${fromList?'<button class="secondary" data-roster>주민 목록</button>':''}<button class="primary" data-close>지도로 돌아가기</button></div>`;
   const reply=$('.resident-reply',body);reply.textContent=r.hello;
   const buttons=$$('[data-ask]',body);
   buttons.forEach((b,i)=>b.onclick=()=>{reply.textContent=r.chat[i][1];buttons.forEach(other=>other.setAttribute('aria-pressed',String(other===b)));});
   const stamp=$('[data-stamp]',body),back=$('[data-close]',body);
   function updateStamp(){
    stamp.disabled=stamps.includes(id);
    $('span',stamp).textContent=stamp.disabled?`${r.stamp} 도장 받음`:`${r.stamp} 도장 받기`;
    back.textContent=stamps.length===5?'축제 광장 보기':'지도로 돌아가기';
   }
   stamp.onclick=()=>{
    if(!collect(id))return;
    updateStamp();
    reply.textContent=stamps.length===5?'도장 다섯 개가 다 모였어! 기록탑 앞에 우리 마을 축제 깃발을 걸었어.':`꾹! 네 도장첩에 ${r.stamp} 도장을 찍었어. 이제 친구 도장이 ${stamps.length}개야!`;
    stamp.classList.add('just-stamped');
    back.focus({preventScroll:true});
   };
   updateStamp();
   back.onclick=()=>{close();if(stamps.length===5)visitPlaza();};
   if(fromList){$('[data-roster]',body).onclick=()=>roster(id);buttons[0].focus();}
  }
  if(initial)talk(initial,false);else roster();
 });
}
