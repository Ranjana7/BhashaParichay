(function initSiteConfig(globalScope) {
  const existing = globalScope.SP_CONFIG || {};
  globalScope.SP_CONFIG = Object.assign({
    TEST_MODE: true
  }, existing);
})(typeof window !== "undefined" ? window : globalThis);
