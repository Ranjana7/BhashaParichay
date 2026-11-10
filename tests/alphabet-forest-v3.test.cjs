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
  "letter-tracing",
  "hidden-letter-hunt"
];

function countMatches(text, pattern) {
  const matches = text.match(pattern);
  return matches ? matches.length : 0;
}

test("renders nine activity sections", () => {
  assert.equal(countMatches(html, /data-activity-id="/g), 9);
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
    "#activityTraceGamePanel",
    "#activityHuntGamePanel"
  ];
  sectionAnchors.forEach((anchor) => {
    assert.ok(html.includes(`href="${anchor}"`));
  });
  assert.ok(html.includes(">Write It Yourself<"));
});

test("all activity controls are present in DOM", () => {
  ACTIVITY_IDS.filter((id) => id !== "letter-garden").forEach((id) => {
    assert.ok(html.includes(`id="controls-${id}"`), `missing controls container for ${id}`);
  });
});

test("global panel is consolidated summary-only and no 3-of-6 wording", () => {
  assert.ok(html.includes("0 of 9 activities complete"));
  assert.ok(html.includes('id="globalProgressPercent"'));
  assert.ok(html.includes('id="globalStars"'));
  assert.equal(html.includes('id="lessonStatsPanel"'), false);
  assert.equal(html.includes("Activity 3 of 6"), false);
});

test("audio is paused without browser speech fallback", () => {
  assert.ok(js.includes("const AUDIO_ENABLED = false;"));
  assert.equal(js.includes("speechSynthesis"), false);
  assert.ok(js.includes("Pronunciation is unavailable until verified Sanskrit audio is approved."));
});

test("full-page celebration canvas exists", () => {
  assert.ok(html.includes('id="celebration-canvas"'));
  assert.ok(css.includes("#celebration-canvas"));
  assert.ok(css.includes("position: fixed"));
  assert.ok(css.includes("inset: 0"));
  assert.ok(css.includes("pointer-events: none"));
});

test("letter garden uses Devanagari tab labels and subgroup categories", () => {
  assert.ok(html.includes(">स्वर<"));
  assert.ok(html.includes(">व्यञ्जन<"));
  assert.equal(html.includes(">अभ्यास<"), false);
  assert.equal(html.includes(">All<"), false);
  assert.ok(js.includes("क-वर्ग"));
  assert.ok(js.includes("च-वर्ग"));
  assert.ok(js.includes("ट-वर्ग"));
  assert.ok(js.includes("त-वर्ग"));
  assert.ok(js.includes("प-वर्ग"));
  assert.ok(js.includes("अन्तःस्थ"));
  assert.ok(js.includes("ऊष्म"));
});

test("educational images are not cropped by default", () => {
  assert.ok(css.includes("object-fit: contain"));
  assert.ok(css.includes(".picture-illustration"));
});

test("shared panel has single control area without duplicate nested activity controls", () => {
  assert.equal(html.includes('id="controls-letter-garden"'), false);
  assert.ok(html.includes('id="prevLetterBtn"'));
  assert.ok(html.includes('id="nextLetterBtn"'));
  assert.ok(html.includes('id="replayLetterBtn"'));
});

test("magical tree play again resets from first group in code path", () => {
  assert.ok(js.includes('treeState.currentIndex = 0;'));
  assert.ok(js.includes("treeState.completedItems = [];"));
  assert.ok(js.includes('forestState.activities["magical-tree"].isComplete'));
});

test("picture match uses local image choices with structured question pool", () => {
  assert.ok(js.includes("const pictureQuestions"));
  assert.ok(js.includes("picture-illustration"));
  assert.ok(js.includes("Select the correct picture for:"));
});

test("flashcard flip is tap-to-flip and does not use separate flip button", () => {
  assert.equal(html.includes('id="flipFlashcard"'), false);
  assert.ok(html.includes('id="flashcard" class="flashcard" role="button"'));
  assert.ok(js.includes('ui.flashcard.addEventListener("click"'));
});

test("feed mithu uses fruit question pool between 15 and 20 entries", () => {
  const feedBlock = js.match(/const feedMithuQuestions = \[(.*?)\];/s);
  assert.ok(feedBlock, "missing feedMithuQuestions definition");
  const count = (feedBlock[1].match(/sanskrit:/g) || []).length;
  assert.ok(count >= 15 && count <= 20, `expected 15-20 fruit questions, got ${count}`);
  assert.ok(js.includes("animateFruitToMithu"));
});

test("write-it-yourself uses self-assessment and no fake handwriting validation", () => {
  assert.ok(html.includes('id="writingComparePanel"'));
  assert.ok(html.includes("Check My Writing"));
  assert.ok(html.includes("Looks Good!"));
  assert.ok(html.includes("Try Again"));
  assert.ok(js.includes("showWritingComparison("));
  assert.ok(js.includes("Self-check: compare your writing"));
  assert.equal(js.includes("tracingCoverageScore("), false);
  assert.equal(js.includes("buildGlyphGuide("), false);
});

test("mithu companion uses activity-based speech and has no unrelated reaction icon", () => {
  assert.equal(html.includes('id="mithuReactionLottie"'), false);
  assert.ok(js.includes("const ACTIVITY_SPEECH ="));
  assert.ok(js.includes("updateMascotSpeechForActivity("));
  assert.ok(js.includes("IntersectionObserver"));
  assert.ok(js.includes("moveMascotNearSection("));
});

test("auto progression uses cancellable timers and manual controls", () => {
  assert.ok(js.includes("scheduleAutoAdvance("));
  assert.ok(js.includes("cancelAutoAdvance("));
  assert.ok(js.includes("data-action=\"continue\""));
});

test("default forest state has independent activity buckets", () => {
  const state = core.createDefaultForestState(48);
  assert.equal(state.schemaVersion, 3);
  assert.equal(Object.keys(state.activities).length, 9);
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
  assert.equal(after.globalPercent, 100 / 9);
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

test("restart keeps historical rewards and prevents duplicate star awarding", () => {
  const state = core.createDefaultForestState(48);
  const activity = state.activities["arrange-word"];
  activity.currentIndex = 0;
  core.markCurrentItemCompleted(state, "arrange-word", 1);
  assert.equal(state.xp, 1);
  activity.isComplete = true;
  activity.completedItems = Array.from({ length: 48 }, (_, index) => index);
  assert.equal(core.resetActivity(state, "arrange-word"), true);
  state.activities["arrange-word"].currentIndex = 0;
  core.markCurrentItemCompleted(state, "arrange-word", 1);
  assert.equal(state.xp, 1);
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
  assert.equal(Object.keys(state.activities).length, 9);
});
