(function initCommon() {
  const MUTE_KEY = "sanskritParichay.muted";
  const LAST_WORLD_KEY = "sanskritParichay.lastWorld";
  const HOME_KEY = "sanskritParichay.home.progress";
  const PENDING_SCROLL_KEY = "sanskritParichay.pendingScroll";
  const FOREST_STATE_KEY = "sanskritParichay.alphabetForest.v3";
  const LEGACY_FOREST_KEY = "sanskritParichay.alphabetForest.progress";
  const WORLD_ORDER = ["alphabet", "animals", "numbers", "colours", "words", "sentences", "stories", "culture"];
  const WORLD_TOTALS = {
    alphabet: 9,
    animals: 3,
    numbers: 3,
    colours: 3,
    words: 3,
    sentences: 3,
    stories: 3,
    culture: 3
  };
  const WORLD_META = {
    alphabet: { title: "Alphabet Forest", url: "alphabet-forest.html" },
    animals: { title: "Animal Jungle", url: "learning-world.html?world=animals" },
    numbers: { title: "Number Galaxy", url: "learning-world.html?world=numbers" },
    colours: { title: "Colour Kingdom", url: "learning-world.html?world=colours" },
    words: { title: "Word Wonderland", url: "learning-world.html?world=words" },
    sentences: { title: "Sentence Castle", url: "learning-world.html?world=sentences" },
    stories: { title: "Story Island", url: "learning-world.html?world=stories" },
    culture: { title: "Sanskrit and Culture", url: "learning-world.html?world=culture" }
  };
  const toggle = document.getElementById("muteToggle");
  const config = window.SP_CONFIG || { TEST_MODE: false };
  const messages = window.SP_MESSAGES || {};

  if (!window.SP_STATE) {
    window.SP_STATE = { muted: false };
  }

  const fromStorage = localStorage.getItem(MUTE_KEY);
  if (fromStorage === "true") {
    window.SP_STATE.muted = true;
  }

  function renderMute() {
    if (!toggle) return;
    if (window.SP_STATE.muted) {
      toggle.textContent = "🔇 Sound: Off";
      toggle.setAttribute("aria-pressed", "true");
    } else {
      toggle.textContent = "🔊 Sound: On";
      toggle.setAttribute("aria-pressed", "false");
    }
  }

  function hasSpeechSupport() {
    return "speechSynthesis" in window && "SpeechSynthesisUtterance" in window;
  }

  function getBestVoice(preferredLang) {
    if (!hasSpeechSupport()) return null;
    const voices = window.speechSynthesis.getVoices();
    if (!voices || voices.length === 0) return null;

    const normalized = (preferredLang || "").toLowerCase();
    const preferredNameMatch = voices.find(function (v) {
      const name = (v.name || "").toLowerCase();
      return name.includes("swara") || name.includes("hindi") || name.includes("devanagari");
    });
    if (preferredNameMatch) return preferredNameMatch;

    const candidates = voices.filter(function (v) {
      return v.lang && v.lang.toLowerCase().startsWith(normalized);
    });
    if (candidates.length > 0) return candidates[0];

    const hiVoice = voices.find(function (v) {
      return v.lang && v.lang.toLowerCase().startsWith("hi");
    });
    if (hiVoice) return hiVoice;

    const enVoice = voices.find(function (v) {
      return v.lang && v.lang.toLowerCase().startsWith("en");
    });
    return enVoice || voices[0];
  }

  function isIndicVoice(voice) {
    if (!voice || !voice.lang) return false;
    const v = voice.lang.toLowerCase();
    return v.startsWith("sa") || v.startsWith("hi") || v.startsWith("mr") || v.startsWith("ne");
  }

  function getVoiceCount() {
    if (!hasSpeechSupport()) return 0;
    return window.speechSynthesis.getVoices().length;
  }

  function readJson(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (_error) {
      return fallback;
    }
  }

  function getForestState() {
    if (window.SPProgressStore && typeof window.SPProgressStore.loadForestState === "function") {
      return window.SPProgressStore.loadForestState();
    }
    const fallback = {
      activities: {},
      completionRewarded: {},
      xp: 0
    };
    const current = readJson(FOREST_STATE_KEY, null);
    if (current && typeof current === "object" && current.activities) return current;
    return readJson(LEGACY_FOREST_KEY, fallback) || fallback;
  }

  function getAlphabetUnlockStatus() {
    if (window.SPProgressStore && typeof window.SPProgressStore.getAlphabetJourney === "function") {
      return window.SPProgressStore.getAlphabetJourney();
    }
    const forest = getForestState();
    const activities = forest.activities || {};
    const treeComplete = Boolean(activities["magical-tree"] && activities["magical-tree"].isComplete);
    const gardenComplete = Boolean(activities["letter-garden"] && activities["letter-garden"].isComplete);
    const practiceIds = [
      "hear-and-pick",
      "picture-match",
      "arrange-word",
      "flashcard-flip",
      "feed-mithu",
      "letter-tracing",
      "hidden-letter-hunt"
    ];
    const practiceCompletedCount = practiceIds.reduce(function (count, id) {
      return count + (activities[id] && activities[id].isComplete ? 1 : 0);
    }, 0);
    return {
      treeComplete: treeComplete,
      gardenComplete: gardenComplete,
      practiceCompletedCount: practiceCompletedCount,
      learningCompletedCount: Number(treeComplete) + Number(gardenComplete),
      unlocked: treeComplete && practiceCompletedCount >= 2,
      stars: Number(forest.xp || 0)
    };
  }

  function isWorldUnlocked(worldKey, order) {
    if (window.SPProgressStore && typeof window.SPProgressStore.isWorldUnlocked === "function") {
      const worldTotals = {};
      if (window.SANSKRIT_WORLDS && typeof window.SANSKRIT_WORLDS === "object") {
        Object.keys(window.SANSKRIT_WORLDS).forEach(function (key) {
          const world = window.SANSKRIT_WORLDS[key];
          worldTotals[key] = Array.isArray(world.lessons) ? world.lessons.length : 3;
        });
      }
      return window.SPProgressStore.isWorldUnlocked(worldKey, WORLD_ORDER, Boolean(config.TEST_MODE), worldTotals);
    }
    if (config.TEST_MODE) return true;
    if (worldKey === "alphabet") return true;
    const worldOrder = Array.isArray(order) ? order.slice() : [];
    const worldIndex = worldOrder.indexOf(worldKey);
    if (worldIndex <= 0) return true;
    const previous = worldOrder[worldIndex - 1];
    if (previous === "alphabet") return getAlphabetUnlockStatus().unlocked;
    const home = readJson(HOME_KEY, { completed: [] });
    return Array.isArray(home.completed) && home.completed.includes(previous);
  }

  function getContinueUrl() {
    const world = getRouteWorldKey() || localStorage.getItem(LAST_WORLD_KEY) || "alphabet";
    const current = WORLD_META[world] || WORLD_META.alphabet;
    return current.url;
  }

  function getCurrentWorldMeta() {
    const key = getRouteWorldKey() || localStorage.getItem(LAST_WORLD_KEY) || "alphabet";
    return WORLD_META[key] || WORLD_META.alphabet;
  }

  function getRouteWorldKey() {
    const path = window.location.pathname.split("/").pop() || "";
    if (path === "alphabet-forest.html") return "alphabet";
    if (path === "learning-world.html") {
      const query = new URLSearchParams(window.location.search);
      const key = query.get("world");
      if (key && WORLD_META[key]) return key;
    }
    return null;
  }

  function applyPendingScroll() {
    let pending = null;
    try {
      const raw = localStorage.getItem(PENDING_SCROLL_KEY);
      pending = raw ? JSON.parse(raw) : null;
    } catch (_error) {
      pending = null;
    }
    if (!pending || typeof pending !== "object") return;
    const pendingWorld = pending.world;
    const pendingAnchor = pending.anchorId;
    if (!pendingWorld || !pendingAnchor) {
      localStorage.removeItem(PENDING_SCROLL_KEY);
      return;
    }
    const currentWorld = getRouteWorldKey() || localStorage.getItem(LAST_WORLD_KEY) || "alphabet";
    if (currentWorld !== pendingWorld) return;

    window.setTimeout(function scrollToPendingAnchor() {
      const target = document.getElementById(pendingAnchor);
      if (!target) {
        localStorage.removeItem(PENDING_SCROLL_KEY);
        return;
      }
      const header = document.querySelector(".site-header");
      const offset = header ? Math.ceil(header.getBoundingClientRect().height) + 8 : 88;
      const top = Math.max(0, window.scrollY + target.getBoundingClientRect().top - offset);
      window.scrollTo({ top: top, behavior: "smooth" });
      localStorage.removeItem(PENDING_SCROLL_KEY);
    }, 220);
  }

  function initMiniCursorMithu() {
    const reducedMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const finePointer = window.matchMedia && window.matchMedia("(pointer:fine)").matches;
    const coarsePointer = window.matchMedia && window.matchMedia("(pointer:coarse)").matches;
    if (reducedMotion || !finePointer || coarsePointer || ("ontouchstart" in window)) return;
    if (document.getElementById("treeMithu")) return;
    if (document.getElementById("miniCursorMithu")) return;

    const node = document.createElement("div");
    node.id = "miniCursorMithu";
    node.className = "mini-cursor-mithu";
    node.setAttribute("aria-hidden", "true");
    node.innerHTML =
      '<span class="mini-cursor-mithu-body">🦜</span>' +
      '<span class="mini-cursor-mithu-wing mini-cursor-mithu-wing-left"></span>' +
      '<span class="mini-cursor-mithu-wing mini-cursor-mithu-wing-right"></span>';
    document.body.appendChild(node);

    const state = {
      x: Math.max(80, window.innerWidth * 0.3),
      y: Math.max(80, window.innerHeight * 0.3),
      tx: Math.max(80, window.innerWidth * 0.3),
      ty: Math.max(80, window.innerHeight * 0.3),
      vx: 0,
      rafId: 0,
      visible: false,
      paused: false
    };
    const OFFSET_X = 16;
    const OFFSET_Y = 14;

    function renderFrame() {
      state.x += (state.tx - state.x) * 0.22;
      state.y += (state.ty - state.y) * 0.22;
      const dx = state.tx - state.x;
      state.vx = state.vx * 0.7 + dx * 0.3;
      const angle = Math.max(-16, Math.min(16, state.vx * 0.12));
      node.style.left = state.x.toFixed(2) + "px";
      node.style.top = state.y.toFixed(2) + "px";
      node.style.transform = "translate(-50%, -50%) rotate(" + angle.toFixed(1) + "deg)";
      state.rafId = window.requestAnimationFrame(renderFrame);
    }

    function show() {
      if (state.visible || state.paused) return;
      state.visible = true;
      node.classList.add("visible");
    }

    function hide() {
      state.visible = false;
      node.classList.remove("visible");
    }

    function setTarget(clientX, clientY) {
      if (state.paused) return;
      state.tx = clientX + OFFSET_X;
      state.ty = clientY + OFFSET_Y;
      show();
    }

    document.addEventListener("pointermove", function (event) {
      setTarget(event.clientX, event.clientY);
    }, { passive: true });
    document.addEventListener("pointerdown", function (event) {
      setTarget(event.clientX, event.clientY);
    }, { passive: true });
    document.addEventListener("pointerleave", function () {
      hide();
    });
    document.addEventListener("mouseleave", function () {
      hide();
    });

    const traceCanvas = document.getElementById("traceCanvas");
    if (traceCanvas) {
      const pause = function () {
        state.paused = true;
        hide();
      };
      const resume = function () {
        state.paused = false;
      };
      traceCanvas.addEventListener("pointerenter", pause);
      traceCanvas.addEventListener("pointerleave", resume);
      traceCanvas.addEventListener("pointerdown", pause);
      traceCanvas.addEventListener("pointerup", resume);
      traceCanvas.addEventListener("pointercancel", resume);
    }

    state.rafId = window.requestAnimationFrame(renderFrame);
  }

  function attachCurrentWorldLinks() {
    const current = getCurrentWorldMeta();
    const currentPath = window.location.pathname.split("/").pop() || "index.html";
    const currentHref = current.url.split("?")[0];
    document.querySelectorAll("[data-current-world]").forEach(function (node) {
      node.textContent = current.title;
      node.setAttribute("href", current.url);
      if (currentPath === currentHref) {
        node.setAttribute("aria-current", "page");
      } else if (node.getAttribute("aria-current") === "page") {
        node.removeAttribute("aria-current");
      }
    });
    document.querySelectorAll("[data-continue-learning]").forEach(function (node) {
      node.setAttribute("href", current.url);
      node.addEventListener("click", function (event) {
        if (node.tagName.toLowerCase() === "button") {
          event.preventDefault();
          window.location.href = current.url;
          return;
        }
        node.setAttribute("href", current.url);
      });
    });
  }

  function resetProgress() {
    return false;
  }

  function resetWorldProgress(worldKey, worldOrder, worldTotals) {
    if (window.SPProgressStore && typeof window.SPProgressStore.resetWorldProgress === "function") {
      return window.SPProgressStore.resetWorldProgress(worldKey, worldOrder || WORLD_ORDER, worldTotals || WORLD_TOTALS);
    }
    return false;
  }

  function renderTestModeBadge() {
    if (!config.TEST_MODE) return;
    if (document.getElementById("testModeBadge")) return;
    const badge = document.createElement("div");
    badge.id = "testModeBadge";
    badge.className = "test-mode-badge";
    badge.textContent = (messages.shared && messages.shared.testModeBadge) || "Testing Mode";
    document.body.appendChild(badge);
  }

  window.spSpeak = function spSpeak(text, lang, fallbackEl, transliteration) {
    if (window.SP_STATE.muted) {
      if (fallbackEl) fallbackEl.textContent = "Sound is muted. Tap Sound: Off to unmute.";
      return false;
    }

    if (!hasSpeechSupport()) {
      if (fallbackEl) fallbackEl.textContent = "Audio unavailable on this browser/device.";
      return false;
    }

    if (fallbackEl) fallbackEl.textContent = "";
    window.speechSynthesis.getVoices();
    const bestVoice = getBestVoice(lang || "sa-IN");
    const speechText = text;
    const utterance = new SpeechSynthesisUtterance(speechText);
    utterance.lang = (bestVoice && bestVoice.lang) || "hi-IN";
    utterance.rate = 0.75;
    utterance.pitch = 1;
    if (bestVoice) utterance.voice = bestVoice;

    let started = false;
    utterance.onstart = function onSpeechStart() {
      started = true;
    };
    utterance.onerror = function onSpeechError() {
      if (fallbackEl) fallbackEl.textContent = "Audio blocked here. Please tap once on page and try again.";
    };

    window.speechSynthesis.cancel();
    window.speechSynthesis.resume();
    window.speechSynthesis.speak(utterance);
    setTimeout(function checkSpeechStarted() {
      if (!started && fallbackEl) {
        fallbackEl.textContent = "No speech voice started. Please use Test Sound after page load or check browser voice settings.";
      }
    }, 1200);
    return true;
  };

  window.spApplause = function spApplause() {
    if (window.SP_STATE.muted) return;
    if (!window.AudioContext && !window.webkitAudioContext) return;
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    const ctx = new AudioCtx();
    const now = ctx.currentTime;

    function clap(at, frequency) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(frequency, at);
      gain.gain.setValueAtTime(0.0001, at);
      gain.gain.exponentialRampToValueAtTime(0.18, at + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, at + 0.14);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(at);
      osc.stop(at + 0.16);
    }

    clap(now, 740);
    clap(now + 0.08, 880);
    clap(now + 0.16, 980);
    setTimeout(function closeCtx() {
      ctx.close();
    }, 500);
  };

  window.spSuccessTone = function spSuccessTone() {
    if (window.SP_STATE.muted) return;
    if (!window.AudioContext && !window.webkitAudioContext) return;
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    const ctx = new AudioCtx();
    const now = ctx.currentTime;

    function tone(frequency, start, duration) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(frequency, start);
      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.exponentialRampToValueAtTime(0.12, start + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(start);
      osc.stop(start + duration + 0.01);
    }

    tone(660, now, 0.11);
    tone(880, now + 0.12, 0.12);
    tone(990, now + 0.26, 0.12);
    setTimeout(function closeCtx() {
      ctx.close();
    }, 520);
  };

  window.spFlowerRain = function spFlowerRain(section, options) {
    const reduced = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) return;
    const opts = options || {};
    const durationMs = Math.max(900, Number(opts.durationMs || 2400));
    const density = Math.max(8, Math.min(60, Number(opts.density || 20)));
    const sectionNode = section && section.nodeType === 1 ? section : null;
    const rect = sectionNode ? sectionNode.getBoundingClientRect() : null;
    const left = rect ? Math.max(0, rect.left) : 0;
    const right = rect ? Math.min(window.innerWidth, rect.right) : window.innerWidth;
    const top = rect ? Math.max(0, rect.top) : 0;
    const width = Math.max(40, right - left);
    const height = rect ? Math.max(160, Math.min(window.innerHeight - top, rect.height)) : Math.max(220, window.innerHeight * 0.55);

    let overlay = document.getElementById("flowerRainOverlay");
    if (!overlay) {
      overlay = document.createElement("div");
      overlay.id = "flowerRainOverlay";
      overlay.className = "flower-rain-overlay";
      document.body.appendChild(overlay);
    }

    const petals = [];
    for (let index = 0; index < density; index += 1) {
      const petal = document.createElement("span");
      petal.className = "flower-rain-petal";
      const x = left + Math.random() * width;
      const startY = top - 14 - Math.random() * 22;
      petal.style.left = x.toFixed(1) + "px";
      petal.style.top = startY.toFixed(1) + "px";
      petal.style.background = [
        "linear-gradient(145deg, #ff9ccc, #ffd2e9)",
        "linear-gradient(145deg, #ffc38e, #ffe0b8)",
        "linear-gradient(145deg, #ffd95d, #fff1a2)",
        "linear-gradient(145deg, #95e5b5, #d8f8e4)",
        "linear-gradient(145deg, #9fd3ff, #d7ecff)"
      ][index % 5];
      const driftX = Math.round((Math.random() * 2 - 1) * 110);
      const driftY = Math.round(height + Math.random() * 90);
      const rot = Math.round((Math.random() * 2 - 1) * 220);
      petal.style.setProperty("--flower-rain-x", driftX + "px");
      petal.style.setProperty("--flower-rain-y", driftY + "px");
      petal.style.setProperty("--flower-rain-rot", rot + "deg");
      petal.style.animationDuration = (1.9 + Math.random() * 1.3).toFixed(2) + "s";
      petal.style.animationDelay = (Math.random() * 0.7).toFixed(2) + "s";
      overlay.appendChild(petal);
      petals.push(petal);
    }

    if (window.confetti) {
      const originX = Math.max(0.08, Math.min(0.92, (left + width * 0.5) / Math.max(window.innerWidth, 1)));
      window.confetti({
        particleCount: Math.round(Math.max(24, density * 1.2)),
        spread: 84,
        startVelocity: 22,
        gravity: 0.9,
        scalar: 0.92,
        colors: ["#ff8fc4", "#ffd66b", "#95e2b1", "#9dd2ff", "#d7b4ff"],
        origin: { x: originX, y: Math.max(0.08, (top + 8) / Math.max(window.innerHeight, 1)) }
      });
    }

    window.setTimeout(function clearRain() {
      petals.forEach(function (petal) { petal.remove(); });
      if (overlay && overlay.childElementCount === 0) overlay.remove();
    }, durationMs);
  };

  if (hasSpeechSupport()) {
    window.speechSynthesis.onvoiceschanged = function onVoicesChanged() {
      renderMute();
    };
  }

  window.spGetAudioDebug = function spGetAudioDebug() {
    const best = getBestVoice("sa-IN");
    return {
      muted: window.SP_STATE.muted,
      speechSupported: hasSpeechSupport(),
      voiceCount: getVoiceCount(),
      bestVoice: best ? ((best.name || "voice") + " (" + (best.lang || "unknown") + ")") : "none"
    };
  };

  if (toggle) {
    toggle.addEventListener("click", function onToggleMute() {
      window.SP_STATE.muted = !window.SP_STATE.muted;
      localStorage.setItem(MUTE_KEY, String(window.SP_STATE.muted));
      renderMute();
    });
  }

  window.spGetConfig = function spGetConfig() {
    return Object.assign({}, config);
  };
  window.spIsTestMode = function spIsTestMode() {
    return Boolean(config.TEST_MODE);
  };
  window.spGetAlphabetUnlockStatus = getAlphabetUnlockStatus;
  window.spIsWorldUnlocked = isWorldUnlocked;
  window.spGetContinueLearningUrl = getContinueUrl;
  window.spGetCurrentWorldMeta = getCurrentWorldMeta;
  window.spResetProgress = resetProgress;
  window.spGetProgressSnapshot = function spGetProgressSnapshot(worldOrder, worldTotals) {
    if (window.SPProgressStore && typeof window.SPProgressStore.getProgressSnapshot === "function") {
      return window.SPProgressStore.getProgressSnapshot(worldOrder, worldTotals);
    }
    return {
      currentWorld: localStorage.getItem(LAST_WORLD_KEY) || "alphabet",
      alphabet: getAlphabetUnlockStatus(),
      worlds: {},
      totals: {
        worldsExplored: 1,
        worldsCompleted: 0,
        learningActivitiesCompleted: 0,
        practiceActivitiesCompleted: 0,
        forestActivitiesCompleted: 0,
        stars: 0
      }
    };
  };
  window.spGetRewards = function spGetRewards(worldOrder, worldTotals) {
    const snapshot = window.spGetProgressSnapshot(worldOrder, worldTotals);
    const rewards = snapshot && snapshot.rewards && typeof snapshot.rewards === "object" ? snapshot.rewards : {};
    const stars = Number.isFinite(Number(rewards.stars))
      ? Number(rewards.stars)
      : Number((snapshot && snapshot.totals && snapshot.totals.availableStars) || 0);
    const gems = Number.isFinite(Number(rewards.gems))
      ? Number(rewards.gems)
      : Number((rewards && rewards.availableGems) || 0);
    return {
      stars: Math.max(0, Math.floor(Number.isFinite(stars) ? stars : 0)),
      gems: Math.max(0, Math.floor(Number.isFinite(gems) ? gems : 0)),
      lifetimeStars: Number.isFinite(Number(rewards.lifetimeStars)) ? Math.max(0, Math.floor(Number(rewards.lifetimeStars))) : 0,
      lifetimeGems: Number.isFinite(Number(rewards.lifetimeGems)) ? Math.max(0, Math.floor(Number(rewards.lifetimeGems))) : 0
    };
  };
  window.spSyncProgressModel = function spSyncProgressModel(worldOrder, worldTotals) {
    if (window.SPProgressStore && typeof window.SPProgressStore.syncHomeAggregate === "function") {
      return window.SPProgressStore.syncHomeAggregate(worldOrder, worldTotals);
    }
    return readJson(HOME_KEY, { gems: 0, completed: [] });
  };
  window.SP_WORLD_ORDER = WORLD_ORDER.slice();
  window.SP_WORLD_META = Object.assign({}, WORLD_META);
  window.SP_WORLD_TOTALS = Object.assign({}, WORLD_TOTALS);
  window.spResetWorldProgress = resetWorldProgress;

  attachCurrentWorldLinks();
  applyPendingScroll();
  initMiniCursorMithu();
  renderTestModeBadge();
  renderMute();
})();
