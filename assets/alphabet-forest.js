(function initAlphabetForestV3() {
  const AUDIO_ENABLED = false;
  const LETTER_COUNT = 48;
  const TREE_GROUP_SIZE = 5;
  const REDUCED_MOTION = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const CORE = window.SPAlphabetForestCore;
  if (!CORE) return;
  if (!window.SP_PDF_LETTER_INVENTORY || !Array.isArray(window.SP_PDF_LETTER_INVENTORY.items)) return;

  const ACTIVITIES = [
    { id: "magical-tree", title: "Magical Tree", sectionId: "forestScene", controlsId: "controls-magical-tree" },
    { id: "letter-garden", title: "Letter Garden", sectionId: "letterGardenSection", controlsId: "controls-letter-garden" },
    { id: "hear-and-pick", title: "Hear and Pick", sectionId: "activityHearGamePanel", controlsId: "controls-hear-and-pick" },
    { id: "picture-match", title: "Picture Match", sectionId: "activityPictureGamePanel", controlsId: "controls-picture-match" },
    { id: "arrange-word", title: "Arrange the Word", sectionId: "activityArrangeGamePanel", controlsId: "controls-arrange-word" },
    { id: "flashcard-flip", title: "Flashcard Flip", sectionId: "activityFlashGamePanel", controlsId: "controls-flashcard-flip" },
    { id: "feed-mithu", title: "Feed Mithu", sectionId: "activityFeedGamePanel", controlsId: "controls-feed-mithu" },
    { id: "hidden-letter-hunt", title: "Hidden Letter Hunt", sectionId: "activityHuntGamePanel", controlsId: "controls-hidden-letter-hunt" }
  ];
  const ACTIVITY_BY_ID = Object.fromEntries(ACTIVITIES.map(function mapActivity(activity) {
    return [activity.id, activity];
  }));

  const letters = window.SP_PDF_LETTER_INVENTORY.items
    .map(function mapInventory(item, index) {
      const example = item.example || {};
      return {
        id: item.id || ("letter-" + index),
        symbol: item.symbol,
        transliteration: item.transliteration || "",
        category: item.category || "consonant",
        subgroup: item.subgroup || "other",
        exampleText: example.sanskrit || item.symbol,
        meaning: example.meaning || "Meaning pending review"
      };
    })
    .filter(function hasSymbol(item) { return Boolean(item.symbol); })
    .slice(0, LETTER_COUNT);

  const letterIds = letters.map(function toId(letter) { return letter.id; });
  const letterById = new Map(letters.map(function toTuple(letter) { return [letter.id, letter]; }));

  const ui = {
    root: document.getElementById("main-content"),
    jumpNav: document.getElementById("activityJumpNav"),
    muteToggle: document.getElementById("muteToggle"),
    testSoundBtn: document.getElementById("testSoundBtn"),
    audioDisclaimer: document.getElementById("audioDisclaimer"),
    audioDebug: document.getElementById("audioDebug"),
    globalSummary: document.getElementById("globalProgressSummary"),
    globalFill: document.getElementById("globalProgressFill"),
    doneCount: document.getElementById("doneCount"),
    starCount: document.getElementById("starCount"),
    streakCount: document.getElementById("streakCount"),
    progressFill: document.getElementById("progressFill"),
    progressText: document.getElementById("progressText"),
    lessonMascotSpeech: document.getElementById("lessonMascotSpeech"),
    treeLetters: document.getElementById("magicalTreeLetters"),
    treeCounter: document.getElementById("treeCounter"),
    treeStatus: document.getElementById("treeStatus"),
    treeInstruction: document.getElementById("treeInstruction"),
    prevTreeGroupBtn: document.getElementById("prevTreeGroupBtn"),
    nextTreeGroupBtn: document.getElementById("nextTreeGroupBtn"),
    spotlightDev: document.getElementById("spotlightLetterDev"),
    spotlightTran: document.getElementById("spotlightLetterTran"),
    spotlightExample: document.getElementById("spotlightLetterExample"),
    letterCategoryTabs: Array.from(document.querySelectorAll(".category-tab")),
    subgroupTabs: document.getElementById("consonantSubgroupTabs"),
    gardenCoverage: document.getElementById("gardenCoverage"),
    letterGrid: document.getElementById("letterGrid"),
    selectedDev: document.getElementById("selectedDev"),
    selectedTran: document.getElementById("selectedTran"),
    selectedExample: document.getElementById("selectedExample"),
    selectedMeaning: document.getElementById("selectedMeaning"),
    selectedPosition: document.getElementById("selectedPosition"),
    selectedLearned: document.getElementById("selectedLearned"),
    selectedExampleArt: document.getElementById("selectedExampleArt"),
    hearChoices: document.getElementById("hearChoices"),
    hearStatus: document.getElementById("hearStatus"),
    picturePrompt: document.getElementById("picturePrompt"),
    pictureChoices: document.getElementById("pictureChoices"),
    pictureStatus: document.getElementById("pictureStatus"),
    arrangePrompt: document.getElementById("arrangePrompt"),
    arrangeTiles: document.getElementById("arrangeTiles"),
    arrangeAnswer: document.getElementById("arrangeAnswer"),
    arrangeStatus: document.getElementById("arrangeStatus"),
    checkArrange: document.getElementById("checkArrange"),
    resetArrange: document.getElementById("resetArrange"),
    flipFlashcard: document.getElementById("flipFlashcard"),
    flashcard: document.getElementById("flashcard"),
    flashChoices: document.getElementById("flashChoices"),
    flashStatus: document.getElementById("flashStatus"),
    feedPrompt: document.getElementById("feedPrompt"),
    feedChoices: document.getElementById("feedChoices"),
    feedStatus: document.getElementById("feedStatus"),
    huntPrompt: document.getElementById("huntPrompt"),
    huntGrid: document.getElementById("huntGrid"),
    huntStatus: document.getElementById("huntStatus"),
    completionCanvas: document.getElementById("celebration-canvas")
  };

  const stateApi = CORE.createStateApi(window.localStorage, letters.length);
  const forestState = stateApi.loadState();
  stateApi.saveState(forestState);
  const runtime = {
    byActivity: {},
    confetti: null
  };
  ACTIVITIES.forEach(function initRuntime(activity) {
    runtime.byActivity[activity.id] = {
      status: "",
      retryStamp: 0,
      tempAnswer: "",
      flashFlipped: false,
      traceStrokes: 0
    };
  });

  disableAudioForThisPage();
  installJumpNavigation();
  installTreeGroupButtons();
  installArrangeButtons();
  installFlashcardButtons();
  installControls();
  initializeConfetti();
  renderAll();

  function disableAudioForThisPage() {
    document.body.classList.add("audio-disabled");
    if (ui.muteToggle) {
      ui.muteToggle.disabled = true;
      ui.muteToggle.textContent = "🔇 Sound: Disabled";
      ui.muteToggle.setAttribute("aria-disabled", "true");
    }
    if (ui.testSoundBtn) ui.testSoundBtn.disabled = true;
    document.querySelectorAll(".audio-control").forEach(function disableControl(node) {
      if (node.tagName === "BUTTON") node.disabled = true;
      node.setAttribute("hidden", "hidden");
    });
    if (ui.audioDisclaimer) ui.audioDisclaimer.textContent = "Audio is temporarily disabled on Alphabet Forest.";
    if (ui.audioDebug) ui.audioDebug.textContent = "AUDIO_ENABLED = false";
  }

  function installJumpNavigation() {
    if (!ui.jumpNav) return;
    const links = Array.from(ui.jumpNav.querySelectorAll("a.jump-link"));
    const sectionById = new Map(ACTIVITIES.map(function mapSections(activity) {
      return [activity.sectionId, document.getElementById(activity.sectionId)];
    }));
    links.forEach(function attachJump(link) {
      link.addEventListener("click", function onJump(event) {
        const href = link.getAttribute("href") || "";
        if (!href.startsWith("#")) return;
        const target = document.getElementById(href.slice(1));
        if (!target) return;
        event.preventDefault();
        target.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    });
    if (REDUCED_MOTION || typeof IntersectionObserver !== "function") return;
    const observer = new IntersectionObserver(function onSections(entries) {
      const active = entries
        .filter(function isVisible(entry) { return entry.isIntersecting; })
        .sort(function byRatio(a, b) { return b.intersectionRatio - a.intersectionRatio; })[0];
      if (!active) return;
      const activeId = active.target.id;
      links.forEach(function mark(link) {
        const href = link.getAttribute("href");
        link.classList.toggle("active", href === "#" + activeId);
      });
    }, { threshold: [0.35, 0.55, 0.75] });
    sectionById.forEach(function observe(section) {
      if (section) observer.observe(section);
    });
  }

  function installTreeGroupButtons() {
    if (ui.prevTreeGroupBtn) {
      ui.prevTreeGroupBtn.addEventListener("click", function onTreePrev() {
        const activity = forestState.activities["magical-tree"];
        const currentGroup = Math.floor(activity.currentIndex / TREE_GROUP_SIZE);
        if (currentGroup <= 0) return;
        activity.currentIndex = Math.max(0, (currentGroup - 1) * TREE_GROUP_SIZE);
        setActivityStatus("magical-tree", "Moved to previous letter group.");
        saveAndRender();
      });
    }
    if (ui.nextTreeGroupBtn) {
      ui.nextTreeGroupBtn.addEventListener("click", function onTreeNext() {
        const activity = forestState.activities["magical-tree"];
        const maxGroup = Math.floor((letters.length - 1) / TREE_GROUP_SIZE);
        const currentGroup = Math.floor(activity.currentIndex / TREE_GROUP_SIZE);
        if (currentGroup >= maxGroup) return;
        activity.currentIndex = Math.min(letters.length - 1, (currentGroup + 1) * TREE_GROUP_SIZE);
        setActivityStatus("magical-tree", "Moved to next letter group.");
        saveAndRender();
      });
    }
  }

  function installArrangeButtons() {
    if (ui.checkArrange) {
      ui.checkArrange.addEventListener("click", function onArrangeCheck() {
        const activityId = "arrange-word";
        const activity = forestState.activities[activityId];
        const letter = letterForActivityIndex(activityId, activity.currentIndex);
        const answer = runtime.byActivity[activityId].tempAnswer || "";
        if (answer === letter.exampleText) {
          markCurrentComplete(activityId, "Great arranging! Move to the next letter.");
          if (ui.arrangeStatus) ui.arrangeStatus.textContent = "Correct arrangement!";
        } else {
          incrementAttempt(activityId);
          if (ui.arrangeStatus) ui.arrangeStatus.textContent = "Not yet. Tap Retry and try again.";
        }
      });
    }
    if (ui.resetArrange) {
      ui.resetArrange.addEventListener("click", function onArrangeReset() {
        dispatchActivityAction("arrange-word", "retry");
      });
    }
  }

  function installFlashcardButtons() {
    if (ui.flipFlashcard) {
      ui.flipFlashcard.addEventListener("click", function onFlipFlash() {
        runtime.byActivity["flashcard-flip"].flashFlipped = !runtime.byActivity["flashcard-flip"].flashFlipped;
        renderFlashcardFlip();
      });
    }
  }

  function installControls() {
    ACTIVITIES.forEach(function eachActivity(activity) {
      const mount = document.getElementById(activity.controlsId);
      if (!mount) return;
      mount.className = "activity-local-controls";
      mount.innerHTML =
        '<p class="activity-progress" id="progress-' + activity.id + '"></p>' +
        '<div class="hero-actions">' +
        '<button type="button" class="button ghost" data-action="previous">Previous</button>' +
        '<button type="button" class="button ghost" data-action="retry">Retry</button>' +
        '<button type="button" class="button secondary" data-action="next">Next</button>' +
        '<button type="button" class="button secondary" data-action="finish" hidden>Finish Activity</button>' +
        '<button type="button" class="button ghost" data-action="restart">Restart Activity</button>' +
        "</div>" +
        '<p class="status" id="status-' + activity.id + '" aria-live="polite"></p>' +
        '<p class="activity-complete-note" id="complete-' + activity.id + '" tabindex="-1"></p>';

      mount.querySelector('[data-action="previous"]').addEventListener("click", function () {
        dispatchActivityAction(activity.id, "previous");
      });
      mount.querySelector('[data-action="retry"]').addEventListener("click", function () {
        dispatchActivityAction(activity.id, "retry");
      });
      mount.querySelector('[data-action="next"]').addEventListener("click", function () {
        dispatchActivityAction(activity.id, "next");
      });
      mount.querySelector('[data-action="finish"]').addEventListener("click", function () {
        dispatchActivityAction(activity.id, "finish");
      });
      mount.querySelector('[data-action="restart"]').addEventListener("click", function () {
        dispatchActivityAction(activity.id, "restart");
      });
    });

    ui.letterCategoryTabs.forEach(function bindCategory(tab) {
      tab.addEventListener("click", function onCategoryClick() {
        const categoryId = tab.getAttribute("data-category") || "vowels";
        forestState.activities["letter-garden"].answers.category = categoryId;
        if (categoryId !== "consonants") {
          forestState.activities["letter-garden"].answers.subgroup = "all";
        }
        saveAndRender();
      });
    });
  }

  function initializeConfetti() {
    if (!ui.completionCanvas) return;
    if (typeof window.confetti !== "function") return;
    runtime.confetti = window.confetti.create(ui.completionCanvas, { resize: true, useWorker: true });
  }

  function triggerCelebration(isGlobal) {
    if (REDUCED_MOTION) return;
    if (!runtime.confetti) return;
    runtime.confetti({
      particleCount: isGlobal ? 180 : 80,
      spread: isGlobal ? 110 : 70,
      startVelocity: isGlobal ? 34 : 24,
      origin: { y: 0.65 }
    });
  }

  function incrementAttempt(activityId) {
    const activity = forestState.activities[activityId];
    const index = activity.currentIndex;
    activity.attempts[index] = (activity.attempts[index] || 0) + 1;
  }

  function setActivityStatus(activityId, message) {
    runtime.byActivity[activityId].status = message;
  }

  function letterForActivityIndex(activityId, index) {
    const activity = forestState.activities[activityId];
    const mappedIndex = activity.order[index];
    const id = letterIds[mappedIndex];
    return letterById.get(id);
  }

  function isCurrentResolved(activityId) {
    const activity = forestState.activities[activityId];
    return activity.completedItems.includes(activity.currentIndex);
  }

  function markCurrentComplete(activityId, message) {
    CORE.markCurrentItemCompleted(forestState, activityId, 1);
    setActivityStatus(activityId, message);
    saveAndRender();
  }

  function dispatchActivityAction(activityId, actionName) {
    const activity = forestState.activities[activityId];
    if (!activity) return;

    if (actionName === "previous") {
      if (activityId === "magical-tree") {
        const currentGroup = Math.floor(activity.currentIndex / TREE_GROUP_SIZE);
        if (currentGroup > 0) activity.currentIndex = (currentGroup - 1) * TREE_GROUP_SIZE;
      } else {
        CORE.goPrevious(forestState, activityId);
      }
      setActivityStatus(activityId, "Moved to previous item.");
      saveAndRender();
      return;
    }

    if (actionName === "next") {
      if (!isCurrentResolved(activityId)) return;
      if (activityId === "magical-tree") {
        const currentGroup = Math.floor(activity.currentIndex / TREE_GROUP_SIZE);
        const maxGroup = Math.floor((letters.length - 1) / TREE_GROUP_SIZE);
        if (currentGroup < maxGroup) activity.currentIndex = (currentGroup + 1) * TREE_GROUP_SIZE;
      } else {
        CORE.goNext(forestState, activityId);
      }
      setActivityStatus(activityId, "Moved to next item.");
      saveAndRender();
      return;
    }

    if (actionName === "retry") {
      CORE.retryCurrent(forestState, activityId);
      runtime.byActivity[activityId].retryStamp += 1;
      runtime.byActivity[activityId].tempAnswer = "";
      runtime.byActivity[activityId].flashFlipped = false;
      setActivityStatus(activityId, "Retry current item.");
      saveAndRender();
      return;
    }

    if (actionName === "finish") {
      const success = CORE.finalizeActivity(forestState, activityId);
      if (!success) {
        setActivityStatus(activityId, "Complete all 48 items before finishing.");
        saveAndRender();
        return;
      }
      const global = CORE.computeGlobalProgress(forestState);
      setActivityStatus(activityId, "Activity complete!");
      triggerCelebration(false);
      if (global.completedActivityCount === global.totalActivities) {
        triggerCelebration(true);
      }
      saveAndRender();
      focusCompletionMessage(activityId);
      return;
    }

    if (actionName === "restart") {
      if (!activity.isComplete) return;
      const confirmed = window.confirm("Restart only this activity from item 1?");
      if (!confirmed) return;
      CORE.resetActivity(forestState, activityId);
      setActivityStatus(activityId, "Activity restarted from item 1.");
      saveAndRender();
      return;
    }
  }

  function focusCompletionMessage(activityId) {
    const note = document.getElementById("complete-" + activityId);
    if (!note) return;
    note.focus();
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
    renderHiddenLetterHunt();
    renderAllControls();
  }

  function renderGlobalProgress() {
    const global = CORE.computeGlobalProgress(forestState);
    const completedActivities = global.completedActivityCount;
    if (ui.globalSummary) ui.globalSummary.textContent = completedActivities + " of 8 activities complete";
    if (ui.globalFill) ui.globalFill.style.width = global.globalPercent.toFixed(1) + "%";
    if (ui.doneCount) ui.doneCount.textContent = String(completedActivities);
    if (ui.starCount) ui.starCount.textContent = String(forestState.xp);
    if (ui.streakCount) ui.streakCount.textContent = String(completedActivities);
    if (ui.progressFill) ui.progressFill.style.width = global.globalPercent.toFixed(1) + "%";
    if (ui.progressText) ui.progressText.textContent = completedActivities + " of 8 activities completed.";
    if (ui.lessonMascotSpeech) {
      ui.lessonMascotSpeech.textContent = global.completedActivityCount === 8
        ? "Wonderful! You finished all Alphabet Forest activities."
        : "Keep going. Each activity has its own progress.";
    }
  }

  function renderAllControls() {
    ACTIVITIES.forEach(function eachActivity(activityDef) {
      const activity = forestState.activities[activityDef.id];
      const mount = document.getElementById(activityDef.controlsId);
      if (!mount) return;
      const currentIndex = activity.currentIndex;
      const resolved = isCurrentResolved(activityDef.id);
      const atLast = currentIndex >= letters.length - 1;
      const canFinish = atLast && resolved && activity.completedItems.length >= letters.length && !activity.isComplete;

      const progress = mount.querySelector("#progress-" + activityDef.id);
      const status = mount.querySelector("#status-" + activityDef.id);
      const completeNote = mount.querySelector("#complete-" + activityDef.id);
      const previousBtn = mount.querySelector('[data-action="previous"]');
      const retryBtn = mount.querySelector('[data-action="retry"]');
      const nextBtn = mount.querySelector('[data-action="next"]');
      const finishBtn = mount.querySelector('[data-action="finish"]');
      const restartBtn = mount.querySelector('[data-action="restart"]');

      if (progress) {
        const itemWord = activityDef.id === "magical-tree" ? "Letter" : "Question";
        progress.textContent = itemWord + " " + (currentIndex + 1) + " of " + letters.length;
      }
      if (status) status.textContent = runtime.byActivity[activityDef.id].status || "";
      if (completeNote) completeNote.textContent = activity.isComplete ? activityDef.title + " complete." : "";

      if (previousBtn) previousBtn.disabled = currentIndex === 0;
      if (retryBtn) retryBtn.disabled = false;
      if (nextBtn) {
        nextBtn.hidden = canFinish;
        nextBtn.disabled = atLast || !resolved;
      }
      if (finishBtn) {
        finishBtn.hidden = !canFinish;
        finishBtn.disabled = !canFinish;
      }
      if (restartBtn) restartBtn.disabled = !activity.isComplete;
    });
  }

  function renderMagicalTree() {
    if (!ui.treeLetters) return;
    const activityId = "magical-tree";
    const activity = forestState.activities[activityId];
    const groupStart = Math.floor(activity.currentIndex / TREE_GROUP_SIZE) * TREE_GROUP_SIZE;
    const groupEnd = Math.min(groupStart + TREE_GROUP_SIZE, letters.length);
    const groupLetters = letters.slice(groupStart, groupEnd);
    const groupNumber = Math.floor(groupStart / TREE_GROUP_SIZE) + 1;
    const groupTotal = Math.ceil(letters.length / TREE_GROUP_SIZE);

    if (ui.treeInstruction) ui.treeInstruction.textContent = "Tap a glowing letter to discover its sound!";
    if (ui.treeCounter) ui.treeCounter.textContent = groupNumber + " of " + groupTotal + " groups · " + activity.completedItems.length + " of 48 letters discovered";
    if (ui.treeStatus) ui.treeStatus.textContent = runtime.byActivity[activityId].status || "Discover all letters in this group.";
    if (ui.prevTreeGroupBtn) ui.prevTreeGroupBtn.disabled = groupStart === 0;
    if (ui.nextTreeGroupBtn) ui.nextTreeGroupBtn.disabled = groupEnd >= letters.length;

    ui.treeLetters.innerHTML = "";
    const slots = [
      { x: 31, y: 34 },
      { x: 43, y: 23 },
      { x: 56, y: 29 },
      { x: 67, y: 22 },
      { x: 74, y: 36 }
    ];
    groupLetters.forEach(function addTreeLetter(letter, offset) {
      const letterIndex = groupStart + offset;
      const button = document.createElement("button");
      button.type = "button";
      button.className = "tree-letter-btn";
      button.innerHTML = '<span class="tree-dev">' + letter.symbol + "</span>";
      button.style.left = slots[offset].x + "%";
      button.style.top = slots[offset].y + "%";
      if (activity.completedItems.includes(letterIndex)) button.classList.add("discovered");
      if (activity.currentIndex === letterIndex) button.classList.add("tree-active");
      button.addEventListener("click", function onTreeTap() {
        activity.currentIndex = letterIndex;
        if (!activity.completedItems.includes(letterIndex)) {
          markCurrentComplete(activityId, "Beautiful! Letter discovered.");
        } else {
          setActivityStatus(activityId, "Letter already discovered.");
          saveAndRender();
        }
        const nowCompleted = groupLetters.every(function allGroupDone(_entry, innerOffset) {
          return activity.completedItems.includes(groupStart + innerOffset);
        });
        if (nowCompleted && groupEnd < letters.length) {
          activity.currentIndex = groupEnd;
          setActivityStatus(activityId, "Group complete. Moving to next group.");
          saveAndRender();
        }
      });
      ui.treeLetters.appendChild(button);
    });

    const currentLetter = letters[activity.currentIndex];
    if (currentLetter) {
      if (ui.spotlightDev) ui.spotlightDev.textContent = currentLetter.symbol;
      if (ui.spotlightTran) ui.spotlightTran.textContent = currentLetter.transliteration;
      if (ui.spotlightExample) ui.spotlightExample.textContent = currentLetter.exampleText + " · " + currentLetter.meaning;
    }
  }

  function renderConsonantSubgroupButtons() {
    if (!ui.subgroupTabs) return;
    const activity = forestState.activities["letter-garden"];
    const category = activity.answers.category || "vowels";
    if (category !== "consonants") {
      ui.subgroupTabs.innerHTML = "";
      return;
    }
    const subgroups = Array.from(
      new Set(letters.filter(function onlyConsonants(item) { return item.category === "consonant"; }).map(function groupName(item) {
        return item.subgroup || "other";
      }))
    );
    const activeSubgroup = activity.answers.subgroup || "all";
    ui.subgroupTabs.innerHTML = "";

    const allBtn = document.createElement("button");
    allBtn.type = "button";
    allBtn.className = "button ghost";
    allBtn.textContent = "All";
    allBtn.classList.toggle("active", activeSubgroup === "all");
    allBtn.addEventListener("click", function onAll() {
      activity.answers.subgroup = "all";
      saveAndRender();
    });
    ui.subgroupTabs.appendChild(allBtn);

    subgroups.forEach(function eachSubgroup(subgroup) {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "button ghost";
      button.textContent = subgroup;
      button.classList.toggle("active", activeSubgroup === subgroup);
      button.addEventListener("click", function onSubgroup() {
        activity.answers.subgroup = subgroup;
        saveAndRender();
      });
      ui.subgroupTabs.appendChild(button);
    });
  }

  function renderLetterGarden() {
    const activityId = "letter-garden";
    const activity = forestState.activities[activityId];
    const selected = letterForActivityIndex(activityId, activity.currentIndex);
    if (!selected || !ui.letterGrid) return;

    const category = activity.answers.category || "vowels";
    const subgroup = activity.answers.subgroup || "all";
    ui.letterCategoryTabs.forEach(function markTab(tab) {
      const id = tab.getAttribute("data-category");
      tab.classList.toggle("active", id === category);
      tab.setAttribute("aria-pressed", id === category ? "true" : "false");
    });
    renderConsonantSubgroupButtons();

    const lettersForCategory = letters.filter(function filter(letter, index) {
      if (category === "practice") return true;
      if (category === "vowels") return letter.category !== "consonant";
      if (category === "consonants") {
        if (letter.category !== "consonant") return false;
        if (subgroup === "all") return true;
        return (letter.subgroup || "other") === subgroup;
      }
      return index >= 0;
    });

    if (!lettersForCategory.length) {
      ui.letterGrid.innerHTML = '<p class="section-warning">This letter group could not be loaded.</p>';
      console.error("Letter Garden category has no mapped letters", category);
      return;
    }

    ui.letterGrid.innerHTML = "";
    lettersForCategory.forEach(function renderGardenTile(letter) {
      const index = letters.findIndex(function isTarget(entry) { return entry.id === letter.id; });
      const tile = document.createElement("button");
      tile.type = "button";
      tile.className = "letter-btn";
      if (index === activity.currentIndex) tile.classList.add("active");
      if (activity.completedItems.includes(index)) tile.classList.add("learned");
      tile.innerHTML =
        '<span class="tile-star" aria-hidden="true">' + (activity.completedItems.includes(index) ? "⭐" : "☆") + "</span>" +
        '<span class="dev">' + letter.symbol + '</span>' +
        '<span class="tran">' + letter.transliteration + "</span>";
      tile.addEventListener("click", function onSelectTile() {
        activity.currentIndex = index;
        if (!activity.completedItems.includes(index)) {
          markCurrentComplete(activityId, "Letter explored.");
        } else {
          setActivityStatus(activityId, "Letter reviewed again.");
          saveAndRender();
        }
      });
      ui.letterGrid.appendChild(tile);
    });

    if (ui.selectedDev) ui.selectedDev.textContent = selected.symbol;
    if (ui.selectedTran) ui.selectedTran.textContent = selected.transliteration;
    if (ui.selectedExample) ui.selectedExample.textContent = selected.exampleText;
    if (ui.selectedMeaning) ui.selectedMeaning.textContent = selected.meaning;
    if (ui.selectedPosition) ui.selectedPosition.textContent = "Letter " + (activity.currentIndex + 1) + " of 48";
    if (ui.selectedLearned) {
      const learned = activity.completedItems.includes(activity.currentIndex);
      ui.selectedLearned.textContent = learned ? "⭐ Learned" : "☆ Not learned yet";
      ui.selectedLearned.classList.toggle("learned", learned);
    }
    if (ui.selectedExampleArt) ui.selectedExampleArt.textContent = "🪷";
    if (ui.gardenCoverage) ui.gardenCoverage.textContent = activity.completedItems.length + " of 48 letters explored.";
  }

  function buildOptionIndices(targetIndex, count) {
    const options = [targetIndex];
    let cursor = 1;
    while (options.length < count) {
      const next = (targetIndex + cursor * 7) % letters.length;
      if (!options.includes(next)) options.push(next);
      cursor += 1;
    }
    return options;
  }

  function renderHearAndPick() {
    const activityId = "hear-and-pick";
    const activity = forestState.activities[activityId];
    const target = letterForActivityIndex(activityId, activity.currentIndex);
    if (!target || !ui.hearChoices || !ui.hearStatus) return;
    ui.hearChoices.innerHTML = "";
    ui.hearStatus.textContent = "Tap the matching letter.";
    const options = buildOptionIndices(activity.currentIndex, 4).map(function toLetter(index) { return letters[index]; });
    options.forEach(function optionButton(option) {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "choice-btn";
      button.textContent = option.symbol;
      button.addEventListener("click", function onPick() {
        if (option.id === target.id) {
          markCurrentComplete(activityId, "Correct pick!");
          button.classList.add("correct");
        } else {
          incrementAttempt(activityId);
          button.classList.add("wrong");
          ui.hearStatus.textContent = "Try again.";
        }
      });
      ui.hearChoices.appendChild(button);
    });
  }

  function renderPictureMatch() {
    const activityId = "picture-match";
    const activity = forestState.activities[activityId];
    const target = letterForActivityIndex(activityId, activity.currentIndex);
    if (!target || !ui.pictureChoices || !ui.picturePrompt || !ui.pictureStatus) return;
    ui.picturePrompt.textContent = "Pick the transliteration for " + target.symbol + ".";
    ui.pictureStatus.textContent = "Choose one option.";
    ui.pictureChoices.innerHTML = "";
    const options = buildOptionIndices(activity.currentIndex, 4).map(function toLetter(index) { return letters[index].transliteration; });
    options.forEach(function eachOption(option) {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "choice-btn";
      button.textContent = option;
      button.addEventListener("click", function onChoice() {
        if (option === target.transliteration) {
          button.classList.add("correct");
          markCurrentComplete(activityId, "Correct match!");
        } else {
          incrementAttempt(activityId);
          button.classList.add("wrong");
          ui.pictureStatus.textContent = "Not yet. Try again.";
        }
      });
      ui.pictureChoices.appendChild(button);
    });
  }

  function renderArrangeWord() {
    const activityId = "arrange-word";
    const activity = forestState.activities[activityId];
    const target = letterForActivityIndex(activityId, activity.currentIndex);
    if (!target || !ui.arrangeTiles || !ui.arrangePrompt || !ui.arrangeAnswer || !ui.arrangeStatus) return;
    const answer = runtime.byActivity[activityId].tempAnswer || "";
    const pieces = Array.from(target.exampleText);
    const shuffled = pieces.slice().reverse();
    ui.arrangePrompt.textContent = "Arrange the word: " + target.exampleText + " (" + target.meaning + ")";
    ui.arrangeTiles.innerHTML = "";
    ui.arrangeAnswer.textContent = answer;
    ui.arrangeStatus.textContent = "Build the exact Sanskrit word and press Check.";

    shuffled.forEach(function eachTile(tile) {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "tile-btn";
      button.textContent = tile;
      button.addEventListener("click", function onTile() {
        runtime.byActivity[activityId].tempAnswer += tile;
        ui.arrangeAnswer.textContent = runtime.byActivity[activityId].tempAnswer;
      });
      ui.arrangeTiles.appendChild(button);
    });
  }

  function renderFlashcardFlip() {
    const activityId = "flashcard-flip";
    const activity = forestState.activities[activityId];
    const target = letterForActivityIndex(activityId, activity.currentIndex);
    if (!target || !ui.flashcard || !ui.flashChoices || !ui.flashStatus) return;
    const flipped = runtime.byActivity[activityId].flashFlipped;
    ui.flashcard.innerHTML = flipped
      ? '<p><strong>' + target.exampleText + "</strong><br>(" + target.meaning + ")</p>"
      : '<p class="flash-dev">' + target.symbol + "</p>";
    ui.flashStatus.textContent = flipped ? "Choose the correct meaning." : "Flip the card first.";
    ui.flashChoices.innerHTML = "";
    if (!flipped) return;

    const options = buildOptionIndices(activity.currentIndex, 4).map(function toMeaning(index) { return letters[index].meaning; });
    options.forEach(function eachMeaning(meaning) {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "choice-btn";
      button.textContent = meaning;
      button.addEventListener("click", function onMeaningPick() {
        if (meaning === target.meaning) {
          button.classList.add("correct");
          markCurrentComplete(activityId, "Correct meaning!");
        } else {
          incrementAttempt(activityId);
          button.classList.add("wrong");
          ui.flashStatus.textContent = "Try again.";
        }
      });
      ui.flashChoices.appendChild(button);
    });
  }

  function renderFeedMithu() {
    const activityId = "feed-mithu";
    const activity = forestState.activities[activityId];
    const target = letterForActivityIndex(activityId, activity.currentIndex);
    if (!target || !ui.feedPrompt || !ui.feedChoices || !ui.feedStatus) return;
    ui.feedPrompt.textContent = "Feed Mithu the word that starts with " + target.symbol + ".";
    ui.feedStatus.textContent = "Choose one word.";
    ui.feedChoices.innerHTML = "";

    const options = buildOptionIndices(activity.currentIndex, 4).map(function toWord(index) { return letters[index].exampleText; });
    options.forEach(function eachWord(word) {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "choice-btn";
      button.textContent = word;
      button.addEventListener("click", function onWordPick() {
        if (word === target.exampleText) {
          button.classList.add("correct");
          markCurrentComplete(activityId, "Mithu is happy!");
        } else {
          incrementAttempt(activityId);
          button.classList.add("wrong");
          ui.feedStatus.textContent = "Try another word.";
        }
      });
      ui.feedChoices.appendChild(button);
    });
  }

  function renderHiddenLetterHunt() {
    const activityId = "hidden-letter-hunt";
    const activity = forestState.activities[activityId];
    const target = letterForActivityIndex(activityId, activity.currentIndex);
    if (!target || !ui.huntPrompt || !ui.huntGrid || !ui.huntStatus) return;
    ui.huntPrompt.textContent = "Find " + target.symbol + " in the grid.";
    ui.huntStatus.textContent = "Tap the target letter.";
    ui.huntGrid.innerHTML = "";
    const options = buildOptionIndices(activity.currentIndex, 8).map(function toLetter(index) { return letters[index]; });
    options.forEach(function huntOption(option) {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "tile-btn";
      button.textContent = option.symbol;
      button.addEventListener("click", function onHuntPick() {
        if (option.id === target.id) {
          button.classList.add("correct");
          markCurrentComplete(activityId, "Found it!");
        } else {
          incrementAttempt(activityId);
          button.classList.add("wrong");
          ui.huntStatus.textContent = "Keep searching.";
        }
      });
      ui.huntGrid.appendChild(button);
    });
  }

  function playPronunciationSafe() {
    if (!AUDIO_ENABLED) return;
  }

  playPronunciationSafe();
})();
