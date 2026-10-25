// Logical asset names remain stable in saved observations; only their artwork changes.
const replacements={
 'river-lab':'art/river-observatory-v2',
 'river-field':'art/river-canyon-v2',
 'volcano-lab':'art/volcano-workshop-v2',
 'volcano-field':'art/volcano-caldera-v2',
 'volcano-eruption':'art/volcano-caldera-v2',
 'rocks-lab':'art/rocks-crystal-cave-v2',
 'city-calm':'art/city-harbor-v2',
 'classroom':'art/safety-island-classroom-v2',
 'school':'art/safety-evacuation-garden-v2'
};
export const backgroundForAsset=key=>replacements[key]||key;
export const STAGE_BACKGROUNDS={
 river:['river-lab','river-field'],
 volcano:['volcano-lab','volcano-eruption'],
 rocks:['rocks-lab','art/rocks-quarry-atelier-v2'],
 city:['city-calm','art/city-message-square-v2'],
 safety:['classroom','school']
};
