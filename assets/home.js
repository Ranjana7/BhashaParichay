(function initHomeAdventure() {
  const HOME_KEY = "sanskritParichay.home.progress";
  const LAST_WORLD_KEY = "sanskritParichay.lastWorld";
  const MUTE_KEY = "sanskritParichay.muted";
  const CHALLENGE_KEY = "sanskritParichay.dailyChallenge.progress";
  const panel = document.getElementById("previewPanel");
  if (!panel) return;

  const motion = window.Motion || {};
  const animate = motion.animate || function () {};
  const messages = window.SP_MESSAGES || {};
  const homeMsg = messages.home || {};
  const pathOrder = Array.isArray(window.SP_WORLD_ORDER) && window.SP_WORLD_ORDER.length
    ? window.SP_WORLD_ORDER.slice()
    : ["alphabet", "animals", "numbers", "colours", "words", "sentences", "stories", "culture"];
  const worldTotals = window.SP_WORLD_TOTALS && typeof window.SP_WORLD_TOTALS === "object"
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
  const worldMeta = window.SP_WORLD_META && typeof window.SP_WORLD_META === "object"
    ? window.SP_WORLD_META
    : {};
  const worldLinks = {
    alphabet: (worldMeta.alphabet && worldMeta.alphabet.url) || "alphabet-forest.html",
    animals: (worldMeta.animals && worldMeta.animals.url) || "learning-world.html?world=animals",
    numbers: (worldMeta.numbers && worldMeta.numbers.url) || "learning-world.html?world=numbers",
    colours: (worldMeta.colours && worldMeta.colours.url) || "learning-world.html?world=colours",
    words: (worldMeta.words && worldMeta.words.url) || "learning-world.html?world=words",
    sentences: (worldMeta.sentences && worldMeta.sentences.url) || "learning-world.html?world=sentences",
    stories: (worldMeta.stories && worldMeta.stories.url) || "learning-world.html?world=stories",
    culture: (worldMeta.culture && worldMeta.culture.url) || "learning-world.html?world=culture"
  };
  const challengeSteps = [
    {
      id: "listen",
      title: "Listening Challenge",
      prompt: "Listen to the word and choose it.",
      playText: "गजः",
      options: ["गजः", "कमलम्", "नदी"],
      answer: "गजः",
      success: "Excellent listening!"
    },
    {
      id: "picture",
      title: "Picture Match",
      prompt: "Which Sanskrit word matches 🌙 (moon)?",
      options: ["चन्द्रः", "फलम्", "माता"],
      answer: "चन्द्रः",
      success: "Correct picture match!"
    },
    {
      id: "vocabulary",
      title: "Vocabulary Challenge",
      prompt: "Pick the Sanskrit word for river.",
      options: ["नदी", "रथः", "गृहम्"],
      answer: "नदी",
      success: "Great vocabulary choice!"
    },
    {
      id: "build",
      title: "Word-Building Challenge",
      prompt: "Build the Sanskrit word for lotus.",
      tiles: ["क", "म", "लम्"],
      answer: "कमलम्",
      success: "Beautifully built!"
    },
    {
      id: "revision",
      title: "Revision Question",
      prompt: "Which means mother?",
      options: ["माता", "योगः", "वनम्"],
      answer: "माता",
      success: "Revision complete!"
    }
  ];

  const ui = {
    title: document.getElementById("previewTitle"),
    text: document.getElementById("previewText"),
    challengeMeta: document.getElementById("challengeMeta"),
    challengeProgressFill: document.getElementById("challengeProgressFill"),
    challengeProgressText: document.getElementById("challengeProgressText"),
    choices: document.getElementById("previewChoices"),
    status: document.getElementById("previewStatus"),
    challengeActionBtn: document.getElementById("challengeActionBtn"),
    mascot: document.getElementById("mascot"),
    mascotSpeech: document.getElementById("mascotSpeech"),
    homeReturningMessage: document.getElementById("homeReturningMessage"),
    homeHeroSubtitle: document.getElementById("homeHeroSubtitle"),
    homeStars: document.getElementById("homeStars"),
    homeGems: document.getElementById("homeGems"),
    continueBtn: document.getElementById("continueBtn"),
    challengeBtn: document.getElementById("challengeBtn"),
    challengeSubtitle: document.getElementById("challengeSubtitle"),
    playNowBtn: document.getElementById("playNowBtn"),
    resetBtn: document.getElementById("resetProgressBtn"),
    resetModal: document.getElementById("resetConfirmModal"),
    resetKeepBtn: document.getElementById("resetKeepBtn"),
    resetStartBtn: document.getElementById("resetStartBtn"),
    worldCards: document.querySelectorAll(".world-card"),
    lottieButterflyOne: document.getElementById("lottieButterflyOne"),
    lottieButterflyTwo: document.getElementById("lottieButterflyTwo"),
    lottieButterflyThree: document.getElementById("lottieButterflyThree"),
    lottieSparkleOne: document.getElementById("lottieSparkleOne"),
    lottieSparkleTwo: document.getElementById("lottieSparkleTwo")
  };

  const state = loadHomeState();
  const daily = loadDailyProgress();
  if (typeof window.spSyncProgressModel === "function") {
    window.spSyncProgressModel(pathOrder, worldTotals);
  }
  const snapshot = getProgressSnapshot();
  if (ui.resetModal) ui.resetModal.hidden = true;
  window.addEventListener("pageshow", function () {
    if (ui.resetModal) ui.resetModal.hidden = true;
  });
  renderStats();
  renderChallengeIdle();
  wireUi();
  initHomeLottie();
  if (ui.homeHeroSubtitle && homeMsg.heroSubtitle) ui.homeHeroSubtitle.textContent = homeMsg.heroSubtitle;
  setMascotState("greeting", homeMsg.mascotIntro || "Namaste! Choose a world or play Challenge of the Day.");
  if (ui.challengeBtn) ui.challengeBtn.hidden = challengeSteps.length === 0;
  if (ui.homeReturningMessage && snapshot.totals && snapshot.totals.stars > 0) {
    ui.homeReturningMessage.hidden = false;
    ui.homeReturningMessage.textContent = homeMsg.returning || "Welcome back! Ready to continue your adventure?";
  }
  if (ui.challengeSubtitle) {
    ui.challengeSubtitle.textContent = "Play a little extra and collect more stars and gems!";
  }

  function londonDateKey() {
    const parts = new Intl.DateTimeFormat("en-GB", {
      timeZone: "Europe/London",
      year: "numeric",
      month: "2-digit",
      day: "2-digit"
    }).formatToParts(new Date());
    const get = function (type) {
      return (parts.find(function (p) { return p.type === type; }) || {}).value || "";
    };
    return get("year") + "-" + get("month") + "-" + get("day");
  }

  function loadHomeState() {
    try {
      const raw = localStorage.getItem(HOME_KEY);
      if (!raw) return { gems: 0, completed: [] };
      const data = JSON.parse(raw);
      const legacyXp = Number(data.xp || 0);
      const gems = Number.isFinite(Number(data.gems)) ? Number(data.gems) : legacyXp;
      return {
        gems: Math.max(0, Math.floor(Number.isFinite(gems) ? gems : 0)),
        completed: Array.isArray(data.completed) ? data.completed : []
      };
    } catch (_error) {
      return { gems: 0, completed: [] };
    }
  }

  function saveHomeState() {
    localStorage.setItem(HOME_KEY, JSON.stringify(state));
    renderStats();
  }

  function loadDailyProgress() {
    const today = londonDateKey();
    try {
      const raw = localStorage.getItem(CHALLENGE_KEY);
      if (!raw) {
        return { date: today, started: false, stepIndex: 0, completed: false, rewardClaimed: false };
      }
      const data = JSON.parse(raw);
      if (data.date !== today) {
        return { date: today, started: false, stepIndex: 0, completed: false, rewardClaimed: false };
      }
      return {
        date: today,
        started: Boolean(data.started),
        stepIndex: Number(data.stepIndex || 0),
        completed: Boolean(data.completed),
        rewardClaimed: Boolean(data.rewardClaimed)
      };
    } catch (_error) {
      return { date: today, started: false, stepIndex: 0, completed: false, rewardClaimed: false };
    }
  }

  function saveDailyProgress() {
    localStorage.setItem(CHALLENGE_KEY, JSON.stringify(daily));
  }

  function getProgressSnapshot() {
    if (typeof window.spGetProgressSnapshot === "function") {
      return window.spGetProgressSnapshot(pathOrder, worldTotals);
    }
    return { totals: { stars: 0 } };
  }

  function isWorldUnlocked(world) {
    if (typeof window.spIsWorldUnlocked === "function") {
      return window.spIsWorldUnlocked(world, pathOrder);
    }
    return true;
  }

  function renderStats() {
    let stars = 0;
    let gems = state.gems;
    if (typeof window.spGetRewards === "function") {
      const rewards = window.spGetRewards(pathOrder, worldTotals);
      stars = Number(rewards.stars || 0);
      gems = Number(rewards.gems || 0);
    } else {
      const latest = getProgressSnapshot();
      stars = Number((latest.totals && latest.totals.stars) || 0);
    }
    if (ui.homeStars) ui.homeStars.textContent = String(stars);
    if (ui.homeGems) ui.homeGems.textContent = String(gems);
    state.gems = gems;
  }

  function unlockRequirementFor(world) {
    if (world === "alphabet") return "";
    return "Keep exploring! Your next adventure awaits!";
  }

  function scrollChallengeIntoView() {
    const header = document.querySelector(".site-header");
    const headerHeight = header ? Math.ceil(header.getBoundingClientRect().height) : 82;
    const topPad = headerHeight + 10;
    panel.style.scrollMarginTop = topPad + "px";
    panel.scrollIntoView({ behavior: "smooth", block: "start", inline: "nearest" });
  }

  function focusFirstChallengeControl() {
    const selector = [
      "#previewChoices .choice-btn:not([disabled])",
      "#previewChoices .tile-btn:not([disabled])",
      "#previewChoices .button:not([disabled])",
      "#challengeActionBtn:not([style*='display:none'])"
    ].join(",");
    const target = panel.querySelector(selector);
    if (target && typeof target.focus === "function") {
      window.setTimeout(function () {
        target.focus({ preventScroll: true });
      }, 220);
    }
  }

  function renderWorldCards() {
    ui.worldCards.forEach(function (card) {
      const world = card.getAttribute("data-world");
      const unlocked = isWorldUnlocked(world);
      card.classList.toggle("locked", !unlocked);
      let lockNote = card.querySelector(".world-lock-note");
      if (!unlocked) {
        if (!lockNote) {
          lockNote = document.createElement("span");
          lockNote.className = "world-lock-note";
          card.appendChild(lockNote);
        }
        lockNote.textContent = unlockRequirementFor(world);
      } else if (lockNote) {
        lockNote.remove();
      }
    });
  }

  function setMascotState(kind, speech) {
    const body = ui.mascot.querySelector(".mithu-body");
    const wingL = ui.mascot.querySelector(".mithu-wing-left");
    const wingR = ui.mascot.querySelector(".mithu-wing-right");
    const eyeL = ui.mascot.querySelector(".mithu-eye-left");
    const eyeR = ui.mascot.querySelector(".mithu-eye-right");
    if (speech) ui.mascotSpeech.textContent = speech;
    if (!body) return;

    if (kind === "idle") {
      animate(body, { transform: ["translateY(0px)", "translateY(-2px)", "translateY(0px)"] }, { duration: 2.3, repeat: Infinity, easing: "ease-in-out" });
      animate([eyeL, eyeR], { transform: ["scaleY(1)", "scaleY(0.2)", "scaleY(1)"] }, { duration: 4.5, repeat: Infinity, easing: "ease-in-out" });
    } else if (kind === "greeting") {
      animate(wingR, { transform: ["rotate(0deg)", "rotate(24deg)", "rotate(0deg)"] }, { duration: 0.55, repeat: 3, easing: "ease-in-out" });
      animate(body, { transform: ["translateY(0px)", "translateY(-4px)", "translateY(0px)"] }, { duration: 1, easing: "ease-in-out" });
    } else if (kind === "thinking") {
      animate(body, { transform: ["rotate(0deg)", "rotate(-4deg)", "rotate(0deg)"] }, { duration: 0.8, easing: "ease-in-out" });
    } else if (kind === "correct") {
      animate(ui.mascot, { transform: ["translateX(0px)", "translateX(20px)", "translateX(0px)"] }, { duration: 0.6, easing: "ease-out" });
      animate(body, { transform: ["translateY(0px)", "translateY(-10px)", "translateY(0px)"] }, { duration: 0.55, easing: "ease-out" });
      animate([wingL, wingR], { transform: ["rotate(0deg)", "rotate(30deg)", "rotate(0deg)"] }, { duration: 0.45, easing: "ease-out" });
    } else if (kind === "incorrect") {
      animate(body, { transform: ["rotate(0deg)", "rotate(3deg)", "rotate(-3deg)", "rotate(0deg)"] }, { duration: 0.7, easing: "ease-in-out" });
    } else if (kind === "dance") {
      animate(body, { transform: ["translateY(0px) rotate(0deg)", "translateY(-8px) rotate(6deg)", "translateY(0px) rotate(-6deg)", "translateY(0px) rotate(0deg)"] }, { duration: 1.1, easing: "ease-in-out" });
      animate([wingL, wingR], { transform: ["rotate(0deg)", "rotate(30deg)", "rotate(0deg)"] }, { duration: 0.5, repeat: 3, easing: "ease-in-out" });
    }
  }

  function launchConfettiBurst() {
    const muted = JSON.parse(localStorage.getItem(MUTE_KEY) || "false");
    if (!window.confetti || muted) return;
    window.confetti({
      particleCount: 70,
      spread: 65,
      startVelocity: 28,
      ticks: 100,
      origin: { y: 0.68 },
      colors: ["#ffd166", "#7f5cff", "#2ec4b6", "#ff7eb6"]
    });
  }

  function launchGemRewardAnimation() {
    if (!ui.homeGems) return;
    const counterRect = ui.homeGems.getBoundingClientRect();
    const startRect = panel.getBoundingClientRect();
    const originX = startRect.left + Math.min(startRect.width * 0.45, 300);
    const originY = startRect.top + 120;
    for (let i = 0; i < 5; i += 1) {
      const gem = document.createElement("span");
      gem.className = "gem-reward-fly";
      gem.textContent = "💎";
      gem.style.left = originX + "px";
      gem.style.top = originY + "px";
      document.body.appendChild(gem);
      const tx = (counterRect.left + counterRect.width * 0.5) - originX + ((i - 2) * 10);
      const ty = (counterRect.top + counterRect.height * 0.5) - originY - (i * 6);
      animate(
        gem,
        {
          transform: [
            "translate3d(0px, 0px, 0) scale(0.8)",
            "translate3d(" + Math.round(tx * 0.55) + "px, " + Math.round((ty * 0.45) - 28) + "px, 0) scale(1.12)",
            "translate3d(" + Math.round(tx) + "px, " + Math.round(ty) + "px, 0) scale(0.45)"
          ],
          opacity: [0, 1, 1, 0]
        },
        { duration: 1.05, delay: i * 0.08, easing: "ease-out" }
      );
      window.setTimeout(function () {
        gem.remove();
      }, 1450 + i * 80);
    }
  }

  function initHomeLottie() {
    if (!window.lottie) return;
    const butterflies = [ui.lottieButterflyOne, ui.lottieButterflyTwo, ui.lottieButterflyThree].filter(Boolean);
    butterflies.forEach(function (container, index) {
      window.lottie.loadAnimation({
        container: container,
        renderer: "svg",
        loop: true,
        autoplay: true,
        path: "assets/lottie/butterfly.json",
        rendererSettings: { progressiveLoad: true }
      });
      container.style.opacity = "0.9";
      container.style.transform = "scale(" + (0.8 + index * 0.08).toFixed(2) + ")";
    });
    [ui.lottieSparkleOne, ui.lottieSparkleTwo].filter(Boolean).forEach(function (container) {
      window.lottie.loadAnimation({
        container: container,
        renderer: "svg",
        loop: true,
        autoplay: true,
        path: "assets/lottie/sparkle.json"
      });
    });
  }

  function renderChallengeProgress() {
    const completedCount = Math.min(challengeSteps.length, daily.stepIndex);
    const percent = Math.round((completedCount / challengeSteps.length) * 100);
    ui.challengeProgressFill.style.width = percent + "%";
    ui.challengeProgressText.textContent = "Progress: " + completedCount + "/" + challengeSteps.length;
  }

  function renderChallengeIdle() {
    renderChallengeProgress();
    ui.challengeActionBtn.style.display = "none";
    if (daily.completed) {
      ui.title.textContent = "Challenge of the Day Complete";
      ui.text.textContent = "You completed all five activities today. Come back tomorrow for a new challenge.";
      ui.status.textContent = daily.rewardClaimed ? "Today's 5 Gem reward has already been collected." : "";
      ui.challengeMeta.textContent = "Daily progress is saved on this device.";
      ui.choices.innerHTML = "";
      return;
    }
    if (!daily.started) {
      ui.title.textContent = "Challenge of the Day";
      ui.text.textContent = "Play five short activities: listening, picture matching, vocabulary, word building, and revision.";
      ui.status.textContent = "";
      ui.challengeMeta.textContent = "Finish the challenge to earn 5 Gems once per day on this device.";
      ui.choices.innerHTML = "";
      return;
    }
    renderChallengeStep();
  }

  function playChallengePrompt(step) {
    if (!step.playText) return;
    window.spSpeak(step.playText, "hi-IN", ui.status, step.playText);
  }

  function completeChallengeStep() {
    daily.stepIndex += 1;
    if (daily.stepIndex >= challengeSteps.length) {
      daily.completed = true;
      daily.stepIndex = challengeSteps.length;
      if (!daily.rewardClaimed) {
        state.gems += 5;
        daily.rewardClaimed = true;
        saveHomeState();
      }
      saveDailyProgress();
      renderChallengeProgress();
      ui.challengeActionBtn.style.display = "none";
      ui.choices.innerHTML = "";
      ui.title.textContent = "Challenge Complete!";
      ui.text.textContent = "You finished all five challenge activities.";
      ui.status.textContent = "🎉 +5 Gems awarded for today.";
      setMascotState("dance", "Hooray! You earned 5 magical Gems!");
      launchGemRewardAnimation();
      launchConfettiBurst();
      if (window.spApplause && !(window.SP_STATE && window.SP_STATE.muted)) window.spApplause();
      return;
    }
    saveDailyProgress();
    renderChallengeStep();
    focusFirstChallengeControl();
  }

  function renderChallengeStep() {
    renderChallengeProgress();
    const step = challengeSteps[daily.stepIndex];
    if (!step) return;
    ui.title.textContent = "Challenge of the Day: " + step.title;
    ui.text.textContent = step.prompt;
    ui.status.textContent = "";
    ui.choices.innerHTML = "";
    ui.challengeActionBtn.style.display = "none";
    ui.challengeActionBtn.textContent = "Next challenge";
    panel.classList.remove("correct", "wrong");

    if (step.id === "build") {
      let built = "";
      const output = document.createElement("p");
      output.className = "footer-note";
      output.textContent = "Built word: —";
      const row = document.createElement("div");
      row.className = "tiles";
      const shuffled = step.tiles.slice().sort(function () { return Math.random() - 0.5; });
      shuffled.forEach(function (tile) {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "tile-btn";
        btn.textContent = tile;
        btn.addEventListener("click", function () {
          if (btn.disabled) return;
          btn.disabled = true;
          built += tile;
          output.textContent = "Built word: " + built;
        });
        row.appendChild(btn);
      });
      ui.choices.appendChild(row);
      ui.choices.appendChild(output);
      const checkBtn = document.createElement("button");
      checkBtn.type = "button";
      checkBtn.className = "button secondary";
      checkBtn.textContent = "Check word";
      checkBtn.addEventListener("click", function () {
        if (built === step.answer) {
          panel.classList.add("correct");
          ui.status.textContent = step.success;
          setMascotState("correct", "Perfect! Let's go to the next challenge.");
          ui.challengeActionBtn.style.display = "inline-flex";
        } else {
          panel.classList.add("wrong");
          ui.status.textContent = "Not yet. Try the tile order again.";
          setMascotState("incorrect", "Great try. Rearrange and retry.");
        }
      });
      ui.choices.appendChild(checkBtn);
      return;
    }

    if (step.playText) {
      const playBtn = document.createElement("button");
      playBtn.type = "button";
      playBtn.className = "button ghost";
      playBtn.textContent = "▶ Play sound";
      playBtn.addEventListener("click", function () {
        setMascotState("thinking", "Listen carefully to the pronunciation.");
        playChallengePrompt(step);
      });
      ui.choices.appendChild(playBtn);
    }

    const optionWrap = document.createElement("div");
    optionWrap.className = "choices";
    step.options.forEach(function (option) {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "choice-btn";
      btn.textContent = option;
      btn.addEventListener("click", function () {
        if (option === step.answer) {
          panel.classList.add("correct");
          ui.status.textContent = step.success;
          setMascotState("correct", "Wonderful! Move to the next one.");
          optionWrap.querySelectorAll("button").forEach(function (b) { b.disabled = true; });
          ui.challengeActionBtn.style.display = "inline-flex";
        } else {
          btn.classList.add("wrong");
          panel.classList.add("wrong");
          ui.status.textContent = "Nice try. Pick the best answer.";
          setMascotState("incorrect", "Good effort. Try once more.");
        }
      });
      optionWrap.appendChild(btn);
    });
    ui.choices.appendChild(optionWrap);
    focusFirstChallengeControl();
  }

  function navigateToWorld(world) {
    if (!isWorldUnlocked(world)) {
      ui.status.textContent = unlockRequirementFor(world);
      panel.classList.add("wrong");
      setMascotState("incorrect", "Keep exploring! Your next adventure awaits!");
      scrollChallengeIntoView();
      return;
    }
    localStorage.setItem(LAST_WORLD_KEY, world);
    window.location.href = worldLinks[world];
  }

  function startDailyChallenge() {
    daily.started = true;
    if (daily.completed) {
      renderChallengeIdle();
      return;
    }
    saveDailyProgress();
    setMascotState("thinking", "Let's begin today's five-step challenge.");
    renderChallengeStep();
    focusFirstChallengeControl();
  }

  function wireUi() {
    document.querySelectorAll('.main-nav a[href="index.html"]').forEach(function (link) {
      link.addEventListener("click", function () {
        if (ui.resetModal) ui.resetModal.hidden = true;
      });
    });

    ui.worldCards.forEach(function (card) {
      const world = card.getAttribute("data-world");
      const iconLeaves = card.querySelectorAll(".world-icon i");
      animate(iconLeaves, { transform: ["translateY(0px)", "translateY(-3px)", "translateY(0px)"] }, { duration: 2.7, repeat: Infinity, easing: "ease-in-out", delay: function (i) { return i * 0.18; } });
      card.addEventListener("click", function () {
        navigateToWorld(world);
      });
    });
    renderWorldCards();

    ui.continueBtn.addEventListener("click", function () {
      const last = localStorage.getItem(LAST_WORLD_KEY) || "alphabet";
      navigateToWorld(last);
    });
    ui.challengeBtn.addEventListener("click", function () {
      startDailyChallenge();
      scrollChallengeIntoView();
    });
    ui.challengeActionBtn.addEventListener("click", function () {
      completeChallengeStep();
    });
    if (ui.playNowBtn) {
      ui.playNowBtn.addEventListener("click", function () {
        localStorage.setItem(LAST_WORLD_KEY, "alphabet");
      });
    }
    if (ui.resetBtn && ui.resetModal && ui.resetKeepBtn && ui.resetStartBtn) {
      ui.resetBtn.addEventListener("click", function () {
        ui.resetModal.hidden = false;
      });
      ui.resetKeepBtn.addEventListener("click", function () {
        ui.resetModal.hidden = true;
      });
      ui.resetStartBtn.addEventListener("click", function () {
        ui.resetModal.hidden = true;
        if (typeof window.spResetProgress === "function") {
          window.spResetProgress();
        }
        state.gems = 0;
        state.completed = [];
        daily.started = false;
        daily.stepIndex = 0;
        daily.completed = false;
        daily.rewardClaimed = false;
        saveHomeState();
        saveDailyProgress();
        panel.classList.remove("correct", "wrong");
        ui.status.textContent = "";
        renderChallengeIdle();
        renderStats();
        renderWorldCards();
        setMascotState("greeting", "Welcome back! Let's begin a brand-new adventure.");
      });
    }
  }
})();
