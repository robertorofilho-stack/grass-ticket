# 🌿 Grass Ticket

**Your ticket out the door.** Pick a few prefs. An open-weight Gemma model, running in this browser tab, mints three outdoor tasks. Then the screen goes quiet on purpose.

Built by **Alfa Labs** for the [Hacktoberfest Open-Source AI Challenge, Week 1: Touch Grass](https://dev.to/challenges/hacktoberfest-week1-2026-10-05) on DEV.

**Demo:** https://robertorofilho-stack.github.io/grass-ticket/  
**Repo:** https://github.com/robertorofilho-stack/grass-ticket

## Why

Most “go outside” apps want you to keep looking at them: maps, streaks, feeds. Grass Ticket tries to be the shortest part of your walk. You spend a moment on prefs, get a ticket with three concrete outdoor tasks, and the UI drops into a dark, boring timer. When you come back, you check off what you did and see a plain ratio such as **“2 min on screen, 38 min outside.”** History stays in `localStorage` only.

## How it works

1. You pick time (10 / 20 / 40 minutes), energy, company, and rough weather. **No location** is asked for or sent anywhere.
2. **Gemma 3 270M Instruct** (q4 ONNX, [`onnx-community/gemma-3-270m-it-ONNX`](https://huggingface.co/onnx-community/gemma-3-270m-it-ONNX)) runs in the page through [Transformers.js](https://huggingface.co/docs/transformers.js) — **WebGPU** when available, **WASM** otherwise. After the first download the weights are cached by the browser.
3. A plain-code checker in [`js/validator.js`](js/validator.js) reads every model reply before you see it: JSON parse, exactly three tasks, and filters that block traffic stunts, deep water, heights, strangers, trespassing, alone-at-night, and screen/phone tasks. Bad lines are swapped from a curated offline bank (40+ tasks in [`js/tasks.js`](js/tasks.js)).
4. **I'm going** opens a minimal dark timer. **I'm back** lets you check off tasks and shows screen vs outside time.
5. Prefer not to wait for the model? **Skip model** uses the offline bank immediately. Degraded mode is a first-class path, not a crash.

## Run locally

Static site — no build step. Serve over HTTP (ES modules / CDN imports need it; `file://` will not work).

```bash
cd grass-ticket
python3 -m http.server 8080
# or
npx --yes serve .
```

Open the printed URL (e.g. `http://localhost:8080`).

First model download can take a while depending on network. Use **Skip model** for the offline path.

## Tests

Zero npm dependencies for tests. From the project root:

```bash
node --test
```

Covers the offline bank, JSON parse/normalize, safety and screen filters, fallback/repair, and screen-vs-outside time math (`tests/guardrails.test.js`).

## Deploy (GitHub Pages)

A workflow in [`.github/workflows/pages.yml`](.github/workflows/pages.yml) publishes this folder to GitHub Pages on push to `main`. Paths are relative so the app works under `/grass-ticket/`.

## Privacy

- No analytics, no accounts, no geolocation API
- Model weights download from Hugging Face / CDN into the browser cache; Transformers.js loads from jsDelivr
- Ticket history: `localStorage` key `grassTicketHistory` on your machine only
- Preferences never leave the device for a server-side inference API — there isn’t one

## Honest limitations

- Gemma 3 270M is small; JSON can be messy — that is why the validator and offline bank exist
- Headless / no-GPU environments often cannot run the model; offline mode is expected there
- Safety filters are regex-based heuristics, not a promise of perfect safety — use judgment outdoors
- Not health, fitness, or legal advice

## Files

| File | What |
|---|---|
| `index.html`, `css/style.css` | Single page UI |
| `js/app.js` | Views, timer, history, badge/status |
| `js/model.js` | Transformers.js load + Gemma generate (WebGPU → WASM) |
| `js/validator.js` | JSON extract, danger/screen filters, ensure-three-tasks |
| `js/tasks.js` | Offline task bank (40+) and ticket picker |
| `js/time.js` | Duration format + screen/outside ratio + history |
| `tests/guardrails.test.js` | Node test suite |

## Credits

- [Gemma 3](https://ai.google.dev/gemma) by Google DeepMind · ONNX build [`onnx-community/gemma-3-270m-it-ONNX`](https://huggingface.co/onnx-community/gemma-3-270m-it-ONNX). Use is subject to the [Gemma Terms of Use](https://ai.google.dev/gemma/terms).
- [Transformers.js](https://github.com/huggingface/transformers.js) by Hugging Face
- Built with AI assistance; safety rules, tests, and product decisions were reviewed before publishing

## License

MIT © Alfa Labs — see [LICENSE](LICENSE).
