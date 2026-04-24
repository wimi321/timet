# Changelog

All notable changes to Timet will be documented in this file.

## v0.3.0 - 2026-04-24

Brand identity and install-experience polish.

### Brand Assets

- Added a new AI-generated Timet icon system based on an astrolabe, compass, and hourglass motif
- Rebuilt favicons, PWA icons, Android launcher icons, and iOS app icon from the same master artwork
- Added maskable PWA icons for better Android home-screen installation

### Launch And Presentation

- Replaced inherited white/fire splash screens with dark atlas-style Timet launch screens
- Added a polished README hero image and social preview card
- Updated Open Graph and Twitter metadata to use the new social card
- Added the Timet mark to the in-app navigation and home hero

### Native Identity

- Updated the public Android application id, Capacitor app id, and iOS bundle identifier to `com.wimi321.timet`
- Bumped package, Android, and iOS versions to v0.3.0

## v0.2.1 - 2026-04-24

Web preview and release polish for the public project.

### Web Preview

- Added a browser knowledge bridge so the Web app can answer immediately without native Gemma setup
- Kept the Web preview fully local by using the bundled route knowledge pack instead of a server fallback
- Added tests for the browser route model, diagnostics, and English historical prompt handling

### Documentation

- Updated README and Chinese README to explain the Web preview plus native Gemma 4 split accurately
- Updated the architecture diagram to show `browserKnowledgeBridge.ts`
- Aligned the APK badge, changelog, and release narrative with v0.2.1

### Version

- Bumped package, Dart, Android, and iOS versions to v0.2.1

## v0.2.0 - 2026-04-19

Comprehensive UX polish, accessibility improvements, and full i18n expansion.

### UX Polish

- Upgraded chat input from single-line `<input>` to auto-resizing `<textarea>` (up to 5 lines, Enter to send, Shift+Enter for newline)
- Added CSS animations: staggered card entrance, message slide-in, modal slide-up, streaming shimmer pulse
- Added visual download progress bar alongside percentage text in model panel
- Added copy and share buttons on every AI response
- Added confirmation dialog before clearing conversation (prevents accidental data loss)
- Added haptic feedback on native devices for key interactions
- Smart status badge: hides when idle to reduce visual noise

### Accessibility

- Model panel now has proper focus trap (Tab/Shift+Tab cycling, ESC to close)
- Added ARIA `dialog` role and `aria-modal` on model panel
- Added `aria-live` region to announce streaming state to screen readers
- Chat area marked with `role="log"` for assistive technology

### i18n

- Trimmed language list from 20 to 8 fully supported languages
- Added complete translations (~80 keys each) for Japanese, Korean, Spanish, French, and German
- All translations maintain the "time-travel strategist" thematic voice

### Code Quality

- Refactored `App.tsx` from 1308 lines to ~550 lines by extracting 6 focused components + helpers module
- Extracted components: HeroPanel, RouteGrid, ChatMessages, ChatInputBar, ModelPanel, ConfirmDialog
- Extracted pure helpers to `src/lib/appHelpers.ts`
- Added `useHaptics` hook for native tactile feedback
- Zero new npm dependencies

### Version

- Bumped to v0.2.0 across package.json, Android build.gradle, and iOS project

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
