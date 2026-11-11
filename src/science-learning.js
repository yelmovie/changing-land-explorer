import {emphasizeConcept} from './concept-focus.js';

// One observation focus per discovery, in the same order as adventure/rules.js.
// These explain the science without choosing a learner's answer or route.
export const SCIENCE_LEARNING = {
  river: {
    standard: '4과11-01',
    terms: ['침식', '운반', '퇴적', '상류', '하류'],
    focus: [
      ['흐르는 물은 흙을 깎고 옮기고 쌓아.', '물의 양만 바꾸고 같은 언덕을 비교해.', '침식은 깎임, 운반은 옮김, 퇴적은 쌓임이야.'],
      ['상류는 강이 시작되는 쪽이야.', '하류는 강의 끝에 가까운 쪽이야.', '물길의 넓이와 흙·돌의 모습을 함께 비교해.']
    ]
  },
  volcano: {
    standard: '4과11-02',
    terms: ['모형', '붉은 물', '마그마', '용암', '화산재', '화산 기체', '암석 조각'],
    focus: [
      ['모형은 실제 현상의 일부를 나타내.', '붉은 물이 나오는 곳과 흐르는 길을 봐.', '물은 경사면을 따라 아래로 흘러.'],
      ['분출물은 화산 밖으로 나온 물질이야.', '모형과 실제 화산에서 닮은 모습을 찾아.', '붉은 물은 실제 용암의 뜨거움을 나타내지 않아.']
    ]
  },
  rocks: {
    standard: '4과11-03',
    terms: ['현무암', '화강암', '화성암', '전체 색', '알갱이'],
    focus: [
      ['표본은 살펴보려고 고른 돌이야.', '서로 다른 곳을 확대해서 비교해.', '전체 색과 알갱이를 함께 기록해.'],
      ['관찰한 두 단서로 기준 표본과 비교해.', '구멍 하나만으로 돌 이름을 정하지 않아.', '새 돌도 전체 색과 알갱이를 함께 살펴봐.']
    ]
  },
  city: {
    standard: '4과11-04',
    terms: ['화산재', '피해', '오랜 시간', '안전 확인', '공식 안내', '온천'],
    focus: [
      ['화산재는 작은 고체 알갱이야.', '흙이 달라지려면 오랜 시간이 필요해.', '땅속 열을 이용할 때도 안전 확인이 먼저야.'],
      ['관찰한 사실과 까닭을 연결해 행동해.', '분출 직후와 오랜 시간 뒤를 구별해.', '공식 안내로 안전을 확인한 뒤 이용해.']
    ]
  },
  safety: {
    standard: '4과11-04',
    terms: ['흔들릴 때', '머리', '몸 보호', '책상 다리', '흔들림이 멈춘', '선생님', '계단', '대피'],
    focus: [
      ['유리와 넘어질 물건에서 떨어져.', '흔들릴 때는 튼튼한 책상 아래로 들어가.', '책상 다리를 잡고 흔들림이 멈출 때까지 기다려.'],
      ['흔들림이 멈춘 뒤 선생님 안내를 따라가.', '엘리베이터 대신 계단으로 이동해.', '건물·담장·전신주에서 떨어진 넓은 곳으로 가.']
    ]
  }
};

const allTerms = [...new Set(Object.values(SCIENCE_LEARNING).flatMap(stage => stage.terms))];
export function scienceText(text, id) {
  return emphasizeConcept(text, SCIENCE_LEARNING[id]?.terms || allTerms);
}
