(function initAlphabetForestV4() {
  const AUDIO_ENABLED = true;
  const LETTER_COUNT = 48;
  const TREE_GROUP_SIZE = 5;
  const REDUCED_MOTION = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const CORE = window.SPAlphabetForestCore;
  const VOCAB = window.SP_VOCABULARY_MAP || { words: {}, fallback: { image: "", alt: "" } };
  const MOTION = window.Motion || {};
  const animate = MOTION.animate || function () {};
  if (!CORE) return;
  if (!window.SP_PDF_LETTER_INVENTORY || !Array.isArray(window.SP_PDF_LETTER_INVENTORY.items)) return;

  const ACTIVITIES = [
    { id: "magical-tree", title: "Magical Tree", sectionId: "forestScene", controlsId: "controls-magical-tree", type: "tree" },
    { id: "letter-garden", title: "Letter Garden", sectionId: "letterGardenSection", controlsId: "controls-letter-garden", type: "letter" },
    { id: "hear-and-pick", title: "Hear and Pick", sectionId: "activityHearGamePanel", controlsId: "controls-hear-and-pick", type: "quiz" },
    { id: "picture-match", title: "Picture Match", sectionId: "activityPictureGamePanel", controlsId: "controls-picture-match", type: "quiz" },
    { id: "arrange-word", title: "Arrange the Word", sectionId: "activityArrangeGamePanel", controlsId: "controls-arrange-word", type: "quiz" },
    { id: "flashcard-flip", title: "Flashcard Flip", sectionId: "activityFlashGamePanel", controlsId: "controls-flashcard-flip", type: "quiz" },
    { id: "feed-mithu", title: "Feed Mithu", sectionId: "activityFeedGamePanel", controlsId: "controls-feed-mithu", type: "quiz" },
    { id: "letter-tracing", title: "Letter Tracing", sectionId: "activityTraceGamePanel", controlsId: "controls-letter-tracing", type: "tracing" },
    { id: "hidden-letter-hunt", title: "Hidden Letter Hunt", sectionId: "activityHuntGamePanel", controlsId: "controls-hidden-letter-hunt", type: "quiz" }
  ];
  const ACTIVITY_IDS = ACTIVITIES.map(function mapId(activity) { return activity.id; });
  const ACTIVITY_META = Object.fromEntries(ACTIVITIES.map(function mapMeta(activity) { return [activity.id, activity]; }));

  const letters = window.SP_PDF_LETTER_INVENTORY.items
    .slice(0, LETTER_COUNT)
    .map(function mapLetter(item, index) {
      const example = item.example || {};
      return {
        id: item.id || ("l-" + index),
        index: index,
        symbol: item.symbol || "",
        transliteration: item.transliteration || "",
        category: item.category || "consonant",
        subgroup: item.subgroup || "other",
        exampleText: example.sanskrit || item.symbol || "",
        meaning: example.meaning || "Meaning pending review",
        audioPath: item.pronunciation && item.pronunciation.localPath ? item.pronunciation.localPath : ""
      };
    })
    .filter(function hasSymbol(letter) { return Boolean(letter.symbol); });

  const ui = {
    jumpNav: document.getElementById("activityJumpNav"),
    muteToggle: document.getElementById("muteToggle"),
    testSoundBtn: document.getElementById("testSoundBtn"),
    audioDisclaimer: document.getElementById("audioDisclaimer"),
    audioDebug: document.getElementById("audioDebug"),
    lessonMascot: document.getElementById("lessonMascot"),
    lessonMascotSpeech: document.getElementById("lessonMascotSpeech"),
    globalSummary: document.getElementById("globalProgressSummary"),
    globalFill: document.getElementById("globalProgressFill"),
    doneCount: document.getElementById("doneCount"),
    starCount: document.getElementById("starCount"),
    streakCount: document.getElementById("streakCount"),
    progressText: document.getElementById("progressText"),
    treeLetters: document.getElementById("magicalTreeLetters"),
    treeStatus: document.getElementById("treeStatus"),
    treeCounter: document.getElementById("treeCounter"),
    treeInstruction: document.getElementById("treeInstruction"),
    prevTreeGroupBtn: document.getElementById("prevTreeGroupBtn"),
    nextTreeGroupBtn: document.getElementById("nextTreeGroupBtn"),
    playTreeAgainBtn: document.getElementById("playTreeAgainBtn"),
    continueAfterTreeBtn: document.getElementById("continueAfterTreeBtn"),
    treeMithu: document.getElementById("treeMithu"),
    spotlightDev: document.getElementById("spotlightLetterDev"),
    spotlightTran: document.getElementById("spotlightLetterTran"),
    spotlightExample: document.getElementById("spotlightLetterExample"),
    letterCategoryTabs: Array.from(document.querySelectorAll(".category-tab")),
    subgroupTabs: document.getElementById("consonantSubgroupTabs"),
    letterGrid: document.getElementById("letterGrid"),
    gardenCoverage: document.getElementById("gardenCoverage"),
    selectedDev: document.getElementById("selectedDev"),
    selectedTran: document.getElementById("selectedTran"),
    selectedExample: document.getElementById("selectedExample"),
    selectedMeaning: document.getElementById("selectedMeaning"),
    selectedExampleArt: document.getElementById("selectedExampleArt"),
    selectedPosition: document.getElementById("selectedPosition"),
    selectedLearned: document.getElementById("selectedLearned"),
    replayLetterBtn: document.getElementById("replayLetterBtn"),
    slowLetterBtn: document.getElementById("slowLetterBtn"),
    panelMuteBtn: document.getElementById("panelMuteBtn"),
    prevLetterBtn: document.getElementById("prevLetterBtn"),
    nextLetterBtn: document.getElementById("nextLetterBtn"),
    audioFallback: document.getElementById("audioFallback"),
    hearChoices: document.getElementById("hearChoices"),
    hearStatus: document.getElementById("hearStatus"),
    playHearPrompt: document.getElementById("playHearPrompt"),
    picturePrompt: document.getElementById("picturePrompt"),
    pictureChoices: document.getElementById("pictureChoices"),
    pictureStatus: document.getElementById("pictureStatus"),
    arrangePrompt: document.getElementById("arrangePrompt"),
    arrangeTiles: document.getElementById("arrangeTiles"),
    arrangeAnswer: document.getElementById("arrangeAnswer"),
    arrangeStatus: document.getElementById("arrangeStatus"),
    checkArrange: document.getElementById("checkArrange"),
    resetArrange: document.getElementById("resetArrange"),
    flashcard: document.getElementById("flashcard"),
    flashChoices: document.getElementById("flashChoices"),
    flashStatus: document.getElementById("flashStatus"),
    flipFlashcard: document.getElementById("flipFlashcard"),
    feedPrompt: document.getElementById("feedPrompt"),
    feedChoices: document.getElementById("feedChoices"),
    feedStatus: document.getElementById("feedStatus"),
    tracePrompt: document.getElementById("tracePrompt"),
    traceCanvas: document.getElementById("traceCanvas"),
    traceTargetLetter: document.getElementById("traceTargetLetter"),
    traceStatus: document.getElementById("traceStatus"),
    clearTraceBtn: document.getElementById("clearTraceBtn"),
    checkTraceBtn: document.getElementById("checkTraceBtn"),
    huntPrompt: document.getElementById("huntPrompt"),
    huntGrid: document.getElementById("huntGrid"),
    huntStatus: document.getElementById("huntStatus"),
    completionCanvas: document.getElementById("celebration-canvas"),
    doneBanner: document.getElementById("doneBanner"),
    completionScreen: document.getElementById("completionScreen"),
    completionStars: document.getElementById("completionStars")
  };

  const stateApi = CORE.createStateApi(window.localStorage, letters.length);
  const forestState = stateApi.loadState();
  stateApi.saveState(forestState);

  const runtime = {
    muted: false,
    currentAudio: null,
    confetti: null,
    mascotActiveSection: null,
    tracing: {
      drawing: false,
      points: [],
      guidePoints: []
    },
    byActivity: {}
  };
  ACTIVITY_IDS.forEach(function setupActivityRuntime(activityId) {
    runtime.byActivity[activityId] = {
      status: "",
      selected: "",
      tempAnswer: "",
      flipped: false
    };
  });

  initMuteState();
  initAudioControls();
  initJumpNavigation();
  initMascotCompanion();
  initTreeControls();
  initLetterGardenControls();
  initArrangeControls();
  initFlashControls();
  initTracingCanvas();
  initConfetti();
  initActivityControls();
  renderAll();

  function initMuteState() {
    const fromStorage = localStorage.getItem("sanskritParichay.muted");
    runtime.muted = fromStorage === "true";
    renderMuteButtons();
  }

  function renderMuteButtons() {
    if (ui.muteToggle) {
      ui.muteToggle.textContent = runtime.muted ? "🔇 Sound: Off" : "🔊 Sound: On";
      ui.muteToggle.setAttribute("aria-pressed", runtime.muted ? "true" : "false");
      ui.muteToggle.disabled = !AUDIO_ENABLED;
    }
    if (ui.panelMuteBtn) {
      ui.panelMuteBtn.textContent = runtime.muted ? "🔊 Unmute" : "🔇 Mute";
      ui.panelMuteBtn.setAttribute("aria-pressed", runtime.muted ? "true" : "false");
    }
  }

  function setMuted(value) {
    runtime.muted = value;
    localStorage.setItem("sanskritParichay.muted", String(value));
    renderMuteButtons();
  }

  function initAudioControls() {
    if (ui.audioDisclaimer) {
      ui.audioDisclaimer.textContent = AUDIO_ENABLED
        ? "Tap Sanskrit letters or words to hear reviewed local pronunciation clips."
        : "Audio is temporarily disabled on this page.";
    }
    if (ui.audioDebug) {
      ui.audioDebug.textContent = AUDIO_ENABLED ? "Audio source: local pronunciation clips only." : "AUDIO_ENABLED = false";
    }
    if (ui.muteToggle) ui.muteToggle.addEventListener("click", function () { setMuted(!runtime.muted); });
    if (ui.panelMuteBtn) ui.panelMuteBtn.addEventListener("click", function () { setMuted(!runtime.muted); });
    if (ui.testSoundBtn) {
      ui.testSoundBtn.addEventListener("click", function () {
        playLetterAudio(getCurrentLetter("letter-garden"), 1, ui.audioFallback);
      });
      ui.testSoundBtn.disabled = !AUDIO_ENABLED;
    }
    if (ui.replayLetterBtn) ui.replayLetterBtn.addEventListener("click", function () {
      playLetterAudio(getCurrentLetter("letter-garden"), 1, ui.audioFallback);
    });
    if (ui.slowLetterBtn) ui.slowLetterBtn.addEventListener("click", function () {
      playLetterAudio(getCurrentLetter("letter-garden"), 0.72, ui.audioFallback);
    });
    if (ui.selectedDev) ui.selectedDev.addEventListener("click", function () {
      playLetterAudio(getCurrentLetter("letter-garden"), 1, ui.audioFallback);
    });
    if (ui.selectedExample) ui.selectedExample.addEventListener("click", function () {
      playLetterAudio(getCurrentLetter("letter-garden"), 1, ui.audioFallback);
    });
    if (!AUDIO_ENABLED) {
      document.querySelectorAll(".audio-control").forEach(function disable(node) {
        node.hidden = true;
        if (node.tagName === "BUTTON") node.disabled = true;
      });
    }
  }

  function safeStopAudio() {
    if (!runtime.currentAudio) return;
    runtime.currentAudio.pause();
    runtime.currentAudio = null;
  }

  function playLetterAudio(letter, playbackRate, feedbackEl) {
    if (!AUDIO_ENABLED || runtime.muted || !letter) return;
    if (!letter.audioPath) {
      if (feedbackEl) feedbackEl.textContent = "Pronunciation clip is not available for this item yet.";
      return;
    }
    safeStopAudio();
    const audio = new Audio(letter.audioPath + "?v=20261110n");
    audio.preload = "none";
    audio.playbackRate = playbackRate || 1;
    runtime.currentAudio = audio;
    setMascotState("listening");
    audio.addEventListener("ended", function () {
      setMascotState("idle");
    }, { once: true });
    audio.addEventListener("error", function () {
      if (feedbackEl) feedbackEl.textContent = "Could not play pronunciation clip.";
    }, { once: true });
    audio.play().catch(function () {
      if (feedbackEl) feedbackEl.textContent = "Could not play pronunciation clip.";
    });
  }

  function initJumpNavigation() {
    if (!ui.jumpNav) return;
    const links = Array.from(ui.jumpNav.querySelectorAll("a.jump-link"));
    links.forEach(function bind(link) {
      link.addEventListener("click", function (event) {
        const href = link.getAttribute("href") || "";
        if (!href.startsWith("#")) return;
        const target = document.getElementById(href.slice(1));
        if (!target) return;
        event.preventDefault();
        target.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    });
    if (typeof IntersectionObserver !== "function") return;
    const sections = ACTIVITIES.map(function (entry) { return document.getElementById(entry.sectionId); }).filter(Boolean);
    const observer = new IntersectionObserver(function (entries) {
      const active = entries
        .filter(function (entry) { return entry.isIntersecting; })
        .sort(function (a, b) { return b.intersectionRatio - a.intersectionRatio; })[0];
      if (!active) return;
      const activeId = active.target.id;
      links.forEach(function (link) {
        link.classList.toggle("active", link.getAttribute("href") === "#" + activeId);
      });
    }, { threshold: [0.3, 0.55, 0.75] });
    sections.forEach(function (section) { observer.observe(section); });
  }

  function setMascotState(stateName) {
    if (!ui.lessonMascot) return;
    ui.lessonMascot.classList.remove(
      "state-wave", "state-idle", "state-flying", "state-listening", "state-pointing",
      "state-thinking", "state-eating", "state-encouraging", "state-celebrating", "state-dancing"
    );
    ui.lessonMascot.classList.add("state-" + stateName);
  }

  function setMascotSpeech(text) {
    if (ui.lessonMascotSpeech) ui.lessonMascotSpeech.textContent = text;
  }

  function initMascotCompanion() {
    if (!ui.lessonMascot) return;
    setMascotState("welcome");
    setMascotSpeech("Namaste! I am Mithu. Let's discover Sanskrit together.");
    const sections = ACTIVITIES.map(function (a) { return document.getElementById(a.sectionId); }).filter(Boolean);
    if (typeof IntersectionObserver !== "function") return;
    const observer = new IntersectionObserver(function (entries) {
      const active = entries.filter(function (entry) { return entry.isIntersecting; })
        .sort(function (a, b) { return b.intersectionRatio - a.intersectionRatio; })[0];
      if (!active) return;
      const activity = ACTIVITIES.find(function (item) { return item.sectionId === active.target.id; });
      if (!activity || runtime.mascotActiveSection === activity.id) return;
      runtime.mascotActiveSection = activity.id;
      moveMascotNearSection(active.target);
      setMascotState("flying");
      setTimeout(function () { setMascotState("idle"); }, 420);
    }, { threshold: [0.22, 0.45, 0.7] });
    sections.forEach(function (section) { observer.observe(section); });
    window.addEventListener("resize", function () {
      if (!runtime.mascotActiveSection) return;
      const sectionId = ACTIVITY_META[runtime.mascotActiveSection].sectionId;
      const section = document.getElementById(sectionId);
      if (section) moveMascotNearSection(section);
    });
  }

  function moveMascotNearSection(section) {
    if (!ui.lessonMascot || !section) return;
    const mobile = window.matchMedia("(max-width: 860px)").matches;
    ui.lessonMascot.classList.toggle("lesson-mascot-mobile", mobile);
    if (mobile) {
      ui.lessonMascot.style.top = "";
      return;
    }
    const rect = section.getBoundingClientRect();
    const targetTop = Math.max(96, Math.min(window.innerHeight - 260, rect.top + rect.height * 0.2));
    if (REDUCED_MOTION) {
      ui.lessonMascot.style.top = targetTop.toFixed(0) + "px";
      return;
    }
    animate(ui.lessonMascot, { top: [ui.lessonMascot.style.top || "120px", targetTop.toFixed(0) + "px"] }, { duration: 0.48, easing: "ease-out" });
    ui.lessonMascot.style.top = targetTop.toFixed(0) + "px";
  }

  function initTreeControls() {
    if (ui.prevTreeGroupBtn) {
      ui.prevTreeGroupBtn.addEventListener("click", function () {
        const activity = forestState.activities["magical-tree"];
        const currentGroup = Math.floor(activity.currentIndex / TREE_GROUP_SIZE);
        if (currentGroup <= 0) return;
        activity.currentIndex = (currentGroup - 1) * TREE_GROUP_SIZE;
        setActivityStatus("magical-tree", "Moved to previous group.");
        saveAndRender();
      });
    }
    if (ui.nextTreeGroupBtn) {
      ui.nextTreeGroupBtn.addEventListener("click", function () {
        const activity = forestState.activities["magical-tree"];
        const currentGroup = Math.floor(activity.currentIndex / TREE_GROUP_SIZE);
        const nextStart = (currentGroup + 1) * TREE_GROUP_SIZE;
        if (nextStart >= letters.length) return;
        activity.currentIndex = nextStart;
        setActivityStatus("magical-tree", "Moved to next group.");
        saveAndRender();
      });
    }
    if (ui.playTreeAgainBtn) {
      ui.playTreeAgainBtn.addEventListener("click", function () {
        if (!forestState.activities["magical-tree"].isComplete) return;
        const ok = window.confirm("Play Magical Tree again from the first group?");
        if (!ok) return;
        CORE.resetActivity(forestState, "magical-tree");
        setActivityStatus("magical-tree", "Magical Tree restarted.");
        saveAndRender();
      });
    }
    if (ui.continueAfterTreeBtn) {
      ui.continueAfterTreeBtn.addEventListener("click", function () {
        const target = document.getElementById("letterGardenSection");
        if (target) target.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    }
  }

  function initLetterGardenControls() {
    ui.letterCategoryTabs.forEach(function (tab) {
      tab.addEventListener("click", function () {
        const category = tab.getAttribute("data-category") || "vowels";
        const state = forestState.activities["letter-garden"];
        state.answers.category = category;
        if (category !== "consonants") state.answers.subgroup = "all";
        saveAndRender();
      });
    });
    if (ui.prevLetterBtn) ui.prevLetterBtn.addEventListener("click", function () { dispatchActivityAction("letter-garden", "previous"); });
    if (ui.nextLetterBtn) ui.nextLetterBtn.addEventListener("click", function () { dispatchActivityAction("letter-garden", "next"); });
  }

  function initArrangeControls() {
    if (ui.checkArrange) {
      ui.checkArrange.addEventListener("click", function () {
        const activityId = "arrange-word";
        const letter = getCurrentLetter(activityId);
        const answer = runtime.byActivity[activityId].tempAnswer || "";
        if (answer === letter.exampleText) {
          markCurrentComplete(activityId, "Correct arrangement.");
          if (ui.arrangeStatus) ui.arrangeStatus.textContent = "Correct!";
        } else {
          incrementAttempt(activityId);
          if (ui.arrangeStatus) ui.arrangeStatus.textContent = "Try again.";
          setMascotState("thinking");
        }
      });
    }
    if (ui.resetArrange) ui.resetArrange.addEventListener("click", function () { dispatchActivityAction("arrange-word", "retry"); });
  }

  function initFlashControls() {
    if (!ui.flipFlashcard) return;
    ui.flipFlashcard.addEventListener("click", function () {
      runtime.byActivity["flashcard-flip"].flipped = !runtime.byActivity["flashcard-flip"].flipped;
      renderFlashcardFlip();
    });
  }

  function initTracingCanvas() {
    if (!ui.traceCanvas) return;
    const ctx = ui.traceCanvas.getContext("2d");
    if (!ctx) return;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.lineWidth = 8;
    ctx.strokeStyle = "#4b63cf";

    function getPoint(event) {
      const rect = ui.traceCanvas.getBoundingClientRect();
      const source = event.touches ? event.touches[0] : event;
      return {
        x: (source.clientX - rect.left) * (ui.traceCanvas.width / rect.width),
        y: (source.clientY - rect.top) * (ui.traceCanvas.height / rect.height)
      };
    }

    function startDraw(event) {
      runtime.tracing.drawing = true;
      const point = getPoint(event);
      runtime.tracing.points.push(point);
      ctx.beginPath();
      ctx.moveTo(point.x, point.y);
      event.preventDefault();
    }
    function moveDraw(event) {
      if (!runtime.tracing.drawing) return;
      const point = getPoint(event);
      runtime.tracing.points.push(point);
      ctx.lineTo(point.x, point.y);
      ctx.stroke();
      event.preventDefault();
    }
    function endDraw() {
      runtime.tracing.drawing = false;
    }

    ui.traceCanvas.addEventListener("pointerdown", startDraw);
    ui.traceCanvas.addEventListener("pointermove", moveDraw);
    ui.traceCanvas.addEventListener("pointerup", endDraw);
    ui.traceCanvas.addEventListener("pointerleave", endDraw);
    ui.traceCanvas.addEventListener("touchstart", startDraw, { passive: false });
    ui.traceCanvas.addEventListener("touchmove", moveDraw, { passive: false });
    ui.traceCanvas.addEventListener("touchend", endDraw);

    if (ui.clearTraceBtn) ui.clearTraceBtn.addEventListener("click", function () { clearTraceBoard(); });
    if (ui.checkTraceBtn) {
      ui.checkTraceBtn.addEventListener("click", function () {
        const activityId = "letter-tracing";
        const coverage = tracingCoverageScore();
        if (coverage >= 0.75 && runtime.tracing.points.length >= 35) {
          markCurrentComplete(activityId, "Great tracing!");
          if (ui.traceStatus) ui.traceStatus.textContent = "Great tracing!";
          setMascotState("celebrating");
        } else {
          incrementAttempt(activityId);
          if (ui.traceStatus) ui.traceStatus.textContent = "Follow the dotted guide path and try again.";
          setMascotState("encouraging");
        }
      });
    }
  }

  function clearTraceBoard() {
    if (!ui.traceCanvas) return;
    const ctx = ui.traceCanvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, ui.traceCanvas.width, ui.traceCanvas.height);
    runtime.tracing.points = [];
    drawTraceGuide();
  }

  function drawTraceGuide() {
    if (!ui.traceCanvas) return;
    const ctx = ui.traceCanvas.getContext("2d");
    if (!ctx) return;
    const letter = getCurrentLetter("letter-tracing");
    runtime.tracing.guidePoints = buildGuidePoints(letter);
    ctx.save();
    ctx.strokeStyle = "#c7d4ff";
    ctx.lineWidth = 5;
    ctx.setLineDash([8, 8]);
    ctx.beginPath();
    runtime.tracing.guidePoints.forEach(function (point, index) {
      if (index === 0) ctx.moveTo(point.x, point.y);
      else ctx.lineTo(point.x, point.y);
    });
    ctx.stroke();
    ctx.restore();
  }

  function buildGuidePoints(letter) {
    const seed = (letter && letter.symbol ? letter.symbol.charCodeAt(0) : 0) % 4;
    if (seed === 0) return [{ x: 80, y: 40 }, { x: 200, y: 40 }, { x: 120, y: 120 }, { x: 180, y: 180 }];
    if (seed === 1) return [{ x: 90, y: 34 }, { x: 90, y: 180 }, { x: 170, y: 180 }, { x: 170, y: 100 }];
    if (seed === 2) return [{ x: 70, y: 50 }, { x: 190, y: 50 }, { x: 190, y: 110 }, { x: 70, y: 110 }, { x: 70, y: 170 }];
    return [{ x: 100, y: 30 }, { x: 140, y: 90 }, { x: 100, y: 150 }, { x: 170, y: 150 }];
  }

  function tracingCoverageScore() {
    if (!runtime.tracing.guidePoints.length || !runtime.tracing.points.length) return 0;
    const radius = 24;
    let hitCount = 0;
    runtime.tracing.guidePoints.forEach(function (guidePoint) {
      const hit = runtime.tracing.points.some(function (drawnPoint) {
        const dx = drawnPoint.x - guidePoint.x;
        const dy = drawnPoint.y - guidePoint.y;
        return Math.sqrt(dx * dx + dy * dy) <= radius;
      });
      if (hit) hitCount += 1;
    });
    return hitCount / runtime.tracing.guidePoints.length;
  }

  function initConfetti() {
    if (!ui.completionCanvas || typeof window.confetti !== "function") return;
    runtime.confetti = window.confetti.create(ui.completionCanvas, { resize: true, useWorker: true });
  }

  function fireConfetti(big) {
    if (!runtime.confetti || REDUCED_MOTION) return;
    runtime.confetti({
      particleCount: big ? 180 : 90,
      spread: big ? 110 : 70,
      startVelocity: big ? 34 : 24,
      origin: { y: 0.68 }
    });
  }

  function initActivityControls() {
    ACTIVITIES.forEach(function (activity) {
      const mount = document.getElementById(activity.controlsId);
      if (!mount) return;
      mount.className = "activity-local-controls";
      if (activity.type === "tree") {
        mount.innerHTML =
          '<p class="activity-progress" id="progress-' + activity.id + '"></p>' +
          '<p class="status" id="status-' + activity.id + '" aria-live="polite"></p>' +
          '<p class="activity-complete-note" id="complete-' + activity.id + '" tabindex="-1"></p>';
        return;
      }
      mount.innerHTML =
        '<p class="activity-progress" id="progress-' + activity.id + '"></p>' +
        '<div class="hero-actions">' +
        '<button class="button ghost" type="button" data-action="previous">Previous</button>' +
        '<button class="button ghost" type="button" data-action="retry">Retry</button>' +
        '<button class="button secondary" type="button" data-action="next">Next</button>' +
        '<button class="button secondary" type="button" data-action="finish" hidden>Finish Activity</button>' +
        '<button class="button ghost" type="button" data-action="restart">Restart Activity</button>' +
        "</div>" +
        '<p class="status" id="status-' + activity.id + '" aria-live="polite"></p>' +
        '<p class="activity-complete-note" id="complete-' + activity.id + '" tabindex="-1"></p>';
      mount.querySelector('[data-action="previous"]').addEventListener("click", function () { dispatchActivityAction(activity.id, "previous"); });
      mount.querySelector('[data-action="retry"]').addEventListener("click", function () { dispatchActivityAction(activity.id, "retry"); });
      mount.querySelector('[data-action="next"]').addEventListener("click", function () { dispatchActivityAction(activity.id, "next"); });
      mount.querySelector('[data-action="finish"]').addEventListener("click", function () { dispatchActivityAction(activity.id, "finish"); });
      mount.querySelector('[data-action="restart"]').addEventListener("click", function () { dispatchActivityAction(activity.id, "restart"); });
    });
  }

  function setActivityStatus(activityId, text) {
    runtime.byActivity[activityId].status = text;
  }

  function incrementAttempt(activityId) {
    const activity = forestState.activities[activityId];
    const index = activity.currentIndex;
    activity.attempts[index] = (activity.attempts[index] || 0) + 1;
  }

  function getCurrentLetter(activityId) {
    const activity = forestState.activities[activityId];
    if (!activity) return letters[0];
    const idx = activity.order[activity.currentIndex];
    return letters[idx];
  }

  function isCurrentResolved(activityId) {
    const activity = forestState.activities[activityId];
    return activity.completedItems.includes(activity.currentIndex);
  }

  function markCurrentComplete(activityId, message) {
    CORE.markCurrentItemCompleted(forestState, activityId, 1);
    setActivityStatus(activityId, message);
    if (ACTIVITY_META[activityId].type !== "tree") setMascotState("celebrating");
    saveAndRender();
  }

  function dispatchActivityAction(activityId, action) {
    const activity = forestState.activities[activityId];
    if (!activity) return;
    if (action === "previous") {
      CORE.goPrevious(forestState, activityId);
      if (activityId === "letter-tracing") clearTraceBoard();
      setActivityStatus(activityId, "Moved to previous item.");
      saveAndRender();
      return;
    }
    if (action === "next") {
      if (!isCurrentResolved(activityId) || activity.currentIndex >= letters.length - 1) return;
      CORE.goNext(forestState, activityId);
      runtime.byActivity[activityId].tempAnswer = "";
      runtime.byActivity[activityId].flipped = false;
      if (activityId === "letter-tracing") clearTraceBoard();
      setActivityStatus(activityId, "Moved to next item.");
      saveAndRender();
      return;
    }
    if (action === "retry") {
      CORE.retryCurrent(forestState, activityId);
      runtime.byActivity[activityId].tempAnswer = "";
      runtime.byActivity[activityId].flipped = false;
      if (activityId === "letter-tracing") clearTraceBoard();
      setActivityStatus(activityId, "Retry current item.");
      saveAndRender();
      return;
    }
    if (action === "finish") {
      if (!CORE.finalizeActivity(forestState, activityId)) {
        setActivityStatus(activityId, "Complete all 48 items first.");
        saveAndRender();
        return;
      }
      setActivityStatus(activityId, "Activity completed!");
      fireConfetti(false);
      setMascotState("dancing");
      const global = CORE.computeGlobalProgress(forestState);
      if (global.completedActivityCount === global.totalActivities) {
        fireConfetti(true);
        setMascotSpeech("Amazing! You completed the whole Alphabet Forest.");
      }
      saveAndRender();
      const completeNote = document.getElementById("complete-" + activityId);
      if (completeNote) completeNote.focus();
      return;
    }
    if (action === "restart") {
      if (!activity.isComplete) return;
      const ok = window.confirm("Restart this completed activity from item 1?");
      if (!ok) return;
      CORE.resetActivity(forestState, activityId);
      setActivityStatus(activityId, "Activity restarted.");
      saveAndRender();
    }
  }

  function saveAndRender() {
    stateApi.saveState(forestState);
    renderAll();
  }

  function renderAll() {
    renderGlobalProgress();
    renderMagicalTree();
    renderLetterGarden();
    renderHearAndPick();
    renderPictureMatch();
    renderArrangeWord();
    renderFlashcardFlip();
    renderFeedMithu();
    renderLetterTracing();
    renderHiddenLetterHunt();
    renderActivityControls();
    updateWorldCompletionPanels();
  }

  function renderGlobalProgress() {
    const global = CORE.computeGlobalProgress(forestState);
    if (ui.globalSummary) ui.globalSummary.textContent = global.completedActivityCount + " of " + global.totalActivities + " activities complete";
    if (ui.globalFill) ui.globalFill.style.width = global.globalPercent.toFixed(1) + "%";
    if (ui.doneCount) ui.doneCount.textContent = String(global.completedActivityCount);
    if (ui.starCount) ui.starCount.textContent = String(forestState.xp);
    if (ui.streakCount) ui.streakCount.textContent = String(global.completedActivityCount);
    if (ui.progressText) ui.progressText.textContent = Math.round(global.globalPercent) + "% overall completion.";
  }

  function renderMagicalTree() {
    const activityId = "magical-tree";
    const activity = forestState.activities[activityId];
    if (!ui.treeLetters) return;
    const groupIndex = Math.floor(activity.currentIndex / TREE_GROUP_SIZE);
    const groupStart = groupIndex * TREE_GROUP_SIZE;
    const groupEndExclusive = Math.min(groupStart + TREE_GROUP_SIZE, letters.length);
    const groupLetters = letters.slice(groupStart, groupEndExclusive);
    const maxGroup = Math.floor((letters.length - 1) / TREE_GROUP_SIZE);
    const groupComplete = groupLetters.every(function (_letter, offset) {
      return activity.completedItems.includes(groupStart + offset);
    });

    if (ui.treeInstruction) ui.treeInstruction.textContent = "Tap a glowing letter to discover its sound!";
    if (ui.treeCounter) ui.treeCounter.textContent = "Group " + (groupIndex + 1) + " of " + (maxGroup + 1) + " · " + activity.completedItems.length + " of 48 letters discovered";
    if (ui.treeStatus) ui.treeStatus.textContent = runtime.byActivity[activityId].status || "Discover each glowing letter in this group.";
    if (ui.prevTreeGroupBtn) ui.prevTreeGroupBtn.disabled = groupIndex === 0;
    if (ui.nextTreeGroupBtn) ui.nextTreeGroupBtn.disabled = !groupComplete || groupIndex >= maxGroup;

    if (ui.playTreeAgainBtn) ui.playTreeAgainBtn.hidden = !activity.isComplete;
    if (ui.continueAfterTreeBtn) ui.continueAfterTreeBtn.hidden = !activity.isComplete;

    ui.treeLetters.innerHTML = "";
    const slots = [
      { x: 30, y: 35 }, { x: 43, y: 24 }, { x: 56, y: 30 }, { x: 68, y: 24 }, { x: 74, y: 37 }
    ];
    groupLetters.forEach(function (letter, offset) {
      const letterIndex = groupStart + offset;
      const button = document.createElement("button");
      button.type = "button";
      button.className = "tree-letter-btn";
      button.style.left = slots[offset].x + "%";
      button.style.top = slots[offset].y + "%";
      button.innerHTML = '<span class="tree-dev">' + letter.symbol + "</span>";
      if (activity.completedItems.includes(letterIndex)) button.classList.add("discovered");
      if (activity.currentIndex === letterIndex) button.classList.add("tree-active");
      button.addEventListener("click", function () {
        activity.currentIndex = letterIndex;
        setMascotState("pointing");
        playLetterAudio(letter, 1, ui.treeStatus);
        if (!activity.completedItems.includes(letterIndex)) {
          CORE.markCurrentItemCompleted(forestState, activityId, 1);
          growTreeBloom();
          setActivityStatus(activityId, "Letter discovered!");
          const nowComplete = groupLetters.every(function (_inner, innerOffset) {
            return activity.completedItems.includes(groupStart + innerOffset);
          });
          if (nowComplete) {
            setMascotState("celebrating");
            fireConfetti(false);
            if (groupIndex < maxGroup) {
              setTimeout(function () {
                activity.currentIndex = (groupIndex + 1) * TREE_GROUP_SIZE;
                setActivityStatus(activityId, "Group complete. Moving to next group.");
                saveAndRender();
              }, 500);
              return;
            }
            if (!activity.isComplete && activity.completedItems.length >= letters.length) {
              CORE.finalizeActivity(forestState, activityId);
              setMascotState("dancing");
              fireConfetti(true);
              setActivityStatus(activityId, "Magical Tree complete!");
            }
          }
          saveAndRender();
          return;
        }
        saveAndRender();
      });
      ui.treeLetters.appendChild(button);
    });

    const currentLetter = getCurrentLetter(activityId);
    if (currentLetter) {
      if (ui.spotlightDev) ui.spotlightDev.textContent = currentLetter.symbol;
      if (ui.spotlightTran) ui.spotlightTran.textContent = currentLetter.transliteration;
      if (ui.spotlightExample) ui.spotlightExample.textContent = currentLetter.exampleText + " · " + currentLetter.meaning;
    }
  }

  function growTreeBloom() {
    const bloomContainer = document.getElementById("treeProgressBlooms");
    if (!bloomContainer) return;
    const bloom = document.createElement("span");
    bloom.className = "group-bloom";
    bloom.style.left = (20 + Math.random() * 60).toFixed(1) + "%";
    bloom.style.top = (18 + Math.random() * 58).toFixed(1) + "%";
    bloomContainer.appendChild(bloom);
    setTimeout(function () { bloom.remove(); }, 1600);
  }

  function renderLetterGarden() {
    const activityId = "letter-garden";
    const activity = forestState.activities[activityId];
    const selectedLetter = getCurrentLetter(activityId);
    const selectedCategory = activity.answers.category || "vowels";
    const selectedSubgroup = activity.answers.subgroup || "all";
    ui.letterCategoryTabs.forEach(function (tab) {
      const active = tab.getAttribute("data-category") === selectedCategory;
      tab.classList.toggle("active", active);
      tab.setAttribute("aria-pressed", active ? "true" : "false");
    });
    renderSubgroupButtons(selectedCategory, selectedSubgroup);

    const filtered = letters.filter(function (letter) {
      if (selectedCategory === "practice") return true;
      if (selectedCategory === "vowels") return letter.category !== "consonant";
      if (selectedCategory === "consonants") {
        if (letter.category !== "consonant") return false;
        if (selectedSubgroup === "all") return true;
        return (letter.subgroup || "other") === selectedSubgroup;
      }
      return true;
    });
    if (!filtered.length) {
      if (ui.letterGrid) ui.letterGrid.innerHTML = '<p class="section-warning">This letter group could not be loaded.</p>';
      console.error("Letter Garden category has no mapped letters", selectedCategory);
      return;
    }

    if (ui.letterGrid) {
      ui.letterGrid.innerHTML = "";
      filtered.forEach(function (letter) {
        const btn = document.createElement("button");
        const letterIndex = letters.findIndex(function (item) { return item.id === letter.id; });
        btn.type = "button";
        btn.className = "letter-btn";
        if (letterIndex === activity.currentIndex) btn.classList.add("active");
        if (activity.completedItems.includes(letterIndex)) btn.classList.add("learned");
        btn.innerHTML =
          '<span class="tile-star" aria-hidden="true">' + (activity.completedItems.includes(letterIndex) ? "⭐" : "☆") + "</span>" +
          '<span class="dev">' + letter.symbol + '</span><span class="tran">' + letter.transliteration + "</span>";
        btn.addEventListener("click", function () {
          activity.currentIndex = letterIndex;
          setMascotState("pointing");
          playLetterAudio(letter, 1, ui.audioFallback);
          if (!activity.completedItems.includes(letterIndex)) {
            markCurrentComplete(activityId, "Letter practised.");
          } else {
            setActivityStatus(activityId, "Letter reviewed.");
            saveAndRender();
          }
        });
        ui.letterGrid.appendChild(btn);
      });
    }

    if (ui.selectedDev) ui.selectedDev.textContent = selectedLetter.symbol;
    if (ui.selectedTran) ui.selectedTran.textContent = selectedLetter.transliteration;
    if (ui.selectedExample) ui.selectedExample.textContent = selectedLetter.exampleText;
    if (ui.selectedMeaning) ui.selectedMeaning.textContent = selectedLetter.meaning;
    if (ui.selectedPosition) ui.selectedPosition.textContent = "Letter " + (activity.currentIndex + 1) + " of 48";
    if (ui.selectedLearned) {
      const learned = activity.completedItems.includes(activity.currentIndex);
      ui.selectedLearned.textContent = learned ? "⭐ Learned" : "☆ Not learned yet";
      ui.selectedLearned.classList.toggle("learned", learned);
    }
    if (ui.selectedExampleArt) ui.selectedExampleArt.textContent = "🪷";
    if (ui.gardenCoverage) ui.gardenCoverage.textContent = activity.completedItems.length + " of 48 letters practised.";
  }

  function renderSubgroupButtons(category, activeSubgroup) {
    if (!ui.subgroupTabs) return;
    if (category !== "consonants") {
      ui.subgroupTabs.innerHTML = "";
      return;
    }
    const state = forestState.activities["letter-garden"];
    const subgroups = Array.from(new Set(letters
      .filter(function (letter) { return letter.category === "consonant"; })
      .map(function (letter) { return letter.subgroup || "other"; })));
    ui.subgroupTabs.innerHTML = "";
    const allBtn = document.createElement("button");
    allBtn.type = "button";
    allBtn.className = "button ghost";
    allBtn.textContent = "All";
    allBtn.classList.toggle("active", activeSubgroup === "all");
    allBtn.addEventListener("click", function () { state.answers.subgroup = "all"; saveAndRender(); });
    ui.subgroupTabs.appendChild(allBtn);
    subgroups.forEach(function (subgroup) {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "button ghost";
      btn.textContent = subgroup;
      btn.classList.toggle("active", activeSubgroup === subgroup);
      btn.addEventListener("click", function () { state.answers.subgroup = subgroup; saveAndRender(); });
      ui.subgroupTabs.appendChild(btn);
    });
  }

  function buildOptions(targetIndex, size) {
    const options = [targetIndex];
    let offset = 1;
    while (options.length < size) {
      const candidate = (targetIndex + offset * 7) % letters.length;
      if (!options.includes(candidate)) options.push(candidate);
      offset += 1;
    }
    for (let i = options.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      const tmp = options[i];
      options[i] = options[j];
      options[j] = tmp;
    }
    return options.map(function (index) { return letters[index]; });
  }

  function renderHearAndPick() {
    const activityId = "hear-and-pick";
    const letter = getCurrentLetter(activityId);
    if (!letter || !ui.hearChoices || !ui.hearStatus) return;
    ui.hearChoices.innerHTML = "";
    ui.hearStatus.textContent = "Tap the matching letter.";
    const options = buildOptions(forestState.activities[activityId].currentIndex, 4);
    options.forEach(function (option) {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "choice-btn";
      btn.textContent = option.symbol;
      btn.addEventListener("click", function () {
        if (option.id === letter.id) {
          btn.classList.add("correct");
          markCurrentComplete(activityId, "Correct!");
        } else {
          btn.classList.add("wrong");
          incrementAttempt(activityId);
          ui.hearStatus.textContent = "Try again.";
          setMascotState("encouraging");
        }
      });
      ui.hearChoices.appendChild(btn);
    });
    if (ui.playHearPrompt) ui.playHearPrompt.onclick = function () { playLetterAudio(letter, 1, ui.hearStatus); };
  }

  function getVocabulary(word, meaning) {
    const mapped = VOCAB.words[word];
    if (!mapped) return { image: VOCAB.fallback.image, alt: VOCAB.fallback.alt, meaning: meaning };
    return mapped;
  }

  function renderPictureMatch() {
    const activityId = "picture-match";
    const letter = getCurrentLetter(activityId);
    if (!letter || !ui.pictureChoices || !ui.picturePrompt || !ui.pictureStatus) return;
    ui.picturePrompt.textContent = "Select the correct picture for: " + letter.exampleText + " (" + letter.meaning + ")";
    ui.pictureStatus.textContent = "Choose the matching illustration.";
    ui.pictureChoices.innerHTML = "";
    const options = buildOptions(forestState.activities[activityId].currentIndex, 4);
    options.forEach(function (option) {
      const vocab = getVocabulary(option.exampleText, option.meaning);
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "choice-btn picture-choice";
      btn.innerHTML =
        '<img class="picture-illustration" src="' + vocab.image + '" alt="' + vocab.alt + '">' +
        '<span class="picture-label">' + option.exampleText + " · " + option.meaning + "</span>";
      btn.addEventListener("click", function () {
        if (option.id === letter.id) {
          btn.classList.add("correct");
          markCurrentComplete(activityId, "Correct picture!");
          setMascotState("celebrating");
        } else {
          btn.classList.add("wrong");
          incrementAttempt(activityId);
          ui.pictureStatus.textContent = "Not yet. Try again.";
          setMascotState("thinking");
        }
      });
      ui.pictureChoices.appendChild(btn);
    });
  }

  function renderArrangeWord() {
    const activityId = "arrange-word";
    const letter = getCurrentLetter(activityId);
    if (!letter || !ui.arrangePrompt || !ui.arrangeTiles || !ui.arrangeAnswer || !ui.arrangeStatus) return;
    const localState = runtime.byActivity[activityId];
    ui.arrangePrompt.textContent = "Arrange this Sanskrit word: " + letter.exampleText;
    ui.arrangeStatus.textContent = "Tap tiles in order.";
    ui.arrangeAnswer.textContent = localState.tempAnswer;
    ui.arrangeTiles.innerHTML = "";
    const parts = Array.from(letter.exampleText).reverse();
    parts.forEach(function (part) {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "tile-btn";
      btn.textContent = part;
      btn.addEventListener("click", function () {
        localState.tempAnswer += part;
        ui.arrangeAnswer.textContent = localState.tempAnswer;
      });
      ui.arrangeTiles.appendChild(btn);
    });
  }

  function renderFlashcardFlip() {
    const activityId = "flashcard-flip";
    const letter = getCurrentLetter(activityId);
    if (!letter || !ui.flashcard || !ui.flashChoices || !ui.flashStatus) return;
    const localState = runtime.byActivity[activityId];
    ui.flashcard.innerHTML = localState.flipped
      ? '<p><strong>' + letter.exampleText + "</strong><br>(" + letter.meaning + ")</p>"
      : '<p class="flash-dev">' + letter.symbol + "</p>";
    ui.flashStatus.textContent = localState.flipped ? "Pick the correct meaning." : "Flip the card.";
    ui.flashChoices.innerHTML = "";
    if (!localState.flipped) return;
    const options = buildOptions(forestState.activities[activityId].currentIndex, 4).map(function (item) { return item.meaning; });
    options.forEach(function (meaning) {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "choice-btn";
      btn.textContent = meaning;
      btn.addEventListener("click", function () {
        if (meaning === letter.meaning) {
          btn.classList.add("correct");
          markCurrentComplete(activityId, "Correct meaning!");
        } else {
          btn.classList.add("wrong");
          incrementAttempt(activityId);
          ui.flashStatus.textContent = "Try again.";
        }
      });
      ui.flashChoices.appendChild(btn);
    });
  }

  function renderFeedMithu() {
    const activityId = "feed-mithu";
    const letter = getCurrentLetter(activityId);
    if (!letter || !ui.feedPrompt || !ui.feedChoices || !ui.feedStatus || !ui.lessonMascot) return;
    ui.feedPrompt.textContent = "Feed Mithu: pick the correct word for " + letter.symbol;
    ui.feedStatus.textContent = "Choose one.";
    ui.feedChoices.innerHTML = "";
    const options = buildOptions(forestState.activities[activityId].currentIndex, 4);
    options.forEach(function (option) {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "choice-btn";
      btn.textContent = option.exampleText;
      btn.addEventListener("click", function () {
        if (option.id === letter.id) {
          animateFruitToMithu(btn);
          btn.classList.add("correct");
          markCurrentComplete(activityId, "Mithu enjoyed the fruit!");
          setMascotState("eating");
        } else {
          btn.classList.add("wrong");
          incrementAttempt(activityId);
          ui.feedStatus.textContent = "Try a different fruit.";
        }
      });
      ui.feedChoices.appendChild(btn);
    });
  }

  function animateFruitToMithu(sourceButton) {
    if (REDUCED_MOTION || !ui.lessonMascot) return;
    const source = sourceButton.getBoundingClientRect();
    const target = ui.lessonMascot.getBoundingClientRect();
    const fruit = document.createElement("span");
    fruit.className = "flying-fruit";
    fruit.textContent = "🍎";
    fruit.style.left = source.left + source.width / 2 + "px";
    fruit.style.top = source.top + source.height / 2 + "px";
    document.body.appendChild(fruit);
    animate(fruit, {
      left: [fruit.style.left, target.left + target.width * 0.55 + "px"],
      top: [fruit.style.top, target.top + target.height * 0.42 + "px"],
      transform: ["translate(-50%,-50%) scale(1)", "translate(-50%,-50%) scale(0.6)"]
    }, { duration: 0.7, easing: "ease-in" });
    setTimeout(function () { fruit.remove(); }, 760);
  }

  function renderLetterTracing() {
    const activityId = "letter-tracing";
    const letter = getCurrentLetter(activityId);
    if (!letter || !ui.tracePrompt || !ui.traceTargetLetter || !ui.traceStatus) return;
    ui.tracePrompt.textContent = "Trace letter " + letter.symbol + " using the dotted path.";
    ui.traceTargetLetter.textContent = letter.symbol;
    if (!isCurrentResolved(activityId)) ui.traceStatus.textContent = "Trace the letter, then tap Check tracing.";
    clearTraceBoard();
  }

  function renderHiddenLetterHunt() {
    const activityId = "hidden-letter-hunt";
    const letter = getCurrentLetter(activityId);
    if (!letter || !ui.huntPrompt || !ui.huntGrid || !ui.huntStatus) return;
    ui.huntPrompt.textContent = "Find letter " + letter.symbol + " in the grid.";
    ui.huntStatus.textContent = "Tap the target.";
    ui.huntGrid.innerHTML = "";
    const options = buildOptions(forestState.activities[activityId].currentIndex, 8);
    options.forEach(function (option) {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "tile-btn";
      btn.textContent = option.symbol;
      btn.addEventListener("click", function () {
        if (option.id === letter.id) {
          btn.classList.add("correct");
          markCurrentComplete(activityId, "Found it!");
        } else {
          btn.classList.add("wrong");
          incrementAttempt(activityId);
          ui.huntStatus.textContent = "Keep searching.";
        }
      });
      ui.huntGrid.appendChild(btn);
    });
  }

  function renderActivityControls() {
    ACTIVITIES.forEach(function (activity) {
      const mount = document.getElementById(activity.controlsId);
      const state = forestState.activities[activity.id];
      if (!mount || !state) return;
      const progress = mount.querySelector("#progress-" + activity.id);
      const status = mount.querySelector("#status-" + activity.id);
      const complete = mount.querySelector("#complete-" + activity.id);
      const resolved = isCurrentResolved(activity.id);
      const atLast = state.currentIndex >= letters.length - 1;
      const canFinish = atLast && resolved && state.completedItems.length >= letters.length && !state.isComplete;
      if (progress) {
        if (activity.id === "magical-tree") {
          progress.textContent = "Magical Tree: " + state.completedItems.length + " of 48 letters discovered.";
        } else if (activity.id === "letter-garden") {
          progress.textContent = "Letter Garden: " + state.completedItems.length + " of 48 letters practised.";
        } else {
          progress.textContent = "Progress: " + (state.currentIndex + 1) + " of 48";
        }
      }
      if (status) status.textContent = runtime.byActivity[activity.id].status || "";
      if (complete) complete.textContent = state.isComplete ? activity.title + " completed." : "";
      if (activity.type === "tree") return;
      const previous = mount.querySelector('[data-action="previous"]');
      const retry = mount.querySelector('[data-action="retry"]');
      const next = mount.querySelector('[data-action="next"]');
      const finish = mount.querySelector('[data-action="finish"]');
      const restart = mount.querySelector('[data-action="restart"]');
      if (previous) previous.disabled = state.currentIndex === 0;
      if (retry) retry.disabled = false;
      if (next) {
        next.hidden = canFinish;
        next.disabled = atLast || !resolved;
      }
      if (finish) {
        finish.hidden = !canFinish;
        finish.disabled = !canFinish;
      }
      if (restart) restart.disabled = !state.isComplete;
    });
  }

  function updateWorldCompletionPanels() {
    const global = CORE.computeGlobalProgress(forestState);
    const allDone = global.completedActivityCount === global.totalActivities;
    if (ui.doneBanner) ui.doneBanner.classList.toggle("show", allDone);
    if (ui.completionScreen) ui.completionScreen.classList.toggle("show", allDone);
    if (ui.completionStars) ui.completionStars.textContent = String(forestState.xp);
  }
})();
