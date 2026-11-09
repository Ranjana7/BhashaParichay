(function initAlphabetForest() {
  const lesson = window.ALPHABET_LESSON;
  if (!lesson) return;

  const PROGRESS_KEY = "sanskritParichay.alphabetForest.progress";
  const TOTAL_ACTIVITIES = 4;
  const SAFE_START = {
    stars: 0,
    streak: 0,
    done: { hear: false, picture: false, arrange: false, flash: false }
  };

  const ui = {
    audioDisclaimer: document.getElementById("audioDisclaimer"),
    audioDebug: document.getElementById("audioDebug"),
    testSoundBtn: document.getElementById("testSoundBtn"),
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
    applauseBurst: document.getElementById("applauseBurst")
  };

  const state = {
    selectedLetter: lesson.letters[0],
    progress: loadProgress(),
    hearIndex: 0,
    pictureIndex: 0,
    arrangeIndex: 0,
    flashIndex: 0,
    arrangeSelected: [],
    flashFront: true
  };

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

  function celebrate(statusEl, message) {
    if (statusEl) statusEl.textContent = message;
    if (window.spApplause) window.spApplause();
    if (!ui.applauseBurst) return;
    ui.applauseBurst.classList.remove("show");
    void ui.applauseBurst.offsetWidth;
    ui.applauseBurst.classList.add("show");
    setTimeout(function hideBurst() {
      ui.applauseBurst.classList.remove("show");
    }, 850);
  }

  function handleCorrect(activityId, stars, statusEl, message) {
    state.progress.streak += 1;
    state.progress.stars += stars;
    if (!state.progress.done[activityId]) {
      state.progress.done[activityId] = true;
      state.progress.stars += 1;
    }
    saveProgress();
    renderProgress();
    celebrate(statusEl, message);
  }

  function handleWrong(statusEl, message) {
    state.progress.streak = 0;
    saveProgress();
    renderProgress();
    if (statusEl) statusEl.textContent = message;
  }

  function renderProgress() {
    const doneTotal = Object.values(state.progress.done).filter(Boolean).length;
    ui.starCount.textContent = String(state.progress.stars);
    ui.doneCount.textContent = String(doneTotal);
    ui.streakCount.textContent = String(state.progress.streak);
    const percent = Math.round((doneTotal / TOTAL_ACTIVITIES) * 100);
    ui.progressFill.style.width = percent + "%";

    if (doneTotal === TOTAL_ACTIVITIES) {
      ui.progressText.textContent = "Legendary! You completed all Alphabet Forest activities!";
      ui.doneBanner.classList.add("show");
    } else {
      ui.progressText.textContent = "Keep going! Finish all activities to complete Alphabet Forest.";
      ui.doneBanner.classList.remove("show");
    }
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
    lesson.letters.forEach(function addLetterButton(letter) {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "letter-btn";
      if (letter.devanagari === state.selectedLetter.devanagari) {
        button.classList.add("active");
      }
      button.innerHTML = '<span class="dev">' + letter.devanagari + "</span>" + letter.transliteration;
      button.addEventListener("click", function onPickLetter() {
        renderLetterDetail(letter);
        renderLetterGrid();
      });
      ui.letterGrid.appendChild(button);
    });
  }

  function speakSelectedLetter() {
    const letter = state.selectedLetter;
    window.spSpeak(letter.devanagari, "sa-IN", ui.audioFallback, letter.transliteration);
  }

  function runAudioTest() {
    renderAudioDebug();
    if (window.spApplause) window.spApplause();
    window.spSpeak("नमस्ते", "sa-IN", ui.audioFallback, "namaste");
  }

  function setupHearAndPick() {
    const prompt = lesson.activities.hearAndPick[state.hearIndex];
    ui.hearChoices.innerHTML = "";
    ui.hearStatus.textContent = "";

    prompt.options.forEach(function addOption(option) {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "choice-btn";
      button.textContent = option;
      button.addEventListener("click", function onCheck() {
        if (option === prompt.letter) {
          button.classList.add("correct");
          handleCorrect("hear", 2, ui.hearStatus, "Great listening! +2 stars");
        } else {
          button.classList.add("wrong");
          handleWrong(ui.hearStatus, "Nice try. Listen again and retry.");
        }
      });
      ui.hearChoices.appendChild(button);
    });
  }

  function playHearPrompt() {
    const prompt = lesson.activities.hearAndPick[state.hearIndex];
    const match = lesson.letters.find(function (entry) {
      return entry.devanagari === prompt.letter;
    });
    const transliteration = match ? match.transliteration : prompt.letter;
    window.spSpeak(prompt.letter, "sa-IN", ui.hearStatus, transliteration);
  }

  function nextHearPrompt() {
    state.hearIndex = (state.hearIndex + 1) % lesson.activities.hearAndPick.length;
    setupHearAndPick();
  }

  function setupPictureMatch() {
    const item = lesson.activities.pictureMatch[state.pictureIndex];
    ui.picturePrompt.textContent = "Match: " + item.emoji + " " + item.meaning;
    ui.pictureChoices.innerHTML = "";
    ui.pictureStatus.textContent = "";

    item.options.forEach(function addOption(option) {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "choice-btn";
      button.textContent = option;
      button.addEventListener("click", function onChoice() {
        if (option === item.answer) {
          button.classList.add("correct");
          handleCorrect("picture", 2, ui.pictureStatus, "Correct match! +2 stars");
        } else {
          button.classList.add("wrong");
          handleWrong(ui.pictureStatus, "Not yet. Try a different word.");
        }
      });
      ui.pictureChoices.appendChild(button);
    });
  }

  function nextPictureMatch() {
    state.pictureIndex = (state.pictureIndex + 1) % lesson.activities.pictureMatch.length;
    setupPictureMatch();
  }

  function setupArrangeWord() {
    const item = lesson.activities.arrangeWord[state.arrangeIndex];
    ui.arrangePrompt.textContent = "Build the Sanskrit word for: " + item.meaning;
    ui.arrangeTiles.innerHTML = "";
    ui.arrangeStatus.textContent = "";
    state.arrangeSelected = [];
    ui.arrangeAnswer.textContent = "";

    item.tiles.forEach(function addTile(tile) {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "tile-btn";
      button.textContent = tile;
      button.addEventListener("click", function onPickTile() {
        if (button.disabled) return;
        button.disabled = true;
        state.arrangeSelected.push(tile);
        ui.arrangeAnswer.textContent = state.arrangeSelected.join("");
      });
      ui.arrangeTiles.appendChild(button);
    });
  }

  function resetArrangeSelection() {
    state.arrangeSelected = [];
    ui.arrangeAnswer.textContent = "";
    ui.arrangeStatus.textContent = "";
    const buttons = ui.arrangeTiles.querySelectorAll("button");
    buttons.forEach(function enableButton(button) {
      button.disabled = false;
      button.classList.remove("wrong");
      button.classList.remove("correct");
    });
  }

  function checkArrangeSelection() {
    const item = lesson.activities.arrangeWord[state.arrangeIndex];
    const guess = state.arrangeSelected.join("");
    if (guess === item.word) {
      ui.arrangeTiles.querySelectorAll("button").forEach(function markCorrect(button) {
        button.classList.add("correct");
      });
      handleCorrect("arrange", 2, ui.arrangeStatus, "Excellent! +2 stars");
      return;
    }

    ui.arrangeTiles.querySelectorAll("button").forEach(function markWrong(button) {
      button.classList.add("wrong");
    });
    handleWrong(ui.arrangeStatus, "Almost there. Tap Retry and try again.");
  }

  function nextArrangeWord() {
    state.arrangeIndex = (state.arrangeIndex + 1) % lesson.activities.arrangeWord.length;
    setupArrangeWord();
  }

  function renderFlashcard() {
    const item = lesson.activities.flashcards[state.flashIndex];
    if (state.flashFront) {
      ui.flashcard.innerHTML = '<p class="flash-dev">' + item.devanagari + '</p><p>Tap "Flip Card" to reveal clue</p>';
    } else {
      ui.flashcard.innerHTML =
        "<p><strong>" + item.devanagari + "</strong></p>" +
        "<p>Transliteration: " + item.transliteration + "</p>";
    }
  }

  function setupFlashcard() {
    const item = lesson.activities.flashcards[state.flashIndex];
    state.flashFront = true;
    ui.flashStatus.textContent = "";
    ui.flashChoices.innerHTML = "";
    renderFlashcard();

    item.options.forEach(function addFlashOption(option) {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "choice-btn";
      button.textContent = option;
      button.addEventListener("click", function onFlashCheck() {
        if (option === item.meaning) {
          button.classList.add("correct");
          handleCorrect("flash", 2, ui.flashStatus, "Flashcard win! +2 stars");
        } else {
          button.classList.add("wrong");
          handleWrong(ui.flashStatus, "Oops! Flip and try again.");
        }
      });
      ui.flashChoices.appendChild(button);
    });
  }

  function flipFlashcard() {
    state.flashFront = !state.flashFront;
    renderFlashcard();
  }

  function nextFlashcard() {
    state.flashIndex = (state.flashIndex + 1) % lesson.activities.flashcards.length;
    setupFlashcard();
  }

  function renderReviewList() {
    ui.reviewList.innerHTML = "";
    const notes = [
      lesson.reviewStatus,
      "Check each Devanagari-to-English mapping with a Sanskrit educator.",
      "Replace computer-generated pronunciation with teacher-reviewed recordings when available."
    ];
    notes.forEach(function addNote(note) {
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
      ", muted = " +
      (details.muted ? "yes" : "no") +
      ".";
  }

  function refreshAudioDebugLater() {
    let tries = 0;
    const timer = setInterval(function updateDebug() {
      tries += 1;
      renderAudioDebug();
      if (tries >= 8) clearInterval(timer);
    }, 500);
  }

  function init() {
    ui.audioDisclaimer.textContent = lesson.disclaimer;
    renderLetterDetail(state.selectedLetter);
    renderLetterGrid();
    renderProgress();
    renderAudioDebug();
    refreshAudioDebugLater();
    setupHearAndPick();
    setupPictureMatch();
    setupArrangeWord();
    setupFlashcard();
    renderReviewList();

    ui.speakLetterBtn.addEventListener("click", speakSelectedLetter);
    ui.testSoundBtn.addEventListener("click", runAudioTest);
    ui.playHearPrompt.addEventListener("click", playHearPrompt);
    ui.nextHear.addEventListener("click", nextHearPrompt);
    ui.nextPicture.addEventListener("click", nextPictureMatch);
    ui.resetArrange.addEventListener("click", resetArrangeSelection);
    ui.checkArrange.addEventListener("click", checkArrangeSelection);
    ui.nextArrange.addEventListener("click", nextArrangeWord);
    ui.flipFlashcard.addEventListener("click", flipFlashcard);
    ui.nextFlashcard.addEventListener("click", nextFlashcard);
    document.addEventListener("visibilitychange", function onVisibility() {
      if (!document.hidden) renderAudioDebug();
    });
  }

  init();
})();
