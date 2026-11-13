export const PHASER_URL='/assets/vendor/phaser-3.90.0.min.js';
let pending;

export function loadPhaser(){
 if(window.Phaser?.Scene&&window.Phaser?.Game)return Promise.resolve(window.Phaser);
 if(pending)return pending;
 pending=new Promise((resolve,reject)=>{
  const script=document.createElement('script'),worker=navigator.serviceWorker;
  const controlled=!!worker?.controller;
  const finish=ok=>{
   clearTimeout(timer);script.onload=script.onerror=null;
   if(!ok){script.remove();reject(Object.assign(new Error('Phaser could not be loaded'),{name:'EngineLoadError'}));return;}
   resolve(window.Phaser);
   // If the request outran service worker activation, store the engine after first use.
   if(!controlled)worker?.ready.then(reg=>reg.active?.postMessage('remember-phaser')).catch(()=>{});
  };
  const timer=setTimeout(()=>finish(false),8000);
  script.onload=()=>finish(!!(window.Phaser?.Scene&&window.Phaser?.Game));
  script.onerror=()=>finish(false);
  script.src=PHASER_URL;
  document.head.append(script);
 }).finally(()=>{pending=null;});
 return pending;
}
