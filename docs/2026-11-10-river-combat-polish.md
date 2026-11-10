# GeoValley river and map polish, 2026-11-10

## Map combat
- Villain artwork is half its previous size. Touch targets stay at least 48 pixels.
- Click a distant villain to approach. Once nearby, tap the villain, the attack button, J, or Space. Three hits defeat it.
- Added a generated eight-frame River attack/hurt/victory atlas, hit recoil, hit count, range feedback, and brief protection after a successful hit.
- Combat does not complete learning activities or change their unlock rules.

## River activity
- Small and large water amounts now differ clearly in jet count, thickness, splash size, ground-flow width, and transported soil.
- The sediment fan gains deterministic granular detail as it accumulates. Live views and notebook snapshots share the same renderer.
- Added separate generated photorealistic upper/lower river landscapes. The app labels them as generated educational images.
- The upper image shows a narrow, steep channel and angular boulders. The lower image shows a broad, gentle channel and a sand bar. Existing observation IDs and saved progress remain compatible.

## Verification
- 143 Node regression tests and all JavaScript syntax checks pass.
- Windows Chrome combat checks pass at 667x375, 915x412, 768x1024, 1280x800, and 1920x1080, plus collision/retry and fallback checks.
- Combat checks include nearby enemy taps, J, Space, all five defeats, save/reload, muted audio, and unchanged academic progress.
- Windows Chrome river checks pass at 1280x800 and 667x375: both water experiments, four upper/lower observations, and saved records after reload. No page errors or failed resource responses were recorded.
- Browser tests use touch emulation, not physical tablet hardware.

New image provenance is documented in public/assets/art/river-photo-v1.json and river-combat-v2.json.
