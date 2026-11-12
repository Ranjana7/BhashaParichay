(function initMultilingualWorld() {
  const root = document.getElementById("languageWorldPage");
  if (!root) return;
  const languageKey = root.getAttribute("data-language");
  const languages = window.BHASHA_LANGUAGES || {};
  const language = languages[languageKey];
  if (!language) return;
  const IS_NESTED_LANGUAGE_ROUTE = /\/(sanskritparichay|spanishparichay|portugueseparichay)\//i.test(window.location.pathname);
  const ASSET_BASE = IS_NESTED_LANGUAGE_ROUTE ? "../assets/" : "assets/";

  const prefersReducedMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const motion = window.Motion || {};
  const animate = motion.animate || function () {};
  const STORAGE_PREFIX = language.storagePrefix;
  const LAST_WORLD_KEY = STORAGE_PREFIX + ".lastWorld";
  const params = new URLSearchParams(window.location.search);
  const worldKey = params.get("world") || localStorage.getItem(LAST_WORLD_KEY) || language.worlds[0].key;
  const world = language.worlds.find(function (item) { return item.key === worldKey; }) || language.worlds[0];
  localStorage.setItem(LAST_WORLD_KEY, world.key);
  document.body.classList.add("lang-theme-" + (language.languageTheme || language.key));
  document.body.classList.add("lang-world-" + world.key);

  const ui = {
    title: document.getElementById("mwTitle"),
    subtitle: document.getElementById("mwSubtitle"),
    lessonName: document.getElementById("mwLessonName"),
    lessonObjective: document.getElementById("mwLessonObjective"),
    worldStars: document.getElementById("mwWorldStars"),
    worldGems: document.getElementById("mwWorldGems"),
    lessonCount: document.getElementById("mwLessonCount"),
    matchPrompt: document.getElementById("mwMatchPrompt"),
    matchChoices: document.getElementById("mwMatchChoices"),
    matchStatus: document.getElementById("mwMatchStatus"),
    matchRestart: document.getElementById("mwMatchRestart"),
    listenPrompt: document.getElementById("mwListenPrompt"),
    listenPlay: document.getElementById("mwListenPlay"),
    listenChoices: document.getElementById("mwListenChoices"),
    listenStatus: document.getElementById("mwListenStatus"),
    listenRestart: document.getElementById("mwListenRestart"),
    buildPrompt: document.getElementById("mwBuildPrompt"),
    buildTiles: document.getElementById("mwBuildTiles"),
    buildAnswer: document.getElementById("mwBuildAnswer"),
    buildStatus: document.getElementById("mwBuildStatus"),
    buildCheck: document.getElementById("mwBuildCheck"),
    buildReset: document.getElementById("mwBuildReset"),
    buildRestart: document.getElementById("mwBuildRestart"),
    completeLesson: document.getElementById("mwCompleteLesson"),
    mascot: document.getElementById("mwMascot"),
    mascotSpeech: document.getElementById("mwMascotSpeech"),
    matchPanel: document.getElementById("mwMatchPanel"),
    listenPanel: document.getElementById("mwListenPanel"),
    buildPanel: document.getElementById("mwBuildPanel")
  };

  const lesson = world.lessons[0];
  const WORLD_KEY = STORAGE_PREFIX + ".world." + world.key + ".progress";
  const pronunciationMap = window.SP_MULTILINGUAL_PRONUNCIATION_MAP || {};
  const languagePronunciationMap = pronunciationMap[language.key] || {};

  function readJson(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (_error) {
      return fallback;
    }
  }

  function writeJson(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  }

  const progress = readJson(WORLD_KEY, {
    stars: 0,
    gems: 0,
    completedLessons: [],
    attempts: 0,
    rewardedEvents: {},
    attemptCycles: { match: 0, listen: 0, build: 0 }
  });
  if (!progress.attemptCycles || typeof progress.attemptCycles !== "object") {
    progress.attemptCycles = { match: 0, listen: 0, build: 0 };
  }
  progress.attemptCycles.match = Math.max(0, Math.floor(Number(progress.attemptCycles.match || 0)));
  progress.attemptCycles.listen = Math.max(0, Math.floor(Number(progress.attemptCycles.listen || 0)));
  progress.attemptCycles.build = Math.max(0, Math.floor(Number(progress.attemptCycles.build || 0)));

  const runtime = {
    matchDone: false,
    listenDone: false,
    buildDone: false,
    buildAnswer: [],
    activePanel: "match",
    activeAudio: null
  };

  function resolveAssetPath(pathValue) {
    const value = String(pathValue || "").trim();
    if (!value) return "";
    if (/^(https?:|data:|blob:|file:|\/)/i.test(value)) return value;
    if (value.startsWith("assets/")) return ASSET_BASE + value.slice("assets/".length);
    if (value.startsWith("./assets/")) return ASSET_BASE + value.slice("./assets/".length);
    if (value.startsWith("../assets/")) return IS_NESTED_LANGUAGE_ROUTE ? value : "assets/" + value.slice("../assets/".length);
    return value;
  }

  function stopActiveAudio() {
    if (typeof window.spStopAudioClip === "function") window.spStopAudioClip();
    if (!runtime.activeAudio) return;
    try {
      runtime.activeAudio.pause();
      runtime.activeAudio.currentTime = 0;
    } catch (_error) {
      // best effort
    }
    runtime.activeAudio = null;
  }

  const guideText = (function createGuideText() {
    if (language.key === "spanish") {
      return {
        intro: "Hola! I'm Mithu. Let's explore " + world.title + " together.",
        match: "Match time! Tap the best answer.",
        listen: "Now listen carefully and choose the sound you hear.",
        build: "Great! Build the word with the tiles.",
        correct: "Brilliant! You got it right.",
        retry: "Nice try. Let's try that one more time.",
        complete: "Hooray! You completed this lesson."
      };
    }
    return {
      intro: "Ola! I'm Mithu. Vamos explorar " + world.title + " juntos.",
      match: "Hora de combinar! Escolha a resposta certa.",
      listen: "Agora escute com atencao e escolha o som correto.",
      build: "Excelente! Monte a palavra com as pecas.",
      correct: "Perfeito! Voce acertou.",
      retry: "Boa tentativa. Vamos tentar mais uma vez.",
      complete: "Viva! Voce concluiu esta licao."
    };
  })();

  function persist() {
    writeJson(WORLD_KEY, progress);
  }

  function pulsePanels() {
    if (prefersReducedMotion) return;
    const panels = Array.prototype.slice.call(document.querySelectorAll(".panel"));
    if (!panels.length) return;
    animate(panels, { opacity: [0.95, 1], transform: ["translateY(0px)", "translateY(-2px)", "translateY(0px)"] }, { duration: 0.32, easing: "ease-in-out" });
  }

  function setMascotState(state) {
    if (!ui.mascot) return;
    ui.mascot.classList.remove("state-wave", "state-dancing");
    ui.mascot.classList.add(state || "state-wave");
  }

  function setMascotSpeech(message, state) {
    if (ui.mascotSpeech && message) ui.mascotSpeech.textContent = message;
    setMascotState(state);
  }

  function messageForPanel(panelKey) {
    if (panelKey === "listen") return guideText.listen;
    if (panelKey === "build") return guideText.build;
    return guideText.match;
  }

  function activatePanelGuide(panelKey) {
    runtime.activePanel = panelKey;
    setMascotSpeech(messageForPanel(panelKey), "state-wave");
  }

  function reward(eventKey, stars, gems) {
    if (progress.rewardedEvents[eventKey]) return;
    progress.rewardedEvents[eventKey] = true;
    progress.stars = Math.max(0, Number(progress.stars || 0) + stars);
    progress.gems = Math.max(0, Number(progress.gems || 0) + gems);
    persist();
    renderHeader();
  }

  function eventKeyFor(activity) {
    const cycle = Math.max(0, Math.floor(Number(progress.attemptCycles[activity] || 0)));
    return world.key + "." + activity + ".c" + cycle;
  }

  function bumpAttemptCycle(activity) {
    progress.attemptCycles[activity] = Math.max(0, Math.floor(Number(progress.attemptCycles[activity] || 0))) + 1;
    persist();
  }

  function renderHeader() {
    if (ui.title) ui.title.textContent = world.title + " · " + language.title;
    if (ui.subtitle) ui.subtitle.textContent = world.subtitle;
    if (ui.lessonName) ui.lessonName.textContent = lesson.title;
    if (ui.lessonObjective) ui.lessonObjective.textContent = lesson.objective;
    if (ui.worldStars) ui.worldStars.textContent = String(progress.stars || 0);
    if (ui.worldGems) ui.worldGems.textContent = String(progress.gems || 0);
    if (ui.lessonCount) {
      const done = Array.isArray(progress.completedLessons) && progress.completedLessons.length > 0;
      ui.lessonCount.textContent = done ? "1/1 completed" : "0/1 completed";
    }
  }

  function initGuideFlow() {
    setMascotSpeech(guideText.intro, "state-wave");
    const panelPairs = [
      { key: "match", node: ui.matchPanel },
      { key: "listen", node: ui.listenPanel },
      { key: "build", node: ui.buildPanel }
    ].filter(function (item) { return Boolean(item.node); });
    if (!panelPairs.length || typeof IntersectionObserver !== "function") return;
    const observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        const found = panelPairs.find(function (item) { return item.node === entry.target; });
        if (!found) return;
        if (found.key === runtime.activePanel) return;
        activatePanelGuide(found.key);
      });
    }, { threshold: 0.5 });
    panelPairs.forEach(function (item) { observer.observe(item.node); });
  }

  function renderMatch() {
    if (!ui.matchPrompt || !ui.matchChoices) return;
    ui.matchPrompt.textContent = lesson.match.prompt;
    ui.matchChoices.innerHTML = "";
    lesson.match.options.forEach(function (option) {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "button ghost";
      btn.textContent = option;
      btn.addEventListener("click", function () {
        if (runtime.matchDone) return;
        if (option === lesson.match.answer) {
          runtime.matchDone = true;
          reward(eventKeyFor("match"), 1, 1);
          ui.matchStatus.textContent = "Great job!";
          setMascotSpeech(guideText.correct, "state-dancing");
          pulsePanels();
        } else {
          ui.matchStatus.textContent = "Try again!";
          setMascotSpeech(guideText.retry, "state-wave");
        }
      });
      ui.matchChoices.appendChild(btn);
    });
  }

  function resolvePronunciationPath(text) {
    const direct = languagePronunciationMap[text];
    if (!direct) return "";
    if (typeof window.spResolveAssetPath === "function") return window.spResolveAssetPath(direct);
    return resolveAssetPath(direct);
  }

  function playPronunciation(text, statusEl) {
    const path = resolvePronunciationPath(text);
    if (!path) {
      if (statusEl) statusEl.textContent = "Pronunciation clip is not ready yet.";
      return;
    }
    if (typeof window.spPlayAudioClip === "function") {
      stopActiveAudio();
      runtime.activeAudio = window.spPlayAudioClip(path, statusEl, function () {
        if (statusEl) statusEl.textContent = "Pronunciation clip is not ready yet.";
      });
      return;
    }
    stopActiveAudio();
    const audio = new Audio(path);
    audio.preload = "none";
    runtime.activeAudio = audio;
    audio.play().catch(function () {
      if (statusEl) statusEl.textContent = "Pronunciation clip is not ready yet.";
    });
  }

  function renderListen() {
    if (!ui.listenPrompt || !ui.listenChoices) return;
    ui.listenPrompt.textContent = lesson.listen.prompt;
    if (ui.listenPlay) {
      ui.listenPlay.onclick = function () {
        playPronunciation(lesson.listen.text, ui.listenStatus);
      };
    }
    ui.listenChoices.innerHTML = "";
    lesson.listen.options.forEach(function (option) {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "button ghost";
      btn.textContent = option;
      btn.addEventListener("click", function () {
        if (runtime.listenDone) return;
        if (option === lesson.listen.answer) {
          runtime.listenDone = true;
          reward(eventKeyFor("listen"), 1, 1);
          ui.listenStatus.textContent = "You listened carefully!";
          setMascotSpeech(guideText.correct, "state-dancing");
          pulsePanels();
        } else {
          ui.listenStatus.textContent = "Listen once more and try again.";
          setMascotSpeech(guideText.retry, "state-wave");
        }
      });
      ui.listenChoices.appendChild(btn);
    });
  }

  function renderBuild() {
    if (!ui.buildPrompt || !ui.buildTiles) return;
    ui.buildPrompt.textContent = lesson.build.prompt;
    ui.buildTiles.innerHTML = "";
    runtime.buildAnswer = [];
    lesson.build.tiles.forEach(function (tile) {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "button ghost";
      btn.textContent = tile;
      btn.addEventListener("click", function () {
        runtime.buildAnswer.push(tile);
        ui.buildAnswer.textContent = runtime.buildAnswer.join("");
      });
      ui.buildTiles.appendChild(btn);
    });
    ui.buildCheck.onclick = function () {
      if (runtime.buildDone) return;
      if (runtime.buildAnswer.join("").toLowerCase() === lesson.build.answer.toLowerCase()) {
        runtime.buildDone = true;
        reward(eventKeyFor("build"), 1, 1);
        ui.buildStatus.textContent = "Wonderful building!";
        setMascotSpeech(guideText.correct, "state-dancing");
        pulsePanels();
      } else {
        ui.buildStatus.textContent = "Try arranging the tiles again.";
        setMascotSpeech(guideText.retry, "state-wave");
      }
    };
    ui.buildReset.onclick = function () {
      runtime.buildAnswer = [];
      ui.buildAnswer.textContent = "";
      ui.buildStatus.textContent = "";
    };
  }

  function restartMatch() {
    runtime.matchDone = false;
    ui.matchStatus.textContent = "New attempt started.";
    activatePanelGuide("match");
    bumpAttemptCycle("match");
    renderMatch();
  }

  function restartListen() {
    runtime.listenDone = false;
    ui.listenStatus.textContent = "New attempt started.";
    activatePanelGuide("listen");
    stopActiveAudio();
    bumpAttemptCycle("listen");
    renderListen();
  }

  function restartBuild() {
    runtime.buildDone = false;
    runtime.buildAnswer = [];
    ui.buildAnswer.textContent = "";
    ui.buildStatus.textContent = "New attempt started.";
    activatePanelGuide("build");
    bumpAttemptCycle("build");
    renderBuild();
  }

  function completeLesson() {
    const done = runtime.matchDone && runtime.listenDone && runtime.buildDone;
    if (!done) {
      ui.buildStatus.textContent = "Complete all three activities first.";
      setMascotSpeech(messageForPanel(runtime.activePanel), "state-wave");
      return;
    }
    if (!Array.isArray(progress.completedLessons)) progress.completedLessons = [];
    if (!progress.completedLessons.includes(0)) {
      progress.completedLessons.push(0);
      persist();
    }
    const bonusKey = world.key + ".lessonBonus.c"
      + String(progress.attemptCycles.match || 0) + "-"
      + String(progress.attemptCycles.listen || 0) + "-"
      + String(progress.attemptCycles.build || 0);
    reward(bonusKey, 5, 0);
    renderHeader();
    ui.buildStatus.textContent = "Lesson complete! You earned bonus stars.";
    setMascotSpeech(guideText.complete, "state-dancing");
    if (window.confetti && !prefersReducedMotion) {
      window.confetti({ particleCount: 46, spread: 58, origin: { y: 0.7 } });
    }
    pulsePanels();
  }

  renderHeader();
  initGuideFlow();
  renderMatch();
  renderListen();
  renderBuild();
  if (ui.matchRestart) ui.matchRestart.addEventListener("click", restartMatch);
  if (ui.listenRestart) ui.listenRestart.addEventListener("click", restartListen);
  if (ui.buildRestart) ui.buildRestart.addEventListener("click", restartBuild);
  if (ui.completeLesson) ui.completeLesson.addEventListener("click", completeLesson);
})();
