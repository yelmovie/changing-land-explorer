// A finite, repeatable tour. It never selects answers or changes pages.
export function observationTour(api,{items,visit,label,interval=2800,ready=()=>true,needed=()=>true,stop=()=>{}}){
 let cursor=0,observed=false;
 return {label,interval,allowWhenComplete:true,ready,get observed(){return observed||!needed();},stop(){const interrupted=stop();if(interrupted)cursor=Math.max(0,cursor-1);else if(cursor>=items.length)cursor=0;},
  advance(){
   if(!ready())return;
   if(cursor>=items.length){observed=true;cursor=0;api.stopAutoplay();return;}
   visit(items[cursor++]);
  }
 };
}
