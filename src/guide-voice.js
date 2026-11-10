import {guideRecordings} from './guide-recordings.js';
import {playVoice,stopVoice} from './sound.js';
const normalize=text=>String(text||'').replace(/\s+/g,' ').trim();
const byText=new Map(Object.values(guideRecordings).map(line=>[normalize(line.text),line.file]));
/** Only exact displayed lines with shipped audio may be spoken. */
export function guideFileForText(text){return byText.get(normalize(text))||'';}
export function playGuideText(text){const file=guideFileForText(text);if(!file)return false;playVoice(file);return true;}
/** Observe only the two short DOM narration lines, never the animated scene. */
export function watchGuideText(root){
 const nodes=[...root.querySelectorAll('#speech,#map-speech')],previous=new WeakMap();
 if(!nodes.length)return()=>{};
 const read=()=>{
  if(document.querySelector('dialog[open]'))return;
  for(const node of nodes){if(!node.isConnected)continue;const text=normalize(node.textContent);if(previous.get(node)===text)continue;previous.set(node,text);const file=guideFileForText(text);
   // Mission descriptions are read once in their arrival dialog, not again during the walk.
   if(file&&!(node.id==='map-speech'&&file.startsWith('guide-intro-')))playVoice(file);else stopVoice();}
 };
 const observer=new MutationObserver(read);
 for(const node of nodes)observer.observe(node,{childList:true,characterData:true,subtree:true});
 const closed=()=>queueMicrotask(read);document.addEventListener('close',closed,true);queueMicrotask(read);
 return()=>{observer.disconnect();document.removeEventListener('close',closed,true);};
}
