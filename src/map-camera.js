// Pure camera bounds shared by the live map and regression tests.
export function clampMapAxis(value,viewport,world){
  return world<=viewport?(viewport-world)/2:Math.max(viewport-world,Math.min(0,value));
}
export function overviewFrame(width,top,bottom){
  const padding=16,contentTop=Math.max(0,top)+64;
  const height=Math.max(1,bottom-contentTop-padding);
  const w=Math.max(1,Math.min(width-padding*2,height*16/9));
  const h=w*9/16;
  return {w,h,x:(width-w)/2,y:contentTop+(height-h)/2};
}
