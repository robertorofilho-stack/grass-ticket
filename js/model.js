/**
 * Browser-only Gemma 3 270M via Transformers.js (CDN).
 * WebGPU preferred, WASM fallback. Declared degraded mode if load fails.
 */
const MODEL_ID = "onnx-community/gemma-3-270m-it-ONNX";
const CDN_URL = "https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.5.1";

const ModelRunner = {
  pipeline: null,
  device: null,
  status: "idle", // idle | loading | ready | degraded
  error: null,

  async load(onProgress) {
    if (this.status === "ready" && this.pipeline) return this.pipeline;
    this.status = "loading";
    this.error = null;
    try {
      const { pipeline, env } = await import(/* webpackIgnore: true */ CDN_URL);
      env.allowLocalModels = false;
      env.useBrowserCache = true;

      let device = "wasm";
      let dtype = "q4";
      if (typeof navigator !== "undefined" && navigator.gpu) {
        try {
          const adapter = await navigator.gpu.requestAdapter();
          if (adapter) {
            device = "webgpu";
            dtype = "q4";
          }
        } catch (_) {
          device = "wasm";
        }
      }

      const progress = (info) => {
        if (typeof onProgress === "function") onProgress(info);
      };

      try {
        this.pipeline = await pipeline("text-generation", MODEL_ID, {
          device,
          dtype,
          progress_callback: progress
        });
        this.device = device;
      } catch (webgpuErr) {
        if (device === "webgpu") {
          progress({ status: "fallback", message: "WebGPU failed, trying WASM…" });
          this.pipeline = await pipeline("text-generation", MODEL_ID, {
            device: "wasm",
            dtype: "q4",
            progress_callback: progress
          });
          this.device = "wasm";
        } else {
          throw webgpuErr;
        }
      }
      this.status = "ready";
      return this.pipeline;
    } catch (err) {
      this.status = "degraded";
      this.error = err && err.message ? err.message : String(err);
      this.pipeline = null;
      throw err;
    }
  },

  buildPrompt(prefs) {
    return [
      {
        role: "system",
        content:
          "You help people leave screens and do safe outdoor activities. " +
          "Reply with ONLY a JSON object, no markdown. Schema: " +
          '{"title":"string","minutes":number,"tasks":[{"title":"string","text":"string","minutes":number},' +
          '{"title":"string","text":"string","minutes":number},{"title":"string","text":"string","minutes":number}]}. ' +
          "Exactly 3 concrete outdoor tasks. No phones, apps, photos, traffic stunts, swimming, cliffs, strangers, trespassing, or alone-at-night."
      },
      {
        role: "user",
        content:
          `Create a Grass Ticket for: time=${prefs.time} minutes, energy=${prefs.energy}, ` +
          `company=${prefs.company}, weather=${prefs.weather}. Tasks must fit the time budget together.`
      }
    ];
  },

  async generate(prefs, onProgress) {
    if (this.status !== "ready" || !this.pipeline) {
      await this.load(onProgress);
    }
    const messages = this.buildPrompt(prefs);
    const out = await this.pipeline(messages, {
      max_new_tokens: 256,
      temperature: 0.7,
      do_sample: true
    });
    const last = out[0].generated_text;
    if (Array.isArray(last)) {
      const assistant = last.filter((m) => m.role === "assistant").pop();
      return assistant ? assistant.content : JSON.stringify(last);
    }
    if (typeof last === "string") return last;
    return String(last);
  }
};

if (typeof window !== "undefined") {
  window.ModelRunner = ModelRunner;
  window.GRASS_MODEL_ID = MODEL_ID;
}
