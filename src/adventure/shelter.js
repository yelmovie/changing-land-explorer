// All contact points are local to this one practice desk. The same rig is used
// before/after a successful drop and in the waiting phase.
export const SHELTER={x:700,y:432,scale:1,
 body:{x:32,y:44,size:180},head:{x:24,y:-43,w:160,h:88},
 leg:{x:120,y:80,w:95,h:170},under:{x:0,y:50,w:320,h:190}};
export function shelterPoint(part){return {x:SHELTER.x+part.x*SHELTER.scale,y:SHELTER.y+part.y*SHELTER.scale};}
export function inShelter(x,y,part){const p=shelterPoint(part);return Math.abs(x-p.x)<=part.w*SHELTER.scale/2&&Math.abs(y-p.y)<=part.h*SHELTER.scale/2;}
export function createShelter(scene,api,hero,p){
 const rig=scene.add.container(SHELTER.x,SHELTER.y).setScale(SHELTER.scale);hero.setDepth(10);
 const floor=api.panel(0,-4,520,344,0xf4e6c9,1);rig.add(floor);
 const frame=scene.add.graphics();rig.add(frame);
 frame.fillStyle(0x9b744c).fillRoundedRect(-165,-90,30,225,6).fillRoundedRect(105,-90,30,225,6);
 frame.fillStyle(0xdab47b).fillRoundedRect(-190,-111,380,29,7);
 frame.lineStyle(4,0x88613b).strokeRoundedRect(-190,-111,380,29,7);
 const outline=scene.add.rectangle(0,50,320,190,0xffda78,.025).setStrokeStyle(3,0xc69943,.8);rig.add(outline);
 rig.add(api.text('튼튼한 책상 · 몸을 낮춰 보호',0,-146,22));
 let pillow=null;
 function crouch(){
  if(hero.parentContainer!==rig)rig.add(hero);
  hero.setTexture(scene.textures.exists('hero-protect')?'hero-protect':'river-pose-2');
  hero.setScale(SHELTER.body.size/hero.height).setPosition(SHELTER.body.x,SHELTER.body.y);
  hero.disableInteractive();
 }
 function protectHead(object){
  pillow=object;if(pillow.parentContainer!==rig)rig.add(pillow);
  pillow.setPosition(SHELTER.head.x,SHELTER.head.y).setScale(.72);
  pillow.disableInteractive();
 }
 function hold(){
  if(!scene.textures.exists('art/hero-hold-leg-v1'))return false;
  hero.setTexture('art/hero-hold-leg-v1').setScale(SHELTER.body.size/hero.height).setPosition(SHELTER.body.x,SHELTER.body.y);
  return true;
 }
 if(p.under)crouch();
 return {rig,crouch,protectHead,hold,
  shake(offset){rig.x=SHELTER.x+offset;},
  drawHead(){const cushion=scene.add.container(0,0,[api.image('art/safety-cushion',0,0,145,91)]).setSize(150,96);protectHead(cushion);return cushion;}
 };
}
