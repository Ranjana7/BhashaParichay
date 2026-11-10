(function initCommon() {
  const MUTE_KEY = "sanskritParichay.muted";
  const LAST_WORLD_KEY = "sanskritParichay.lastWorld";
  const HOME_KEY = "sanskritParichay.home.progress";
  const FOREST_STATE_KEY = "sanskritParichay.alphabetForest.v3";
  const LEGACY_FOREST_KEY = "sanskritParichay.alphabetForest.progress";
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
      unlocked: treeComplete && gardenComplete && practiceCompletedCount >= 2,
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
      return window.SPProgressStore.isWorldUnlocked(worldKey, order, Boolean(config.TEST_MODE), worldTotals);
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
    const world = localStorage.getItem(LAST_WORLD_KEY) || "alphabet";
    if (world === "alphabet") return "alphabet-forest.html";
    return "learning-world.html?world=" + encodeURIComponent(world);
  }

  function attachContinueLearningLinks() {
    document.querySelectorAll("[data-continue-learning]").forEach(function (node) {
      node.setAttribute("href", getContinueUrl());
      node.addEventListener("click", function (event) {
        if (node.tagName.toLowerCase() === "button") {
          event.preventDefault();
          window.location.href = getContinueUrl();
          return;
        }
        node.setAttribute("href", getContinueUrl());
      });
    });
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
  window.spSyncProgressModel = function spSyncProgressModel(worldOrder, worldTotals) {
    if (window.SPProgressStore && typeof window.SPProgressStore.syncHomeAggregate === "function") {
      return window.SPProgressStore.syncHomeAggregate(worldOrder, worldTotals);
    }
    return readJson(HOME_KEY, { xp: 0, completed: [] });
  };

  attachContinueLearningLinks();
  renderTestModeBadge();
  renderMute();
})();
