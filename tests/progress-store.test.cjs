const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

function createStorage(seed) {
  const map = new Map(Object.entries(seed || {}));
  return {
    getItem(key) {
      return map.has(key) ? map.get(key) : null;
    },
    setItem(key, value) {
      map.set(key, String(value));
    }
  };
}

function loadStore(storageSeed) {
  const storage = createStorage(storageSeed);
  const source = fs.readFileSync(path.join(__dirname, "..", "assets", "progress-store.js"), "utf8");
  const context = vm.createContext({
    window: {},
    localStorage: storage
  });
  vm.runInContext(source, context);
  return { api: context.window.SPProgressStore, storage: storage };
}

test("progress store migrates legacy alphabet progress safely", () => {
  const legacy = {
    done: { hear: true, picture: true, arrange: true, flash: false, feed: false, trace: false, hunt: false },
    stars: 7
  };
  const { api, storage } = loadStore({
    "sanskritParichay.alphabetForest.progress": JSON.stringify(legacy)
  });
  const forest = api.loadForestState();
  assert.equal(forest.xp, 7);
  assert.equal(forest.activities["hear-and-pick"].isComplete, true);
  assert.equal(forest.activities["flashcard-flip"].isComplete, false);
  assert.ok(storage.getItem("sanskritParichay.alphabetForest.v3"));
});

test("progress store migrates legacy letter-garden learned key", () => {
  const { api } = loadStore({
    "sanskritParichay.alphabetForest.garden.learned": JSON.stringify([0, 1, 1, 47, 100])
  });
  const forest = api.loadForestState();
  assert.deepEqual(Array.from(forest.activities["letter-garden"].completedItems), [0, 1, 47]);
});

test("progress store merges multiple legacy keys", () => {
  const { api } = loadStore({
    "sanskritParichay.alphabetForest.tree.progress": JSON.stringify({
      state: {
        activities: {
          "magical-tree": {
            currentLetterIndex: 47,
            completedLetters: Array.from({ length: 48 }, (_, i) => i),
            isCompleted: true
          }
        }
      }
    }),
    "sanskritParichay.alphabetForest.garden.learned": JSON.stringify(Array.from({ length: 48 }, (_, i) => i))
  });
  const forest = api.loadForestState();
  assert.equal(forest.activities["magical-tree"].isComplete, true);
  assert.equal(forest.activities["letter-garden"].isComplete, true);
  assert.equal(forest.activities["letter-garden"].completedItems.length, 48);
});

test("snapshot reports learning/practice counts from alphabet forest v3", () => {
  const v3 = {
    schemaVersion: 3,
    activities: {
      "magical-tree": { currentIndex: 47, completedItems: Array.from({ length: 48 }, (_, i) => i), rewardedItems: [], answers: {}, attempts: {}, order: Array.from({ length: 48 }, (_, i) => i), isComplete: true },
      "letter-garden": { currentIndex: 47, completedItems: Array.from({ length: 48 }, (_, i) => i), rewardedItems: [], answers: {}, attempts: {}, order: Array.from({ length: 48 }, (_, i) => i), isComplete: true },
      "hear-and-pick": { currentIndex: 47, completedItems: Array.from({ length: 48 }, (_, i) => i), rewardedItems: [], answers: {}, attempts: {}, order: Array.from({ length: 48 }, (_, i) => i), isComplete: true },
      "picture-match": { currentIndex: 0, completedItems: [], rewardedItems: [], answers: {}, attempts: {}, order: Array.from({ length: 48 }, (_, i) => i), isComplete: false },
      "arrange-word": { currentIndex: 0, completedItems: [], rewardedItems: [], answers: {}, attempts: {}, order: Array.from({ length: 48 }, (_, i) => i), isComplete: false },
      "flashcard-flip": { currentIndex: 0, completedItems: [], rewardedItems: [], answers: {}, attempts: {}, order: Array.from({ length: 48 }, (_, i) => i), isComplete: false },
      "feed-mithu": { currentIndex: 0, completedItems: [], rewardedItems: [], answers: {}, attempts: {}, order: Array.from({ length: 48 }, (_, i) => i), isComplete: false },
      "letter-tracing": { currentIndex: 0, completedItems: [], rewardedItems: [], answers: {}, attempts: {}, order: Array.from({ length: 48 }, (_, i) => i), isComplete: false },
      "hidden-letter-hunt": { currentIndex: 0, completedItems: [], rewardedItems: [], answers: {}, attempts: {}, order: Array.from({ length: 48 }, (_, i) => i), isComplete: false }
    },
    completionRewarded: {},
    worldCompleted: false,
    xp: 54
  };
  const { api } = loadStore({
    "sanskritParichay.alphabetForest.v3": JSON.stringify(v3),
    "sanskritParichay.lastWorld": "numbers"
  });
  const snapshot = api.getProgressSnapshot(
    ["alphabet", "words", "animals", "numbers", "colours", "sentences", "stories", "culture"],
    { alphabet: 6, words: 3, animals: 3, numbers: 3, colours: 3, sentences: 3, stories: 3, culture: 3 }
  );
  assert.equal(snapshot.currentWorld, "numbers");
  assert.equal(snapshot.alphabet.learningCompletedCount, 2);
  assert.equal(snapshot.alphabet.practiceCompletedCount, 1);
  assert.equal(snapshot.alphabet.unlocked, false);
  assert.equal(snapshot.totals.learningActivitiesCompleted, 2);
  assert.equal(snapshot.totals.practiceActivitiesCompleted, 1);
});

