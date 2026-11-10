(function initAlphabetForest() {
  const lesson = window.ALPHABET_LESSON;
  if (!lesson) return;

  const PROGRESS_KEY = "sanskritParichay.alphabetForest.progress";
  const HOME_KEY = "sanskritParichay.home.progress";
  const LAST_WORLD_KEY = "sanskritParichay.lastWorld";
  const TREE_PROGRESS_KEY = "sanskritParichay.alphabetForest.tree.progress";
  const TOTAL_ACTIVITIES = 7;
  const LESSONS = [
    { id: 0, name: "Sprout Lesson", objective: "Learn first 5 vowels", selector: { type: "vowel-range", start: 0, count: 5 } },
    { id: 1, name: "River Lesson", objective: "Learn remaining vowels and signs", selector: { type: "vowel-range", start: 5, count: 10 } },
    { id: 2, name: "Parrot Lesson", objective: "Learn क-वर्ग", selector: { type: "subgroup", subgroup: "ka-varga" } },
    { id: 3, name: "Moon Lesson", objective: "Learn च-वर्ग", selector: { type: "subgroup", subgroup: "ca-varga" } },
    { id: 4, name: "Sun Lesson", objective: "Learn ट-वर्ग and त-वर्ग", selector: { type: "subgroups", subgroups: ["tta-varga", "ta-varga"] } },
    { id: 5, name: "Rainbow Lesson", objective: "Learn प-वर्ग, अन्तःस्थाः, ऊष्माणः", selector: { type: "subgroups", subgroups: ["pa-varga", "antastha", "ushmana"] } }
  ];
  const SAFE_START = {
    stars: 0,
    streak: 0,
    lessonIndex: 0,
    done: { hear: false, picture: false, arrange: false, flash: false, feed: false, trace: false, hunt: false }
  };
  const FRUITS = [
    { dev: "सेवफलम्", transliteration: "sevaphalam", meaning: "apple", emoji: "🍎" },
    { dev: "कदलीफलम्", transliteration: "kadaliphalam", meaning: "banana", emoji: "🍌" },
    { dev: "आम्रम्", transliteration: "aamram", meaning: "mango", emoji: "🥭" },
    { dev: "द्राक्षा", transliteration: "draksha", meaning: "grapes", emoji: "🍇" }
  ];
  const motion = window.Motion || {};
  const animate = motion.animate || function () {};
  const LOCAL_AUDIO_ENABLED = true;
  const MIN_PRONUNCIATION_BYTES = 6000;
  const PRONUNCIATION_UNAVAILABLE = "Pronunciation not available yet.";
  const MUTED_AUDIO_MESSAGE = "Sound is muted. Tap Sound: Off to unmute.";
  const prefersReducedMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const audioAvailabilityCache = new Map();
  const LETTER_ART = {
    "अ": "🔥",
    "आ": "🌤️",
    "इ": "⚡",
    "ई": "🪔",
    "उ": "🌅",
    "ऊ": "🦉",
    "ऋ": "🌊",
    "ए": "🎯",
    "ऐ": "🌈",
    "ओ": "🕉️",
    "औ": "🌟"
  };
  const EXAMPLE_AUDIO_KEYS = {
    "अग्निः": "agnih",
    "आकाशः": "aakaashah",
    "एकः": "ekah",
    "कमलम्": "kamalam",
    "गजः": "gajah",
    "चन्द्रः": "chandrah",
    "नदी": "nadee",
    "माता": "maataa",
    "योगः": "yogah",
    "रथः": "rathah"
  };
  const GROUP_ORDER = ["vowels", "vowel-signs", "ka-varga", "ca-varga", "tta-varga", "ta-varga", "pa-varga", "antastha", "ushmana"];
  const GROUP_LABELS = {
    vowels: "Vowels (स्वराः)",
    "vowel-signs": "Signs (अं, अः)",
    "ka-varga": "क-वर्गः",
    "ca-varga": "च-वर्गः",
    "tta-varga": "ट-वर्गः",
    "ta-varga": "त-वर्गः",
    "pa-varga": "प-वर्गः",
    antastha: "अन्तःस्थाः",
    ushmana: "ऊष्माणः"
  };

  const ui = {
    audioDisclaimer: document.getElementById("audioDisclaimer"),
    audioDebug: document.getElementById("audioDebug"),
    testSoundBtn: document.getElementById("testSoundBtn"),
    lessonMascot: document.getElementById("lessonMascot"),
    lessonMascotSpeech: document.getElementById("lessonMascotSpeech"),
    magicalTreeLetters: document.getElementById("magicalTreeLetters"),
    treeCounter: document.getElementById("treeCounter"),
    treeStatus: document.getElementById("treeStatus"),
    lessonName: document.getElementById("lessonName"),
    lessonObjective: document.getElementById("lessonObjective"),
    lessonIndex: document.getElementById("lessonIndex"),
    prevLessonTopBtn: document.getElementById("prevLessonTopBtn"),
    nextLessonBtn: document.getElementById("nextLessonBtn"),
    nextLessonTopBtn: document.getElementById("nextLessonTopBtn"),
    continueAdventureTopBtn: document.getElementById("continueAdventureTopBtn"),
    backToWorldsTopBtn: document.getElementById("backToWorldsTopBtn"),
    replayLetterBtn: document.getElementById("replayLetterBtn"),
    slowLetterBtn: document.getElementById("slowLetterBtn"),
    letterCategoryTabs: document.querySelectorAll(".category-tab"),
    gardenCoverage: document.getElementById("gardenCoverage"),
    letterGrid: document.getElementById("letterGrid"),
    selectedDev: document.getElementById("selectedDev"),
    selectedTran: document.getElementById("selectedTran"),
    selectedExample: document.getElementById("selectedExample"),
    selectedExampleArt: document.getElementById("selectedExampleArt"),
    selectedMeaning: document.getElementById("selectedMeaning"),
    audioFallback: document.getElementById("audioFallback"),
    starCount: document.getElementById("starCount"),
    doneCount: document.getElementById("doneCount"),
    streakCount: document.getElementById("streakCount"),
    earnedStars: document.getElementById("earnedStars"),
    nextAdventureBtn: document.getElementById("nextAdventureBtn"),
    progressFill: document.getElementById("progressFill"),
    progressText: document.getElementById("progressText"),
    doneBanner: document.getElementById("doneBanner"),
    hearChoices: document.getElementById("hearChoices"),
    hearStatus: document.getElementById("hearStatus"),
    playHearPrompt: document.getElementById("playHearPrompt"),
    nextHear: document.getElementById("nextHear"),
    picturePrompt: document.getElementById("picturePrompt"),
    pictureChoices: document.getElementById("pictureChoices"),
    pictureStatus: document.getElementById("pictureStatus"),
    nextPicture: document.getElementById("nextPicture"),
    arrangePrompt: document.getElementById("arrangePrompt"),
    arrangeTiles: document.getElementById("arrangeTiles"),
    arrangeAnswer: document.getElementById("arrangeAnswer"),
    checkArrange: document.getElementById("checkArrange"),
    resetArrange: document.getElementById("resetArrange"),
    nextArrange: document.getElementById("nextArrange"),
    arrangeStatus: document.getElementById("arrangeStatus"),
    flipFlashcard: document.getElementById("flipFlashcard"),
    flashcard: document.getElementById("flashcard"),
    flashChoices: document.getElementById("flashChoices"),
    flashStatus: document.getElementById("flashStatus"),
    nextFlashcard: document.getElementById("nextFlashcard"),
    feedPrompt: document.getElementById("feedPrompt"),
    feedChoices: document.getElementById("feedChoices"),
    feedStatus: document.getElementById("feedStatus"),
    nextFeed: document.getElementById("nextFeed"),
    huntPrompt: document.getElementById("huntPrompt"),
    huntGrid: document.getElementById("huntGrid"),
    huntStatus: document.getElementById("huntStatus"),
    nextHunt: document.getElementById("nextHunt"),
    tracePrompt: document.getElementById("tracePrompt"),
    traceCanvas: document.getElementById("traceCanvas"),
    traceTargetLetter: document.getElementById("traceTargetLetter"),
    clearTraceBtn: document.getElementById("clearTraceBtn"),
    checkTraceBtn: document.getElementById("checkTraceBtn"),
    traceStatus: document.getElementById("traceStatus"),
    reviewList: document.getElementById("reviewList"),
    completionScreen: document.getElementById("completionScreen"),
    completionStars: document.getElementById("completionStars"),
    completionNextBtn: document.getElementById("completionNextBtn"),
    completionLottie: document.getElementById("completionLottie")
  };

  const state = {
    selectedLetter: null,
    progress: loadProgress(),
    hearIndex: 0,
    pictureIndex: 0,
    arrangeIndex: 0,
    flashIndex: 0,
    feedIndex: 0,
    huntIndex: 0,
    traceStrokeCount: 0,
    traceDrawing: false,
    letterCategory: "all",
    arrangeSelected: [],
    flashFront: true,
    lessonCelebrated: false,
    activeMascotSection: "",
    speechLockUntil: 0,
    treeDiscovered: new Set(),
    treeCompletionAwarded: false
  };

  let completionAnim = null;
  const canonicalLetters = buildCanonicalInventory();
  const inventoryById = new Map(canonicalLetters.map(function (item) { return [item.id, item]; }));
  state.selectedLetter = canonicalLetters[0] || lesson.letters[0];

  function currentLesson() {
    return LESSONS[Math.max(0, Math.min(LESSONS.length - 1, state.progress.lessonIndex || 0))];
  }

  function buildCanonicalInventory() {
    if (window.SP_PDF_LETTER_INVENTORY && Array.isArray(window.SP_PDF_LETTER_INVENTORY.items)) {
      return window.SP_PDF_LETTER_INVENTORY.items.map(function (item, index) {
        const example = item.example || {};
        return {
          id: item.id,
          order: index,
          devanagari: item.symbol,
          transliteration: item.transliteration,
          example: example.sanskrit || item.symbol,
          meaning: example.meaning || "Needs review",
          audioKey: item.pronunciation && item.pronunciation.audioKey ? item.pronunciation.audioKey : item.transliteration,
          category: item.category,
          subgroup: item.subgroup,
          varga: item.varga,
          sourcePage: item.sourcePage,
          reviewStatus: item.sanskritReviewStatus
        };
      });
    }
    if (Array.isArray(lesson.letters) && lesson.letters.length) {
      return lesson.letters.map(function (entry, index) {
        return {
          id: "legacy-" + index + "-" + entry.transliteration,
          order: index,
          devanagari: entry.devanagari,
          transliteration: entry.transliteration,
          example: entry.example,
          meaning: entry.meaning,
          audioKey: entry.transliteration,
          category: letterCategory(entry),
          subgroup: "legacy",
          varga: "Legacy",
          sourcePage: null,
          reviewStatus: "legacy_import_needs_review"
        };
      });
    }
    return [];
  }

  function lessonLetters() {
    const current = currentLesson();
    const selector = current.selector || {};
    const vowelsAndSigns = canonicalLetters.filter(function (item) {
      return item.category === "vowel" || item.category === "sign";
    });
    if (selector.type === "vowel-range") {
      const subset = vowelsAndSigns.slice(selector.start, selector.start + selector.count);
      return subset.length ? subset : canonicalLetters.slice(0, Math.min(8, canonicalLetters.length));
    }
    if (selector.type === "subgroup") {
      const subset = canonicalLetters.filter(function (item) {
        return item.subgroup === selector.subgroup;
      });
      return subset.length ? subset : canonicalLetters.slice(0, Math.min(8, canonicalLetters.length));
    }
    if (selector.type === "subgroups") {
      const allowed = new Set(selector.subgroups || []);
      const subset = canonicalLetters.filter(function (item) {
        return allowed.has(item.subgroup);
      });
      return subset.length ? subset : canonicalLetters.slice(0, Math.min(8, canonicalLetters.length));
    }
    return canonicalLetters.slice(0, Math.min(8, canonicalLetters.length));
  }

  function letterCategory(letter) {
    if (letter.category === "vowel") return "vowels";
    if (letter.category === "sign") return "signs";
    if (letter.category === "consonant") return "consonants";
    if (letter.subgroup === "combinations") return "combinations";
    const vowels = new Set(["अ", "आ", "इ", "ई", "उ", "ऊ", "ऋ", "ॠ", "ऌ", "ए", "ऐ", "ओ", "औ"]);
    const signs = new Set(["अं", "अः"]);
    if (vowels.has(letter.devanagari)) return "vowels";
    if (signs.has(letter.devanagari)) return "signs";
    return "consonants";
  }

  function visibleGardenLetters() {
    const letters = canonicalLetters.slice();
    if (state.letterCategory === "all") return letters;
    return letters.filter(function (l) {
      return letterCategory(l) === state.letterCategory;
    });
  }

  function cloneSafeStart() {
    return JSON.parse(JSON.stringify(SAFE_START));
  }

  function mascotParts() {
    return {
      body: ui.lessonMascot.querySelector(".mithu-body"),
      wingLeft: ui.lessonMascot.querySelector(".mithu-wing-left"),
      wingRight: ui.lessonMascot.querySelector(".mithu-wing-right"),
      eyeLeft: ui.lessonMascot.querySelector(".mithu-eye-left"),
      eyeRight: ui.lessonMascot.querySelector(".mithu-eye-right"),
      tail: ui.lessonMascot.querySelector(".mithu-tail")
    };
  }

  function setMascotSpeech(text, lockMs) {
    if (ui.lessonMascotSpeech) ui.lessonMascotSpeech.textContent = text;
    if (lockMs !== 0) {
      state.speechLockUntil = Date.now() + (lockMs || 1400);
    }
  }

  function setMascotState(kind) {
    const p = mascotParts();
    if (!p.body) return;
    if (kind === "idle") {
      animate(p.body, { transform: ["translateY(0px)", "translateY(-2px)", "translateY(0px)"] }, { duration: 2.2, repeat: Infinity, easing: "ease-in-out" });
      animate([p.eyeLeft, p.eyeRight], { transform: ["scaleY(1)", "scaleY(0.2)", "scaleY(1)"] }, { duration: 4.5, repeat: Infinity, easing: "ease-in-out" });
      animate(p.tail, { transform: ["rotate(0deg)", "rotate(7deg)", "rotate(0deg)"] }, { duration: 2, repeat: Infinity, easing: "ease-in-out" });
    } else if (kind === "greeting") {
      animate(p.wingRight, { transform: ["rotate(0deg)", "rotate(26deg)", "rotate(0deg)"] }, { duration: 0.6, repeat: 2, easing: "ease-in-out" });
    } else if (kind === "flying") {
      animate(ui.lessonMascot, { transform: ["translateX(0px) translateY(0px)", "translateX(12px) translateY(-6px)", "translateX(0px) translateY(0px)"] }, { duration: 0.8, easing: "ease-in-out" });
      animate([p.wingLeft, p.wingRight], { transform: ["rotate(0deg)", "rotate(30deg)", "rotate(0deg)"] }, { duration: 0.3, repeat: 2, easing: "ease-in-out" });
    } else if (kind === "listening") {
      animate(p.body, { transform: ["rotate(0deg)", "rotate(2deg)", "rotate(0deg)"] }, { duration: 0.7, easing: "ease-in-out" });
    } else if (kind === "pointing") {
      animate(p.wingRight, { transform: ["rotate(0deg)", "rotate(24deg)", "rotate(16deg)", "rotate(0deg)"] }, { duration: 0.75, easing: "ease-in-out" });
    } else if (kind === "thinking") {
      animate(p.body, { transform: ["rotate(0deg)", "rotate(-4deg)", "rotate(0deg)"] }, { duration: 0.8, easing: "ease-in-out" });
    } else if (kind === "encouraging") {
      animate(p.body, { transform: ["translateY(0px)", "translateY(-4px)", "translateY(0px)"] }, { duration: 0.6, easing: "ease-in-out" });
    } else if (kind === "eating") {
      animate(p.body, { transform: ["translateY(0px)", "translateY(-3px)", "translateY(0px)", "translateY(-2px)", "translateY(0px)"] }, { duration: 0.8, easing: "ease-in-out" });
      const beakTop = ui.lessonMascot.querySelector(".mithu-beak-top");
      const beakBottom = ui.lessonMascot.querySelector(".mithu-beak-bottom");
      animate(beakTop, { transform: ["rotate(0deg)", "rotate(-10deg)", "rotate(0deg)"] }, { duration: 0.36, easing: "ease-in-out" });
      animate(beakBottom, { transform: ["rotate(0deg)", "rotate(14deg)", "rotate(0deg)"] }, { duration: 0.36, easing: "ease-in-out" });
    } else if (kind === "correct") {
      animate(ui.lessonMascot, { transform: ["translateX(0px)", "translateX(20px)", "translateX(0px)"] }, { duration: 0.6, easing: "ease-out" });
      animate(p.body, { transform: ["translateY(0px)", "translateY(-14px)", "translateY(0px)"] }, { duration: 0.5, easing: "ease-out" });
      animate([p.wingLeft, p.wingRight], { transform: ["rotate(0deg)", "rotate(22deg)", "rotate(0deg)"] }, { duration: 0.45, easing: "ease-out" });
    } else if (kind === "celebrating") {
      animate(ui.lessonMascot, { transform: ["translateY(0px)", "translateY(-10px)", "translateY(0px)"] }, { duration: 0.5, easing: "ease-out" });
      animate([p.wingLeft, p.wingRight], { transform: ["rotate(0deg)", "rotate(30deg)", "rotate(0deg)"] }, { duration: 0.4, repeat: 2, easing: "ease-in-out" });
    } else if (kind === "incorrect") {
      animate(p.body, { transform: ["rotate(0deg)", "rotate(3deg)", "rotate(-3deg)", "rotate(0deg)"] }, { duration: 0.7, easing: "ease-in-out" });
    } else if (kind === "dance" || kind === "dancing") {
      animate(p.body, { transform: ["translateY(0px) rotate(0deg)", "translateY(-8px) rotate(5deg)", "translateY(0px) rotate(-5deg)", "translateY(0px) rotate(0deg)"] }, { duration: 1.2, repeat: 2, easing: "ease-in-out" });
      animate([p.wingLeft, p.wingRight], { transform: ["rotate(0deg)", "rotate(28deg)", "rotate(0deg)"] }, { duration: 0.5, repeat: 3, easing: "ease-in-out" });
    }
  }

  function initLottie() {
    if (!window.lottie || !ui.completionLottie) return;
    completionAnim = window.lottie.loadAnimation({
      container: ui.completionLottie,
      renderer: "svg",
      loop: false,
      autoplay: false,
      path: "assets/lottie/celebration.json"
    });
  }

  function loadProgress() {
    try {
      const raw = localStorage.getItem(PROGRESS_KEY);
      if (!raw) return cloneSafeStart();
      const parsed = JSON.parse(raw);
      return {
        stars: Number(parsed.stars || 0),
        streak: Number(parsed.streak || 0),
        lessonIndex: Number(parsed.lessonIndex || 0),
        done: {
          hear: Boolean(parsed.done && parsed.done.hear),
          picture: Boolean(parsed.done && parsed.done.picture),
          arrange: Boolean(parsed.done && parsed.done.arrange),
          flash: Boolean(parsed.done && parsed.done.flash),
          feed: Boolean(parsed.done && parsed.done.feed),
          trace: Boolean(parsed.done && parsed.done.trace),
          hunt: Boolean(parsed.done && parsed.done.hunt)
        }
      };
    } catch (error) {
      return cloneSafeStart();
    }
  }

  function saveProgress() {
    localStorage.setItem(PROGRESS_KEY, JSON.stringify(state.progress));
  }

  function updateHomeXp(xp) {
    try {
      const raw = localStorage.getItem(HOME_KEY);
      const home = raw ? JSON.parse(raw) : { xp: 0, completed: [] };
      home.xp = Number(home.xp || 0) + xp;
      localStorage.setItem(HOME_KEY, JSON.stringify(home));
    } catch (error) {
      console.warn("Unable to update home XP.", error);
    }
  }

  function animateChoiceCard(el, correct) {
    if (!el) return;
    if (correct) {
      animate(el, { transform: ["scale(1)", "scale(1.08)", "scale(1)"] }, { duration: 0.32, easing: "ease-out" });
    } else {
      animate(el, { transform: ["translateX(0px)", "translateX(-6px)", "translateX(6px)", "translateX(0px)"] }, { duration: 0.36, easing: "ease-in-out" });
    }
  }

  function celebrateSmall() {
    if (window.confetti && !prefersReducedMotion && !(window.SP_STATE && window.SP_STATE.muted)) {
      window.confetti({ particleCount: 14, spread: 36, startVelocity: 16, ticks: 60, origin: { y: 0.76 }, colors: ["#ffd166", "#4cc9f0"] });
    }
    if (window.spSuccessTone) window.spSuccessTone();
  }

  function celebrateBig() {
    if (window.confetti && !prefersReducedMotion && !(window.SP_STATE && window.SP_STATE.muted)) {
      window.confetti({ particleCount: 120, spread: 75, startVelocity: 32, ticks: 130, origin: { y: 0.65 }, colors: ["#ffd166", "#ff7eb6", "#7f5cff", "#2ec4b6"] });
      window.confetti({ particleCount: 80, spread: 65, startVelocity: 26, ticks: 120, origin: { x: 0.2, y: 0.7 } });
      window.confetti({ particleCount: 80, spread: 65, startVelocity: 26, ticks: 120, origin: { x: 0.8, y: 0.7 } });
    }
    if (window.spApplause) window.spApplause();
  }

  function resolveAudioAvailability(src, callback) {
    if (audioAvailabilityCache.has(src)) {
      callback(audioAvailabilityCache.get(src));
      return;
    }
    const controller = new AbortController();
    const timeout = setTimeout(function () {
      controller.abort();
    }, 1400);
    fetch(src, { method: "GET", cache: "no-store", signal: controller.signal })
      .then(function (response) {
        if (!response.ok) return null;
        return response.blob();
      })
      .then(function (blob) {
        if (!blob) return false;
        return blob.size >= MIN_PRONUNCIATION_BYTES;
      })
      .catch(function () {
        return false;
      })
      .then(function (available) {
        clearTimeout(timeout);
        audioAvailabilityCache.set(src, available);
        callback(available);
      });
  }

  function resolvePronunciationSource(key, callback) {
    const base = "assets/audio/pronunciation/" + key;
    const candidates = [base + ".mp3", base + ".wav"];
    function tryIndex(index) {
      if (index >= candidates.length) {
        callback(null);
        return;
      }
      const src = candidates[index];
      resolveAudioAvailability(src, function (available) {
        if (available) {
          callback(src);
          return;
        }
        tryIndex(index + 1);
      });
    }
    tryIndex(0);
  }

  function playLocalPronunciation(key, onFail, playbackRate, onSuccess) {
    let failed = false;
    function failover() {
      if (failed) return;
      failed = true;
      if (onFail) onFail("missing");
    }

    if (window.SP_STATE && window.SP_STATE.muted) {
      if (onFail) onFail("muted");
      return;
    }
    if (!LOCAL_AUDIO_ENABLED) {
      if (onFail) onFail("disabled");
      return;
    }
    if (!key) {
      if (onFail) onFail("missing");
      return;
    }
    resolvePronunciationSource(key, function (src) {
      if (!src) {
        failover();
        return;
      }
      const audio = new Audio(src);
      audio.preload = "auto";
      audio.volume = 1;
      audio.playbackRate = playbackRate || 1;
      audio.addEventListener("error", failover, { once: true });
      audio.addEventListener("stalled", failover, { once: true });
      audio.addEventListener("playing", function () {
        if (onSuccess) onSuccess();
      }, { once: true });
      const playAttempt = audio.play();
      if (playAttempt && typeof playAttempt.catch === "function") {
        playAttempt.catch(failover);
      }
    });
  }

  function speakSelectedLetter() {
    const letter = state.selectedLetter;
    ui.audioFallback.textContent = "Playing pronunciation...";
    setMascotState("listening");
    playLocalPronunciation(
      letter.audioKey || letter.transliteration,
      function (reason) {
        ui.audioFallback.textContent = reason === "muted" ? MUTED_AUDIO_MESSAGE : PRONUNCIATION_UNAVAILABLE;
      },
      1,
      function () {
        ui.audioFallback.textContent = "";
      }
    );
    setTimeout(function () {
      if (ui.audioFallback.textContent === "Playing pronunciation...") {
        ui.audioFallback.textContent = "";
      }
    }, 900);
  }

  function speakSelectedLetterSlow() {
    const letter = state.selectedLetter;
    ui.audioFallback.textContent = "Playing slow pronunciation...";
    setMascotState("listening");
    playLocalPronunciation(
      letter.audioKey || letter.transliteration,
      function (reason) {
        ui.audioFallback.textContent = reason === "muted" ? MUTED_AUDIO_MESSAGE : PRONUNCIATION_UNAVAILABLE;
      },
      0.72,
      function () {
        ui.audioFallback.textContent = "";
      }
    );
    setTimeout(function () {
      if (ui.audioFallback.textContent === "Playing slow pronunciation...") {
        ui.audioFallback.textContent = "";
      }
    }, 1400);
  }

  function speakText(textKey, _displayText, fallbackEl) {
    playLocalPronunciation(
      textKey,
      function (reason) {
        if (fallbackEl) fallbackEl.textContent = reason === "muted" ? MUTED_AUDIO_MESSAGE : PRONUNCIATION_UNAVAILABLE;
      },
      1,
      function () {
        if (fallbackEl) fallbackEl.textContent = "";
      }
    );
  }

  function playPromptLetter(promptLetter) {
    const match = canonicalLetters.find(function (entry) {
      return entry.devanagari === promptLetter;
    });
    const key = match ? match.audioKey : promptLetter;
    playLocalPronunciation(
      key,
      function (reason) {
        ui.hearStatus.textContent = reason === "muted" ? MUTED_AUDIO_MESSAGE : PRONUNCIATION_UNAVAILABLE;
      },
      1,
      function () {
        ui.hearStatus.textContent = "";
      }
    );
  }

  function runAudioTest() {
    const demo = new Audio("assets/audio/reference/swara-sanskrit.mp3");
    demo.play().then(function () {
      ui.audioFallback.textContent = "";
    }).catch(function () {
      ui.audioFallback.textContent = PRONUNCIATION_UNAVAILABLE;
    });
    renderAudioDebug();
  }

  function audioKeyForText(text) {
    if (!text) return null;
    const letter = canonicalLetters.find(function (entry) {
      return entry.devanagari === text;
    });
    if (letter) return letter.audioKey || letter.transliteration;
    if (EXAMPLE_AUDIO_KEYS[text]) return EXAMPLE_AUDIO_KEYS[text];
    const fruit = FRUITS.find(function (item) {
      return item.dev === text;
    });
    if (fruit) return fruit.transliteration;
    return null;
  }

  function handleCorrect(activityId, stars, statusEl, message, targetEl) {
    animateChoiceCard(targetEl, true);
    state.progress.streak += 1;
    state.progress.stars += stars;
    updateHomeXp(8);
    if (!state.progress.done[activityId]) {
      state.progress.done[activityId] = true;
      state.progress.stars += 1;
    }
    saveProgress();
    renderProgress();
    setMascotState("correct");
    setMascotSpeech("Wonderful! That answer is correct.");
    celebrateSmall();
    if (statusEl) statusEl.textContent = message;
  }

  function handleWrong(statusEl, message, targetEl, hint) {
    animateChoiceCard(targetEl, false);
    state.progress.streak = 0;
    saveProgress();
    renderProgress();
    setMascotState("incorrect");
    setMascotSpeech("Nice try. " + hint);
    if (statusEl) statusEl.textContent = message + " Hint: " + hint;
  }

  function resetActivityFlags() {
    state.progress.done = { hear: false, picture: false, arrange: false, flash: false, feed: false, trace: false, hunt: false };
  }

  function renderProgress() {
    const doneTotal = Object.values(state.progress.done).filter(Boolean).length;
    ui.starCount.textContent = String(state.progress.stars);
    ui.doneCount.textContent = String(doneTotal);
    ui.streakCount.textContent = String(state.progress.streak);
    ui.progressFill.style.width = Math.round((doneTotal / TOTAL_ACTIVITIES) * 100) + "%";

    if (doneTotal >= TOTAL_ACTIVITIES) {
      const isLastLesson = state.progress.lessonIndex >= LESSONS.length - 1;
      ui.doneBanner.classList.add("show");
      ui.progressText.textContent = isLastLesson
        ? "Legendary! You completed all Alphabet Forest activities."
        : "Great! Lesson complete. Unlock the next lesson.";
      if (ui.nextLessonTopBtn) {
        ui.nextLessonTopBtn.disabled = isLastLesson;
        ui.nextLessonTopBtn.textContent = isLastLesson
          ? "All Alphabet Forest lessons completed"
          : "Next Lesson Ready";
      }
      if (ui.nextLessonBtn) {
        ui.nextLessonBtn.style.display = isLastLesson ? "none" : "inline-block";
      }
      if (isLastLesson) onLessonComplete();
    } else {
      ui.progressText.textContent = "Keep going! Finish all activities to complete this lesson.";
      ui.doneBanner.classList.remove("show");
      ui.completionScreen.classList.remove("show");
      state.lessonCelebrated = false;
      if (ui.nextLessonTopBtn) {
        ui.nextLessonTopBtn.disabled = true;
        ui.nextLessonTopBtn.textContent = "Next Lesson (complete all activities)";
      }
      if (ui.nextLessonBtn) ui.nextLessonBtn.style.display = "none";
    }
  }

  function onLessonComplete() {
    if (state.lessonCelebrated) return;
    state.lessonCelebrated = true;
    setMascotState(prefersReducedMotion ? "celebrating" : "dancing");
    setMascotSpeech("Adventure complete! Let's celebrate!");
    celebrateBig();
    if (ui.earnedStars) ui.earnedStars.textContent = " Earned Stars: " + state.progress.stars;
    if (ui.completionStars) ui.completionStars.textContent = String(state.progress.stars);
    if (ui.completionScreen) ui.completionScreen.classList.add("show");
    if (completionAnim) completionAnim.goToAndPlay(0, true);
  }

  function renderLessonHeader() {
    const current = currentLesson();
    if (ui.lessonName) ui.lessonName.textContent = current.name;
    if (ui.lessonObjective) ui.lessonObjective.textContent = current.objective;
    if (ui.lessonIndex) ui.lessonIndex.textContent = "Lesson " + (state.progress.lessonIndex + 1) + " of " + LESSONS.length;
    if (ui.prevLessonTopBtn) ui.prevLessonTopBtn.disabled = state.progress.lessonIndex === 0;
  }

  function renderLetterDetail(letter) {
    if (!letter) return;
    state.selectedLetter = letter;
    ui.selectedDev.textContent = letter.devanagari;
    ui.selectedTran.textContent = letter.transliteration;
    ui.selectedExample.textContent = letter.example || letter.devanagari;
    ui.selectedMeaning.textContent = letter.meaning || "Needs Sanskrit review";
    if (ui.selectedExampleArt) ui.selectedExampleArt.textContent = LETTER_ART[letter.devanagari] || "🌼";
    ui.selectedDev.setAttribute("data-sanskrit", letter.devanagari);
    ui.selectedExample.setAttribute("data-sanskrit", letter.example || letter.devanagari);
    ui.audioFallback.textContent = "";
  }

  function renderLetterGrid() {
    const letters = visibleGardenLetters();
    if (!letters.some(function (l) { return l.devanagari === state.selectedLetter.devanagari; })) {
      state.selectedLetter = letters[0];
    }
    ui.letterGrid.innerHTML = "";
    if (ui.gardenCoverage) {
      ui.gardenCoverage.textContent = "Showing " + letters.length + " of " + canonicalLetters.length + " PDF inventory items";
    }

    const grouped = {};
    letters.forEach(function (letter) {
      const key = letter.category === "consonant" ? letter.subgroup : (letter.varga === "vowel-signs" ? "vowel-signs" : "vowels");
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(letter);
    });

    GROUP_ORDER.forEach(function (groupKey) {
      if (!grouped[groupKey] || grouped[groupKey].length === 0) return;
      const section = document.createElement("section");
      section.className = "letter-group";
      const heading = document.createElement("h3");
      heading.className = "letter-group-title";
      heading.textContent = GROUP_LABELS[groupKey] || groupKey;
      section.appendChild(heading);
      const groupGrid = document.createElement("div");
      groupGrid.className = "letter-group-grid";
      grouped[groupKey].forEach(function (letter) {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "letter-btn";
        button.setAttribute("data-letter-id", letter.id);
        button.setAttribute("aria-label", "Hear " + letter.devanagari + ", " + letter.transliteration);
        if (letter.devanagari === state.selectedLetter.devanagari) button.classList.add("active");
        button.innerHTML =
          '<span class="flower-core" aria-hidden="true"></span>' +
          '<span class="dev">' + letter.devanagari + "</span>" +
          '<span class="tran">' + letter.transliteration + "</span>";
        button.addEventListener("click", function () {
          animate(button, { transform: ["scale(1)", "scale(1.08)", "scale(1)"] }, { duration: 0.32, easing: "ease-out" });
          renderLetterDetail(letter);
          renderLetterGrid();
          setMascotState("pointing");
          speakSelectedLetter();
          setMascotSpeech("Great choice. Listen to the pronunciation.");
        });
        groupGrid.appendChild(button);
      });
      section.appendChild(groupGrid);
      ui.letterGrid.appendChild(section);
    });
    if (!state.selectedLetter && letters.length) {
      state.selectedLetter = letters[0];
    }
    renderLetterDetail(state.selectedLetter);
  }

  function loadTreeProgress() {
    try {
      const raw = localStorage.getItem(TREE_PROGRESS_KEY);
      if (!raw) return { discoveredIds: [], completionAwarded: false };
      const parsed = JSON.parse(raw);
      return {
        discoveredIds: Array.isArray(parsed.discoveredIds) ? parsed.discoveredIds : [],
        completionAwarded: Boolean(parsed.completionAwarded)
      };
    } catch (_error) {
      return { discoveredIds: [], completionAwarded: false };
    }
  }

  function saveTreeProgress() {
    localStorage.setItem(
      TREE_PROGRESS_KEY,
      JSON.stringify({
        discoveredIds: Array.from(state.treeDiscovered),
        completionAwarded: state.treeCompletionAwarded
      })
    );
  }

  function renderTreeCounter() {
    if (!ui.treeCounter) return;
    ui.treeCounter.textContent =
      "Discovered " + state.treeDiscovered.size + " of " + canonicalLetters.length + " PDF letters";
  }

  function handleTreeCompletionOnce() {
    if (state.treeCompletionAwarded) return;
    if (state.treeDiscovered.size < canonicalLetters.length) return;
    state.treeCompletionAwarded = true;
    state.progress.stars += 5;
    updateHomeXp(20);
    saveProgress();
    saveTreeProgress();
    renderProgress();
    setMascotState("dancing");
    setMascotSpeech("Magical Tree complete! You discovered every PDF letter.");
    celebrateSmall();
    if (ui.treeStatus) ui.treeStatus.textContent = "Tree complete! +5 stars awarded once.";
  }

  function renderMagicalTree() {
    if (!ui.magicalTreeLetters) return;
    ui.magicalTreeLetters.innerHTML = "";
    canonicalLetters.forEach(function (letter) {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "tree-letter-btn";
      button.setAttribute("data-tree-id", letter.id);
      button.setAttribute("data-sanskrit", letter.devanagari);
      button.setAttribute("aria-label", "Hear " + letter.devanagari + ", " + letter.transliteration);
      button.innerHTML = '<span class="tree-dev">' + letter.devanagari + '</span><span class="tree-tran">' + letter.transliteration + "</span>";
      if (state.treeDiscovered.has(letter.id)) button.classList.add("discovered");
      ui.magicalTreeLetters.appendChild(button);
    });
    renderTreeCounter();
  }

  function activateTreeLetterByButton(button) {
    const letterId = button.getAttribute("data-tree-id");
    const letter = inventoryById.get(letterId);
    if (!letter) {
      if (ui.treeStatus) ui.treeStatus.textContent = "Letter data missing for selected tree button.";
      return;
    }
    animate(button, { transform: ["scale(1)", "scale(1.12)", "scale(1)"] }, { duration: 0.34, easing: "ease-out" });
    renderLetterDetail(letter);
    setMascotState("pointing");
    setMascotSpeech("Listening to " + letter.devanagari + ".", 1200);
    speakSelectedLetter();
    if (!state.treeDiscovered.has(letter.id)) {
      state.treeDiscovered.add(letter.id);
      button.classList.add("discovered");
      saveTreeProgress();
      renderTreeCounter();
    }
    if (ui.treeStatus) {
      ui.treeStatus.textContent = "Selected " + letter.devanagari + " (" + letter.transliteration + ").";
      setTimeout(function () {
        if (ui.audioFallback && ui.audioFallback.textContent) {
          ui.treeStatus.textContent = ui.audioFallback.textContent;
        }
      }, 180);
    }
    handleTreeCompletionOnce();
  }

  function buildHearPrompt() {
    const letters = lessonLetters();
    const target = letters[state.hearIndex % letters.length];
    const shuffled = letters.slice().sort(function () { return Math.random() - 0.5; }).slice(0, 2);
    const options = [target.devanagari].concat(shuffled.map(function (x) { return x.devanagari; }));
    return { letter: target.devanagari, options: Array.from(new Set(options)).slice(0, 3).sort(function () { return Math.random() - 0.5; }) };
  }

  function setupHearAndPick() {
    const prompt = buildHearPrompt();
    state.currentHearPrompt = prompt;
    ui.hearChoices.innerHTML = "";
    ui.hearStatus.textContent = state.progress.done.hear ? "Completed for this lesson." : "";
    ui.nextHear.disabled = state.progress.done.hear;
    prompt.options.forEach(function (option) {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "choice-btn";
      button.textContent = option;
      if (state.progress.done.hear) {
        button.disabled = true;
        if (option === prompt.letter) button.classList.add("correct");
      }
      button.addEventListener("click", function () {
        if (state.progress.done.hear) return;
        if (option === prompt.letter) {
          button.classList.add("correct");
          handleCorrect("hear", 2, ui.hearStatus, "Great listening! +2 stars", button);
          ui.nextHear.disabled = true;
        } else {
          button.classList.add("wrong");
          handleWrong(ui.hearStatus, "Nice try.", button, "Listen once more and look for the first sound.");
        }
      });
      ui.hearChoices.appendChild(button);
    });
  }

  function setupPictureMatch() {
    const item = lesson.activities.pictureMatch[state.pictureIndex % lesson.activities.pictureMatch.length];
    ui.picturePrompt.textContent = "Match: " + item.emoji + " " + item.meaning;
    ui.pictureChoices.innerHTML = "";
    ui.pictureStatus.textContent = state.progress.done.picture ? "Completed for this lesson." : "";
    ui.nextPicture.disabled = state.progress.done.picture;
    item.options.forEach(function (option) {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "choice-btn";
      button.textContent = option;
      if (state.progress.done.picture) {
        button.disabled = true;
        if (option === item.answer) button.classList.add("correct");
      }
      button.addEventListener("click", function () {
        if (state.progress.done.picture) return;
        speakText(audioKeyForText(option), option, ui.pictureStatus);
        if (option === item.answer) {
          button.classList.add("correct");
          handleCorrect("picture", 2, ui.pictureStatus, "Correct match! +2 stars", button);
          ui.nextPicture.disabled = true;
        } else {
          button.classList.add("wrong");
          handleWrong(ui.pictureStatus, "Not yet.", button, "Try the word that best matches the picture.");
        }
      });
      ui.pictureChoices.appendChild(button);
    });
  }

  function setupArrangeWord() {
    const item = lesson.activities.arrangeWord[state.arrangeIndex % lesson.activities.arrangeWord.length];
    ui.arrangePrompt.textContent = "Build the Sanskrit word for: " + item.meaning;
    ui.arrangeTiles.innerHTML = "";
    ui.arrangeStatus.textContent = state.progress.done.arrange ? "Completed for this lesson." : "";
    state.arrangeSelected = [];
    ui.arrangeAnswer.textContent = "";
    ui.checkArrange.disabled = state.progress.done.arrange;
    ui.resetArrange.disabled = state.progress.done.arrange;
    ui.nextArrange.disabled = state.progress.done.arrange;
    item.tiles.forEach(function (tile) {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "tile-btn";
      button.textContent = tile;
      if (state.progress.done.arrange) {
        button.disabled = true;
      }
      button.addEventListener("click", function () {
        if (state.progress.done.arrange) return;
        if (button.disabled) return;
        button.disabled = true;
        state.arrangeSelected.push(tile);
        ui.arrangeAnswer.textContent = state.arrangeSelected.join("");
      });
      ui.arrangeTiles.appendChild(button);
    });
  }

  function setupFlashcard() {
    const item = lesson.activities.flashcards[state.flashIndex % lesson.activities.flashcards.length];
    state.flashFront = true;
    ui.flashStatus.textContent = state.progress.done.flash ? "Completed for this lesson." : "";
    ui.flashChoices.innerHTML = "";
    ui.flipFlashcard.disabled = state.progress.done.flash;
    ui.nextFlashcard.disabled = state.progress.done.flash;
    renderFlashcard();
    item.options.forEach(function (option) {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "choice-btn";
      button.textContent = option;
      if (state.progress.done.flash) {
        button.disabled = true;
        if (option === item.meaning) button.classList.add("correct");
      }
      button.addEventListener("click", function () {
        if (state.progress.done.flash) return;
        if (option === item.meaning) {
          button.classList.add("correct");
          handleCorrect("flash", 2, ui.flashStatus, "Flashcard win! +2 stars", button);
          ui.flipFlashcard.disabled = true;
          ui.nextFlashcard.disabled = true;
        } else {
          button.classList.add("wrong");
          handleWrong(ui.flashStatus, "Oops.", button, "Flip card and match transliteration clue.");
        }
      });
      ui.flashChoices.appendChild(button);
    });
  }

  function renderFlashcard() {
    const item = lesson.activities.flashcards[state.flashIndex % lesson.activities.flashcards.length];
    if (state.flashFront) {
      ui.flashcard.innerHTML = '<p class="flash-dev tap-audio" title="Tap to hear pronunciation">' + item.devanagari + '</p><p>Tap "Flip Card" to reveal clue</p>';
    } else {
      ui.flashcard.innerHTML = '<p><strong class="tap-audio" title="Tap to hear pronunciation">' + item.devanagari + "</strong></p><p>Transliteration: " + item.transliteration + "</p>";
    }
  }

  function setupFeedMithu() {
    const target = FRUITS[state.feedIndex % FRUITS.length];
    ui.feedPrompt.textContent = "Select the Sanskrit fruit: " + target.dev + " (" + target.meaning + ")";
    ui.feedChoices.innerHTML = "";
    ui.feedStatus.textContent = state.progress.done.feed ? "Completed for this lesson." : "";
    ui.nextFeed.disabled = state.progress.done.feed;
    FRUITS.slice().sort(function () { return Math.random() - 0.5; }).forEach(function (l) {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "choice-btn";
      button.textContent = l.emoji + " " + l.dev;
      if (state.progress.done.feed) {
        button.disabled = true;
        if (l.dev === target.dev) button.classList.add("correct");
      }
      button.addEventListener("click", function () {
        if (state.progress.done.feed) return;
        if (l.dev === target.dev) {
          ui.feedChoices.querySelectorAll("button").forEach(function (b) { b.disabled = true; });
          button.classList.add("correct");
          setMascotState("pointing");
          setMascotSpeech("Perfect choice. Bring the fruit to Mithu.");
          const fruitFly = document.createElement("span");
          fruitFly.textContent = l.emoji;
          fruitFly.style.position = "fixed";
          const from = button.getBoundingClientRect();
          const to = ui.lessonMascot.getBoundingClientRect();
          fruitFly.style.left = from.left + 14 + "px";
          fruitFly.style.top = from.top + 8 + "px";
          fruitFly.style.fontSize = "1.8rem";
          fruitFly.style.zIndex = "60";
          document.body.appendChild(fruitFly);
          animate(
            fruitFly,
            {
              transform: [
                "translate(0px,0px) scale(1)",
                "translate(" + (to.left - from.left + 38) + "px," + (to.top - from.top + 24) + "px) scale(0.55)"
              ],
              opacity: [1, 0.15]
            },
            { duration: 0.8, easing: "ease-out" }
          );
          setTimeout(function () { fruitFly.remove(); }, 900);
          speakText(l.transliteration, l.dev, ui.feedStatus);
          setTimeout(function () {
            setMascotState("eating");
            setMascotSpeech("Yummy! Mithu is eating " + l.dev + ".");
          }, 480);
          setTimeout(function () {
            handleCorrect("feed", 2, ui.feedStatus, "Mithu ate it happily! +2 stars", button);
            ui.nextFeed.disabled = true;
          }, 920);
        } else {
          button.classList.add("wrong");
          handleWrong(ui.feedStatus, "Not this fruit.", button, "Match the Sanskrit fruit word carefully.");
        }
      });
      ui.feedChoices.appendChild(button);
    });
  }

  function setupHiddenHunt() {
    const letters = lessonLetters();
    const target = letters[state.huntIndex % letters.length];
    ui.huntPrompt.textContent = "Find all hidden " + target.devanagari + " letters.";
    ui.huntGrid.innerHTML = "";
    ui.huntStatus.textContent = state.progress.done.hunt ? "Completed for this lesson." : "";
    ui.nextHunt.disabled = state.progress.done.hunt;
    const pool = letters.map(function (l) { return l.devanagari; });
    const cells = [];
    for (let i = 0; i < 9; i += 1) {
      cells.push(pool[Math.floor(Math.random() * pool.length)]);
    }

    cells[2] = target.devanagari;
    cells[7] = target.devanagari;
    let found = 0;
    cells.forEach(function (char) {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "tile-btn";
      button.textContent = char;
      if (state.progress.done.hunt) {
        button.disabled = true;
        if (char === target.devanagari) button.classList.add("correct");
      }
      button.addEventListener("click", function () {
        if (state.progress.done.hunt) return;
        if (button.disabled) return;
        button.disabled = true;
        if (char === target.devanagari) {
          button.classList.add("correct");
          found += 1;
          if (found >= 2) {
            handleCorrect("hunt", 2, ui.huntStatus, "You found both hidden letters! +2 stars", ui.huntGrid);
            ui.nextHunt.disabled = true;
          }
        } else {
          button.classList.add("wrong");
        }
      });
      ui.huntGrid.appendChild(button);
    });
  }

  function setupTraceActivity() {
    if (!ui.traceCanvas) return;
    const ctx = ui.traceCanvas.getContext("2d");
    const target = lessonLetters()[state.huntIndex % lessonLetters().length];
    ui.traceTargetLetter.textContent = target.devanagari;
    ui.tracePrompt.textContent = "Trace this letter: " + target.devanagari + " (" + target.transliteration + ")";
    ui.traceStatus.textContent = state.progress.done.trace ? "Completed for this lesson." : "";
    ui.checkTraceBtn.disabled = state.progress.done.trace;
    ui.clearTraceBtn.disabled = state.progress.done.trace;
    state.traceStrokeCount = 0;
    ctx.clearRect(0, 0, ui.traceCanvas.width, ui.traceCanvas.height);
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.lineWidth = 8;
    ctx.strokeStyle = "#5b5fd6";

    function posFromEvent(event) {
      const rect = ui.traceCanvas.getBoundingClientRect();
      const point = event.touches ? event.touches[0] : event;
      return {
        x: (point.clientX - rect.left) * (ui.traceCanvas.width / rect.width),
        y: (point.clientY - rect.top) * (ui.traceCanvas.height / rect.height)
      };
    }

    function startDraw(event) {
      if (state.progress.done.trace) return;
      state.traceDrawing = true;
      const p = posFromEvent(event);
      ctx.beginPath();
      ctx.moveTo(p.x, p.y);
      event.preventDefault();
    }

    function moveDraw(event) {
      if (!state.traceDrawing || state.progress.done.trace) return;
      const p = posFromEvent(event);
      ctx.lineTo(p.x, p.y);
      ctx.stroke();
      state.traceStrokeCount += 1;
      event.preventDefault();
    }

    function endDraw() {
      state.traceDrawing = false;
    }

    ui.traceCanvas.onpointerdown = startDraw;
    ui.traceCanvas.onpointermove = moveDraw;
    ui.traceCanvas.onpointerup = endDraw;
    ui.traceCanvas.onpointerleave = endDraw;
    ui.traceCanvas.ontouchstart = startDraw;
    ui.traceCanvas.ontouchmove = moveDraw;
    ui.traceCanvas.ontouchend = endDraw;
  }

  function checkTraceActivity() {
    if (state.progress.done.trace) return;
    if (state.traceStrokeCount > 38) {
      handleCorrect("trace", 2, ui.traceStatus, "Beautiful tracing! +2 stars", ui.traceCanvas);
      setMascotState("celebrating");
      setMascotSpeech("Great tracing. You wrote it beautifully.");
      ui.checkTraceBtn.disabled = true;
      ui.clearTraceBtn.disabled = true;
    } else {
      setMascotState("encouraging");
      ui.traceStatus.textContent = "Trace a little more clearly and try again.";
    }
  }

  function renderReviewList() {
    ui.reviewList.innerHTML = "";
    [
      lesson.reviewStatus,
      "These lesson examples should be reviewed by a Sanskrit educator before child publication.",
      "Recorded pronunciation is available for key letters, but full alphabet validation is still required."
    ].forEach(function (note) {
      const li = document.createElement("li");
      li.textContent = note;
      ui.reviewList.appendChild(li);
    });
  }

  function renderAudioDebug() {
    if (!ui.audioDebug || !window.spGetAudioDebug) return;
    const details = window.spGetAudioDebug();
    ui.audioDebug.textContent =
      "Audio check: speech support = " +
      (details.speechSupported ? "yes" : "no") +
      ", voices detected = " +
      details.voiceCount +
      ", preferred voice = " +
      details.bestVoice +
      ", muted = " +
      (details.muted ? "yes" : "no") +
      ".";
  }

  function refreshAudioDebugLater() {
    let tries = 0;
    const timer = setInterval(function () {
      tries += 1;
      renderAudioDebug();
      if (tries >= 8) clearInterval(timer);
    }, 500);
  }

  function runDataIntegrityChecks() {
    const issues = [];
    if (!canonicalLetters.length) issues.push("Canonical inventory is empty.");
    const idSet = new Set();
    canonicalLetters.forEach(function (item) {
      if (!item.id) issues.push("Inventory item missing id for symbol " + (item.devanagari || "?"));
      if (!item.devanagari) issues.push("Inventory item missing Devanagari symbol for id " + (item.id || "?"));
      if (idSet.has(item.id)) issues.push("Duplicate inventory id found: " + item.id);
      idSet.add(item.id);
    });

    const treeButtons = ui.magicalTreeLetters ? ui.magicalTreeLetters.querySelectorAll("[data-tree-id]") : [];
    if (treeButtons.length !== canonicalLetters.length) {
      issues.push("Tree rendered count " + treeButtons.length + " does not match inventory " + canonicalLetters.length + ".");
    }
    treeButtons.forEach(function (btn) {
      const id = btn.getAttribute("data-tree-id");
      if (!inventoryById.has(id)) issues.push("Tree button mapped to unknown letter id: " + id);
    });
    if (state.treeCompletionAwarded && state.treeDiscovered.size < canonicalLetters.length) {
      issues.push("Tree completion awarded state is inconsistent with discovered count.");
    }

    const gardenButtons = ui.letterGrid ? ui.letterGrid.querySelectorAll("[data-letter-id]") : [];
    const expectedGarden = visibleGardenLetters().length;
    if (gardenButtons.length !== expectedGarden) {
      issues.push("Garden rendered count " + gardenButtons.length + " does not match expected " + expectedGarden + ".");
    }
    if (state.letterCategory === "all" && gardenButtons.length !== canonicalLetters.length) {
      issues.push("Garden all-items view does not match canonical inventory total.");
    }
    gardenButtons.forEach(function (btn) {
      const id = btn.getAttribute("data-letter-id");
      if (!inventoryById.has(id)) issues.push("Garden button mapped to unknown letter id: " + id);
    });

    const idNodes = Array.from(document.querySelectorAll("[id]"));
    const duplicateIds = idNodes
      .map(function (el) { return el.id; })
      .filter(function (id, index, arr) { return arr.indexOf(id) !== index; });
    if (duplicateIds.length) {
      issues.push("Duplicate DOM ids detected: " + Array.from(new Set(duplicateIds)).join(", "));
    }

    if (issues.length) {
      console.error("[AlphabetForest integrity]", issues);
    } else {
      console.info("[AlphabetForest integrity] All checks passed.");
    }
  }

  function unlockNextLesson() {
    if (state.progress.lessonIndex >= LESSONS.length - 1) return;
    state.progress.lessonIndex += 1;
    resetActivityFlags();
    saveProgress();
    setMascotState("flying");
    setMascotSpeech("New lesson unlocked! Let's continue.");
    rebuildLesson();
  }

  function goPreviousLesson() {
    if (state.progress.lessonIndex <= 0) return;
    state.progress.lessonIndex -= 1;
    resetActivityFlags();
    saveProgress();
    setMascotState("flying");
    setMascotSpeech("Going back to previous lesson.");
    rebuildLesson();
  }

  function rebuildLesson() {
    state.hearIndex = 0;
    state.pictureIndex = 0;
    state.arrangeIndex = 0;
    state.flashIndex = 0;
    state.feedIndex = 0;
    state.huntIndex = 0;
    renderLessonHeader();
    renderLetterGrid();
    setupHearAndPick();
    setupPictureMatch();
    setupArrangeWord();
    setupFlashcard();
    setupFeedMithu();
    setupTraceActivity();
    setupHiddenHunt();
    renderProgress();
    runDataIntegrityChecks();
  }

  function setupMascotFollowOnScroll() {
    if (!ui.lessonMascot) return;
    const desktopAnchors = [
      { selector: "#forestScene", top: 92 },
      { selector: ".forest-layout", top: 116 },
      { selector: "#lessonStatsPanel", top: 140 },
      { selector: "#activityHearGamePanel", top: 164 },
      { selector: "#activityPictureGamePanel", top: 188 },
      { selector: "#activityArrangeGamePanel", top: 212 },
      { selector: "#activityFlashGamePanel", top: 236 },
      { selector: "#activityFeedGamePanel", top: 260 },
      { selector: "#activityTraceGamePanel", top: 284 },
      { selector: "#activityHuntGamePanel", top: 308 }
    ];

    function updateMode() {
      const isMobile = window.matchMedia("(max-width: 860px)").matches;
      ui.lessonMascot.classList.toggle("lesson-mascot-mobile", isMobile);
      if (isMobile) {
        ui.lessonMascot.classList.remove("lesson-mascot-floating");
        ui.lessonMascot.style.top = "";
        ui.lessonMascot.style.transform = "";
        return;
      }

      ui.lessonMascot.classList.add("lesson-mascot-floating");
      const docHeight = Math.max(document.body.scrollHeight, document.documentElement.scrollHeight);
      const maxScroll = Math.max(1, docHeight - window.innerHeight);
      const ratio = Math.min(1, Math.max(0, window.scrollY / maxScroll));
      const stepIndex = Math.round(ratio * (desktopAnchors.length - 1));
      const active = desktopAnchors[stepIndex];
      const topLimit = Math.max(84, window.innerHeight - 290);
      ui.lessonMascot.style.top = Math.min(active.top, topLimit) + "px";
    }

    window.addEventListener("scroll", updateMode, { passive: true });
    window.addEventListener("resize", updateMode);
    updateMode();
  }

  function setupScrollSpeechHints() {
    const sections = [
      { selector: "#forestScene", message: "Welcome to the magical tree. Letters glow and guide your sound journey." },
      { selector: ".forest-layout", message: "Tap any letter tile. It speaks immediately." },
      { selector: "#lessonProgressPanel", message: "Track stars and finish all seven activities to unlock next lesson." },
      { selector: "#activityHearGamePanel", message: "Listen carefully and pick the matching letter." },
      { selector: "#activityPictureGamePanel", message: "Match Sanskrit words with picture clues." },
      { selector: "#activityArrangeGamePanel", message: "Build the Sanskrit word by ordering tiles." },
      { selector: "#activityFlashGamePanel", message: "Flip the flashcard and choose the right meaning." },
      { selector: "#activityFeedGamePanel", message: "Feed Mithu the correct Sanskrit fruit." },
      { selector: "#activityTraceGamePanel", message: "Trace the letter slowly with your finger or mouse." },
      { selector: "#activityHuntGamePanel", message: "Find hidden target letters to complete the treasure hunt." }
    ];

    let lastMessage = "";
    function updateSpeechFromScroll() {
      const focusY = window.innerHeight * 0.42;
      let activeMessage = "";
      let bestDistance = Number.POSITIVE_INFINITY;
      sections.forEach(function (item) {
        const el = document.querySelector(item.selector);
        if (!el) return;
        const rect = el.getBoundingClientRect();
        const center = rect.top + rect.height / 2;
        const distance = Math.abs(center - focusY);
        if (distance < bestDistance) {
          bestDistance = distance;
          activeMessage = item.message;
        }
      });
      if (activeMessage && activeMessage !== lastMessage) {
        if (Date.now() < state.speechLockUntil) return;
        lastMessage = activeMessage;
        if (ui.lessonMascotSpeech) ui.lessonMascotSpeech.textContent = activeMessage;
      }
    }

    window.addEventListener("scroll", updateSpeechFromScroll, { passive: true });
    updateSpeechFromScroll();
  }

  function goNextAdventure() {
    window.location.href = "my-progress.html";
  }

  function goBackToWorlds() {
    window.location.href = "explore-worlds.html";
  }

  function runMascotEntrance() {
    if (prefersReducedMotion) {
      setMascotState("idle");
      setMascotSpeech("Namaste! I am Mitthu. Let's learn one lesson at a time.");
      return;
    }
    animate(
      ui.lessonMascot,
      {
        transform: [
          "translateX(-280px) translateY(-40px) scale(0.92)",
          "translateX(0px) translateY(0px) scale(1)"
        ],
        opacity: [0.4, 1]
      },
      { duration: 0.95, easing: "ease-out" }
    );
    setMascotState("flying");
    setTimeout(function () {
      setMascotState("greeting");
      setMascotSpeech("Namaste! I am Mitthu. Tap the big letter and I will help you listen.");
    }, 900);
    setTimeout(function () {
      setMascotState("idle");
    }, 1500);
  }

  function init() {
    localStorage.setItem(LAST_WORLD_KEY, "alphabet");
    ui.audioDisclaimer.textContent = lesson.disclaimer;
    const treeProgress = loadTreeProgress();
    state.treeDiscovered = new Set(
      treeProgress.discoveredIds.filter(function (id) {
        return inventoryById.has(id);
      })
    );
    state.treeCompletionAwarded = treeProgress.completionAwarded;
    initLottie();
    renderLessonHeader();
    renderLetterGrid();
    renderMagicalTree();
    renderProgress();
    renderAudioDebug();
    refreshAudioDebugLater();
    renderReviewList();
    setupHearAndPick();
    setupPictureMatch();
    setupArrangeWord();
    setupFlashcard();
    setupFeedMithu();
    setupTraceActivity();
    setupHiddenHunt();
    setupMascotFollowOnScroll();
    setupScrollSpeechHints();
    runMascotEntrance();
    runDataIntegrityChecks();

    ui.testSoundBtn.addEventListener("click", runAudioTest);
    if (ui.replayLetterBtn) ui.replayLetterBtn.addEventListener("click", speakSelectedLetter);
    if (ui.slowLetterBtn) ui.slowLetterBtn.addEventListener("click", speakSelectedLetterSlow);
    if (ui.selectedDev) {
      ui.selectedDev.addEventListener("click", function () {
        speakSelectedLetter();
      });
    }
    if (ui.selectedExample) {
      ui.selectedExample.addEventListener("click", function () {
        const letter = state.selectedLetter;
        const key = audioKeyForText(letter.example) || letter.audioKey || letter.transliteration;
        speakText(key, letter.example, ui.audioFallback);
      });
    }
    if (ui.flashcard) {
      ui.flashcard.addEventListener("click", function () {
        const item = lesson.activities.flashcards[state.flashIndex % lesson.activities.flashcards.length];
        speakText(audioKeyForText(item.devanagari), item.devanagari, ui.flashStatus);
      });
    }
    if (ui.prevLessonTopBtn) ui.prevLessonTopBtn.addEventListener("click", goPreviousLesson);
    if (ui.continueAdventureTopBtn) ui.continueAdventureTopBtn.addEventListener("click", goNextAdventure);
    if (ui.backToWorldsTopBtn) ui.backToWorldsTopBtn.addEventListener("click", goBackToWorlds);
    if (ui.letterCategoryTabs) {
      ui.letterCategoryTabs.forEach(function (tab) {
        tab.addEventListener("click", function () {
          ui.letterCategoryTabs.forEach(function (x) { x.classList.remove("active"); });
          tab.classList.add("active");
          state.letterCategory = tab.getAttribute("data-category") || "all";
          renderLetterGrid();
          runDataIntegrityChecks();
        });
      });
    }
    if (ui.magicalTreeLetters) {
      ui.magicalTreeLetters.addEventListener("click", function (event) {
        const button = event.target.closest(".tree-letter-btn");
        if (!button) return;
        activateTreeLetterByButton(button);
      });
      ui.magicalTreeLetters.addEventListener("keydown", function (event) {
        const button = event.target.closest(".tree-letter-btn");
        if (!button) return;
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          activateTreeLetterByButton(button);
        }
      });
    }
    ui.playHearPrompt.addEventListener("click", function () {
      playPromptLetter(state.currentHearPrompt.letter);
    });
    ui.nextHear.addEventListener("click", function () {
      state.hearIndex += 1;
      setupHearAndPick();
      setMascotState("thinking");
      setMascotSpeech("Listen closely and choose the matching letter.");
    });
    ui.nextPicture.addEventListener("click", function () {
      state.pictureIndex += 1;
      setupPictureMatch();
      setMascotState("thinking");
      setMascotSpeech("Use the picture clue to pick the right word.");
    });
    ui.resetArrange.addEventListener("click", function () {
      setupArrangeWord();
      setMascotState("thinking");
      setMascotSpeech("Try arranging the tiles again.");
    });
    ui.checkArrange.addEventListener("click", function () {
      const item = lesson.activities.arrangeWord[state.arrangeIndex % lesson.activities.arrangeWord.length];
      const guess = state.arrangeSelected.join("");
      if (guess === item.word) {
        ui.arrangeTiles.querySelectorAll("button").forEach(function (button) {
          button.classList.add("correct");
        });
        handleCorrect("arrange", 2, ui.arrangeStatus, "Excellent! +2 stars", ui.arrangeTiles);
      } else {
        ui.arrangeTiles.querySelectorAll("button").forEach(function (button) {
          button.classList.add("wrong");
        });
        handleWrong(ui.arrangeStatus, "Almost there.", ui.arrangeTiles, "Look at each sound chunk in order.");
      }
    });
    ui.nextArrange.addEventListener("click", function () {
      state.arrangeIndex += 1;
      setupArrangeWord();
    });
    ui.flipFlashcard.addEventListener("click", function () {
      state.flashFront = !state.flashFront;
      renderFlashcard();
      animate(ui.flashcard, { transform: ["rotateY(0deg)", "rotateY(90deg)", "rotateY(0deg)"] }, { duration: 0.45, easing: "ease-in-out" });
    });
    ui.nextFlashcard.addEventListener("click", function () {
      state.flashIndex += 1;
      setupFlashcard();
      setMascotState("thinking");
      setMascotSpeech("Flip the card and match the meaning.");
    });
    ui.nextFeed.addEventListener("click", function () {
      state.feedIndex += 1;
      setupFeedMithu();
      setMascotState("thinking");
      setMascotSpeech("Let's feed Mithu again.");
    });
    ui.nextHunt.addEventListener("click", function () {
      state.huntIndex += 1;
      setupHiddenHunt();
      setMascotState("thinking");
      setMascotSpeech("Find hidden letters carefully.");
    });
    if (ui.clearTraceBtn) {
      ui.clearTraceBtn.addEventListener("click", function () {
        setupTraceActivity();
        setMascotState("encouraging");
        setMascotSpeech("Trace once more. Slow and smooth.");
      });
    }
    if (ui.checkTraceBtn) {
      ui.checkTraceBtn.addEventListener("click", checkTraceActivity);
    }
    if (ui.nextAdventureBtn) ui.nextAdventureBtn.addEventListener("click", goNextAdventure);
    if (ui.completionNextBtn) ui.completionNextBtn.addEventListener("click", goNextAdventure);
    if (ui.nextLessonBtn) ui.nextLessonBtn.addEventListener("click", unlockNextLesson);
    if (ui.nextLessonTopBtn) ui.nextLessonTopBtn.addEventListener("click", unlockNextLesson);
    document.addEventListener("visibilitychange", function () {
      if (!document.hidden) renderAudioDebug();
    });
  }

  init();
})();
