# Changelog

All notable changes to Timet will be documented in this file.

## v0.1.1 - 2026-04-18

First Timet repository release, rebuilt from the Beacon shell into a time-travel strategy app.

### Highlights

- Rebranded the product as `穿越助手 / Timet`
- Replaced the emergency-first home screen with strategist-style route entry points
- Removed the bottom `SOS` primary action from the main experience
- Added multilingual Timet copy for Chinese and English-first usage

### Product

- Switched the core interaction to simple Q&A with user-supplied era, place, identity, resources, and goal
- Added four main routes: `Fortune Line`, `Power Line`, `Fatal Mistakes`, and `Modern Edge`
- Added visual clue scanning as a supporting workflow
- Fixed the answer shape to five sections for consistent strategist replies

### Knowledge

- Replaced the emergency knowledge pack with curated time-travel strategy content
- Added route metadata such as region, era label, social fit, first moves, payoff, fatal mistakes, and cover story
- Tuned retrieval to prefer wealth-first plans unless the user explicitly asks for power

### Shell And Brand

- Unified app, web, manifest, and README branding around `穿越助手 / Timet`
- Preserved the offline local-model shell and native bridge foundation from the original Beacon project
- Added a shared brand constant for app title handling

### Verification

- `npm test`
- `npm run build`
