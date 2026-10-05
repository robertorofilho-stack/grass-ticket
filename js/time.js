/**
 * Screen vs outdoor time accounting.
 */

function parseMs(value) {
  const n = Number(value);
  return Number.isFinite(n) && n >= 0 ? n : 0;
}

function formatDuration(ms) {
  const totalSec = Math.max(0, Math.round(parseMs(ms) / 1000));
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0 && s > 0) return `${m} min ${s}s`;
  if (m > 0) return `${m} min`;
  return `${s}s`;
}

function formatMinutesRounded(ms) {
  const mins = Math.max(0, Math.round(parseMs(ms) / 60000));
  return mins;
}

/**
 * Build a human summary like "2 min de tela, 38 min fora"
 * Language-agnostic English default for the app UI.
 */
function screenOutdoorRatio(screenMs, outdoorMs) {
  const screenMin = formatMinutesRounded(screenMs);
  const outdoorMin = formatMinutesRounded(outdoorMs);
  const total = screenMin + outdoorMin;
  const outdoorPct = total === 0 ? 0 : Math.round((outdoorMin / total) * 100);
  return {
    screenMs: parseMs(screenMs),
    outdoorMs: parseMs(outdoorMs),
    screenMin,
    outdoorMin,
    outdoorPct,
    summary: `${screenMin} min on screen, ${outdoorMin} min outside`
  };
}

function computeOutdoorFromTimer(startedAt, endedAt, screenMs) {
  const start = parseMs(startedAt);
  const end = parseMs(endedAt);
  if (!start || !end || end < start) {
    return screenOutdoorRatio(screenMs, 0);
  }
  const elapsed = end - start;
  const outdoor = Math.max(0, elapsed - parseMs(screenMs));
  return screenOutdoorRatio(screenMs, outdoor);
}

function saveHistory(entry, storage) {
  const store = storage || (typeof localStorage !== "undefined" ? localStorage : null);
  if (!store) return [];
  let list = [];
  try {
    list = JSON.parse(store.getItem("grassTicketHistory") || "[]");
  } catch (_) {
    list = [];
  }
  if (!Array.isArray(list)) list = [];
  list.unshift(entry);
  list = list.slice(0, 50);
  store.setItem("grassTicketHistory", JSON.stringify(list));
  return list;
}

function loadHistory(storage) {
  const store = storage || (typeof localStorage !== "undefined" ? localStorage : null);
  if (!store) return [];
  try {
    const list = JSON.parse(store.getItem("grassTicketHistory") || "[]");
    return Array.isArray(list) ? list : [];
  } catch (_) {
    return [];
  }
}

const TimeCalc = {
  parseMs,
  formatDuration,
  formatMinutesRounded,
  screenOutdoorRatio,
  computeOutdoorFromTimer,
  saveHistory,
  loadHistory
};

if (typeof module !== "undefined" && module.exports) {
  module.exports = TimeCalc;
} else if (typeof window !== "undefined") {
  window.TimeCalc = TimeCalc;
}
