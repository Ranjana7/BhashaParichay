(function initSeamlessExperience() {
  const prefersReducedMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const motion = window.Motion || {};
  const animate = motion.animate || function () {};
  const body = document.body;
  if (!body) return;

  function isSamePageHashOnly(link) {
    try {
      const url = new URL(link.href, window.location.href);
      return url.origin === window.location.origin
        && url.pathname === window.location.pathname
        && url.search === window.location.search
        && Boolean(url.hash);
    } catch (_error) {
      return false;
    }
  }

  function isSeamlessLink(link) {
    if (!link || link.target === "_blank" || link.hasAttribute("download")) return false;
    if (link.getAttribute("href") === "#") return false;
    if (!link.matches("a[data-seamless-nav], .language-card, .main-nav a, .button[href]")) return false;
    if (isSamePageHashOnly(link)) return false;
    try {
      const url = new URL(link.href, window.location.href);
      return url.origin === window.location.origin;
    } catch (_error) {
      return false;
    }
  }

  function runEntryAnimation() {
    if (prefersReducedMotion) return;
    const panels = Array.prototype.slice.call(document.querySelectorAll(".panel, .language-card, .world-card"));
    if (!panels.length) return;
    animate(
      panels,
      { opacity: [0, 1], transform: ["translateY(10px)", "translateY(0px)"] },
      { duration: 0.35, easing: "ease-out", delay: function (i) { return Math.min(0.2, i * 0.03); } }
    );
  }

  function runExitAndNavigate(href) {
    if (prefersReducedMotion) {
      window.location.href = href;
      return;
    }
    body.classList.add("page-transitioning");
    setTimeout(function () {
      window.location.href = href;
    }, 220);
  }

  document.addEventListener("click", function (event) {
    const link = event.target && event.target.closest ? event.target.closest("a[href]") : null;
    if (!link) return;
    if (event.defaultPrevented || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    if (!isSeamlessLink(link)) return;
    event.preventDefault();
    const language = link.getAttribute("data-language");
    if (language) localStorage.setItem("bhashaParichay.ui.lastLanguage", language);
    runExitAndNavigate(link.href);
  });

  requestAnimationFrame(function () {
    body.classList.add("page-shell-ready");
    runEntryAnimation();
  });
})();
