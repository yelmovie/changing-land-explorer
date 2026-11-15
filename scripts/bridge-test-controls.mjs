export async function bridgeDrag(page,site,touch){
 const grip=await page.locator('.bridge-grip').boundingBox();
 const start={x:Math.round(grip.x+grip.width/2),y:Math.round(grip.y+grip.height/2)};
 const end=site?await page.locator(`[data-bridge-drop="${site}"]`).evaluate(el=>{
  const b=el.getBBox(),p=new DOMPoint(b.x+b.width/2,b.y+b.height/2).matrixTransform(el.getScreenCTM());
  return {x:Math.round(p.x),y:Math.round(p.y)};
 }):{x:start.x,y:6};
 if(touch){
  await touch.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[start]});
  for(let i=1;i<=12;i++){
   const x=Math.round(start.x+(end.x-start.x)*i/12),y=Math.round(start.y+(end.y-start.y)*i/12);
   await touch.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x,y}]});
  }
  await touch.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
 }else{
  await page.mouse.move(start.x,start.y);await page.mouse.down();
  await page.mouse.move(end.x,end.y,{steps:12});await page.mouse.up();
 }
}