test("unlock check keeps completed world access independent of test mode", () => {
  const { api } = loadStore({
    "sanskritParichay.alphabetForest.v3": JSON.stringify({
      schemaVersion: 3,
      activities: {
        "magical-tree": { currentIndex: 47, completedItems: Array.from({ length: 48 }, (_, i) => i), rewardedItems: [], answers: {}, attempts: {}, order: Array.from({ length: 48 }, (_, i) => i), isComplete: true },
        "letter-garden": { currentIndex: 0, completedItems: [], rewardedItems: [], answers: {}, attempts: {}, order: Array.from({ length: 48 }, (_, i) => i), isComplete: false },
        "hear-and-pick": { currentIndex: 47, completedItems: Array.from({ length: 48 }, (_, i) => i), rewardedItems: [], answers: {}, attempts: {}, order: Array.from({ length: 48 }, (_, i) => i), isComplete: true },
        "picture-match": { currentIndex: 47, completedItems: Array.from({ length: 48 }, (_, i) => i), rewardedItems: [], answers: {}, attempts: {}, order: Array.from({ length: 48 }, (_, i) => i), isComplete: true },
        "arrange-word": { currentIndex: 0, completedItems: [], rewardedItems: [], answers: {}, attempts: {}, order: Array.from({ length: 48 }, (_, i) => i), isComplete: false },
        "flashcard-flip": { currentIndex: 0, completedItems: [], rewardedItems: [], answers: {}, attempts: {}, order: Array.from({ length: 48 }, (_, i) => i), isComplete: false },
        "feed-mithu": { currentIndex: 0, completedItems: [], rewardedItems: [], answers: {}, attempts: {}, order: Array.from({ length: 48 }, (_, i) => i), isComplete: false },
        "letter-tracing": { currentIndex: 0, completedItems: [], rewardedItems: [], answers: {}, attempts: {}, order: Array.from({ length: 48 }, (_, i) => i), isComplete: false },
        "hidden-letter-hunt": { currentIndex: 0, completedItems: [], rewardedItems: [], answers: {}, attempts: {}, order: Array.from({ length: 48 }, (_, i) => i), isComplete: false }
      },
      completionRewarded: {},
      worldCompleted: false,
      xp: 0
    }),
    "sanskritParichay.world.words.progress": JSON.stringify({
      lessonIndex: 2,
      stars: 10,
      completedLessons: [0, 1, 2],
      practiceCompleted: { match: true, listen: true, build: false }
    }),
    "sanskritParichay.world.animals.progress": JSON.stringify({ lessonIndex: 0, stars: 0, completedLessons: [] })
  });
  const order = ["alphabet", "words", "animals"];
  const totals = { alphabet: 6, words: 3, animals: 3 };
  assert.equal(api.isWorldUnlocked("animals", order, false, totals), true);
  assert.equal(api.isWorldUnlocked("animals", order, true, totals), true);
});
