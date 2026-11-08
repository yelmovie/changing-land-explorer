// Coordinates follow the painted 1672 × 941 atlas. Each site is traced in its own local plane.
const locations={
 river:{origin:[70,285],outline:'84,71 140,23 254,56 268,58 317,82 303,88 304,149 240,175 209,170 135,181 89,153',halo:[193,117,128,78],
  panes:'M111 90l12 4v14l-12-4z M133 97l11 3v14l-11-3z M168 108l10 4v14l-10-4z M186 115l13 4v13l-13-4z M222 119l10-4v19l-10 3z M280 102l11-4v20l-11 4z',
  feature:`<g transform="translate(289 230) matrix(.72 -.22 0 1 0 0)"><circle r="43" fill="#77502f" stroke="#58351d" stroke-width="5"/><g class="mill-rotor"><circle r="39" fill="#503a27" stroke="#d59c52" stroke-width="6"/>${Array.from({length:10},(_,i)=>`<path transform="rotate(${i*36})" d="M-2 0 -4-38 3-39 2 0Z" fill="#e7b268"/>`).join('')}<circle r="6" fill="#f1d19a"/></g></g>`},
 volcano:{origin:[395,75],outline:'52,153 73,115 134,127 143,109 239,122 248,109 250,77 270,73 273,104 310,86 341,108 344,51 351,42 374,39 397,47 398,139 421,153 444,158 440,209 379,216 316,231 266,222 150,229 53,203',halo:[280,171,180,66],
  panes:'M71 173h8v13h-8z M96 175h10v15H96z M134 173h10v14h-10z M247 150h13v10h-13z M279 199h11v12h-11z M327 176l11-5v15l-11 5z M354 69l13 1v12l-13-1z M382 68l7-3v13l-7 3z',
  feature:'<g transform="translate(372 42)"><ellipse cy="5" rx="25" ry="8" fill="url(#v-lamp-halo)"/><path d="M-8 1Q-8-15 0-16Q8-15 8 1Z" fill="#ffc561" stroke="#976333" stroke-width="2"/><ellipse cy="1" rx="10" ry="3" fill="#845b30"/><path d="M-2-10v7" stroke="#fff8bb" stroke-width="3"/></g>'},
 rocks:{origin:[975,88],outline:'50,32 63,26 167,97 203,100 202,94 310,67 352,116 336,126 339,192 250,223 196,211 153,225 109,209 110,148 150,136',halo:[250,161,113,70],
  panes:'M214 149l16 7v29l-16-7z M246 157l25-8v24l-25 8z M286 144l21-7v23l-21 6z M317 135l11-4v21l-11 4z',
  feature:'<path d="M208 116Q269 141 338 106" fill="none" stroke="#694832" stroke-width="2"/>'+bulbs([[218,120],[241,125],[266,125],[291,122],[316,115],[335,108]])},
 city:{origin:[1250,338],outline:'9,91 63,53 126,64 151,72 179,66 232,91 256,101 281,89 314,63 346,63 469,17 505,57 501,88 549,103 573,129 569,186 508,211 449,224 389,223 353,235 347,249 278,269 251,251 209,221 166,198 114,186 36,184',halo:[313,144,225,102],
  panes:'M76 116l9 4v12l-9-4z M99 109l8-4v11l-8 4z M190 161l10 4v12l-10-4z M289 200l9-4v12l-9 4z M325 188l10-4v13l-10 4z M383 107l13-4v15l-13 5z M427 93l11-4v15l-11 4z M467 80l12-4v15l-12 4z',
  feature:garland(355,145,172,14)},
 safety:{origin:[1172,535],outline:'26,72 69,47 110,22 225,52 253,29 269,18 296,38 310,31 351,64 363,69 483,101 511,124 496,130 494,189 434,236 312,221 284,208 248,211 185,184 96,177 35,157',halo:[263,139,214,79],
  panes:'M63 94l12 3v12l-12-3z M123 97l17 4v13l-17-4z M160 106l17 4v14l-17-5z M198 116l16 4v13l-16-4z M256 132l16 4v15l-16-4z M321 147l16 3v14l-16-3z M360 156l15 4v14l-15-4z M398 166l17 4v14l-17-4z',
  feature:garland(101,137,119,18)}
};
function bulbs(points){return points.map(([x,y])=>`<circle cx="${x}" cy="${y+2}" r="6.5" fill="#ffb54b" opacity=".42"/><circle cx="${x}" cy="${y+2}" r="3.6" fill="#fff6ae"/>`).join('');}
function garland(x,y,width,sag){
 const pennants=Array.from({length:7},(_,i)=>{
  const t=(i+.5)/7,cx=t*width,cy=4*sag*t*(1-t),color=['#d76443','#f0ba4c','#34877d'][i%3];
  return `<path d="M${cx-5} ${cy}h10l-5 10Z" fill="${color}" stroke="#ffedba" stroke-width="1"/>`;
 }).join('');
 return `<g transform="translate(${x} ${y})"><path d="M0 0Q${width/2} ${sag*2} ${width} 0" fill="none" stroke="#795837" stroke-width="2"/>${pennants}</g>`;
}

