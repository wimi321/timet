# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What is Timet

Timet is a multilingual, offline-first "time travel strategist" app. Users describe an era, place, identity, resources, and goal — the app responds with structured strategic advice through route frames (Fortune Line, Power Line, Fatal Mistakes, Modern Edge, Visual Clues). Every answer follows a five-part shape: Current Read → First Three Moves → Riches/Power Path → Do Not Expose → Ask Me Next.

## Prerequisites

Node.js >= 20, Dart >= 3.4. Mobile builds require Xcode (iOS) or Android Studio (Android).

## Commands

```bash
# Dev server
npm run dev

# Build (TypeScript check + Vite build)
npm run build

# Run all tests (Vitest)
npm test

# Run a single test file
npx vitest run src/lib/modelText.test.ts

# Build offline knowledge pack (must run before first dev/build)
npm run knowledge:build

# Dart backend tests
dart test

# Mobile builds
npm run mobile:ios      # Build + open Xcode
npm run mobile:android  # Build + open Android Studio
```

## Architecture

### Dual-stack: React frontend + Dart backend

- **Frontend**: React 18 + TypeScript + Vite 8. Single-page app in `src/`. The main UI lives in `src/App.tsx` (~1300 lines, monolith component managing all state via `useState`/`useRef`).
- **Backend**: Dart package in `lib/` with `pubspec.yaml`. Handles offline model runtime (LiteRT), RAG retrieval, mesh networking, storage (Isar), and resumable downloads. Structured as `lib/src/` (core logic with contract interfaces), `lib/adapters/` (platform adapters).
- **Mobile shell**: Capacitor 8 wraps the web app for iOS/Android. Config in `capacitor.config.ts`. Native platforms in `ios/` and `android/`.

### Bridge pattern

`BeaconBridge` (`src/lib/beaconBridge.ts`) is the interface between React and the inference backend. Three implementations:
- `capacitorBridge.ts` — native mobile via Capacitor plugins
- `strictBridge.ts` — web fallback that always errors (no local model available)
- `mockBridge.ts` — test/dev mock with simulated streaming

Runtime selection in `src/lib/runtime.ts`: checks `window.beaconBridge` (injected by native) → Capacitor if available → strict bridge fallback.

Streaming uses `AsyncIterable<StreamChunk>` with `delta` + optional `final` result. UI flushes every 80ms (`STREAM_UI_FLUSH_INTERVAL_MS`) to avoid thrashing.

### Inference lifecycle

App.tsx manages inference runs via an incrementing counter (`activeInferenceRunRef`). Cancelling or starting a new request increments the counter, orphaning stale async operations. Model bootstrap retries up to 3 times with 350ms backoff.

### Knowledge system

- Raw entries in `knowledge/entry_seed.json`
- Build script (`scripts/build_offline_knowledge.mjs`) compiles to **both** `src/lib/generatedKnowledge.ts` (frontend) and `lib/src/generated/generated_knowledge.dart` (backend) — never edit generated files directly
- Frontend loads knowledge via `ensureKnowledgeBaseLoaded()` (promise-based singleton)
- Knowledge cards have route hints, era ranges, regions, feasibility ratings
- Constraints: summary capped at 168 chars, steps at 104 chars

### i18n

- 20 supported languages (en, zh-CN, zh-TW, ja, ko, es, fr, de, pt, ru, ar, hi, id, it, tr, vi, th, nl, pl, uk)
- React context provider in `src/i18n/index.tsx` with `useI18n()` hook
- Translation keys in `src/i18n/messages.ts`, resolution in `src/i18n/translate.ts`
- Locale resolution: localStorage (`timet_locale`, legacy `beacon_locale`) → `navigator.languages` → English fallback
- Dynamic RTL support via `document.documentElement.dir`

### Route system

Five canonical routes defined in `src/lib/scenarioHints.ts`: wealth, power, survival, tech, visual_help. Each route has bilingual (zh/en) retrieval terms, categories, and aliases. Route aliases are NFKD-normalized + lowercased for fuzzy matching.

### State management

No state library — all state in App.tsx via `useState`. Non-render state uses refs (`modelsRef`, `activeInferenceRunRef`, `bootPromiseRef`). Session tracking in `src/lib/session.ts` (sessionId + resetContext flag for multi-turn).

### CSS

CSS variables for theming in `src/index.css`. Uses `env(safe-area-inset-*)` for notch/gesture bar and `100dvh` for mobile viewport. RTL handled inline where needed.

### Models

Default bundled model: `gemma-4-e2b` (2B params), alternate `gemma-4-e4b` (4B). Three download states: `not_downloaded` → `partially_downloaded`/`in_progress` → `succeeded`. Resumable downloads via native bridge.

### Testing

- Vitest with jsdom environment, setup in `src/test/setup.ts`
- Test setup mocks localStorage (in-memory Map) and intercepts fetch for `offline_knowledge.json`
- Dart tests in `test/` directory using `dart test`

### Key types

All core domain types in `src/lib/types.ts`: `TriageRequest`, `TriageResponse`, `BeaconMessage`, `ModelDescriptor`, `KnowledgeCard`, route hints, power modes, model tiers.
