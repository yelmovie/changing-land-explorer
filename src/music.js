// One music player follows the game or the visible film. Effects keep their own voice.
const tracks={main:'/assets/audio/main-theme.mp3',final:'/assets/audio/final-theme.mp3'};
const volumeKey='moving-geovalley-music-volume';
let volume=30;
try{const saved=localStorage.getItem(volumeKey);if(saved!==null&&Number.isFinite(Number(saved)))volume=Math.min(100,Math.max(0,Number(saved)));}catch{}
let player,loaded,scene='main',film,seekTo=null,unlocked=false,master=true,holds=0;

export const musicVolume=()=>volume;
export function setMusicVolume(value){
 volume=Math.min(100,Math.max(0,Number(value)||0));
 try{localStorage.setItem(volumeKey,String(volume));}catch{}
 sync();
}
export function setMusicMaster(on){master=on;sync();}
export function musicScene(theme){scene=theme;sync();}
export function holdMusic(){
 holds++;sync();let released=false;
 return ()=>{if(!released){released=true;holds--;sync();}};
}
function seek(){
 if(seekTo===null||!player?.readyState)return;
 const t=seekTo;seekTo=null;
 if(Math.abs(player.currentTime-t)>.15)player.currentTime=t;
}
function sync(){
 const theme=film?.theme||scene,canPlay=unlocked&&master&&volume>0&&!document.hidden&&!holds&&(!film||film.playing);
 if(!canPlay){player?.pause();return;}
 if(!player){
  player=new Audio();player.preload='metadata';
  player.addEventListener('loadedmetadata',()=>{if(film)seekTo=film.video.currentTime;seek();});
 }
 if(loaded!==theme){loaded=theme;player.src=tracks[theme];}
 // Leave space for the narrator mixed into the story video.
 player.volume=volume / 100 * (film?.voiceLevel() > 0 ? .45 : 1);player.loop=theme==='main'&&!film;
 if(film){seekTo=film.video.currentTime;player.playbackRate=film.video.playbackRate;}
 else player.playbackRate=1;
 seek();
 if(player.paused&&!player.ended)player.play().catch(()=>{});
}
function unlock(event){if(event.isTrusted){unlocked=true;sync();}}
document.addEventListener('click',unlock,true);
document.addEventListener('keydown',unlock,true);
document.addEventListener('visibilitychange',sync);

// A settings replay temporarily borrows the music player and then restores the previous theme position.
export function scoreFilm(video,theme,restore,voiceLevel=()=>0){
 const prior=loaded===scene&&player?player.currentTime:0;
 const session={video,theme,playing:false,voiceLevel};film=session;sync();
 const events=new AbortController();
 const on=(event,fn)=>video.addEventListener(event,fn,{signal:events.signal});
 for(const event of ['pause','waiting','seeking','ended'])on(event,()=>{session.playing=false;sync();});
 on('playing',()=>{session.playing=true;sync();});
 on('ratechange',sync);
 return ()=>{
  events.abort();if(film!==session)return;
  film=null;
  if(restore)seekTo=prior;
  else if(scene===theme)seekTo=video.currentTime;
  sync();
 };
}
