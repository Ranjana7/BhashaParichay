(function initAlphabetForest() {
  const lesson = window.ALPHABET_LESSON;
  if (!lesson) return;

  const PROGRESS_KEY = "sanskritParichay.alphabetForest.progress";
  const HOME_KEY = "sanskritParichay.home.progress";
  const LAST_WORLD_KEY = "sanskritParichay.lastWorld";
  const TOTAL_ACTIVITIES = 4;
  const SAFE_START = { stars: 0, streak: 0, done: { hear: false, picture: false, arrange: false, flash: false } };
  const motion = window.Motion || {};
  const animate = motion.animate || function () {};
  const LOCAL_PRONUNCIATION_FILES = {
    namaste: "assets/audio/reference/swara-sanskrit.mp3"
  };

  const ui = {
    audioDisclaimer: document.getElementById("audioDisclaimer"),
    audioDebug: document.getElementById("audioDebug"),
    testSoundBtn: document.getElementById("testSoundBtn"),
    lessonMascot: document.getElementById("lessonMascot"),
    lessonMascotSpeech: document.getElementById("lessonMascotSpeech"),
    letterGrid: document.getElementById("letterGrid"),
    selectedDev: document.getElementById("selectedDev"),
    selectedTran: document.getElementById("selectedTran"),
    selectedExample: document.getElementById("selectedExample"),
    selectedMeaning: document.getElementById("selectedMeaning"),
    speakLetterBtn: document.getElementById("speakLetterBtn"),
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
    reviewList: document.getElementById("reviewList"),
    completionScreen: document.getElementById("completionScreen"),
    completionStars: document.getElementById("completionStars"),
    completionNextBtn: document.getElementById("completionNextBtn"),
    completionLottie: document.getElementById("completionLottie")
  };

  const state = {
    selectedLetter: lesson.letters[0],
    progress: loadProgress(),
    hearIndex: 0,
    pictureIndex: 0,
    arrangeIndex: 0,
    flashIndex: 0,
    arrangeSelected: [],
    flashFront: true,
    lessonCelebrated: false
  };

  let completionAnim = null;

  function cloneSafeStart() {
    return {
      stars: SAFE_START.stars,
      streak: SAFE_START.streak,
      done: {
        hear: SAFE_START.done.hear,
        picture: SAFE_START.done.picture,
        arrange: SAFE_START.done.arrange,
        flash: SAFE_START.done.flash
      }
    };
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

  function setMascotSpeech(text) {
    if (ui.lessonMascotSpeech) ui.lessonMascotSpeech.textContent = text;
  }

  function setMascotState(kind) {
    const p = mascotParts();
    if (!p.body) return;
    if (kind === "idle") {
      animate(p.body, { transform: ["translateY(0px)", "translateY(-2px)", "translateY(0px)"] }, { duration: 2.2, repeat: Infinity, easing: "ease-in-out" });
      animate([p.eyeLeft, p.eyeRight], { transform: ["scaleY(1)", "scaleY(0.2)", "scaleY(1)"] }, { duration: 4.5, repeat: Infinity, easing: "ease-in-out" });
      animate(p.tail, { transform: ["rotate(0deg)", "rotate(7deg)", "rotate(0deg)"] }, { duration: 2, repeat: Infinity, easing: "ease-in-out" });
    } else if (kind === "thinking") {
      animate(p.body, { transform: ["rotate(0deg)", "rotate(-4deg)", "rotate(0deg)"] }, { duration: 0.8, easing: "ease-in-out" });
    } else if (kind === "correct") {
      animate(p.body, { transform: ["translateY(0px)", "translateY(-14px)", "translateY(0px)"] }, { duration: 0.5, easing: "ease-out" });
      animate([p.wingLeft, p.wingRight], { transform: ["rotate(0deg)", "rotate(22deg)", "rotate(0deg)"] }, { duration: 0.45, easing: "ease-out" });
    } else if (kind === "incorrect") {
      animate(p.body, { transform: ["rotate(0deg)", "rotate(3deg)", "rotate(-3deg)", "rotate(0deg)"] }, { duration: 0.7, easing: "ease-in-out" });
    } else if (kind === "dance") {
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
        done: {
          hear: Boolean(parsed.done && parsed.done.hear),
          picture: Boolean(parsed.done && parsed.done.picture),
          arrange: Boolean(parsed.done && parsed.done.arrange),
          flash: Boolean(parsed.done && parsed.done.flash)
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
    if (window.confetti && !(window.SP_STATE && window.SP_STATE.muted)) {
      window.confetti({ particleCount: 22, spread: 45, startVelocity: 20, ticks: 80, origin: { y: 0.7 }, colors: ["#ffd166", "#4cc9f0", "#6a4cff"] });
    }
    if (window.spSuccessTone) window.spSuccessTone();
  }

  function celebrateBig() {
    if (window.confetti && !(window.SP_STATE && window.SP_STATE.muted)) {
      window.confetti({ particleCount: 120, spread: 75, startVelocity: 32, ticks: 130, origin: { y: 0.65 }, colors: ["#ffd166", "#ff7eb6", "#7f5cff", "#2ec4b6"] });
      window.confetti({ particleCount: 80, spread: 65, startVelocity: 26, ticks: 120, origin: { x: 0.2, y: 0.7 } });
      window.confetti({ particleCount: 80, spread: 65, startVelocity: 26, ticks: 120, origin: { x: 0.8, y: 0.7 } });
    }
    if (window.spApplause) window.spApplause();
  }

  function playLocalPronunciation(key, onFail) {
    const file = LOCAL_PRONUNCIATION_FILES[key];
    if (!file) {
      if (onFail) onFail();
      return;
    }
    const audio = new Audio(file);
    audio.play().catch(function () {
      if (onFail) onFail();
    });
  }

  function speakSelectedLetter() {
    const letter = state.selectedLetter;
    playLocalPronunciation(letter.transliteration, function () {
      window.spSpeak(letter.devanagari, "hi-IN", ui.audioFallback, letter.transliteration);
    });
  }

  function playPromptLetter(promptLetter) {
    const match = lesson.letters.find(function (entry) {
      return entry.devanagari === promptLetter;
    });
    const key = match ? match.transliteration : promptLetter;
    playLocalPronunciation(key, function () {
      window.spSpeak(promptLetter, "hi-IN", ui.hearStatus, key);
    });
  }

  function runAudioTest() {
    const demo = new Audio("assets/audio/reference/swara-sanskrit.mp3");
    demo.play().then(function () {
      ui.audioFallback.textContent = "";
    }).catch(function () {
      window.spSpeak("नमस्ते", "hi-IN", ui.audioFallback, "namaste");
    });
    renderAudioDebug();
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

  function renderProgress() {
    const doneTotal = Object.values(state.progress.done).filter(Boolean).length;
    ui.starCount.textContent = String(state.progress.stars);
    ui.doneCount.textContent = String(doneTotal);
    ui.streakCount.textContent = String(state.progress.streak);
    ui.progressFill.style.width = Math.round((doneTotal / TOTAL_ACTIVITIES) * 100) + "%";
    if (doneTotal === TOTAL_ACTIVITIES) {
      ui.progressText.textContent = "Legendary! You completed all Alphabet Forest activities!";
      ui.doneBanner.classList.add("show");
      onLessonComplete();
    } else {
      ui.progressText.textContent = "Keep going! Finish all activities to complete Alphabet Forest.";
      ui.doneBanner.classList.remove("show");
      ui.completionScreen.classList.remove("show");
      state.lessonCelebrated = false;
    }
  }

  function onLessonComplete() {
    if (state.lessonCelebrated) return;
    state.lessonCelebrated = true;
    setMascotState("dance");
    setMascotSpeech("Adventure complete! Let's celebrate!");
    celebrateBig();
    if (ui.earnedStars) ui.earnedStars.textContent = " Earned Stars: " + state.progress.stars;
    if (ui.completionStars) ui.completionStars.textContent = String(state.progress.stars);
    if (ui.completionScreen) ui.completionScreen.classList.add("show");
    if (completionAnim) completionAnim.goToAndPlay(0, true);
  }

  function renderLetterDetail(letter) {
    state.selectedLetter = letter;
    ui.selectedDev.textContent = letter.devanagari;
    ui.selectedTran.textContent = letter.transliteration;
    ui.selectedExample.textContent = letter.example;
    ui.selectedMeaning.textContent = letter.meaning;
    ui.audioFallback.textContent = "";
  }

  function renderLetterGrid() {
    ui.letterGrid.innerHTML = "";
    lesson.letters.forEach(function (letter) {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "letter-btn";
      if (letter.devanagari === state.selectedLetter.devanagari) button.classList.add("active");
      button.innerHTML = '<span class="dev">' + letter.devanagari + "</span>" + letter.transliteration;
      button.addEventListener("click", function () {
        renderLetterDetail(letter);
        renderLetterGrid();
        setMascotState("thinking");
        setMascotSpeech("Great choice. Tap hear letter for pronunciation.");
      });
      ui.letterGrid.appendChild(button);
    });
  }

  function setupHearAndPick() {
    const prompt = lesson.activities.hearAndPick[state.hearIndex];
    ui.hearChoices.innerHTML = "";
    ui.hearStatus.textContent = "";
    prompt.options.forEach(function (option) {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "choice-btn";
      button.textContent = option;
      button.addEventListener("click", function () {
        if (option === prompt.letter) {
          button.classList.add("correct");
          handleCorrect("hear", 2, ui.hearStatus, "Great listening! +2 stars", button);
        } else {
          button.classList.add("wrong");
          handleWrong(ui.hearStatus, "Nice try.", button, "Listen once more and look for the first sound.");
        }
      });
      ui.hearChoices.appendChild(button);
    });
  }

  function setupPictureMatch() {
    const item = lesson.activities.pictureMatch[state.pictureIndex];
    ui.picturePrompt.textContent = "Match: " + item.emoji + " " + item.meaning;
    ui.pictureChoices.innerHTML = "";
    ui.pictureStatus.textContent = "";
    item.options.forEach(function (option) {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "choice-btn";
      button.textContent = option;
      button.addEventListener("click", function () {
        if (option === item.answer) {
          button.classList.add("correct");
          handleCorrect("picture", 2, ui.pictureStatus, "Correct match! +2 stars", button);
        } else {
          button.classList.add("wrong");
          handleWrong(ui.pictureStatus, "Not yet.", button, "Try the word that best matches the picture.");
        }
      });
      ui.pictureChoices.appendChild(button);
    });
  }

  function setupArrangeWord() {
    const item = lesson.activities.arrangeWord[state.arrangeIndex];
    ui.arrangePrompt.textContent = "Build the Sanskrit word for: " + item.meaning;
    ui.arrangeTiles.innerHTML = "";
    ui.arrangeStatus.textContent = "";
    state.arrangeSelected = [];
    ui.arrangeAnswer.textContent = "";
    item.tiles.forEach(function (tile) {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "tile-btn";
      button.textContent = tile;
      button.addEventListener("click", function () {
        if (button.disabled) return;
        button.disabled = true;
        state.arrangeSelected.push(tile);
        ui.arrangeAnswer.textContent = state.arrangeSelected.join("");
      });
      ui.arrangeTiles.appendChild(button);
    });
  }

  function setupFlashcard() {
    const item = lesson.activities.flashcards[state.flashIndex];
    state.flashFront = true;
    ui.flashStatus.textContent = "";
    ui.flashChoices.innerHTML = "";
    renderFlashcard();
    item.options.forEach(function (option) {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "choice-btn";
      button.textContent = option;
      button.addEventListener("click", function () {
        if (option === item.meaning) {
          button.classList.add("correct");
          handleCorrect("flash", 2, ui.flashStatus, "Flashcard win! +2 stars", button);
        } else {
          button.classList.add("wrong");
          handleWrong(ui.flashStatus, "Oops.", button, "Flip card and match transliteration clue.");
        }
      });
      ui.flashChoices.appendChild(button);
    });
  }

  function renderFlashcard() {
    const item = lesson.activities.flashcards[state.flashIndex];
    if (state.flashFront) {
      ui.flashcard.innerHTML = '<p class="flash-dev">' + item.devanagari + '</p><p>Tap "Flip Card" to reveal clue</p>';
    } else {
      ui.flashcard.innerHTML = "<p><strong>" + item.devanagari + "</strong></p><p>Transliteration: " + item.transliteration + "</p>";
    }
  }

  function renderReviewList() {
    ui.reviewList.innerHTML = "";
    [
      lesson.reviewStatus,
      "Check each Devanagari-to-English mapping with a Sanskrit educator.",
      "Replace synthetic references with verified Sanskrit voice recordings for full production."
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

  function goNextAdventure() {
    window.location.href = "index.html#worlds";
  }

  function init() {
    localStorage.setItem(LAST_WORLD_KEY, "alphabet");
    ui.audioDisclaimer.textContent = lesson.disclaimer;
    initLottie();
    renderLetterDetail(state.selectedLetter);
    renderLetterGrid();
    renderProgress();
    renderAudioDebug();
    refreshAudioDebugLater();
    renderReviewList();
    setupHearAndPick();
    setupPictureMatch();
    setupArrangeWord();
    setupFlashcard();
    setMascotState("idle");

    ui.speakLetterBtn.addEventListener("click", speakSelectedLetter);
    ui.testSoundBtn.addEventListener("click", runAudioTest);
    ui.playHearPrompt.addEventListener("click", function () {
      const prompt = lesson.activities.hearAndPick[state.hearIndex];
      playPromptLetter(prompt.letter);
    });
    ui.nextHear.addEventListener("click", function () {
      state.hearIndex = (state.hearIndex + 1) % lesson.activities.hearAndPick.length;
      setupHearAndPick();
      setMascotState("thinking");
      setMascotSpeech("Listen closely and choose the matching letter.");
    });
    ui.nextPicture.addEventListener("click", function () {
      state.pictureIndex = (state.pictureIndex + 1) % lesson.activities.pictureMatch.length;
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
      const item = lesson.activities.arrangeWord[state.arrangeIndex];
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
      state.arrangeIndex = (state.arrangeIndex + 1) % lesson.activities.arrangeWord.length;
      setupArrangeWord();
    });
    ui.flipFlashcard.addEventListener("click", function () {
      state.flashFront = !state.flashFront;
      renderFlashcard();
      animate(ui.flashcard, { transform: ["rotateY(0deg)", "rotateY(90deg)", "rotateY(0deg)"] }, { duration: 0.45, easing: "ease-in-out" });
    });
    ui.nextFlashcard.addEventListener("click", function () {
      state.flashIndex = (state.flashIndex + 1) % lesson.activities.flashcards.length;
      setupFlashcard();
      setMascotState("thinking");
      setMascotSpeech("Flip the card and match the meaning.");
    });
    if (ui.nextAdventureBtn) ui.nextAdventureBtn.addEventListener("click", goNextAdventure);
    if (ui.completionNextBtn) ui.completionNextBtn.addEventListener("click", goNextAdventure);
    document.addEventListener("visibilitychange", function () {
      if (!document.hidden) renderAudioDebug();
    });
  }

  init();
})();
