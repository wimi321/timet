# Timet Knowledge Pack

Timet V1 uses a curated offline knowledge pack instead of a generic retrieval bundle.

## Current Packs

- `Mercantile Ladders`
- `Court and Patronage Ladders`
- `Treaty Port Acceleration Playbooks`
- `Arrival Survival Protocols`
- `Modern Edge Methods`
- `Visual Clue Recognition`

## Card Shape

Each card is expected to carry more than title + summary. Useful fields include:

- `pack`
- `route`
- `region`
- `eraLabel`
- `socialFit`
- `startingResources`
- `firstMoves`
- `payoff`
- `fatalMistakes`
- `coverStory`
- `feasibility`

## Curation Rules

- Prefer strategies that become plausible with the stated identity and starting resources.
- Prefer repeatable edges over one-shot miracle plays.
- Blend modern knowledge only when the era can actually absorb it.
- Include the likely way to hide competence so the user does not sound supernatural.
- Keep Chinese and English cards roughly equivalent in route coverage.

## Build Flow

Knowledge source edits should happen in:

- `knowledge/source_manifest.json`
- `knowledge/entry_seed.json`

Then regenerate with:

```bash
npm run knowledge:build
```

Generated outputs are committed so the app can stay offline-first.
