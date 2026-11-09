(function initHomeAdventure() {
  const HOME_KEY = "sanskritParichay.home.progress";
  const LESSON_KEY = "sanskritParichay.alphabetForest.progress";
  const LAST_WORLD_KEY = "sanskritParichay.lastWorld";
  const MUTE_KEY = "sanskritParichay.muted";
  const panel = document.getElementById("previewPanel");
  if (!panel) return;

  const motion = window.Motion || {};
  const animate = motion.animate || function () {};
  const pathOrder = ["alphabet", "words", "animals", "numbers", "colours", "sentences", "stories"];

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
    worldCards: document.querySelectorAll(".world-card"),
    pathNodes: document.querySelectorAll(".path-node")
  };

  const worldData = {
    animals: { title: "Animal Jungle Preview", prompt: "Which Sanskrit word means elephant?", options: ["गजः", "नदी", "माता"], answer: "गजः", hint: "Elephant starts with ग (ga)." },
    words: { title: "Word Wonderland Preview", prompt: "Which word means lotus?", options: ["कमलम्", "रथः", "अग्निः"], answer: "कमलम्", hint: "Kamal is lotus." },
    numbers: { title: "Number Galaxy Preview", prompt: "Pick Sanskrit for one:", options: ["एकः", "द्वौ", "त्रयः"], answer: "एकः", hint: "Think 'eka' for one." },
    colours: { title: "Colour Kingdom Preview", prompt: "Pick Sanskrit for blue:", options: ["नीलः", "पीतः", "रक्तः"], answer: "नीलः", hint: "Neel = blue." },
    sentences: { title: "Sentence Castle Preview", prompt: "Choose the Sanskrit greeting:", options: ["नमस्ते", "गजः", "आकाशः"], answer: "नमस्ते", hint: "It starts with नम..." },
    stories: { title: "Story Island Preview", prompt: "Pick a gentle story starter:", options: ["एकदा वनमध्ये...", "गजः जलम् पिबति।", "नदी नीलाऽस्ति।"], answer: "एकदा वनमध्ये...", hint: "Many stories begin with 'Once upon a time'." },
    challenge: { title: "Today's Challenge", prompt: "What is Sanskrit for moon?", options: ["चन्द्रः", "कमलम्", "योगः"], answer: "चन्द्रः", hint: "Chandra means moon." }
  };

  const state = load();
  renderStats();
  renderPath();
  wireUi();
  setMascotState("greeting", "Namaste! I am Mitthu. Pick a world and I will guide you.");

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
    renderPath();
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
      return Boolean(done.hear && done.picture && done.arrange && done.flash && done.feed && done.hunt);
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

  function isWorldCompleted(world) {
    if (world === "alphabet") return alphabetCompleted();
    return state.completed.includes(world);
  }

  function renderStats() {
    ui.homeStars.textContent = String(lessonStars());
    ui.homeXp.textContent = String(state.xp);
  }

  function renderPath() {
    ui.pathNodes.forEach(function (node) {
      const world = node.getAttribute("data-world");
      const stateEl = node.querySelector(".path-state");
      const unlocked = isWorldUnlocked(world);
      const completed = isWorldCompleted(world);
      node.classList.remove("locked", "unlocked", "completed");
      if (!unlocked) {
        node.classList.add("locked");
        stateEl.textContent = "Locked";
      } else if (completed) {
        node.classList.add("completed");
        stateEl.textContent = "Completed";
      } else {
        node.classList.add("unlocked");
        stateEl.textContent = "Unlocked";
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

  function animateStarsToXp() {
    const target = ui.homeXp;
    const targetBox = target.getBoundingClientRect();
    const startX = window.innerWidth * 0.55;
    const startY = window.innerHeight * 0.64;
    for (let i = 0; i < 6; i += 1) {
      const star = document.createElement("span");
      star.textContent = "⭐";
      star.style.position = "fixed";
      star.style.left = startX + i * 8 + "px";
      star.style.top = startY + i * 4 + "px";
      star.style.zIndex = "50";
      star.style.pointerEvents = "none";
      document.body.appendChild(star);
      animate(
        star,
        {
          transform: [
            "translate(0px,0px) scale(1)",
            "translate(" + (targetBox.left - startX) + "px," + (targetBox.top - startY) + "px) scale(0.4)"
          ],
          opacity: [1, 0.15]
        },
        { duration: 0.7 + i * 0.05, easing: "ease-out" }
      );
      setTimeout(function () {
        star.remove();
      }, 900 + i * 60);
    }
  }

  function openPreview(world) {
    if (!isWorldUnlocked(world)) {
      ui.status.textContent = "Complete the previous world to unlock this path.";
      setMascotState("incorrect", "Let's finish the previous world first.");
      return;
    }

    const data = worldData[world];
    if (!data) return;
    ui.title.textContent = data.title;
    ui.text.textContent = data.prompt;
    ui.choices.innerHTML = "";
    ui.status.textContent = "";
    panel.classList.remove("correct", "wrong");
    localStorage.setItem(LAST_WORLD_KEY, world);
    setMascotState("thinking", "Let's solve this together.");

    data.options.forEach(function (option) {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "choice-btn";
      btn.textContent = option;
      btn.addEventListener("click", function () {
        if (option === data.answer) {
          btn.classList.add("correct");
          state.xp += 10;
          if (!state.completed.includes(world)) {
            state.completed.push(world);
            state.xp += 15;
            const idx = pathOrder.indexOf(world);
            const next = pathOrder[idx + 1];
            if (next) {
              const nextNode = document.querySelector('.path-node[data-world="' + next + '"]');
              if (nextNode && !nextNode.classList.contains("completed")) {
                nextNode.classList.add("unlock-pulse");
                setTimeout(function () {
                  nextNode.classList.remove("unlock-pulse");
                }, 1000);
              }
            }
          }
          save();
          panel.classList.add("correct");
          ui.status.textContent = "Correct! +10 XP";
          setMascotState("correct", "Brilliant! You got it!");
          launchConfettiBurst();
          animateStarsToXp();
          if (window.spApplause) window.spApplause();
          if (state.xp >= 60) {
            setMascotState("dance", "Amazing! Mithu dance time!");
          }
        } else {
          btn.classList.add("wrong");
          panel.classList.add("wrong");
          ui.status.textContent = "Try again. Hint: " + data.hint;
          setMascotState("incorrect", "Good try! " + data.hint);
          animate(btn, { transform: ["translateX(0px)", "translateX(-5px)", "translateX(5px)", "translateX(0px)"] }, { duration: 0.4, easing: "ease-in-out" });
        }
      });
      ui.choices.appendChild(btn);
    });
  }

  function navigateToWorld(world) {
    if (world === "alphabet") {
      localStorage.setItem(LAST_WORLD_KEY, "alphabet");
      window.location.href = "alphabet-forest.html";
      return;
    }
    document.getElementById("previewPanel").scrollIntoView({ behavior: "smooth", block: "start" });
    openPreview(world);
  }

  function wireUi() {
    ui.worldCards.forEach(function (card) {
      card.addEventListener("click", function () {
        navigateToWorld(card.getAttribute("data-world"));
      });
    });
    ui.pathNodes.forEach(function (node) {
      node.addEventListener("click", function () {
        navigateToWorld(node.getAttribute("data-world"));
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
    ui.challengeBtn.addEventListener("click", function () {
      openPreview("challenge");
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
