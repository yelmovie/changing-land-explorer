import {$,escapeHTML} from './ui.js';

// Optional turn-around view of a specimen or model. The 2D activity stays the
// source of truth; this only opens when the matching GLB exists in assets/models.
// flat: the model sits on a base Meshy leaves untextured, so the camera never goes underneath.
const MODELS={
 'rock-0':{file:'rock-basalt-porous',noun:'돌'},'rock-1':{file:'rock-granite-white',noun:'돌'},
 'rock-2':{file:'rock-basalt-dense',noun:'돌'},'rock-3':{file:'rock-granite-pink',noun:'돌'},
 'volcano-real':{file:'volcano-exterior',noun:'화산',flat:true},
 'river-hill':{file:'terrain-soil-block',noun:'흙 언덕',flat:true}
};
const modelUrl=asset=>`/assets/models/${MODELS[asset].file}.glb`;
const known=new Map();

export const hasRockModel=asset=>hasModel(asset);
export const openRock3D=(modal,rock)=>openModel3D(modal,rock.asset,rock.name);

export function hasModel(asset){
 if(!MODELS[asset])return Promise.resolve(false);
 if(!known.has(asset)){
  const url=modelUrl(asset);
  known.set(asset,fetch(url,{method:'HEAD'}).then(r=>r.ok).catch(async()=>!!(await globalThis.caches?.match(url))));
 }
 return known.get(asset);
}

export function openModel3D(modal,asset,name){
 const {noun,flat}=MODELS[asset]; // every noun ends in a final consonant, so '을' fits
 modal(`${escapeHTML(name)} 돌려 보기`,`<div class="rock3d-stage" role="img" aria-label="손가락으로 돌려 볼 수 있는 3D ${escapeHTML(name)}"><p class="rock3d-status" role="status">${noun==='돌'?'표본':'모형'}을 꺼내고 있어…</p></div><p class="rock3d-help">손가락으로 끌어 ${noun}을 돌려 봐. 두 손가락이나 버튼으로 크게·작게 볼 수 있어.</p><div class="rock3d-actions"><button class="secondary" data-rock3d="out" aria-label="작게 보기">작게</button><button class="secondary" data-rock3d="reset">처음 모습</button><button class="secondary" data-rock3d="in" aria-label="크게 보기">크게</button></div>`,(dialog)=>{
  dialog.classList.add('rock3d-dialog');
  let dispose=()=>{};
  dialog.addEventListener('close',()=>dispose(),{once:true});
  mountViewer($('.rock3d-stage',dialog),modelUrl(asset),dialog,flat).then(d=>{if(dialog.open)dispose=d;else d();});
 });
}

