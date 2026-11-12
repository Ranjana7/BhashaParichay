(function initSiteConfig(globalScope) {
  const existing = globalScope.SP_CONFIG || {};
  globalScope.SP_CONFIG = Object.assign({
    TEST_MODE: false
  }, existing);
  if (!globalScope.SP_PROJECT_NAME) globalScope.SP_PROJECT_NAME = "BhashaParichay";
  if (!globalScope.SP_LANGUAGE_NAME) globalScope.SP_LANGUAGE_NAME = "SanskritParichay";
  if (!globalScope.SP_STORAGE_PREFIX) globalScope.SP_STORAGE_PREFIX = "bhashaParichay.sanskrit";
  if (!globalScope.SP_LANGUAGE_HOME_URL) globalScope.SP_LANGUAGE_HOME_URL = "sanskritparichay/";
  if (!globalScope.SP_LANGUAGE_CHOOSER_URL) globalScope.SP_LANGUAGE_CHOOSER_URL = "index.html";
})(typeof window !== "undefined" ? window : globalThis);
