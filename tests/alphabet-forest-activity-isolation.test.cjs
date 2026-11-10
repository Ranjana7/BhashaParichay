const test = require("node:test");
const assert = require("node:assert/strict");

const core = require("../assets/alphabet-forest-core.js");

const IDS = [
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

function cloneState(state) {
  return JSON.parse(JSON.stringify(state));
}

test("next and previous mutate only the target activity index", () => {
  const state = core.createDefaultForestState(48);
  IDS.forEach((activityId) => {
    const before = cloneState(state.activities);
    core.goNext(state, activityId);
    IDS.forEach((id) => {
      if (id === activityId) {
        assert.equal(state.activities[id].currentIndex, Math.min(before[id].currentIndex + 1, 47));
      } else {
        assert.equal(state.activities[id].currentIndex, before[id].currentIndex);
      }
    });
    core.goPrevious(state, activityId);
    IDS.forEach((id) => {
      if (id === activityId) {
        assert.equal(state.activities[id].currentIndex, before[id].currentIndex);
      } else {
        assert.equal(state.activities[id].currentIndex, before[id].currentIndex);
      }
    });
  });
});

test("retry only clears answer for the target activity current item", () => {
  const state = core.createDefaultForestState(48);
  IDS.forEach((activityId, idx) => {
    state.activities[activityId].currentIndex = idx;
    state.activities[activityId].answers[idx] = "answer-" + idx;
  });
  const before = cloneState(state.activities);
  core.retryCurrent(state, "picture-match");
  IDS.forEach((id) => {
    const cur = before[id].currentIndex;
    if (id === "picture-match") {
      assert.equal(state.activities[id].answers[cur], undefined);
    } else {
      assert.equal(state.activities[id].answers[cur], before[id].answers[cur]);
    }
  });
});

test("reset only resets one completed activity and preserves others", () => {
  const state = core.createDefaultForestState(48);
  IDS.forEach((activityId) => {
    state.activities[activityId].completedItems = Array.from({ length: 48 }, (_, i) => i);
    state.activities[activityId].rewardedItems = Array.from({ length: 48 }, (_, i) => i);
    state.activities[activityId].currentIndex = 47;
    state.activities[activityId].isComplete = true;
  });
  const before = cloneState(state.activities);
  const ok = core.resetActivity(state, "feed-mithu");
  assert.equal(ok, true);
  IDS.forEach((id) => {
    if (id === "feed-mithu") {
      assert.equal(state.activities[id].currentIndex, 0);
      assert.equal(state.activities[id].completedItems.length, 0);
      assert.equal(state.activities[id].isComplete, false);
    } else {
      assert.equal(state.activities[id].currentIndex, before[id].currentIndex);
      assert.equal(state.activities[id].completedItems.length, before[id].completedItems.length);
      assert.equal(state.activities[id].isComplete, before[id].isComplete);
    }
  });
});

test("completion rewards are per activity and do not duplicate", () => {
  const state = core.createDefaultForestState(48);
  const startXP = state.xp;
  state.activities["picture-match"].currentIndex = 3;
  state.activities["flashcard-flip"].currentIndex = 3;
  core.markCurrentItemCompleted(state, "picture-match", 1);
  assert.equal(state.xp, startXP + 1);
  core.markCurrentItemCompleted(state, "picture-match", 1);
  assert.equal(state.xp, startXP + 1);
  core.markCurrentItemCompleted(state, "flashcard-flip", 1);
  assert.equal(state.xp, startXP + 2);
});
