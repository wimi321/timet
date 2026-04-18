# Contributing to Timet

Thanks for helping improve Timet.

## Before You Open A PR

- Search existing issues first to avoid duplicate work.
- Prefer small, focused pull requests over broad refactors.
- Include screenshots or screen recordings for UI changes.
- Include device model, OS version, and reproduction steps for runtime bugs.

## Local Setup

```bash
npm install
npm run knowledge:build
npm test
npm run build
```

If you are working on the mobile shells:

```bash
npm run mobile:build
```

## Pull Request Checklist

- Keep the product centered on time-travel strategy Q&A, not generic emergency tooling.
- Do not add fake AI fallback behavior.
- Preserve offline-first behavior when the network is unavailable.
- Add or update tests when changing prompt composition, routing, retrieval, session memory, or UI flow.
- Keep answers usable for historical or fictional contexts, not framed as real-world harm tutorials.

## Knowledge Pack Contributions

- Prefer historically grounded, redistributable sources and clearly curated summaries.
- Respect licensing and redistribution terms for every source.
- Add new sources through the manifest and build scripts rather than hand-editing generated bundles.
- Make route cards executable: first moves, payoff, fatal mistakes, and cover story matter more than lore dumps.

## Security-Sensitive Changes

If your change touches model packaging, native bridges, permissions, or safety boundaries, open the PR with extra detail so it can be reviewed carefully.
