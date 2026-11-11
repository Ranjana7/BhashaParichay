(function initAlphabetForestV4() {
  const AUDIO_ENABLED = true;
  const TREE_MITHU_OFFSET_X = 16;
  const TREE_MITHU_OFFSET_Y = -18;
  const LETTER_COUNT = 48;
  const TREE_GROUP_SIZE = 5;
  const UNLOCK_STAR_TARGET = 50;
  const UNLOCK_GEM_TARGET = 1;
  const REDUCED_MOTION = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const WORLD_ORDER = ["alphabet", "animals", "numbers", "colours", "words", "sentences", "stories", "culture"];
  const UNLOCK_EVENT_KEY = "sanskritParichay.unlock.event.alphabet";
  const UNLOCK_INVITE_KEY = "sanskritParichay.unlock.invite.alphabet";
  const CORE = window.SPAlphabetForestCore;
  const MESSAGE_SET = (window.SP_MESSAGES && window.SP_MESSAGES.alphabetForest) || {};
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
  const HOME_KEY = "sanskritParichay.home.progress";
  const ACTIVITY_IDS = ACTIVITIES.map(function mapId(activity) { return activity.id; });
  const ACTIVITY_META = Object.fromEntries(ACTIVITIES.map(function mapMeta(activity) { return [activity.id, activity]; }));
  const ACTIVITY_SPEECH = {
    "magical-tree": (MESSAGE_SET.activityIntro && MESSAGE_SET.activityIntro["magical-tree"]) || "Let's discover some beautiful Sanskrit letters!",
    "letter-garden": (MESSAGE_SET.activityIntro && MESSAGE_SET.activityIntro["letter-garden"]) || "Every letter has a story! Tap one and let's explore!",
    "hear-and-pick": (MESSAGE_SET.activityIntro && MESSAGE_SET.activityIntro["hear-and-pick"]) || "Listen closely! Which letter did you hear?",
    "picture-match": (MESSAGE_SET.activityIntro && MESSAGE_SET.activityIntro["picture-match"]) || "Look carefully! Which picture matches our Sanskrit word?",
    "arrange-word": (MESSAGE_SET.activityIntro && MESSAGE_SET.activityIntro["arrange-word"]) || "Let's build this Sanskrit word together!",
    "flashcard-flip": (MESSAGE_SET.activityIntro && MESSAGE_SET.activityIntro["flashcard-flip"]) || "Can you guess what this word means? Tap the card to find out!",
    "feed-mithu": (MESSAGE_SET.activityIntro && MESSAGE_SET.activityIntro["feed-mithu"]) || "Yummy! I'm hungry! Can you find the right fruit for me?",
    "letter-tracing": (MESSAGE_SET.activityIntro && MESSAGE_SET.activityIntro["letter-tracing"]) || "Let's make beautiful Sanskrit letters! Your turn to write!",
    "hidden-letter-hunt": (MESSAGE_SET.activityIntro && MESSAGE_SET.activityIntro["hidden-letter-hunt"]) || "Ready for a hunt? Find the hidden letter!"
  };
  const CORRECT_SPEECH = Array.isArray(MESSAGE_SET.correct) && MESSAGE_SET.correct.length
    ? MESSAGE_SET.correct.slice()
    : ["Wonderful! You're doing great!", "Fantastic! Keep going!", "Brilliant! Another one!", "Yay! You found it!", "Excellent work!"];
  const INCORRECT_SPEECH = Array.isArray(MESSAGE_SET.incorrect) && MESSAGE_SET.incorrect.length
    ? MESSAGE_SET.incorrect.slice()
    : ["Good try! Let's give it another go!", "Take another look!", "You're getting closer!", "Let's try this together!"];
  const COMPLETE_SPEECH = Array.isArray(MESSAGE_SET.completed) && MESSAGE_SET.completed.length
    ? MESSAGE_SET.completed.slice()
    : ["Fantastic! You've completed this activity!", "Wonderful! Ready for more?", "Look how much you've learned!"];
  const WORLD_UNLOCKED_SPEECH = MESSAGE_SET.worldUnlocked || "Hooray! Another magical adventure completed!";
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
    worldUnlockInvite: document.getElementById("worldUnlockInvite"),
    worldUnlockInviteBtn: document.getElementById("worldUnlockInviteBtn"),
    worldUnlockDismissBtn: document.getElementById("worldUnlockDismissBtn"),
    globalSummary: document.getElementById("globalProgressSummary"),
    learningProgressText: document.getElementById("learningProgressText"),
    practiceProgressText: document.getElementById("practiceProgressText"),
    learningProgressFill: document.getElementById("learningProgressFill"),
    practiceProgressFill: document.getElementById("practiceProgressFill"),
    nextWorldStatus: document.getElementById("nextWorldStatus"),
    unlockHintText: document.getElementById("unlockHintText"),
    globalStars: document.getElementById("globalStars"),
    globalGems: document.getElementById("globalGems"),
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
    letterGardenStatus: document.getElementById("letterGardenStatus"),
    letterGardenCompletionActions: document.getElementById("letterGardenCompletionActions"),
    playLetterGardenAgainBtn: document.getElementById("playLetterGardenAgainBtn"),
    continueToPracticeBtn: document.getElementById("continueToPracticeBtn"),
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
    huntPrompt: document.getElementById("huntPrompt"),
    huntGrid: document.getElementById("huntGrid"),
    huntStatus: document.getElementById("huntStatus"),
    completionCanvas: document.getElementById("celebration-canvas"),
    completionScreen: document.getElementById("completionScreen"),
    completionStars: document.getElementById("completionStars"),
    completionTitle: document.getElementById("completionTitle"),
    completionMessage: document.getElementById("completionMessage")
  };

  const stateApi = CORE.createStateApi(window.localStorage, letters.length);
  const forestState = stateApi.loadState();
  if (!Number.isFinite(Number(forestState.gems))) forestState.gems = 0;
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
    messageLast: {},
    mascotSpeechHoldUntil: 0,
    mascotSpeechPriority: 0,
    mascotSpeechText: "",
    mascotMotion: {
      currentY: 0,
      targetY: 0,
      rafId: null
    },
    tracing: {
      drawing: false,
      points: [],
      lastLetterIndex: -1
    },
    treeMithuMotion: {
      initialized: false,
      stage: null,
      rafId: null,
      x: 0,
      y: 0,
      targetX: 0,
      targetY: 0
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
  reconcileLetterGardenProgress();
  stateApi.saveState(forestState);

  initMuteState();
  initAudioControls();
  initJumpNavigation();
  initMascotCompanion();
  initTreeControls();
  initTreeMiniMithu();
  initLetterGardenControls();
  initUnlockInviteControls();
  initArrangeControls();
  initFlashControls();
  initTracingCanvas();
  initConfetti();
  initLottieAnimations();
  initActivityControls();
  renderAll();

  function getActivityItemCount(activityId) {
    if (activityId === "picture-match") return pictureQuestions.length;
    if (activityId === "flashcard-flip") return flashcardQuestions.length;
    if (activityId === "feed-mithu") return feedMithuQuestions.length;
    return letters.length;
  }

  function initTreeMiniMithu() {
    if (!ui.treeMithu) return;
    const stage = document.getElementById("magicalTreeStage");
    if (!stage) return;
    const motion = runtime.treeMithuMotion;
    if (motion.initialized) return;
    motion.initialized = true;
    motion.stage = stage;
    ui.treeMithu.classList.add("following");

    function clamp(value, min, max) {
      return Math.max(min, Math.min(max, value));
    }

    function syncPerchPosition() {
      const rect = stage.getBoundingClientRect();
      motion.targetX = rect.width * 0.8;
      motion.targetY = rect.height * 0.62;
      if (!motion.x && !motion.y) {
        motion.x = motion.targetX;
        motion.y = motion.targetY;
      }
    }

    function runFrame() {
      const prefersReducedMotion = REDUCED_MOTION || window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const smoothing = prefersReducedMotion ? 1 : 0.2;
      const nextX = motion.x + (motion.targetX - motion.x) * smoothing;
      const nextY = motion.y + (motion.targetY - motion.y) * smoothing;
      const dx = motion.targetX - motion.x;
      motion.x = nextX;
      motion.y = nextY;
      const angle = prefersReducedMotion ? 0 : clamp(dx * 0.08, -10, 10);
      ui.treeMithu.style.left = motion.x.toFixed(2) + "px";
      ui.treeMithu.style.top = motion.y.toFixed(2) + "px";
      ui.treeMithu.style.transform = "translate(-50%, -50%) rotate(" + angle.toFixed(1) + "deg)";
      const settling = Math.abs(motion.targetX - motion.x) < 0.6 && Math.abs(motion.targetY - motion.y) < 0.6;
      if (settling) {
        motion.rafId = null;
        return;
      }
      motion.rafId = window.requestAnimationFrame(runFrame);
    }

    function requestFrame() {
      if (motion.rafId) return;
      motion.rafId = window.requestAnimationFrame(runFrame);
    }

    function moveToClientPoint(clientX, clientY) {
      const rect = stage.getBoundingClientRect();
      const x = clamp(clientX - rect.left + TREE_MITHU_OFFSET_X, 52, rect.width - 52);
      const y = clamp(clientY - rect.top + TREE_MITHU_OFFSET_Y, 56, rect.height - 44);
      motion.targetX = x;
      motion.targetY = y;
      requestFrame();
    }

    stage.addEventListener("pointermove", function (event) {
      moveToClientPoint(event.clientX, event.clientY);
    });
    stage.addEventListener("pointerleave", function () {
      syncPerchPosition();
      requestFrame();
      ui.treeMithu.classList.remove("hovering");
    });
    stage.addEventListener("pointerdown", function (event) {
      moveToClientPoint(event.clientX, event.clientY);
    });
    window.addEventListener("resize", function () {
      syncPerchPosition();
      requestFrame();
    });

    syncPerchPosition();
    requestFrame();
  }

  function moveTreeMithuTowardPercent(xPercent, yPercent) {
    const motion = runtime.treeMithuMotion;
    const stage = motion.stage;
    if (!stage || !ui.treeMithu) return;
    const rect = stage.getBoundingClientRect();
    motion.targetX = Math.max(52, Math.min(rect.width - 52, (xPercent / 100) * rect.width + TREE_MITHU_OFFSET_X));
    motion.targetY = Math.max(56, Math.min(rect.height - 44, (yPercent / 100) * rect.height + TREE_MITHU_OFFSET_Y));
    if (!motion.rafId) motion.rafId = window.requestAnimationFrame(function run() {
      motion.rafId = null;
      const nextX = motion.x + (motion.targetX - motion.x) * (REDUCED_MOTION ? 1 : 0.22);
      const nextY = motion.y + (motion.targetY - motion.y) * (REDUCED_MOTION ? 1 : 0.22);
      motion.x = nextX;
      motion.y = nextY;
      const dx = motion.targetX - motion.x;
      const angle = REDUCED_MOTION ? 0 : Math.max(-10, Math.min(10, dx * 0.08));
      ui.treeMithu.style.left = motion.x.toFixed(2) + "px";
      ui.treeMithu.style.top = motion.y.toFixed(2) + "px";
      ui.treeMithu.style.transform = "translate(-50%, -50%) rotate(" + angle.toFixed(1) + "deg)";
      const settling = Math.abs(motion.targetX - motion.x) < 0.6 && Math.abs(motion.targetY - motion.y) < 0.6;
      if (!settling) motion.rafId = window.requestAnimationFrame(run);
    });
  }

  function celebrateTreeMithu() {
    if (!ui.treeMithu) return;
    ui.treeMithu.classList.add("celebrating");
    window.setTimeout(function () {
      ui.treeMithu.classList.remove("celebrating");
    }, 800);
  }

  function scrollToActivity(target) {
    if (!target) return;
    const header = document.querySelector(".site-header");
    const offset = header ? Math.ceil(header.getBoundingClientRect().height) + 8 : 88;
    const top = Math.max(0, window.scrollY + target.getBoundingClientRect().top - offset);
    window.scrollTo({ top: top, behavior: "smooth" });
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
      state.isComplete = Boolean(state.isComplete) || state.completedItems.length >= itemCount;
      if (!state.answers || typeof state.answers !== "object") state.answers = {};
      if (!state.attempts || typeof state.attempts !== "object") state.attempts = {};
    });
  }

  function reconcileLetterGardenProgress() {
    const activity = forestState.activities["letter-garden"];
    if (!activity) return;
    if (!activity.answers || typeof activity.answers !== "object") activity.answers = {};
    const idToIndex = {};
    letters.forEach(function (letter, index) {
      idToIndex[letter.id] = index;
    });
    const fromIds = Array.isArray(activity.answers.completedLetterIds)
      ? activity.answers.completedLetterIds
          .map(function (id) { return idToIndex[id]; })
          .filter(function (value) { return Number.isInteger(value) && value >= 0 && value < letters.length; })
      : [];
    const merged = Array.from(new Set([].concat(activity.completedItems || [], fromIds)))
      .filter(function (value) { return Number.isInteger(value) && value >= 0 && value < letters.length; })
      .sort(function (a, b) { return a - b; });
    activity.completedItems = merged;
    activity.answers.completedLetterIds = merged.map(function (index) { return letters[index].id; });
    if (merged.length >= letters.length) activity.isComplete = true;
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
        scrollToActivity(target);
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

  function setMascotSpeech(text, options) {
    if (!ui.lessonMascotSpeech || !text) return false;
    const opts = options || {};
    const now = Date.now();
    const priority = Number.isFinite(opts.priority) ? opts.priority : 2;
    const holdMs = Number.isFinite(opts.holdMs) ? Math.max(0, opts.holdMs) : 2400;
    const force = Boolean(opts.force);
    const holdUntil = runtime.mascotSpeechHoldUntil || 0;
    const activePriority = runtime.mascotSpeechPriority || 0;
    if (!force && now < holdUntil && priority < activePriority) return false;
    if (!force && text === runtime.mascotSpeechText && now < holdUntil) return false;
    const tone = opts.tone || "instruction";
    ui.lessonMascotSpeech.textContent = text;
    ui.lessonMascotSpeech.classList.remove("tone-instruction", "tone-encourage", "tone-correct", "tone-complete", "tone-world");
    ui.lessonMascotSpeech.classList.add("tone-" + tone);
    runtime.mascotSpeechText = text;
    runtime.mascotSpeechPriority = priority;
    runtime.mascotSpeechHoldUntil = now + holdMs;
    return true;
  }

  function pickSpeech(pool, bucket) {
    if (!Array.isArray(pool) || !pool.length) return "";
    const key = bucket || "shared";
    const previous = runtime.messageLast[key] || "";
    const options = pool.length > 1 ? pool.filter(function (item) { return item !== previous; }) : pool;
    const selected = options[Math.floor(Math.random() * options.length)] || pool[0];
    runtime.messageLast[key] = selected;
    return selected;
  }

  function toTitleCaseLabel(value) {
    const text = String(value || "").trim();
    if (!text) return "";
    return text.split(/\s+/).map(function (part) {
      return part.charAt(0).toUpperCase() + part.slice(1);
    }).join(" ");
  }

  function updateMascotSpeechForActivity(activityId) {
    setMascotSpeech(ACTIVITY_SPEECH[activityId] || "Ready? Let's try this together!", {
      priority: 1,
      holdMs: 2200,
      tone: "instruction"
    });
  }

  function initMascotCompanion() {
    if (!ui.lessonMascot) return;
    setMascotState("idle");
    setMascotSpeech(MESSAGE_SET.welcome || "Namaste, little explorer! I'm Mithu! Ready for a magical Sanskrit adventure?", { priority: 2, holdMs: 2800, force: true });
    const sections = ACTIVITIES.map(function (a) { return document.getElementById(a.sectionId); }).filter(Boolean);
    let scrollTicking = false;
    const pageWrap = document.querySelector(".page-wrap");
    const homeContainer = document.getElementById("lessonProgressPanel") || (ui.lessonMascot && ui.lessonMascot.parentElement);
    const homeNextSibling = ui.lessonMascot ? ui.lessonMascot.nextElementSibling : null;
    let mascotRail = null;

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
      ui.lessonMascot.style.top = "";
      ui.lessonMascot.style.right = "";
      ui.lessonMascot.classList.add("is-journey-guide");
      if (!Number.isFinite(Number(ui.lessonMascot.dataset.railY))) {
        ui.lessonMascot.dataset.railY = "0";
      }
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
      ui.lessonMascot.dataset.railY = "0";
    }

    function syncLayoutClass() {
      const compact = window.matchMedia("(max-width: 980px)").matches;
      if (compact) placeMascotCompact();
      else {
        placeMascotDesktop();
        updateMascotTargetFromScroll();
      }
    }

    function updateMascotTargetFromScroll() {
      if (!ui.lessonMascot || window.matchMedia("(max-width: 980px)").matches) return;
      const rail = getMascotRail();
      if (!rail) return;
      const pageHeight = Math.max(
        document.documentElement.scrollHeight,
        document.body ? document.body.scrollHeight : 0,
        pageWrap ? pageWrap.scrollHeight : 0
      );
      const maxScroll = Math.max(1, pageHeight - window.innerHeight);
      const progress = Math.max(0, Math.min(1, window.scrollY / maxScroll));
      const mascotHeight = Math.ceil(ui.lessonMascot.getBoundingClientRect().height || 220);
      const railHeight = Math.max(rail.offsetHeight || 0, pageWrap ? pageWrap.scrollHeight : 0);
      const maxTop = Math.max(0, railHeight - mascotHeight - 8);
      runtime.mascotMotion.targetY = maxTop * progress;
    }

    function runMascotMotionFrame(timestamp) {
      if (!ui.lessonMascot) {
        runtime.mascotMotion.rafId = null;
        return;
      }
      if (window.matchMedia("(max-width: 980px)").matches) {
        runtime.mascotMotion.currentY = 0;
        runtime.mascotMotion.targetY = 0;
        runtime.mascotMotion.rafId = window.requestAnimationFrame(runMascotMotionFrame);
        return;
      }
      const current = Number.isFinite(runtime.mascotMotion.currentY) ? runtime.mascotMotion.currentY : 0;
      const target = Number.isFinite(runtime.mascotMotion.targetY) ? runtime.mascotMotion.targetY : 0;
      const eased = current + (target - current) * 0.13;
      runtime.mascotMotion.currentY = eased;
      ui.lessonMascot.dataset.railY = String(Math.round(eased));
      const floatOffset = REDUCED_MOTION ? 0 : Math.sin((timestamp || 0) / 520) * 1.8;
      ui.lessonMascot.style.transform = "translate3d(0," + (eased + floatOffset).toFixed(2) + "px,0)";
      runtime.mascotMotion.rafId = window.requestAnimationFrame(runMascotMotionFrame);
    }
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
      updateMascotTargetFromScroll();
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
        updateMascotTargetFromScroll();
        updateActiveSection();
        scrollTicking = false;
      });
    }, { passive: true });
    window.addEventListener("resize", function () {
      syncLayoutClass();
      if (!runtime.mascotActiveSection) return;
      const sectionId = ACTIVITY_META[runtime.mascotActiveSection].sectionId;
      const section = document.getElementById(sectionId);
      if (section) moveMascotNearSection(section);
      updateMascotTargetFromScroll();
    });
    runtime.mascotMotion.rafId = window.requestAnimationFrame(runMascotMotionFrame);
    syncLayoutClass();
    updateActiveSection();
  }

  function moveMascotNearSection(section) {
    if (!ui.lessonMascot || !section) return;
    const compact = window.matchMedia("(max-width: 980px)").matches;
    ui.lessonMascot.classList.toggle("lesson-mascot-mobile", compact);
    ui.lessonMascot.setAttribute("data-active-section", section.id || "");
    if (compact) {
      ui.lessonMascot.style.transform = "";
      return;
    }
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
        dispatchActivityAction("magical-tree", "continue");
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
    if (ui.playLetterGardenAgainBtn) ui.playLetterGardenAgainBtn.addEventListener("click", function () {
      dispatchActivityAction("letter-garden", "restart");
    });
    if (ui.continueToPracticeBtn) ui.continueToPracticeBtn.addEventListener("click", function () {
      dispatchActivityAction("letter-garden", "continue");
    });
  }

  function getNextWorldFromOrder() {
    return WORLD_ORDER.length > 1 ? WORLD_ORDER[1] : null;
  }

  function showUnlockInvite() {
    if (!ui.worldUnlockInvite) return;
    ui.worldUnlockInvite.hidden = false;
  }

  function hideUnlockInvite() {
    if (!ui.worldUnlockInvite) return;
    ui.worldUnlockInvite.hidden = true;
  }

  function initUnlockInviteControls() {
    hideUnlockInvite();
    if (ui.worldUnlockInviteBtn) {
      ui.worldUnlockInviteBtn.addEventListener("click", function () {
        const nextWorld = getNextWorldFromOrder();
        if (!nextWorld) return;
        localStorage.setItem("sanskritParichay.lastWorld", nextWorld);
        localStorage.removeItem(UNLOCK_INVITE_KEY);
        const target = nextWorld === "alphabet" ? "alphabet-forest.html" : ("learning-world.html?world=" + nextWorld);
        window.location.href = target;
      });
    }
    if (ui.worldUnlockDismissBtn) {
      ui.worldUnlockDismissBtn.addEventListener("click", function () {
        localStorage.setItem(UNLOCK_INVITE_KEY, "dismissed");
        hideUnlockInvite();
      });
    }
  }

  function initArrangeControls() {
    if (ui.checkArrange) {
      ui.checkArrange.addEventListener("click", function () {
        const activityId = "arrange-word";
        const letter = getCurrentLetter(activityId);
        const answer = runtime.byActivity[activityId].tempAnswer || "";
        if (answer === letter.exampleText) {
          markCurrentComplete(activityId, "Correct arrangement.");
          if (ui.arrangeStatus)           ui.arrangeStatus.textContent = "✅ Completed for this activity.";
        } else {
          incrementAttempt(activityId);
          if (ui.arrangeStatus) ui.arrangeStatus.textContent = pickSpeech(INCORRECT_SPEECH, "arrange-wrong");
          setMascotState("thinking");
          setMascotSpeech(pickSpeech(INCORRECT_SPEECH, "arrange-wrong-speech"), { priority: 3, holdMs: 3000, tone: "encourage" });
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
    if (ui.traceCanvas.dataset.initialized === "true") return;
    const ctx = ui.traceCanvas.getContext("2d");
    if (!ctx) return;
    ui.traceCanvas.dataset.initialized = "true";
    ui.traceCanvas.style.touchAction = "none";
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.lineWidth = 8;
    ctx.strokeStyle = "#4b63cf";

    function syncCanvasSize() {
      const rect = ui.traceCanvas.getBoundingClientRect();
      const width = Math.max(280, Math.floor(rect.width || 420));
      const height = Math.max(160, Math.floor(rect.height || 220));
      if (ui.traceCanvas.width === width && ui.traceCanvas.height === height) return;
      let snapshot = null;
      if (ui.traceCanvas.width > 0 && ui.traceCanvas.height > 0) {
        snapshot = document.createElement("canvas");
        snapshot.width = ui.traceCanvas.width;
        snapshot.height = ui.traceCanvas.height;
        const snapshotCtx = snapshot.getContext("2d");
        if (snapshotCtx) snapshotCtx.drawImage(ui.traceCanvas, 0, 0);
      }
      ui.traceCanvas.width = width;
      ui.traceCanvas.height = height;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.lineWidth = 8;
      ctx.strokeStyle = "#4b63cf";
      if (snapshot) {
        ctx.drawImage(snapshot, 0, 0, snapshot.width, snapshot.height, 0, 0, width, height);
      } else {
        runtime.tracing.points = [];
      }
    }

    function getPoint(event) {
      const rect = ui.traceCanvas.getBoundingClientRect();
      const source = event;
      return {
        x: (source.clientX - rect.left) * (ui.traceCanvas.width / rect.width),
        y: (source.clientY - rect.top) * (ui.traceCanvas.height / rect.height)
      };
    }

    function startDraw(event) {
      if (event.button !== undefined && event.button !== 0) return;
      runtime.tracing.drawing = true;
      if (event.pointerId !== undefined && ui.traceCanvas.setPointerCapture) {
        ui.traceCanvas.setPointerCapture(event.pointerId);
      }
      const point = getPoint(event);
      runtime.tracing.points.push(point);
      ctx.beginPath();
      ctx.moveTo(point.x, point.y);
      if (ui.traceStatus) ui.traceStatus.textContent = "Keep drawing, then tap Next.";
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

    syncCanvasSize();
    window.addEventListener("resize", syncCanvasSize);
    ui.traceCanvas.addEventListener("pointerdown", startDraw);
    ui.traceCanvas.addEventListener("pointermove", moveDraw);
    ui.traceCanvas.addEventListener("pointerup", endDraw);
    ui.traceCanvas.addEventListener("pointerleave", endDraw);
    ui.traceCanvas.addEventListener("pointercancel", endDraw);

    if (ui.clearTraceBtn) ui.clearTraceBtn.addEventListener("click", function () {
      clearTraceBoard();
      if (ui.traceStatus) ui.traceStatus.textContent = "Great! Try writing the letter again.";
    });
  }

  function clearTraceBoard() {
    if (!ui.traceCanvas) return;
    const ctx = ui.traceCanvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, ui.traceCanvas.width, ui.traceCanvas.height);
    runtime.tracing.points = [];
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

  function triggerFlowerRain(sectionId, options) {
    if (typeof window.spFlowerRain !== "function") return;
    const section = typeof sectionId === "string" ? document.getElementById(sectionId) : sectionId;
    window.spFlowerRain(section || null, Object.assign({ durationMs: 2600, density: 22 }, options || {}));
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
        '<button class="button ghost tiny" type="button" data-action="restart">🔄 Restart Activity</button>' +
        "</div>" +
        '<p class="status" id="status-' + activity.id + '" aria-live="polite"></p>' +
        '<p class="activity-complete-note" id="complete-' + activity.id + '" tabindex="-1"></p>';
      mount.querySelector('[data-action="previous"]').addEventListener("click", function () { dispatchActivityAction(activity.id, "previous"); });
      mount.querySelector('[data-action="retry"]').addEventListener("click", function () { dispatchActivityAction(activity.id, "retry"); });
      mount.querySelector('[data-action="next"]').addEventListener("click", function () { dispatchActivityAction(activity.id, "next"); });
      mount.querySelector('[data-action="finish"]').addEventListener("click", function () { dispatchActivityAction(activity.id, "finish"); });
      mount.querySelector('[data-action="continue"]').addEventListener("click", function () { dispatchActivityAction(activity.id, "continue"); });
      mount.querySelector('[data-action="restart"]').addEventListener("click", function () { dispatchActivityAction(activity.id, "restart"); });
      if (activity.id === "letter-garden") {
        mount.querySelector('[data-action="continue"]').textContent = "Continue to Practice";
        mount.querySelector('[data-action="restart"]').textContent = "Play Letter Garden Again";
      }
    });
  }

  function initCompletionActions() {
    if (!ui.completionNextBtn) return;
    ui.completionNextBtn.addEventListener("click", function () {
      if (!isNextWorldUnlocked()) {
        window.location.href = "index.html#worlds";
        return;
      }
      const worldOrder = Array.isArray(window.SP_WORLD_ORDER) && window.SP_WORLD_ORDER.length
        ? window.SP_WORLD_ORDER
        : ["alphabet", "animals", "numbers", "colours", "words", "sentences", "stories", "culture"];
      const nextWorld = worldOrder[1];
      if (nextWorld) localStorage.setItem("sanskritParichay.lastWorld", nextWorld);
      window.location.href = nextWorld === "alphabet" ? "alphabet-forest.html" : "learning-world.html?world=" + nextWorld;
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
    const wasActivityComplete = Boolean(activity.isComplete);
    CORE.markCurrentItemCompleted(forestState, activityId, 1);
    if (activityId === "letter-garden") {
      reconcileLetterGardenProgress();
    }
    setActivityStatus(activityId, message);
    if (activity && activity.completedItems.length >= activity.order.length && !activity.isComplete) {
      const finalized = CORE.finalizeActivity(forestState, activityId);
      ensureActivityCompletionRewards(activityId, finalized);
    }
    if (ACTIVITY_META[activityId].type !== "tree") {
      if (activity.isComplete) {
        if (activityId === "letter-garden") {
          setActivityStatus(activityId, "Wonderful! You learned all the letters!");
          setMascotSpeech("Fantastic! You've completed this activity!", { priority: 4, holdMs: 4200, force: true, tone: "complete" });
        } else {
          setMascotSpeech(pickSpeech(COMPLETE_SPEECH, "activity-complete"), { priority: 4, holdMs: 4200, force: true, tone: "complete" });
        }
        setMascotStateForDuration("dancing", 950);
        fireConfetti(true);
        triggerFlowerRain(ACTIVITY_META[activityId].sectionId, { density: 28, durationMs: 3000 });
      } else {
        setMascotSpeech(pickSpeech(CORRECT_SPEECH, "activity-correct"), { priority: 3, holdMs: 3000, tone: "correct" });
        setMascotStateForDuration("celebrating", 650);
        if (!wasResolved && (ACTIVITY_META[activityId].type === "quiz" || ACTIVITY_META[activityId].type === "letter")) {
          scheduleAutoAdvance(activityId, sourceIndex, 900);
        }
      }
    }
    if (!wasActivityComplete && activity.isComplete && ACTIVITY_META[activityId].type !== "tree") {
      setActivityStatus(activityId, "Fantastic! You've completed this activity!");
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
      if (activityId === "letter-tracing" && !isCurrentResolved(activityId)) {
        if (!traceCanvasHasInk()) {
          setActivityStatus(activityId, "Draw the letter first, then tap Next.");
          saveAndRender();
          return;
        }
        markCurrentComplete(activityId, "Wonderful! Letter practised!");
      }
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
        setActivityStatus(activityId, "Finish all questions first, then tap Finish.");
        saveAndRender();
        return;
      }
      ensureActivityCompletionRewards(activityId, true);
      setActivityStatus(activityId, pickSpeech(COMPLETE_SPEECH, "finish-status"));
      fireConfetti(false);
      triggerFlowerRain(ACTIVITY_META[activityId].sectionId, { density: 26, durationMs: 2800 });
      setMascotStateForDuration("dancing", 900);
      setMascotSpeech(pickSpeech(COMPLETE_SPEECH, "finish-speech"), { priority: 4, holdMs: 4200, force: true, tone: "complete" });
      const global = CORE.computeGlobalProgress(forestState);
      if (global.completedActivityCount === global.totalActivities) {
        fireConfetti(true);
        setMascotSpeech(WORLD_UNLOCKED_SPEECH, { priority: 5, holdMs: 5000, force: true, tone: "world" });
      }
      saveAndRender();
      const completeNote = document.getElementById("complete-" + activityId);
      if (completeNote) completeNote.focus();
      return;
    }
    if (action === "restart") {
      if (activityId === "letter-garden") {
        CORE.resetActivity(forestState, activityId);
        forestState.activities[activityId].currentIndex = 0;
        setActivityStatus(activityId, "Let's practise again! Every try makes us better!");
        saveAndRender();
        return;
      }
      CORE.resetActivity(forestState, activityId);
      runtime.byActivity[activityId].optionOrderByQuestion = {};
      if (activityId === "letter-tracing") {
        clearTraceBoard();
      }
      setActivityStatus(activityId, "Let's practise again! Every try makes us better!");
      saveAndRender();
      return;
    }
    if (action === "continue") {
      const currentIndex = ACTIVITIES.findIndex(function (entry) { return entry.id === activityId; });
      const nextActivity = currentIndex >= 0 && currentIndex < ACTIVITIES.length - 1
        ? ACTIVITIES[currentIndex + 1]
        : null;
      const targetId = nextActivity ? nextActivity.sectionId : "completionScreen";
      const target = document.getElementById(targetId);
      if (target) scrollToActivity(target);
    }
  }

  function saveAndRender() {
    stateApi.saveState(forestState);
    if (typeof window.spSyncProgressModel === "function") {
      window.spSyncProgressModel(
        ["alphabet", "animals", "numbers", "colours", "words", "sentences", "stories", "culture"],
        { alphabet: 9, animals: 3, numbers: 3, colours: 3, words: 3, sentences: 3, stories: 3, culture: 3 }
      );
    }
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

  function getCurrentForestRewards() {
    const currentGems = Math.max(0, Math.floor(Number(forestState.gems || 0)));
    return {
      currentStars: Math.max(0, Math.floor(Number(forestState.xp || 0))),
      currentGems: currentGems
    };
  }

  function ensureActivityCompletionRewards(activityId, finalizedNow) {
    if (!finalizedNow) return;
    if (!forestState.completionRewarded[activityId]) {
      forestState.completionRewarded[activityId] = true;
    }
    forestState.xp += 5;
    forestState.gems = Math.max(0, Math.floor(Number(forestState.gems || 0))) + 1;
  }

  function isNextWorldUnlocked() {
    const rewards = getCurrentForestRewards();
    return rewards.currentStars >= UNLOCK_STAR_TARGET && rewards.currentGems >= UNLOCK_GEM_TARGET;
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

  function getUnlockHintText(unlocked, journey) {
    if (unlocked) return "Hooray! Your next adventure is ready!";
    return "Unlock target: " + journey.currentStars + "/" + UNLOCK_STAR_TARGET + " stars and "
      + journey.currentGems + "/" + UNLOCK_GEM_TARGET + " gems in Alphabet Forest.";
  }

  function renderGlobalProgress() {
    const journey = computeJourneyProgress();
    const rewards = getCurrentForestRewards();
    journey.currentStars = rewards.currentStars;
    journey.currentGems = rewards.currentGems;
    const unlocked = isNextWorldUnlocked();
    if (ui.globalSummary) ui.globalSummary.textContent = "Follow the journey and unlock your next adventure.";
    if (ui.learningProgressText) ui.learningProgressText.textContent = journey.learningCompletedCount + " of " + journey.learningTotal + " completed";
    if (ui.practiceProgressText) ui.practiceProgressText.textContent = journey.practiceCompletedCount + " practice games completed";
    if (ui.learningProgressFill) ui.learningProgressFill.style.width = ((journey.learningCompletedCount / journey.learningTotal) * 100).toFixed(1) + "%";
    if (ui.practiceProgressFill) ui.practiceProgressFill.style.width = ((journey.practiceCompletedCount / journey.practiceTotal) * 100).toFixed(1) + "%";
    if (ui.nextWorldStatus) ui.nextWorldStatus.textContent = unlocked ? "Unlocked" : "Locked";
    if (ui.unlockHintText) {
      ui.unlockHintText.textContent = getUnlockHintText(unlocked, journey);
    }
    if (ui.globalStars) ui.globalStars.textContent = String(forestState.xp);
    if (ui.globalGems) {
      const rewardsSnapshot = typeof window.spGetRewards === "function"
        ? window.spGetRewards(["alphabet", "animals", "numbers", "colours", "words", "sentences", "stories", "culture"], { alphabet: 9, animals: 3, numbers: 3, colours: 3, words: 3, sentences: 3, stories: 3, culture: 3 })
        : { gems: 0 };
      const gems = Number(rewardsSnapshot.gems || 0);
      ui.globalGems.textContent = String(Math.max(0, Math.floor(Number(gems) || 0)));
    }
  }

  function renderMagicalTree() {
    const activityId = "magical-tree";
    const activity = forestState.activities[activityId];
    if (!ui.treeLetters) return;
    activity.currentIndex = Math.max(0, Math.min(letters.length - 1, Number(activity.currentIndex || 0)));
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
      { x: 25, y: 38 }, { x: 40, y: 26 }, { x: 55, y: 31 }, { x: 69, y: 25 }, { x: 79, y: 39 }
    ];
    groupLetters.forEach(function (letter, offset) {
      const letterIndex = groupStart + offset;
      const slot = slots[offset] || { x: 50 + offset * 3, y: 34 + offset * 2 };
      const button = document.createElement("button");
      button.type = "button";
      button.className = "tree-letter-btn";
      button.style.left = slot.x + "%";
      button.style.top = slot.y + "%";
      button.innerHTML =
        '<span class="tree-ornament">' +
        '<span class="tree-petal-ring" aria-hidden="true"></span>' +
        '<span class="tree-fruit-body" aria-hidden="true"></span>' +
        '<span class="tree-dev">' + letter.symbol + "</span>" +
        "</span>";
      if (activity.completedItems.includes(letterIndex)) button.classList.add("discovered");
      if (activity.currentIndex === letterIndex) button.classList.add("tree-active");
      button.addEventListener("click", function () {
        activity.currentIndex = letterIndex;
        setMascotState("pointing");
        setMascotSpeech("Ready? Let's try this together!", { priority: 2, holdMs: 2200, tone: "instruction" });
        playLetterAudio(letter, 1, ui.treeStatus);
        moveTreeMithuTowardPercent(slot.x, slot.y);
        celebrateTreeMithu();
        button.classList.add("just-picked");
        window.setTimeout(function () { button.classList.remove("just-picked"); }, 650);
        if (!activity.completedItems.includes(letterIndex)) {
          CORE.markCurrentItemCompleted(forestState, activityId, 1);
          growTreeBloom(slot);
          playLottie("treeSparkle");
          setActivityStatus(activityId, "Wonderful! Letter discovered!");
          setMascotSpeech("Wonderful! You're doing great!", { priority: 3, holdMs: 3000, tone: "correct" });
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
              const finalized = CORE.finalizeActivity(forestState, activityId);
              ensureActivityCompletionRewards(activityId, finalized);
              setMascotState("dancing");
              fireConfetti(true);
              triggerFlowerRain("forestScene", { density: 30, durationMs: 3200 });
              playLottie("treeCelebrate");
              setMascotSpeech(WORLD_UNLOCKED_SPEECH, { priority: 5, holdMs: 5000, force: true, tone: "world" });
              setActivityStatus(activityId, pickSpeech(COMPLETE_SPEECH, "tree-complete"));
            }
          }
          saveAndRender();
          return;
        }
        saveAndRender();
      });
      button.addEventListener("pointerenter", function () {
        if (!ui.treeMithu) return;
        ui.treeMithu.classList.add("hovering");
        moveTreeMithuTowardPercent(slot.x, slot.y);
      });
      button.addEventListener("pointerleave", function () {
        if (!ui.treeMithu) return;
        ui.treeMithu.classList.remove("hovering");
      });
      ui.treeLetters.appendChild(button);
    });

    const currentLetter = getCurrentLetter(activityId);
    if (currentLetter) {
      if (ui.spotlightDev) ui.spotlightDev.textContent = currentLetter.symbol;
      if (ui.spotlightTran) ui.spotlightTran.textContent = currentLetter.transliteration;
      if (ui.spotlightExample) ui.spotlightExample.textContent = currentLetter.exampleText + " · " + currentLetter.meaning;
      const activeOffset = Math.max(0, Math.min(groupLetters.length - 1, activity.currentIndex - groupStart));
      const activeSlot = slots[activeOffset] || slots[0];
      if (activeSlot) moveTreeMithuTowardPercent(activeSlot.x, activeSlot.y);
    }
  }

  function growTreeBloom(slot) {
    const bloomContainer = document.getElementById("treeProgressBlooms");
    if (!bloomContainer) return;
    const bloom = document.createElement("span");
    bloom.className = "group-bloom";
    const baseX = slot && Number.isFinite(slot.x) ? slot.x : (20 + Math.random() * 60);
    const baseY = slot && Number.isFinite(slot.y) ? slot.y : (18 + Math.random() * 58);
    bloom.style.left = Math.max(12, Math.min(88, baseX + (Math.random() * 8 - 4))).toFixed(1) + "%";
    bloom.style.top = Math.max(14, Math.min(84, baseY + (Math.random() * 8 - 4))).toFixed(1) + "%";
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
    if (ui.letterGardenStatus) {
      ui.letterGardenStatus.textContent = runtime.byActivity[activityId].status || "";
    }
    if (ui.letterGardenCompletionActions) {
      ui.letterGardenCompletionActions.hidden = !activity.isComplete;
    }
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
          markCurrentComplete(activityId, pickSpeech(CORRECT_SPEECH, "hear-correct"));
        } else {
          btn.classList.add("wrong");
          incrementAttempt(activityId);
          ui.hearStatus.textContent = pickSpeech(INCORRECT_SPEECH, "hear-wrong");
          setMascotState("encouraging");
          setMascotSpeech(pickSpeech(INCORRECT_SPEECH, "hear-wrong-speech"), { priority: 3, holdMs: 3000, tone: "encourage" });
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
    ui.picturePrompt.textContent = "Select the correct picture for: " + item.sanskrit;
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
        '<span class="picture-label">' + toTitleCaseLabel(option.meaning || option.alt || option.sanskrit) + "</span>";
      btn.addEventListener("click", function () {
        cancelAutoAdvance(activityId);
        if (btn.disabled) return;
        ui.pictureChoices.querySelectorAll(".choice-btn").forEach(function (choice) { choice.classList.remove("selected"); });
        btn.classList.add("selected");
        if (option.id === item.id) {
          btn.classList.add("correct");
          ui.pictureChoices.querySelectorAll(".choice-btn").forEach(function (choice) { choice.disabled = true; });
          const wordLetter = letters.find(function (letter) { return letter.id === item.id; });
          if (wordLetter) playLetterAudio(wordLetter, 1, ui.pictureStatus);
          animate(btn, { transform: ["scale(1)", "scale(1.06)", "scale(1)"] }, { duration: 0.35, easing: "ease-out" });
          playSuccessSound("chime");
          fireConfetti(false);
          markCurrentComplete(activityId, "Correct! " + item.sanskrit + " means " + item.meaning + ".");
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
          setMascotSpeech(pickSpeech(INCORRECT_SPEECH, "picture-wrong"), { priority: 3, holdMs: 3000, tone: "encourage" });
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
    ui.feedPrompt.textContent = "Feed Mithu: choose " + item.sanskrit;
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
        '<span class="picture-label">' + option.sanskrit + "</span>";
      btn.addEventListener("click", function () {
        cancelAutoAdvance(activityId);
        ui.feedChoices.querySelectorAll(".choice-btn").forEach(function (choice) { choice.classList.remove("selected"); });
        btn.classList.add("selected");
        if (option.sanskrit === item.sanskrit) {
          animateFruitToMithu(btn);
          btn.classList.add("correct");
          markCurrentComplete(activityId, "Great! " + item.sanskrit + " means " + item.meaning + ".");
          setMascotState("eating");
        } else {
          btn.classList.add("wrong");
          incrementAttempt(activityId);
          ui.feedStatus.textContent = "Try a different fruit.";
          setMascotState("encouraging");
          setMascotSpeech(pickSpeech(INCORRECT_SPEECH, "feed-wrong"), { priority: 3, holdMs: 3000, tone: "encourage" });
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
    if (runtime.tracing.lastLetterIndex !== activity.currentIndex) {
      runtime.tracing.lastLetterIndex = activity.currentIndex;
      clearTraceBoard();
    }
    if (!isCurrentResolved(activityId)) {
      ui.traceStatus.textContent = runtime.byActivity[activityId].status || "Write the letter, then tap Next.";
    } else if (!runtime.byActivity[activityId].status) {
      ui.traceStatus.textContent = "Wonderful! This letter is practised. Continue when ready.";
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
          setMascotSpeech(pickSpeech(INCORRECT_SPEECH, "hunt-wrong"), { priority: 3, holdMs: 3000, tone: "encourage" });
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
      if (activity.id === "letter-tracing") {
        if (retry) retry.hidden = true;
        if (finish) {
          finish.hidden = true;
          finish.disabled = true;
        }
        if (continueBtn) {
          continueBtn.hidden = true;
          continueBtn.disabled = true;
        }
        if (restart) {
          restart.hidden = true;
          restart.disabled = true;
        }
        if (next) {
          next.hidden = false;
          next.disabled = false;
        }
        return;
      }
      if (next) {
        next.hidden = false;
        next.disabled = atLast || !resolved;
      }
      if (finish) {
        finish.hidden = true;
        finish.disabled = true;
      }
      if (continueBtn) {
        const nextActivity = ACTIVITIES.find(function (entry) { return entry.id === activity.id; });
        const hasNext = nextActivity ? ACTIVITIES.indexOf(nextActivity) < ACTIVITIES.length - 1 : false;
        continueBtn.textContent = hasNext ? "Continue to Next Activity" : "Continue Adventure";
        continueBtn.hidden = !state.isComplete;
        continueBtn.disabled = !state.isComplete;
      }
      if (restart) restart.disabled = false;
    });
  }

  function updateWorldCompletionPanels() {
    const journey = computeJourneyProgress();
    const rewards = getCurrentForestRewards();
    journey.currentStars = rewards.currentStars;
    journey.currentGems = rewards.currentGems;
    const unlocked = isNextWorldUnlocked();
    const wasCompleted = Boolean(forestState.worldCompleted);
    forestState.worldCompleted = unlocked;
    if (unlocked && !wasCompleted) {
      stateApi.saveState(forestState);
      const hasCelebrated = localStorage.getItem(UNLOCK_EVENT_KEY) === "true";
      localStorage.setItem(UNLOCK_INVITE_KEY, "visible");
      if (!hasCelebrated) {
        localStorage.setItem(UNLOCK_EVENT_KEY, "true");
        setMascotStateForDuration("dancing", 1250);
        setMascotSpeech("🌟 Hooray! You earned 50 stars and 1 gem! A magical new world is unlocked! Shall we explore it together? 🎉", { priority: 6, holdMs: 6500, force: true, tone: "world" });
        fireConfetti(true);
        fireSectionConfetti("completionScreen", true);
        triggerFlowerRain(document.getElementById("main-content"), { density: 24, durationMs: 2600 });
        playLottie("treeCelebrate");
      }
    }
    if (unlocked && localStorage.getItem(UNLOCK_INVITE_KEY) !== "dismissed") showUnlockInvite();
    else hideUnlockInvite();
    if (ui.nextWorldStatus) ui.nextWorldStatus.textContent = unlocked ? "Unlocked" : "Locked";
    if (ui.unlockHintText) {
      ui.unlockHintText.textContent = getUnlockHintText(unlocked, journey);
    }
    if (ui.completionScreen) ui.completionScreen.classList.toggle("show", unlocked);
    if (ui.completionTitle) ui.completionTitle.textContent = unlocked ? "Next World Unlocked!" : "Keep Going!";
    if (ui.completionMessage) {
      ui.completionMessage.textContent = unlocked
        ? "Mithu has unlocked your next world invitation."
        : getUnlockHintText(false, journey);
    }
    if (ui.completionStars) ui.completionStars.textContent = String(forestState.xp);
  }
})();
