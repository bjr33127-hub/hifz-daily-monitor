# Hifz Daily Monitor

French version: [README.md](README.md)

Local daily monitoring app for hifz.

It does not try to teach for you. It simply calculates what must be recited today from the current program position, in this strict order:

1. `Old`
2. `Consolidation`
3. `Recent`
4. `Yesterday`
5. `New`

The `New` block contains `3 waves`, with `3 checks` per wave.

## Required inputs

- `Current page`
- `Current half`
- `New / day (in half-pages)`
- `Program day`
- `Total half-pages`
- `Language`: French or English

## What the app shows

- today's `Old` block, with automatic rotation across `7 parts`
- `J-8 -> J-30` consolidation, split into `3 parts`
- the `J-1 -> J-7` recent block
- the `Yesterday` block (`J-1`)
- today's `New` block with its `9 checks`
- a compact Quran page map with program markers and error tracking

## Screenshots

### Today View

![Today View](docs/screenshots-en/today-view-en.png)

### Pages View

![Pages View](docs/screenshots-en/pages-view-en.png)

### Settings View

![Settings View](docs/screenshots-en/settings-view-en.png)

## Run the app

```powershell
node src/server.js
```

Then open [http://127.0.0.1:3100](http://127.0.0.1:3100).

## Storage

Local state is stored in:

- `data/state.json`

There is no SQL database and no external engine: just a strict, local, readable daily monitoring board.
