import {chapterComplete} from './adventure/rules.js';
// Pure learning rules shared by the activities and regression tests.
export const finite=(v,fallback=0)=>Number.isFinite(Number(v))?Number(v):fallback;
export const unit=v=>Math.max(0,Math.min(1,finite(v)));
export const RIVER_MARKS={erosion:{x:.27,y:.38,label:'깎임 · 침식'},transport:{x:.53,y:.55,label:'이동 · 운반'},deposit:{x:.82,y:.72,label:'쌓임 · 퇴적'}};
export const ROCKS=[
 {id:0,name:'표본 A',type:'basalt',color:'dark',grain:'fine',asset:'rock-0'},
 {id:1,name:'표본 B',type:'granite',color:'light',grain:'coarse',asset:'rock-1'},
 {id:2,name:'새 표본 C',type:'basalt',color:'dark',grain:'fine',asset:'rock-2'},
 {id:3,name:'새 표본 D',type:'granite',color:'light',grain:'coarse',asset:'rock-3'}
];
export const FEATURES={dark:'전체가 어두운색',light:'전체가 밝은색',fine:'알갱이가 잘 안 보임',coarse:'알갱이가 뚜렷함'};
export const FIELD_POINTS=[
 {id:'upper-rock',x:160,y:295,label:'상류의 바위',side:'upper',feature:'바위',claim:'large',text:'크고 각진 바위가 보여.'},
 {id:'upper-slope',x:140,y:215,label:'상류의 물길',side:'upper',feature:'물길',claim:'steep',text:'좁고 경사가 급한 물길이야.'},
 {id:'lower-channel',x:625,y:400,label:'하류의 물길',side:'lower',feature:'물길',claim:'wide',text:'넓고 완만한 물길이야.'},
 {id:'lower-sand',x:810,y:475,label:'하류의 모래',side:'lower',feature:'모래',claim:'sand',text:'모래와 고운 흙이 쌓여 있어.'}
];
export const CITY_SITES=[
 {id:'airport',name:'공항',x:180,y:310,claim:'flight',now:'화산재 때문에 비행이 멈췄어.',later:'안전을 확인한 뒤 다시 운항해.',notice:'화산재가 날릴 때는 비행 안내를 확인해요.',reply:'운항 안내를 확인하고 일정을 바꿀게요.'},
 {id:'farm',name:'농장',x:490,y:350,claim:'soil',now:'분출물로 농작물이 피해를 입었어.',later:'오랜 시간 뒤 비옥한 토양이 되기도 해.',notice:'피해 복구와 토양 변화에는 시간이 필요해요.',reply:'곧바로 농사가 잘되는 건 아니군요.'},
 {id:'spa',name:'온천',x:800,y:320,claim:'heat',now:'위험한 동안에는 이용할 수 없어.',later:'안전을 확인한 뒤 온천을 이용해.',notice:'안전하다는 안내를 확인한 뒤 온천을 이용해요.',reply:'출입 안내를 먼저 확인할게요.'}
];
export function riverFrame(time,water=1){const t=unit(time),amount=water===2?2:1;return {time:t,water:amount,erosion:t*amount,deposit:Math.max(0,t-.8)/.2*amount,front:t};}
export function riverMarkValid(kind,point,time){const p=RIVER_MARKS[kind];return !!p&&time>=(kind==='deposit'?.85:.55)&&Number.isFinite(point?.x)&&Number.isFinite(point?.y)&&Math.hypot(point.x-p.x,point.y-p.y)<.16;}
export function hasRockEvidence(d,id){const r=ROCKS[id];return !!r&&[r.color,r.grain].every(f=>d.evidence?.[`rock-${id}-${f}`]?.claim===f);}
export function activityComplete(stage,step,d={}){
 if(d.adventure?.version===1&&!chapterComplete(d,step))return false;
 const ev=d.evidence||{};
 if(stage==='river')return step===0?!!d.prediction&&[1,2].every(w=>d.runs?.some(r=>r.water===w&&r.complete&&r.version===1))&&Object.keys(RIVER_MARKS).every(k=>riverMarkValid(k,ev[`river-${k}`]?.point,ev[`river-${k}`]?.time))&&['same','different'].includes(d.reflection):FIELD_POINTS.every(p=>ev[p.id]?.claim===p.claim)&&d.fieldLink==='deposit';
 if(stage==='volcano')return step===0?['tray','mountain','water'].every(k=>d.assembly?.includes(k))&&['mouth','flow'].every(k=>ev[`model-${k}`]?.time>=.55):['lava','gas','ash','rock'].every(k=>ev[`output-${k}`]?.claim===k)&&['opening','downhill','material','extra'].every(k=>d.comparisons?.[k]===({opening:'same',downhill:'same',material:'different',extra:'different'}[k]));
 if(stage==='rocks')return step===0?[0,1].every(i=>hasRockEvidence(d,i)):[0,1,2,3].every(i=>hasRockEvidence(d,i)&&d.rockNames?.[i]===ROCKS[i].type&&d.rockProofs?.[i]?.every(f=>[ROCKS[i].color,ROCKS[i].grain].includes(f))&&new Set(d.rockProofs?.[i]).size===2);
 if(stage==='city')return step===0?CITY_SITES.every(s=>ev[`city-${s.id}`]?.claim===s.claim&&ev[`city-${s.id}`]?.pair===true):CITY_SITES.every(s=>ev[`city-${s.id}`]?.claim===s.claim&&d.notices?.[s.id]===s.claim);
 if(stage==='safety')return step===0?['window','shelf','desk'].every(k=>ev[`safety-${k}`])&&d.protect?.under===true&&d.protect?.head===true&&d.protect?.leg===true&&d.protect?.stopped===true&&d.protect?.confirmed===true:['schoolRoute','outsideRoute'].every(k=>d[k+'Done']===true&&Array.isArray(d[k])&&d[k+'Signature']===routeSignature(d[k])&&inspectRoute(d[k],k==='outsideRoute'?OUTSIDE_CONFIG:SCHOOL_CONFIG).ok);
 return false;
}
export function replaceRouteSection(points,start,end,replacement){if(start<0||end<=start||end>=points.length||replacement.length<2)return points;return [...points.slice(0,start),...replacement, ...points.slice(end+1)];}
export const routeSignature=points=>JSON.stringify(points.map(p=>[Math.round(p.x),Math.round(p.y)]));
export function inspectRoute(points,config){
 const dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y),inside=(p,r,pad=0)=>p.x>=r.x-pad&&p.x<=r.x+r.w+pad&&p.y>=r.y-pad&&p.y<=r.y+r.h+pad;
 const fail=(message,index,point)=>({ok:false,message,index,point});
 if(!Array.isArray(points)||points.length<2)return fail('시작점부터 도착점까지 길을 그려 줘.',0,config.start);
 if(points.some(p=>!Number.isFinite(p?.x)||!Number.isFinite(p?.y)))return fail('길을 다시 그려 줘.',0,config.start);
 if(dist(points[0],config.start)>45)return fail('리버가 있는 시작점에서 출발해 줘.',0,config.start);
 let last={...points[0]},gates=new Set();
 for(let i=1;i<points.length;i++){
  const a=points[i-1],b=points[i],n=Math.max(1,Math.ceil(dist(a,b)/4));
  for(let j=0;j<=n;j++){const p={x:a.x+(b.x-a.x)*j/n,y:a.y+(b.y-a.y)*j/n};
   const hit=config.hazards.find(r=>inside(p,r,10));if(hit)return fail(hit.message,i,last);
   if(!config.areas.some(r=>inside(p,r,-8)))return fail('벽을 지나고 있어. 넓은 통로로 돌아가자.',i,last);
   config.gates.forEach((g,k)=>{if(dist(g,p)<g.radius)gates.add(k);});last=p;
  }
 }
 if(dist(points.at(-1),config.goal)>45)return fail('도착점까지 길을 이어 줘.',points.length-1,last);
 if(gates.size!==config.gates.length)return fail('표시된 출구를 지나가자.',points.length-1,last);
 return {ok:true,message:'위험한 곳을 피해 도착했어!',signature:routeSignature(points)};
}