async function mountViewer(host,url,dialog,flat){
 const status=$('.rock3d-status',host),fail=msg=>{status.textContent=msg;status.hidden=false;return()=>{};};
 let THREE,GLTFLoader;
 try{THREE=await import('three');({GLTFLoader}=await import('/assets/vendor/three/addons/loaders/GLTFLoader.js'));}
 catch{return fail('3D 도구를 불러오지 못했어. 돋보기 관찰로 계속해 줘.');}
 let renderer;
 try{renderer=new THREE.WebGLRenderer({antialias:true,alpha:true});}catch{return fail('이 기기에서는 3D 보기를 쓸 수 없어. 돋보기 관찰로 계속해 줘.');}
 const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
 renderer.setPixelRatio(Math.min(devicePixelRatio,2));
 host.prepend(renderer.domElement);
 const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(32,1,.1,50);
 scene.add(new THREE.HemisphereLight(0xfff4dc,0x3a3226,1.6));
 const key=new THREE.DirectionalLight(0xffffff,2.2);key.position.set(3,4,5);scene.add(key);
 const rim=new THREE.DirectionalLight(0xbfe3ff,.8);rim.position.set(-4,2,-3);scene.add(rim);
 const pivot=new THREE.Group();scene.add(pivot);
 let gltf;
 try{gltf=await new GLTFLoader().loadAsync(url);}catch{renderer.dispose();renderer.domElement.remove();return fail('3D 표본 파일을 불러오지 못했어. 돋보기 관찰로 계속해 줘.');}
 // Centre the specimen and fit its longest side to two units, whatever scale Meshy exported.
 const model=gltf.scene,box=new THREE.Box3().setFromObject(model),size=box.getSize(new THREE.Vector3());
 model.position.sub(box.getCenter(new THREE.Vector3()));pivot.add(model);pivot.scale.setScalar(2/Math.max(size.x,size.y,size.z,1e-6));
 status.hidden=true;
 const START={yaw:-.5,pitch:flat?.45:.25,dist:5.2},minPitch=flat?.08:-1.3,view={...START},spin={yaw:0,pitch:0};
 let dragging=false,last=null,touched=false,frame=0;
 const pointers=new Map(),pinch={d:0};
 function resize(){const w=host.clientWidth,h=host.clientHeight;if(!w||!h)return;renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();}
 function render(){
  if(!dragging){view.yaw+=spin.yaw;view.pitch+=spin.pitch;spin.yaw*=.92;spin.pitch*=.92;if(!touched&&!reduced)view.yaw+=.004;}
  view.pitch=Math.max(minPitch,Math.min(1.3,view.pitch));
  pivot.rotation.set(view.pitch,view.yaw,0,'XYZ');camera.position.set(0,0,view.dist);camera.lookAt(0,0,0);
  renderer.render(scene,camera);frame=requestAnimationFrame(render);
 }
 const zoom=f=>{view.dist=Math.max(3,Math.min(9,view.dist*f));touched=true;};
 const canvas=renderer.domElement;canvas.style.touchAction='none';canvas.tabIndex=0;
 canvas.addEventListener('pointerdown',e=>{canvas.setPointerCapture(e.pointerId);pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});dragging=pointers.size===1;last={x:e.clientX,y:e.clientY};touched=true;});
 canvas.addEventListener('pointermove',e=>{
  if(!pointers.has(e.pointerId))return;pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});
  if(pointers.size===2){const [a,b]=[...pointers.values()],d=Math.hypot(a.x-b.x,a.y-b.y);if(pinch.d)zoom(pinch.d/d);pinch.d=d;return;}
  if(!dragging)return;const dx=e.clientX-last.x,dy=e.clientY-last.y;last={x:e.clientX,y:e.clientY};
  spin.yaw=dx*.01;spin.pitch=dy*.01;view.yaw+=spin.yaw;view.pitch+=spin.pitch;
 });
 const up=e=>{pointers.delete(e.pointerId);pinch.d=0;dragging=false;if(reduced){spin.yaw=spin.pitch=0;}};
 canvas.addEventListener('pointerup',up);canvas.addEventListener('pointercancel',up);
 canvas.addEventListener('wheel',e=>{e.preventDefault();zoom(e.deltaY>0?1.1:.9);},{passive:false});
 canvas.addEventListener('keydown',e=>{const step={ArrowLeft:[-.2,0],ArrowRight:[.2,0],ArrowUp:[0,-.2],ArrowDown:[0,.2]}[e.key];if(step){e.preventDefault();view.yaw+=step[0];view.pitch+=step[1];touched=true;}});
 dialog.querySelectorAll('[data-rock3d]').forEach(b=>b.onclick=()=>{const a=b.dataset.rock3d;if(a==='reset'){Object.assign(view,START);spin.yaw=spin.pitch=0;}else zoom(a==='in'?.85:1.18);});
 const observer=new ResizeObserver(resize);observer.observe(host);resize();render();
 return()=>{
  cancelAnimationFrame(frame);observer.disconnect();
  model.traverse(o=>{o.geometry?.dispose();[].concat(o.material||[]).forEach(m=>{Object.values(m).forEach(v=>v?.isTexture&&v.dispose());m.dispose();});});
  renderer.dispose();renderer.forceContextLoss();canvas.remove();
 };
}
