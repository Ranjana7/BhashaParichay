(function initSiteConfig(globalScope) {
  const existing = globalScope.SP_CONFIG || {};
  const defaultLanguageAvailability = {
    sanskrit: { enabled: true, comingSoon: false },
    spanish: { enabled: false, comingSoon: true },
    portuguese: { enabled: false, comingSoon: true }
  };
  const existingAvailability = existing.languageAvailability || {};
  const mergedAvailability = Object.keys(defaultLanguageAvailability).reduce(function (acc, key) {
    acc[key] = Object.assign({}, defaultLanguageAvailability[key], existingAvailability[key] || {});
    return acc;
  }, {});

  globalScope.SP_CONFIG = Object.assign({
    TEST_MODE: false,
    languageAvailability: mergedAvailability,
    lockedLanguageMessage: "More magical adventures are coming soon!"
  }, existing);

  if (!globalScope.SP_CONFIG.languageAvailability) {
    globalScope.SP_CONFIG.languageAvailability = mergedAvailability;
  }
  if (!globalScope.SP_CONFIG.lockedLanguageMessage) {
    globalScope.SP_CONFIG.lockedLanguageMessage = "More magical adventures are coming soon!";
  }

  globalScope.spGetLanguageAvailability = function spGetLanguageAvailability(languageKey) {
    const key = String(languageKey || "").toLowerCase();
    const map = globalScope.SP_CONFIG && globalScope.SP_CONFIG.languageAvailability
      ? globalScope.SP_CONFIG.languageAvailability
      : mergedAvailability;
    const entry = map[key];
    if (!entry) return { enabled: true, comingSoon: false };
    return {
      enabled: entry.enabled !== false,
      comingSoon: entry.comingSoon !== false
    };
  };

  globalScope.spIsLanguageEnabled = function spIsLanguageEnabled(languageKey) {
    return globalScope.spGetLanguageAvailability(languageKey).enabled;
  };

  globalScope.spGetLockedLanguageMessage = function spGetLockedLanguageMessage() {
    return String((globalScope.SP_CONFIG && globalScope.SP_CONFIG.lockedLanguageMessage) || "More magical adventures are coming soon!");
  };

  if (!globalScope.SP_PROJECT_NAME) globalScope.SP_PROJECT_NAME = "BhashaParichay";
  if (!globalScope.SP_LANGUAGE_NAME) globalScope.SP_LANGUAGE_NAME = "SanskritParichay";
  if (!globalScope.SP_STORAGE_PREFIX) globalScope.SP_STORAGE_PREFIX = "bhashaParichay.sanskrit";
  if (!globalScope.SP_LANGUAGE_HOME_URL) globalScope.SP_LANGUAGE_HOME_URL = "sanskritparichay/";
  if (!globalScope.SP_LANGUAGE_CHOOSER_URL) globalScope.SP_LANGUAGE_CHOOSER_URL = "index.html";
})(typeof window !== "undefined" ? window : globalThis);
