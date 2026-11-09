(function initHomeAdventure() {
  const HOME_KEY = "sanskritParichay.home.progress";
  const LESSON_KEY = "sanskritParichay.alphabetForest.progress";
  const LAST_WORLD_KEY = "sanskritParichay.lastWorld";
  const MUTE_KEY = "sanskritParichay.muted";
  const panel = document.getElementById("previewPanel");
  const title = document.getElementById("previewTitle");
  const text = document.getElementById("previewText");
  const choices = document.getElementById("previewChoices");
  const status = document.getElementById("previewStatus");
  const mascot = document.getElementById("mascot");
  const mascotSpeech = document.getElementById("mascotSpeech");
  const starsEl = document.getElementById("homeStars");
  const xpEl = document.getElementById("homeXp");
  const continueBtn = document.getElementById("continueBtn");
  const exploreBtn = document.getElementById("exploreBtn");
  const challengeBtn = document.getElementById("challengeBtn");
  const playNowBtn = document.getElementById("playNowBtn");
  const resetBtn = document.getElementById("resetProgressBtn");
  const worldCards = document.querySelectorAll(".world-card");

  if (!panel) return;

  const worldData = {
    animals: {
      title: "Animal Jungle Preview",
      prompt: "Which Sanskrit word means elephant? 🐘",
      options: ["गजः", "नदी", "माता"],
      answer: "गजः"
    },
    numbers: {
      title: "Number Galaxy Preview",
      prompt: "Pick Sanskrit for one: 1️⃣",
      options: ["एकः", "द्वौ", "त्रयः"],
      answer: "एकः"
    },
    colours: {
      title: "Colour Kingdom Preview",
      prompt: "Pick Sanskrit for blue: 🔵",
      options: ["नीलः", "पीतः", "रक्तः"],
      answer: "नीलः"
    },
    words: {
      title: "Word Wonderland Preview",
      prompt: "Which word means lotus? 🌸",
      options: ["कमलम्", "रथः", "अग्निः"],
      answer: "कमलम्"
    },
    sentences: {
      title: "Sentence Castle Preview",
      prompt: "Choose the Sanskrit greeting:",
      options: ["नमस्ते", "गजः", "आकाशः"],
      answer: "नमस्ते"
    },
    stories: {
      title: "Story Island Preview",
      prompt: "Pick a gentle story starter:",
      options: ["एकदा वनमध्ये...", "गजः जलम् पिबति।", "नदी नीलाऽस्ति।"],
      answer: "एकदा वनमध्ये..."
    },
    challenge: {
      title: "Today's Challenge",
      prompt: "What is Sanskrit for moon? 🌙",
      options: ["चन्द्रः", "कमलम्", "योगः"],
      answer: "चन्द्रः"
    }
  };

  const state = load();

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

  function readLessonStars() {
    try {
      const raw = localStorage.getItem(LESSON_KEY);
      if (!raw) return 0;
      const data = JSON.parse(raw);
      return Number(data.stars || 0);
    } catch (error) {
      return 0;
    }
  }

  function save() {
    localStorage.setItem(HOME_KEY, JSON.stringify(state));
    renderStats();
  }

  function renderStats() {
    starsEl.textContent = String(readLessonStars());
    xpEl.textContent = String(state.xp);
  }

  function setMascot(stateName, message) {
    mascot.classList.remove("state-wave", "state-celebrate", "state-dance");
    mascot.classList.add(stateName);
    mascotSpeech.textContent = message;
  }

  function launchConfetti() {
    const zone = document.createElement("div");
    zone.className = "confetti-zone";
    const symbols = ["⭐", "✨", "🎉", "🌟"];
    for (let i = 0; i < 24; i += 1) {
      const piece = document.createElement("span");
      piece.className = "confetti-piece";
      piece.textContent = symbols[i % symbols.length];
      piece.style.left = Math.floor(Math.random() * 100) + "%";
      piece.style.animationDelay = (Math.random() * 0.4).toFixed(2) + "s";
      zone.appendChild(piece);
    }
    document.body.appendChild(zone);
    setTimeout(function removeZone() {
      zone.remove();
    }, 1700);
  }

  function reward(worldName, statusEl) {
    state.xp += 10;
    if (!state.completed.includes(worldName)) {
      state.completed.push(worldName);
      state.xp += 15;
    }
    save();
    panel.classList.remove("wrong");
    panel.classList.add("correct");
    statusEl.textContent = "Correct! +10 XP and star reward!";
    if (window.spSuccessTone) window.spSuccessTone();
    setMascot("state-celebrate", "Super! You earned a reward. I am so proud of you!");
    if (state.xp >= 60) {
      setMascot("state-dance", "Amazing progress! I'm doing a happy dance!");
      if (window.spApplause) window.spApplause();
      launchConfetti();
    }
  }

  function showWrong(statusEl) {
    panel.classList.remove("correct");
    panel.classList.add("wrong");
    statusEl.textContent = "Almost! Try again, explorer.";
    setMascot("state-wave", "Good try! Read carefully and choose again.");
  }

  function openPreview(key) {
    const world = worldData[key];
    if (!world) return;

    title.textContent = world.title;
    text.textContent = world.prompt;
    status.textContent = "";
    choices.innerHTML = "";
    panel.classList.remove("correct", "wrong");
    localStorage.setItem(LAST_WORLD_KEY, key);

    world.options.forEach(function addChoice(option) {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "choice-btn";
      btn.textContent = option;
      btn.addEventListener("click", function onPick() {
        if (option === world.answer) {
          btn.classList.add("correct");
          reward(key, status);
        } else {
          btn.classList.add("wrong");
          showWrong(status);
        }
      });
      choices.appendChild(btn);
    });
  }

  function goContinue() {
    const last = localStorage.getItem(LAST_WORLD_KEY) || "alphabet";
    if (last === "alphabet") {
      window.location.href = "alphabet-forest.html";
      return;
    }
    document.getElementById("worlds").scrollIntoView({ behavior: "smooth", block: "start" });
    openPreview(last);
    setMascot("state-wave", "Welcome back! Let's continue " + title.textContent + ".");
  }

  worldCards.forEach(function wireCard(card) {
    card.addEventListener("click", function onCardClick() {
      const world = card.getAttribute("data-world");
      if (world === "alphabet") {
        localStorage.setItem(LAST_WORLD_KEY, "alphabet");
        setMascot("state-wave", "Let's fly to Alphabet Forest!");
        window.location.href = "alphabet-forest.html";
        return;
      }
      openPreview(world);
      setMascot("state-wave", "Great choice! Try this mini challenge.");
    });
  });

  continueBtn.addEventListener("click", goContinue);
  exploreBtn.addEventListener("click", function onExplore() {
    document.getElementById("worlds").scrollIntoView({ behavior: "smooth", block: "start" });
    setMascot("state-wave", "Pick a world card to start your next mini quest.");
  });
  challengeBtn.addEventListener("click", function onChallenge() {
    openPreview("challenge");
    setMascot("state-wave", "Today's Challenge is ready! Give it your best.");
  });
  if (playNowBtn) {
    playNowBtn.addEventListener("click", function onPlayClick() {
      localStorage.setItem(LAST_WORLD_KEY, "alphabet");
    });
  }
  if (resetBtn) {
    resetBtn.addEventListener("click", function onReset() {
      localStorage.removeItem(HOME_KEY);
      localStorage.removeItem(LESSON_KEY);
      localStorage.removeItem(LAST_WORLD_KEY);
      localStorage.removeItem(MUTE_KEY);
      state.xp = 0;
      state.completed = [];
      renderStats();
      setMascot("state-wave", "All set! Progress reset to zero. Let's start fresh.");
      status.textContent = "Progress reset successfully.";
      panel.classList.remove("correct", "wrong");
    });
  }

  renderStats();
})();
