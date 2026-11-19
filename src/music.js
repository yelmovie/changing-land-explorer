// One music player follows the game or the visible film. Effects keep their own voice.
const tracks={main:'/assets/audio/main-theme.mp3',final:'/assets/audio/final-theme.mp3'};
const volumeKey='moving-geovalley-music-volume';
// Spoken lines turn the music down instead of stopping it; a film with its own narrator gets a little more room.
const DUCK=.25,FILM=.45,FADE_MS=180;
let volume=30;
try{const saved=localStorage.getItem(volumeKey);if(saved!==null&&Number.isFinite(Number(saved)))volume=Math.min(100,Math.max(0,Number(saved)));}catch{}
let player,loaded,scene='main',film,seekTo=null,unlocked=false,master=true;
// Every reason to stay quiet (a voice line, an open concept film) holds its own tag; the music returns only when all are gone.
const ducks=new Set();
// The map finale dialog borrows the player for the final theme. That theme is 24 s and plays once,
// then the main theme carries on quietly so the finale and ending screens are never silent.
let finale=null,finalDone=false,fade=0,fadeTarget=-1;
// Some tablets (iOS Safari) ignore element volume. There a spoken line still pauses the music, as it always did.
let fixedVolume=false;

export const musicVolume=()=>volume;
export function setMusicVolume(value){
 volume=Math.min(100,Math.max(0,Number(value)||0));
 try{localStorage.setItem(volumeKey,String(volume));}catch{}
 sync();
}
export function setMusicMaster(on){master=on;sync();}
export function musicScene(theme){if(scene!==theme){scene=theme;finalDone=false;}sync();}
export function duckMusic(reason){
 const tag={reason};ducks.add(tag);sync();
 return ()=>{if(ducks.delete(tag))sync();};
}
function seek(){
 if(seekTo===null||!player?.readyState)return;
 const t=seekTo;seekTo=null;
 if(Math.abs(player.currentTime-t)>.15)player.currentTime=t;
}
function level(target,instant){
 if(!instant&&fade&&fadeTarget===target)return;
 clearInterval(fade);fade=0;fadeTarget=target;
 if(instant||Math.abs(player.volume-target)<.005){player.volume=target;return;}
 const from=player.volume,started=performance.now();
 fade=setInterval(()=>{
  const k=Math.min(1,(performance.now()-started)/FADE_MS);
  player.volume=from+(target-from)*k;
  if(k===1){clearInterval(fade);fade=0;}
 },20);
}
function sync(){
 const wanted=film?.theme||(finale?'final':scene),theme=wanted==='final'&&finalDone&&!film?'main':wanted;
 const canPlay=unlocked&&master&&volume>0&&!document.hidden&&(!film||film.playing)&&!(fixedVolume&&ducks.size);
 if(!canPlay){clearInterval(fade);fade=0;player?.pause();return;}
 if(!player){
  player=new Audio();player.preload='metadata';
  player.volume=.5;fixedVolume=player.volume!==.5;
  player.addEventListener('loadedmetadata',()=>{if(film)seekTo=film.video.currentTime;seek();});
  player.addEventListener('ended',()=>{if(loaded==='final'&&!film){finalDone=true;sync();}});
 }
 const changed=loaded!==theme;
 if(changed){loaded=theme;player.src=tracks[theme];}
 // Leave space for River's lines, for the narrator mixed into the story video, and after the short final theme.
 const quiet=Math.min(ducks.size?DUCK:1,film?.voiceLevel()>0?FILM:1,theme!==wanted?FILM:1);
 level(volume/100*quiet,changed||player.paused);player.loop=theme==='main'&&!film;
 if(film){seekTo=film.video.currentTime;player.playbackRate=film.video.playbackRate;}
 else player.playbackRate=1;
 seek();
 if(player.paused&&!player.ended)player.play().catch(()=>{});
}
// A mouse press and a key start the music at once; touch only counts when the finger lifts.
function unlock(event){if(event.isTrusted){unlocked=true;sync();}}
for(const type of ['pointerdown','pointerup','keydown','click'])document.addEventListener(type,unlock,true);
document.addEventListener('visibilitychange',sync);
// map-finale.js announces its dialog. The film there stays muted; the final theme starts from the top
// and the main theme returns where it left off when the dialog closes.
document.addEventListener('map-finale',event=>{
 const open=!!event.detail?.open;
 if(open===!!finale)return;
 if(open){finale={prior:loaded==='main'&&player?player.currentTime:0};finalDone=false;seekTo=0;}
 else{seekTo=loaded==='main'?null:finale.prior;finale=null;finalDone=false;}
 sync();
});

// A settings replay temporarily borrows the music player and then restores the previous theme position.
export function scoreFilm(video,theme,restore,voiceLevel=()=>0){
 const prior=loaded===scene&&player?player.currentTime:0;
 const session={video,theme,playing:false,voiceLevel};film=session;finalDone=false;sync();
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
