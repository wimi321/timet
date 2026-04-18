# 穿越助手 / Timet

<p align="center">
  <strong>A time-travel strategy assistant for people who just woke up in the wrong century.</strong>
</p>

<p align="center">
  Timet is a multilingual, offline-first strategy app built on top of the original Beacon shell, but reimagined for time travelers.
  You describe the era, place, identity, resources, and goal.
  Timet answers like a ruthless strategist with routes for wealth, power, survival, and practical modern-edge playbooks.
</p>

## Brand

- Chinese name: `穿越助手`
- Short app name: `Timet`
- Full display brand: `穿越助手 / Timet`
- English subtitle: `A time-travel strategy assistant`

## Product Shape

- Simple Q&A only
- No era picker
- No automatic era detection
- No progression tree
- The user writes the context directly in the prompt

Prompt formula:

`era + place + identity + resources + goal`

Examples:

- `Northern Song Kaifeng, literate, little silver, how do I make my first fortune in 90 days?`
- `Late Qing treaty port, small trader, how do I gain wealth and influence fast?`
- `I just arrived in an unfamiliar medieval city. What must I hide first?`

## Main Routes

- `Fortune Line`
- `Power Line`
- `Fatal Mistakes`
- `Modern Edge`
- `Visual Clues`

## Knowledge Pack

Timet V1 ships with a curated offline knowledge pack built around:

- merchant ladders
- court and patronage ladders
- arrival survival protocols
- practical modern-edge methods
- treaty-port acceleration
- visual clue recognition for coin, script, seal, garment, and artifact details

The response format is fixed to five sections:

1. `Current Read`
2. `First Three Moves`
3. `Riches / Power Path`
4. `Do Not Expose`
5. `Ask Me Next`

## Stack

- React + Vite frontend
- Capacitor mobile shell
- Local model bridge support from the original Beacon project
- Offline knowledge bundle generated from `knowledge/source_manifest.json` and `knowledge/entry_seed.json`

## Docs

- [Route Design](./docs/ROUTES.md)
- [Knowledge Pack Notes](./docs/KNOWLEDGE_PACK.md)

## Development

```bash
npm install
npm run knowledge:build
npm test
npm run build
```

## Notes

- GitHub: [wimi321/timet](https://github.com/wimi321/timet)
- The original Beacon repository is not modified by this project.
- This repo is a separate copy in `/Users/haoc/Developer/timet`.
- The inherited local Beacon remote has been renamed to `beacon-local`.
- `origin` now points to the published Timet repository.
