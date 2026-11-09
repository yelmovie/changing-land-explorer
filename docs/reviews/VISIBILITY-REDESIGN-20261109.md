# GeoValley visibility and safety redesign (2026-11-09)

## Scope
Project 7 GeoValley contains five stages and 30 discoveries. Safety Training is its fifth stage, not a separate project.

- Replace ornate reading frames with quiet, inset outlines. Size cards from their text and use rounded rectangles for multiline narration.
- Improve river-region boundaries, observation markers, magnifier and character contrast. Preserve the enlarged observation preview.
- Preserve the original volcano/tray aspect ratios. Reposition the water path and saved observation scene together.
- Draw classroom art and window/bookshelf targets in the same coordinate system. Increase the character size and save source-image-relative target coordinates.
- City learning compares eruption effects with recovery or long-term change, then asks for an evidence-based community notice. It is not a preparation-kit activity. Show the same place in two enlarged views and preserve the different time conditions for airport, farm and spa.
- Replace route drawing and replay with direct movement by tapping nearby corridors or using direction controls. Stop on collision, provide three practice hearts and retry, and preserve route validation, exit/arrival conditions and saved evidence. Explain that real evacuation follows the teacher after shaking stops.

## Verification scope
Chrome automation uses emulated viewport sizes, not physical tablets. A script that knows the correct answers completing the game does not demonstrate independent child comprehension.

- Full student flow: 30 discoveries, 10 concept handoffs, five rewards, three final challenges, ending, certificate and persistence after reload passed.
- Classroom: six sizes, two actual drag placements, source-image anchors and saved coordinates.
- Evacuation: 1280x800 and 667x375 touchscreen input, collisions, three hearts, retry, all three destinations and zero runtime errors.
- City: four sizes x three locations; two sizes for notice boards, window/mask action order and wrong-answer prevention.
- Volcano: six phases, wrong answers, prerequisites and keyboard syringe operation.

Detailed local results and screenshots are retained under .work/visual-readability-20261109, .work/activity-fit-20261109, .work/classroom-geometry-20261109, .work/evacuation-game and .work/learning-flow-20261109.

## Final pre-deployment checks
- JavaScript syntax passed; 126 unit/regression tests passed.
- Reading layout: all 180 scenes passed at 667x375, 915x412, 852x806, 1024x768, 1280x800 and 1920x1080, with zero runtime errors.
- Controls/layout: 150 scenes passed across five sizes. A 6px footer overflow at 667x375 was corrected and all 30 scenes at that size were rerun successfully.
- River enlarged preview: 8/8 checks passed after the shared card replacement.
- New masked River texture is a transparent 491x480 lossless WebP matching the original character. It replaces the complete character on completion and restore, rather than overlaying an oversized mask prop.
- Production build contains 261 files and precaches 159 shell/activity/poster assets. Graphify AST graph was updated.
