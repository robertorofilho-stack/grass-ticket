/* global Tasks, Validator, TimeCalc, ModelRunner */

const $ = (sel) => document.querySelector(sel);
const views = {
  form: $("#view-form"),
  ticket: $("#view-ticket"),
  timer: $("#view-timer"),
  return: $("#view-return"),
  history: $("#view-history")
};

const state = {
  prefs: null,
  ticket: null,
  screenStarted: 0,
  screenMs: 0,
  outdoorStarted: 0,
  timerInterval: null,
  mode: "offline"
};

function show(name) {
  Object.entries(views).forEach(([k, el]) => {
    if (el) el.classList.toggle("hidden", k !== name);
  });
  document.body.classList.toggle("dark-mode", name === "timer");
}

function setBadge(mode, detail) {
  const el = $("#mode-badge");
  if (!el) return;
  el.classList.toggle("degraded", mode !== "gemma");
  if (mode === "gemma") {
    el.textContent = `Gemma 3 270M · ${detail || "browser"}`;
  } else if (mode === "loading") {
    el.textContent = "Loading open-weight model…";
  } else {
    el.textContent = `Offline bank · ${detail || "degraded mode"}`;
  }
}

function readPrefs() {
  return {
    time: Number($("#pref-time").value),
    energy: $("#pref-energy").value,
    company: $("#pref-company").value,
    weather: $("#pref-weather").value
  };
}

