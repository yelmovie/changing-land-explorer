// Export the displayed A4 sheet at 2400px using its actual text/line/image geometry.
const WIDTH=2400,HEIGHT=Math.round(WIDTH*210/297);

function drawText(ctx,node,box,scale){
 const style=getComputedStyle(node.parentElement);
 if(style.visibility==='hidden'||style.display==='none')return;
 ctx.font=`${style.fontStyle} ${style.fontWeight} ${parseFloat(style.fontSize)*scale}px ${style.fontFamily}`;
 ctx.fillStyle=style.color;ctx.textBaseline='middle';
 const outline=parseFloat(style.getPropertyValue('-webkit-text-stroke-width'))||0;
 ctx.lineWidth=outline*scale;ctx.strokeStyle=style.getPropertyValue('-webkit-text-stroke-color')||style.color;
 if('letterSpacing'in ctx)ctx.letterSpacing=style.letterSpacing==='normal'?'0px':`${parseFloat(style.letterSpacing)*scale}px`;
 const range=document.createRange();
 for(const word of node.textContent.matchAll(/\S+/g)){
  range.setStart(node,word.index);range.setEnd(node,word.index+word[0].length);
  const r=[...range.getClientRects()].find(rect=>rect.width>0);
  if(!r)continue;
  const x=(r.left-box.left)*scale,y=(r.top-box.top+r.height/2)*scale;
  if(outline)ctx.strokeText(word[0],x,y);
  ctx.fillText(word[0],x,y);
 }
}

export async function saveCertificatePng(paper){
 await document.fonts.ready;
 for(const animation of paper.getAnimations({subtree:true}))if(Number.isFinite(animation.effect?.getComputedTiming().endTime))animation.finish();
 const box=paper.getBoundingClientRect(),scale=WIDTH/box.width;
 const canvas=document.createElement('canvas');canvas.width=WIDTH;canvas.height=HEIGHT;
 const ctx=canvas.getContext('2d');if(!ctx)throw Error('canvas');
 for(const image of paper.querySelectorAll('img')){
  const r=image.getBoundingClientRect();if(!r.width||!r.height)continue;
  await image.decode();ctx.drawImage(image,(r.left-box.left)*scale,(r.top-box.top)*scale,r.width*scale,r.height*scale);
 }
 for(const blank of paper.querySelectorAll('.cert-blank')){
  const r=blank.getBoundingClientRect(),style=getComputedStyle(blank),width=parseFloat(style.borderBottomWidth)*scale;
  ctx.fillStyle=style.borderBottomColor;ctx.fillRect((r.left-box.left)*scale,(r.bottom-box.top)*scale-width,r.width*scale,width);
 }
 const walker=document.createTreeWalker(paper.querySelector('.cert-content'),NodeFilter.SHOW_TEXT);
 for(let node=walker.nextNode();node;node=walker.nextNode())if(node.textContent.trim())drawText(ctx,node,box,scale);
 const blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/png'));if(!blob)throw Error('png');
 const url=URL.createObjectURL(blob),link=document.createElement('a');link.href=url;link.download='지오밸리-탐험-인증서.png';document.body.append(link);link.click();link.remove();
 setTimeout(()=>URL.revokeObjectURL(url),4000);
}
