(function initProgressionController(rootFactory) {
  if (typeof module !== "undefined" && module.exports) {
    module.exports = rootFactory();
    return;
  }
  if (typeof window !== "undefined") {
    window.SPProgressionController = rootFactory();
  }
})(function progressionControllerFactory() {
  const DEFAULT_STORAGE_KEY = ((typeof window !== "undefined" && window.SP_STORAGE_PREFIX) || "sanskritParichay") + ".alphabetForest.progression.v1";

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function uniqueSortedIndexes(items, letterCount) {
    return Array.from(
      new Set(
        (items || [])
          .map(function toIndex(value) { return Number(value); })
          .filter(function isValid(value) { return Number.isInteger(value) && value >= 0 && value < letterCount; })
      )
    ).sort(function sortAscending(a, b) { return a - b; });
  }

  function createInitialActivityState(letterCount) {
    return {
      currentLetterIndex: 0,
      completedLetters: [],
      retryToken: 0,
      completedAtLeastOnce: false,
      completionAwarded: false
    };
  }

  function createProgressionController(options) {
    if (!options || !Array.isArray(options.activityIds) || !options.activityIds.length) {
      throw new Error("activityIds is required.");
    }
    const activityIds = options.activityIds.slice();
    const letterCount = Number(options.letterCount) || 48;
    const storageKey = options.storageKey || DEFAULT_STORAGE_KEY;
    const storage = options.storage;
    const perLetterXP = Number(options.perLetterXP || 1);
    const activityCompletionXP = Number(options.activityCompletionXP || 8);

    if (!storage || typeof storage.getItem !== "function" || typeof storage.setItem !== "function") {
      throw new Error("A storage object with getItem/setItem is required.");
    }

    function buildEmptyState() {
      const activities = {};
      activityIds.forEach(function eachActivity(activityId) {
        activities[activityId] = createInitialActivityState(letterCount);
      });
      return {
        currentWorld: "alphabet-forest",
        currentLesson: "alphabet-letters",
        currentActivityIndex: 0,
        xp: 0,
        badges: [],
        completedActivities: [],
        worldCompleted: false,
        activities: activities
      };
    }

    function normalizeState(raw) {
      const fallback = buildEmptyState();
      if (!raw || typeof raw !== "object") return fallback;

      const normalized = {
        currentWorld: raw.currentWorld || fallback.currentWorld,
        currentLesson: raw.currentLesson || fallback.currentLesson,
        currentActivityIndex: clamp(Number(raw.currentActivityIndex) || 0, 0, activityIds.length - 1),
        xp: Number(raw.xp) || 0,
        badges: Array.isArray(raw.badges) ? raw.badges.slice() : [],
        completedActivities: Array.isArray(raw.completedActivities)
          ? raw.completedActivities.filter(function knownActivity(id) { return activityIds.indexOf(id) !== -1; })
          : [],
        worldCompleted: Boolean(raw.worldCompleted),
        activities: {}
      };

      activityIds.forEach(function eachActivity(activityId) {
        const source = raw.activities && raw.activities[activityId] ? raw.activities[activityId] : {};
        normalized.activities[activityId] = {
          currentLetterIndex: clamp(Number(source.currentLetterIndex) || 0, 0, letterCount - 1),
          completedLetters: uniqueSortedIndexes(source.completedLetters, letterCount),
          retryToken: Number(source.retryToken) || 0,
          completedAtLeastOnce: Boolean(source.completedAtLeastOnce),
          completionAwarded: Boolean(source.completionAwarded)
        };
      });

      return normalized;
    }

    function loadState() {
      const raw = storage.getItem(storageKey);
      if (!raw) return buildEmptyState();
      try {
        return normalizeState(JSON.parse(raw));
      } catch (_error) {
        return buildEmptyState();
      }
    }

    let state = loadState();

    function saveState() {
      storage.setItem(storageKey, JSON.stringify(state));
    }

    function getActivityState(activityId) {
      const activity = state.activities[activityId];
      if (!activity) throw new Error("Unknown activity id: " + activityId);
      return activity;
    }

    function ensureCompletedActivities() {
      state.completedActivities = activityIds.filter(function completed(id) {
        return getActivityState(id).completedAtLeastOnce;
      });
      state.worldCompleted = state.completedActivities.length === activityIds.length;
      if (state.worldCompleted && state.badges.indexOf("alphabet-forest-complete") === -1) {
        state.badges.push("alphabet-forest-complete");
      }
    }

    function getCurrentActivityId() {
      return activityIds[state.currentActivityIndex];
    }

    function getCurrentLetterIndex(activityId) {
      return getActivityState(activityId).currentLetterIndex;
    }

    function getActivityProgress(activityId) {
      const activity = getActivityState(activityId);
      return {
        currentLetterIndex: activity.currentLetterIndex,
        completedCount: activity.completedLetters.length,
        isCompleted: activity.completedAtLeastOnce,
        retryToken: activity.retryToken
      };
    }

    function isLetterCompleted(activityId, letterIndex) {
      return getActivityState(activityId).completedLetters.indexOf(letterIndex) !== -1;
    }

    function completeCurrentLetter(activityId) {
      const activity = getActivityState(activityId);
      const letterIndex = activity.currentLetterIndex;
      if (activity.completedLetters.indexOf(letterIndex) === -1) {
        activity.completedLetters.push(letterIndex);
        activity.completedLetters.sort(function sortAscending(a, b) { return a - b; });
        state.xp += perLetterXP;
      }
      saveState();
      return {
        letterIndex: letterIndex,
        completedCount: activity.completedLetters.length
      };
    }

    function canGoNext(activityId) {
      const activity = getActivityState(activityId);
      if (activity.currentLetterIndex >= letterCount - 1) return false;
      return activity.completedLetters.indexOf(activity.currentLetterIndex) !== -1;
    }

    function goToPreviousLetter(activityId) {
      const activity = getActivityState(activityId);
      activity.currentLetterIndex = clamp(activity.currentLetterIndex - 1, 0, letterCount - 1);
      saveState();
      return activity.currentLetterIndex;
    }

    function goToNextLetter(activityId) {
      const activity = getActivityState(activityId);
      if (!canGoNext(activityId)) return activity.currentLetterIndex;
      activity.currentLetterIndex = clamp(activity.currentLetterIndex + 1, 0, letterCount - 1);
      saveState();
      return activity.currentLetterIndex;
    }

    function setCurrentLetterIndex(activityId, letterIndex) {
      const activity = getActivityState(activityId);
      activity.currentLetterIndex = clamp(Number(letterIndex) || 0, 0, letterCount - 1);
      saveState();
      return activity.currentLetterIndex;
    }

    function retryCurrentLetter(activityId) {
      const activity = getActivityState(activityId);
      activity.retryToken += 1;
      saveState();
      return activity.retryToken;
    }

    function canFinishActivity(activityId) {
      const activity = getActivityState(activityId);
      return activity.completedLetters.length === letterCount;
    }

    function completeActivity(activityId) {
      const activity = getActivityState(activityId);
      if (!canFinishActivity(activityId)) {
        return { completed: false, reason: "incomplete" };
      }
      activity.completedAtLeastOnce = true;
      if (!activity.completionAwarded) {
        activity.completionAwarded = true;
        state.xp += activityCompletionXP;
      }
      ensureCompletedActivities();
      saveState();
      return { completed: true, worldCompleted: state.worldCompleted };
    }

    function goToActivity(activityId) {
      const index = activityIds.indexOf(activityId);
      if (index === -1) throw new Error("Unknown activity id: " + activityId);
      state.currentActivityIndex = index;
      saveState();
      return index;
    }

    function goToNextActivity() {
      if (state.currentActivityIndex < activityIds.length - 1) {
        state.currentActivityIndex += 1;
        saveState();
      }
      return state.currentActivityIndex;
    }

    function resetActivity(activityId) {
      const activity = getActivityState(activityId);
      if (!activity.completedAtLeastOnce) {
        return { reset: false, reason: "activity-not-completed" };
      }
      activity.currentLetterIndex = 0;
      activity.completedLetters = [];
      activity.retryToken += 1;
      saveState();
      return { reset: true };
    }

    function resumeProgress() {
      state = normalizeState(state);
      ensureCompletedActivities();
      saveState();
      return getSnapshot();
    }

    function getSnapshot() {
      return {
        activityIds: activityIds.slice(),
        letterCount: letterCount,
        state: JSON.parse(JSON.stringify(state))
      };
    }

    return {
      getSnapshot: getSnapshot,
      resumeProgress: resumeProgress,
      getCurrentActivityId: getCurrentActivityId,
      getCurrentLetterIndex: getCurrentLetterIndex,
      getActivityProgress: getActivityProgress,
      isLetterCompleted: isLetterCompleted,
      completeCurrentLetter: completeCurrentLetter,
      canGoNext: canGoNext,
      goToPreviousLetter: goToPreviousLetter,
      goToNextLetter: goToNextLetter,
      setCurrentLetterIndex: setCurrentLetterIndex,
      retryCurrentLetter: retryCurrentLetter,
      canFinishActivity: canFinishActivity,
      completeActivity: completeActivity,
      goToActivity: goToActivity,
      goToNextActivity: goToNextActivity,
      resetActivity: resetActivity
    };
  }

  return {
    createProgressionController: createProgressionController
  };
});
