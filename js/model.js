/**
 * Browser-only Gemma 3 270M via Transformers.js (CDN).
 * WebGPU preferred, WASM fallback. Declared degraded mode if load fails.
 *
 * Pin: @huggingface/transformers@4.3.0 (ORT web 1.31.dev) — 3.5.x fails to
 * create an ORT session for this model (numeric abort e.g. 10736504) because
 * Gemma 3 + external .onnx_data weights need a newer runtime.
 */
const MODEL_ID = "onnx-community/gemma-3-270m-it-ONNX";
const TRANSFORMERS_VERSION = "4.3.0";
const CDN_URL = `https://cdn.jsdelivr.net/npm/@huggingface/transformers@${TRANSFORMERS_VERSION}/+esm`;

const ModelRunner = {
  pipeline: null,
  device: null,
  dtype: null,
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
      // Prefer single-threaded WASM; avoids some SAB/COOP flakiness.
      try {
        if (env.backends?.onnx?.wasm) {
          env.backends.onnx.wasm.numThreads = 1;
        }
      } catch (_) {
        /* ignore */
      }

      let preferWebgpu = false;
      if (typeof navigator !== "undefined" && navigator.gpu) {
        try {
          const adapter = await navigator.gpu.requestAdapter();
          preferWebgpu = !!adapter;
        } catch (_) {
          preferWebgpu = false;
        }
      }

      const progress = (info) => {
        if (typeof onProgress === "function") onProgress(info);
      };

      // webgpu: q4f16 (GatherBlockQuantized is implemented on WebGPU EP).
      // wasm: quantized/q4 fail with ERROR_CODE 9 (no GatherBlockQuantized on wasm).
      // Use fp16 (then fp32) for non-WebGPU browsers / headless.
      const attempts = preferWebgpu
        ? [
            { device: "webgpu", dtype: "q4f16" },
            { device: "wasm", dtype: "fp16" },
            { device: "wasm", dtype: "fp32" }
          ]
        : [
            { device: "wasm", dtype: "fp16" },
            { device: "wasm", dtype: "fp32" }
          ];

      let lastErr = null;
      for (const { device, dtype } of attempts) {
        try {
          progress({
            status: "fallback",
            message: `Loading Gemma (${device}/${dtype})…`
          });
          this.pipeline = await pipeline("text-generation", MODEL_ID, {
            device,
            dtype,
            progress_callback: progress
          });
          this.device = device;
          this.dtype = dtype;
          lastErr = null;
          break;
        } catch (err) {
          lastErr = err;
          this.pipeline = null;
          progress({
            status: "fallback",
            message: `${device}/${dtype} failed: ${(err && err.message) || err}`
          });
        }
      }
      if (!this.pipeline) throw lastErr || new Error("All device/dtype attempts failed");

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
    // Line lists beat JSON for Gemma 3 270M (JSON truncates / loops).
    return [
      {
        role: "system",
        content:
          "You suggest safe outdoor micro-activities. " +
          "Reply with EXACTLY 3 short lines, numbered 1-3. One concrete outdoor task per line. " +
          "Each line under 100 characters. No JSON, no markdown fences, no extra commentary. " +
          "No phones, apps, swimming, cliffs, strangers, trespassing, or alone-at-night."
      },
      {
        role: "user",
        content: "Example: time=20 energy=low company=solo weather=clear"
      },
      {
        role: "assistant",
        content:
          "1. Walk one quiet block and notice five different leaf shapes\n" +
          "2. Sit on a park bench and count ten slow breaths\n" +
          "3. Stretch gently on your doorstep facing a tree"
      },
      {
        role: "user",
        content:
          `Now create 3 for: time=${prefs.time} minutes, energy=${prefs.energy}, ` +
          `company=${prefs.company}, weather=${prefs.weather}. Keep them local and doable.`
      }
    ];
  },

  extractAssistantText(out) {
    const last = out?.[0]?.generated_text;
    if (Array.isArray(last)) {
      // Chat template: messages array; prefer last assistant turn.
      const assistant = [...last].reverse().find((m) => m && m.role === "assistant");
      if (assistant && assistant.content != null) return String(assistant.content);
      const tail = last.at?.(-1);
      if (tail && tail.content != null) return String(tail.content);
      return JSON.stringify(last);
    }
    if (typeof last === "string") return last;
    if (last && typeof last === "object" && last.content != null) return String(last.content);
    return String(last ?? "");
  },

  async generate(prefs, onProgress) {
    if (this.status !== "ready" || !this.pipeline) {
      await this.load(onProgress);
    }
    const messages = this.buildPrompt(prefs);
    const out = await this.pipeline(messages, {
      max_new_tokens: 140,
      do_sample: false,
      repetition_penalty: 1.1
    });
    return this.extractAssistantText(out);
  }
};

if (typeof window !== "undefined") {
  window.ModelRunner = ModelRunner;
  window.GRASS_MODEL_ID = MODEL_ID;
  window.GRASS_TRANSFORMERS_VERSION = TRANSFORMERS_VERSION;
}
