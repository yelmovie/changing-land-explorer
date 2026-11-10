import {SAVE_KEY} from './model.js';

export const RECOVERY_KEY=SAVE_KEY+'-recovery-original';

// Adding a default is harmless. Changing or dropping a saved value deserves a
// byte-for-byte backup before the repaired in-memory state can be autosaved.
function changedSavedValue(original,repaired){
 if(Array.isArray(original))return !Array.isArray(repaired)||original.length!==repaired.length||original.some((value,i)=>changedSavedValue(value,repaired[i]));
 if(original&&typeof original==='object')return !repaired||typeof repaired!=='object'||Array.isArray(repaired)||Object.keys(original).some(key=>!Object.hasOwn(repaired,key)||changedSavedValue(original[key],repaired[key]));
 return original!==repaired;
}

export function preserveRecoveryOriginal(storage,raw,repaired){
 if(raw===null)return 'unchanged';
 try{
  if(!changedSavedValue(JSON.parse(raw),repaired))return 'unchanged';
  const previous=storage.getItem(RECOVERY_KEY);
  if(previous===raw)return 'preserved';
  // Do not silently replace an earlier recoverable original with another one.
  if(previous!==null)return 'blocked';
  storage.setItem(RECOVERY_KEY,raw);
  return storage.getItem(RECOVERY_KEY)===raw?'preserved':'blocked';
 }catch{return 'blocked';}
}
