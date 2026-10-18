export const PHASES = {
  river: [['예상하고 실험', '물의 양 비교', '세 가지 흔적'], ['상류 탐사', '하류 탐사', '강 지도 완성']],
  volcano: [['모형 조립', '직접 분출', '흐른 길 조사'], ['분출물 탐사', '같은 점 찾기', '다른 점 찾기']],
  rocks: [['표본 닦기', '어두운 돌 관찰', '밝은 돌 관찰'], ['표본 정리', '새로운 돌 C', '새로운 돌 D']],
  city: [['공항의 변화', '농장의 변화', '온천의 변화'], ['공항과 화산재', '농장에 소식', '온천에 소식']],
  safety: [['위험 찾기', '탁자 아래로', '몸을 보호해'], ['학교 길 그리기', '이동하며 확인', '야외에서도 안전']]
};

export const TOOL_ASSETS = {lens:'tool-lens',camera:'tool-camera',box:'tool-box',compass:'tool-compass',flag:'tool-flag'};
const object = value => value !== null && typeof value === 'object' && !Array.isArray(value);

export function chapterState(data, step) {
  if (!object(data.adventure) || data.adventure.version !== 1) data.adventure = {version:1, chapters:{}};
  const adventure = data.adventure;
  if (!object(adventure.chapters)) adventure.chapters = {};
  if (!object(adventure.chapters[step])) adventure.chapters[step] = {phase:0,tasks:{},work:{}};
  const chapter = adventure.chapters[step];
  if (!object(chapter.tasks)) chapter.tasks = {};
  if (!object(chapter.work)) chapter.work = {};
  for (const phase of [0,1,2]) if (!object(chapter.work[phase])) chapter.work[phase] = {};
  chapter.phase = Math.min(2,Math.max(0,Math.floor(Number(chapter.phase)||0)));
  // A saved phase cannot jump past unfinished learning actions.
  for (let i=0;i<chapter.phase;i++) if (chapter.tasks[i]?.done !== true) {chapter.phase=i;break;}
  return chapter;
}

export function chapterComplete(data,step) {
  const chapter = data?.adventure?.chapters?.[step];
  return data?.adventure?.version===1 && [0,1,2].every(i=>chapter?.tasks?.[i]?.done===true);
}

export function completePhase(data,step,phase,summary,details={}) {
  const chapter=chapterState(data,step);
  if (![0,1,2].includes(phase)) return false;
  if (Array.from({length:phase},(_,i)=>i).some(i=>chapter.tasks[i]?.done !== true)) return false;
  const isNew=!chapter.tasks[phase]?.done;
  chapter.tasks[phase]={done:true,summary:String(summary).slice(0,500),details};
  return isNew;
}

export function revisitPhase(data,step) {
  const chapter = chapterState(data,step), evidence = data.evidence?.[data.revisit];
  if (evidence?.activity === step && [0,1,2].includes(evidence.phase) &&
      Array.from({length:evidence.phase},(_,i)=>i).every(i=>chapter.tasks[i]?.done === true)) {
    chapter.phase = evidence.phase;
  }
  delete data.revisit;
  return chapter;
}

export function discoveryCount(state) {
  return Object.values(state?.drafts||{}).reduce((total,draft)=>total+[0,1].reduce((n,step)=>n+[0,1,2].filter(p=>draft.data?.adventure?.chapters?.[step]?.tasks?.[p]?.done===true).length,0),0);
}

export function stageDiscoveries(state,id) {
  const data=state?.drafts?.[id]?.data||state?.records?.[id]?.data;
  return [0,1].reduce((n,step)=>n+[0,1,2].filter(p=>data?.adventure?.chapters?.[step]?.tasks?.[p]?.done===true).length,0);
}
