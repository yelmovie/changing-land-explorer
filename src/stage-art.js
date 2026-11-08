import {TOOL_ASSETS} from './adventure/rules.js';

// Logical asset names remain stable in saved observations; only their artwork changes.
const replacements={
 'river-lab':'art/river-observatory-v2',
 'river-field':'art/river-canyon-v2',
 'art/river-sediment-fan-v1':'art/river-sediment-bank-v2',
 'volcano-lab':'art/volcano-workshop-v2',
 'volcano-field':'art/volcano-caldera-v2',
 'volcano-eruption':'art/volcano-caldera-v2',
 'rock-0':'art/rock-basalt-study-v1',
 'rock-1':'art/rock-granite-study-v1',
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

// Textures used by the five activities, shared with the offline build.
const UI=name=>'art/ui/'+name;
export const STAGE_ASSETS={
  river:['river-lab','river-field','art/river-sand-model','art/river-sand-wet-v1','art/river-sediment-fan-v1','art/river-water-current-v2'],volcano:['volcano-lab','volcano-field','volcano-eruption','art/volcano-mountain','art/volcano-tray','art/volcano-syringe',...Array.from({length:3},(_,i)=>'art/volcano-ash-puff-'+i+'-v1')],
  rocks:['rocks-lab','art/rocks-quarry-atelier-v2','rock-0','rock-1','rock-2','rock-3','art/geologist-brush',UI('dust-crust'),UI('specimen-tray')],
  city:['city-before','city-eruption','city-calm','art/city-message-square-v2','art/volcano-ash-puff-1-v1','art/volcano-ash-puff-2-v1',...['notice-board','indoor-wall','window-frame','glass-pane','dust-mask','time-knob'].map(UI)],
  safety:['classroom','school','art/safety-cushion','art/hero-hold-leg-v1',...['warning-sign','school-desk','school-floor','flowerbed','broken-glass','fallen-shelf','exit-mat','playground','town-ground','house-roof','brick-wall','utility-pole'].map(UI)]
};
export const SHARED_STAGE_ASSETS=['river-hero','river-pose-0','river-pose-1','river-pose-2','river-pose-3','hero-lens','hero-brush','hero-cheer','hero-protect','tool-water',UI('parchment-panel'),UI('paper-card'),...Object.values(TOOL_ASSETS)];