// 스테이지를 마칠 때마다 그 장소에 움직이는 생활 모습이 하나씩 더해진다. 좌표는 1672 × 941 지도 그림 기준.
const puff=(x,y,i)=>`<circle class="smoke-puff" style="--i:${i}" cx="${x}" cy="${y}" r="7" fill="#f4efe6"/>`;
const twinkle=([x,y],i)=>`<g transform="translate(${x} ${y})"><path class="life-twinkle" style="--i:${i}" d="M0-7 2-2 7 0 2 2 0 7-2 2-7 0-2-2Z" fill="#fffbe0"/></g>`;
const SITE_LIFE={
 river:[[300,440],[322,458],[288,423],[338,430]].map(twinkle).join(''),
 volcano:[0,1,2].map(i=>puff(441,24,i)).join('')+[0,1].map(i=>puff(526,112,i+3)).join(''),
 rocks:[[1012,176],[1078,150],[1146,186]].map(twinkle).join(''),
 city:`<g transform="translate(1619 388)"><circle class="lighthouse-beam" r="26" fill="url(#v-lamp-halo)"/></g><g transform="translate(1540 452)"><path class="gull" d="M-9 0q5-6 9 0q4-6 9 0" fill="none" stroke="#fdf8ea" stroke-width="2.2" stroke-linecap="round"/></g>`,
 safety:[[1236,700],[1296,676],[1350,712]].map(twinkle).join('')
};
// 새로 열린 장소에서 한 번 터지는 빛. 고리, 빛살, 올라가는 반짝이.
function wakeBurst([x,y]){
 const rays=Array.from({length:10},(_,i)=>`<path class="burst-ray" style="--a:${i*36}deg" d="M0-16V-34" stroke="#fff3a6" stroke-width="4" stroke-linecap="round"/>`).join('');
 const sparks=Array.from({length:8},(_,i)=>`<path class="burst-spark" style="--dx:${(i-3.5)*13}px;--d:${(i%4)*.12}s" d="M0-6 1.7-1.7 6 0 1.7 1.7 0 6-1.7 1.7-6 0-1.7-1.7Z" fill="${['#fff6b8','#ffd567','#ffffff'][i%3]}"/>`).join('');
 return `<g class="wake-burst" transform="translate(${x} ${y})"><circle class="burst-ring" r="22" fill="none" stroke="#ffe27c" stroke-width="5"/><circle class="burst-ring late" r="22" fill="none" stroke="#fff8d0" stroke-width="3"/>${rays}${sparks}</g>`;
}
export function villageLights(stages,newcomer,festival){
 const sites=Object.entries(locations).map(([id,site])=>{
  const [cx,cy,rx,ry]=site.halo;
  return `<g data-workplace="${id}" class="workplace ${stages.some(s=>s.id===id)?'awake':'asleep'}${id===newcomer?' reopening':''}" transform="translate(${site.origin.join(' ')}) scale(.5)">
   <polygon class="closed-workplace" points="${site.outline}"/>
   <g class="working-lights"><ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="url(#v-window-wash)"/>
    <path d="${site.panes}" fill="#ffe290" stroke="#f7b347" stroke-width="5" stroke-opacity=".55" stroke-linejoin="round"/><path d="${site.panes}" fill="#ffec9c"/>
    ${site.feature}</g></g>`;
 }).join('');
 const towerLights=[[777,379],[810,395],[854,401],[898,395],[930,379]];
 const lamps=towerLights.map(([x,y],i)=>`<g class="tower-lamp${newcomer&&i===stages.length-1?' lamp-new':''}" transform="translate(${x} ${y})"><path d="M0 0v8m-3 0h6" stroke="#745937" stroke-width="2"/><circle r="5" fill="${i<stages.length?'#ffdc78':'#615f54'}" stroke="#896638" stroke-width="2"/>${i<stages.length?'<circle r="13" fill="url(#v-lamp-halo)"/>':''}</g>`).join('');
 return `<svg class="village-lights" viewBox="0 0 1672 941" preserveAspectRatio="none" aria-hidden="true">
  <defs><radialGradient id="v-window-wash"><stop stop-color="#ffc054" stop-opacity=".46"/><stop offset="1" stop-color="#ffc054" stop-opacity="0"/></radialGradient><radialGradient id="v-lamp-halo"><stop stop-color="#fff6ad"/><stop offset=".32" stop-color="#ffd267" stop-opacity=".8"/><stop offset="1" stop-color="#ffb344" stop-opacity="0"/></radialGradient></defs>
  ${sites}<g class="village-life">${stages.map(st=>`<g class="site-life life-${st.id}${st.id===newcomer?' life-new':''}">${SITE_LIFE[st.id]||''}</g>`).join('')}${stages.length>=2?'<g transform="translate(-60 70)"><path class="sky-birds" d="M0 0q6-7 11 0q5-7 11 0M30 12q5-6 9 0q4-6 9 0" fill="none" stroke="#fbf7ea" stroke-width="2.4" stroke-linecap="round"/></g>':''}</g>${newcomer&&locations[newcomer]?wakeBurst(locations[newcomer].halo.slice(0,2).map((v,i)=>locations[newcomer].origin[i]+v*.5)):''}${lamps}${stages.length===5?'<circle cx="854" cy="276" r="22" fill="url(#v-lamp-halo)"/><path d="M846 350q8-9 16 0v10h-16z" fill="#ffde8b"/>':''}
  <g class="plaza-festival${festival?' celebrating':''}"><path d="M770 352v31m163-31v31" stroke="#785934" stroke-width="3"/>${garland(770,352,83,15)}${garland(853,352,80,15)}<g class="plaza-ribbons">${[[787,299],[802,275],[821,300],[835,259],[857,279],[876,253],[897,286],[913,312],[932,277]].map(([x,y],i)=>`<g transform="translate(${x} ${y})"><path class="paper-ribbon" style="--delay:${(i%4)*.11}s" d="M0-4 3 0 0 5-3 1Z" fill="${['#e08351','#ffdb78','#4ea99c'][i%3]}" stroke="#fff3ce" stroke-width=".8"/></g>`).join('')}</g></g></svg>`;
}
