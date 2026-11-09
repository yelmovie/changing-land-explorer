import {escapeHTML} from './ui.js';

// Content metadata, separate from completion flags. A completed activity is not
// a standardized assessment of independent mastery.
const curriculum='https://www.moe.go.kr/boardCnts/viewRenew.do?boardID=141&boardSeq=93458&lev=0&m=0404';
export const LEARNING_GUIDE=[
 {id:'river',title:'물길 관측소',standard:'4과11-01',source:curriculum,
  activities:[
   {goal:'물의 양만 바꿔 흙의 변화를 비교해요.',action:'물 흘리기·멈춤·되감기',evidence:'두 조건의 실험과 침식·운반·퇴적 표시'},
   {goal:'관찰한 흔적을 상류·하류의 특징과 연결해요.',action:'강의 네 곳 확대·관찰 카드 연결',evidence:'물길·바위·모래 기록과 퇴적 연결'}
  ],transfer:'기록탑에서는 흐르는 방향이 바뀐 물길에 적용해요.',caution:'빠른 물은 언제나 침식, 느린 물은 언제나 퇴적이라는 절대 규칙으로 일반화하지 않아요.'},
 {id:'volcano',title:'화산 연구소',standard:'4과11-02',source:'https://pubs.usgs.gov/gip/volc/text.html',
  activities:[
   {goal:'화산 모형에서 분출구와 흘러가는 길을 관찰해요.',action:'모형 조립·주사기 밀기·흐름 추적',evidence:'조립한 모형과 붉은 물의 출구·경사면 기록'},
   {goal:'실제 화산의 분출물과 모형의 한계를 비교해요.',action:'분출물 탐사·공통점과 차이 연결',evidence:'네 분출물 및 같은 점·다른 점의 비교'}
  ],transfer:'붉은 물이 보여 주는 것과 보여 주지 못하는 것을 말로 설명해요.',caution:'붉은 물은 실제 용암의 온도와 화산 분출의 원인을 재현하지 않아요.'},
 {id:'rocks',title:'암석 공방',standard:'4과11-03',source:'https://www.nps.gov/subjects/geology/igneous.htm',
  activities:[
   {goal:'두 표본의 색과 알갱이를 관찰해요.',action:'먼지 털기·서로 다른 세 곳 확대',evidence:'각 표본의 색·알갱이 두 관찰 근거'},
   {goal:'두 근거로 표본 주문을 해결하고 새 돌을 분류해요.',action:'관찰 기록을 활용한 배송·새 표본 이름 선택',evidence:'주문에 맞는 표본, C·D의 근거와 이름'}
  ],transfer:'기록탑은 같은 표본의 방향을 바꾼 확인이에요. 완전히 새로운 표본의 일반화 평가는 실제 암석으로 추가해요.',caution:'색 하나나 구멍 유무만으로 모든 암석의 이름을 판단하지 않아요.'},
 {id:'city',title:'시간 관측소',standard:'4과11-04',source:'https://www.usgs.gov/faqs/what-are-some-benefits-volcanic-eruptions',
  activities:[
   {goal:'같은 장소의 시기별 변화를 비교해요.',action:'공항·농장·온천의 시간 이동과 기록 배치',evidence:'장소별 분출 당시·이후의 두 모습'},
   {goal:'관찰한 사실과 까닭으로 안전한 행동을 선택해요.',action:'주민 안내판·창문과 마스크 조작',evidence:'사실·까닭·할 일을 연결한 안내'}
  ],transfer:'우리 생활의 피해·이로움과 안전 확인이 필요한 때를 구분해요.',caution:'분출 직후 곧바로 땅이 비옥해지거나 위험한 온천을 이용할 수 있다는 뜻이 아니에요.'},
 {id:'safety',title:'안전 훈련소',standard:'4과11-04',source:'https://www.safekorea.go.kr/safekorea-kor/acts/nacts/action-guide.do?category=earthQuake&menuSn=4',
  activities:[
   {goal:'흔들리는 동안 머리와 몸을 보호해요.',action:'위험물 찾기·책상 아래로·다리 잡기·멈춤 확인',evidence:'몸 보호 순서와 흔들림이 멈춘 뒤 확인'},
   {goal:'위험을 피해 대피하고 경로를 점검해요.',action:'학교·야외 통로를 누르거나 방향 버튼으로 이동',evidence:'장애물을 피하고 실제로 확인한 두 경로'}
  ],transfer:'기록탑의 다른 장애물 배치에 적용한 뒤 실제 학교의 대피 안내와 연결해요.',caution:'이 가상 지도는 실제 건물의 대피 경로가 아니에요. 흔들림 중 뛰어나가지 않아요.'}
];
export function learningGuideHTML(){
 return '<details class="learning-guide"><summary>장소별 학습 목표와 관찰 증거</summary><p>완료와 보상은 활동을 마쳤다는 뜻이에요. 도움 사용이나 반복 시도를 고려해 학생이 근거를 말로 설명할 수 있는지 확인해 주세요.</p>'+LEARNING_GUIDE.map(stage=>`<details><summary>${escapeHTML(stage.title)} · [${stage.standard}]</summary>${stage.activities.map((a,i)=>`<h3>활동 ${i+1} · ${escapeHTML(a.goal)}</h3><p>조작: ${escapeHTML(a.action)}<br>확인할 증거: ${escapeHTML(a.evidence)}</p>`).join('')}<p>${escapeHTML(stage.transfer)}</p><p>${escapeHTML(stage.caution)}</p><a href="${stage.source}" target="_blank" rel="noopener noreferrer">관련 원자료</a></details>`).join('')+'<p>출처 연결은 2026-11-02 교육과정 검토 기록을 바탕으로 정리했어요. 이번 작업에서 교육부 원문이나 외부 전문가 검토를 새로 수행한 것은 아니에요.</p></details>';
}
