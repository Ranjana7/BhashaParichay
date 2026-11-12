(function initMultilingualWorld() {
  const root = document.getElementById("languageWorldPage");
  if (!root) return;
  const languageKey = root.getAttribute("data-language");
  const languages = window.BHASHA_LANGUAGES || {};
  const language = languages[languageKey];
  if (!language) return;

  const STORAGE_PREFIX = language.storagePrefix;
  const LAST_WORLD_KEY = STORAGE_PREFIX + ".lastWorld";
  const params = new URLSearchParams(window.location.search);
  const worldKey = params.get("world") || localStorage.getItem(LAST_WORLD_KEY) || language.worlds[0].key;
  const world = language.worlds.find(function (item) { return item.key === worldKey; }) || language.worlds[0];
  localStorage.setItem(LAST_WORLD_KEY, world.key);

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
    listenPrompt: document.getElementById("mwListenPrompt"),
    listenPlay: document.getElementById("mwListenPlay"),
    listenChoices: document.getElementById("mwListenChoices"),
    listenStatus: document.getElementById("mwListenStatus"),
    buildPrompt: document.getElementById("mwBuildPrompt"),
    buildTiles: document.getElementById("mwBuildTiles"),
    buildAnswer: document.getElementById("mwBuildAnswer"),
    buildStatus: document.getElementById("mwBuildStatus"),
    buildCheck: document.getElementById("mwBuildCheck"),
    buildReset: document.getElementById("mwBuildReset"),
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
    rewardedEvents: {}
  });

  const runtime = {
    matchDone: false,
    listenDone: false,
    buildDone: false,
    buildAnswer: []
  };

  function persist() {
    writeJson(WORLD_KEY, progress);
  }

  function reward(eventKey, stars, gems) {
    if (progress.rewardedEvents[eventKey]) return;
    progress.rewardedEvents[eventKey] = true;
    progress.stars = Math.max(0, Number(progress.stars || 0) + stars);
    progress.gems = Math.max(0, Number(progress.gems || 0) + gems);
    persist();
    renderHeader();
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
        if (option === lesson.match.answer) {
          runtime.matchDone = true;
          reward(world.key + ".match", 1, 0);
          ui.matchStatus.textContent = "Great job!";
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
      ui.listenPlay.addEventListener("click", function () {
        speak(lesson.listen.text);
      });
    }
    ui.listenChoices.innerHTML = "";
    lesson.listen.options.forEach(function (option) {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "button ghost";
      btn.textContent = option;
      btn.addEventListener("click", function () {
        if (option === lesson.listen.answer) {
          runtime.listenDone = true;
          reward(world.key + ".listen", 1, 0);
          ui.listenStatus.textContent = "You listened carefully!";
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
    ui.buildCheck.addEventListener("click", function () {
      if (runtime.buildAnswer.join("").toLowerCase() === lesson.build.answer.toLowerCase()) {
        runtime.buildDone = true;
        reward(world.key + ".build", 1, 0);
        ui.buildStatus.textContent = "Wonderful building!";
      } else {
        ui.buildStatus.textContent = "Try arranging the tiles again.";
      }
    });
    ui.buildReset.addEventListener("click", function () {
      runtime.buildAnswer = [];
      ui.buildAnswer.textContent = "";
      ui.buildStatus.textContent = "";
    });
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
      reward(world.key + ".lessonBonus", 5, 1);
      persist();
    }
    renderHeader();
    ui.buildStatus.textContent = "Lesson complete! You earned bonus stars and a gem.";
  }

  renderHeader();
  renderMatch();
  renderListen();
  renderBuild();
  if (ui.completeLesson) ui.completeLesson.addEventListener("click", completeLesson);
})();
