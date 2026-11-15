// Autoplay runs visits and motion at twice the manual clock rate.
export function createPlayback({onChange=()=>{}}={}){
 let config=null,playing=false,elapsed=0,clock=0;
 const ready=()=>!!config&&config.ready();
 function stop(){if(!playing)return;playing=false;elapsed=0;config?.stop?.();onChange();}
 return {
  get playing(){return playing;},get time(){return clock;},get ready(){return ready();},
  configure(value){stop();config=value;elapsed=0;onChange();},
  start(){if(playing||!ready())return false;playing=true;elapsed=0;config.advance();onChange();return true;},
  stop,
  update(delta,update){
   // Substeps preserve the activity's delta caps at 2× speed.
   let remaining=Math.max(0,Math.min(Number(delta)||0,100))*(playing?2:1);
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
