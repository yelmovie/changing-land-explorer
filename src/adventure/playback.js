// Playback has its own clock: speed changes affect both visits and motion,
// without changing Phaser's input, scene lifecycle or the learner's answers.
export const PLAYBACK_SPEEDS=[.5,1,2,3];
export function createPlayback({onChange=()=>{}}={}){
 let config=null,playing=false,speed=1,elapsed=0,clock=0;
 const ready=()=>!!config&&config.ready();
 function stop(){if(!playing)return;playing=false;elapsed=0;config?.stop?.();onChange();}
 return {
  get playing(){return playing;},get speed(){return speed;},get time(){return clock;},get ready(){return ready();},
  configure(value){stop();config=value;elapsed=0;onChange();},
  setSpeed(value){if(PLAYBACK_SPEEDS.includes(Number(value))){speed=Number(value);onChange();}},
  start(){if(playing||!ready())return false;playing=true;elapsed=0;config.advance();onChange();return true;},
  stop,
  update(delta,update){
   // Substeps preserve the activity's delta caps even at 3× speed.
   let remaining=Math.max(0,Math.min(Number(delta)||0,100))*(playing?speed:1);
   while(remaining>0){
    const step=Math.min(remaining,20);remaining-=step;clock+=step;update?.(clock,step);
    if(!playing)continue;
    if(!ready()){stop();continue;}
    elapsed+=step;
    if(elapsed>=config.interval){elapsed-=config.interval;config.advance();onChange();}
   }
  }
 };
}
