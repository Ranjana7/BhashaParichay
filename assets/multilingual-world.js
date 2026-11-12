(function initMultilingualWorld() {
  const root = document.getElementById("languageWorldPage");
  if (!root || root.dataset.initialized === "true") return;
  root.dataset.initialized = "true";

  const languageKey = root.getAttribute("data-language");
  const languages = window.BHASHA_LANGUAGES || {};
  const language = languages[languageKey];
  if (!language) return;

  const prefersReducedMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const motion = window.Motion || {};
  const animate = motion.animate || function () {};
  const STORAGE_PREFIX = language.storagePrefix;
  const LAST_WORLD_KEY = STORAGE_PREFIX + ".lastWorld";
  const WORLD_UNLOCKS_KEY = STORAGE_PREFIX + ".worldUnlocks.v1";
  const BONUS_REWARDS_KEY = STORAGE_PREFIX + ".homeBonus.v1";
  const UNLOCK_STAR_TARGET = 50;
  const UNLOCK_GEM_TARGET = 1;
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
    mascot: document.getElementById("mwMascot"),
    mascotSpeech: document.getElementById("mwMascotSpeech"),
    worldUnlockInvite: document.getElementById("mwWorldUnlockInvite"),
    worldUnlockInviteBtn: document.getElementById("mwWorldUnlockInviteBtn"),
    matchPanel: document.getElementById("mwMatchPanel"),
    matchPrompt: document.getElementById("mwMatchPrompt"),
    matchChoices: document.getElementById("mwMatchChoices"),
    matchStatus: document.getElementById("mwMatchStatus"),
    matchRestart: document.getElementById("mwMatchRestart"),
    listenPanel: document.getElementById("mwListenPanel"),
    listenPrompt: document.getElementById("mwListenPrompt"),
    listenPlay: document.getElementById("mwListenPlay"),
    listenChoices: document.getElementById("mwListenChoices"),
    listenStatus: document.getElementById("mwListenStatus"),
    listenRestart: document.getElementById("mwListenRestart"),
    buildPanel: document.getElementById("mwBuildPanel"),
    buildPrompt: document.getElementById("mwBuildPrompt"),
    buildTiles: document.getElementById("mwBuildTiles"),
    buildAnswer: document.getElementById("mwBuildAnswer"),
    buildStatus: document.getElementById("mwBuildStatus"),
    buildCheck: document.getElementById("mwBuildCheck"),
    buildReset: document.getElementById("mwBuildReset"),
    buildRestart: document.getElementById("mwBuildRestart"),
    picturePanel: document.getElementById("mwPicturePanel"),
    picturePrompt: document.getElementById("mwPicturePrompt"),
    pictureChoices: document.getElementById("mwPictureChoices"),
    pictureStatus: document.getElementById("mwPictureStatus"),
    pictureRestart: document.getElementById("mwPictureRestart"),
    reviewPanel: document.getElementById("mwReviewPanel"),
    reviewPrompt: document.getElementById("mwReviewPrompt"),
    reviewChoices: document.getElementById("mwReviewChoices"),
    reviewStatus: document.getElementById("mwReviewStatus"),
    reviewRestart: document.getElementById("mwReviewRestart"),
    conversationPanelA: document.getElementById("mwConversationPanelA"),
    conversationATitle: document.getElementById("mwConversationATitle"),
    conversationALearn: document.getElementById("mwConversationALearn"),
    conversationAPrompt: document.getElementById("mwConversationAPrompt"),
    conversationAChoices: document.getElementById("mwConversationAChoices"),
    conversationAStatus: document.getElementById("mwConversationAStatus"),
    conversationARestart: document.getElementById("mwConversationARestart"),
    conversationPanelB: document.getElementById("mwConversationPanelB"),
    conversationBTitle: document.getElementById("mwConversationBTitle"),
    conversationBLearn: document.getElementById("mwConversationBLearn"),
    conversationBPrompt: document.getElementById("mwConversationBPrompt"),
    conversationBChoices: document.getElementById("mwConversationBChoices"),
    conversationBStatus: document.getElementById("mwConversationBStatus"),
    conversationBRestart: document.getElementById("mwConversationBRestart"),
    completeLesson: document.getElementById("mwCompleteLesson")
  };

  const lesson = world.lessons[0];
  const WORLD_KEY = STORAGE_PREFIX + ".world." + world.key + ".progress";
  const pronunciationMap = window.SP_MULTILINGUAL_PRONUNCIATION_MAP || {};
  const languagePronunciationMap = pronunciationMap[language.key] || {};
  const conversationActivities = Array.isArray(lesson.conversationActivities) ? lesson.conversationActivities.slice(0, 2) : [];

  const activityMap = {
    match: { panel: ui.matchPanel, message: "Match time! Tap the best answer." },
    listen: { panel: ui.listenPanel, message: "Now listen carefully and choose what you hear." },
    build: { panel: ui.buildPanel, message: "Great! Build the word with the tiles." },
    picture: { panel: ui.picturePanel, message: "Look carefully and choose the correct meaning." },
    review: { panel: ui.reviewPanel, message: "Let's review what you learned." },
    conversationA: { panel: ui.conversationPanelA, message: "Let's practise a real conversation together!" },
    conversationB: { panel: ui.conversationPanelB, message: "Amazing! Time for a second conversation." }
  };

  const activeActivities = ["match", "listen", "build", "picture", "review"]
    .concat(conversationActivities[0] ? ["conversationA"] : [])
    .concat(conversationActivities[1] ? ["conversationB"] : []);

  const guideText = (function createGuideText() {
    if (language.key === "spanish") {
      return {
        intro: "¡Hola! I'm Mithu. Let's explore " + world.title + " together.",
        correct: "¡Brillante! You got it right.",
        retry: "Good try! Let's practise again.",
        complete: "¡Hooray! You completed this world lesson."
      };
    }
    return {
      intro: "Olá! I'm Mithu. Vamos explorar " + world.title + " juntos.",
      correct: "Perfeito! Você acertou.",
      retry: "Boa tentativa. Vamos praticar outra vez.",
      complete: "Viva! Você concluiu esta lição."
    };
  })();

  const runtime = {
    done: {},
    buildAnswer: [],
    activePanel: "match",
    activeAudio: null,
    observer: null,
    mascotRafId: null,
    mascotCurrentY: 0,
    mascotTargetY: 0,
    unlockInviteVisible: false,
    unlockTargetWorld: ""
  };

  activeActivities.forEach(function (key) {
    runtime.done[key] = false;
  });

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

  function getBonusRewards() {
    const bonus = readJson(BONUS_REWARDS_KEY, { stars: 0, gems: 0 });
    return {
      stars: Math.max(0, Math.floor(Number(bonus.stars || 0))),
      gems: Math.max(0, Math.floor(Number(bonus.gems || 0)))
    };
  }

  function rewardsFromProgress() {
    const totals = language.worlds.reduce(function (acc, item) {
      const itemProgress = readJson(STORAGE_PREFIX + ".world." + item.key + ".progress", { stars: 0, gems: 0 });
      acc.stars += Math.max(0, Number(itemProgress.stars || 0));
      acc.gems += Math.max(0, Number(itemProgress.gems || 0));
      return acc;
    }, { stars: 0, gems: 0 });
    const bonus = getBonusRewards();
    return {
      stars: totals.stars + bonus.stars,
      gems: totals.gems + bonus.gems
    };
  }

  function getUnlockState() {
    const initial = { unlocked: [language.worlds[0].key], spentStars: 0, spentGems: 0 };
    const raw = readJson(WORLD_UNLOCKS_KEY, initial);
    const unlocked = Array.isArray(raw.unlocked) && raw.unlocked.length ? raw.unlocked : [language.worlds[0].key];
    return {
      unlocked: unlocked,
      spentStars: Math.max(0, Math.floor(Number(raw.spentStars || 0))),
      spentGems: Math.max(0, Math.floor(Number(raw.spentGems || 0)))
    };
  }

  function saveUnlockState(state) {
    writeJson(WORLD_UNLOCKS_KEY, state);
  }

  function syncUnlocks() {
    const state = getUnlockState();
    const rewards = rewardsFromProgress();
    let availableStars = Math.max(0, rewards.stars - state.spentStars);
    let availableGems = Math.max(0, rewards.gems - state.spentGems);

    for (let index = 1; index < language.worlds.length; index += 1) {
      const previousWorld = language.worlds[index - 1].key;
      const currentWorld = language.worlds[index].key;
      if (!state.unlocked.includes(previousWorld)) break;
      if (state.unlocked.includes(currentWorld)) continue;
      if (availableStars < UNLOCK_STAR_TARGET || availableGems < UNLOCK_GEM_TARGET) break;
      state.unlocked.push(currentWorld);
      state.spentStars += UNLOCK_STAR_TARGET;
      state.spentGems += UNLOCK_GEM_TARGET;
      availableStars -= UNLOCK_STAR_TARGET;
      availableGems -= UNLOCK_GEM_TARGET;
      break;
    }

    saveUnlockState(state);
    return state.unlocked.slice();
  }

  function resolveAssetPath(pathValue) {
    if (typeof window.spResolveAssetPath === "function") return window.spResolveAssetPath(pathValue);
    const value = String(pathValue || "").trim();
    if (!value) return "";
    if (/^(https?:|data:|blob:|file:|\/)/i.test(value)) return value;
    if (value.startsWith("../") || value.startsWith("./")) return value;
    return "../" + value.replace(/^\//, "");
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

  const progress = readJson(WORLD_KEY, {
    stars: 0,
    gems: 0,
    completedLessons: [],
    attempts: 0,
    rewardedEvents: {},
    attemptCycles: {}
  });
  if (!progress.attemptCycles || typeof progress.attemptCycles !== "object") {
    progress.attemptCycles = {};
  }
  activeActivities.forEach(function (activity) {
    progress.attemptCycles[activity] = Math.max(0, Math.floor(Number(progress.attemptCycles[activity] || 0)));
  });

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
    const meta = activityMap[panelKey];
    if (meta && meta.message) return meta.message;
    return "Let's keep learning together!";
  }

  function activatePanelGuide(panelKey) {
    runtime.activePanel = panelKey;
    setMascotSpeech(messageForPanel(panelKey), "state-wave");
  }

  function getNextWorldKey() {
    const index = language.worlds.findIndex(function (item) { return item.key === world.key; });
    if (index < 0 || index >= language.worlds.length - 1) return "";
    return language.worlds[index + 1].key;
  }

  function goToWorld(targetWorld) {
    if (!targetWorld) return;
    localStorage.setItem(LAST_WORLD_KEY, targetWorld);
    window.location.href = "world.html?world=" + encodeURIComponent(targetWorld);
  }

  function showUnlockInvite() {
    if (ui.worldUnlockInvite) ui.worldUnlockInvite.hidden = false;
    runtime.unlockInviteVisible = true;
  }

  function hideUnlockInvite() {
    if (ui.worldUnlockInvite) ui.worldUnlockInvite.hidden = true;
    runtime.unlockInviteVisible = false;
    runtime.unlockTargetWorld = "";
  }

  function updateUnlockInvitation() {
    const nextWorldKey = getNextWorldKey();
    if (!nextWorldKey) {
      hideUnlockInvite();
      return;
    }
    const unlocked = new Set(syncUnlocks());
    if (!unlocked.has(nextWorldKey)) {
      const wasVisible = runtime.unlockInviteVisible;
      hideUnlockInvite();
      if (wasVisible) {
        setMascotSpeech(messageForPanel(runtime.activePanel), "state-wave");
      }
      return;
    }
    runtime.unlockTargetWorld = nextWorldKey;
    showUnlockInvite();
    setMascotSpeech("Hooray! A new world is ready. Let's explore!", "state-dancing");
  }

  function reward(eventKey, stars, gems) {
    if (progress.rewardedEvents[eventKey]) return;
    progress.rewardedEvents[eventKey] = true;
    progress.stars = Math.max(0, Number(progress.stars || 0) + stars);
    progress.gems = Math.max(0, Number(progress.gems || 0) + gems);
    persist();
    renderHeader();
    updateUnlockInvitation();
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
    const panelPairs = activeActivities.map(function (key) {
      return { key: key, node: activityMap[key] ? activityMap[key].panel : null };
    }).filter(function (item) { return Boolean(item.node); });
    if (!panelPairs.length || typeof IntersectionObserver !== "function") return;
    runtime.observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        const found = panelPairs.find(function (item) { return item.node === entry.target; });
        if (!found || found.key === runtime.activePanel) return;
        activatePanelGuide(found.key);
      });
    }, { threshold: 0.48 });
    panelPairs.forEach(function (item) { runtime.observer.observe(item.node); });
  }

  function setupMascotFollowOnScroll() {
    if (!ui.mascot) return;
    const pageWrap = document.querySelector(".page-wrap");
    const homeContainer = ui.mascot.parentElement;
    const homeNextSibling = ui.mascot.nextElementSibling;
    let mascotRail = null;

    function getRail() {
      if (!pageWrap) return null;
      if (mascotRail && mascotRail.isConnected) return mascotRail;
      mascotRail = pageWrap.querySelector(".mascot-rail");
      if (mascotRail) return mascotRail;
      mascotRail = document.createElement("aside");
      mascotRail.className = "mascot-rail";
      mascotRail.setAttribute("aria-hidden", "true");
      pageWrap.appendChild(mascotRail);
      return mascotRail;
    }

    function placeDesktop() {
      const rail = getRail();
      if (!rail) return;
      if (ui.mascot.parentElement !== rail) rail.appendChild(ui.mascot);
      if (pageWrap) pageWrap.classList.add("with-mascot");
      ui.mascot.classList.remove("lesson-mascot-mobile");
    }

    function placeCompact() {
      if (!homeContainer) return;
      if (ui.mascot.parentElement !== homeContainer) {
        if (homeNextSibling && homeNextSibling.parentElement === homeContainer) {
          homeContainer.insertBefore(ui.mascot, homeNextSibling);
        } else {
          homeContainer.appendChild(ui.mascot);
        }
      }
      if (pageWrap) pageWrap.classList.remove("with-mascot");
      ui.mascot.classList.add("lesson-mascot-mobile");
      ui.mascot.style.transform = "";
    }

    function syncLayout() {
      const compact = window.matchMedia("(max-width: 980px)").matches;
      if (compact) placeCompact();
      else placeDesktop();
    }

    function updateTargetY() {
      if (!pageWrap || window.matchMedia("(max-width: 980px)").matches) {
        runtime.mascotTargetY = 0;
        return;
      }
      const rail = getRail();
      if (!rail) return;
      const pageHeight = Math.max(document.documentElement.scrollHeight, document.body ? document.body.scrollHeight : 0, pageWrap.scrollHeight);
      const maxScroll = Math.max(1, pageHeight - window.innerHeight);
      const progressValue = Math.max(0, Math.min(1, window.scrollY / maxScroll));
      const mascotHeight = Math.ceil(ui.mascot.getBoundingClientRect().height || 220);
      const railHeight = Math.max(rail.offsetHeight || 0, pageWrap.scrollHeight);
      runtime.mascotTargetY = Math.max(0, railHeight - mascotHeight - 8) * progressValue;
    }

    function runFrame(timestamp) {
      if (!ui.mascot) return;
      if (window.matchMedia("(max-width: 980px)").matches) {
        runtime.mascotCurrentY = 0;
        runtime.mascotTargetY = 0;
        runtime.mascotRafId = window.requestAnimationFrame(runFrame);
        return;
      }
      const current = Number.isFinite(runtime.mascotCurrentY) ? runtime.mascotCurrentY : 0;
      const target = Number.isFinite(runtime.mascotTargetY) ? runtime.mascotTargetY : 0;
      const eased = current + (target - current) * 0.13;
      runtime.mascotCurrentY = eased;
      const floatOffset = prefersReducedMotion ? 0 : Math.sin((timestamp || 0) / 520) * 1.8;
      ui.mascot.style.transform = "translate3d(0," + (eased + floatOffset).toFixed(2) + "px,0)";
      runtime.mascotRafId = window.requestAnimationFrame(runFrame);
    }

    window.addEventListener("scroll", updateTargetY, { passive: true });
    window.addEventListener("resize", function () {
      syncLayout();
      updateTargetY();
    });
    syncLayout();
    updateTargetY();
    runtime.mascotRafId = window.requestAnimationFrame(runFrame);
  }

  function resolvePronunciationPath(text) {
    const direct = languagePronunciationMap[text];
    if (!direct) return "";
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

  function focusMeanings() {
    return (lesson.focus || []).map(function (item) { return item.meaning; }).filter(Boolean);
  }

  function focusWords() {
    return (lesson.focus || []).map(function (item) { return item.text; }).filter(Boolean);
  }

  function renderChoiceButtons(container, options, onPick) {
    if (!container) return;
    container.innerHTML = "";
    options.forEach(function (option) {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "button ghost";
      btn.textContent = option;
      btn.addEventListener("click", function () {
        onPick(option, btn);
      });
      container.appendChild(btn);
    });
  }

  function renderMatch() {
    if (!ui.matchPrompt || !ui.matchChoices) return;
    ui.matchPrompt.textContent = lesson.match.prompt;
    renderChoiceButtons(ui.matchChoices, lesson.match.options, function (option) {
      if (runtime.done.match) return;
      if (option === lesson.match.answer) {
        runtime.done.match = true;
        reward(eventKeyFor("match"), 1, 1);
        ui.matchStatus.textContent = "Great job!";
        setMascotSpeech(guideText.correct, "state-dancing");
        pulsePanels();
      } else {
        ui.matchStatus.textContent = "Try again!";
        setMascotSpeech(guideText.retry, "state-wave");
      }
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
    renderChoiceButtons(ui.listenChoices, lesson.listen.options, function (option) {
      if (runtime.done.listen) return;
      if (option === lesson.listen.answer) {
        runtime.done.listen = true;
        reward(eventKeyFor("listen"), 1, 1);
        ui.listenStatus.textContent = "You listened carefully!";
        setMascotSpeech(guideText.correct, "state-dancing");
        pulsePanels();
      } else {
        ui.listenStatus.textContent = "Listen once more and try again.";
        setMascotSpeech(guideText.retry, "state-wave");
      }
    });
  }

  function renderBuild() {
    if (!ui.buildPrompt || !ui.buildTiles) return;
    ui.buildPrompt.textContent = lesson.build.prompt;
    ui.buildTiles.innerHTML = "";
    runtime.buildAnswer = [];
    if (ui.buildAnswer) ui.buildAnswer.textContent = "";
    (lesson.build.tiles || []).forEach(function (tile) {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "button ghost";
      btn.textContent = tile;
      btn.addEventListener("click", function () {
        runtime.buildAnswer.push(tile);
        if (ui.buildAnswer) ui.buildAnswer.textContent = runtime.buildAnswer.join("");
      });
      ui.buildTiles.appendChild(btn);
    });
    if (ui.buildCheck) {
      ui.buildCheck.onclick = function () {
        if (runtime.done.build) return;
        if (runtime.buildAnswer.join("").toLowerCase() === String(lesson.build.answer || "").toLowerCase()) {
          runtime.done.build = true;
          reward(eventKeyFor("build"), 1, 1);
          ui.buildStatus.textContent = "Wonderful building!";
          setMascotSpeech(guideText.correct, "state-dancing");
          pulsePanels();
        } else {
          ui.buildStatus.textContent = "Try arranging the tiles again.";
          setMascotSpeech(guideText.retry, "state-wave");
        }
      };
    }
    if (ui.buildReset) {
      ui.buildReset.onclick = function () {
        runtime.buildAnswer = [];
        if (ui.buildAnswer) ui.buildAnswer.textContent = "";
        ui.buildStatus.textContent = "";
      };
    }
  }

  function renderPicture() {
    if (!ui.picturePrompt || !ui.pictureChoices) return;
    const focus = lesson.focus || [];
    const target = focus[0] || { text: lesson.match.answer, meaning: lesson.match.answer };
    const options = focusMeanings().slice(0, 3);
    if (!options.includes(target.meaning)) options[0] = target.meaning;
    ui.picturePrompt.textContent = "Choose the meaning of: " + target.text;
    renderChoiceButtons(ui.pictureChoices, options, function (option) {
      if (runtime.done.picture) return;
      if (option === target.meaning) {
        runtime.done.picture = true;
        reward(eventKeyFor("picture"), 1, 1);
        ui.pictureStatus.textContent = "Correct meaning!";
        setMascotSpeech(guideText.correct, "state-dancing");
      } else {
        ui.pictureStatus.textContent = "Try again. Look at the focus cards above.";
        setMascotSpeech(guideText.retry, "state-wave");
      }
    });
  }

  function renderReview() {
    if (!ui.reviewPrompt || !ui.reviewChoices) return;
    const focus = lesson.focus || [];
    const target = focus[1] || focus[0] || { text: lesson.listen.answer, meaning: lesson.listen.answer };
    const options = focusWords().slice(0, 3);
    if (!options.includes(target.text)) options[0] = target.text;
    ui.reviewPrompt.textContent = "Pick the word for: " + target.meaning;
    renderChoiceButtons(ui.reviewChoices, options, function (option) {
      if (runtime.done.review) return;
      if (option === target.text) {
        runtime.done.review = true;
        reward(eventKeyFor("review"), 1, 1);
        ui.reviewStatus.textContent = "Excellent review!";
        setMascotSpeech(guideText.correct, "state-dancing");
      } else {
        ui.reviewStatus.textContent = "Not yet. Check the focus words and try again.";
        setMascotSpeech(guideText.retry, "state-wave");
      }
    });
  }

  function renderConversation(panelKey, conversation, uiBlock) {
    if (!uiBlock.panel) return;
    if (!conversation) {
      uiBlock.panel.hidden = true;
      return;
    }
    uiBlock.panel.hidden = false;
    if (uiBlock.title) uiBlock.title.textContent = conversation.title;
    if (uiBlock.learn) {
      uiBlock.learn.innerHTML = "";
      (conversation.learn || []).forEach(function (line) {
        const li = document.createElement("li");
        li.textContent = line;
        uiBlock.learn.appendChild(li);
      });
    }
    if (uiBlock.prompt) uiBlock.prompt.textContent = conversation.quizPrompt;
    renderChoiceButtons(uiBlock.choices, conversation.quizOptions || [], function (option) {
      if (runtime.done[panelKey]) return;
      if (option === conversation.quizAnswer) {
        runtime.done[panelKey] = true;
        reward(eventKeyFor(panelKey), 1, 1);
        uiBlock.status.textContent = "Great conversation answer!";
        setMascotSpeech(guideText.correct, "state-dancing");
      } else {
        uiBlock.status.textContent = "Try once more. Read the conversation lines again.";
        setMascotSpeech(guideText.retry, "state-wave");
      }
    });
  }

  function restartActivity(activityKey) {
    runtime.done[activityKey] = false;
    bumpAttemptCycle(activityKey);
    if (activityKey === "match") {
      ui.matchStatus.textContent = "New attempt started.";
      renderMatch();
    } else if (activityKey === "listen") {
      ui.listenStatus.textContent = "New attempt started.";
      stopActiveAudio();
      renderListen();
    } else if (activityKey === "build") {
      ui.buildStatus.textContent = "New attempt started.";
      renderBuild();
    } else if (activityKey === "picture") {
      ui.pictureStatus.textContent = "New attempt started.";
      renderPicture();
    } else if (activityKey === "review") {
      ui.reviewStatus.textContent = "New attempt started.";
      renderReview();
    } else if (activityKey === "conversationA") {
      if (ui.conversationAStatus) ui.conversationAStatus.textContent = "New attempt started.";
      renderConversation("conversationA", conversationActivities[0], {
        panel: ui.conversationPanelA,
        title: ui.conversationATitle,
        learn: ui.conversationALearn,
        prompt: ui.conversationAPrompt,
        choices: ui.conversationAChoices,
        status: ui.conversationAStatus
      });
    } else if (activityKey === "conversationB") {
      if (ui.conversationBStatus) ui.conversationBStatus.textContent = "New attempt started.";
      renderConversation("conversationB", conversationActivities[1], {
        panel: ui.conversationPanelB,
        title: ui.conversationBTitle,
        learn: ui.conversationBLearn,
        prompt: ui.conversationBPrompt,
        choices: ui.conversationBChoices,
        status: ui.conversationBStatus
      });
    }
    activatePanelGuide(activityKey);
  }

  function completeLesson() {
    const done = activeActivities.every(function (key) { return Boolean(runtime.done[key]); });
    if (!done) {
      if (ui.buildStatus) ui.buildStatus.textContent = "Complete all activities first.";
      setMascotSpeech(messageForPanel(runtime.activePanel), "state-wave");
      return;
    }
    if (!Array.isArray(progress.completedLessons)) progress.completedLessons = [];
    if (!progress.completedLessons.includes(0)) {
      progress.completedLessons.push(0);
      persist();
    }
    const bonusKey = world.key + ".lessonBonus." + activeActivities
      .map(function (key) { return key + ":" + String(progress.attemptCycles[key] || 0); })
      .join("|");
    reward(bonusKey, 5, 0);
    renderHeader();
    updateUnlockInvitation();
    if (ui.buildStatus) ui.buildStatus.textContent = "Lesson complete! You earned bonus stars.";
    setMascotSpeech(guideText.complete, "state-dancing");
    if (window.confetti && !prefersReducedMotion) {
      window.confetti({ particleCount: 46, spread: 58, origin: { y: 0.7 } });
    }
    pulsePanels();
  }

  function wire() {
    if (ui.matchRestart) ui.matchRestart.addEventListener("click", function () { restartActivity("match"); });
    if (ui.listenRestart) ui.listenRestart.addEventListener("click", function () { restartActivity("listen"); });
    if (ui.buildRestart) ui.buildRestart.addEventListener("click", function () { restartActivity("build"); });
    if (ui.pictureRestart) ui.pictureRestart.addEventListener("click", function () { restartActivity("picture"); });
    if (ui.reviewRestart) ui.reviewRestart.addEventListener("click", function () { restartActivity("review"); });
    if (ui.conversationARestart) ui.conversationARestart.addEventListener("click", function () { restartActivity("conversationA"); });
    if (ui.conversationBRestart) ui.conversationBRestart.addEventListener("click", function () { restartActivity("conversationB"); });
    if (ui.completeLesson) ui.completeLesson.addEventListener("click", completeLesson);
    if (ui.worldUnlockInviteBtn) {
      ui.worldUnlockInviteBtn.addEventListener("click", function () {
        if (!runtime.unlockTargetWorld) return;
        goToWorld(runtime.unlockTargetWorld);
      });
    }
    window.addEventListener("pagehide", function () {
      stopActiveAudio();
      if (runtime.observer) runtime.observer.disconnect();
      if (runtime.mascotRafId) window.cancelAnimationFrame(runtime.mascotRafId);
    });
  }

  renderHeader();
  renderMatch();
  renderListen();
  renderBuild();
  renderPicture();
  renderReview();
  renderConversation("conversationA", conversationActivities[0], {
    panel: ui.conversationPanelA,
    title: ui.conversationATitle,
    learn: ui.conversationALearn,
    prompt: ui.conversationAPrompt,
    choices: ui.conversationAChoices,
    status: ui.conversationAStatus
  });
  renderConversation("conversationB", conversationActivities[1], {
    panel: ui.conversationPanelB,
    title: ui.conversationBTitle,
    learn: ui.conversationBLearn,
    prompt: ui.conversationBPrompt,
    choices: ui.conversationBChoices,
    status: ui.conversationBStatus
  });
  initGuideFlow();
  setupMascotFollowOnScroll();
  wire();
  updateUnlockInvitation();
})();
