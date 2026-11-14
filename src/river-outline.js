// Pre-render the contour once for each map sprite frame. No filter touches the live map canvas.
function outlineSpriteFrame(source, x, y, width, height, radius) {
 const pad=Math.ceil(radius)+2, tile=document.createElement('canvas');
 tile.width=width+pad*2;tile.height=height+pad*2;
 const ctx=tile.getContext('2d');
 if(!ctx)return null;
 ctx.drawImage(source,x,y,width,height,pad,pad,width,height);
 ctx.globalCompositeOperation='source-in';ctx.fillStyle='#fff4d2';ctx.fillRect(0,0,tile.width,tile.height);
 return {tile,pad};
}

export function cacheRiverOutline(scene,key,sheet){
 const id=key+'-outline';
 if(scene.textures.exists(id))return id;
 const source=scene.textures.get(key).getSourceImage();
 const fw=sheet?.frameWidth??source.width,fh=sheet?.frameHeight??source.height;
 const cols=sheet?.columns??1,rows=sheet?.directions.length??1,radius=3;
 const first=outlineSpriteFrame(source,0,0,fw,fh,radius);
 if(!first)return key;
 const {tile,pad}=first,w=fw+2*pad,h=fh+2*pad;
 const texture=scene.textures.createCanvas(id,w*cols,h*rows);
 if(!texture)return key;
 const ctx=texture.context;
 for(let j=0;j<rows;j++)for(let i=0;i<cols;i++){
  const tint=i||j?outlineSpriteFrame(source,i*fw,j*fh,fw,fh,radius)?.tile:tile;
  if(!tint)continue;
  const dx=i*w,dy=j*h;
  for(let n=0;n<8;n++){const a=n*Math.PI/4;ctx.drawImage(tint,dx+Math.round(Math.cos(a)*radius),dy+Math.round(Math.sin(a)*radius));}
  ctx.drawImage(source,i*fw,j*fh,fw,fh,dx+pad,dy+pad,fw,fh);
  if(sheet)texture.add(j*cols+i,0,dx,dy,w,h);
 }
 texture.refresh();
 return id;
}
