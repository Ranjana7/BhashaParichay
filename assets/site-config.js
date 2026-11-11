(function initSiteConfig(globalScope) {
  const existing = globalScope.SP_CONFIG || {};
  globalScope.SP_CONFIG = Object.assign({
    TEST_MODE: false
  }, existing);
})(typeof window !== "undefined" ? window : globalThis);
