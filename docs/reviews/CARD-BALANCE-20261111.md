# Rounded cards and balanced observation space

Reference volcano comparison screen: model/real observation pictures now share 348×186 scene-pixel bounds (model formerly 180×96), 20px corners and centered column alignment. Rounded target wells replace rectangular outlines. Rows use a 135px rhythm, card bank a 290px rhythm. Main panel shortened from 560 to 542 scene pixels; source bank sits beneath it instead of leaving a large empty lower panel. Shared paper cards use translucent fills; colored panels use rounded geometry. Full 150 state checks passed with 0 runtime errors; actual flow completion checked separately.

Do not round or fade scientific objects themselves. Text remains fully opaque. Real hardware tablets and all OS/browser combinations remain untested.

Follow-up reading-boundary check: fit source/placed cards to a 108px scene-height envelope; retain 48px touch targets through the existing scale-aware drag hit-area logic. Header inset enlarged without restoring the empty lower area.
