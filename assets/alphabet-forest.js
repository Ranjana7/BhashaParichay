(function initAlphabetForestV2() {
  const STORAGE_KEY = "sanskritParichay.alphabetForest.progression.v1";
  const MUTE_KEY = "sanskritParichay.muted";
  const ACTIVITY_SEQUENCE = [
    { id: "magical-tree", label: "Magical Tree", panelId: "forestScene" },
    { id: "letter-garden", label: "Letter Garden", panelId: "letterGardenSection" },
    { id: "listen-identify", label: "Listen and Identify", panelId: "activityHearGamePanel" },
    { id: "letter-tracing", label: "Letter Tracing", panelId: "activityTraceGamePanel" },
    { id: "letter-matching", label: "Letter Matching", panelId: "activityPictureGamePanel" },
    { id: "letter-hunt", label: "Letter Treasure Hunt", panelId: "activityHuntGamePanel" }
  ];
  const TREE_GROUP_SIZE = 5;
  const TREE_SLOT_POSITIONS = [
    { x: 31, y: 34 },
    { x: 43, y: 23 },
    { x: 56, y: 29 },
    { x: 67, y: 22 },
    { x: 74, y: 36 }
  ];
  const prefersReducedMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const motion = window.Motion || {};
  const animate = motion.animate || function () {};

  if (!window.SPProgressionController || !window.SPProgressionController.createProgressionController) return;
  if (!window.SP_PDF_LETTER_INVENTORY || !Array.isArray(window.SP_PDF_LETTER_INVENTORY.items)) return;

  const canonicalLetters = window.SP_PDF_LETTER_INVENTORY.items.map(function mapItem(item, index) {
    const example = item.example || {};
    return {
      id: item.id || ("pdf-" + index),
      order: index,
      devanagari: item.symbol,
      transliteration: item.transliteration || "",
      example: example.sanskrit || item.symbol,
      meaning: example.meaning || "Needs review",
      category: item.category || "consonant",
      subgroup: item.subgroup || "",
      audioKey: item.pronunciation && item.pronunciation.audioKey ? item.pronunciation.audioKey : (item.transliteration || ""),
      localPath: item.pronunciation && item.pronunciation.localPath ? item.pronunciation.localPath : "",
      reviewStatus: item.sanskritReviewStatus || "needs_review"
    };
  }).filter(function hasSymbol(item) { return Boolean(item.devanagari); });

  if (canonicalLetters.length !== 48) {
    console.error("Expected 48 PDF letters, found " + canonicalLetters.length + ".");
  }

  const letterById = new Map(canonicalLetters.map(function mapById(letter) { return [letter.id, letter]; }));

  const ui = {
    muteToggle: document.getElementById("muteToggle"),
    panelMuteBtn: document.getElementById("panelMuteBtn"),
    testSoundBtn: document.getElementById("testSoundBtn"),
    audioFallback: document.getElementById("audioFallback"),
    audioDebug: document.getElementById("audioDebug"),
    lessonMascot: document.getElementById("lessonMascot"),
    lessonMascotSpeech: document.getElementById("lessonMascotSpeech"),
    doneBanner: document.getElementById("doneBanner"),
    completionScreen: document.getElementById("completionScreen"),
    completionStars: document.getElementById("completionStars"),
    nextAdventureBtn: document.getElementById("nextAdventureBtn"),
    completionNextBtn: document.getElementById("completionNextBtn"),
    nextLessonBtn: document.getElementById("nextLessonBtn"),
    nextLessonTopBtn: document.getElementById("nextLessonTopBtn"),
    continueAdventureTopBtn: document.getElementById("continueAdventureTopBtn"),
    backToWorldsTopBtn: document.getElementById("backToWorldsTopBtn"),
    lessonIndex: document.getElementById("lessonIndex"),
    lessonName: document.getElementById("lessonName"),
    lessonObjective: document.getElementById("lessonObjective"),
    starCount: document.getElementById("starCount"),
    doneCount: document.getElementById("doneCount"),
    streakCount: document.getElementById("streakCount"),
    progressFill: document.getElementById("progressFill"),
    progressText: document.getElementById("progressText"),
    globalProgressSummary: document.getElementById("globalProgressSummary"),
    globalProgressFill: document.getElementById("globalProgressFill"),
    treeInstruction: document.getElementById("treeInstruction"),
    treeCounter: document.getElementById("treeCounter"),
    treeStatus: document.getElementById("treeStatus"),
    prevTreeGroupBtn: document.getElementById("prevTreeGroupBtn"),
    nextTreeGroupBtn: document.getElementById("nextTreeGroupBtn"),
    treeMithu: document.getElementById("treeMithu"),
    magicalTreeStage: document.getElementById("magicalTreeStage"),
    magicalTreeLetters: document.getElementById("magicalTreeLetters"),
    treeProgressBlooms: document.getElementById("treeProgressBlooms"),
    spotlightLetterDev: document.getElementById("spotlightLetterDev"),
    spotlightLetterTran: document.getElementById("spotlightLetterTran"),
    spotlightLetterExample: document.getElementById("spotlightLetterExample"),
    selectedDev: document.getElementById("selectedDev"),
    selectedTran: document.getElementById("selectedTran"),
    selectedExample: document.getElementById("selectedExample"),
    selectedMeaning: document.getElementById("selectedMeaning"),
    selectedExampleArt: document.getElementById("selectedExampleArt"),
    selectedPosition: document.getElementById("selectedPosition"),
    selectedLearned: document.getElementById("selectedLearned"),
    replayLetterBtn: document.getElementById("replayLetterBtn"),
    slowLetterBtn: document.getElementById("slowLetterBtn"),
    prevLetterBtn: document.getElementById("prevLetterBtn"),
    nextLetterBtn: document.getElementById("nextLetterBtn"),
    letterCategoryTabs: Array.from(document.querySelectorAll(".category-tab")),
    consonantSubgroupTabs: document.getElementById("consonantSubgroupTabs"),
    gardenCoverage: document.getElementById("gardenCoverage"),
    letterGrid: document.getElementById("letterGrid"),
    playHearPrompt: document.getElementById("playHearPrompt"),
    hearChoices: document.getElementById("hearChoices"),
    hearStatus: document.getElementById("hearStatus"),
    traceCanvas: document.getElementById("traceCanvas"),
    traceTargetLetter: document.getElementById("traceTargetLetter"),
    clearTraceBtn: document.getElementById("clearTraceBtn"),
    checkTraceBtn: document.getElementById("checkTraceBtn"),
    traceStatus: document.getElementById("traceStatus"),
    picturePrompt: document.getElementById("picturePrompt"),
    pictureChoices: document.getElementById("pictureChoices"),
    pictureStatus: document.getElementById("pictureStatus"),
    huntPrompt: document.getElementById("huntPrompt"),
    huntGrid: document.getElementById("huntGrid"),
    huntStatus: document.getElementById("huntStatus"),
    hidePanels: [
      document.getElementById("activityArrangeGamePanel"),
      document.getElementById("activityFlashGamePanel"),
      document.getElementById("activityFeedGamePanel")
    ]
  };

  const activityPanels = Object.fromEntries(
    ACTIVITY_SEQUENCE.map(function mapPanel(activity) {
      return [activity.id, document.getElementById(activity.panelId)];
    })
  );

  if (!window.SP_STATE) window.SP_STATE = { muted: false };

  const progression = window.SPProgressionController.createProgressionController({
    activityIds: ACTIVITY_SEQUENCE.map(function mapId(activity) { return activity.id; }),
    letterCount: canonicalLetters.length,
    storageKey: STORAGE_KEY,
    storage: window.localStorage,
    perLetterXP: 1,
    activityCompletionXP: 8
  });
  progression.resumeProgress();

  const runtime = {
    currentLetter: canonicalLetters[0],
    currentAudio: null,
    interactionCompleted: false,
    retryLockKey: null,
    activeCategory: "vowels",
    activeConsonantSubgroup: "all",
    gameSeed: 0,
    localNav: {},
    lastActivityId: null,
    trace: {
      ctx: null,
      drawing: false,
      strokeCount: 0
    }
  };

  hideNonSequencePanels();
  setupTraceCanvas();
  setupStaticActions();
  renderConsonantSubgroupTabs();
  renderGlobalSummary();
  setupMascotCompanion();
  renderCurrentActivity();
  renderAudioDebug();

  function hideNonSequencePanels() {
    ui.hidePanels.forEach(function hidePanel(panel) {
      if (panel) panel.hidden = true;
    });
  }

  function ensureMutedState() {
    const fromStorage = localStorage.getItem(MUTE_KEY);
    if (fromStorage === "true") window.SP_STATE.muted = true;
    if (fromStorage === "false") window.SP_STATE.muted = false;
  }

  function toggleMutedState() {
    window.SP_STATE.muted = !window.SP_STATE.muted;
    localStorage.setItem(MUTE_KEY, String(window.SP_STATE.muted));
    renderMuteButtons();
  }

  function renderMuteButtons() {
    if (ui.muteToggle) {
      ui.muteToggle.textContent = window.SP_STATE.muted ? "🔇 Sound: Off" : "🔊 Sound: On";
      ui.muteToggle.setAttribute("aria-pressed", window.SP_STATE.muted ? "true" : "false");
    }
    if (ui.panelMuteBtn) {
      ui.panelMuteBtn.textContent = window.SP_STATE.muted ? "🔊 Unmute" : "🔇 Mute";
      ui.panelMuteBtn.setAttribute("aria-pressed", window.SP_STATE.muted ? "true" : "false");
    }
  }

  function setupStaticActions() {
    ensureMutedState();
    renderMuteButtons();

    if (ui.muteToggle) {
      ui.muteToggle.addEventListener("click", function onToggleMute() {
        toggleMutedState();
      });
    }
    if (ui.panelMuteBtn) {
      ui.panelMuteBtn.addEventListener("click", function onPanelMute() {
        toggleMutedState();
      });
    }
    if (ui.testSoundBtn) {
      ui.testSoundBtn.addEventListener("click", function onTestSound() {
        if (runtime.currentLetter) playPronunciation(runtime.currentLetter, 1, ui.audioFallback);
      });
    }
    if (ui.replayLetterBtn) {
      ui.replayLetterBtn.addEventListener("click", function onReplay() {
        if (runtime.currentLetter) playPronunciation(runtime.currentLetter, 1, ui.audioFallback);
      });
    }
    if (ui.slowLetterBtn) {
      ui.slowLetterBtn.addEventListener("click", function onSlow() {
        if (runtime.currentLetter) playPronunciation(runtime.currentLetter, 0.72, ui.audioFallback);
      });
    }
    if (ui.selectedDev) {
      ui.selectedDev.addEventListener("click", function onBigLetter() {
        if (runtime.currentLetter) playPronunciation(runtime.currentLetter, 1, ui.audioFallback);
      });
    }
    if (ui.selectedExample) {
      ui.selectedExample.addEventListener("click", function onExample() {
        if (runtime.currentLetter) playPronunciation(runtime.currentLetter, 1, ui.audioFallback);
      });
    }
    if (ui.prevLetterBtn) ui.prevLetterBtn.addEventListener("click", movePreviousLetter);
    if (ui.nextLetterBtn) ui.nextLetterBtn.addEventListener("click", moveNextLetter);

    if (ui.nextAdventureBtn) {
      ui.nextAdventureBtn.addEventListener("click", function onNextAdventure() {
        window.location.href = "my-progress.html";
      });
    }
    if (ui.completionNextBtn) {
      ui.completionNextBtn.addEventListener("click", function onCompletionNext() {
        window.location.href = "my-progress.html";
      });
    }
    if (ui.nextLessonBtn) {
      ui.nextLessonBtn.addEventListener("click", function onNextLesson() {
        window.location.href = "my-progress.html";
      });
    }
    if (ui.nextLessonTopBtn) {
      ui.nextLessonTopBtn.disabled = true;
      ui.nextLessonTopBtn.textContent = "Next Lesson (complete all activities)";
    }
    if (ui.continueAdventureTopBtn) {
      ui.continueAdventureTopBtn.addEventListener("click", function onContinueAdventure() {
        const activityId = progression.getCurrentActivityId();
        const panel = activityPanels[activityId];
        if (panel) panel.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    }
    if (ui.backToWorldsTopBtn) {
      ui.backToWorldsTopBtn.addEventListener("click", function onBackToWorlds() {
        window.location.href = "explore-worlds.html";
      });
    }

    ui.letterCategoryTabs.forEach(function setupTab(tab) {
      tab.addEventListener("click", function onTabClick() {
        ui.letterCategoryTabs.forEach(function removeActive(item) { item.classList.remove("active"); });
        tab.classList.add("active");
        runtime.activeCategory = tab.getAttribute("data-category") || "vowels";
        if (runtime.activeCategory !== "consonants") runtime.activeConsonantSubgroup = "all";
        renderConsonantSubgroupTabs();
        if (progression.getCurrentActivityId() === "letter-garden") renderLetterGarden();
      });
    });

    if (ui.prevTreeGroupBtn) {
      ui.prevTreeGroupBtn.addEventListener("click", function onPrevGroup() {
        if (progression.getCurrentActivityId() !== "magical-tree") return;
        const currentIndex = progression.getCurrentLetterIndex("magical-tree");
        const currentGroup = Math.floor(currentIndex / TREE_GROUP_SIZE);
        if (currentGroup <= 0) return;
        jumpToTreeGroup(currentGroup - 1);
      });
    }
    if (ui.nextTreeGroupBtn) {
      ui.nextTreeGroupBtn.addEventListener("click", function onNextGroup() {
        if (progression.getCurrentActivityId() !== "magical-tree") return;
        const currentIndex = progression.getCurrentLetterIndex("magical-tree");
        const currentGroup = Math.floor(currentIndex / TREE_GROUP_SIZE);
        const maxGroup = Math.floor((canonicalLetters.length - 1) / TREE_GROUP_SIZE);
        if (currentGroup >= maxGroup) return;
        jumpToTreeGroup(currentGroup + 1);
      });
    }
  }

  function setupTraceCanvas() {
    if (!ui.traceCanvas) return;
    runtime.trace.ctx = ui.traceCanvas.getContext("2d");
    runtime.trace.ctx.lineCap = "round";
    runtime.trace.ctx.lineJoin = "round";
    runtime.trace.ctx.lineWidth = 8;
    runtime.trace.ctx.strokeStyle = "#5b5fd6";
    clearTraceCanvas();

    function getPoint(event) {
      const rect = ui.traceCanvas.getBoundingClientRect();
      const pointer = event.touches ? event.touches[0] : event;
      return {
        x: (pointer.clientX - rect.left) * (ui.traceCanvas.width / rect.width),
        y: (pointer.clientY - rect.top) * (ui.traceCanvas.height / rect.height)
      };
    }

    function startDraw(event) {
      runtime.trace.drawing = true;
      const point = getPoint(event);
      runtime.trace.ctx.beginPath();
      runtime.trace.ctx.moveTo(point.x, point.y);
      runtime.trace.strokeCount += 1;
      event.preventDefault();
    }

    function moveDraw(event) {
      if (!runtime.trace.drawing) return;
      const point = getPoint(event);
      runtime.trace.ctx.lineTo(point.x, point.y);
      runtime.trace.ctx.stroke();
      runtime.trace.strokeCount += 1;
      event.preventDefault();
    }

    function endDraw() {
      runtime.trace.drawing = false;
    }

    ui.traceCanvas.addEventListener("pointerdown", startDraw);
    ui.traceCanvas.addEventListener("pointermove", moveDraw);
    ui.traceCanvas.addEventListener("pointerup", endDraw);
    ui.traceCanvas.addEventListener("pointerleave", endDraw);
    ui.traceCanvas.addEventListener("touchstart", startDraw, { passive: false });
    ui.traceCanvas.addEventListener("touchmove", moveDraw, { passive: false });
    ui.traceCanvas.addEventListener("touchend", endDraw);

    if (ui.clearTraceBtn) {
      ui.clearTraceBtn.addEventListener("click", function onClearTrace() {
        clearTraceCanvas();
        setNavStatus("Tracing board cleared.");
      });
    }
    if (ui.checkTraceBtn) {
      ui.checkTraceBtn.addEventListener("click", function onCheckTrace() {
        if (runtime.trace.strokeCount < 45) {
          ui.traceStatus.textContent = "Trace a little more and check again.";
          setMascotState("encouraging");
          setMascotSpeech("Trace it once more slowly.");
          return;
        }
        completeCurrentLetter("Beautiful tracing! Next is unlocked.");
        ui.traceStatus.textContent = "Beautiful tracing!";
      });
    }
  }

  function clearTraceCanvas() {
    if (!runtime.trace.ctx || !ui.traceCanvas) return;
    runtime.trace.ctx.clearRect(0, 0, ui.traceCanvas.width, ui.traceCanvas.height);
    runtime.trace.strokeCount = 0;
  }

  function renderGlobalSummary() {
    const snapshot = progression.getSnapshot();
    const completedActivities = ACTIVITY_SEQUENCE.filter(function countCompleted(activity) {
      return snapshot.state.activities[activity.id].completedAtLeastOnce;
    }).length;
    if (ui.globalProgressSummary) {
      ui.globalProgressSummary.textContent = completedActivities + " of " + ACTIVITY_SEQUENCE.length + " activities completed";
    }
    if (ui.globalProgressFill) {
      ui.globalProgressFill.style.width = ((completedActivities / ACTIVITY_SEQUENCE.length) * 100).toFixed(1) + "%";
    }
  }

  function getLocalNavTarget(activityId) {
    if (activityId === "letter-garden") return document.getElementById("activityHearPanel");
    return activityPanels[activityId];
  }

  function createLocalNav(activityId) {
    if (runtime.localNav[activityId]) return runtime.localNav[activityId];
    const target = getLocalNavTarget(activityId);
    if (!target) return null;

    const wrap = document.createElement("div");
    wrap.className = "activity-local-nav";
    wrap.setAttribute("data-activity-local-nav", activityId);
    wrap.innerHTML =
      '<p class="footer-note local-progress"></p>' +
      '<div class="hero-actions">' +
      '<button type="button" class="button ghost" data-action="previous">Previous</button>' +
      '<button type="button" class="button ghost" data-action="retry">Retry</button>' +
      '<button type="button" class="button secondary" data-action="next">Next</button>' +
      '<button type="button" class="button secondary" data-action="finish" hidden>Finish Activity</button>' +
      '<button type="button" class="button primary" data-action="next-activity" hidden>Next Activity</button>' +
      '<button type="button" class="button ghost" data-action="reset" hidden>Reset Activity</button>' +
      '<button type="button" class="button ghost" data-action="back">Back to Activities</button>' +
      '</div>' +
      '<p class="status local-status" aria-live="polite"></p>';

    target.appendChild(wrap);

    const controls = {
      root: wrap,
      progress: wrap.querySelector(".local-progress"),
      status: wrap.querySelector(".local-status"),
      previous: wrap.querySelector('[data-action="previous"]'),
      retry: wrap.querySelector('[data-action="retry"]'),
      next: wrap.querySelector('[data-action="next"]'),
      finish: wrap.querySelector('[data-action="finish"]'),
      nextActivity: wrap.querySelector('[data-action="next-activity"]'),
      reset: wrap.querySelector('[data-action="reset"]'),
      back: wrap.querySelector('[data-action="back"]')
    };

    controls.previous.addEventListener("click", movePreviousLetter);
    controls.next.addEventListener("click", moveNextLetter);
    controls.retry.addEventListener("click", function onRetry() {
      const currentActivityId = progression.getCurrentActivityId();
      const letterIndex = progression.getCurrentLetterIndex(currentActivityId);
      progression.retryCurrentLetter(currentActivityId);
      runtime.retryLockKey = currentActivityId + ":" + letterIndex;
      runtime.interactionCompleted = false;
      setNavStatus("Retry this letter to unlock Next.");
      renderCurrentActivity();
    });
    controls.finish.addEventListener("click", function onFinish() {
      const currentActivityId = progression.getCurrentActivityId();
      const result = progression.completeActivity(currentActivityId);
      if (!result.completed) {
        setNavStatus("Complete all 48 letters before finishing this activity.");
        return;
      }
      if (window.spApplause) window.spApplause();
      fireConfetti(90);
      setMascotState("dancing");
      setMascotSpeech(labelForActivity(currentActivityId) + " complete! Great work.");
      setNavStatus(labelForActivity(currentActivityId) + " complete. You can move to the next activity.");
      if (result.worldCompleted) showWorldCompletion();
      renderCurrentActivity();
    });
    controls.nextActivity.addEventListener("click", function onNextActivity() {
      progression.goToNextActivity();
      runtime.retryLockKey = null;
      renderCurrentActivity();
    });
    controls.reset.addEventListener("click", function onReset() {
      const currentActivityId = progression.getCurrentActivityId();
      const confirmed = window.confirm("Reset this completed activity and restart from Letter 1?");
      if (!confirmed) return;
      const result = progression.resetActivity(currentActivityId);
      if (!result.reset) {
        setNavStatus("Reset is available only after finishing all 48 letters in this activity.");
        return;
      }
      runtime.retryLockKey = null;
      setNavStatus("Activity reset. Start again from Letter 1.");
      renderCurrentActivity();
    });
    controls.back.addEventListener("click", function onBack() {
      const hub = document.getElementById("activityNavigator");
      if (hub) hub.scrollIntoView({ behavior: "smooth", block: "start" });
    });

    runtime.localNav[activityId] = controls;
    return controls;
  }

  function labelForActivity(activityId) {
    const activity = ACTIVITY_SEQUENCE.find(function findActivity(item) { return item.id === activityId; });
    return activity ? activity.label : activityId;
  }

  function activityCategoryForLetter(letter) {
    if (letter.category === "vowel" || letter.category === "sign") return "vowels";
    return "consonants";
  }

  function consonantSubgroupLabel(subgroup) {
    const labels = {
      "ka-varga": "क-वर्ग",
      "ca-varga": "च-वर्ग",
      "tta-varga": "ट-वर्ग",
      "ta-varga": "त-वर्ग",
      "pa-varga": "प-वर्ग",
      antastha: "अन्तःस्थाः",
      ushmana: "ऊष्माणः"
    };
    return labels[subgroup] || subgroup;
  }

  function renderConsonantSubgroupTabs() {
    if (!ui.consonantSubgroupTabs) return;
    if (runtime.activeCategory !== "consonants") {
      ui.consonantSubgroupTabs.innerHTML = "";
      return;
    }
    const subgroups = Array.from(new Set(canonicalLetters
      .filter(function onlyConsonants(letter) { return activityCategoryForLetter(letter) === "consonants"; })
      .map(function mapGroup(letter) { return letter.subgroup || "other"; })));
    ui.consonantSubgroupTabs.innerHTML = "";

    const allBtn = document.createElement("button");
    allBtn.type = "button";
    allBtn.className = "button ghost";
    allBtn.textContent = "All";
    allBtn.classList.toggle("active", runtime.activeConsonantSubgroup === "all");
    allBtn.addEventListener("click", function () {
      runtime.activeConsonantSubgroup = "all";
      renderConsonantSubgroupTabs();
      if (progression.getCurrentActivityId() === "letter-garden") renderLetterGarden();
    });
    ui.consonantSubgroupTabs.appendChild(allBtn);

    subgroups.forEach(function eachSubgroup(subgroup) {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "button ghost";
      button.textContent = consonantSubgroupLabel(subgroup);
      button.classList.toggle("active", runtime.activeConsonantSubgroup === subgroup);
      button.addEventListener("click", function () {
        runtime.activeConsonantSubgroup = subgroup;
        renderConsonantSubgroupTabs();
        if (progression.getCurrentActivityId() === "letter-garden") renderLetterGarden();
      });
      ui.consonantSubgroupTabs.appendChild(button);
    });
  }

  function jumpToTreeGroup(groupIndex) {
    if (typeof progression.setCurrentLetterIndex !== "function") return;
    const maxGroup = Math.floor((canonicalLetters.length - 1) / TREE_GROUP_SIZE);
    const safeGroup = Math.max(0, Math.min(maxGroup, groupIndex));
    progression.setCurrentLetterIndex("magical-tree", safeGroup * TREE_GROUP_SIZE);
    runtime.retryLockKey = null;
    renderCurrentActivity();
  }

  function renderCurrentActivity() {
    const activityId = progression.getCurrentActivityId();
    const letterIndex = progression.getCurrentLetterIndex(activityId);
    const letter = canonicalLetters[letterIndex];
    runtime.currentLetter = letter;
    if (runtime.lastActivityId !== activityId) {
      setMascotState("listening");
      setMascotSpeech("Now exploring " + labelForActivity(activityId) + ".");
      runtime.lastActivityId = activityId;
    }

    Object.keys(activityPanels).forEach(function hideInactive(id) {
      const panel = activityPanels[id];
      if (!panel) return;
      panel.hidden = id !== activityId;
    });

    renderGlobalSummary();

    const alreadyCompleted = progression.isLetterCompleted(activityId, letterIndex);
    const retryLocked = runtime.retryLockKey === (activityId + ":" + letterIndex);
    runtime.interactionCompleted = alreadyCompleted && !retryLocked;
    renderSharedLearningPanel(letter, letterIndex, activityId);
    renderLocalActivityNavigation(activityId, letterIndex);

    if (activityId === "magical-tree") renderMagicalTree();
    if (activityId === "letter-garden") renderLetterGarden();
    if (activityId === "listen-identify") renderListenIdentify();
    if (activityId === "letter-tracing") renderLetterTracing();
    if (activityId === "letter-matching") renderLetterMatching();
    if (activityId === "letter-hunt") renderLetterHunt();

    renderProgressSummary();
    updateNavigationButtons();
  }

  function renderLocalActivityNavigation(activityId, letterIndex) {
    const activityIndex = ACTIVITY_SEQUENCE.findIndex(function findIndex(entry) { return entry.id === activityId; });
    const controls = createLocalNav(activityId);
    if (!controls) return;
    controls.progress.textContent =
      "Activity " + (activityIndex + 1) + " of " + ACTIVITY_SEQUENCE.length +
      " · Letter " + (letterIndex + 1) + " of " + canonicalLetters.length;
    if (activityId === "magical-tree") {
      controls.previous.hidden = true;
      controls.next.hidden = true;
      controls.reset.textContent = "Play Magical Tree Again";
    } else {
      controls.previous.hidden = false;
      controls.next.hidden = false;
      controls.previous.textContent = "Previous";
      controls.next.textContent = "Next";
      controls.reset.textContent = "Reset Activity";
    }
  }

  function renderSharedLearningPanel(letter, letterIndex, activityId) {
    if (!letter) return;
    if (ui.selectedDev) ui.selectedDev.textContent = letter.devanagari;
    if (ui.selectedTran) ui.selectedTran.textContent = letter.transliteration;
    if (ui.selectedExample) ui.selectedExample.textContent = letter.example;
    if (ui.selectedMeaning) ui.selectedMeaning.textContent = letter.meaning;
    if (ui.selectedExampleArt) ui.selectedExampleArt.textContent = pickExampleArt(letter.devanagari);
    if (ui.selectedPosition) ui.selectedPosition.textContent = "Letter " + (letterIndex + 1) + " of " + canonicalLetters.length;
    if (ui.selectedLearned) {
      ui.selectedLearned.textContent = progression.isLetterCompleted(activityId, letterIndex) ? "⭐ Learned" : "☆ Not learned yet";
      ui.selectedLearned.classList.toggle("learned", progression.isLetterCompleted(activityId, letterIndex));
    }
  }

  function renderMagicalTree() {
    if (!ui.magicalTreeLetters || !runtime.currentLetter) return;
    const activityId = "magical-tree";
    const letterIndex = progression.getCurrentLetterIndex(activityId);
    const groupStart = Math.floor(letterIndex / TREE_GROUP_SIZE) * TREE_GROUP_SIZE;
    const groupLetters = canonicalLetters.slice(groupStart, groupStart + TREE_GROUP_SIZE);
    const groupEnd = Math.min(groupStart + TREE_GROUP_SIZE - 1, canonicalLetters.length - 1);
    const currentGroup = Math.floor(groupStart / TREE_GROUP_SIZE);
    const maxGroup = Math.floor((canonicalLetters.length - 1) / TREE_GROUP_SIZE);
    const groupCompleted = groupLetters.every(function isDone(letter) {
      const idx = canonicalLetters.findIndex(function find(item) { return item.id === letter.id; });
      return progression.isLetterCompleted(activityId, idx);
    });

    ui.magicalTreeLetters.innerHTML = "";
    if (ui.treeInstruction) {
      ui.treeInstruction.textContent = "Tap a glowing letter to discover its sound!";
    }
    if (ui.treeCounter) {
      ui.treeCounter.textContent = "Group " + (currentGroup + 1) + " of " + (maxGroup + 1);
    }
    if (ui.treeStatus) {
      ui.treeStatus.textContent = groupCompleted
        ? "Great! Group complete."
        : "Discover all five letters in this group.";
    }
    if (ui.prevTreeGroupBtn) {
      ui.prevTreeGroupBtn.disabled = currentGroup === 0;
    }
    if (ui.nextTreeGroupBtn) {
      ui.nextTreeGroupBtn.disabled = currentGroup >= maxGroup;
    }

    groupLetters.forEach(function renderTreeButton(letter, index) {
      const pos = TREE_SLOT_POSITIONS[index] || TREE_SLOT_POSITIONS[TREE_SLOT_POSITIONS.length - 1];
      const button = document.createElement("button");
      button.type = "button";
      button.className = "tree-letter-btn";
      button.style.left = pos.x + "%";
      button.style.top = pos.y + "%";
      button.innerHTML = '<span class="tree-dev">' + letter.devanagari + "</span>";
      button.classList.toggle("discovered", progression.isLetterCompleted(activityId, canonicalLetters.indexOf(letter)));
      button.classList.toggle("tree-active", letter.id === runtime.currentLetter.id);
      button.addEventListener("click", function onTreeClick() {
        const letterGlobalIndex = canonicalLetters.findIndex(function find(item) { return item.id === letter.id; });
        if (typeof progression.setCurrentLetterIndex === "function") {
          progression.setCurrentLetterIndex(activityId, letterGlobalIndex);
          runtime.currentLetter = letter;
        }
        updateSpotlight(letter);
        moveTreeMithuNearButton(button);
        setMascotState("pointing");
        setMascotSpeech("Listen to " + letter.devanagari + ".");
        playPronunciation(letter, 1, ui.treeStatus);
        const alreadyDone = progression.isLetterCompleted(activityId, letterGlobalIndex);
        if (!alreadyDone) {
          growTreeBloom();
          completeCurrentLetter("Wonderful! Letter discovered.");
        }
        const nowGroupCompleted = canonicalLetters
          .slice(groupStart, groupEnd + 1)
          .every(function allDone(entry, offset) {
            return progression.isLetterCompleted(activityId, groupStart + offset);
          });
        if (nowGroupCompleted) {
          setMascotState("celebrating");
          setMascotSpeech("Beautiful! Group complete.");
          fireConfetti(40);
          if (currentGroup < maxGroup) {
            setTimeout(function autoAdvanceGroup() {
              jumpToTreeGroup(currentGroup + 1);
              setMascotState("listening");
              setMascotSpeech("New letters are ready.");
            }, 700);
          } else {
            setNavStatus("Magical Tree complete! You can finish this activity.");
          }
        }
      });
      ui.magicalTreeLetters.appendChild(button);
    });

    if (groupCompleted && currentGroup === maxGroup && progression.getActivityProgress(activityId).completedCount === canonicalLetters.length) {
      setNavStatus("All 48 letters discovered. Finish Activity or Play Magical Tree Again.");
    }
  }

  function updateSpotlight(letter) {
    if (!letter) return;
    if (ui.spotlightLetterDev) ui.spotlightLetterDev.textContent = letter.devanagari;
    if (ui.spotlightLetterTran) ui.spotlightLetterTran.textContent = letter.transliteration;
    if (ui.spotlightLetterExample) ui.spotlightLetterExample.textContent = letter.example + " · " + letter.meaning;
  }

  function moveTreeMithuNearButton(button) {
    if (!ui.treeMithu || !ui.magicalTreeStage || !button) return;
    const stageRect = ui.magicalTreeStage.getBoundingClientRect();
    const buttonRect = button.getBoundingClientRect();
    const targetX = buttonRect.left - stageRect.left + buttonRect.width / 2 + 48;
    const targetY = buttonRect.top - stageRect.top + buttonRect.height / 2 - 28;
    if (prefersReducedMotion) {
      ui.treeMithu.style.left = targetX + "px";
      ui.treeMithu.style.top = targetY + "px";
      return;
    }
    animate(ui.treeMithu, {
      left: [ui.treeMithu.style.left || "78%", targetX + "px"],
      top: [ui.treeMithu.style.top || "60%", targetY + "px"],
      transform: ["translate(-50%, -50%) scale(1)", "translate(-50%, -58%) scale(1.04)", "translate(-50%, -50%) scale(1)"]
    }, { duration: 0.7, easing: "ease-in-out" });
    ui.treeMithu.style.left = targetX + "px";
    ui.treeMithu.style.top = targetY + "px";
  }

  function growTreeBloom() {
    if (!ui.treeProgressBlooms) return;
    const bloom = document.createElement("span");
    bloom.className = "group-bloom";
    bloom.style.left = (20 + Math.random() * 60).toFixed(1) + "%";
    bloom.style.top = (18 + Math.random() * 55).toFixed(1) + "%";
    ui.treeProgressBlooms.appendChild(bloom);
    setTimeout(function cleanupBloom() {
      bloom.remove();
    }, 1800);
  }

  function renderLetterGarden() {
    const activityId = "letter-garden";
    const target = runtime.currentLetter;
    if (!target || !ui.letterGrid) return;

    let filtered = canonicalLetters.filter(function filterByCategory(letter) {
      const category = activityCategoryForLetter(letter);
      if (runtime.activeCategory === "practice") return true;
      if (runtime.activeCategory === "vowels") return category === "vowels";
      if (runtime.activeCategory === "consonants") {
        if (category !== "consonants") return false;
        if (runtime.activeConsonantSubgroup === "all") return true;
        return (letter.subgroup || "other") === runtime.activeConsonantSubgroup;
      }
      return true;
    });

    if (!filtered.some(function hasTarget(letter) { return letter.id === target.id; })) {
      runtime.activeCategory = activityCategoryForLetter(target);
      runtime.activeConsonantSubgroup = "all";
      ui.letterCategoryTabs.forEach(function markTabs(tab) {
        const isActive = tab.getAttribute("data-category") === runtime.activeCategory;
        tab.classList.toggle("active", isActive);
      });
      renderConsonantSubgroupTabs();
      filtered = canonicalLetters.filter(function includeTargetCategory(letter) {
        return activityCategoryForLetter(letter) === runtime.activeCategory;
      });
    }

    ui.letterGrid.innerHTML = "";
    filtered.forEach(function renderLetterTile(letter) {
      const idx = canonicalLetters.findIndex(function findIndex(item) { return item.id === letter.id; });
      const button = document.createElement("button");
      button.type = "button";
      button.className = "letter-btn";
      button.setAttribute("data-letter-id", letter.id);
      button.innerHTML =
        '<span class="tile-star" aria-hidden="true">' +
        (progression.isLetterCompleted(activityId, idx) ? "⭐" : "☆") +
        '</span><span class="dev">' + letter.devanagari + '</span><span class="tran">' + letter.transliteration + "</span>";
      if (letter.id === target.id) button.classList.add("active");
      if (progression.isLetterCompleted(activityId, idx)) button.classList.add("learned");
      button.addEventListener("click", function onLetterTap() {
        runtime.currentLetter = letter;
        renderSharedLearningPanel(letter, idx, activityId);
        setMascotState("pointing");
        setMascotSpeech("Great choice. Listen carefully.");
        playPronunciation(letter, 1, ui.audioFallback);
        if (letter.id === target.id) {
          completeCurrentLetter("Lovely practice! Next is unlocked.");
        } else {
          setNavStatus("Now practise the current target letter: " + target.devanagari);
        }
        renderLetterGarden();
      });
      ui.letterGrid.appendChild(button);
    });

    if (ui.gardenCoverage) ui.gardenCoverage.textContent = "Target letter: " + target.devanagari;
  }

  function renderListenIdentify() {
    const target = runtime.currentLetter;
    if (!target || !ui.hearChoices) return;
    ui.hearChoices.innerHTML = "";
    if (ui.hearStatus) {
      ui.hearStatus.textContent = runtime.interactionCompleted
        ? "Correct answer completed."
        : "Listen and choose the correct letter.";
    }

    const options = buildLetterOptions(canonicalLetters.indexOf(target), 4);
    options.forEach(function renderOption(option) {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "choice-btn";
      button.textContent = option.devanagari;
      button.addEventListener("click", function onChoice() {
        if (option.id === target.id) {
          button.classList.add("correct");
          completeCurrentLetter("Correct! Next is unlocked.");
          setMascotState("celebrating");
          setMascotSpeech("Wonderful listening.");
          if (ui.hearStatus) ui.hearStatus.textContent = "Correct!";
        } else {
          button.classList.add("wrong");
          if (ui.hearStatus) ui.hearStatus.textContent = "Try again. Play the sound once more.";
          setMascotState("listening");
          setMascotSpeech("Nice try. Listen once more.");
        }
      });
      ui.hearChoices.appendChild(button);
    });

    if (ui.playHearPrompt) {
      ui.playHearPrompt.onclick = function onPlayPrompt() {
        playPronunciation(target, 1, ui.hearStatus);
      };
    }
  }

  function renderLetterTracing() {
    const target = runtime.currentLetter;
    if (!target) return;
    if (ui.traceTargetLetter) ui.traceTargetLetter.textContent = target.devanagari;
    if (ui.traceStatus && !runtime.interactionCompleted) {
      ui.traceStatus.textContent = "Trace the target letter and press Check tracing.";
    }
    if (!runtime.interactionCompleted) clearTraceCanvas();
  }

  function renderLetterMatching() {
    const target = runtime.currentLetter;
    if (!target || !ui.pictureChoices) return;
    ui.picturePrompt.textContent = "Match " + target.devanagari + " with the correct transliteration.";
    ui.pictureChoices.innerHTML = "";
    ui.pictureStatus.textContent = runtime.interactionCompleted ? "Match completed." : "Select the correct transliteration.";

    const letterOptions = buildLetterOptions(canonicalLetters.indexOf(target), 4);
    const transliterationOptions = letterOptions.map(function mapTran(letter) { return letter.transliteration; });
    if (transliterationOptions.indexOf(target.transliteration) === -1) {
      transliterationOptions[0] = target.transliteration;
    }
    shuffleInPlace(transliterationOptions);

    transliterationOptions.forEach(function renderTran(option) {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "choice-btn";
      button.textContent = option;
      button.addEventListener("click", function onMatch() {
        if (option === target.transliteration) {
          button.classList.add("correct");
          completeCurrentLetter("Correct match! Next is unlocked.");
          setMascotState("celebrating");
          if (ui.pictureStatus) ui.pictureStatus.textContent = "Correct match!";
        } else {
          button.classList.add("wrong");
          if (ui.pictureStatus) ui.pictureStatus.textContent = "Not yet. Try again.";
        }
      });
      ui.pictureChoices.appendChild(button);
    });
  }

  function renderLetterHunt() {
    const target = runtime.currentLetter;
    if (!target || !ui.huntGrid) return;
    ui.huntPrompt.textContent = "Find and tap " + target.devanagari + ".";
    ui.huntStatus.textContent = runtime.interactionCompleted ? "Found! Next is unlocked." : "Find the target letter.";
    ui.huntGrid.innerHTML = "";

    const options = buildLetterOptions(canonicalLetters.indexOf(target), 8);
    if (!options.some(function includesTarget(letter) { return letter.id === target.id; })) {
      options[0] = target;
    }
    shuffleInPlace(options);

    options.forEach(function renderHuntCell(letter) {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "tile-btn";
      button.textContent = letter.devanagari;
      button.addEventListener("click", function onHuntPick() {
        if (letter.id === target.id) {
          button.classList.add("correct");
          completeCurrentLetter("Great find! Next is unlocked.");
          if (ui.huntStatus) ui.huntStatus.textContent = "You found it!";
          setMascotState("celebrating");
        } else {
          button.classList.add("wrong");
          if (ui.huntStatus) ui.huntStatus.textContent = "Keep searching for " + target.devanagari + ".";
        }
      });
      ui.huntGrid.appendChild(button);
    });
  }

  function completeCurrentLetter(message) {
    const activityId = progression.getCurrentActivityId();
    progression.completeCurrentLetter(activityId);
    runtime.retryLockKey = null;
    runtime.interactionCompleted = true;
    setNavStatus(message);
    setMascotState("correct");
    setMascotSpeech("Great work! You can move to the next letter.");
    if (window.spSuccessTone) window.spSuccessTone();
    renderProgressSummary();
    updateNavigationButtons();
  }

  function movePreviousLetter() {
    const activityId = progression.getCurrentActivityId();
    if (activityId === "magical-tree") {
      const current = progression.getCurrentLetterIndex(activityId);
      const currentGroup = Math.floor(current / TREE_GROUP_SIZE);
      if (currentGroup > 0) jumpToTreeGroup(currentGroup - 1);
      return;
    }
    progression.goToPreviousLetter(activityId);
    runtime.retryLockKey = null;
    renderCurrentActivity();
  }

  function moveNextLetter() {
    const activityId = progression.getCurrentActivityId();
    if (activityId === "magical-tree") {
      const current = progression.getCurrentLetterIndex(activityId);
      const currentGroup = Math.floor(current / TREE_GROUP_SIZE);
      const maxGroup = Math.floor((canonicalLetters.length - 1) / TREE_GROUP_SIZE);
      if (currentGroup < maxGroup) jumpToTreeGroup(currentGroup + 1);
      return;
    }
    if (!runtime.interactionCompleted) return;
    progression.goToNextLetter(activityId);
    runtime.retryLockKey = null;
    renderCurrentActivity();
  }

  function updateNavigationButtons() {
    const activityId = progression.getCurrentActivityId();
    const controls = createLocalNav(activityId);
    if (!controls) return;
    const letterIndex = progression.getCurrentLetterIndex(activityId);
    const isLastLetter = letterIndex === canonicalLetters.length - 1;
    const activityProgress = progression.getActivityProgress(activityId);
    const activityCompleted = activityProgress.isCompleted;
    const isLastActivity = progression.getSnapshot().state.currentActivityIndex >= ACTIVITY_SEQUENCE.length - 1;

    if (activityId === "magical-tree") {
      const group = Math.floor(letterIndex / TREE_GROUP_SIZE);
      const maxGroup = Math.floor((canonicalLetters.length - 1) / TREE_GROUP_SIZE);
      controls.previous.hidden = true;
      controls.next.hidden = true;
      controls.previous.disabled = group === 0;
      controls.next.disabled = group >= maxGroup;
      controls.finish.hidden = !activityCompleted;
      controls.finish.disabled = false;
    } else {
      controls.previous.hidden = false;
      controls.previous.disabled = letterIndex === 0;
      controls.next.hidden = false;
      controls.next.hidden = isLastLetter;
      controls.next.disabled = !runtime.interactionCompleted;
      controls.finish.hidden = !isLastLetter || activityCompleted;
      controls.finish.disabled = !runtime.interactionCompleted;
    }
    controls.nextActivity.hidden = !(activityCompleted && !isLastActivity);
    controls.nextActivity.disabled = !activityCompleted || isLastActivity;
    controls.reset.hidden = !activityCompleted;
    controls.reset.disabled = !activityCompleted;
  }

  function renderProgressSummary() {
    const snapshot = progression.getSnapshot();
    const completedActivities = ACTIVITY_SEQUENCE.filter(function countCompleted(activity) {
      return snapshot.state.activities[activity.id].completedAtLeastOnce;
    }).length;
    const totalSteps = ACTIVITY_SEQUENCE.length * canonicalLetters.length;
    const completedSteps = ACTIVITY_SEQUENCE.reduce(function sum(acc, activity) {
      return acc + snapshot.state.activities[activity.id].completedLetters.length;
    }, 0);

    if (ui.doneCount) ui.doneCount.textContent = String(completedActivities);
    if (ui.starCount) ui.starCount.textContent = String(snapshot.state.xp);
    if (ui.streakCount) ui.streakCount.textContent = String(completedActivities);
    if (ui.progressFill) ui.progressFill.style.width = (completedSteps / totalSteps * 100).toFixed(1) + "%";
    if (ui.progressText) {
      ui.progressText.textContent = completedSteps + " of " + totalSteps + " learning steps completed.";
    }
    renderGlobalSummary();

    if (snapshot.state.worldCompleted) {
      showWorldCompletion();
    }
  }

  function showWorldCompletion() {
    if (ui.doneBanner) ui.doneBanner.classList.add("show");
    if (ui.completionScreen) ui.completionScreen.classList.add("show");
    if (ui.completionStars) ui.completionStars.textContent = String(progression.getSnapshot().state.xp);
    if (ui.nextLessonTopBtn) {
      ui.nextLessonTopBtn.disabled = false;
      ui.nextLessonTopBtn.textContent = "Next Lesson / World";
    }
    if (ui.nextLessonBtn) ui.nextLessonBtn.style.display = "inline-block";
    setMascotState("dancing");
    setMascotSpeech("Alphabet Forest complete! Ready for the next world.");
    fireConfetti(160);
    if (window.spApplause) window.spApplause();
    setNavStatus("Alphabet Forest complete! Next Lesson / World unlocked.");
  }

  function fireConfetti(particleCount) {
    if (window.SP_STATE.muted) return;
    if (typeof window.confetti !== "function") return;
    window.confetti({
      particleCount: particleCount,
      spread: 80,
      startVelocity: 28,
      origin: { y: 0.68 }
    });
  }

  function setNavStatus(message) {
    const activityId = progression.getCurrentActivityId();
    const controls = createLocalNav(activityId);
    if (controls && controls.status) controls.status.textContent = message;
  }

  function setMascotSpeech(message) {
    if (ui.lessonMascotSpeech) ui.lessonMascotSpeech.textContent = message;
  }

  function setMascotState(kind) {
    if (!ui.lessonMascot) return;
    const parts = {
      body: ui.lessonMascot.querySelector(".mithu-body"),
      wingLeft: ui.lessonMascot.querySelector(".mithu-wing-left"),
      wingRight: ui.lessonMascot.querySelector(".mithu-wing-right")
    };
    if (!parts.body) return;

    if (kind === "pointing") {
      animate(parts.wingRight, { transform: ["rotate(0deg)", "rotate(24deg)", "rotate(0deg)"] }, { duration: 0.6, easing: "ease-in-out" });
      return;
    }
    if (kind === "listening") {
      animate(parts.body, { transform: ["rotate(0deg)", "rotate(2deg)", "rotate(0deg)"] }, { duration: 0.6, easing: "ease-in-out" });
      return;
    }
    if (kind === "encouraging") {
      animate(parts.body, { transform: ["translateY(0px)", "translateY(-3px)", "translateY(0px)"] }, { duration: 0.5, easing: "ease-out" });
      return;
    }
    if (kind === "correct" || kind === "celebrating") {
      animate([parts.wingLeft, parts.wingRight], { transform: ["rotate(0deg)", "rotate(22deg)", "rotate(0deg)"] }, { duration: 0.45, repeat: 1, easing: "ease-in-out" });
      return;
    }
    if (kind === "dancing") {
      animate(parts.body, { transform: ["translateY(0px)", "translateY(-8px)", "translateY(0px)"] }, { duration: 0.5, repeat: 3, easing: "ease-in-out" });
      animate([parts.wingLeft, parts.wingRight], { transform: ["rotate(0deg)", "rotate(28deg)", "rotate(0deg)"] }, { duration: 0.4, repeat: 3, easing: "ease-in-out" });
    }
  }

  function setupMascotCompanion() {
    if (!ui.lessonMascot) return;
    const sections = [
      document.getElementById("forestScene"),
      document.getElementById("letterGardenSection"),
      document.getElementById("activityHearGamePanel"),
      document.getElementById("activityTraceGamePanel"),
      document.getElementById("activityPictureGamePanel"),
      document.getElementById("activityHuntGamePanel")
    ].filter(Boolean);

    function updateLayoutMode() {
      const isMobile = window.matchMedia("(max-width: 860px)").matches;
      ui.lessonMascot.classList.toggle("lesson-mascot-mobile", isMobile);
      if (isMobile) {
        ui.lessonMascot.classList.remove("lesson-mascot-floating");
        ui.lessonMascot.style.top = "";
        return;
      }
      ui.lessonMascot.classList.add("lesson-mascot-floating");
    }

    function positionNearSection(section) {
      if (!section || window.matchMedia("(max-width: 860px)").matches) return;
      const rect = section.getBoundingClientRect();
      const top = Math.max(92, Math.min(window.innerHeight - 280, rect.top + rect.height * 0.18));
      ui.lessonMascot.style.top = top.toFixed(0) + "px";
    }

    const observer = new IntersectionObserver(function onIntersect(entries) {
      const visible = entries
        .filter(function onlyVisible(entry) { return entry.isIntersecting; })
        .sort(function byRatio(a, b) { return b.intersectionRatio - a.intersectionRatio; });
      if (!visible.length) return;
      positionNearSection(visible[0].target);
    }, { threshold: [0.2, 0.45, 0.7] });
    sections.forEach(function observe(section) { observer.observe(section); });

    updateLayoutMode();
    window.addEventListener("resize", updateLayoutMode);

    if (!prefersReducedMotion) {
      animate(
        ui.lessonMascot,
        {
          transform: [
            "translateX(-260px) translateY(-24px) scale(0.92)",
            "translateX(0px) translateY(0px) scale(1)"
          ],
          opacity: [0.35, 1]
        },
        { duration: 0.9, easing: "ease-out" }
      );
    }
    setMascotState("listening");
    setMascotSpeech("Namaste! I am Mitthu. Scroll and I will learn with you.");
  }

  function playPronunciation(letter, rate, feedbackEl) {
    if (!letter) return;
    if (window.SP_STATE.muted) {
      if (feedbackEl) feedbackEl.textContent = "Sound is muted. Tap Sound: Off to unmute.";
      return;
    }
    if (runtime.currentAudio) {
      runtime.currentAudio.pause();
      runtime.currentAudio = null;
    }
    const source = letter.localPath;
    if (!source) {
      if (feedbackEl) feedbackEl.textContent = "Pronunciation not available yet.";
      return;
    }
    const audio = new Audio(source + "?v=20261110j");
    audio.preload = "auto";
    audio.playbackRate = rate || 1;
    runtime.currentAudio = audio;
    audio.addEventListener("error", function onError() {
      if (feedbackEl) feedbackEl.textContent = "Pronunciation not available yet.";
    }, { once: true });
    audio.play().then(function onPlay() {
      if (feedbackEl) feedbackEl.textContent = "";
    }).catch(function onPlayError() {
      if (feedbackEl) feedbackEl.textContent = "Pronunciation not available yet.";
    });
  }

  function buildLetterOptions(targetIndex, count) {
    const target = canonicalLetters[targetIndex];
    const options = [target];
    let offset = 1;
    while (options.length < count) {
      const idx = (targetIndex + offset + runtime.gameSeed) % canonicalLetters.length;
      const candidate = canonicalLetters[idx];
      if (candidate && !options.some(function hasCandidate(item) { return item.id === candidate.id; })) {
        options.push(candidate);
      }
      offset += 5;
    }
    runtime.gameSeed += 1;
    shuffleInPlace(options);
    return options;
  }

  function shuffleInPlace(items) {
    for (let index = items.length - 1; index > 0; index -= 1) {
      const randomIndex = Math.floor(Math.random() * (index + 1));
      const temp = items[index];
      items[index] = items[randomIndex];
      items[randomIndex] = temp;
    }
  }

  function pickExampleArt(symbol) {
    const map = {
      "अ": "🔥", "आ": "💧", "इ": "☀️", "ई": "✨", "उ": "🌊", "ऊ": "🪷", "ऋ": "📜", "ॠ": "📖", "ऌ": "🌱",
      "क": "🖐️", "ख": "🍃", "ग": "🐘", "घ": "☁️", "च": "🧺", "ज": "🐐", "ट": "🧵", "त": "🪔", "प": "🍎",
      "म": "🧠", "य": "🌼", "र": "🚩", "ल": "💧", "व": "🌳", "श": "🏹", "ष": "6️⃣", "स": "🌊", "ह": "🐎"
    };
    return map[symbol] || "🌟";
  }

  function renderAudioDebug() {
    if (!ui.audioDebug || !window.spGetAudioDebug) return;
    const details = window.spGetAudioDebug();
    ui.audioDebug.textContent =
      "Audio check: speech support = " + (details.speechSupported ? "yes" : "no") +
      ", voices detected = " + details.voiceCount +
      ", preferred voice = " + details.bestVoice +
      ", muted = " + (details.muted ? "yes" : "no") + ".";
  }
})();
