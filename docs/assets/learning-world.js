(function initLearningWorld() {
  const params = new URLSearchParams(window.location.search);
  const worldKey = params.get("world");
  const worlds = window.SANSKRIT_WORLDS || {};
  const world = worlds[worldKey];
  if (!world) {
    window.location.href = "explore-worlds.html";
    return;
  }

  const STORAGE_PREFIX = window.SP_STORAGE_PREFIX || "sanskritParichay";
  const LANGUAGE_HOME_URL = window.SP_LANGUAGE_HOME_URL || "sanskritparichay/";
  function storageKey(suffix) {
    return STORAGE_PREFIX + "." + suffix;
  }
  const HOME_KEY = storageKey("home.progress");
  const WORLD_KEY = storageKey("world." + worldKey + ".progress");
  const LAST_WORLD_KEY = storageKey("lastWorld");
  const UNLOCK_STAR_TARGET = 50;
  const UNLOCK_GEM_TARGET = 1;
  const SPEECH_PRIORITY = {
    welcome: 1,
    guidance: 2,
    feedback: 3,
    completion: 4,
    world: 5
  };
  const SPEECH_LABEL = {
    welcome: "Welcome",
    guidance: "Activity",
    feedback: "Try Again",
    completion: "Great Job",
    world: "World Unlocked"
  };
  const TOTAL = 3;
  const ACTIVITY_IDS = ["match", "listen", "build"];
  const WORLD_ORDER = Array.isArray(window.SP_WORLD_ORDER) && window.SP_WORLD_ORDER.length
    ? window.SP_WORLD_ORDER.slice()
    : ["alphabet", "animals", "numbers", "colours", "words", "sentences", "stories", "culture"];
  const WORLD_TOTALS = window.SP_WORLD_TOTALS && typeof window.SP_WORLD_TOTALS === "object"
    ? Object.assign({}, window.SP_WORLD_TOTALS)
    : {
        alphabet: 9,
        animals: 3,
        numbers: 3,
        colours: 3,
        words: 3,
        sentences: 3,
        stories: 3,
        culture: 3
      };
  if (typeof window.spIsWorldUnlocked === "function" && !window.spIsWorldUnlocked(worldKey, WORLD_ORDER)) {
    window.location.href = LANGUAGE_HOME_URL + "#worlds";
    return;
  }
  const motion = window.Motion || {};
  const animate = motion.animate || function () {};
  const prefersReducedMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const scriptSrc = document.currentScript && document.currentScript.src ? document.currentScript.src : "";
  const sparkleLottieSource = scriptSrc
    ? scriptSrc.replace(/learning-world\.js(?:\?.*)?$/i, "lottie/sparkle.json")
    : "assets/lottie/sparkle.json";
  const sparkleLottiePath = typeof window.spResolveAssetPath === "function"
    ? window.spResolveAssetPath(sparkleLottieSource)
    : sparkleLottieSource;
  const messages = window.SP_MESSAGES || {};
  const vocabMap = window.SP_VOCABULARY_MAP && window.SP_VOCABULARY_MAP.words ? window.SP_VOCABULARY_MAP.words : {};
  const vocabFallback = window.SP_VOCABULARY_MAP && window.SP_VOCABULARY_MAP.fallback
    ? window.SP_VOCABULARY_MAP.fallback
    : { image: "", alt: "" };
  const worldWelcome = (messages.worldWelcome && messages.worldWelcome[worldKey]) || ("Namaste! Let's learn " + world.title + ".");
  const praisePool = (messages.alphabetForest && messages.alphabetForest.correct) || ["Wonderful! Let's keep going!"];
  const retryPool = (messages.alphabetForest && messages.alphabetForest.incorrect) || ["Not quite! Have another look!"];
  const completePool = (messages.alphabetForest && messages.alphabetForest.completed) || ["Wow! You did it! Let's celebrate!"];
  const messageCursor = {};
  const speechRuntime = {
    holdUntil: 0,
    priority: 0,
    text: "",
    category: "guidance"
  };
  const numberGalaxyState = {
    layer: null,
    badges: []
  };
  const inviteRuntime = {
    targetWorld: "",
    unlockNonce: 0,
    eventKey: ""
  };

  const ui = {
    worldTitle: document.getElementById("worldTitle"),
    worldSubtitle: document.getElementById("worldSubtitle"),
    worldLessonName: document.getElementById("worldLessonName"),
    worldLessonIndex: document.getElementById("worldLessonIndex"),
    worldLessonObjective: document.getElementById("worldLessonObjective"),
    worldPrevLessonBtn: document.getElementById("worldPrevLessonBtn"),
    worldNextLessonBtn: document.getElementById("worldNextLessonBtn"),
    worldBackBtn: document.getElementById("worldBackBtn"),
    worldIllustration: document.getElementById("worldIllustration"),
    worldIllustrationSparkle: document.getElementById("worldIllustrationSparkle"),
    worldLessonPath: document.getElementById("worldLessonPath"),
    worldStars: document.getElementById("worldStars"),
    worldGems: document.getElementById("worldGems"),
    worldDone: document.getElementById("worldDone"),
    worldProgressFill: document.getElementById("worldProgressFill"),
    worldProgressText: document.getElementById("worldProgressText"),
    focusCards: document.getElementById("focusCards"),
    matchPrompt: document.getElementById("matchPrompt"),
    matchChoices: document.getElementById("matchChoices"),
    matchStatus: document.getElementById("matchStatus"),
    listenPrompt: document.getElementById("listenPrompt"),
    playListenBtn: document.getElementById("playListenBtn"),
    listenChoices: document.getElementById("listenChoices"),
    listenStatus: document.getElementById("listenStatus"),
    buildPrompt: document.getElementById("buildPrompt"),
    buildTiles: document.getElementById("buildTiles"),
    buildAnswer: document.getElementById("buildAnswer"),
    checkBuildBtn: document.getElementById("checkBuildBtn"),
    resetBuildBtn: document.getElementById("resetBuildBtn"),
    buildStatus: document.getElementById("buildStatus"),
    worldReviewList: document.getElementById("worldReviewList"),
    lessonMascot: document.getElementById("lessonMascot"),
    worldMascotSpeech: document.getElementById("worldMascotSpeech"),
    worldUnlockInvite: document.getElementById("worldUnlockInvite"),
    worldUnlockInviteBtn: document.getElementById("worldUnlockInviteBtn"),
    restartMatchActivityBtn: document.getElementById("restartMatchActivityBtn"),
    restartListenActivityBtn: document.getElementById("restartListenActivityBtn"),
    restartBuildActivityBtn: document.getElementById("restartBuildActivityBtn")
  };

  const safe = {
    lessonIndex: 0,
    stars: 0,
    gems: 0,
    completedLessons: [],
    done: { match: false, listen: false, build: false },
    practiceCompleted: { match: false, listen: false, build: false },
    completedActivities: {},
    rewardedActivities: {},
    rewardedGroupBonuses: {},
    rewardedActivityGems: {},
    activityAttempts: { match: 0, listen: 0, build: 0 },
    attemptCycleByLesson: {}
  };

  const state = {
    progress: loadProgress(),
    buildSelected: []
  };
  let worldSparkleAnim = null;

  function pickMessage(key, list) {
    if (!Array.isArray(list) || !list.length) return "";
    const previous = messageCursor[key] || "";
    const options = list.length > 1 ? list.filter(function (item) { return item !== previous; }) : list;
    const selected = options[Math.floor(Math.random() * options.length)] || list[0];
    messageCursor[key] = selected;
    return selected;
  }

  function loadProgress() {
    try {
      const raw = localStorage.getItem(WORLD_KEY);
      if (!raw) return JSON.parse(JSON.stringify(safe));
      const p = JSON.parse(raw);
      return {
        lessonIndex: Number(p.lessonIndex || 0),
        stars: Number(p.stars || 0),
        gems: Number(p.gems || 0),
        completedLessons: Array.isArray(p.completedLessons) ? p.completedLessons : [],
        done: {
          match: Boolean(p.done && p.done.match),
          listen: Boolean(p.done && p.done.listen),
          build: Boolean(p.done && p.done.build)
        },
        practiceCompleted: {
          match: Boolean((p.practiceCompleted && p.practiceCompleted.match) || (p.done && p.done.match)),
          listen: Boolean((p.practiceCompleted && p.practiceCompleted.listen) || (p.done && p.done.listen)),
          build: Boolean((p.practiceCompleted && p.practiceCompleted.build) || (p.done && p.done.build))
        },
        completedActivities: p.completedActivities && typeof p.completedActivities === "object" ? p.completedActivities : {},
        rewardedActivities: p.rewardedActivities && typeof p.rewardedActivities === "object" ? p.rewardedActivities : {},
        rewardedGroupBonuses: p.rewardedGroupBonuses && typeof p.rewardedGroupBonuses === "object" ? p.rewardedGroupBonuses : {},
        rewardedActivityGems: p.rewardedActivityGems && typeof p.rewardedActivityGems === "object" ? p.rewardedActivityGems : {},
        activityAttempts: p.activityAttempts && typeof p.activityAttempts === "object"
          ? {
              match: Number(p.activityAttempts.match || 0),
              listen: Number(p.activityAttempts.listen || 0),
              build: Number(p.activityAttempts.build || 0)
            }
          : { match: 0, listen: 0, build: 0 },
        attemptCycleByLesson: p.attemptCycleByLesson && typeof p.attemptCycleByLesson === "object" ? p.attemptCycleByLesson : {}
      };
    } catch (error) {
      return JSON.parse(JSON.stringify(safe));
    }
  }

  function saveProgress() {
    localStorage.setItem(WORLD_KEY, JSON.stringify(state.progress));
    if (typeof window.spSyncProgressModel === "function") {
      window.spSyncProgressModel(WORLD_ORDER, WORLD_TOTALS);
    }
  }

  function currentLesson() {
    return world.lessons[Math.max(0, Math.min(world.lessons.length - 1, state.progress.lessonIndex))];
  }

  function getIllustrationForWord(word) {
    const entry = vocabMap[word];
    if (entry && entry.image) return entry;
    return vocabFallback;
  }

  function renderPromptWithImage(node, promptText, word) {
    if (!node) return;
    const art = getIllustrationForWord(word);
    const imagePath = art && art.image && typeof window.spResolveAssetPath === "function"
      ? window.spResolveAssetPath(art.image)
      : (art && art.image ? art.image : "");
    const img = imagePath
      ? '<img class="picture-illustration" src="' + imagePath + '" alt="' + (art.alt || "Learning illustration") + '">'
      : "";
    node.innerHTML = '<span>' + promptText + '</span>' + (img ? ('<span class="prompt-illustration">' + img + "</span>") : "");
  }

  function setSpeech(text, tone, options) {
    if (!ui.worldMascotSpeech) return;
    if (!text) return;
    const opts = options || {};
    const now = Date.now();
    const category = opts.category || "guidance";
    const priority = Number.isFinite(opts.priority)
      ? opts.priority
      : (SPEECH_PRIORITY[category] || SPEECH_PRIORITY.guidance);
    const holdMs = Number.isFinite(opts.holdMs) ? Math.max(0, opts.holdMs) : 2200;
    const force = Boolean(opts.force);
    if (!force && now < speechRuntime.holdUntil && priority < speechRuntime.priority) return;
    if (!force && text === speechRuntime.text && now < speechRuntime.holdUntil) return;
    ui.worldMascotSpeech.textContent = text;
    ui.worldMascotSpeech.setAttribute("data-label", SPEECH_LABEL[category] || SPEECH_LABEL.guidance);
    ui.worldMascotSpeech.classList.remove("tone-instruction", "tone-encourage", "tone-correct", "tone-complete", "tone-world");
    ui.worldMascotSpeech.classList.add("tone-" + (tone || "instruction"));
    speechRuntime.text = text;
    speechRuntime.priority = priority;
    speechRuntime.holdUntil = now + holdMs;
    speechRuntime.category = category;
  }

  function currentGuidanceText() {
    if (!state.progress.done.match) return "Let's solve the match activity together!";
    if (!state.progress.done.listen) return "Now listen carefully and choose the right word!";
    if (!state.progress.done.build) return "Great! Let's build the Sanskrit phrase with tiles.";
    return "Wonderful progress! Keep exploring this lesson.";
  }

  function setMascot(kind) {
    const body = ui.lessonMascot.querySelector(".mithu-body");
    const wingL = ui.lessonMascot.querySelector(".mithu-wing-left");
    const wingR = ui.lessonMascot.querySelector(".mithu-wing-right");
    const eyeL = ui.lessonMascot.querySelector(".mithu-eye-left");
    const eyeR = ui.lessonMascot.querySelector(".mithu-eye-right");
    if (!body) return;

    if (kind === "idle") {
      animate(body, { transform: ["translateY(0px)", "translateY(-2px)", "translateY(0px)"] }, { duration: 2.2, repeat: Infinity, easing: "ease-in-out" });
      animate([eyeL, eyeR], { transform: ["scaleY(1)", "scaleY(0.2)", "scaleY(1)"] }, { duration: 4.2, repeat: Infinity, easing: "ease-in-out" });
    } else if (kind === "thinking") {
      animate(body, { transform: ["rotate(0deg)", "rotate(-4deg)", "rotate(0deg)"] }, { duration: 0.8, easing: "ease-in-out" });
    } else if (kind === "flying") {
      animate(ui.lessonMascot, { transform: ["translateX(0px) translateY(0px)", "translateX(12px) translateY(-6px)", "translateX(0px) translateY(0px)"] }, { duration: 0.8, easing: "ease-in-out" });
      animate([wingL, wingR], { transform: ["rotate(0deg)", "rotate(30deg)", "rotate(0deg)"] }, { duration: 0.35, repeat: 2, easing: "ease-in-out" });
    } else if (kind === "listening") {
      animate(body, { transform: ["rotate(0deg)", "rotate(2deg)", "rotate(0deg)"] }, { duration: 0.8, easing: "ease-in-out" });
    } else if (kind === "encouraging") {
      animate(body, { transform: ["translateY(0px)", "translateY(-4px)", "translateY(0px)"] }, { duration: 0.6, easing: "ease-in-out" });
    } else if (kind === "eating") {
      animate(body, { transform: ["translateY(0px)", "translateY(-3px)", "translateY(0px)", "translateY(-2px)", "translateY(0px)"] }, { duration: 0.8, easing: "ease-in-out" });
    } else if (kind === "correct") {
      animate(body, { transform: ["translateY(0px)", "translateY(-10px)", "translateY(0px)"] }, { duration: 0.5, easing: "ease-out" });
      animate([wingL, wingR], { transform: ["rotate(0deg)", "rotate(28deg)", "rotate(0deg)"] }, { duration: 0.45, easing: "ease-out" });
    } else if (kind === "wrong") {
      animate(body, { transform: ["rotate(0deg)", "rotate(3deg)", "rotate(-3deg)", "rotate(0deg)"] }, { duration: 0.7, easing: "ease-in-out" });
    } else if (kind === "dance") {
      animate(body, { transform: ["translateY(0px) rotate(0deg)", "translateY(-7px) rotate(5deg)", "translateY(0px) rotate(-5deg)", "translateY(0px) rotate(0deg)"] }, { duration: 1.1, repeat: 2, easing: "ease-in-out" });
    }
  }

  function confetti() {
    if (window.SP_STATE && window.SP_STATE.muted) return;
    if (window.confetti) {
      window.confetti({ particleCount: 52, spread: 64, startVelocity: 30, ticks: 95, origin: { y: 0.68 } });
    }
    if (window.spApplause) window.spApplause();
  }

  function transliterationToAudioStem(value) {
    return String(value || "")
      .toLowerCase()
      .replace(/[^a-z]/g, "");
  }

  function getSanskritAudioPath(devanagariText) {
    if (typeof window.spResolveSanskritAudioPath === "function") {
      return window.spResolveSanskritAudioPath(devanagariText);
    }
    const text = String(devanagariText || "").trim();
    if (!text) return "";
    const vocabEntry = vocabMap[text];
    if (vocabEntry && vocabEntry.transliteration) {
      const stem = transliterationToAudioStem(vocabEntry.transliteration);
      if (stem) return "assets/audio/pronunciation/" + stem + ".wav";
    }
    const inventory = window.SP_PDF_LETTER_INVENTORY && Array.isArray(window.SP_PDF_LETTER_INVENTORY.items)
      ? window.SP_PDF_LETTER_INVENTORY.items
      : [];
    const direct = inventory.find(function (item) { return item && item.symbol === text; });
    if (direct && direct.pronunciation && direct.pronunciation.localPath) {
      return direct.pronunciation.localPath;
    }
    const byExample = inventory.find(function (item) {
      return item && item.example && item.example.sanskrit === text && item.pronunciation && item.pronunciation.localPath;
    });
    if (byExample && byExample.pronunciation && byExample.pronunciation.localPath) {
      return byExample.pronunciation.localPath;
    }
    return "";
  }

  function playSanskritAudio(text, statusEl) {
    if (!text) return;
    if (window.SP_STATE && window.SP_STATE.muted) return;
    if (typeof window.spSpeak === "function") {
      window.spSpeak(text, "sa-IN", statusEl, text);
      return;
    }
    const path = getSanskritAudioPath(text);
    if (!path || typeof window.spPlayAudioClip !== "function") {
      if (statusEl) statusEl.textContent = "Pronunciation clip is not ready yet for this word.";
      return;
    }
    window.spPlayAudioClip(path, statusEl, function () {
      if (statusEl) statusEl.textContent = "Pronunciation clip is not ready yet for this word.";
    });
  }

  function initWorldIllustration() {
    if (!ui.worldIllustration) return;
    ui.worldIllustration.classList.add("world-illustration--" + worldKey);
    if (worldKey === "numbers") {
      ensureNumberGalaxyLayer();
      updateNumberGalaxyBadges();
    }
    if (!prefersReducedMotion) {
      animate(
        ui.worldIllustration.querySelectorAll(".world-clouds ellipse"),
        { transform: ["translateX(0px)", "translateX(10px)", "translateX(0px)"] },
        { duration: 5.8, repeat: Infinity, easing: "ease-in-out", delay: function (i) { return i * 0.12; } }
      );
      animate(
        ui.worldIllustration.querySelectorAll(".world-sparkles circle"),
        { opacity: [0.42, 1, 0.48], transform: ["scale(0.8)", "scale(1.15)", "scale(0.85)"] },
        { duration: 2.8, repeat: Infinity, easing: "ease-in-out", delay: function (i) { return i * 0.22; } }
      );
    }
    if (window.lottie && ui.worldIllustrationSparkle) {
      worldSparkleAnim = window.lottie.loadAnimation({
        container: ui.worldIllustrationSparkle,
        renderer: "svg",
        loop: true,
        autoplay: true,
        path: sparkleLottiePath
      });
    }
  }

  function ensureNumberGalaxyLayer() {
    if (!ui.worldIllustration || worldKey !== "numbers") return;
    if (numberGalaxyState.layer && numberGalaxyState.layer.isConnected) return;
    const layer = document.createElement("div");
    layer.className = "number-galaxy-layer";
    layer.innerHTML =
      '<div class="number-galaxy-stars"><span></span><span></span><span></span><span></span><span></span><span></span><span></span></div>' +
      '<div class="number-galaxy-planet planet-a"></div>' +
      '<div class="number-galaxy-planet planet-b"></div>' +
      '<div class="number-galaxy-planet planet-c"></div>' +
      '<div class="number-galaxy-rocket" aria-hidden="true"></div>' +
      '<div class="number-galaxy-badges"></div>';
    ui.worldIllustration.appendChild(layer);
    numberGalaxyState.layer = layer;
  }

  function updateNumberGalaxyBadges() {
    if (worldKey !== "numbers") return;
    ensureNumberGalaxyLayer();
    if (!numberGalaxyState.layer) return;
    const holder = numberGalaxyState.layer.querySelector(".number-galaxy-badges");
    if (!holder) return;
    const focus = currentLesson().focus || [];
    holder.innerHTML = "";
    numberGalaxyState.badges = [];
    focus.slice(0, 3).forEach(function (item) {
      const badge = document.createElement("span");
      badge.className = "number-galaxy-badge";
      badge.setAttribute("data-number-word", item.dev);
      badge.textContent = item.dev;
      holder.appendChild(badge);
      numberGalaxyState.badges.push(badge);
    });
  }

  function celebrateNumberGalaxy(word) {
    if (worldKey !== "numbers" || !numberGalaxyState.layer) return;
    numberGalaxyState.layer.classList.add("celebrate");
    const active = numberGalaxyState.badges.find(function (badge) {
      return badge.getAttribute("data-number-word") === word;
    });
    if (active) {
      active.classList.add("active");
      window.setTimeout(function () {
        active.classList.remove("active");
      }, 900);
    }
    window.setTimeout(function () {
      if (numberGalaxyState.layer) numberGalaxyState.layer.classList.remove("celebrate");
    }, 1000);
  }

  function pulseWorldIllustration() {
    if (!ui.worldIllustration || prefersReducedMotion) return;
    animate(ui.worldIllustration, { transform: ["scale(1)", "scale(1.018)", "scale(1)"] }, { duration: 0.5, easing: "ease-in-out" });
  }

  function updateHomeCompletion() {
    try {
      const raw = localStorage.getItem(HOME_KEY);
      const home = raw ? JSON.parse(raw) : { completed: [] };
      if (!home.completed.includes(worldKey)) {
        home.completed.push(worldKey);
      }
      localStorage.setItem(HOME_KEY, JSON.stringify(home));
      if (typeof window.spSyncProgressModel === "function") {
        window.spSyncProgressModel(WORLD_ORDER, WORLD_TOTALS);
      }
    } catch (error) {
      // Keep local world progress even if home aggregate update fails.
    }
  }

  function doneCount() {
    return Object.values(state.progress.done).filter(Boolean).length;
  }

  function activityKey(lessonIndex, activityId) {
    return String(lessonIndex) + ":" + String(activityId);
  }

  function lessonBonusKey(lessonIndex) {
    return "lesson:" + String(lessonIndex);
  }

  function syncDoneForCurrentLesson() {
    state.progress.done = {
      match: Boolean(state.progress.done.match),
      listen: Boolean(state.progress.done.listen),
      build: Boolean(state.progress.done.build)
    };
    state.progress.practiceCompleted = {
      match: state.progress.done.match,
      listen: state.progress.done.listen,
      build: state.progress.done.build
    };
  }

  function getCurrentRewardProgress() {
    return {
      currentStars: Math.max(0, Math.floor(Number(state.progress.stars || 0))),
      currentGems: Math.max(0, Math.floor(Number(state.progress.gems || 0))),
      completedLessonCount: state.progress.completedLessons.length
    };
  }

  function getNextWorldKey() {
    const index = WORLD_ORDER.indexOf(worldKey);
    if (index < 0 || index >= WORLD_ORDER.length - 1) return null;
    return WORLD_ORDER[index + 1];
  }

  function getNextWorldUrl() {
    const nextWorld = getNextWorldKey();
    if (!nextWorld) return LANGUAGE_HOME_URL + "#worlds";
    if (nextWorld === "alphabet") return "alphabet-forest.html";
    return "learning-world.html?world=" + nextWorld;
  }

  function getWorldUrl(worldValue) {
    if (!worldValue) return LANGUAGE_HOME_URL + "#worlds";
    if (worldValue === "alphabet") return "alphabet-forest.html";
    return "learning-world.html?world=" + worldValue;
  }

  function getLatestUnlockInfo() {
    if (typeof window.spGetProgressSnapshot !== "function") {
      return { world: "", nonce: 0 };
    }
    const snapshot = window.spGetProgressSnapshot(WORLD_ORDER, WORLD_TOTALS);
    const rewards = snapshot && snapshot.rewards && typeof snapshot.rewards === "object" ? snapshot.rewards : {};
    const unlockedWorld = typeof rewards.lastUnlockedWorld === "string" ? rewards.lastUnlockedWorld : "";
    const unlockNonce = Math.max(0, Math.floor(Number(rewards.unlockNonce || 0)));
    if (!unlockedWorld || !WORLD_ORDER.includes(unlockedWorld) || unlockedWorld === "alphabet") {
      return { world: "", nonce: unlockNonce };
    }
    if (typeof window.spIsWorldUnlocked === "function" && !window.spIsWorldUnlocked(unlockedWorld, WORLD_ORDER)) {
      return { world: "", nonce: unlockNonce };
    }
    return { world: unlockedWorld, nonce: unlockNonce };
  }

  function syncUnlockInviteButtonLabel(worldValue) {
    if (!ui.worldUnlockInviteBtn) return;
    const meta = window.SP_WORLD_META && window.SP_WORLD_META[worldValue] ? window.SP_WORLD_META[worldValue] : null;
    const label = meta && meta.title ? meta.title : "Next World";
    ui.worldUnlockInviteBtn.textContent = "✨ Let's Go Together!";
    ui.worldUnlockInviteBtn.setAttribute("aria-label", "Go to " + label);
  }

  function restartActivity(activityId) {
    state.progress.done[activityId] = false;
    state.progress.practiceCompleted[activityId] = false;
    state.progress.activityAttempts[activityId] = Number(state.progress.activityAttempts[activityId] || 0) + 1;
    const idx = state.progress.lessonIndex;
    state.progress.attemptCycleByLesson[idx] = Number(state.progress.attemptCycleByLesson[idx] || 0) + 1;
    if (activityId === "build") {
      state.buildSelected = [];
      renderBuild();
    }
    if (activityId === "match") renderMatch();
    if (activityId === "listen") renderListen();
    saveProgress();
    renderHeader();
    setMascot("encouraging");
    setSpeech("Let's practise again! Every try makes us better!", "encourage", { category: "feedback", holdMs: 2600 });
  }

  function showUnlockInvite() {
    if (!ui.worldUnlockInvite) return;
    ui.worldUnlockInvite.hidden = false;
  }

  function hideUnlockInvite() {
    if (!ui.worldUnlockInvite) return;
    ui.worldUnlockInvite.hidden = true;
  }

  function getUnlockEventKey(targetWorld) {
    return storageKey("unlock.event." + String(targetWorld || worldKey));
  }

  function updateUnlockInvitation() {
    const nextWorldKey = getNextWorldKey();
    if (!nextWorldKey) {
      inviteRuntime.targetWorld = "";
      inviteRuntime.unlockNonce = 0;
      inviteRuntime.eventKey = "";
      hideUnlockInvite();
      return;
    }
    const unlockInfo = getLatestUnlockInfo();
    const unlocked = typeof window.spIsWorldUnlocked === "function"
      ? window.spIsWorldUnlocked(nextWorldKey, WORLD_ORDER)
      : false;
    if (!unlocked) {
      inviteRuntime.targetWorld = "";
      inviteRuntime.unlockNonce = 0;
      inviteRuntime.eventKey = "";
      hideUnlockInvite();
      if (speechRuntime.category === "world") {
        setSpeech(currentGuidanceText(), "instruction", { category: "guidance", holdMs: 2600, force: true });
      }
      return;
    }
    inviteRuntime.targetWorld = nextWorldKey;
    inviteRuntime.unlockNonce = unlockInfo.world === nextWorldKey ? unlockInfo.nonce : 0;
    inviteRuntime.eventKey = getUnlockEventKey(nextWorldKey);
    syncUnlockInviteButtonLabel(nextWorldKey);
    const unlockNonceKey = String(inviteRuntime.unlockNonce || 0);
    if (unlockInfo.world === nextWorldKey && localStorage.getItem(inviteRuntime.eventKey) !== unlockNonceKey) {
      localStorage.setItem(inviteRuntime.eventKey, unlockNonceKey);
      setMascot("dance");
      setSpeech("Hooray! A new world is ready. Let's explore!", "world", { category: "world", holdMs: 6000, force: true });
      confetti();
      if (typeof window.spFlowerRain === "function") window.spFlowerRain(document.getElementById("main-content"), { density: 24, durationMs: 2600 });
    }
    showUnlockInvite();
  }

  function rewardIfFirstTime(activityId) {
    if (state.progress.done[activityId]) return false;
    const key = activityKey(state.progress.lessonIndex, activityId);
    state.progress.completedActivities[key] = true;
    state.progress.done[activityId] = true;
    state.progress.practiceCompleted[activityId] = true;
    state.progress.stars += 1;
    state.progress.gems += 1;
    const cycle = Number((state.progress.attemptCycleByLesson || {})[state.progress.lessonIndex] || 0);
    const lessonKey = lessonBonusKey(state.progress.lessonIndex) + ":cycle:" + cycle;
    const lessonComplete = ACTIVITY_IDS.every(function (id) { return Boolean(state.progress.done[id]); });
    if (lessonComplete && !state.progress.rewardedGroupBonuses[lessonKey]) {
      state.progress.rewardedGroupBonuses[lessonKey] = true;
      state.progress.stars += 5;
      if (!state.progress.completedLessons.includes(state.progress.lessonIndex)) {
        state.progress.completedLessons.push(state.progress.lessonIndex);
      }
    }
    return true;
  }

  function renderHeader() {
    syncDoneForCurrentLesson();
    const lesson = currentLesson();
    ui.worldTitle.textContent = world.title;
    ui.worldSubtitle.textContent = worldWelcome;
    ui.worldLessonName.textContent = lesson.title;
    ui.worldLessonIndex.textContent = "Lesson " + (state.progress.lessonIndex + 1) + " / " + world.lessons.length;
    ui.worldLessonObjective.textContent = lesson.objective;
    if (ui.worldPrevLessonBtn) ui.worldPrevLessonBtn.disabled = state.progress.lessonIndex === 0;
    ui.worldStars.textContent = String(state.progress.stars);
    if (ui.worldGems) ui.worldGems.textContent = String(state.progress.gems);
    ui.worldDone.textContent = String(doneCount());
    ui.worldProgressFill.style.width = Math.round((doneCount() / TOTAL) * 100) + "%";
    updateNumberGalaxyBadges();

    const lessonDone = doneCount() >= TOTAL;
    const isLast = state.progress.lessonIndex >= world.lessons.length - 1;
    if (lessonDone && !isLast) {
      ui.worldNextLessonBtn.disabled = false;
      ui.worldNextLessonBtn.textContent = "Unlock Next Lesson";
      ui.worldProgressText.textContent = "Great! Unlock the next lesson.";
      pulseWorldIllustration();
    } else if (lessonDone && isLast) {
      ui.worldNextLessonBtn.disabled = true;
      ui.worldNextLessonBtn.textContent = "World Completed";
      ui.worldProgressText.textContent = "Hooray! A new world is ready. Let's explore!";
      updateHomeCompletion();
      setMascot("dance");
      setSpeech("Hooray! Another magical adventure completed!", "world", { category: "completion", holdMs: 4200 });
      pulseWorldIllustration();
    } else {
      ui.worldNextLessonBtn.disabled = true;
      ui.worldNextLessonBtn.textContent = "Next Lesson (complete all activities)";
      ui.worldProgressText.textContent = "Finish all activities in this lesson.";
    }
    const unlockRewards = typeof window.spGetRewards === "function"
      ? window.spGetRewards(WORLD_ORDER, WORLD_TOTALS)
      : { stars: 0, gems: 0 };
    const availableStars = Math.max(0, Math.floor(Number(unlockRewards.stars || 0)));
    const availableGems = Math.max(0, Math.floor(Number(unlockRewards.gems || 0)));
    if (availableStars < UNLOCK_STAR_TARGET || availableGems < UNLOCK_GEM_TARGET) {
      ui.worldProgressText.textContent = "Keep playing! Our next world is getting closer.";
    }
    updateUnlockInvitation();
  }

  function renderLessonPath() {
    ui.worldLessonPath.innerHTML = "";
    for (let i = 0; i < world.lessons.length; i += 1) {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "path-node";
      const title = document.createElement("span");
      title.className = "path-title";
      title.textContent = (i + 1) + ". " + world.lessons[i].title;
      const status = document.createElement("span");
      status.className = "path-state";

      const unlocked = i === 0 || state.progress.completedLessons.includes(i - 1) || i <= state.progress.lessonIndex;
      const completed = state.progress.completedLessons.includes(i);
      if (completed) {
        btn.classList.add("completed");
        status.textContent = "Completed";
      } else if (unlocked) {
        btn.classList.add("unlocked");
        status.textContent = "Unlocked";
      } else {
        btn.classList.add("locked");
        status.textContent = "Locked";
      }

      btn.appendChild(title);
      btn.appendChild(status);
      btn.addEventListener("click", function () {
        if (!unlocked) return;
        state.progress.lessonIndex = i;
        state.progress.done = { match: false, listen: false, build: false };
        saveProgress();
        renderAll();
        setMascot("thinking");
        setSpeech("Let's begin " + world.lessons[i].title + ".", "instruction", { category: "guidance", holdMs: 2400 });
      });
      ui.worldLessonPath.appendChild(btn);
    }
  }

  function renderFocus() {
    const lesson = currentLesson();
    ui.focusCards.innerHTML = "";
    lesson.focus.forEach(function (item) {
      const card = document.createElement("div");
      card.className = "choice-btn";
      card.innerHTML =
        "<strong>" + item.dev + "</strong><br><span>" + item.translit + " · " + item.meaning + "</span>";
      card.addEventListener("click", function () {
        playSanskritAudio(item.dev);
      });
      ui.focusCards.appendChild(card);
    });
  }

  function renderMatch() {
    const lesson = currentLesson();
    renderPromptWithImage(ui.matchPrompt, "Choose the Sanskrit word that matches the picture clue.", lesson.match.answer);
    ui.matchChoices.innerHTML = "";
    ui.matchStatus.textContent = state.progress.done.match ? "Completed for this lesson." : "";
    lesson.match.options.forEach(function (opt) {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "choice-btn";
      btn.textContent = opt;
      if (state.progress.done.match) {
        btn.disabled = true;
        if (opt === lesson.match.answer) btn.classList.add("correct");
      }
      btn.addEventListener("click", function () {
        if (state.progress.done.match) return;
        if (opt === lesson.match.answer) {
          btn.classList.add("correct");
          rewardIfFirstTime("match");
          saveProgress();
          renderHeader();
          const focus = lesson.focus.find(function (item) { return item.dev === lesson.match.answer; });
          ui.matchStatus.textContent = "✅ Correct! " + lesson.match.answer + (focus ? (" = " + focus.meaning) : "");
          setMascot("dance");
          setSpeech("Fantastic! You've completed this activity!", "complete", { category: "completion", holdMs: 3800 });
          confetti();
          if (typeof window.spFlowerRain === "function") window.spFlowerRain(ui.matchStatus.closest("section"), { density: 20, durationMs: 2300 });
          pulseWorldIllustration();
          celebrateNumberGalaxy(lesson.match.answer);
          renderMatch();
        } else {
          btn.classList.add("wrong");
          ui.matchStatus.textContent = "Oops! Let's try that again.";
          setMascot("encouraging");
          setSpeech("Good try! Let's give it another go!", "encourage", { category: "feedback", holdMs: 2800 });
        }
      });
      ui.matchChoices.appendChild(btn);
    });
  }

  function renderListen() {
    const lesson = currentLesson();
    renderPromptWithImage(ui.listenPrompt, "Listen and choose the matching Sanskrit word.", lesson.listen.answer);
    ui.listenChoices.innerHTML = "";
    ui.listenStatus.textContent = state.progress.done.listen ? "Completed for this lesson." : "";
    ui.playListenBtn.disabled = state.progress.done.listen;
    lesson.listen.options.forEach(function (opt) {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "choice-btn";
      btn.textContent = opt;
      if (state.progress.done.listen) {
        btn.disabled = true;
        if (opt === lesson.listen.answer) btn.classList.add("correct");
      }
      btn.addEventListener("click", function () {
        if (state.progress.done.listen) return;
        if (opt === lesson.listen.answer) {
          btn.classList.add("correct");
          rewardIfFirstTime("listen");
          saveProgress();
          renderHeader();
          const focus = lesson.focus.find(function (item) { return item.dev === lesson.listen.answer; });
          ui.listenStatus.textContent = "✅ Correct! " + lesson.listen.answer + (focus ? (" = " + focus.meaning) : "");
          setMascot("dance");
          setSpeech("Fantastic! You've completed this activity!", "complete", { category: "completion", holdMs: 3800 });
          confetti();
          if (typeof window.spFlowerRain === "function") window.spFlowerRain(ui.listenStatus.closest("section"), { density: 20, durationMs: 2300 });
          pulseWorldIllustration();
          celebrateNumberGalaxy(lesson.listen.answer);
          renderListen();
        } else {
          btn.classList.add("wrong");
          ui.listenStatus.textContent = "Not quite! Listen once more and try again.";
          setMascot("encouraging");
          setSpeech("Good try! Let's give it another go!", "encourage", { category: "feedback", holdMs: 2800 });
        }
      });
      ui.listenChoices.appendChild(btn);
    });
  }

  function renderBuild() {
    const lesson = currentLesson();
    const b = lesson.build;
    state.buildSelected = [];
    renderPromptWithImage(ui.buildPrompt, "Build the target Sanskrit phrase using the tiles.", lesson.build.answer);
    ui.buildAnswer.textContent = "";
    ui.buildStatus.textContent = state.progress.done.build ? "Completed for this lesson." : "";
    ui.checkBuildBtn.disabled = state.progress.done.build;
    ui.resetBuildBtn.disabled = state.progress.done.build;
    ui.buildTiles.innerHTML = "";

    b.tiles
      .slice()
      .sort(function () {
        return Math.random() - 0.5;
      })
      .forEach(function (tile) {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "tile-btn";
        btn.textContent = tile;
        if (state.progress.done.build) btn.disabled = true;
        btn.addEventListener("click", function () {
          if (state.progress.done.build) return;
          if (btn.disabled) return;
          btn.disabled = true;
          state.buildSelected.push(tile);
          ui.buildAnswer.textContent = state.buildSelected.join(" ");
        });
        ui.buildTiles.appendChild(btn);
      });
  }

  function checkBuildAnswer() {
    const lesson = currentLesson();
    const guess = state.buildSelected.join("").replace(/\s+/g, "");
    const answer = lesson.build.answer.replace(/\s+/g, "");
    if (guess === answer) {
      rewardIfFirstTime("build");
      saveProgress();
      renderHeader();
      ui.buildStatus.textContent = "✅ Correct! " + lesson.build.answer + " = " + lesson.build.meaning;
      setMascot("dance");
      setSpeech("Fantastic! You've completed this activity!", "complete", { category: "completion", holdMs: 3800 });
      confetti();
      if (typeof window.spFlowerRain === "function") window.spFlowerRain(ui.buildStatus.closest("section"), { density: 20, durationMs: 2300 });
      pulseWorldIllustration();
      celebrateNumberGalaxy(lesson.build.answer);
      renderBuild();
    } else {
      ui.buildStatus.textContent = "Almost there! Try the tile order again.";
      setMascot("encouraging");
      setSpeech("Good try! Let's give it another go!", "encourage", { category: "feedback", holdMs: 2800 });
      animate(ui.buildTiles, { transform: ["translateX(0px)", "translateX(-5px)", "translateX(5px)", "translateX(0px)"] }, { duration: 0.35, easing: "ease-in-out" });
    }
  }

  function setupMascotFollowOnScroll() {
    if (!ui.lessonMascot) return;
    const pageWrap = document.querySelector(".page-wrap");
    const homeContainer = ui.lessonMascot.parentElement;
    const homeNextSibling = ui.lessonMascot.nextElementSibling;
    let mascotRail = null;
    const sections = Array.from(document.querySelectorAll("#main-content > section.panel"));
    let activeSectionId = "";
    if (!sections.length) return;

    function getMascotRail() {
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

    function placeMascotDesktop() {
      if (!pageWrap || !ui.lessonMascot) return;
      const rail = getMascotRail();
      if (rail && ui.lessonMascot.parentElement !== rail) {
        rail.appendChild(ui.lessonMascot);
      }
      pageWrap.classList.add("with-mascot");
      ui.lessonMascot.classList.remove("lesson-mascot-mobile");
      ui.lessonMascot.classList.add("is-journey-guide");
      ui.lessonMascot.style.top = "";
      ui.lessonMascot.style.right = "";
    }

    function placeMascotCompact() {
      if (!ui.lessonMascot || !homeContainer) return;
      if (ui.lessonMascot.parentElement !== homeContainer) {
        if (homeNextSibling && homeNextSibling.parentElement === homeContainer) {
          homeContainer.insertBefore(ui.lessonMascot, homeNextSibling);
        } else {
          homeContainer.appendChild(ui.lessonMascot);
        }
      }
      if (pageWrap) pageWrap.classList.remove("with-mascot");
      ui.lessonMascot.classList.add("lesson-mascot-mobile");
      ui.lessonMascot.classList.remove("is-journey-guide");
      ui.lessonMascot.style.top = "";
      ui.lessonMascot.style.right = "";
      ui.lessonMascot.style.transform = "";
    }

    function findActiveSection() {
      const anchorY = window.innerHeight * 0.34;
      let bestSection = null;
      let bestScore = -Infinity;
      sections.forEach(function (section) {
        const rect = section.getBoundingClientRect();
        if (rect.bottom < 0 || rect.top > window.innerHeight) return;
        let score;
        if (rect.top <= anchorY && rect.bottom >= anchorY) score = 10000 - Math.abs(anchorY - rect.top);
        else score = -Math.abs((rect.top + rect.height * 0.5) - anchorY);
        if (score > bestScore) {
          bestScore = score;
          bestSection = section;
        }
      });
      return bestSection;
    }

    function sectionMessage(section) {
      if (!section) return worldWelcome;
      const heading = section.querySelector("h2");
      const title = heading ? (heading.textContent || "").trim() : "";
      if (!title) return "Let's keep exploring this lesson together!";
      if (title.indexOf("Lesson Path") === 0) return "Choose your lesson path and let's continue!";
      if (title.indexOf("Focus Cards") === 0) return "Let's review these key words before the games.";
      if (title.indexOf("Activity 1") === 0) return "Match carefully. You can do it!";
      if (title.indexOf("Activity 2") === 0) return "Listen closely, then choose the right answer.";
      if (title.indexOf("Activity 3") === 0) return "Build the phrase step by step. I'll cheer you on!";
      if (title.indexOf("Adventure Notes") === 0) return "Wonderful progress! Here are your learning notes.";
      return "Now we are in " + title + ".";
    }

    function moveMascotToSection(section, compact) {
      if (compact || !section || !pageWrap || !ui.lessonMascot) {
        ui.lessonMascot.style.transform = "";
        return;
      }
      const rail = getMascotRail();
      if (!rail) return;
      let sectionTop = 0;
      let node = section;
      while (node && node !== pageWrap) {
        sectionTop += node.offsetTop || 0;
        node = node.offsetParent;
      }
      const sectionHeight = Math.max(section.offsetHeight || 0, section.getBoundingClientRect().height || 0);
      const mascotHeight = Math.ceil(ui.lessonMascot.getBoundingClientRect().height || 220);
      const railHeight = Math.max(rail.offsetHeight || 0, pageWrap.scrollHeight || 0);
      const targetTop = sectionTop + sectionHeight * 0.18;
      const maxTop = Math.max(0, railHeight - mascotHeight - 8);
      const clampedTop = Math.max(0, Math.min(maxTop, targetTop));
      const nextY = Math.round(clampedTop);
      const currentY = Number(ui.lessonMascot.dataset.railY || "0");
      if (Math.abs(nextY - currentY) > 1) {
        ui.lessonMascot.dataset.railY = String(nextY);
        ui.lessonMascot.style.transform = "translate3d(0," + nextY + "px,0)";
      }
    }

    function update() {
      const compact = window.matchMedia("(max-width: 980px)").matches;
      if (compact) placeMascotCompact();
      else placeMascotDesktop();
      const section = findActiveSection();
      const nextId = section ? (section.id || "") : "";
      ui.lessonMascot.setAttribute("data-active-section", nextId || "active");
      moveMascotToSection(section, compact);
      if (nextId && nextId !== activeSectionId) {
        activeSectionId = nextId;
        setSpeech(sectionMessage(section), "instruction", { category: "guidance", holdMs: 2200 });
        if (!prefersReducedMotion) {
          setMascot("flying");
          window.setTimeout(function () { setMascot("idle"); }, 260);
        }
      }
    }

    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    update();
  }

  function renderReview() {
    ui.worldReviewList.innerHTML = "";
    const notes = [
      "Tip: Tap words again to hear and remember them.",
      "Try each activity slowly first, then challenge yourself!",
      "Collect stars by finishing all three lesson activities."
    ];
    notes.forEach(function (note) {
      const li = document.createElement("li");
      li.textContent = note;
      ui.worldReviewList.appendChild(li);
    });
  }

  function renderAll() {
    localStorage.setItem(LAST_WORLD_KEY, worldKey);
    renderHeader();
    renderLessonPath();
    renderFocus();
    renderMatch();
    renderListen();
    renderBuild();
    renderReview();
  }

  function wire() {
    ui.playListenBtn.addEventListener("click", function () {
      const lesson = currentLesson();
      setMascot("listening");
      setSpeech("Ready? Let's try this together!", "instruction", { category: "guidance", holdMs: 2200 });
      playSanskritAudio(lesson.listen.dev, ui.listenStatus);
    });
    ui.checkBuildBtn.addEventListener("click", checkBuildAnswer);
    ui.resetBuildBtn.addEventListener("click", renderBuild);
    ui.worldNextLessonBtn.addEventListener("click", function () {
      if (doneCount() < TOTAL) return;
      if (!state.progress.completedLessons.includes(state.progress.lessonIndex)) {
        state.progress.completedLessons.push(state.progress.lessonIndex);
      }
      if (state.progress.lessonIndex < world.lessons.length - 1) {
        state.progress.lessonIndex += 1;
        state.progress.done = { match: false, listen: false, build: false };
        saveProgress();
        renderAll();
        setMascot("thinking");
        setSpeech("Fantastic! A new lesson is ready!", "complete", { category: "completion", holdMs: 3200 });
      }
    });
    if (ui.worldPrevLessonBtn) {
      ui.worldPrevLessonBtn.addEventListener("click", function () {
        if (state.progress.lessonIndex <= 0) return;
        state.progress.lessonIndex -= 1;
        state.progress.done = { match: false, listen: false, build: false };
        saveProgress();
        renderAll();
        setMascot("flying");
        setSpeech("Let's revisit this lesson together!", "instruction", { category: "guidance", holdMs: 2200 });
      });
    }
    if (ui.restartMatchActivityBtn) {
      ui.restartMatchActivityBtn.addEventListener("click", function () { restartActivity("match"); });
    }
    if (ui.restartListenActivityBtn) {
      ui.restartListenActivityBtn.addEventListener("click", function () { restartActivity("listen"); });
    }
    if (ui.restartBuildActivityBtn) {
      ui.restartBuildActivityBtn.addEventListener("click", function () { restartActivity("build"); });
    }
    if (ui.worldUnlockInviteBtn) {
      ui.worldUnlockInviteBtn.addEventListener("click", function () {
        const nextWorld = inviteRuntime.targetWorld;
        if (!nextWorld || (typeof window.spIsWorldUnlocked === "function" && !window.spIsWorldUnlocked(nextWorld, WORLD_ORDER))) {
          hideUnlockInvite();
          return;
        }
        localStorage.setItem(LAST_WORLD_KEY, nextWorld);
        window.location.href = getWorldUrl(nextWorld);
      });
    }
    if (ui.worldBackBtn) {
      ui.worldBackBtn.addEventListener("click", function () {
        window.location.href = LANGUAGE_HOME_URL + "#worlds";
      });
    }
  }

  renderAll();
  initWorldIllustration();
  wire();
  setMascot("idle");
  setSpeech(worldWelcome, "instruction", { category: "welcome", holdMs: 2600, force: true });
  setupMascotFollowOnScroll();
  window.addEventListener("pagehide", function () {
    if (typeof window.spStopAudioClip === "function") window.spStopAudioClip();
    if (worldSparkleAnim && typeof worldSparkleAnim.destroy === "function") {
      worldSparkleAnim.destroy();
      worldSparkleAnim = null;
    }
  });
})();
