(function initAlphabetForestV4() {
  const AUDIO_ENABLED = false;
  const WRITING_VALIDATION_AVAILABLE = false;
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
    { id: "letter-tracing", title: "Write It Yourself!", sectionId: "activityTraceGamePanel", controlsId: "controls-letter-tracing", type: "tracing" },
    { id: "hidden-letter-hunt", title: "Hidden Letter Hunt", sectionId: "activityHuntGamePanel", controlsId: "controls-hidden-letter-hunt", type: "quiz" }
  ];
  const LEARNING_ACTIVITY_IDS = ["magical-tree", "letter-garden"];
  const PRACTICE_ACTIVITY_IDS = ACTIVITIES
    .map(function (activity) { return activity.id; })
    .filter(function (activityId) { return !LEARNING_ACTIVITY_IDS.includes(activityId); });
  const NEXT_WORLD_UNLOCK_KEY = "next-world-unlock-v1";
  const ACTIVITY_IDS = ACTIVITIES.map(function mapId(activity) { return activity.id; });
  const ACTIVITY_META = Object.fromEntries(ACTIVITIES.map(function mapMeta(activity) { return [activity.id, activity]; }));
  const ACTIVITY_SPEECH = {
    "magical-tree": "Let's discover magical letters!",
    "letter-garden": "Choose a letter and explore!",
    "hear-and-pick": "Listen carefully and choose the letter!",
    "picture-match": "Can you find the matching picture?",
    "arrange-word": "Build the Sanskrit word in order!",
    "flashcard-flip": "Can you remember what this means?",
    "feed-mithu": "Can you find my favourite fruit?",
    "letter-tracing": "Let's practise writing Sanskrit!",
    "hidden-letter-hunt": "Can you spot the hidden letter?"
  };
  const LETTER_ACTIVITY_IDS = new Set([
    "magical-tree",
    "letter-garden",
    "hear-and-pick",
    "arrange-word",
    "hidden-letter-hunt",
    "letter-tracing"
  ]);
  const LETTER_GARDEN_SUBGROUPS = [
    { id: "ka-varga", label: "क-वर्ग" },
    { id: "ca-varga", label: "च-वर्ग" },
    { id: "tta-varga", label: "ट-वर्ग" },
    { id: "ta-varga", label: "त-वर्ग" },
    { id: "pa-varga", label: "प-वर्ग" },
    { id: "antastha", label: "अन्तःस्थ" },
    { id: "ushmana", label: "ऊष्म" }
  ];

  const letters = window.SP_PDF_LETTER_INVENTORY.items
    .slice(0, LETTER_COUNT)
    .map(function mapLetter(item, index) {
      const example = item.example || {};
      const localAudioPath = item.pronunciation && item.pronunciation.localPath
        ? item.pronunciation.localPath.replace(/\.mp3$/i, ".wav")
        : "";
      return {
        id: item.id || ("l-" + index),
        index: index,
        symbol: item.symbol || "",
        transliteration: item.transliteration || "",
        category: item.category || "consonant",
        subgroup: item.subgroup || "other",
        exampleText: example.sanskrit || item.symbol || "",
        meaning: example.meaning || "Meaning pending review",
        audioPath: localAudioPath
      };
    })
    .filter(function hasSymbol(letter) { return Boolean(letter.symbol); });

  const pictureQuestions = letters
    .filter(function (letter) {
      const vocab = VOCAB.words[letter.exampleText];
      return Boolean(vocab && vocab.image);
    })
    .slice(0, 18)
    .map(function (letter) {
      const vocab = VOCAB.words[letter.exampleText];
      return {
        id: letter.id,
        sanskrit: letter.exampleText,
        transliteration: vocab.transliteration || letter.transliteration,
        meaning: vocab.meaning || letter.meaning,
        image: vocab.image,
        alt: vocab.alt || (vocab.meaning || letter.meaning)
      };
    });

  const flashcardQuestions = pictureQuestions.slice(0, 18);

  const feedMithuQuestions = [
    { sanskrit: "आम्रम्", transliteration: "aamram", meaning: "mango", image: "assets/illustrations/fruits/mango.svg", alt: "Mango fruit illustration" },
    { sanskrit: "कदलीफलम्", transliteration: "kadalee-phalam", meaning: "banana", image: "assets/illustrations/fruits/banana.svg", alt: "Banana fruit illustration" },
    { sanskrit: "सेवफलम्", transliteration: "sevaphalam", meaning: "apple", image: "assets/illustrations/fruits/apple.svg", alt: "Apple fruit illustration" },
    { sanskrit: "द्राक्षा", transliteration: "draakshaa", meaning: "grapes", image: "assets/illustrations/fruits/grapes.svg", alt: "Grapes illustration" },
    { sanskrit: "नारङ्गफलम्", transliteration: "naaranga-phalam", meaning: "orange", image: "assets/illustrations/fruits/orange.svg", alt: "Orange fruit illustration" },
    { sanskrit: "दाडिमम्", transliteration: "daadimam", meaning: "pomegranate", image: "assets/illustrations/fruits/pomegranate.svg", alt: "Pomegranate fruit illustration" },
    { sanskrit: "अननसम्", transliteration: "ananasam", meaning: "pineapple", image: "assets/illustrations/fruits/pineapple.svg", alt: "Pineapple fruit illustration" },
    { sanskrit: "नारिकेलम्", transliteration: "naarikelam", meaning: "coconut", image: "assets/illustrations/fruits/coconut.svg", alt: "Coconut fruit illustration" },
    { sanskrit: "कलिङ्गम्", transliteration: "kalingam", meaning: "watermelon", image: "assets/illustrations/fruits/watermelon.svg", alt: "Watermelon illustration" },
    { sanskrit: "खर्जूरम्", transliteration: "kharjooram", meaning: "date fruit", image: "assets/illustrations/fruits/date.svg", alt: "Date fruit illustration" },
    { sanskrit: "जाम्बूफलम्", transliteration: "jaamboo-phalam", meaning: "guava", image: "assets/illustrations/fruits/guava.svg", alt: "Guava fruit illustration" },
    { sanskrit: "कपित्थम्", transliteration: "kapittham", meaning: "wood apple", image: "assets/illustrations/fruits/wood-apple.svg", alt: "Wood apple illustration" },
    { sanskrit: "पपीतकम्", transliteration: "papeetakam", meaning: "papaya", image: "assets/illustrations/fruits/papaya.svg", alt: "Papaya fruit illustration" },
    { sanskrit: "नाशपाती", transliteration: "naashapaatee", meaning: "pear", image: "assets/illustrations/fruits/pear.svg", alt: "Pear fruit illustration" },
    { sanskrit: "आडुफलम्", transliteration: "aadu-phalam", meaning: "peach", image: "assets/illustrations/fruits/peach.svg", alt: "Peach fruit illustration" },
    { sanskrit: "आलूबुखारफलम्", transliteration: "aalubukhaara-phalam", meaning: "plum", image: "assets/illustrations/fruits/plum.svg", alt: "Plum fruit illustration" }
  ];

  const ui = {
    jumpNav: document.getElementById("activityJumpNav"),
    muteToggle: document.getElementById("muteToggle"),
    testSoundBtn: document.getElementById("testSoundBtn"),
    audioDisclaimer: document.getElementById("audioDisclaimer"),
    lessonMascot: document.getElementById("lessonMascot"),
    lessonMascotSpeech: document.getElementById("lessonMascotSpeech"),
    globalSummary: document.getElementById("globalProgressSummary"),
    learningProgressText: document.getElementById("learningProgressText"),
    practiceProgressText: document.getElementById("practiceProgressText"),
    learningProgressFill: document.getElementById("learningProgressFill"),
    practiceProgressFill: document.getElementById("practiceProgressFill"),
    nextWorldStatus: document.getElementById("nextWorldStatus"),
    unlockHintText: document.getElementById("unlockHintText"),
    globalStars: document.getElementById("globalStars"),
    treeLetters: document.getElementById("magicalTreeLetters"),
    treeSparkleLottie: document.getElementById("treeSparkleLottie"),
    treeCelebrationLottie: document.getElementById("treeCelebrationLottie"),
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
    pictureLottie: document.getElementById("pictureMatchLottie"),
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
    feedPrompt: document.getElementById("feedPrompt"),
    feedChoices: document.getElementById("feedChoices"),
    feedStatus: document.getElementById("feedStatus"),
    traceCanvas: document.getElementById("traceCanvas"),
    traceTargetLetter: document.getElementById("traceTargetLetter"),
    traceStatus: document.getElementById("traceStatus"),
    clearTraceBtn: document.getElementById("clearTraceBtn"),
    checkTraceBtn: document.getElementById("checkTraceBtn"),
    huntPrompt: document.getElementById("huntPrompt"),
    huntGrid: document.getElementById("huntGrid"),
    huntStatus: document.getElementById("huntStatus"),
    completionCanvas: document.getElementById("celebration-canvas"),
    completionScreen: document.getElementById("completionScreen"),
    completionStars: document.getElementById("completionStars"),
    completionTitle: document.getElementById("completionTitle"),
    completionMessage: document.getElementById("completionMessage"),
    completionNextBtn: document.getElementById("completionNextBtn")
  };

  const stateApi = CORE.createStateApi(window.localStorage, letters.length);
  const forestState = stateApi.loadState();
  stateApi.saveState(forestState);

  const runtime = {
    muted: false,
    currentAudio: null,
    sfxContext: null,
    confetti: null,
    lottie: {},
    mascotActiveSection: null,
    mascotPinnedActivity: null,
    mascotPinnedUntil: 0,
    mascotStateTimeout: null,
    autoAdvance: {},
    treeGroupAdvanceTimer: null,
    tracing: {
      drawing: false,
      points: [],
      reviewed: false,
      lastLetterIndex: -1
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
  normalizeActivityOrders();

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
  initLottieAnimations();
  initActivityControls();
  initCompletionActions();
  renderAll();

  function getActivityItemCount(activityId) {
    if (activityId === "picture-match") return pictureQuestions.length;
    if (activityId === "flashcard-flip") return flashcardQuestions.length;
    if (activityId === "feed-mithu") return feedMithuQuestions.length;
    return letters.length;
  }

  function normalizeActivityOrders() {
    ACTIVITY_IDS.forEach(function (activityId) {
      const state = forestState.activities[activityId];
      if (!state) return;
      const itemCount = getActivityItemCount(activityId);
      if (!Array.isArray(state.order) || state.order.length !== itemCount) {
        state.order = Array.from({ length: itemCount }, function (_, index) { return index; });
      }
      state.currentIndex = Math.max(0, Math.min(state.currentIndex || 0, itemCount - 1));
      state.completedItems = (Array.isArray(state.completedItems) ? state.completedItems : [])
        .filter(function (value, index, arr) {
          return Number.isFinite(value) && value >= 0 && value < itemCount && arr.indexOf(value) === index;
        })
        .sort(function (a, b) { return a - b; });
      state.isComplete = Boolean(state.isComplete) && state.completedItems.length >= itemCount;
      if (!state.answers || typeof state.answers !== "object") state.answers = {};
      if (!state.attempts || typeof state.attempts !== "object") state.attempts = {};
    });
  }

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
        : "Pronunciation is unavailable until verified Sanskrit audio is approved.";
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
    if (!AUDIO_ENABLED) {
      if (feedbackEl) feedbackEl.textContent = "Pronunciation is unavailable until verified Sanskrit audio is approved.";
      return;
    }
    if (runtime.muted || !letter) return;
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
      updateMascotSpeechForActivity(runtime.mascotActiveSection);
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
        const activity = ACTIVITIES.find(function (entry) { return entry.sectionId === target.id; });
        if (activity) {
          runtime.mascotPinnedActivity = activity.id;
          runtime.mascotPinnedUntil = Date.now() + 1400;
          runtime.mascotActiveSection = activity.id;
          moveMascotNearSection(target);
          updateMascotSpeechForActivity(activity.id);
          setMascotStateForDuration("flying", 320);
        }
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

  function setMascotStateForDuration(stateName, durationMs) {
    setMascotState(stateName);
    if (runtime.mascotStateTimeout) window.clearTimeout(runtime.mascotStateTimeout);
    runtime.mascotStateTimeout = window.setTimeout(function () {
      setMascotState("idle");
      updateMascotSpeechForActivity(runtime.mascotActiveSection);
      runtime.mascotStateTimeout = null;
    }, durationMs);
  }

  function setMascotSpeech(text) {
    if (ui.lessonMascotSpeech) ui.lessonMascotSpeech.textContent = text;
  }

  function updateMascotSpeechForActivity(activityId) {
    setMascotSpeech(ACTIVITY_SPEECH[activityId] || "Let's keep learning Sanskrit together!");
  }

  function initMascotCompanion() {
    if (!ui.lessonMascot) return;
    setMascotState("idle");
    updateMascotSpeechForActivity("magical-tree");
    const sections = ACTIVITIES.map(function (a) { return document.getElementById(a.sectionId); }).filter(Boolean);
    let scrollTicking = false;
    function applyActiveSection(section) {
      const activity = ACTIVITIES.find(function (item) { return item.sectionId === section.id; });
      if (!activity || runtime.mascotActiveSection === activity.id) return;
      if (runtime.mascotPinnedActivity && Date.now() < runtime.mascotPinnedUntil && activity.id !== runtime.mascotPinnedActivity) return;
      runtime.mascotActiveSection = activity.id;
      if (runtime.mascotPinnedActivity === activity.id && Date.now() >= runtime.mascotPinnedUntil) {
        runtime.mascotPinnedActivity = null;
      }
      moveMascotNearSection(section);
      updateMascotSpeechForActivity(activity.id);
      setMascotStateForDuration("flying", 380);
    }
    function updateActiveSection() {
      if (runtime.mascotPinnedActivity && Date.now() >= runtime.mascotPinnedUntil) {
        runtime.mascotPinnedActivity = null;
      }
      let best = null;
      let bestScore = -Infinity;
      const anchorY = window.innerHeight * 0.32;
      sections.forEach(function (section) {
        const rect = section.getBoundingClientRect();
        if (rect.bottom < 0 || rect.top > window.innerHeight) return;
        let score;
        if (rect.top <= anchorY && rect.bottom >= anchorY) {
          score = 10000 - Math.abs(anchorY - rect.top);
        } else {
          const sectionMid = rect.top + rect.height * 0.5;
          score = -Math.abs(sectionMid - anchorY);
        }
        if (score > bestScore) {
          bestScore = score;
          best = section;
        }
      });
      if (!best) return;
      applyActiveSection(best);
    }
    if (typeof IntersectionObserver === "function") {
      const observer = new IntersectionObserver(function () {
        updateActiveSection();
      }, { threshold: [0.25, 0.55], rootMargin: "-10% 0px -25% 0px" });
      sections.forEach(function (section) { observer.observe(section); });
    }
    window.addEventListener("scroll", function () {
      if (scrollTicking) return;
      scrollTicking = true;
      window.requestAnimationFrame(function () {
        updateActiveSection();
        scrollTicking = false;
      });
    }, { passive: true });
    window.addEventListener("resize", function () {
      if (!runtime.mascotActiveSection) return;
      const sectionId = ACTIVITY_META[runtime.mascotActiveSection].sectionId;
      const section = document.getElementById(sectionId);
      if (section) moveMascotNearSection(section);
    });
    updateActiveSection();
  }

  function moveMascotNearSection(section) {
    if (!ui.lessonMascot || !section) return;
    const mobile = window.matchMedia("(max-width: 860px)").matches;
    ui.lessonMascot.classList.toggle("lesson-mascot-mobile", mobile);
    if (mobile) {
      ui.lessonMascot.style.top = "82px";
      ui.lessonMascot.style.right = "8px";
      return;
    }
    const rect = section.getBoundingClientRect();
    const targetTop = Math.max(88, Math.min(window.innerHeight - 250, rect.top + rect.height * 0.2));
    ui.lessonMascot.style.top = targetTop.toFixed(0) + "px";
  }

  function initTreeControls() {
    if (ui.prevTreeGroupBtn) {
      ui.prevTreeGroupBtn.addEventListener("click", function () {
        if (runtime.treeGroupAdvanceTimer) {
          window.clearTimeout(runtime.treeGroupAdvanceTimer);
          runtime.treeGroupAdvanceTimer = null;
        }
        const activity = forestState.activities["magical-tree"];
        const currentGroup = Math.floor(activity.currentIndex / TREE_GROUP_SIZE);
        if (currentGroup <= 0) return;
        activity.currentIndex = (currentGroup - 1) * TREE_GROUP_SIZE;
        setActivityStatus("magical-tree", "");
        saveAndRender();
      });
    }
    if (ui.nextTreeGroupBtn) {
      ui.nextTreeGroupBtn.addEventListener("click", function () {
        if (runtime.treeGroupAdvanceTimer) {
          window.clearTimeout(runtime.treeGroupAdvanceTimer);
          runtime.treeGroupAdvanceTimer = null;
        }
        const activity = forestState.activities["magical-tree"];
        const currentGroup = Math.floor(activity.currentIndex / TREE_GROUP_SIZE);
        const nextStart = (currentGroup + 1) * TREE_GROUP_SIZE;
        if (nextStart >= letters.length) return;
        activity.currentIndex = nextStart;
        setActivityStatus("magical-tree", "");
        saveAndRender();
      });
    }
    if (ui.playTreeAgainBtn) {
      ui.playTreeAgainBtn.addEventListener("click", function () {
        if (runtime.treeGroupAdvanceTimer) {
          window.clearTimeout(runtime.treeGroupAdvanceTimer);
          runtime.treeGroupAdvanceTimer = null;
        }
        if (!forestState.activities["magical-tree"].isComplete) return;
        const ok = window.confirm("Play Magical Tree again from the first group?");
        if (!ok) return;
        const treeState = forestState.activities["magical-tree"];
        treeState.currentIndex = 0;
        treeState.completedItems = [];
        treeState.answers = {};
        treeState.attempts = {};
        treeState.isComplete = false;
        const bloomContainer = document.getElementById("treeProgressBlooms");
        if (bloomContainer) bloomContainer.innerHTML = "";
        setActivityStatus("magical-tree", "");
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
        if (category === "vowels") {
          state.currentIndex = findFirstLetterIndex(function (letter) { return letter.category !== "consonant"; });
        } else {
          const currentView = getLetterGardenViewForIndex(state.currentIndex);
          const subgroup = currentView.category === "consonants" ? currentView.subgroup : "ka-varga";
          state.currentIndex = findFirstLetterIndex(function (letter) {
            return letter.category === "consonant" && (letter.subgroup || "other") === subgroup;
          });
        }
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
          setMascotSpeech("Good try! Let's try again!");
        }
      });
    }
    if (ui.resetArrange) ui.resetArrange.addEventListener("click", function () { dispatchActivityAction("arrange-word", "retry"); });
  }

  function initFlashControls() {
    if (!ui.flashcard) return;
    function toggleFlip() {
      runtime.byActivity["flashcard-flip"].flipped = !runtime.byActivity["flashcard-flip"].flipped;
      renderFlashcardFlip();
    }
    ui.flashcard.addEventListener("click", toggleFlip);
    ui.flashcard.addEventListener("keydown", function (event) {
      if (event.key !== "Enter" && event.key !== " ") return;
      event.preventDefault();
      toggleFlip();
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

    if (ui.clearTraceBtn) ui.clearTraceBtn.addEventListener("click", function () {
      clearTraceBoard();
      if (ui.traceStatus) ui.traceStatus.textContent = "Canvas cleared. Write the letter again.";
    });
    if (ui.checkTraceBtn) {
      ui.checkTraceBtn.addEventListener("click", function () {
        const activityId = "letter-tracing";
        if (runtime.tracing.points.length < 2 && !traceCanvasHasInk()) {
          if (ui.traceStatus) ui.traceStatus.textContent = "Write the letter first, then tap Check.";
          return;
        }
        const activity = forestState.activities[activityId];
        const letter = activity ? getCurrentLetter(activityId) : null;
        const validation = validateTraceAgainstLetter(letter);
        if (!validation.available) {
          setMascotState("thinking");
          setMascotSpeech("We're preparing handwriting checking.");
          if (ui.traceStatus) {
            ui.traceStatus.textContent = "Automatic Sanskrit handwriting validation is coming soon. Keep practising this letter.";
          }
          return;
        }
        if (!validation.isCorrect) {
          incrementAttempt(activityId);
          setMascotState("encouraging");
          setMascotSpeech("Almost there! Try writing it again.");
          if (ui.traceStatus) ui.traceStatus.textContent = "Almost there! Try writing it again.";
          return;
        }
        const sourceIndex = activity ? activity.currentIndex : 0;
        const alreadyDone = activity ? activity.completedItems.includes(sourceIndex) : false;
        playSuccessSound("applause");
        setMascotStateForDuration("celebrating", 800);
        fireSectionConfetti("activityTraceGamePanel", true);
        markCurrentComplete(activityId, "Writing practised!");
        if (!alreadyDone) scheduleAutoAdvance(activityId, sourceIndex, 900);
      });
    }
  }

  function clearTraceBoard() {
    if (!ui.traceCanvas) return;
    const ctx = ui.traceCanvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, ui.traceCanvas.width, ui.traceCanvas.height);
    runtime.tracing.points = [];
    runtime.tracing.reviewed = false;
  }

  function traceCanvasHasInk() {
    if (!ui.traceCanvas) return false;
    const ctx = ui.traceCanvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return false;
    const data = ctx.getImageData(0, 0, ui.traceCanvas.width, ui.traceCanvas.height).data;
    for (let index = 3; index < data.length; index += 16) {
      if (data[index] > 8) return true;
    }
    return false;
  }

  function validateTraceAgainstLetter(letter) {
    if (!WRITING_VALIDATION_AVAILABLE || !letter) {
      return { available: false, isCorrect: false };
    }
    return { available: false, isCorrect: false };
  }

  function playSuccessSound(kind) {
    if (runtime.muted) return;
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    if (!runtime.sfxContext) runtime.sfxContext = new AudioCtx();
    const ctx = runtime.sfxContext;
    if (ctx.state === "suspended") ctx.resume();
    const now = ctx.currentTime;
    const notes = kind === "applause"
      ? [523.25, 659.25, 783.99, 1046.5]
      : [523.25, 659.25, 783.99];
    notes.forEach(function (frequency, idx) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "triangle";
      osc.frequency.value = frequency;
      gain.gain.setValueAtTime(0.001, now + idx * 0.08);
      gain.gain.exponentialRampToValueAtTime(0.12, now + idx * 0.08 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.19);
      osc.connect(gain).connect(ctx.destination);
      osc.start(now + idx * 0.08);
      osc.stop(now + idx * 0.08 + 0.2);
    });
  }

  function initConfetti() {
    if (!ui.completionCanvas || typeof window.confetti !== "function") return;
    runtime.confetti = window.confetti.create(ui.completionCanvas, { resize: true, useWorker: true });
  }

  function initLottieAnimations() {
    if (!window.lottie || typeof window.lottie.loadAnimation !== "function") return;
    const build = function (container, path, loop) {
      if (!container) return null;
      return window.lottie.loadAnimation({
        container: container,
        renderer: "svg",
        loop: Boolean(loop),
        autoplay: false,
        path: path
      });
    };
    runtime.lottie.treeSparkle = build(ui.treeSparkleLottie, "assets/lottie/sparkle.json", false);
    runtime.lottie.treeCelebrate = build(ui.treeCelebrationLottie, "assets/lottie/celebration.json", false);
    runtime.lottie.pictureGuide = build(ui.pictureLottie, "assets/lottie/butterfly.json", true);
    if (runtime.lottie.pictureGuide && !REDUCED_MOTION) {
      runtime.lottie.pictureGuide.play();
    }
  }

  function playLottie(name) {
    const player = runtime.lottie[name];
    if (!player || REDUCED_MOTION) return;
    player.stop();
    player.play();
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

  function fireSectionConfetti(sectionId, big) {
    if (!runtime.confetti || REDUCED_MOTION) return;
    const section = typeof sectionId === "string" ? document.getElementById(sectionId) : sectionId;
    if (!section) {
      fireConfetti(big);
      return;
    }
    const rect = section.getBoundingClientRect();
    const vw = Math.max(window.innerWidth || 1, 1);
    const vh = Math.max(window.innerHeight || 1, 1);
    const xs = [0.15, 0.35, 0.55, 0.75, 0.9];
    xs.forEach(function (ratio, idx) {
      const originX = Math.min(0.96, Math.max(0.04, (rect.left + rect.width * ratio) / vw));
      const originY = Math.min(0.94, Math.max(0.06, (rect.top + rect.height * (0.2 + (idx % 2) * 0.28)) / vh));
      runtime.confetti({
        particleCount: big ? 55 : 36,
        spread: big ? 95 : 70,
        startVelocity: big ? 34 : 26,
        gravity: 0.8,
        scalar: 0.95,
        colors: ["#ff77b7", "#ffc9e7", "#ffd866", "#9fe07d", "#8ecbff"],
        origin: { x: originX, y: originY }
      });
      runtime.confetti({
        particleCount: big ? 38 : 24,
        spread: big ? 70 : 54,
        startVelocity: big ? 30 : 20,
        gravity: 0.95,
        scalar: 1.05,
        shapes: ["circle"],
        colors: ["#ff93c8", "#ffb1d8", "#ffd5eb"],
        origin: { x: originX, y: originY }
      });
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
        '<button class="button primary" type="button" data-action="continue" hidden>Continue to Next Activity</button>' +
        '<button class="button ghost" type="button" data-action="restart">Restart Activity</button>' +
        "</div>" +
        '<p class="status" id="status-' + activity.id + '" aria-live="polite"></p>' +
        '<p class="activity-complete-note" id="complete-' + activity.id + '" tabindex="-1"></p>';
      mount.querySelector('[data-action="previous"]').addEventListener("click", function () { dispatchActivityAction(activity.id, "previous"); });
      mount.querySelector('[data-action="retry"]').addEventListener("click", function () { dispatchActivityAction(activity.id, "retry"); });
      mount.querySelector('[data-action="next"]').addEventListener("click", function () { dispatchActivityAction(activity.id, "next"); });
      mount.querySelector('[data-action="finish"]').addEventListener("click", function () { dispatchActivityAction(activity.id, "finish"); });
      mount.querySelector('[data-action="continue"]').addEventListener("click", function () { dispatchActivityAction(activity.id, "continue"); });
      mount.querySelector('[data-action="restart"]').addEventListener("click", function () { dispatchActivityAction(activity.id, "restart"); });
    });
  }

  function initCompletionActions() {
    if (!ui.completionNextBtn) return;
    ui.completionNextBtn.addEventListener("click", function () {
      window.location.href = "explore-worlds.html";
    });
  }

  function setActivityStatus(activityId, text) {
    runtime.byActivity[activityId].status = text;
  }

  function cancelAutoAdvance(activityId) {
    const timerId = runtime.autoAdvance[activityId];
    if (!timerId) return;
    window.clearTimeout(timerId);
    delete runtime.autoAdvance[activityId];
  }

  function scheduleAutoAdvance(activityId, sourceIndex, delayMs) {
    const activity = forestState.activities[activityId];
    if (!activity || activity.isComplete || ACTIVITY_META[activityId].type === "tree") return;
    const itemCount = getActivityItemCount(activityId);
    if (sourceIndex >= itemCount - 1) return;
    cancelAutoAdvance(activityId);
    runtime.autoAdvance[activityId] = window.setTimeout(function () {
      delete runtime.autoAdvance[activityId];
      const current = forestState.activities[activityId];
      if (!current || current.isComplete) return;
      if (current.currentIndex !== sourceIndex) return;
      if (!current.completedItems.includes(sourceIndex)) return;
      CORE.goNext(forestState, activityId);
      runtime.byActivity[activityId].tempAnswer = "";
      runtime.byActivity[activityId].flipped = false;
      if (activityId === "letter-tracing") clearTraceBoard();
      setActivityStatus(activityId, "");
      saveAndRender();
    }, delayMs || 900);
  }

  function incrementAttempt(activityId) {
    const activity = forestState.activities[activityId];
    const index = activity.currentIndex;
    activity.attempts[index] = (activity.attempts[index] || 0) + 1;
  }

  function getCurrentLetter(activityId) {
    const activity = forestState.activities[activityId];
    if (!activity) return letters[0];
    const idx = activity.order[Math.max(0, Math.min(activity.currentIndex, activity.order.length - 1))];
    return letters[idx];
  }

  function getCurrentQuestion(activityId) {
    const activity = forestState.activities[activityId];
    if (!activity) return null;
    const idx = activity.order[Math.max(0, Math.min(activity.currentIndex, activity.order.length - 1))];
    if (activityId === "picture-match") return pictureQuestions[idx] || null;
    if (activityId === "flashcard-flip") return flashcardQuestions[idx] || null;
    if (activityId === "feed-mithu") return feedMithuQuestions[idx] || null;
    return null;
  }

  function isCurrentResolved(activityId) {
    const activity = forestState.activities[activityId];
    return activity.completedItems.includes(activity.currentIndex);
  }

  function markCurrentComplete(activityId, message) {
    const activity = forestState.activities[activityId];
    if (!activity) return;
    cancelAutoAdvance(activityId);
    const sourceIndex = activity.currentIndex;
    const wasResolved = activity.completedItems.includes(sourceIndex);
    CORE.markCurrentItemCompleted(forestState, activityId, 1);
    setActivityStatus(activityId, message);
    if (activity && activity.completedItems.length >= activity.order.length && !activity.isComplete) {
      CORE.finalizeActivity(forestState, activityId);
    }
    if (ACTIVITY_META[activityId].type !== "tree") {
      if (activity.isComplete) {
        setMascotSpeech("Fantastic! You finished this adventure!");
        setMascotStateForDuration("dancing", 950);
        fireConfetti(true);
      } else {
        setMascotSpeech("Wonderful! Let's keep going!");
        setMascotStateForDuration("celebrating", 650);
        if (!wasResolved && ACTIVITY_META[activityId].type === "quiz") {
          scheduleAutoAdvance(activityId, sourceIndex, 900);
        }
      }
    }
    saveAndRender();
  }

  function dispatchActivityAction(activityId, action) {
    const activity = forestState.activities[activityId];
    if (!activity) return;
    cancelAutoAdvance(activityId);
    if (action === "previous") {
      CORE.goPrevious(forestState, activityId);
      if (activityId === "letter-tracing") clearTraceBoard();
      setActivityStatus(activityId, "");
      saveAndRender();
      return;
    }
    if (action === "next") {
      const itemCount = getActivityItemCount(activityId);
      if (!isCurrentResolved(activityId) || activity.currentIndex >= itemCount - 1) return;
      CORE.goNext(forestState, activityId);
      runtime.byActivity[activityId].tempAnswer = "";
      runtime.byActivity[activityId].flipped = false;
      if (activityId === "letter-tracing") {
        clearTraceBoard();
      }
      setActivityStatus(activityId, "");
      saveAndRender();
      return;
    }
    if (action === "retry") {
      CORE.retryCurrent(forestState, activityId);
      runtime.byActivity[activityId].tempAnswer = "";
      runtime.byActivity[activityId].flipped = false;
      if (activityId === "letter-tracing") {
        clearTraceBoard();
      }
      setActivityStatus(activityId, "");
      saveAndRender();
      return;
    }
    if (action === "finish") {
      if (!CORE.finalizeActivity(forestState, activityId)) {
        setActivityStatus(activityId, "Complete all questions first.");
        saveAndRender();
        return;
      }
      setActivityStatus(activityId, "Activity completed!");
      fireConfetti(false);
      setMascotStateForDuration("dancing", 900);
      setMascotSpeech("Fantastic! You finished this adventure!");
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
      runtime.byActivity[activityId].optionOrderByQuestion = {};
      if (activityId === "letter-tracing") {
        clearTraceBoard();
      }
      setActivityStatus(activityId, "");
      saveAndRender();
      return;
    }
    if (action === "continue") {
      const nextActivity = ACTIVITIES.find(function (entry) {
        return forestState.activities[entry.id] && !forestState.activities[entry.id].isComplete && entry.id !== activityId;
      });
      const targetId = nextActivity ? nextActivity.sectionId : "completionScreen";
      const target = document.getElementById(targetId);
      if (target) target.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }

  function saveAndRender() {
    stateApi.saveState(forestState);
    renderAll();
  }

  function computeJourneyProgress() {
    const learningCompletedCount = LEARNING_ACTIVITY_IDS.reduce(function (count, activityId) {
      return count + (forestState.activities[activityId] && forestState.activities[activityId].isComplete ? 1 : 0);
    }, 0);
    const practiceCompletedCount = PRACTICE_ACTIVITY_IDS.reduce(function (count, activityId) {
      return count + (forestState.activities[activityId] && forestState.activities[activityId].isComplete ? 1 : 0);
    }, 0);
    return {
      learningCompletedCount: learningCompletedCount,
      learningTotal: LEARNING_ACTIVITY_IDS.length,
      practiceCompletedCount: practiceCompletedCount,
      practiceTotal: PRACTICE_ACTIVITY_IDS.length
    };
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
    const journey = computeJourneyProgress();
    const unlocked = Boolean(forestState.completionRewarded && forestState.completionRewarded[NEXT_WORLD_UNLOCK_KEY]);
    if (ui.globalSummary) ui.globalSummary.textContent = "Follow the journey and unlock your next adventure.";
    if (ui.learningProgressText) ui.learningProgressText.textContent = journey.learningCompletedCount + " of " + journey.learningTotal + " completed";
    if (ui.practiceProgressText) ui.practiceProgressText.textContent = journey.practiceCompletedCount + " of " + journey.practiceTotal + " completed";
    if (ui.learningProgressFill) ui.learningProgressFill.style.width = ((journey.learningCompletedCount / journey.learningTotal) * 100).toFixed(1) + "%";
    if (ui.practiceProgressFill) ui.practiceProgressFill.style.width = ((journey.practiceCompletedCount / journey.practiceTotal) * 100).toFixed(1) + "%";
    if (ui.nextWorldStatus) ui.nextWorldStatus.textContent = unlocked ? "Unlocked" : "Locked";
    if (ui.unlockHintText) {
      ui.unlockHintText.textContent = unlocked
        ? "Your next adventure is ready!"
        : "Finish Magical Tree, Letter Garden, and any two practice games to unlock your next adventure!";
    }
    if (ui.globalStars) ui.globalStars.textContent = String(forestState.xp);
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
    if (ui.treeCounter) ui.treeCounter.textContent = "Group " + (groupIndex + 1) + "/" + (maxGroup + 1) + " · " + activity.completedItems.length + "/48";
    if (ui.treeStatus) ui.treeStatus.textContent = runtime.byActivity[activityId].status || "";
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
          playLottie("treeSparkle");
          setActivityStatus(activityId, "Letter discovered!");
          const nowComplete = groupLetters.every(function (_inner, innerOffset) {
            return activity.completedItems.includes(groupStart + innerOffset);
          });
          if (nowComplete) {
            setMascotState("celebrating");
            fireConfetti(false);
            playLottie("treeCelebrate");
            if (groupIndex < maxGroup) {
              runtime.treeGroupAdvanceTimer = window.setTimeout(function () {
                runtime.treeGroupAdvanceTimer = null;
                activity.currentIndex = (groupIndex + 1) * TREE_GROUP_SIZE;
                setActivityStatus(activityId, "");
                saveAndRender();
              }, 500);
              return;
            }
            if (!activity.isComplete && activity.completedItems.length >= letters.length) {
              CORE.finalizeActivity(forestState, activityId);
              setMascotState("dancing");
              fireConfetti(true);
              playLottie("treeCelebrate");
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

  function findFirstLetterIndex(predicate) {
    const found = letters.findIndex(predicate);
    return found >= 0 ? found : 0;
  }

  function getLetterGardenViewForIndex(index) {
    const letter = letters[Math.max(0, Math.min(letters.length - 1, index))];
    if (!letter || letter.category !== "consonant") {
      return { category: "vowels", subgroup: "ka-varga" };
    }
    return { category: "consonants", subgroup: letter.subgroup || "ka-varga" };
  }

  function syncLetterGardenCategoryFromCurrent() {
    const activity = forestState.activities["letter-garden"];
    if (!activity) return;
    const view = getLetterGardenViewForIndex(activity.currentIndex);
    activity.answers.category = view.category;
    activity.answers.subgroup = view.subgroup;
  }

  function renderLetterGarden() {
    const activityId = "letter-garden";
    const activity = forestState.activities[activityId];
    const selectedLetter = getCurrentLetter(activityId);
    syncLetterGardenCategoryFromCurrent();
    const rawCategory = activity.answers.category || "vowels";
    const selectedCategory = (rawCategory === "consonants" || rawCategory === "vowels") ? rawCategory : "vowels";
    if (selectedCategory !== rawCategory) activity.answers.category = selectedCategory;
    const selectedSubgroup = (!activity.answers.subgroup || activity.answers.subgroup === "all") ? "ka-varga" : activity.answers.subgroup;
    if (selectedCategory === "consonants" && activity.answers.subgroup !== selectedSubgroup) {
      activity.answers.subgroup = selectedSubgroup;
    }
    ui.letterCategoryTabs.forEach(function (tab) {
      const active = tab.getAttribute("data-category") === selectedCategory;
      tab.classList.toggle("active", active);
      tab.setAttribute("aria-pressed", active ? "true" : "false");
    });
    renderSubgroupButtons(selectedCategory, selectedSubgroup);

    const filtered = letters.filter(function (letter) {
      if (selectedCategory === "vowels") return letter.category !== "consonant";
      if (selectedCategory === "consonants") {
        if (letter.category !== "consonant") return false;
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
          cancelAutoAdvance(activityId);
          activity.currentIndex = letterIndex;
          setMascotState("pointing");
          playLetterAudio(letter, 1, ui.audioFallback);
          if (!activity.completedItems.includes(letterIndex)) {
            markCurrentComplete(activityId, "");
          } else {
            setActivityStatus(activityId, "");
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
    if (ui.gardenCoverage) ui.gardenCoverage.textContent = activity.completedItems.length + " of 48 letters practised.";
    if (ui.audioFallback && !AUDIO_ENABLED) {
      ui.audioFallback.textContent = "Pronunciation unavailable until verified Sanskrit audio is approved.";
    }
  }

  function renderSubgroupButtons(category, activeSubgroup) {
    if (!ui.subgroupTabs) return;
    if (category !== "consonants") {
      ui.subgroupTabs.innerHTML = "";
      return;
    }
    const state = forestState.activities["letter-garden"];
    ui.subgroupTabs.innerHTML = "";
    LETTER_GARDEN_SUBGROUPS.forEach(function (subgroup) {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "button ghost";
      btn.textContent = subgroup.label;
      btn.classList.toggle("active", activeSubgroup === subgroup.id);
      btn.addEventListener("click", function () {
        state.currentIndex = findFirstLetterIndex(function (letter) {
          return letter.category === "consonant" && (letter.subgroup || "other") === subgroup.id;
        });
        saveAndRender();
      });
      ui.subgroupTabs.appendChild(btn);
    });
  }

  function getStableOptionOrder(activityId, questionKey, builder) {
    const local = runtime.byActivity[activityId];
    if (!local.optionOrderByQuestion) local.optionOrderByQuestion = {};
    if (!Array.isArray(local.optionOrderByQuestion[questionKey])) {
      local.optionOrderByQuestion[questionKey] = builder();
    }
    return local.optionOrderByQuestion[questionKey];
  }

  function buildLetterOptionIndices(targetIndex, size) {
    const optionIndices = [targetIndex];
    let offset = 1;
    while (optionIndices.length < size) {
      const candidate = (targetIndex + offset * 7) % letters.length;
      if (!optionIndices.includes(candidate)) optionIndices.push(candidate);
      offset += 1;
    }
    for (let i = optionIndices.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      const tmp = optionIndices[i];
      optionIndices[i] = optionIndices[j];
      optionIndices[j] = tmp;
    }
    return optionIndices;
  }

  function renderHearAndPick() {
    const activityId = "hear-and-pick";
    const letter = getCurrentLetter(activityId);
    if (!letter || !ui.hearChoices || !ui.hearStatus) return;
    ui.hearChoices.innerHTML = "";
    ui.hearStatus.textContent = AUDIO_ENABLED
      ? "Tap the matching letter."
      : "Pronunciation unavailable. Tap the shown letter: " + letter.symbol;
    const activity = forestState.activities[activityId];
    const questionKey = String(activity.currentIndex);
    const targetIndex = activity.order[activity.currentIndex];
    const optionIndices = getStableOptionOrder(activityId, questionKey, function () {
      return buildLetterOptionIndices(targetIndex, 4);
    });
    const options = optionIndices.map(function (index) { return letters[index]; });
    options.forEach(function (option) {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "choice-btn";
      btn.textContent = option.symbol;
      btn.addEventListener("click", function () {
        cancelAutoAdvance(activityId);
        if (option.id === letter.id) {
          btn.classList.add("correct");
          markCurrentComplete(activityId, "Correct!");
        } else {
          btn.classList.add("wrong");
          incrementAttempt(activityId);
          ui.hearStatus.textContent = "Try again.";
          setMascotState("encouraging");
          setMascotSpeech("Good try! Let's try again!");
        }
      });
      ui.hearChoices.appendChild(btn);
    });
    if (ui.playHearPrompt) {
      ui.playHearPrompt.disabled = !AUDIO_ENABLED;
      ui.playHearPrompt.onclick = function () { playLetterAudio(letter, 1, ui.hearStatus); };
    }
  }

  function renderPictureMatch() {
    const activityId = "picture-match";
    const item = getCurrentQuestion(activityId);
    if (!item || !ui.pictureChoices || !ui.picturePrompt || !ui.pictureStatus) return;
    ui.picturePrompt.textContent = "Select the correct picture for: " + item.sanskrit + " (" + item.meaning + ")";
    ui.pictureStatus.textContent = "Choose the matching illustration.";
    ui.pictureChoices.innerHTML = "";
    const current = forestState.activities[activityId];
    const targetIndex = current.order[current.currentIndex];
    const questionKey = String(current.currentIndex);
    const optionIndices = getStableOptionOrder(activityId, questionKey, function () {
      const optionIndices = [targetIndex];
      for (let index = 0; index < pictureQuestions.length && optionIndices.length < 4; index += 1) {
        if (index === targetIndex) continue;
        optionIndices.push(index);
      }
      for (let i = optionIndices.length - 1; i > 0; i -= 1) {
        const j = Math.floor(Math.random() * (i + 1));
        const tmp = optionIndices[i];
        optionIndices[i] = optionIndices[j];
        optionIndices[j] = tmp;
      }
      return optionIndices;
    });
    const options = optionIndices.map(function (idx) { return pictureQuestions[idx]; });
    options.forEach(function (option) {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "choice-btn picture-choice";
      btn.innerHTML =
        '<img class="picture-illustration" src="' + option.image + '" alt="' + option.alt + '">' +
        '<span class="picture-label">' + option.sanskrit + " · " + option.meaning + "</span>";
      btn.addEventListener("click", function () {
        cancelAutoAdvance(activityId);
        if (btn.disabled) return;
        if (option.id === item.id) {
          btn.classList.add("correct");
          ui.pictureChoices.querySelectorAll(".choice-btn").forEach(function (choice) { choice.disabled = true; });
          animate(btn, { transform: ["scale(1)", "scale(1.06)", "scale(1)"] }, { duration: 0.35, easing: "ease-out" });
          playSuccessSound("chime");
          fireConfetti(false);
          markCurrentComplete(activityId, "Correct picture!");
          setMascotState("celebrating");
        } else {
          btn.classList.add("wrong");
          animate(btn, {
            transform: [
              "translateX(0px)",
              "translateX(-7px)",
              "translateX(7px)",
              "translateX(-4px)",
              "translateX(0px)"
            ]
          }, { duration: 0.32, easing: "ease-out" });
          incrementAttempt(activityId);
          ui.pictureStatus.textContent = "Good try. Hint: match the word with the correct picture.";
          setMascotState("thinking");
          setMascotSpeech("Good try! Let's try again!");
          window.setTimeout(function () {
            btn.classList.remove("wrong");
          }, 420);
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
    const item = getCurrentQuestion(activityId);
    if (!item || !ui.flashcard || !ui.flashChoices || !ui.flashStatus) return;
    const localState = runtime.byActivity[activityId];
    const cardClass = localState.flipped ? "flashcard flip is-flipped" : "flashcard flip";
    ui.flashcard.className = cardClass;
    ui.flashcard.innerHTML = localState.flipped
      ? '<div class="flash-face flash-back"><p><strong>' + item.meaning + "</strong></p><img class=\"picture-illustration\" src=\"" + item.image + "\" alt=\"" + item.alt + "\"><p class=\"flash-tran\">" + item.transliteration + "</p></div>"
      : '<div class="flash-face flash-front"><p class="flash-dev">' + item.sanskrit + "</p><p class=\"flash-tran\">" + item.transliteration + "</p></div>";
    ui.flashStatus.textContent = localState.flipped ? "Now mark this card as learned." : "Flip the card to reveal the meaning.";
    ui.flashChoices.innerHTML = "";
    if (!localState.flipped) return;
    const learnedBtn = document.createElement("button");
    learnedBtn.type = "button";
    learnedBtn.className = "button secondary";
    learnedBtn.textContent = "I learned this card";
    learnedBtn.disabled = isCurrentResolved(activityId);
    learnedBtn.addEventListener("click", function () {
      markCurrentComplete(activityId, "Card learned!");
    });
    ui.flashChoices.appendChild(learnedBtn);
  }

  function renderFeedMithu() {
    const activityId = "feed-mithu";
    const item = getCurrentQuestion(activityId);
    if (!item || !ui.feedPrompt || !ui.feedChoices || !ui.feedStatus || !ui.lessonMascot) return;
    ui.feedPrompt.textContent = "Feed Mithu: choose " + item.sanskrit + " (" + item.meaning + ")";
    ui.feedStatus.textContent = "Choose one.";
    ui.feedChoices.innerHTML = "";
    const current = forestState.activities[activityId];
    const targetIndex = current.order[current.currentIndex];
    const questionKey = String(current.currentIndex);
    const optionIndices = getStableOptionOrder(activityId, questionKey, function () {
      const indices = [targetIndex];
      for (let index = 0; index < feedMithuQuestions.length && indices.length < 4; index += 1) {
        if (index === targetIndex) continue;
        indices.push(index);
      }
      for (let i = indices.length - 1; i > 0; i -= 1) {
        const j = Math.floor(Math.random() * (i + 1));
        const tmp = indices[i];
        indices[i] = indices[j];
        indices[j] = tmp;
      }
      return indices;
    });
    const options = optionIndices.map(function (idx) { return feedMithuQuestions[idx]; });
    options.forEach(function (option) {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "choice-btn picture-choice";
      btn.innerHTML =
        '<img class="picture-illustration" src="' + option.image + '" alt="' + option.alt + '">' +
        '<span class="picture-label">' + option.sanskrit + " · " + option.meaning + "</span>";
      btn.addEventListener("click", function () {
        cancelAutoAdvance(activityId);
        if (option.sanskrit === item.sanskrit) {
          animateFruitToMithu(btn);
          btn.classList.add("correct");
          markCurrentComplete(activityId, "Mithu enjoyed the fruit!");
          setMascotState("eating");
        } else {
          btn.classList.add("wrong");
          incrementAttempt(activityId);
          ui.feedStatus.textContent = "Try a different fruit.";
          setMascotState("encouraging");
          setMascotSpeech("Good try! Let's try again!");
        }
      });
      ui.feedChoices.appendChild(btn);
    });
  }

  function animateFruitToMithu(sourceButton) {
    if (REDUCED_MOTION || !ui.lessonMascot) return;
    const source = sourceButton.getBoundingClientRect();
    const target = ui.lessonMascot.getBoundingClientRect();
    const sourceImage = sourceButton.querySelector("img");
    const fruit = document.createElement("img");
    fruit.className = "flying-fruit";
    fruit.src = sourceImage ? sourceImage.src : "assets/illustrations/fruits/apple.svg";
    fruit.alt = "";
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
    if (!letter || !ui.traceTargetLetter || !ui.traceStatus) return;
    const activity = forestState.activities[activityId];
    ui.traceTargetLetter.textContent = letter.symbol;
    if (ui.checkTraceBtn) ui.checkTraceBtn.disabled = false;
    if (runtime.tracing.lastLetterIndex !== activity.currentIndex) {
      runtime.tracing.lastLetterIndex = activity.currentIndex;
      clearTraceBoard();
    }
    if (!isCurrentResolved(activityId)) {
      ui.traceStatus.textContent = WRITING_VALIDATION_AVAILABLE
        ? "Write the letter, then tap Check."
        : "Write the letter and practise. Automatic Sanskrit handwriting checking is coming soon.";
    } else if (!runtime.byActivity[activityId].status) {
      ui.traceStatus.textContent = "Letter saved. Continue when ready.";
    }
  }

  function renderHiddenLetterHunt() {
    const activityId = "hidden-letter-hunt";
    const letter = getCurrentLetter(activityId);
    if (!letter || !ui.huntPrompt || !ui.huntGrid || !ui.huntStatus) return;
    const activity = forestState.activities[activityId];
    ui.huntPrompt.textContent = "Find letter " + letter.symbol + " in the grid.";
    ui.huntStatus.textContent = "Tap the target.";
    ui.huntGrid.innerHTML = "";
    const questionKey = String(activity.currentIndex);
    const targetIndex = activity.order[activity.currentIndex];
    const optionIndices = getStableOptionOrder(activityId, questionKey, function () {
      return buildLetterOptionIndices(targetIndex, 8);
    });
    const options = optionIndices.map(function (index) { return letters[index]; });
    options.forEach(function (option) {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "tile-btn";
      btn.textContent = option.symbol;
      btn.addEventListener("click", function () {
        cancelAutoAdvance(activityId);
        if (option.id === letter.id) {
          btn.classList.add("correct");
          markCurrentComplete(activityId, "Found it!");
        } else {
          btn.classList.add("wrong");
          incrementAttempt(activityId);
          ui.huntStatus.textContent = "Keep searching.";
          setMascotState("encouraging");
          setMascotSpeech("Good try! Let's try again!");
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
      const itemCount = getActivityItemCount(activity.id);
      const atLast = state.currentIndex >= itemCount - 1;
      if (progress) {
        if (activity.id === "magical-tree") {
          progress.textContent = state.completedItems.length + "/48";
        } else if (activity.id === "letter-garden") {
          progress.textContent = state.completedItems.length + "/48";
        } else {
          progress.textContent = (state.currentIndex + 1) + "/" + itemCount;
        }
      }
      if (status) status.textContent = runtime.byActivity[activity.id].status || "";
      if (complete) complete.textContent = state.isComplete ? activity.title + " completed." : "";
      if (activity.type === "tree") return;
      const previous = mount.querySelector('[data-action="previous"]');
      const retry = mount.querySelector('[data-action="retry"]');
      const next = mount.querySelector('[data-action="next"]');
      const finish = mount.querySelector('[data-action="finish"]');
      const continueBtn = mount.querySelector('[data-action="continue"]');
      const restart = mount.querySelector('[data-action="restart"]');
      if (previous) previous.disabled = state.currentIndex === 0;
      if (retry) retry.disabled = false;
      if (next) {
        next.hidden = false;
        next.disabled = atLast || !resolved;
      }
      if (finish) {
        finish.hidden = true;
        finish.disabled = true;
      }
      if (continueBtn) {
        continueBtn.hidden = !state.isComplete;
        continueBtn.disabled = !state.isComplete;
      }
      if (restart) restart.disabled = !state.isComplete;
    });
  }

  function updateWorldCompletionPanels() {
    const journey = computeJourneyProgress();
    const canUnlock = journey.learningCompletedCount === 2 && journey.practiceCompletedCount >= 2;
    const alreadyUnlocked = Boolean(forestState.completionRewarded && forestState.completionRewarded[NEXT_WORLD_UNLOCK_KEY]);
    if (canUnlock && !alreadyUnlocked) {
      forestState.completionRewarded[NEXT_WORLD_UNLOCK_KEY] = true;
      forestState.worldCompleted = true;
      stateApi.saveState(forestState);
      setMascotStateForDuration("dancing", 1250);
      setMascotSpeech("Fantastic! You finished this adventure!");
      fireConfetti(true);
      fireSectionConfetti("completionScreen", true);
      playLottie("treeCelebrate");
    }
    const unlocked = alreadyUnlocked || canUnlock;
    if (ui.nextWorldStatus) ui.nextWorldStatus.textContent = unlocked ? "Unlocked" : "Locked";
    if (ui.unlockHintText) {
      ui.unlockHintText.textContent = unlocked
        ? "Your next adventure is ready!"
        : "Finish Magical Tree, Letter Garden, and any two practice games to unlock your next adventure!";
    }
    if (ui.completionScreen) ui.completionScreen.classList.toggle("show", unlocked);
    if (ui.completionTitle) ui.completionTitle.textContent = unlocked ? "Next World Unlocked!" : "Keep Going!";
    if (ui.completionMessage) {
      ui.completionMessage.textContent = unlocked
        ? "Your next adventure is ready!"
        : "Complete the learning goals to unlock your next adventure.";
    }
    if (ui.completionStars) ui.completionStars.textContent = String(forestState.xp);
  }
})();