function renderTicket(ticket) {
  $("#ticket-title").textContent = ticket.title || "Your Grass Ticket";
  const list = $("#ticket-tasks");
  list.innerHTML = "";
  ticket.tasks.forEach((t, i) => {
    const div = document.createElement("div");
    div.className = "ticket-task";
    div.innerHTML = `<h3>${i + 1}. ${escapeHtml(t.title)}</h3><p>${escapeHtml(t.text)}</p>`;
    list.appendChild(div);
  });
  $("#ticket-meta").textContent =
    `${ticket.minutes} min window · source: ${ticket.source || "unknown"}` +
    (ticket.replaced ? ` · ${ticket.replaced} suggestion(s) replaced by safety filter` : "");
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function startScreenClock() {
  state.screenStarted = Date.now();
}

function pauseScreenClock() {
  if (state.screenStarted) {
    state.screenMs += Date.now() - state.screenStarted;
    state.screenStarted = 0;
  }
}

async function onGenerate() {
  const btn = $("#btn-generate");
  const status = $("#status");
  btn.disabled = true;
  state.prefs = readPrefs();
  startScreenClock();
  status.textContent = "Preparing ticket…";

  let rawText = null;
  let usedModel = false;

  if (ModelRunner.status === "ready" || ModelRunner.status === "idle" || ModelRunner.status === "loading") {
    try {
      setBadge("loading");
      status.textContent = "Running Gemma 3 270M in your browser (first load may take a while)…";
      rawText = await ModelRunner.generate(state.prefs, (info) => {
        if (info && info.progress != null) {
          const p = Number(info.progress);
          const pct = p > 1 ? Math.round(p) : Math.round(p * 100);
          status.textContent = `Downloading model… ${Math.min(100, Math.max(0, pct))}%`;
        } else if (info && info.message) {
          status.textContent = info.message;
        }
      });
      usedModel = true;
      state.mode = "gemma";
      setBadge("gemma", ModelRunner.device);
    } catch (err) {
      status.textContent = `Model unavailable (${err.message || err}). Using offline bank.`;
      state.mode = "offline";
      setBadge("offline", "model failed to load");
    }
  }

  let result;
  if (usedModel && rawText) {
    result = Validator.validateAndGuard(rawText, state.prefs);
  } else {
    const offline = Tasks.pickOfflineTicket(state.prefs, 3);
    result = { ok: true, reason: "offline", ticket: offline };
    state.mode = "offline";
    setBadge("offline", "declared degraded mode");
  }

  state.ticket = result.ticket;
  renderTicket(state.ticket);
  show("ticket");
  status.textContent = "";
  btn.disabled = false;
}

function onStartOutside() {
  pauseScreenClock();
  state.outdoorStarted = Date.now();
  show("timer");
  const display = $("#timer-display");
  const tick = () => {
    const elapsed = Date.now() - state.outdoorStarted;
    display.textContent = TimeCalc.formatDuration(elapsed);
  };
  tick();
  clearInterval(state.timerInterval);
  state.timerInterval = setInterval(tick, 1000);
}

function onImBack() {
  clearInterval(state.timerInterval);
  startScreenClock();
  const outdoorMs = Date.now() - state.outdoorStarted;
  const checks = $("#return-checks");
  checks.innerHTML = "";
  state.ticket.tasks.forEach((t, i) => {
    const id = `done-${i}`;
    const label = document.createElement("label");
    label.innerHTML = `<input type="checkbox" id="${id}" /> <span><strong>${escapeHtml(t.title)}</strong> — ${escapeHtml(t.text)}</span>`;
    checks.appendChild(label);
  });
  state._outdoorMs = outdoorMs;
  show("return");
}

function onFinishReturn() {
  pauseScreenClock();
  const done = state.ticket.tasks.map((_, i) => !!document.querySelector(`#done-${i}`)?.checked);
  const ratio = TimeCalc.screenOutdoorRatio(state.screenMs, state._outdoorMs || 0);
  $("#ratio-text").textContent = ratio.summary;
  $("#ratio-detail").textContent = `${ratio.outdoorPct}% of tracked time was outside.`;

  TimeCalc.saveHistory({
    at: new Date().toISOString(),
    prefs: state.prefs,
    ticket: state.ticket,
    done,
    ratio
  });

  showHistory();
  // keep return view visible with ratio
  $("#ratio-box").classList.remove("hidden");
}

function showHistory() {
  const box = $("#history-list");
  if (!box) return;
  const list = TimeCalc.loadHistory();
  box.innerHTML = list.length
    ? list
        .slice(0, 8)
        .map(
          (h) =>
            `<div class="history-item">${escapeHtml(h.at?.slice(0, 16) || "")} · ${escapeHtml(
              h.ratio?.summary || ""
            )}</div>`
        )
        .join("")
    : "<div class='history-item'>No tickets yet.</div>";
}

function onSkipModel() {
  ModelRunner.status = "degraded";
  setBadge("offline", "skipped model load");
  const status = $("#status");
  if (status) status.textContent = "Using offline bank (model skipped).";
}

async function tryPreload() {
  setBadge("loading");
  try {
    await ModelRunner.load((info) => {
      const status = $("#status");
      if (status && info && info.progress != null) {
        const p = Number(info.progress);
        const pct = p > 1 ? Math.round(p) : Math.round(p * 100);
        status.textContent = `Loading Gemma… ${Math.min(100, Math.max(0, pct))}%`;
      }
    });
    setBadge("gemma", ModelRunner.device);
    $("#status").textContent = "Model ready in-browser.";
  } catch (err) {
    setBadge("offline", "degraded — offline bank active");
    $("#status").textContent =
      "Open-weight model did not load. App works with the offline task bank.";
  }
}

function init() {
  $("#btn-generate").addEventListener("click", onGenerate);
  $("#btn-start").addEventListener("click", onStartOutside);
  $("#btn-back").addEventListener("click", onImBack);
  $("#btn-finish").addEventListener("click", onFinishReturn);
  $("#btn-again").addEventListener("click", () => {
    state.screenMs = 0;
    state.screenStarted = 0;
    $("#ratio-box").classList.add("hidden");
    show("form");
    startScreenClock();
  });
  $("#btn-skip-model")?.addEventListener("click", onSkipModel);
  showHistory();
  show("form");
  startScreenClock();
  // Preload in background; UI usable immediately via offline
  tryPreload();
}

document.addEventListener("DOMContentLoaded", init);
