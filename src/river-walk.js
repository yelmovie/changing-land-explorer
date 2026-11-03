// Frames are feet-aligned by scripts/prepare-river-sprite.mjs.
export const RIVER_WALK={
 key:'river-walk',url:'/assets/characters/river-walk.webp',
 frameWidth:128,frameHeight:160,columns:4,
 directions:['south','southwest','west','northwest','north','northeast','east','southeast'],
 origin:[.5,.9125],display:[72,90],stride:88
};
const sectors=['east','southeast','south','southwest','west','northwest','north','northeast'];
export function walkDirection(dx,dy,previous='south'){
 if(Math.hypot(dx,dy)<.001)return previous;
 return sectors[(Math.round(Math.atan2(dy,dx)/(Math.PI/4))+8)%8];
}
export function walkFrame(direction,distance=0,walking=false){
 const row=Math.max(0,RIVER_WALK.directions.indexOf(direction));
 return row*4+(walking?Math.floor(Math.max(0,distance)/RIVER_WALK.stride*4)%4:1);
}
export function createRiverWalker(scene,x,y){
 const ready=scene.textures.exists(RIVER_WALK.key);
 const hero=ready?scene.add.sprite(x,y,RIVER_WALK.key,walkFrame('south')).setOrigin(...RIVER_WALK.origin).setDisplaySize(...RIVER_WALK.display):scene.add.image(x,y,'river').setOrigin(.5,.94).setDisplaySize(50,69);
 hero.setDepth(10).setName('river-walker');
 const shadow=scene.add.ellipse(x,y,29,9,0x193c2c,.20).setDepth(9);
 let facing='south',distance=0;
 hero.setData({facing,walking:false});
 return {
  hero,
  move(dx,dy,step){
   facing=walkDirection(dx,dy,facing);distance+=step;
   if(ready)hero.setFrame(walkFrame(facing,distance,true));
   else hero.setFlipX(dx<0);
   hero.setData({facing,walking:true});shadow.setPosition(hero.x,hero.y);
  },
  stop(){
   if(ready)hero.setFrame(walkFrame(facing));
   hero.setData('walking',false);shadow.setPosition(hero.x,hero.y);
  },
  face(dx,dy){facing=walkDirection(dx,dy,facing);hero.setData('facing',facing);this.stop();}
 };
}

