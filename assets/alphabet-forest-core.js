(function alphabetForestCoreModule(globalScope) {
  const STORAGE_KEY = "sanskritParichay.alphabetForest.v3";
  const LEGACY_KEYS = [
    "sanskritParichay.alphabetForest.progression.v1",
    "sanskritParichay.alphabetForest.progress",
    "sanskritParichay.alphabetForest.tree.progress",
    "sanskritParichay.alphabetForest.garden.learned"
  ];
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
  const LEGACY_ACTIVITY_MAP = {
    "magical-tree": "magical-tree",
    "letter-garden": "letter-garden",
    "listen-identify": "hear-and-pick",
    "letter-matching": "picture-match",
    "letter-tracing": "letter-tracing",
    "letter-hunt": "hidden-letter-hunt"
  };
  const LEGACY_DONE_FLAG_MAP = {
    hear: "hear-and-pick",
    picture: "picture-match",
    arrange: "arrange-word",
    flash: "flashcard-flip",
    feed: "feed-mithu",
    trace: "letter-tracing",
    hunt: "hidden-letter-hunt"
  };

  function clampIndex(value, max) {
    if (!Number.isFinite(value)) return 0;
    if (value < 0) return 0;
    if (value > max) return max;
    return Math.floor(value);
  }

  function uniqueIndexList(values, max) {
    if (!Array.isArray(values)) return [];
    const seen = new Set();
    const cleaned = [];
    values.forEach(function eachValue(value) {
      if (!Number.isFinite(value)) return;
      const normalized = clampIndex(value, max);
      if (seen.has(normalized)) return;
      seen.add(normalized);
      cleaned.push(normalized);
    });
    cleaned.sort(function sortAsc(a, b) { return a - b; });
    return cleaned;
  }

  function createActivityState(letterCount) {
    return {
      currentIndex: 0,
      completedItems: [],
      rewardedItems: [],
      answers: {},
      attempts: {},
      order: Array.from({ length: letterCount }, function mapValue(_, index) { return index; }),
      isComplete: false
    };
  }

  function createDefaultForestState(letterCount) {
    const activities = {};
    ACTIVITY_IDS.forEach(function eachActivity(activityId) {
      activities[activityId] = createActivityState(letterCount);
    });
    return {
      schemaVersion: 3,
      activities: activities,
      completionRewarded: {},
      worldCompleted: false,
      xp: 0
    };
  }

  function validateActivityState(activityState, letterCount) {
    const fallback = createActivityState(letterCount);
    if (!activityState || typeof activityState !== "object") return fallback;
    const safe = {
      currentIndex: clampIndex(activityState.currentIndex, letterCount - 1),
      completedItems: uniqueIndexList(activityState.completedItems, letterCount - 1),
      rewardedItems: uniqueIndexList(activityState.rewardedItems || activityState.completedItems, letterCount - 1),
      answers: activityState.answers && typeof activityState.answers === "object" ? activityState.answers : {},
      attempts: activityState.attempts && typeof activityState.attempts === "object" ? activityState.attempts : {},
      order: Array.isArray(activityState.order) && activityState.order.length === letterCount
        ? uniqueIndexList(activityState.order, letterCount - 1)
        : fallback.order.slice(),
      isComplete: Boolean(activityState.isComplete)
    };
    if (safe.order.length !== letterCount) safe.order = fallback.order.slice();
    safe.isComplete = safe.isComplete || safe.completedItems.length >= letterCount;
    return safe;
  }

  function validateForestState(state, letterCount) {
    const safeState = createDefaultForestState(letterCount);
    if (!state || typeof state !== "object") return safeState;
    const incomingActivities = state.activities && typeof state.activities === "object" ? state.activities : {};
    ACTIVITY_IDS.forEach(function eachActivity(activityId) {
      safeState.activities[activityId] = validateActivityState(incomingActivities[activityId], letterCount);
    });
    safeState.xp = Number.isFinite(state.xp) ? Math.max(0, Math.floor(state.xp)) : 0;
    safeState.completionRewarded = state.completionRewarded && typeof state.completionRewarded === "object"
      ? state.completionRewarded
      : {};
    safeState.worldCompleted = Boolean(state.worldCompleted);
    return safeState;
  }

  function migrateFromLegacyProgression(legacy, nextState, letterCount) {
    if (!legacy || typeof legacy !== "object" || !legacy.state || !legacy.state.activities) return nextState;
    const source = legacy.state.activities;
    Object.keys(source).forEach(function eachLegacyActivity(legacyId) {
      const mappedId = LEGACY_ACTIVITY_MAP[legacyId];
      if (!mappedId) return;
      const target = nextState.activities[mappedId];
      const from = source[legacyId] || {};
      target.currentIndex = clampIndex(from.currentLetterIndex, letterCount - 1);
      target.completedItems = uniqueIndexList(from.completedLetters, letterCount - 1);
      target.isComplete = Boolean(from.isCompleted) || target.completedItems.length >= letterCount;
    });
    return nextState;
  }

  function migrateForestState(oldState, letterCount) {
    const base = createDefaultForestState(letterCount);
    if (!oldState || typeof oldState !== "object") return base;
    if (Array.isArray(oldState)) {
      base.activities["letter-garden"].completedItems = uniqueIndexList(oldState, letterCount - 1);
      return validateForestState(base, letterCount);
    }
    if (oldState.schemaVersion === 3) return validateForestState(oldState, letterCount);
    const migrated = migrateFromLegacyProgression(oldState, base, letterCount);
    if (oldState.done && typeof oldState.done === "object") {
      Object.keys(oldState.done).forEach(function eachDoneFlag(flag) {
        const mapped = LEGACY_DONE_FLAG_MAP[flag];
        if (!mapped || !oldState.done[flag]) return;
        migrated.activities[mapped].isComplete = true;
        migrated.completionRewarded[mapped] = true;
      });
    }
    return validateForestState(migrated, letterCount);
  }

  function computeGlobalProgress(state) {
    const completed = ACTIVITY_IDS.filter(function eachActivity(activityId) {
      return Boolean(state.activities[activityId] && state.activities[activityId].isComplete);
    }).length;
    return {
      completedActivityCount: completed,
      totalActivities: ACTIVITY_IDS.length,
      globalPercent: (completed / ACTIVITY_IDS.length) * 100
    };
  }

  function markCurrentItemCompleted(state, activityId, rewardPoints) {
    const activity = state.activities[activityId];
    if (!activity) return false;
    const index = clampIndex(activity.currentIndex, activity.order.length - 1);
    if (!activity.completedItems.includes(index)) {
      activity.completedItems.push(index);
      activity.completedItems.sort(function sortAsc(a, b) { return a - b; });
    }
    if (!activity.rewardedItems.includes(index)) {
      activity.rewardedItems.push(index);
      activity.rewardedItems.sort(function sortAsc(a, b) { return a - b; });
      state.xp += Math.max(0, Number.isFinite(rewardPoints) ? rewardPoints : 0);
    }
    return true;
  }

  function goPrevious(state, activityId) {
    const activity = state.activities[activityId];
    if (!activity) return;
    activity.currentIndex = clampIndex(activity.currentIndex - 1, activity.order.length - 1);
  }

  function goNext(state, activityId) {
    const activity = state.activities[activityId];
    if (!activity) return;
    activity.currentIndex = clampIndex(activity.currentIndex + 1, activity.order.length - 1);
  }

  function retryCurrent(state, activityId) {
    const activity = state.activities[activityId];
    if (!activity) return;
    const index = clampIndex(activity.currentIndex, activity.order.length - 1);
    delete activity.answers[index];
  }

  function resetActivity(state, activityId) {
    const current = state.activities[activityId];
    if (!current || !current.isComplete) return false;
    const letterCount = current.order.length;
    const rewardedItems = Array.isArray(current.rewardedItems) ? current.rewardedItems.slice() : [];
    state.activities[activityId] = createActivityState(letterCount);
    state.activities[activityId].rewardedItems = rewardedItems;
    state.worldCompleted = false;
    return true;
  }

  function finalizeActivity(state, activityId) {
    const activity = state.activities[activityId];
    if (!activity) return false;
    if (activity.completedItems.length < activity.order.length) return false;
    activity.isComplete = true;
    state.completionRewarded[activityId] = true;
    const global = computeGlobalProgress(state);
    state.worldCompleted = global.completedActivityCount === global.totalActivities;
    return true;
  }

  function createStateApi(storage, letterCount) {
    function readRaw(key) {
      try {
        return storage.getItem(key);
      } catch (_error) {
        return null;
      }
    }

    function parseRaw(value) {
      if (!value) return null;
      try {
        return JSON.parse(value);
      } catch (_error) {
        if (typeof console !== "undefined" && console.warn) {
          console.warn("Alphabet Forest: invalid saved state ignored.");
        }
        return null;
      }
    }

    function loadState() {
      const current = parseRaw(readRaw(STORAGE_KEY));
      if (current) return migrateForestState(current, letterCount);
      for (let index = 0; index < LEGACY_KEYS.length; index += 1) {
        const legacy = parseRaw(readRaw(LEGACY_KEYS[index]));
        if (!legacy) continue;
        return migrateForestState(legacy, letterCount);
      }
      return createDefaultForestState(letterCount);
    }

    function saveState(state) {
      try {
        storage.setItem(STORAGE_KEY, JSON.stringify(state));
      } catch (_error) {
        return false;
      }
      return true;
    }

    return {
      loadState: loadState,
      saveState: saveState
    };
  }

  const api = {
    STORAGE_KEY: STORAGE_KEY,
    LEGACY_KEYS: LEGACY_KEYS.slice(),
    ACTIVITY_IDS: ACTIVITY_IDS.slice(),
    createActivityState: createActivityState,
    createDefaultForestState: createDefaultForestState,
    validateForestState: validateForestState,
    migrateForestState: migrateForestState,
    computeGlobalProgress: computeGlobalProgress,
    markCurrentItemCompleted: markCurrentItemCompleted,
    goPrevious: goPrevious,
    goNext: goNext,
    retryCurrent: retryCurrent,
    resetActivity: resetActivity,
    finalizeActivity: finalizeActivity,
    createStateApi: createStateApi
  };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  }
  if (globalScope) {
    globalScope.SPAlphabetForestCore = api;
  }
})(typeof window !== "undefined" ? window : globalThis);
