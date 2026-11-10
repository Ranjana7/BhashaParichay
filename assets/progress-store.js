(function initProgressStore(globalScope) {
  const FOREST_V3_KEY = "sanskritParichay.alphabetForest.v3";
  const FOREST_LEGACY_KEY = "sanskritParichay.alphabetForest.progress";
  const FOREST_LEGACY_V1_KEY = "sanskritParichay.alphabetForest.progression.v1";
  const FOREST_LEGACY_TREE_KEY = "sanskritParichay.alphabetForest.tree.progress";
  const FOREST_LEGACY_GARDEN_KEY = "sanskritParichay.alphabetForest.garden.learned";
  const HOME_KEY = "sanskritParichay.home.progress";
  const LAST_WORLD_KEY = "sanskritParichay.lastWorld";
  const LETTER_COUNT = 48;
  const NEXT_WORLD_UNLOCK_KEY = "next-world-unlock-v1";
  const FOREST_ACTIVITY_IDS = [
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
  const FOREST_LEARNING_IDS = ["magical-tree", "letter-garden"];
  const FOREST_PRACTICE_IDS = FOREST_ACTIVITY_IDS.filter(function (id) { return !FOREST_LEARNING_IDS.includes(id); });
  const LEGACY_DONE_MAP = {
    hear: "hear-and-pick",
    picture: "picture-match",
    arrange: "arrange-word",
    flash: "flashcard-flip",
    feed: "feed-mithu",
    trace: "letter-tracing",
    hunt: "hidden-letter-hunt"
  };

  function readJson(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return fallback;
      return JSON.parse(raw);
    } catch (_error) {
      return fallback;
    }
  }

  function writeJson(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (_error) {
      return false;
    }
  }

  function clampIndex(value, max) {
    if (!Number.isFinite(value)) return 0;
    const floored = Math.floor(value);
    if (floored < 0) return 0;
    if (floored > max) return max;
    return floored;
  }

  function normalizeIndexList(values, max) {
    if (!Array.isArray(values)) return [];
    const unique = [];
    values.forEach(function (value) {
      if (!Number.isFinite(value)) return;
      const normalized = clampIndex(value, max);
      if (!unique.includes(normalized)) unique.push(normalized);
    });
    unique.sort(function (a, b) { return a - b; });
    return unique;
  }

  function createActivityState() {
    return {
      currentIndex: 0,
      completedItems: [],
      rewardedItems: [],
      answers: {},
      attempts: {},
      order: Array.from({ length: LETTER_COUNT }, function (_, index) { return index; }),
      isComplete: false
    };
  }

  function createForestState() {
    const activities = {};
    FOREST_ACTIVITY_IDS.forEach(function (id) {
      activities[id] = createActivityState();
    });
    return {
      schemaVersion: 3,
      activities: activities,
      completionRewarded: {},
      worldCompleted: false,
      xp: 0
    };
  }

  function sanitizeForestState(input) {
    const state = createForestState();
    if (!input || typeof input !== "object") return state;
    const activities = input.activities && typeof input.activities === "object" ? input.activities : {};
    FOREST_ACTIVITY_IDS.forEach(function (id) {
      const source = activities[id] || {};
      const target = state.activities[id];
      target.currentIndex = clampIndex(source.currentIndex, LETTER_COUNT - 1);
      target.completedItems = normalizeIndexList(source.completedItems, LETTER_COUNT - 1);
      target.rewardedItems = normalizeIndexList(source.rewardedItems || source.completedItems, LETTER_COUNT - 1);
      target.answers = source.answers && typeof source.answers === "object" ? source.answers : {};
      target.attempts = source.attempts && typeof source.attempts === "object" ? source.attempts : {};
      target.order = Array.isArray(source.order) && source.order.length === LETTER_COUNT
        ? normalizeIndexList(source.order, LETTER_COUNT - 1)
        : target.order.slice();
      if (target.order.length !== LETTER_COUNT) {
        target.order = Array.from({ length: LETTER_COUNT }, function (_, index) { return index; });
      }
      target.isComplete = Boolean(source.isComplete) || target.completedItems.length >= LETTER_COUNT;
    });
    state.completionRewarded = input.completionRewarded && typeof input.completionRewarded === "object"
      ? input.completionRewarded
      : {};
    state.worldCompleted = Boolean(input.worldCompleted);
    state.xp = Number.isFinite(input.xp) ? Math.max(0, Math.floor(input.xp)) : 0;
    return state;
  }

  function migrateLegacyForestState() {
    const legacyKeys = [
      FOREST_LEGACY_KEY,
      FOREST_LEGACY_V1_KEY,
      FOREST_LEGACY_TREE_KEY,
      FOREST_LEGACY_GARDEN_KEY
    ];
    let legacy = null;
    for (let index = 0; index < legacyKeys.length; index += 1) {
      legacy = readJson(legacyKeys[index], null);
      if (legacy !== null && legacy !== undefined) break;
    }
    if (!legacy || typeof legacy !== "object") return null;
    const migrated = createForestState();
    if (Array.isArray(legacy)) {
      migrated.activities["letter-garden"].completedItems = normalizeIndexList(legacy, LETTER_COUNT - 1);
      migrated.activities["letter-garden"].isComplete = migrated.activities["letter-garden"].completedItems.length >= LETTER_COUNT;
      return migrated;
    }
    if (legacy.state && legacy.state.activities) {
      Object.keys(legacy.state.activities).forEach(function (legacyId) {
        const mapped = legacyId === "listen-identify"
          ? "hear-and-pick"
          : legacyId === "letter-matching"
            ? "picture-match"
            : legacyId === "letter-hunt"
              ? "hidden-letter-hunt"
              : legacyId;
        if (!migrated.activities[mapped]) return;
        const source = legacy.state.activities[legacyId] || {};
        migrated.activities[mapped].currentIndex = clampIndex(source.currentLetterIndex, LETTER_COUNT - 1);
        migrated.activities[mapped].completedItems = normalizeIndexList(source.completedLetters, LETTER_COUNT - 1);
        migrated.activities[mapped].isComplete = Boolean(source.isCompleted) || migrated.activities[mapped].completedItems.length >= LETTER_COUNT;
      });
    }
    if (legacy.done && typeof legacy.done === "object") {
      Object.keys(legacy.done).forEach(function (flag) {
        if (!legacy.done[flag]) return;
        const mapped = LEGACY_DONE_MAP[flag];
        if (!mapped || !migrated.activities[mapped]) return;
        migrated.activities[mapped].isComplete = true;
      });
    }
    migrated.xp = Number.isFinite(legacy.stars) ? Math.max(0, Math.floor(legacy.stars)) : 0;
    if (migrated.activities["magical-tree"].isComplete && migrated.activities["letter-garden"].isComplete) {
      const practiceDone = FOREST_PRACTICE_IDS.reduce(function (count, id) {
        return count + (migrated.activities[id].isComplete ? 1 : 0);
      }, 0);
      if (practiceDone >= 2) migrated.completionRewarded[NEXT_WORLD_UNLOCK_KEY] = true;
    }
    return migrated;
  }

  function loadForestState() {
    const current = readJson(FOREST_V3_KEY, null);
    if (current && typeof current === "object" && current.activities) {
      return sanitizeForestState(current);
    }
    const migrated = migrateLegacyForestState();
    if (migrated) {
      const safeMigrated = sanitizeForestState(migrated);
      writeJson(FOREST_V3_KEY, safeMigrated);
      return safeMigrated;
    }
    return createForestState();
  }

  function getAlphabetJourney(forestState) {
    const state = forestState || loadForestState();
    const activities = state.activities || {};
    const learningCompleted = FOREST_LEARNING_IDS.reduce(function (count, id) {
      return count + (activities[id] && activities[id].isComplete ? 1 : 0);
    }, 0);
    const practiceCompleted = FOREST_PRACTICE_IDS.reduce(function (count, id) {
      return count + (activities[id] && activities[id].isComplete ? 1 : 0);
    }, 0);
    const unlockedByRule = learningCompleted === 2 && practiceCompleted >= 2;
    const unlockedEarned = Boolean(state.completionRewarded && state.completionRewarded[NEXT_WORLD_UNLOCK_KEY]);
    return {
      learningCompletedCount: learningCompleted,
      practiceCompletedCount: practiceCompleted,
      unlockedByRule: unlockedByRule,
      unlocked: unlockedByRule || unlockedEarned,
      unlockedEarned: unlockedEarned,
      stars: Number(state.xp || 0),
      activities: FOREST_ACTIVITY_IDS.map(function (id) {
        const activity = activities[id] || createActivityState();
        return {
          id: id,
          currentIndex: clampIndex(activity.currentIndex, LETTER_COUNT - 1),
          completedCount: normalizeIndexList(activity.completedItems, LETTER_COUNT - 1).length,
          totalCount: LETTER_COUNT,
          isComplete: Boolean(activity.isComplete)
        };
      })
    };
  }

  function loadWorldProgress(worldKey, totalLessons) {
    const fallback = {
      lessonIndex: 0,
      stars: 0,
      completedLessons: [],
      done: { match: false, listen: false, build: false }
    };
    const raw = readJson("sanskritParichay.world." + worldKey + ".progress", fallback) || fallback;
    const completedLessons = Array.isArray(raw.completedLessons)
      ? raw.completedLessons.filter(function (value, index, arr) {
          return Number.isInteger(value) && value >= 0 && value < totalLessons && arr.indexOf(value) === index;
        })
      : [];
    const lessonIndex = clampIndex(Number(raw.lessonIndex || 0), Math.max(0, totalLessons - 1));
    const stars = Number.isFinite(raw.stars) ? Math.max(0, Math.floor(raw.stars)) : 0;
    return {
      lessonIndex: lessonIndex,
      stars: stars,
      completedLessons: completedLessons,
      completedLessonsCount: completedLessons.length,
      totalLessons: totalLessons,
      isComplete: completedLessons.length >= totalLessons
    };
  }

  function getProgressSnapshot(worldOrder, totalsByWorld) {
    const order = Array.isArray(worldOrder) ? worldOrder.slice() : [];
    const totals = totalsByWorld && typeof totalsByWorld === "object" ? totalsByWorld : {};
    const forest = loadForestState();
    const alphabet = getAlphabetJourney(forest);
    const worlds = {};
    let worldStars = 0;
    let worldsExplored = 0;
    let completedWorlds = 0;
    order.forEach(function (worldKey) {
      if (worldKey === "alphabet") return;
      const totalLessons = Number(totals[worldKey] || 3);
      const progress = loadWorldProgress(worldKey, totalLessons);
      worlds[worldKey] = progress;
      worldStars += progress.stars;
      if (progress.lessonIndex > 0 || progress.completedLessonsCount > 0 || progress.stars > 0) worldsExplored += 1;
      if (progress.isComplete) completedWorlds += 1;
    });
    const currentWorld = localStorage.getItem(LAST_WORLD_KEY) || "alphabet";
    return {
      currentWorld: currentWorld,
      alphabet: alphabet,
      worlds: worlds,
      totals: {
        worldsExplored: worldsExplored + 1,
        worldsCompleted: completedWorlds + (alphabet.unlocked ? 1 : 0),
        learningActivitiesCompleted: alphabet.learningCompletedCount,
        practiceActivitiesCompleted: alphabet.practiceCompletedCount,
        forestActivitiesCompleted: alphabet.activities.filter(function (activity) { return activity.isComplete; }).length,
        stars: alphabet.stars + worldStars
      }
    };
  }

  function isWorldUnlocked(worldKey, worldOrder, testMode, totalsByWorld) {
    if (testMode) return true;
    if (worldKey === "alphabet") return true;
    const order = Array.isArray(worldOrder) ? worldOrder.slice() : [];
    const index = order.indexOf(worldKey);
    if (index <= 0) return true;
    const snapshot = getProgressSnapshot(order, totalsByWorld);
    const previous = order[index - 1];
    if (previous === "alphabet") return snapshot.alphabet.unlocked;
    const previousProgress = snapshot.worlds[previous];
    return Boolean(previousProgress && previousProgress.isComplete);
  }

  function syncHomeAggregate(worldOrder, totalsByWorld) {
    const snapshot = getProgressSnapshot(worldOrder, totalsByWorld);
    const existing = readJson(HOME_KEY, { xp: 0, completed: [] }) || { xp: 0, completed: [] };
    const completedWorldKeys = Object.keys(snapshot.worlds).filter(function (worldKey) {
      return snapshot.worlds[worldKey].isComplete;
    });
    const merged = {
      xp: Math.max(Number(existing.xp || 0), snapshot.totals.stars),
      completed: completedWorldKeys
    };
    writeJson(HOME_KEY, merged);
    return merged;
  }

  globalScope.SPProgressStore = {
    keys: {
      FOREST_V3_KEY: FOREST_V3_KEY,
      FOREST_LEGACY_KEY: FOREST_LEGACY_KEY,
      FOREST_LEGACY_V1_KEY: FOREST_LEGACY_V1_KEY,
      FOREST_LEGACY_TREE_KEY: FOREST_LEGACY_TREE_KEY,
      FOREST_LEGACY_GARDEN_KEY: FOREST_LEGACY_GARDEN_KEY,
      HOME_KEY: HOME_KEY,
      LAST_WORLD_KEY: LAST_WORLD_KEY
    },
    loadForestState: loadForestState,
    getAlphabetJourney: getAlphabetJourney,
    getProgressSnapshot: getProgressSnapshot,
    isWorldUnlocked: isWorldUnlocked,
    syncHomeAggregate: syncHomeAggregate
  };
})(typeof window !== "undefined" ? window : globalThis);
