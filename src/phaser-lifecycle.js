// Destroying a game deletes its resources, but Chromium also needs the context
// explicitly released when many separate 2D activities are visited in one tab.
export function destroyGame(game){
  if(!game)return;
  for(const [name,listener,options] of visibility.get(game)||[])document.removeEventListener(name,listener,options);
  visibility.delete(game);
  const gl=game.renderer?.gl;
  if(gl)game.events.once('destroy',()=>queueMicrotask(()=>{try{gl.getExtension('WEBGL_lose_context')?.loseContext();}catch{}}));
  game.destroy(true);
}

// Phaser's destroy() leaves each finished game reachable in two places: its shared CanvasPool keeps the canvas it
// made (with the scene's listeners and, through them, the old page), and the document visibilitychange listener that
// start() adds right after postBoot is never removed. Give every game its own canvas and, only for the rest of that
// start() call, note the visibility listener so destroyGame can take it off.
const visibility=new WeakMap();
function noteVisibility(game){
  const added=[],own=Object.prototype.hasOwnProperty.call(document,'addEventListener'),add=document.addEventListener;
  document.addEventListener=function(name,listener,options){
    if(name==='visibilitychange'||name==='webkitvisibilitychange')added.push([name,listener,options]);
    return add.call(this,name,listener,options);
  };
  visibility.set(game,added);
  queueMicrotask(()=>{if(own)document.addEventListener=add;else delete document.addEventListener;});
}
export function createGame(Phaser,config){
  const type=config.type===Phaser.AUTO?(Phaser.Device?.features?.webGL===false?Phaser.CANVAS:Phaser.WEBGL):config.type;
  const postBoot=config.callbacks?.postBoot;
  return new Phaser.Game({...config,type,canvas:config.canvas||document.createElement('canvas'),
    callbacks:{...config.callbacks,postBoot(game){postBoot?.(game);noteVisibility(game);}}});
}