export const SCHOOL_CONFIG={start:{x:140,y:100},goal:{x:880,y:420},areas:[{x:60,y:50,w:880,h:260},{x:440,y:280,w:120,h:110},{x:60,y:350,w:880,h:130}],gates:[{x:500,y:335,radius:48}],hazards:[{x:360,y:155,w:220,h:100,label:'화단',message:'화단을 가로지를 수 없어. 복도로 돌아가자.'},{x:700,y:80,w:100,h:70,label:'깨진 유리',message:'깨진 유리 조각이 있어. 이 구간을 피해 가자.'},{x:150,y:200,w:70,h:60,label:'넘어진 책장',message:'책장이 통로를 막고 있어. 다른 쪽으로 돌아가자.'}]};
export const OUTSIDE_CONFIG={start:{x:120,y:410},goal:{x:880,y:100},areas:[{x:50,y:50,w:900,h:420}],gates:[],hazards:[{x:280,y:80,w:230,h:160,label:'건물',message:'건물 가까이는 떨어지는 물건이 위험해. 떨어진 곳으로 가자.'},{x:600,y:270,w:70,h:170,label:'담장',message:'담장이 무너질 수 있어. 충분히 떨어져 돌아가자.'},{x:760,y:160,w:45,h:65,label:'전신주',message:'전신주 가까이는 피해 가자.'}]};
export const SCHOOL_PATH=[{x:140,y:100},{x:280,y:100},{x:280,y:280},{x:500,y:280},{x:500,y:370},{x:880,y:420}];
export const SCHOOL_ALTERNATIVE=[{x:140,y:100},{x:650,y:100},{x:650,y:280},{x:500,y:280},{x:500,y:370},{x:880,y:420}];
export const OUTSIDE_PATH=[{x:120,y:410},{x:180,y:410},{x:180,y:285},{x:550,y:285},{x:550,y:100},{x:880,y:100}];
export function safetyRouteConfig(outside=false){return outside?OUTSIDE_CONFIG:SCHOOL_CONFIG;}
