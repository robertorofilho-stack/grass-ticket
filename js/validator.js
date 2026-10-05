/**
 * Deterministic guardrails: parse model JSON, block unsafe / screen tasks,
 * fill from offline bank when needed.
 */

function getTasksApi() {
  if (typeof Tasks !== "undefined") return Tasks;
  if (typeof require !== "undefined") return require("./tasks.js");
  throw new Error("Tasks module not available");
}

const DANGEROUS_PATTERNS = [
  /\b(highway|freeway|interstate|busy road|cross(ing)? (the )?street in traffic)\b/i,
  /\b(swim|swimming|deep water|ocean swim|lake swim|river swim|cliff jump|dive into)\b/i,
  /\b(climb (a |the )?(roof|cliff|tower|crane|scaffolding)|rappel|bungee)\b/i,
  /\b(hitchhik|stranger|meet (a |someone )?online|go alone (at|after) (night|dark)|after dark alone)\b/i,
  /\b(trespass|private property|break into|jump (a |the )?fence|sneak into)\b/i,
  /\b(night (hike|run|walk) alone|alone at night|after midnight)\b/i,
  /\b(firework|explosive|firearm|gun|knife fight)\b/i,
  /\b(abandoned (building|house|factory)|urban explor)/i
];

const SCREEN_PATTERNS = [
  /\b(scroll(ing)? (on )?(your )?(phone|instagram|tiktok)|instagram|tiktok|youtube|netflix|streaming)\b/i,
  /\b(video call|facetime|zoom meeting|check (your )?email|open (an? )?app)\b/i,
  /\b(play (a )?mobile game|gaming session|watch (a )?movie on)\b/i,
  /\b(qr code|screen time|laptop outdoors to work)\b/i,
  /\b(take \d+ (photos|pictures|selfies)|photo dump|content creat)/i,
  /\b(use (your )?(phone|smartphone) to|on your (phone|smartphone))\b/i
];

function isNegatedScreenMention(blob) {
  return /\b(no|not|without|leave|avoid) (your )?(phone|smartphone|photos?|camera|screen)/i.test(blob)
    || /\b(phones? stay|phone(-| )free|not a phone)\b/i.test(blob);
}

function extractJsonObject(text) {
  if (!text || typeof text !== "string") return null;
  const trimmed = text.trim();
  try {
    return JSON.parse(trimmed);
  } catch (_) {
    /* continue */
  }
  const fence = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fence) {
    try {
      return JSON.parse(fence[1].trim());
    } catch (_) {
      /* continue */
    }
  }
  const start = trimmed.indexOf("{");
  const end = trimmed.lastIndexOf("}");
  if (start >= 0 && end > start) {
    try {
      return JSON.parse(trimmed.slice(start, end + 1));
    } catch (_) {
      return null;
    }
  }
  return null;
}

function normalizeTicket(raw, prefs) {
  if (!raw || typeof raw !== "object") return null;
  const minutes = Number(raw.minutes) || Number(prefs && prefs.time) || 20;
  let tasks = raw.tasks;
  if (!Array.isArray(tasks) && Array.isArray(raw.activities)) tasks = raw.activities;
  if (!Array.isArray(tasks)) return null;
  const normalized = tasks
    .map((t) => {
      if (typeof t === "string") {
        return { title: t.slice(0, 60), text: t, minutes: Math.min(minutes, 20) };
      }
      if (!t || typeof t !== "object") return null;
      const text = String(t.text || t.description || t.task || "").trim();
      const title = String(t.title || t.name || text.slice(0, 48) || "Outdoor task").trim();
      if (!text && !title) return null;
      return {
        title: title.slice(0, 80),
        text: (text || title).slice(0, 400),
        minutes: Number(t.minutes) || Math.min(minutes, 20)
      };
    })
    .filter(Boolean);
  if (normalized.length === 0) return null;
  return {
    title: String(raw.title || "Grass Ticket").slice(0, 80),
    minutes,
    tasks: normalized.slice(0, 5),
    source: raw.source || "model"
  };
}

function isDangerousTask(task) {
  const blob = `${task.title || ""} ${task.text || ""}`;
  return DANGEROUS_PATTERNS.some((re) => re.test(blob));
}

function isScreenTask(task) {
  const blob = `${task.title || ""} ${task.text || ""}`;
  if (isNegatedScreenMention(blob)) return false;
  return SCREEN_PATTERNS.some((re) => re.test(blob));
}

function isSafeTask(task) {
  if (!task || !(task.text || task.title)) return false;
  if (isDangerousTask(task)) return false;
  if (isScreenTask(task)) return false;
  return true;
}

function filterSafeTasks(tasks) {
  return (tasks || []).filter(isSafeTask);
}

function ensureThreeTasks(ticket, prefs) {
  const { pickOfflineTicket } = getTasksApi();
  const safe = filterSafeTasks(ticket.tasks);
  if (safe.length >= 3) {
    return {
      ...ticket,
      tasks: safe.slice(0, 3),
      replaced: ticket.tasks.length - safe.length
    };
  }
  const offline = pickOfflineTicket(prefs || { time: ticket.minutes || 20 }, 3);
  const merged = safe.slice();
  for (const t of offline.tasks) {
    if (merged.length >= 3) break;
    if (!merged.some((m) => m.title === t.title)) merged.push(t);
  }
  while (merged.length < 3) {
    merged.push({
      title: "Neighborhood leaf walk",
      text: "Walk one quiet block and notice five different leaf shapes. No phone required.",
      minutes: 10
    });
  }
  return {
    title: ticket.title || "Grass Ticket",
    minutes: ticket.minutes || offline.minutes,
    tasks: merged.slice(0, 3),
    source: safe.length ? "mixed" : "offline",
    replaced: (ticket.tasks || []).length - safe.length
  };
}

function validateAndGuard(modelText, prefs) {
  const parsed = extractJsonObject(modelText);
  const ticket = normalizeTicket(parsed, prefs);
  if (!ticket) {
    const { pickOfflineTicket } = getTasksApi();
    const offline = pickOfflineTicket(prefs || { time: 20 }, 3);
    return { ok: false, reason: "parse_failed", ticket: offline };
  }
  const guarded = ensureThreeTasks(ticket, prefs);
  return { ok: true, reason: "ok", ticket: guarded };
}

const Validator = {
  DANGEROUS_PATTERNS,
  SCREEN_PATTERNS,
  extractJsonObject,
  normalizeTicket,
  isDangerousTask,
  isScreenTask,
  isSafeTask,
  filterSafeTasks,
  ensureThreeTasks,
  validateAndGuard
};

if (typeof module !== "undefined" && module.exports) {
  module.exports = Validator;
} else if (typeof window !== "undefined") {
  window.Validator = Validator;
}
