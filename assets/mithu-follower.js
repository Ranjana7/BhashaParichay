(function initGlobalMiniCursorMithu() {
  if (window.__spMiniCursorMithuController) return;

  function createNoopController() {
    const noop = function () {};
    window.spSetMiniCursorMithuEnabled = noop;
    window.spPauseMiniCursorMithu = noop;
    window.spResumeMiniCursorMithu = noop;
    window.__spMiniCursorMithuController = {
      setEnabled: noop,
      pause: noop,
      resume: noop
    };
  }

  const reducedMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const finePointer = window.matchMedia && window.matchMedia("(any-pointer:fine)").matches;
  if (reducedMotion || !finePointer) {
    createNoopController();
    return;
  }

  const existing = document.getElementById("miniCursorMithu");
  if (existing) {
    createNoopController();
    return;
  }

  const node = document.createElement("div");
  node.id = "miniCursorMithu";
  node.className = "mini-cursor-mithu";
  node.setAttribute("aria-hidden", "true");
  node.innerHTML =
    '<svg viewBox="0 0 240 240" class="mini-cursor-mithu-svg" role="presentation">' +
    '<ellipse class="mithu-shadow" cx="120" cy="205" rx="54" ry="16"></ellipse>' +
    '<path class="mithu-tail" d="M180 150 L220 180 L180 188 Z"></path>' +
    '<ellipse class="mithu-body" cx="120" cy="120" rx="64" ry="78"></ellipse>' +
    '<ellipse class="mithu-belly" cx="120" cy="138" rx="40" ry="48"></ellipse>' +
    '<path class="mithu-wing-left" d="M78 112 C34 118, 28 168, 72 178 C74 152, 86 132, 98 124 Z"></path>' +
    '<path class="mithu-wing-right" d="M162 112 C206 118, 212 168, 168 178 C166 152, 154 132, 142 124 Z"></path>' +
    '<circle class="mithu-eye-left" cx="100" cy="96" r="8"></circle>' +
    '<circle class="mithu-eye-right" cx="140" cy="96" r="8"></circle>' +
    '<path class="mithu-beak-top" d="M106 109 C114 103, 126 103, 134 109 C128 118, 118 122, 106 118 Z"></path>' +
    '<path class="mithu-beak-bottom" d="M108 118 C116 122, 124 122, 132 118 C126 128, 116 131, 108 126 Z"></path>' +
    '<rect class="mithu-leg-left" x="104" y="184" width="8" height="20" rx="4"></rect>' +
    '<rect class="mithu-leg-right" x="128" y="184" width="8" height="20" rx="4"></rect>' +
    '<path class="mithu-crest" d="M104 45 L114 26 L122 44 L130 24 L140 45"></path>' +
    "</svg>";
  document.body.appendChild(node);

  const state = {
    x: Math.max(80, window.innerWidth * 0.3),
    y: Math.max(80, window.innerHeight * 0.3),
    tx: Math.max(80, window.innerWidth * 0.3),
    ty: Math.max(80, window.innerHeight * 0.3),
    vx: 0,
    visible: false
  };
  const disabledReasons = new Set();
  const OFFSET_X = 16;
  const OFFSET_Y = 14;
  const EDGE_PAD = 24;

  function normalizeReason(reason, fallback) {
    return String(reason || fallback || "manual").toLowerCase();
  }

  function isPaused() {
    return disabledReasons.size > 0;
  }

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function clampStateToViewport() {
    const maxX = Math.max(EDGE_PAD, window.innerWidth - EDGE_PAD);
    const maxY = Math.max(EDGE_PAD, window.innerHeight - EDGE_PAD);
    state.x = clamp(state.x, EDGE_PAD, maxX);
    state.y = clamp(state.y, EDGE_PAD, maxY);
    state.tx = clamp(state.tx, EDGE_PAD, maxX);
    state.ty = clamp(state.ty, EDGE_PAD, maxY);
  }

  function show() {
    if (state.visible || isPaused()) return;
    state.visible = true;
    node.classList.add("visible");
  }

  function hide() {
    state.visible = false;
    node.classList.remove("visible");
  }

  function setTarget(clientX, clientY) {
    if (isPaused()) return;
    state.tx = clamp(clientX + OFFSET_X, EDGE_PAD, Math.max(EDGE_PAD, window.innerWidth - EDGE_PAD));
    state.ty = clamp(clientY + OFFSET_Y, EDGE_PAD, Math.max(EDGE_PAD, window.innerHeight - EDGE_PAD));
    show();
  }

  function renderFrame() {
    const dx = state.tx - state.x;
    const dy = state.ty - state.y;
    state.x += dx * 0.22;
    state.y += dy * 0.22;
    state.vx = state.vx * 0.7 + dx * 0.3;
    const angle = Math.max(-16, Math.min(16, state.vx * 0.12));
    node.style.left = state.x.toFixed(2) + "px";
    node.style.top = state.y.toFixed(2) + "px";
    node.style.transform = "translate(-50%, -50%) rotate(" + angle.toFixed(1) + "deg)";
    node.classList.toggle("is-moving", Math.abs(dx) + Math.abs(dy) > 1.4);
    window.requestAnimationFrame(renderFrame);
  }

  function setEnabled(enabled, reason) {
    const key = normalizeReason(reason, "manual");
    if (enabled) {
      disabledReasons.delete(key);
    } else {
      disabledReasons.add(key);
      hide();
    }
  }

  function pause(reason) {
    setEnabled(false, reason || "pause");
  }

  function resume(reason) {
    setEnabled(true, reason || "pause");
  }

  window.spSetMiniCursorMithuEnabled = setEnabled;
  window.spPauseMiniCursorMithu = pause;
  window.spResumeMiniCursorMithu = resume;
  window.__spMiniCursorMithuController = { setEnabled: setEnabled, pause: pause, resume: resume };

  document.addEventListener("pointermove", function (event) {
    if (event.pointerType && event.pointerType !== "mouse") return;
    setTarget(event.clientX, event.clientY);
  }, { passive: true });
  document.addEventListener("pointerdown", function (event) {
    if (event.pointerType && event.pointerType !== "mouse") return;
    setTarget(event.clientX, event.clientY);
  }, { passive: true });
  document.addEventListener("pointerleave", hide);
  document.addEventListener("mouseleave", hide);
  window.addEventListener("resize", clampStateToViewport);
  document.addEventListener("visibilitychange", function () {
    if (document.hidden) hide();
  });

  const traceCanvas = document.getElementById("traceCanvas");
  if (traceCanvas) {
    const pauseForTrace = function () { pause("trace-canvas"); };
    const resumeForTrace = function () { resume("trace-canvas"); };
    traceCanvas.addEventListener("pointerenter", pauseForTrace);
    traceCanvas.addEventListener("pointerleave", resumeForTrace);
    traceCanvas.addEventListener("pointerdown", pauseForTrace);
    traceCanvas.addEventListener("pointerup", resumeForTrace);
    traceCanvas.addEventListener("pointercancel", resumeForTrace);
  }

  clampStateToViewport();
  window.requestAnimationFrame(renderFrame);
})();
