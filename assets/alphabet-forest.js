(function initAlphabetForest() {
  const lesson = window.ALPHABET_LESSON;
  if (!lesson) return;

  const PROGRESS_KEY = "sanskritParichay.alphabetForest.progress";
  const SAFE_START = { stars: 0, done: { hear: false, picture: false, arrange: false } };

  const ui = {
    audioDisclaimer: document.getElementById("audioDisclaimer"),
    letterGrid: document.getElementById("letterGrid"),
    selectedDev: document.getElementById("selectedDev"),
    selectedTran: document.getElementById("selectedTran"),
    selectedExample: document.getElementById("selectedExample"),
    selectedMeaning: document.getElementById("selectedMeaning"),
    speakLetterBtn: document.getElementById("speakLetterBtn"),
    audioFallback: document.getElementById("audioFallback"),
    starCount: document.getElementById("starCount"),
    doneCount: document.getElementById("doneCount"),
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
    reviewList: document.getElementById("reviewList")
  };

  const state = {
    selectedLetter: lesson.letters[0],
    progress: loadProgress(),
    hearIndex: 0,
    pictureIndex: 0,
    arrangeIndex: 0,
    arrangeSelected: []
  };

  function cloneSafeStart() {
    return {
      stars: SAFE_START.stars,
      done: {
        hear: SAFE_START.done.hear,
        picture: SAFE_START.done.picture,
        arrange: SAFE_START.done.arrange
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
        done: {
          hear: Boolean(parsed.done && parsed.done.hear),
          picture: Boolean(parsed.done && parsed.done.picture),
          arrange: Boolean(parsed.done && parsed.done.arrange)
        }
      };
    } catch (error) {
      return cloneSafeStart();
    }
  }

  function saveProgress() {
    localStorage.setItem(PROGRESS_KEY, JSON.stringify(state.progress));
  }

  function addStars(amount) {
    state.progress.stars += amount;
    saveProgress();
    renderProgress();
  }

  function markDone(activityId) {
    if (!state.progress.done[activityId]) {
      state.progress.done[activityId] = true;
      addStars(1);
      saveProgress();
      renderProgress();
    }
  }

  function renderProgress() {
    const doneTotal = Object.values(state.progress.done).filter(Boolean).length;
    ui.starCount.textContent = String(state.progress.stars);
    ui.doneCount.textContent = String(doneTotal);
    const percent = Math.round((doneTotal / 3) * 100);
    ui.progressFill.style.width = percent + "%";
    if (doneTotal === 3) {
      ui.progressText.textContent = "All activities complete. Fantastic work!";
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
    window.spSpeak(letter.devanagari, "sa-IN", ui.audioFallback);
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
          ui.hearStatus.textContent = "Great listening! +2 stars";
          addStars(2);
          markDone("hear");
        } else {
          button.classList.add("wrong");
          ui.hearStatus.textContent = "Nice try. Listen again and retry.";
        }
      });
      ui.hearChoices.appendChild(button);
    });
  }

  function playHearPrompt() {
    const prompt = lesson.activities.hearAndPick[state.hearIndex];
    window.spSpeak(prompt.letter, "sa-IN", ui.hearStatus);
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
          ui.pictureStatus.textContent = "Correct match! +2 stars";
          addStars(2);
          markDone("picture");
        } else {
          button.classList.add("wrong");
          ui.pictureStatus.textContent = "Not yet. Try a different word.";
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

    item.tiles.forEach(function addTile(tile, index) {
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
      if (index === item.tiles.length - 1) {
        button.dataset.lastTile = "true";
      }
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
      ui.arrangeStatus.textContent = "Excellent! +2 stars";
      addStars(2);
      markDone("arrange");
      ui.arrangeTiles.querySelectorAll("button").forEach(function markCorrect(button) {
        button.classList.add("correct");
      });
      return;
    }

    ui.arrangeStatus.textContent = "Almost there. Tap Retry and try again.";
    ui.arrangeTiles.querySelectorAll("button").forEach(function markWrong(button) {
      button.classList.add("wrong");
    });
  }

  function nextArrangeWord() {
    state.arrangeIndex = (state.arrangeIndex + 1) % lesson.activities.arrangeWord.length;
    setupArrangeWord();
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

  function init() {
    ui.audioDisclaimer.textContent = lesson.disclaimer;
    renderLetterDetail(state.selectedLetter);
    renderLetterGrid();
    renderProgress();
    setupHearAndPick();
    setupPictureMatch();
    setupArrangeWord();
    renderReviewList();

    ui.speakLetterBtn.addEventListener("click", speakSelectedLetter);
    ui.playHearPrompt.addEventListener("click", playHearPrompt);
    ui.nextHear.addEventListener("click", nextHearPrompt);
    ui.nextPicture.addEventListener("click", nextPictureMatch);
    ui.resetArrange.addEventListener("click", resetArrangeSelection);
    ui.checkArrange.addEventListener("click", checkArrangeSelection);
    ui.nextArrange.addEventListener("click", nextArrangeWord);
  }

  init();
})();
