(function initHomeAdventure() {
  const HOME_KEY = "sanskritParichay.home.progress";
  const LESSON_KEY = "sanskritParichay.alphabetForest.progress";
  const LAST_WORLD_KEY = "sanskritParichay.lastWorld";
  const MUTE_KEY = "sanskritParichay.muted";
  const CHALLENGE_KEY = "sanskritParichay.dailyChallenge.progress";
  const panel = document.getElementById("previewPanel");
  if (!panel) return;

  const motion = window.Motion || {};
  const animate = motion.animate || function () {};
  const pathOrder = ["alphabet", "words", "animals", "numbers", "colours", "sentences", "stories", "culture"];
  const worldLinks = {
    alphabet: "alphabet-forest.html",
    words: "learning-world.html?world=words",
    animals: "learning-world.html?world=animals",
    numbers: "learning-world.html?world=numbers",
    colours: "learning-world.html?world=colours",
    sentences: "learning-world.html?world=sentences",
    stories: "learning-world.html?world=stories",
    culture: "learning-world.html?world=culture"
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
    homeStars: document.getElementById("homeStars"),
    homeXp: document.getElementById("homeXp"),
    continueBtn: document.getElementById("continueBtn"),
    challengeBtn: document.getElementById("challengeBtn"),
    playNowBtn: document.getElementById("playNowBtn"),
    resetBtn: document.getElementById("resetProgressBtn"),
    worldCards: document.querySelectorAll(".world-card"),
    lottieButterflyOne: document.getElementById("lottieButterflyOne"),
    lottieButterflyTwo: document.getElementById("lottieButterflyTwo"),
    lottieButterflyThree: document.getElementById("lottieButterflyThree"),
    lottieSparkleOne: document.getElementById("lottieSparkleOne"),
    lottieSparkleTwo: document.getElementById("lottieSparkleTwo")
  };

  const state = loadHomeState();
  const daily = loadDailyProgress();
  renderStats();
  renderChallengeIdle();
  wireUi();
  initHomeLottie();
  setMascotState("greeting", "Namaste! Choose a world or play today's challenge.");

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
      if (!raw) return { xp: 0, completed: [] };
      const data = JSON.parse(raw);
      return {
        xp: Number(data.xp || 0),
        completed: Array.isArray(data.completed) ? data.completed : []
      };
    } catch (_error) {
      return { xp: 0, completed: [] };
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

  function lessonStars() {
    try {
      const raw = localStorage.getItem(LESSON_KEY);
      if (!raw) return 0;
      return Number((JSON.parse(raw).stars) || 0);
    } catch (_error) {
      return 0;
    }
  }

  function alphabetCompleted() {
    try {
      const raw = localStorage.getItem(LESSON_KEY);
      if (!raw) return false;
      const done = JSON.parse(raw).done || {};
      return Boolean(done.hear && done.picture && done.arrange && done.flash && done.feed && done.trace && done.hunt);
    } catch (_error) {
      return false;
    }
  }

  function isWorldUnlocked(world) {
    if (world === "alphabet") return true;
    const idx = pathOrder.indexOf(world);
    if (idx <= 0) return true;
    const prev = pathOrder[idx - 1];
    if (prev === "alphabet") return alphabetCompleted();
    return state.completed.includes(prev);
  }

  function renderStats() {
    ui.homeStars.textContent = String(lessonStars());
    ui.homeXp.textContent = String(state.xp);
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
      ui.title.textContent = "Today's Challenge Complete";
      ui.text.textContent = "You completed all five activities today. Come back tomorrow for a new challenge.";
      ui.status.textContent = daily.rewardClaimed ? "Daily reward already claimed today." : "";
      ui.challengeMeta.textContent = "Daily progress is saved on this device.";
      ui.choices.innerHTML = "";
      return;
    }
    if (!daily.started) {
      ui.title.textContent = "Today's Challenge";
      ui.text.textContent = "Play five short activities: listening, picture matching, vocabulary, word building, and revision.";
      ui.status.textContent = "";
      ui.challengeMeta.textContent = "Daily reward can be claimed once per day on this device.";
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
        state.xp += 25;
        daily.rewardClaimed = true;
        saveHomeState();
      }
      saveDailyProgress();
      renderChallengeProgress();
      ui.challengeActionBtn.style.display = "none";
      ui.choices.innerHTML = "";
      ui.title.textContent = "Challenge Complete!";
      ui.text.textContent = "You finished all five challenge activities.";
      ui.status.textContent = "🎉 +25 XP awarded once for today.";
      setMascotState("dance", "Fantastic! You completed today's full challenge.");
      launchConfettiBurst();
      if (window.spApplause && !(window.SP_STATE && window.SP_STATE.muted)) window.spApplause();
      return;
    }
    saveDailyProgress();
    renderChallengeStep();
  }

  function renderChallengeStep() {
    renderChallengeProgress();
    const step = challengeSteps[daily.stepIndex];
    if (!step) return;
    ui.title.textContent = "Today's Challenge: " + step.title;
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
  }

  function navigateToWorld(world) {
    if (!isWorldUnlocked(world)) {
      ui.status.textContent = "Complete the previous world first to unlock this one.";
      panel.classList.add("wrong");
      setMascotState("incorrect", "Let's complete the previous world first.");
      document.getElementById("previewPanel").scrollIntoView({ behavior: "smooth", block: "start" });
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
  }

  function wireUi() {
    ui.worldCards.forEach(function (card) {
      const world = card.getAttribute("data-world");
      const unlocked = isWorldUnlocked(world);
      if (!unlocked) card.classList.add("locked");
      const iconLeaves = card.querySelectorAll(".world-icon i");
      animate(iconLeaves, { transform: ["translateY(0px)", "translateY(-3px)", "translateY(0px)"] }, { duration: 2.7, repeat: Infinity, easing: "ease-in-out", delay: function (i) { return i * 0.18; } });
      card.addEventListener("click", function () {
        navigateToWorld(world);
      });
    });

    ui.continueBtn.addEventListener("click", function () {
      const last = localStorage.getItem(LAST_WORLD_KEY) || "alphabet";
      navigateToWorld(last);
    });
    ui.challengeBtn.addEventListener("click", function () {
      startDailyChallenge();
      panel.scrollIntoView({ behavior: "smooth", block: "start" });
    });
    ui.challengeActionBtn.addEventListener("click", function () {
      completeChallengeStep();
    });
    if (ui.playNowBtn) {
      ui.playNowBtn.addEventListener("click", function () {
        localStorage.setItem(LAST_WORLD_KEY, "alphabet");
      });
    }
    if (ui.resetBtn) {
      ui.resetBtn.addEventListener("click", function () {
        localStorage.removeItem(HOME_KEY);
        localStorage.removeItem(LESSON_KEY);
        localStorage.removeItem(LAST_WORLD_KEY);
        localStorage.removeItem(MUTE_KEY);
        localStorage.removeItem(CHALLENGE_KEY);
        Object.keys(worldLinks).forEach(function (key) {
          localStorage.removeItem("sanskritParichay.world." + key + ".progress");
        });
        state.xp = 0;
        state.completed = [];
        daily.started = false;
        daily.stepIndex = 0;
        daily.completed = false;
        daily.rewardClaimed = false;
        saveHomeState();
        saveDailyProgress();
        panel.classList.remove("correct", "wrong");
        ui.status.textContent = "Progress reset successfully.";
        renderChallengeIdle();
        setMascotState("greeting", "All set! Let's begin again.");
      });
    }
  }
})();
