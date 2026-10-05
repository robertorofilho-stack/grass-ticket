# Grass Ticket

**Touch grass with an open-weight model in your browser.**

Grass Ticket is a tiny static web app for the [Hacktoberfest 2026 Week 1: Touch Grass](https://dev.to/challenges/hacktoberfest-week1-2026-10-05) challenge. You pick a few preferences (time, energy, company, weather). **Gemma 3 270M Instruct** (ONNX, via [Transformers.js](https://huggingface.co/docs/transformers.js)) runs **entirely in the browser** and mints a “ticket” with three concrete outdoor tasks. Then the UI drops into a minimal dark timer so the screen becomes the shortest part of the experience.

When you come back, you check off what you did and see a plain ratio such as **“2 min on screen, 38 min outside.”** History stays in `localStorage` only.

## Why open-weight? Why open innovation?

- **No account, no server round-trip for inference.** Preferences never leave your device for model hosting.
- **No location permission.** The model (and the offline bank) work with coarse weather you type yourself.
- **Swap and inspect.** The model id is `onnx-community/gemma-3-270m-it-ONNX`. You can change dtype/device or replace the bank without asking a vendor.
- **Degraded mode is honest.** If WebGPU/WASM cannot load the weights, the app says so and still works from a **40+** curated offline task bank plus deterministic safety filters.
- Closed APIs would push outdoor suggestions through someone else’s GPU and logging. Here the open pieces *are* the product: local weights + open guardrails + open UI.

## Features

- Browser inference: WebGPU when available, WASM fallback
- Deterministic JSON parse + safety filter (blocks traffic stunts, deep water, heights, strangers, trespassing, alone-at-night, and screen-centric tasks)
- Offline task bank (≥40) fills gaps or replaces unsafe model output
- Minimal outdoor timer (no flashy animation)
- Screen vs outside time summary
- Local-only history

## Run locally

No build step. Any static server works (ES modules for Transformers.js need HTTP, not `file://`).

```bash
cd grass-ticket
npx --yes serve .
# or
python3 -m http.server 8080
```

Open the printed URL (e.g. `http://localhost:3000` or `http://localhost:8080`).

First model download can take several minutes depending on network. Use **“Skip model — use offline bank”** if you only want the degraded path.

## Tests

Zero npm dependencies for tests. From the project root:

```bash
node --test
```

## Deploy (GitHub Pages)

A workflow in `.github/workflows/pages.yml` publishes this folder to GitHub Pages when you push to `main` (after you add a remote yourself). This repo ships **without** a remote on purpose during local construction.

## Privacy

- No analytics, no accounts, no geolocation API
- Model weights download from Hugging Face / CDN into the browser cache
- Ticket history: `localStorage` key `grassTicketHistory` on your machine only

## Honest limitations

- Gemma 3 270M is small; JSON can be messy — that is why the validator and offline bank exist
- Headless / no-GPU environments often cannot run the model; offline mode is expected there
- Safety filters are regex-based heuristics, not a proof of safety — use judgment outdoors
- Not medical, fitness, or legal advice

## License

MIT © `<APELIDO>`

## Credits

- [Gemma 3](https://huggingface.co/google/gemma-3-270m-it) — Google DeepMind
- [onnx-community/gemma-3-270m-it-ONNX](https://huggingface.co/onnx-community/gemma-3-270m-it-ONNX)
- [Transformers.js](https://github.com/huggingface/transformers.js)
