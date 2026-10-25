// Destroying a game deletes its resources, but Chromium also needs the context
// explicitly released when many separate 2D activities are visited in one tab.
export function destroyGame(game){
  if(!game)return;
  const gl=game.renderer?.gl;
  if(gl)game.events.once('destroy',()=>queueMicrotask(()=>{try{gl.getExtension('WEBGL_lose_context')?.loseContext();}catch{}}));
  game.destroy(true);
}
