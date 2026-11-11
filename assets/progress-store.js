(function initProgressStore(globalScope) {
  const FOREST_V3_KEY = "sanskritParichay.alphabetForest.v3";
  const FOREST_LEGACY_KEY = "sanskritParichay.alphabetForest.progress";
  const FOREST_LEGACY_V1_KEY = "sanskritParichay.alphabetForest.progression.v1";
  const FOREST_LEGACY_TREE_KEY = "sanskritParichay.alphabetForest.tree.progress";
  const FOREST_LEGACY_GARDEN_KEY = "sanskritParichay.alphabetForest.garden.learned";
  const HOME_KEY = "sanskritParichay.home.progress";
  const LAST_WORLD_KEY = "sanskritParichay.lastWorld";
  const CHALLENGE_KEY = "sanskritParichay.dailyChallenge.progress";
  const WORLD_UNLOCKS_KEY = "sanskritParichay.world.unlocks.v1";
  const LETTER_COUNT = 48;
  const NEXT_WORLD_UNLOCK_KEY = "next-world-unlock-v1";
  const MIN_PRACTICE_FOR_UNLOCK = 2;
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
  const WORLD_PRACTICE_IDS = ["match", "listen", "build"];
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

  function migrateSingleLegacyForestState(legacy) {
    if (!legacy || typeof legacy !== "object") return null;
    const migrated = createForestState();
    if (Array.isArray(legacy)) {
      migrated.activities["letter-garden"].completedItems = normalizeIndexList(legacy, LETTER_COUNT - 1);
      migrated.activities["letter-garden"].isComplete = migrated.activities["letter-garden"].completedItems.length >= LETTER_COUNT;
      return sanitizeForestState(migrated);
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
    if (migrated.activities["magical-tree"].isComplete) {
      const practiceDone = FOREST_PRACTICE_IDS.reduce(function (count, id) {
        return count + (migrated.activities[id].isComplete ? 1 : 0);
      }, 0);
      if (practiceDone >= MIN_PRACTICE_FOR_UNLOCK) migrated.completionRewarded[NEXT_WORLD_UNLOCK_KEY] = true;
    }
    return sanitizeForestState(migrated);
  }

  function mergeForestStates(baseState, incomingState) {
    const base = sanitizeForestState(baseState);
    const incoming = sanitizeForestState(incomingState);
    const merged = createForestState();
    FOREST_ACTIVITY_IDS.forEach(function (id) {
      const mergedCompleted = normalizeIndexList(
        (base.activities[id].completedItems || []).concat(incoming.activities[id].completedItems || []),
        LETTER_COUNT - 1
      );
      const mergedRewarded = normalizeIndexList(
        (base.activities[id].rewardedItems || []).concat(incoming.activities[id].rewardedItems || []),
        LETTER_COUNT - 1
      );
      merged.activities[id].currentIndex = clampIndex(Math.max(base.activities[id].currentIndex || 0, incoming.activities[id].currentIndex || 0), LETTER_COUNT - 1);
      merged.activities[id].completedItems = mergedCompleted;
      merged.activities[id].rewardedItems = mergedRewarded;
      merged.activities[id].answers = Object.assign({}, base.activities[id].answers || {}, incoming.activities[id].answers || {});
      merged.activities[id].attempts = Object.assign({}, base.activities[id].attempts || {}, incoming.activities[id].attempts || {});
      merged.activities[id].order = Array.isArray(base.activities[id].order) && base.activities[id].order.length === LETTER_COUNT
        ? base.activities[id].order.slice()
        : incoming.activities[id].order.slice();
      merged.activities[id].isComplete = Boolean(base.activities[id].isComplete || incoming.activities[id].isComplete || mergedCompleted.length >= LETTER_COUNT);
    });
    merged.completionRewarded = Object.assign({}, base.completionRewarded || {}, incoming.completionRewarded || {});
    merged.worldCompleted = Boolean(base.worldCompleted || incoming.worldCompleted);
    merged.xp = Math.max(Number(base.xp || 0), Number(incoming.xp || 0));
    return sanitizeForestState(merged);
  }

  function migrateLegacyForestState() {
    const legacyKeys = [
      FOREST_LEGACY_KEY,
      FOREST_LEGACY_V1_KEY,
      FOREST_LEGACY_TREE_KEY,
      FOREST_LEGACY_GARDEN_KEY
    ];
    let merged = null;
    legacyKeys.forEach(function (key) {
      const legacy = readJson(key, null);
      const migrated = migrateSingleLegacyForestState(legacy);
      if (!migrated) return;
      merged = merged ? mergeForestStates(merged, migrated) : migrated;
    });
    if (!merged) return null;
    if (merged.activities["magical-tree"].isComplete) {
      const practiceDone = FOREST_PRACTICE_IDS.reduce(function (count, id) {
        return count + (merged.activities[id].isComplete ? 1 : 0);
      }, 0);
      if (practiceDone >= MIN_PRACTICE_FOR_UNLOCK) merged.completionRewarded[NEXT_WORLD_UNLOCK_KEY] = true;
    }
    return sanitizeForestState(merged);
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
    const treeComplete = Boolean(activities["magical-tree"] && activities["magical-tree"].isComplete);
    const unlockedByRule = treeComplete && practiceCompleted >= MIN_PRACTICE_FOR_UNLOCK;
    const unlockedEarned = Boolean(state.completionRewarded && state.completionRewarded[NEXT_WORLD_UNLOCK_KEY]);
    return {
      treeComplete: treeComplete,
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
      done: { match: false, listen: false, build: false },
      practiceCompleted: { match: false, listen: false, build: false }
    };
    const raw = readJson("sanskritParichay.world." + worldKey + ".progress", fallback) || fallback;
    const completedLessons = Array.isArray(raw.completedLessons)
      ? raw.completedLessons.filter(function (value, index, arr) {
          return Number.isInteger(value) && value >= 0 && value < totalLessons && arr.indexOf(value) === index;
        })
      : [];
    const lessonIndex = clampIndex(Number(raw.lessonIndex || 0), Math.max(0, totalLessons - 1));
    const stars = Number.isFinite(raw.stars) ? Math.max(0, Math.floor(raw.stars)) : 0;
    const done = raw.done && typeof raw.done === "object" ? raw.done : {};
    const persistedPractice = raw.practiceCompleted && typeof raw.practiceCompleted === "object" ? raw.practiceCompleted : {};
    const practiceCompleted = {};
    WORLD_PRACTICE_IDS.forEach(function (id) {
      practiceCompleted[id] = Boolean((persistedPractice && persistedPractice[id]) || (done && done[id]));
    });
    Object.keys(done || {}).forEach(function (id) {
      if (Object.prototype.hasOwnProperty.call(practiceCompleted, id)) return;
      practiceCompleted[id] = Boolean(done[id]);
    });
    Object.keys(persistedPractice || {}).forEach(function (id) {
      if (Object.prototype.hasOwnProperty.call(practiceCompleted, id)) return;
      practiceCompleted[id] = Boolean(persistedPractice[id]);
    });
    const practiceCompletedCount = Object.keys(practiceCompleted).reduce(function (count, id) {
      return count + (practiceCompleted[id] ? 1 : 0);
    }, 0);
    return {
      lessonIndex: lessonIndex,
      stars: stars,
      completedLessons: completedLessons,
      completedLessonsCount: completedLessons.length,
      totalLessons: totalLessons,
      isComplete: completedLessons.length >= totalLessons,
      practiceCompleted: practiceCompleted,
      practiceCompletedCount: practiceCompletedCount
    };
  }

  function normalizeWorldOrder(worldOrder) {
    if (Array.isArray(worldOrder) && worldOrder.length) return worldOrder.slice();
    return ["alphabet", "words", "animals", "numbers", "colours", "sentences", "stories", "culture"];
  }

  function loadUnlockState(worldOrder) {
    const order = normalizeWorldOrder(worldOrder);
    const raw = readJson(WORLD_UNLOCKS_KEY, null);
    const unlocked = Array.isArray(raw && raw.unlocked) ? raw.unlocked.slice() : [];
    const clean = unlocked.filter(function (key, index, arr) {
      return order.includes(key) && arr.indexOf(key) === index;
    });
    if (!clean.includes("alphabet")) clean.unshift("alphabet");
    return { unlocked: clean };
  }

  function saveUnlockState(state, worldOrder) {
    const order = normalizeWorldOrder(worldOrder);
    const unlocked = Array.isArray(state && state.unlocked) ? state.unlocked : [];
    const clean = unlocked.filter(function (key, index, arr) {
      return order.includes(key) && arr.indexOf(key) === index;
    });
    if (!clean.includes("alphabet")) clean.unshift("alphabet");
    writeJson(WORLD_UNLOCKS_KEY, { unlocked: clean });
    return clean;
  }

  function syncSequentialUnlocks(worldOrder, totalsByWorld) {
    const order = normalizeWorldOrder(worldOrder);
    const totals = totalsByWorld && typeof totalsByWorld === "object" ? totalsByWorld : {};
    const unlockState = loadUnlockState(order);
    const unlocked = unlockState.unlocked.slice();
    const forest = loadForestState();
    const alphabet = getAlphabetJourney(forest);
    let changed = false;

    for (let index = 1; index < order.length; index += 1) {
      const key = order[index];
      if (unlocked.includes(key)) continue;
      const previous = order[index - 1];
      let canUnlock = false;
      if (previous === "alphabet") {
        canUnlock = Boolean(alphabet.treeComplete && alphabet.practiceCompletedCount >= MIN_PRACTICE_FOR_UNLOCK);
      } else {
        const totalLessons = Number(totals[previous] || 3);
        const previousProgress = loadWorldProgress(previous, totalLessons);
        canUnlock = previousProgress.practiceCompletedCount >= MIN_PRACTICE_FOR_UNLOCK;
      }
      if (canUnlock) {
        unlocked.push(key);
        changed = true;
      } else {
        break;
      }
    }

    if (changed) {
      saveUnlockState({ unlocked: unlocked }, order);
    } else {
      saveUnlockState(unlockState, order);
    }
    return unlocked;
  }

  function getProgressSnapshot(worldOrder, totalsByWorld) {
    const order = normalizeWorldOrder(worldOrder);
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
      if (progress.lessonIndex > 0 || progress.completedLessonsCount > 0 || progress.stars > 0 || progress.practiceCompletedCount > 0) {
        worldsExplored += 1;
      }
      if (progress.isComplete) completedWorlds += 1;
    });
    const currentWorld = localStorage.getItem(LAST_WORLD_KEY) || "alphabet";
    return {
      currentWorld: order.includes(currentWorld) ? currentWorld : "alphabet",
      alphabet: alphabet,
      worlds: worlds,
      totals: {
        worldsExplored: worldsExplored + 1,
        worldsCompleted: completedWorlds,
        learningActivitiesCompleted: alphabet.learningCompletedCount,
        practiceActivitiesCompleted: alphabet.practiceCompletedCount,
        forestActivitiesCompleted: alphabet.activities.filter(function (activity) { return activity.isComplete; }).length,
        stars: alphabet.stars + worldStars
      }
    };
  }

  function isWorldUnlocked(worldKey, worldOrder, testMode, totalsByWorld) {
    if (testMode) return true;
    const order = normalizeWorldOrder(worldOrder);
    if (!order.includes(worldKey)) return false;
    const unlocked = syncSequentialUnlocks(order, totalsByWorld);
    return unlocked.includes(worldKey);
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

  function resetProgress(worldOrder) {
    const order = normalizeWorldOrder(worldOrder);
    localStorage.removeItem(FOREST_V3_KEY);
    localStorage.removeItem(FOREST_LEGACY_KEY);
    localStorage.removeItem(FOREST_LEGACY_V1_KEY);
    localStorage.removeItem(FOREST_LEGACY_TREE_KEY);
    localStorage.removeItem(FOREST_LEGACY_GARDEN_KEY);
    localStorage.removeItem(HOME_KEY);
    localStorage.removeItem(CHALLENGE_KEY);
    order.forEach(function (worldKey) {
      localStorage.removeItem("sanskritParichay.world." + worldKey + ".progress");
    });
    saveUnlockState({ unlocked: ["alphabet"] }, order);
    localStorage.setItem(LAST_WORLD_KEY, "alphabet");
    return true;
  }

  globalScope.SPProgressStore = {
    keys: {
      FOREST_V3_KEY: FOREST_V3_KEY,
      FOREST_LEGACY_KEY: FOREST_LEGACY_KEY,
      FOREST_LEGACY_V1_KEY: FOREST_LEGACY_V1_KEY,
      FOREST_LEGACY_TREE_KEY: FOREST_LEGACY_TREE_KEY,
      FOREST_LEGACY_GARDEN_KEY: FOREST_LEGACY_GARDEN_KEY,
      HOME_KEY: HOME_KEY,
      LAST_WORLD_KEY: LAST_WORLD_KEY,
      CHALLENGE_KEY: CHALLENGE_KEY,
      WORLD_UNLOCKS_KEY: WORLD_UNLOCKS_KEY
    },
    loadForestState: loadForestState,
    getAlphabetJourney: getAlphabetJourney,
    getProgressSnapshot: getProgressSnapshot,
    isWorldUnlocked: isWorldUnlocked,
    syncHomeAggregate: syncHomeAggregate,
    syncSequentialUnlocks: syncSequentialUnlocks,
    resetProgress: resetProgress
  };
})(typeof window !== "undefined" ? window : globalThis);
