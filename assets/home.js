(function initHomeAdventure() {
  const HOME_KEY = "sanskritParichay.home.progress";
  const LESSON_KEY = "sanskritParichay.alphabetForest.progress";
  const LAST_WORLD_KEY = "sanskritParichay.lastWorld";
  const MUTE_KEY = "sanskritParichay.muted";
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

  const ui = {
    title: document.getElementById("previewTitle"),
    text: document.getElementById("previewText"),
    choices: document.getElementById("previewChoices"),
    status: document.getElementById("previewStatus"),
    mascot: document.getElementById("mascot"),
    mascotSpeech: document.getElementById("mascotSpeech"),
    homeStars: document.getElementById("homeStars"),
    homeXp: document.getElementById("homeXp"),
    continueBtn: document.getElementById("continueBtn"),
    exploreBtn: document.getElementById("exploreBtn"),
    challengeBtn: document.getElementById("challengeBtn"),
    playNowBtn: document.getElementById("playNowBtn"),
    resetBtn: document.getElementById("resetProgressBtn"),
    worldCards: document.querySelectorAll(".world-card")
  };

  const challengeData = {
    title: "Today's Challenge",
    prompt: "Pick Sanskrit for moon.",
    options: ["चन्द्रः", "गृहम्", "फलम्"],
    answer: "चन्द्रः",
    hint: "Think: Chandra means moon."
  };

  const state = load();
  renderStats();
  wireUi();
  setMascotState("greeting", "Namaste! Choose a world and continue your Sanskrit adventure.");

  function load() {
    try {
      const raw = localStorage.getItem(HOME_KEY);
      if (!raw) return { xp: 0, completed: [] };
      const data = JSON.parse(raw);
      return {
        xp: Number(data.xp || 0),
        completed: Array.isArray(data.completed) ? data.completed : []
      };
    } catch (error) {
      return { xp: 0, completed: [] };
    }
  }

  function save() {
    localStorage.setItem(HOME_KEY, JSON.stringify(state));
    renderStats();
  }

  function lessonStars() {
    try {
      const raw = localStorage.getItem(LESSON_KEY);
      if (!raw) return 0;
      return Number((JSON.parse(raw).stars) || 0);
    } catch (error) {
      return 0;
    }
  }

  function alphabetCompleted() {
    try {
      const raw = localStorage.getItem(LESSON_KEY);
      if (!raw) return false;
      const done = JSON.parse(raw).done || {};
      return Boolean(done.hear && done.picture && done.arrange && done.flash && done.feed && done.trace && done.hunt);
    } catch (error) {
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
    if (!window.confetti || JSON.parse(localStorage.getItem(MUTE_KEY) || "false")) return;
    window.confetti({
      particleCount: 70,
      spread: 65,
      startVelocity: 28,
      ticks: 100,
      origin: { y: 0.68 },
      colors: ["#ffd166", "#7f5cff", "#2ec4b6", "#ff7eb6"]
    });
  }

  function openChallenge() {
    ui.title.textContent = challengeData.title;
    ui.text.textContent = challengeData.prompt;
    ui.choices.innerHTML = "";
    ui.status.textContent = "";
    panel.classList.remove("correct", "wrong");
    setMascotState("thinking", "Let's solve today's challenge.");

    challengeData.options.forEach(function (option) {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "choice-btn";
      btn.textContent = option;
      btn.addEventListener("click", function () {
        if (option === challengeData.answer) {
          btn.classList.add("correct");
          state.xp += 10;
          save();
          panel.classList.add("correct");
          ui.status.textContent = "Correct! +10 XP";
          setMascotState("correct", "Brilliant! You got it!");
          launchConfettiBurst();
          if (window.spApplause) window.spApplause();
        } else {
          btn.classList.add("wrong");
          panel.classList.add("wrong");
          ui.status.textContent = "Try again. Hint: " + challengeData.hint;
          setMascotState("incorrect", "Good try! " + challengeData.hint);
        }
      });
      ui.choices.appendChild(btn);
    });
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

  function wireUi() {
    ui.worldCards.forEach(function (card) {
      const world = card.getAttribute("data-world");
      const unlocked = isWorldUnlocked(world);
      if (!unlocked) card.classList.add("locked");
      card.addEventListener("click", function () {
        navigateToWorld(world);
      });
    });

    ui.continueBtn.addEventListener("click", function () {
      const last = localStorage.getItem(LAST_WORLD_KEY) || "alphabet";
      navigateToWorld(last);
    });
    ui.exploreBtn.addEventListener("click", function () {
      document.getElementById("worlds").scrollIntoView({ behavior: "smooth", block: "start" });
      setMascotState("greeting", "Pick any unlocked world to continue.");
    });
    ui.challengeBtn.addEventListener("click", openChallenge);
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
        Object.keys(worldLinks).forEach(function (key) {
          localStorage.removeItem("sanskritParichay.world." + key + ".progress");
        });
        state.xp = 0;
        state.completed = [];
        save();
        panel.classList.remove("correct", "wrong");
        ui.status.textContent = "Progress reset successfully.";
        setMascotState("greeting", "All set! Let's begin again.");
      });
    }
  }
})();
