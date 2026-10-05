const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const path = require("node:path");

const root = path.join(__dirname, "..", "js");
const Tasks = require(path.join(root, "tasks.js"));
const Validator = require(path.join(root, "validator.js"));
const TimeCalc = require(path.join(root, "time.js"));

describe("task bank", () => {
  it("has at least 40 offline tasks", () => {
    assert.ok(Tasks.TASK_BANK.length >= 40, `got ${Tasks.TASK_BANK.length}`);
  });

  it("pickOfflineTicket returns exactly 3 tasks within time budget prefs", () => {
    const ticket = Tasks.pickOfflineTicket({ time: 10, energy: "low", company: "solo", weather: "any" }, 3);
    assert.equal(ticket.tasks.length, 3);
    assert.equal(ticket.source, "offline");
    for (const t of ticket.tasks) {
      assert.ok(t.title && t.text);
    }
  });
});

describe("JSON parser / normalize", () => {
  it("extractJsonObject parses fenced JSON", () => {
    const raw = 'Here you go:\n```json\n{"title":"A","minutes":20,"tasks":[{"title":"Walk","text":"Walk the block","minutes":10}]}\n```';
    const obj = Validator.extractJsonObject(raw);
    assert.equal(obj.title, "A");
    assert.equal(obj.tasks.length, 1);
  });

  it("extractJsonObject returns null for garbage", () => {
    assert.equal(Validator.extractJsonObject("not json at all"), null);
    assert.equal(Validator.extractJsonObject(""), null);
    assert.equal(Validator.extractJsonObject(null), null);
  });

  it("normalizeTicket accepts string tasks and activities alias", () => {
    const n = Validator.normalizeTicket(
      { title: "T", minutes: 20, activities: ["Sit under a tree and breathe"] },
      { time: 20 }
    );
    assert.ok(n);
    assert.equal(n.tasks.length, 1);
    assert.match(n.tasks[0].text, /tree/i);
  });
});

describe("safety filter", () => {
  it("flags dangerous traffic / water / height / stranger / trespass / night-alone tasks", () => {
    const samples = [
      { title: "x", text: "Cross the busy highway median for fun" },
      { title: "x", text: "Go for a lake swim across the deep water" },
      { title: "x", text: "Climb the cliff behind the quarry" },
      { title: "x", text: "Meet a stranger from the internet in the park" },
      { title: "x", text: "Trespass into private property gardens" },
      { title: "x", text: "Take a night walk alone after dark" }
    ];
    for (const s of samples) {
      assert.equal(Validator.isDangerousTask(s), true, s.text);
      assert.equal(Validator.isSafeTask(s), false, s.text);
    }
  });

  it("flags screen / phone required tasks", () => {
    const samples = [
      { title: "Scroll", text: "Scroll Instagram while sitting on a bench" },
      { title: "Film", text: "Open an app and take 20 photos for a photo dump" },
      { title: "Stream", text: "Watch a YouTube video outdoors on your phone" }
    ];
    for (const s of samples) {
      assert.equal(Validator.isScreenTask(s), true, s.text);
      assert.equal(Validator.isSafeTask(s), false, s.text);
    }
  });

  it("allows ordinary outdoor tasks", () => {
    const ok = { title: "Leaf walk", text: "Walk one quiet block and notice five leaf shapes." };
    assert.equal(Validator.isSafeTask(ok), true);
  });
});

describe("fallback / guard", () => {
  it("validateAndGuard falls back to offline bank when parse fails", () => {
    const result = Validator.validateAndGuard("sorry I cannot help", { time: 20, energy: "medium", company: "either", weather: "any" });
    assert.equal(result.ok, false);
    assert.equal(result.reason, "parse_failed");
    assert.equal(result.ticket.tasks.length, 3);
    assert.equal(result.ticket.source, "offline");
  });

  it("ensureThreeTasks replaces unsafe model tasks with offline ones", () => {
    const ticket = {
      title: "Bad mix",
      minutes: 20,
      tasks: [
        { title: "Swim", text: "Go for a deep water ocean swim", minutes: 20 },
        { title: "Phone", text: "Scroll TikTok on a park bench", minutes: 10 },
        { title: "Nice", text: "Sit on a park bench and watch the sky for five minutes", minutes: 10 }
      ],
      source: "model"
    };
    const out = Validator.ensureThreeTasks(ticket, { time: 20, energy: "low", company: "either", weather: "any" });
    assert.equal(out.tasks.length, 3);
    assert.ok(out.tasks.every((t) => Validator.isSafeTask(t)));
    assert.ok(out.replaced >= 2);
  });

  it("validateAndGuard accepts clean model JSON", () => {
    const json = JSON.stringify({
      title: "Park trio",
      minutes: 20,
      tasks: [
        { title: "Walk", text: "Walk one park loop at an easy pace", minutes: 10 },
        { title: "Sit", text: "Sit under a tree and count ten breaths", minutes: 5 },
        { title: "Notice", text: "Name five outdoor colors you see", minutes: 5 }
      ]
    });
    const result = Validator.validateAndGuard(json, { time: 20 });
    assert.equal(result.ok, true);
    assert.equal(result.ticket.tasks.length, 3);
  });
});

describe("time calculation", () => {
  it("screenOutdoorRatio rounds minutes and builds summary", () => {
    const r = TimeCalc.screenOutdoorRatio(2 * 60 * 1000, 38 * 60 * 1000);
    assert.equal(r.screenMin, 2);
    assert.equal(r.outdoorMin, 38);
    assert.equal(r.outdoorPct, 95);
    assert.equal(r.summary, "2 min on screen, 38 min outside");
  });

  it("computeOutdoorFromTimer subtracts screen time from elapsed", () => {
    const start = 1_000_000;
    const end = start + 20 * 60 * 1000;
    const r = TimeCalc.computeOutdoorFromTimer(start, end, 2 * 60 * 1000);
    assert.equal(r.outdoorMin, 18);
    assert.equal(r.screenMin, 2);
  });

  it("formatDuration formats hours and minutes", () => {
    assert.equal(TimeCalc.formatDuration(65_000), "1 min 5s");
    assert.equal(TimeCalc.formatDuration(3_600_000), "1h 0m");
    assert.equal(TimeCalc.formatDuration(5_000), "5s");
  });

  it("history save/load works with a mock storage", () => {
    const mem = {};
    const storage = {
      getItem: (k) => (k in mem ? mem[k] : null),
      setItem: (k, v) => {
        mem[k] = String(v);
      }
    };
    TimeCalc.saveHistory({ at: "2026-10-05", ratio: { summary: "1 min on screen, 19 min outside" } }, storage);
    const list = TimeCalc.loadHistory(storage);
    assert.equal(list.length, 1);
    assert.match(list[0].ratio.summary, /19 min/);
  });
});
