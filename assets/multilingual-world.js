(function initMultilingualWorld() {
  const root = document.getElementById("languageWorldPage");
  if (!root) return;
  const languageKey = root.getAttribute("data-language");
  const languages = window.BHASHA_LANGUAGES || {};
  const language = languages[languageKey];
  if (!language) return;

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
    completeLesson: document.getElementById("mwCompleteLesson")
  };

  const lesson = world.lessons[0];
  const WORLD_KEY = STORAGE_PREFIX + ".world." + world.key + ".progress";

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
    buildAnswer: []
  };

  function persist() {
    writeJson(WORLD_KEY, progress);
  }

  function pulsePanels() {
    if (prefersReducedMotion) return;
    const panels = Array.prototype.slice.call(document.querySelectorAll(".panel"));
    if (!panels.length) return;
    animate(panels, { opacity: [0.95, 1], transform: ["translateY(0px)", "translateY(-2px)", "translateY(0px)"] }, { duration: 0.32, easing: "ease-in-out" });
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
          pulsePanels();
        } else {
          ui.matchStatus.textContent = "Try again!";
        }
      });
      ui.matchChoices.appendChild(btn);
    });
  }

  function speak(text) {
    if (!window.speechSynthesis) return;
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = language.key === "spanish" ? "es-ES" : "pt-BR";
    utterance.rate = 0.85;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
  }

  function renderListen() {
    if (!ui.listenPrompt || !ui.listenChoices) return;
    ui.listenPrompt.textContent = lesson.listen.prompt;
    if (ui.listenPlay) {
      ui.listenPlay.onclick = function () {
        speak(lesson.listen.text);
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
          pulsePanels();
        } else {
          ui.listenStatus.textContent = "Listen once more and try again.";
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
        pulsePanels();
      } else {
        ui.buildStatus.textContent = "Try arranging the tiles again.";
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
    bumpAttemptCycle("match");
    renderMatch();
  }

  function restartListen() {
    runtime.listenDone = false;
    ui.listenStatus.textContent = "New attempt started.";
    if (window.speechSynthesis) window.speechSynthesis.cancel();
    bumpAttemptCycle("listen");
    renderListen();
  }

  function restartBuild() {
    runtime.buildDone = false;
    runtime.buildAnswer = [];
    ui.buildAnswer.textContent = "";
    ui.buildStatus.textContent = "New attempt started.";
    bumpAttemptCycle("build");
    renderBuild();
  }

  function completeLesson() {
    const done = runtime.matchDone && runtime.listenDone && runtime.buildDone;
    if (!done) {
      ui.buildStatus.textContent = "Complete all three activities first.";
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
    if (window.confetti && !prefersReducedMotion) {
      window.confetti({ particleCount: 46, spread: 58, origin: { y: 0.7 } });
    }
    pulsePanels();
  }

  renderHeader();
  renderMatch();
  renderListen();
  renderBuild();
  if (ui.matchRestart) ui.matchRestart.addEventListener("click", restartMatch);
  if (ui.listenRestart) ui.listenRestart.addEventListener("click", restartListen);
  if (ui.buildRestart) ui.buildRestart.addEventListener("click", restartBuild);
  if (ui.completeLesson) ui.completeLesson.addEventListener("click", completeLesson);
})();
