const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const repoRoot = path.resolve(__dirname, "..");
const html = fs.readFileSync(path.join(repoRoot, "alphabet-forest.html"), "utf8");
const js = fs.readFileSync(path.join(repoRoot, "assets", "alphabet-forest.js"), "utf8");
const css = fs.readFileSync(path.join(repoRoot, "assets", "styles.css"), "utf8");
const core = require(path.join(repoRoot, "assets", "alphabet-forest-core.js"));

const ACTIVITY_IDS = [
  "magical-tree",
  "letter-garden",
  "hear-and-pick",
  "picture-match",
  "arrange-word",
  "flashcard-flip",
  "feed-mithu",
  "hidden-letter-hunt"
];

function countMatches(text, pattern) {
  const matches = text.match(pattern);
  return matches ? matches.length : 0;
}

test("renders exactly eight activity sections", () => {
  assert.equal(countMatches(html, /data-activity-id="/g), 8);
  ACTIVITY_IDS.forEach((id) => {
    assert.ok(html.includes(`data-activity-id="${id}"`));
  });
});

test("jump links target all activity sections", () => {
  const sectionAnchors = [
    "#forestScene",
    "#letterGardenSection",
    "#activityHearGamePanel",
    "#activityPictureGamePanel",
    "#activityArrangeGamePanel",
    "#activityFlashGamePanel",
    "#activityFeedGamePanel",
    "#activityHuntGamePanel"
  ];
  sectionAnchors.forEach((anchor) => {
    assert.ok(html.includes(`href="${anchor}"`));
  });
});

test("all activity controls are present in DOM", () => {
  ACTIVITY_IDS.forEach((id) => {
    assert.ok(html.includes(`id="controls-${id}"`), `missing controls container for ${id}`);
  });
});

test("global panel is summary-only and no 3-of-6 wording", () => {
  assert.ok(html.includes("0 of 8 activities complete"));
  assert.equal(html.includes("Activity 3 of 6"), false);
});

test("audio is disabled by feature flag and no speechSynthesis usage", () => {
  assert.ok(js.includes("const AUDIO_ENABLED = false;"));
  assert.equal(js.includes("speechSynthesis"), false);
  assert.ok(js.includes("if (!AUDIO_ENABLED) return;"));
});

test("full-page celebration canvas exists", () => {
  assert.ok(html.includes('id="celebration-canvas"'));
  assert.ok(css.includes("#celebration-canvas"));
  assert.ok(css.includes("position: fixed"));
  assert.ok(css.includes("inset: 0"));
  assert.ok(css.includes("pointer-events: none"));
});

test("default forest state has independent activity buckets", () => {
  const state = core.createDefaultForestState(48);
  assert.equal(state.schemaVersion, 3);
  assert.equal(Object.keys(state.activities).length, 8);
  ACTIVITY_IDS.forEach((id) => assert.ok(state.activities[id]));
});

test("advancing one activity does not alter another activity", () => {
  const state = core.createDefaultForestState(48);
  core.goNext(state, "hear-and-pick");
  assert.equal(state.activities["hear-and-pick"].currentIndex, 1);
  assert.equal(state.activities["picture-match"].currentIndex, 0);
});

test("previous and next clamp within valid index range", () => {
  const state = core.createDefaultForestState(48);
  core.goPrevious(state, "hear-and-pick");
  assert.equal(state.activities["hear-and-pick"].currentIndex, 0);
  for (let i = 0; i < 120; i += 1) core.goNext(state, "hear-and-pick");
  assert.equal(state.activities["hear-and-pick"].currentIndex, 47);
});

test("retry does not change current index", () => {
  const state = core.createDefaultForestState(48);
  state.activities["flashcard-flip"].currentIndex = 12;
  state.activities["flashcard-flip"].answers[12] = "temp";
  core.retryCurrent(state, "flashcard-flip");
  assert.equal(state.activities["flashcard-flip"].currentIndex, 12);
  assert.equal(state.activities["flashcard-flip"].answers[12], undefined);
});

test("finish activity changes global completion by exactly one", () => {
  const state = core.createDefaultForestState(48);
  const target = state.activities["feed-mithu"];
  target.completedItems = Array.from({ length: 48 }, (_, index) => index);
  const before = core.computeGlobalProgress(state);
  assert.equal(before.completedActivityCount, 0);
  assert.equal(core.finalizeActivity(state, "feed-mithu"), true);
  const after = core.computeGlobalProgress(state);
  assert.equal(after.completedActivityCount, 1);
  assert.equal(after.globalPercent, 12.5);
});

test("restart only works after completion", () => {
  const state = core.createDefaultForestState(48);
  assert.equal(core.resetActivity(state, "arrange-word"), false);
  state.activities["arrange-word"].isComplete = true;
  state.activities["arrange-word"].currentIndex = 47;
  state.activities["arrange-word"].completedItems = Array.from({ length: 48 }, (_, index) => index);
  assert.equal(core.resetActivity(state, "arrange-word"), true);
  assert.equal(state.activities["arrange-word"].currentIndex, 0);
  assert.equal(state.activities["arrange-word"].completedItems.length, 0);
});

test("legacy progression state migrates safely", () => {
  const legacy = {
    state: {
      activities: {
        "listen-identify": { currentLetterIndex: 4, completedLetters: [0, 1, 2, 2, 3], isCompleted: false },
        "letter-hunt": { currentLetterIndex: 90, completedLetters: [0, 47, 100], isCompleted: false }
      }
    }
  };
  const migrated = core.migrateForestState(legacy, 48);
  assert.equal(migrated.activities["hear-and-pick"].currentIndex, 4);
  assert.deepEqual(migrated.activities["hear-and-pick"].completedItems, [0, 1, 2, 3]);
  assert.equal(migrated.activities["hidden-letter-hunt"].currentIndex, 47);
  assert.deepEqual(migrated.activities["hidden-letter-hunt"].completedItems, [0, 47]);
});

test("legacy done flags migrate to per-activity completion", () => {
  const legacy = { done: { hear: true, flash: true, hunt: false } };
  const migrated = core.migrateForestState(legacy, 48);
  assert.equal(migrated.activities["hear-and-pick"].isComplete, true);
  assert.equal(migrated.activities["flashcard-flip"].isComplete, true);
  assert.equal(migrated.activities["hidden-letter-hunt"].isComplete, false);
});

test("legacy letter-garden learned array migrates", () => {
  const migrated = core.migrateForestState([0, 1, 1, 47, 99], 48);
  assert.deepEqual(migrated.activities["letter-garden"].completedItems, [0, 1, 47]);
});

test("invalid saved JSON falls back to valid default state", () => {
  const storage = {
    map: new Map([[core.STORAGE_KEY, "{invalid-json"]]),
    getItem(key) { return this.map.has(key) ? this.map.get(key) : null; },
    setItem(key, value) { this.map.set(key, value); }
  };
  const api = core.createStateApi(storage, 48);
  const state = api.loadState();
  assert.equal(state.schemaVersion, 3);
  assert.equal(Object.keys(state.activities).length, 8);
});
