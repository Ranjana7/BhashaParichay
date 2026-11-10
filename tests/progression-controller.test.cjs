const test = require("node:test");
const assert = require("node:assert/strict");

const { createProgressionController } = require("../assets/progression-controller.js");

function createMemoryStorage() {
  const store = new Map();
  return {
    getItem(key) {
      return store.has(key) ? store.get(key) : null;
    },
    setItem(key, value) {
      store.set(key, String(value));
    }
  };
}

function createController(storage) {
  return createProgressionController({
    activityIds: ["a1", "a2", "a3", "a4", "a5", "a6"],
    letterCount: 48,
    storageKey: "test.progression",
    storage: storage,
    perLetterXP: 1,
    activityCompletionXP: 8
  });
}

function completeEntireActivity(controller, activityId) {
  controller.goToActivity(activityId);
  for (let idx = 0; idx < 48; idx += 1) {
    assert.equal(controller.getCurrentLetterIndex(activityId), idx);
    controller.completeCurrentLetter(activityId);
    if (idx < 47) {
      assert.equal(controller.canGoNext(activityId), true);
      controller.goToNextLetter(activityId);
    }
  }
}

test("starts at first activity and first letter", () => {
  const controller = createController(createMemoryStorage());
  const snapshot = controller.getSnapshot();
  assert.equal(snapshot.state.currentActivityIndex, 0);
  assert.equal(controller.getCurrentActivityId(), "a1");
  assert.equal(controller.getCurrentLetterIndex("a1"), 0);
});

test("next remains blocked until current letter is completed", () => {
  const controller = createController(createMemoryStorage());
  assert.equal(controller.canGoNext("a1"), false);
  controller.goToNextLetter("a1");
  assert.equal(controller.getCurrentLetterIndex("a1"), 0);

  controller.completeCurrentLetter("a1");
  assert.equal(controller.canGoNext("a1"), true);
  controller.goToNextLetter("a1");
  assert.equal(controller.getCurrentLetterIndex("a1"), 1);
});

test("previous works and does not remove completion", () => {
  const controller = createController(createMemoryStorage());
  controller.completeCurrentLetter("a1");
  controller.goToNextLetter("a1");
  controller.completeCurrentLetter("a1");
  controller.goToPreviousLetter("a1");
  assert.equal(controller.getCurrentLetterIndex("a1"), 0);
  assert.equal(controller.isLetterCompleted("a1", 0), true);
  assert.equal(controller.isLetterCompleted("a1", 1), true);
});

test("retry updates token without changing index", () => {
  const controller = createController(createMemoryStorage());
  const before = controller.getActivityProgress("a1").retryToken;
  const returned = controller.retryCurrentLetter("a1");
  assert.equal(returned, before + 1);
  assert.equal(controller.getCurrentLetterIndex("a1"), 0);
});

test("completing same letter twice does not award duplicate xp", () => {
  const controller = createController(createMemoryStorage());
  controller.completeCurrentLetter("a1");
  const xpAfterFirst = controller.getSnapshot().state.xp;
  controller.completeCurrentLetter("a1");
  const xpAfterSecond = controller.getSnapshot().state.xp;
  assert.equal(xpAfterFirst, 1);
  assert.equal(xpAfterSecond, 1);
});

test("all 48 letters can be completed exactly once per activity", () => {
  const controller = createController(createMemoryStorage());
  completeEntireActivity(controller, "a1");
  const progress = controller.getActivityProgress("a1");
  assert.equal(progress.currentLetterIndex, 47);
  assert.equal(progress.completedCount, 48);
  assert.equal(controller.canFinishActivity("a1"), true);
});

test("activity completion is explicit and grants completion reward once", () => {
  const controller = createController(createMemoryStorage());
  completeEntireActivity(controller, "a1");
  const first = controller.completeActivity("a1");
  assert.equal(first.completed, true);
  const xpAfterFirst = controller.getSnapshot().state.xp;

  const second = controller.completeActivity("a1");
  assert.equal(second.completed, true);
  const xpAfterSecond = controller.getSnapshot().state.xp;
  assert.equal(xpAfterFirst, xpAfterSecond);
});

test("next activity advances sequence correctly", () => {
  const controller = createController(createMemoryStorage());
  controller.goToNextActivity();
  assert.equal(controller.getCurrentActivityId(), "a2");
  controller.goToNextActivity();
  assert.equal(controller.getCurrentActivityId(), "a3");
});

test("reset is only available after an activity is completed", () => {
  const controller = createController(createMemoryStorage());
  assert.equal(controller.resetActivity("a1").reset, false);

  completeEntireActivity(controller, "a1");
  controller.completeActivity("a1");
  const xpBeforeReset = controller.getSnapshot().state.xp;
  const reset = controller.resetActivity("a1");
  assert.equal(reset.reset, true);
  assert.equal(controller.getCurrentLetterIndex("a1"), 0);
  assert.equal(controller.getActivityProgress("a1").completedCount, 0);
  assert.equal(controller.getSnapshot().state.xp, xpBeforeReset);
});

test("resumeProgress preserves persisted state", () => {
  const storage = createMemoryStorage();
  const firstController = createController(storage);
  firstController.completeCurrentLetter("a1");
  firstController.goToNextLetter("a1");
  firstController.goToNextActivity();

  const secondController = createController(storage);
  secondController.resumeProgress();
  assert.equal(secondController.getCurrentActivityId(), "a2");
  assert.equal(secondController.isLetterCompleted("a1", 0), true);
});

test("world completion becomes true only after all activities complete", () => {
  const controller = createController(createMemoryStorage());
  ["a1", "a2", "a3", "a4", "a5", "a6"].forEach((activityId) => {
    completeEntireActivity(controller, activityId);
    controller.completeActivity(activityId);
  });
  const snapshot = controller.getSnapshot();
  assert.equal(snapshot.state.worldCompleted, true);
  assert.ok(snapshot.state.badges.includes("alphabet-forest-complete"));
});
