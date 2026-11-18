// The map award plays once on the last hit. It never changes learning or certificate progress.
// The film carries its captions in the bottom 22%, so it fills the screen (contain) and stays muted;
// the title and close button sit at the top where they never cover the captions.
export function openMapFinale(host, source) {
 const doc=host.ownerDocument;
 if(!host.isConnected||doc.querySelector('.map-finale-dialog'))return;
 const dialog=doc.createElement('dialog');dialog.className='map-finale-dialog';
 dialog.setAttribute('aria-label','지도 모험 피날레');
 Object.assign(dialog.style,{position:'fixed',inset:'0',width:'100dvw',height:'100dvh',maxWidth:'none',maxHeight:'none',margin:'0',padding:'0',border:'0',borderRadius:'0',overflow:'hidden',background:'#000',color:'#fff',zIndex:'999'});
 const title=doc.createElement('h2');title.textContent='모든 악당을 물리쳤어!';Object.assign(title.style,{position:'absolute',top:'max(10px,env(safe-area-inset-top))',left:'max(16px,env(safe-area-inset-left))',right:'210px',zIndex:'1',margin:'0',padding:'6px 14px',width:'fit-content',borderRadius:'10px',background:'#0f221ed9',font:'normal clamp(17px,2vw,26px) NanumSquareNeo,system-ui,sans-serif',pointerEvents:'none'});
 const video=doc.createElement('video');video.src=source;video.playsInline=true;video.muted=true;video.controls=true;video.autoplay=true;video.preload='metadata';video.setAttribute('aria-label','지도 탐험 피날레 영상');
 Object.assign(video.style,{position:'absolute',inset:'0',display:'block',width:'100%',height:'100%',objectFit:'contain',background:'#000'});
 const status=doc.createElement('p');status.hidden=true;status.role='status';Object.assign(status.style,{position:'absolute',left:'50%',top:'50%',transform:'translate(-50%,-50%)',zIndex:'1',margin:'0',padding:'10px 18px',maxWidth:'min(88%,600px)',borderRadius:'10px',background:'#12221ded',textAlign:'center'});
 const close=doc.createElement('button');close.type='button';close.textContent='지도로 돌아가기';Object.assign(close.style,{position:'absolute',top:'max(10px,env(safe-area-inset-top))',right:'max(16px,env(safe-area-inset-right))',zIndex:'2',minHeight:'48px',padding:'6px 18px',border:'1px solid #eac278',borderRadius:'12px',background:'#f6d589',color:'#354433',font:'normal clamp(16px,1.4vw,21px) NanumSquareNeo,system-ui,sans-serif',cursor:'pointer'});
 dialog.append(title,video,status,close);doc.body.append(dialog);dialog.showModal();
 close.addEventListener('click',()=>dialog.close());
 video.addEventListener('error',()=>{status.hidden=false;status.textContent='지금은 영상을 열 수 없어. 지도 퇴치 기록은 저장됐어.';});
 dialog.addEventListener('close',()=>{video.pause();dialog.remove();},{once:true});
 video.play().catch(()=>{});
}
