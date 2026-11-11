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
  const UNLOCK_STAR_TARGET = 50;
  const UNLOCK_GEM_TARGET = 1;
  const CHALLENGE_GEMS_PER_DAY = 2;
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
  const WORLD_ACTIVITY_IDS = ["match", "listen", "build"];
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
      xp: 0,
      gems: 0
    };
  }

  function getForestCurrentRewards(forestState) {
    const state = sanitizeForestState(forestState || loadForestState());
    const lifetimeStars = Math.max(0, Math.floor(Number(state.xp || 0)));
    const fallbackGems = FOREST_ACTIVITY_IDS.reduce(function (count, id) {
      return count + (state.completionRewarded && (state.completionRewarded["gem:" + id] || state.completionRewarded[id]) ? 1 : 0);
    }, 0);
    const lifetimeGems = Math.max(fallbackGems, Math.max(0, Math.floor(Number(state.gems || 0))));
    return {
      currentStars: lifetimeStars,
      currentGems: lifetimeGems,
      lifetimeStars: lifetimeStars,
      lifetimeGems: lifetimeGems
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
    const fallbackGems = FOREST_ACTIVITY_IDS.reduce(function (count, id) {
      return count + (state.completionRewarded && (state.completionRewarded["gem:" + id] || state.completionRewarded[id]) ? 1 : 0);
    }, 0);
    state.gems = Number.isFinite(input.gems)
      ? Math.max(0, Math.floor(input.gems))
      : fallbackGems;
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
    const rewards = getForestCurrentRewards(state);
    const unlockedByRule = rewards.currentStars >= UNLOCK_STAR_TARGET && rewards.currentGems >= UNLOCK_GEM_TARGET;
    return {
      treeComplete: Boolean(activities["magical-tree"] && activities["magical-tree"].isComplete),
      learningCompletedCount: learningCompleted,
      practiceCompletedCount: practiceCompleted,
      unlockedByRule: unlockedByRule,
      unlocked: unlockedByRule,
      unlockedEarned: false,
      stars: rewards.lifetimeStars,
      currentStars: rewards.currentStars,
      currentGems: rewards.currentGems,
      lifetimeGems: rewards.lifetimeGems,
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
      gems: 0,
      completedLessons: [],
      done: { match: false, listen: false, build: false },
      practiceCompleted: { match: false, listen: false, build: false },
      completedActivities: {},
      rewardedActivities: {},
      rewardedGroupBonuses: {},
      rewardedActivityGems: {}
    };
    const raw = readJson("sanskritParichay.world." + worldKey + ".progress", fallback) || fallback;
    const completedLessons = Array.isArray(raw.completedLessons)
      ? raw.completedLessons.filter(function (value, index, arr) {
          return Number.isInteger(value) && value >= 0 && value < totalLessons && arr.indexOf(value) === index;
        })
      : [];
    const lessonIndex = clampIndex(Number(raw.lessonIndex || 0), Math.max(0, totalLessons - 1));
    const stars = Number.isFinite(raw.stars) ? Math.max(0, Math.floor(raw.stars)) : 0;
    const gems = Number.isFinite(raw.gems) ? Math.max(0, Math.floor(raw.gems)) : 0;
    const done = raw.done && typeof raw.done === "object" ? raw.done : {};
    const persistedPractice = raw.practiceCompleted && typeof raw.practiceCompleted === "object" ? raw.practiceCompleted : {};
    const completedActivities = raw.completedActivities && typeof raw.completedActivities === "object" ? raw.completedActivities : {};
    const rewardedActivities = raw.rewardedActivities && typeof raw.rewardedActivities === "object" ? raw.rewardedActivities : {};
    const rewardedGroupBonuses = raw.rewardedGroupBonuses && typeof raw.rewardedGroupBonuses === "object" ? raw.rewardedGroupBonuses : {};
    const rewardedActivityGems = raw.rewardedActivityGems && typeof raw.rewardedActivityGems === "object" ? raw.rewardedActivityGems : {};
    const practiceCompleted = {};
    WORLD_ACTIVITY_IDS.forEach(function (id) {
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
    const currentGems = gems;
    const currentStars = stars;
    return {
      lessonIndex: lessonIndex,
      stars: stars,
      gems: gems,
      completedLessons: completedLessons,
      completedLessonsCount: completedLessons.length,
      totalLessons: totalLessons,
      isComplete: completedLessons.length >= totalLessons,
      practiceCompleted: practiceCompleted,
      practiceCompletedCount: practiceCompletedCount,
      completedActivities: completedActivities,
      rewardedActivities: rewardedActivities,
      rewardedGroupBonuses: rewardedGroupBonuses,
      rewardedActivityGems: rewardedActivityGems,
      currentStars: currentStars,
      currentGems: currentGems,
      unlockEligible: currentStars >= UNLOCK_STAR_TARGET && currentGems >= UNLOCK_GEM_TARGET
    };
  }

  function normalizeWorldOrder(worldOrder) {
    if (Array.isArray(worldOrder) && worldOrder.length) return worldOrder.slice();
    return ["alphabet", "animals", "numbers", "colours", "words", "sentences", "stories", "culture"];
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
    const previousState = loadUnlockState(order).unlocked.slice();
    const alphabet = getAlphabetJourney(loadForestState());
    const unlocked = previousState.filter(function (key, index, arr) {
      return key === "alphabet" || (order.includes(key) && arr.indexOf(key) === index);
    });
    if (!unlocked.includes("alphabet")) unlocked.unshift("alphabet");

    for (let index = 1; index < order.length; index += 1) {
      const key = order[index];
      if (unlocked.includes(key)) continue;
      const previous = order[index - 1];
      if (!unlocked.includes(previous)) break;
      let canUnlock = false;
      if (previous === "alphabet") {
        canUnlock = Boolean(alphabet.currentStars >= UNLOCK_STAR_TARGET && alphabet.currentGems >= UNLOCK_GEM_TARGET);
      } else {
        const totalLessons = Number(totals[previous] || 3);
        const previousProgress = loadWorldProgress(previous, totalLessons);
        canUnlock = Boolean(previousProgress.currentStars >= UNLOCK_STAR_TARGET && previousProgress.currentGems >= UNLOCK_GEM_TARGET);
      }
      if (!canUnlock) break;
      unlocked.push(key);
    }

    const changed = unlocked.length !== previousState.length
      || unlocked.some(function (key, index) { return previousState[index] !== key; });
    if (changed) saveUnlockState({ unlocked: unlocked }, order);
    else saveUnlockState({ unlocked: previousState }, order);
    return unlocked;
  }

  function getProgressSnapshot(worldOrder, totalsByWorld) {
    const order = normalizeWorldOrder(worldOrder);
    const totals = totalsByWorld && typeof totalsByWorld === "object" ? totalsByWorld : {};
    const forest = loadForestState();
    const alphabet = getAlphabetJourney(forest);
    const worlds = {};
    let worldStars = 0;
    let worldGems = 0;
    let worldsExplored = 0;
    let completedWorlds = 0;
    order.forEach(function (worldKey) {
      if (worldKey === "alphabet") return;
      const totalLessons = Number(totals[worldKey] || 3);
      const progress = loadWorldProgress(worldKey, totalLessons);
      worlds[worldKey] = progress;
      worldStars += progress.stars;
      worldGems += progress.gems;
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
      },
      rewards: {
        lifetimeStars: alphabet.stars + worldStars,
        lifetimeGems: getHomeRewardState().challengeGems + alphabet.lifetimeGems + worldGems
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
    const existing = getHomeRewardState();
    const completedWorldKeys = Object.keys(snapshot.worlds).filter(function (worldKey) {
      return snapshot.worlds[worldKey].isComplete;
    });
    const worldGems = Object.keys(snapshot.worlds).reduce(function (count, key) {
      return count + Number((snapshot.worlds[key] && snapshot.worlds[key].gems) || 0);
    }, 0);
    const alphabetGems = Number(snapshot.alphabet && snapshot.alphabet.lifetimeGems || 0);
    const challengeGems = Number(existing.challengeGems || 0);
    const computedLifetimeGems = Math.max(0, Math.floor(worldGems + alphabetGems + challengeGems));
    const lifetimeGems = Math.max(Math.max(0, Math.floor(Number(existing.gems || 0))), computedLifetimeGems);
    const merged = {
      gems: lifetimeGems,
      challengeGems: challengeGems,
      completed: completedWorldKeys,
      lifetimeStars: Number(snapshot.totals.stars || 0)
    };
    writeJson(HOME_KEY, merged);
    return merged;
  }

  function getHomeRewardState() {
    const existing = readJson(HOME_KEY, { gems: 0, completed: [] }) || { gems: 0, completed: [] };
    const challengeGems = Number.isFinite(Number(existing.challengeGems))
      ? Math.max(0, Math.floor(Number(existing.challengeGems)))
      : 0;
    const legacyXp = Number.isFinite(Number(existing.xp))
      ? Math.max(0, Math.floor(Number(existing.xp)))
      : 0;
    const gems = Number.isFinite(Number(existing.gems))
      ? Math.max(0, Math.floor(Number(existing.gems)))
      : legacyXp;
    return {
      gems: gems,
      challengeGems: challengeGems,
      completed: Array.isArray(existing.completed) ? existing.completed.slice() : []
    };
  }

  function awardDailyChallengeGems(dateKey) {
    const key = CHALLENGE_KEY + ".rewards";
    const rewards = readJson(key, { days: {}, totalGems: 0 }) || { days: {}, totalGems: 0 };
    if (!rewards.days || typeof rewards.days !== "object") rewards.days = {};
    if (dateKey && rewards.days[dateKey]) return false;
    if (dateKey) rewards.days[dateKey] = true;
    rewards.totalGems = Math.max(0, Math.floor(Number(rewards.totalGems || 0))) + CHALLENGE_GEMS_PER_DAY;
    writeJson(key, rewards);
    const home = getHomeRewardState();
    home.challengeGems = rewards.totalGems;
    writeJson(HOME_KEY, {
      gems: Math.max(0, Math.floor(Number(home.gems || 0))),
      challengeGems: home.challengeGems,
      completed: home.completed
    });
    return true;
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

  function resetWorldProgress(worldKey, worldOrder, totalsByWorld) {
    const order = normalizeWorldOrder(worldOrder);
    const totals = totalsByWorld && typeof totalsByWorld === "object" ? totalsByWorld : {};
    if (!order.includes(worldKey)) return false;
    if (worldKey === "alphabet") {
      const state = sanitizeForestState(loadForestState());
      FOREST_ACTIVITY_IDS.forEach(function (activityId) {
        const prev = state.activities[activityId] || createActivityState();
        const next = createActivityState();
        next.rewardedItems = normalizeIndexList(prev.rewardedItems || [], LETTER_COUNT - 1);
        state.activities[activityId] = next;
      });
      state.worldCompleted = false;
      writeJson(FOREST_V3_KEY, state);
    } else {
      const totalLessons = Number(totals[worldKey] || 3);
      const progress = loadWorldProgress(worldKey, totalLessons);
      writeJson("sanskritParichay.world." + worldKey + ".progress", {
        lessonIndex: 0,
        stars: Number(progress.stars || 0),
        gems: Number(progress.gems || 0),
        completedLessons: [],
        done: { match: false, listen: false, build: false },
        practiceCompleted: { match: false, listen: false, build: false },
        completedActivities: {},
        rewardedActivities: progress.rewardedActivities || {},
        rewardedGroupBonuses: progress.rewardedGroupBonuses || {},
        rewardedActivityGems: progress.rewardedActivityGems || {}
      });
    }
    syncSequentialUnlocks(order, totals);
    syncHomeAggregate(order, totals);
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
    resetProgress: resetProgress,
    resetWorldProgress: resetWorldProgress,
    awardDailyChallengeGems: awardDailyChallengeGems
  };
})(typeof window !== "undefined" ? window : globalThis);
