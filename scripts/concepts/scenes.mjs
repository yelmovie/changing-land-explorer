// Original, text-free educational diagrams. Each shot holds its final composition.
export const WIDTH=1280, HEIGHT=720, FPS=24, SECONDS=8;
const c={ink:'#29483d',paper:'#fff5dd',gold:'#f0c36a',water:'#58bbd1',soil:'#bc8958',green:'#83a779',red:'#dc7259'};
const clamp=x=>Math.max(0,Math.min(1,x));
const ease=x=>{x=clamp(x);return x*x*(3-2*x);};
const circle=(x,y,r,fill,extra='')=>`<circle cx="${x}" cy="${y}" r="${r}" fill="${fill}" ${extra}/>`;
const rect=(x,y,w,h,fill,r=16,extra='')=>`<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}" fill="${fill}" ${extra}/>`;
const path=(d,stroke,width=10,extra='')=>`<path d="${d}" stroke="${stroke}" stroke-width="${width}" fill="none" stroke-linecap="round" stroke-linejoin="round" ${extra}/>`;
const arrow=(x,y)=>path(`M${x-35} ${y}h70m-22 -20 22 20-22 20`,c.gold,10);
function base(body){return `<svg xmlns="http://www.w3.org/2000/svg" width="1280" height="720" viewBox="0 0 1280 720"><defs><linearGradient id="bg" x2="0" y2="1"><stop stop-color="#e7f1e1"/><stop offset="1" stop-color="#fdf3da"/></linearGradient><linearGradient id="soil" x2="0" y2="1"><stop stop-color="#d4b07c"/><stop offset="1" stop-color="#9f704c"/></linearGradient></defs>${rect(0,0,1280,720,'url(#bg)',0)}${circle(1110,130,92,'#f7dfa366')}${body}${path('M55 650H1225','#cfbb8c',2)}</svg>`;}
function rock(x,y,s,light=false){return `<g transform="translate(${x} ${y}) scale(${s})"><path d="M-100 60-110-10-58-92 40-110 110-40 100 60 25 95-60 90Z" fill="${light?'#cfc6b2':'#545b57'}" stroke="${light?'#8b8e81':'#3d4c43'}" stroke-width="6"/>${Array.from({length:light?24:48},(_,i)=>{const a=i*2.39,r=15+(i*13)%70;return circle(Math.cos(a)*r,Math.sin(a)*r,light?8+i%6:2.5,light?['#f3e1c5','#797c72','#b79683'][i%3]:'#7d8276');}).join('')}</g>`;}
function hills(){return `<path d="M0 440 180 200 360 440 520 260 760 460 1030 290 1280 450V630H0Z" fill="#a5bd8b"/><path d="M0 490 200 385 380 500 650 385 880 490 1100 395 1280 490V630H0Z" fill="#83a77b"/>`;}
function river(t,field=false){
 const p=ease(t/6), particles=Array.from({length:38},(_,i)=>{const q=clamp((t-1.3-i*.04)/3.5),x=250+q*750,y=(field?280:300)+(field?260:190)*q+Math.sin(q*Math.PI)*25+(i%5-2)*8;return circle(x,y,4+i%3,c.soil,`opacity="${t>1.3?1:0}"`);}).join('');
 if(field)return base(hills()+path('M170 205C460 280 230 420 690 430S1020 480 1160 570',c.water,66)+`<path d="M930 530q180-65 245 32-120 70-245-32Z" fill="#e4c183" opacity="${p}"/>`+rock(180,280,.38)+rock(285,360,.25)+particles+Array.from({length:14},(_,i)=>circle(980+i*13,540+i%3*7,3,c.soil)).join('')+arrow(600,300));
 const land=`<path d="M90 320 300 ${300+p*38}Q480 350 580 440L1100 500V610H90Z" fill="url(#soil)"/><path d="M90 320 300 ${300+p*38}Q480 350 580 440L1100 500" fill="none" stroke="#83a779" stroke-width="16"/>`;
 return base(land+path('M170 250Q300 290 395 345T635 450L1090 480',c.water,18+p*24,`opacity="${clamp(t/.8)}"`)+`<ellipse cx="1030" cy="492" rx="${20+p*105}" ry="${8+p*24}" fill="#e4bf77"/>`+particles+circle(305,329,67,'none',`stroke="#d78653" stroke-width="5" stroke-dasharray="10 10"`)+circle(670,455,64,'none',`stroke="${c.water}" stroke-width="5" stroke-dasharray="10 10"`)+circle(1030,490,84,'none',`stroke="#b29947" stroke-width="5" stroke-dasharray="10 10"`)+arrow(500,240)+arrow(850,360));
}
function volcano(t,actual=false){
 const p=ease((t-.5)/4.5), flow=clamp((t-2)/3),x=actual?650:550;
 let body=rect(90,550,1100,50,'#adc49c')+`<path d="M${x-280} 550 ${x-48} 240H${x+48}L${x+300} 550Z" fill="#ac9570" stroke="#7f7656" stroke-width="7"/>`+`<ellipse cx="${x}" cy="244" rx="52" ry="15" fill="#665b49"/>`;
 if(!actual){body+=path(`M1020 480H${x}V250`,'#9db1a8',18)+rect(980,265,90,220,c.paper,12,`stroke="#71988f" stroke-width="5"`)+rect(992,285+p*145,66,175-p*145,c.red,3)+path(`M1025 ${210+p*130}V${285+p*130}m-45-${75}h90`,c.ink,14);}
 const length=400*flow;body+=path(`M${x} 256Q${x-30} 320 ${x+55} 350T${x+100} 445L${x+240} 550`,c.red,26,`stroke-dasharray="${length} 600"`);
 if(actual){body+=Array.from({length:14},(_,i)=>{const q=clamp((t-1.3-i*.12)/2),a=i*2.4;return circle(x+Math.cos(a)*q*185,220-q*145+Math.sin(a)*q*28,20+q*21,'#94938a',`opacity="${q*.8}"`);}).join('');body+=Array.from({length:8},(_,i)=>{const q=clamp((t-1.7)/3),dx=(i-3.5)*65;return rock(x+dx*q,250-200*Math.sin(q*Math.PI)+q*90,.06+i%2*.025);}).join('');}
 return base(body+arrow(actual?250:770,385));
}
function rocks(t,classify=false){
 const p=ease((t-1)/4),s=classify?.68:1;
 let body=rect(70,180,510,395,c.paper,28)+rect(700,180,510,395,c.paper,28);
 body+=rock(320+(classify?-100*p:0),355,s,false)+rock(960+(classify?100*p:0),355,s,true);
 if(classify){body+=rect(90,510,270,65,'#536d61')+rect(920,510,270,65,'#bcaa8a')+arrow(540,360)+arrow(745,360);body+=circle(485,285,20,'#536d61')+circle(485,350,8,'#7e8b75')+circle(795,285,20,'#d2c7b0')+circle(795,350,18,'#8a8d7e');}
 else {const x=290+Math.sin(p*5)*75,y=340+Math.cos(p*5)*48;body+=circle(x,y,71,'#fff8df33',`stroke="${c.gold}" stroke-width="12"`)+path(`M${x+48} ${y+53}l52 58`,c.ink,19)+circle(975,355,124,'#fff5d944',`stroke="${c.gold}" stroke-width="8"`)+path('M535 350H715',c.gold,8,'stroke-dasharray="14 14"');}
 return base(body);
}
function building(x,y,type){return `<g transform="translate(${x} ${y})">${rect(-80,-85,160,145,'#e7d5aa',7)}<path d="M-100-85 0-145 100-85Z" fill="${type===1?'#9da66b':'#8aa7a5'}"/>${rect(-45,-50,30,40,c.paper,3)}${rect(15,-50,30,40,c.paper,3)}${rect(-20,10,40,50,'#8b977c',2)}</g>`;}
function city(t,notice=false){
 const p=ease((t-2)/4);let body=hills()+building(220,480,0)+building(1000,480,2)+rect(450,420,330,150,'#aa9868',15);
 body+=Array.from({length:7},(_,i)=>path(`M${475+i*45} 550v-${20+p*75}`,'#779758',12)).join('');
 body+=`<g opacity="${1-p}">${Array.from({length:9},(_,i)=>circle(300+i*80,200+Math.sin(i)*20,72,'#858880')).join('')}${Array.from({length:50},(_,i)=>circle(100+i*37%1080,280+i*41%220,3,'#7e7e72')).join('')}</g>`;
 if(notice){const q=ease((t-3)/2);body+=rect(400,160,480,185,c.paper,24,`stroke="#c7b181" stroke-width="4"`)+circle(485,250,48,c.gold)+path('M465 250l16 17 32-40',c.ink,9)+arrow(650,250)+rect(725,215,75,70,'#92b58b');body+=`<g opacity="${q}">${circle(220,390,46,'#4b8763')}${path('M200 390l16 17 32-40',c.paper,9)}${circle(1000,390,46,'#4b8763')}${path('M980 390l16 17 32-40',c.paper,9)}</g>`;}
 return base(body);
}
function safety(t,route=false){
 const p=ease((t-.5)/4);let body='';
 if(route){const points=[[175,530],[315,530],[315,210],[700,210],[700,510],[1080,510]],length=1690*p;
 body+=rect(80,150,1120,460,'#d7e1ba')+rect(380,300,230,270,'#ae9d7c')+rect(820,150,90,240,'#a58c73')+path('M380 300h230v270H380z','#c17a56',6,'stroke-dasharray="13 13"')+circle(1080,510,55,'#82ae7b');
 body+=path(points.map((q,i)=>`${i?'L':'M'}${q[0]} ${q[1]}`).join(''),c.paper,25)+path(points.map((q,i)=>`${i?'L':'M'}${q[0]} ${q[1]}`).join(''),'#3f937e',12,`stroke-dasharray="${length} 1800"`);
 let remain=1690*p,h=points[0];for(let i=1;i<points.length;i++){const a=points[i-1],b=points[i],len=Math.hypot(b[0]-a[0],b[1]-a[1]);if(remain<=len){h=[a[0]+(b[0]-a[0])*remain/len,a[1]+(b[1]-a[1])*remain/len];break;}remain-=len;h=b;}body+=circle(h[0],h[1],24,c.gold,`stroke="${c.ink}" stroke-width="5"`);
 }else{const x=920-280*p,y=450;body+=rect(380,330,520,45,'#b68e5c',8)+rect(405,375,32,220,'#947344',5)+rect(835,375,32,220,'#947344',5)+rect(125,175,180,190,'#99c8cc',7,`stroke="#8b9e83" stroke-width="12"`)+rect(100,575,1080,20,'#c2bb9a');
 body+=`<g transform="translate(${x} ${y})">${circle(0,0,49,'#b68c61')}${circle(-14,-8,5,c.ink)}${circle(16,-8,5,c.ink)}${rect(-48,43,100,89,'#83a27f',28)}${rect(-64,-60,125,25,'#edc56f',10)}${path('M45 70l150 15', '#b68c61',20,`opacity="${ease((t-4)/2)}"`)}</g>`+arrow(200,490);}
 return base(body);
}
export const clips={
 'river-0':t=>river(t),'river-1':t=>river(t,true),
 'volcano-0':t=>volcano(t),'volcano-1':t=>t<3?volcano(t*1.7):volcano((t-3)*1.4,true),
 'rocks-0':t=>rocks(t),'rocks-1':t=>rocks(t,true),
 'city-0':t=>city(t),'city-1':t=>city(t,true),
 'safety-0':t=>safety(t),'safety-1':t=>safety(t,true)
};
