(function initHomeAdventure() {
  const HOME_KEY = "sanskritParichay.home.progress";
  const LESSON_KEY = "sanskritParichay.alphabetForest.progress";
  const LAST_WORLD_KEY = "sanskritParichay.lastWorld";
  const MUTE_KEY = "sanskritParichay.muted";
  const panel = document.getElementById("previewPanel");
  if (!panel) return;

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
    lottieCelebration: document.getElementById("homeCelebrationLottie")
  };

  const motion = window.Motion || {};
  const animate = motion.animate || function () {};

  const worldData = {
    animals: { title: "Animal Jungle Preview", prompt: "Which Sanskrit word means elephant?", options: ["गजः", "नदी", "माता"], answer: "गजः", hint: "Elephant starts with ग (ga)." },
    numbers: { title: "Number Galaxy Preview", prompt: "Pick Sanskrit for one:", options: ["एकः", "द्वौ", "त्रयः"], answer: "एकः", hint: "Think 'eka' for one." },
    colours: { title: "Colour Kingdom Preview", prompt: "Pick Sanskrit for blue:", options: ["नीलः", "पीतः", "रक्तः"], answer: "नीलः", hint: "Neel = blue." },
    words: { title: "Word Wonderland Preview", prompt: "Which word means lotus?", options: ["कमलम्", "रथः", "अग्निः"], answer: "कमलम्", hint: "Kamal is lotus." },
    sentences: { title: "Sentence Castle Preview", prompt: "Choose the Sanskrit greeting:", options: ["नमस्ते", "गजः", "आकाशः"], answer: "नमस्ते", hint: "It starts with नम..." },
    stories: { title: "Story Island Preview", prompt: "Pick a gentle story starter:", options: ["एकदा वनमध्ये...", "गजः जलम् पिबति।", "नदी नीलाऽस्ति।"], answer: "एकदा वनमध्ये...", hint: "Many stories begin with 'Once upon a time'." },
    challenge: { title: "Today's Challenge", prompt: "What is Sanskrit for moon?", options: ["चन्द्रः", "कमलम्", "योगः"], answer: "चन्द्रः", hint: "Chandra means moon." }
  };

  const state = load();
  let currentWorld = null;
  let celebrateAnim = null;

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

  function renderStats() {
    ui.homeStars.textContent = String(lessonStars());
    ui.homeXp.textContent = String(state.xp);
  }

  function initLottie() {
    if (!window.lottie) return;
    const butterflies = [
      document.getElementById("lottieButterflyOne"),
      document.getElementById("lottieButterflyTwo"),
      document.getElementById("lottieButterflyThree")
    ];
    butterflies.forEach(function (el) {
      if (!el) return;
      window.lottie.loadAnimation({
        container: el,
        renderer: "svg",
        loop: true,
        autoplay: true,
        path: "assets/lottie/butterfly.json"
      });
    });
    [document.getElementById("lottieSparkleOne"), document.getElementById("lottieSparkleTwo")].forEach(function (el) {
      if (!el) return;
      window.lottie.loadAnimation({
        container: el,
        renderer: "svg",
        loop: true,
        autoplay: true,
        path: "assets/lottie/sparkle.json"
      });
    });
    if (ui.lottieCelebration) {
      celebrateAnim = window.lottie.loadAnimation({
        container: ui.lottieCelebration,
        renderer: "svg",
        loop: false,
        autoplay: false,
        path: "assets/lottie/celebration.json"
      });
    }
  }

  function mascotParts() {
    return {
      body: ui.mascot.querySelector(".mithu-body"),
      leftWing: ui.mascot.querySelector(".mithu-wing-left"),
      rightWing: ui.mascot.querySelector(".mithu-wing-right"),
      leftEye: ui.mascot.querySelector(".mithu-eye-left"),
      rightEye: ui.mascot.querySelector(".mithu-eye-right"),
      tail: ui.mascot.querySelector(".mithu-tail")
    };
  }

  function setSpeech(text) {
    ui.mascotSpeech.textContent = text;
  }

  function setMascotState(kind) {
    const p = mascotParts();
    if (!p.body) return;

    if (kind === "idle") {
      animate(p.body, { transform: ["translateY(0px)", "translateY(-2px)", "translateY(0px)"] }, { duration: 2.2, repeat: Infinity, easing: "ease-in-out" });
      animate([p.leftWing, p.rightWing], { transform: ["rotate(0deg)", "rotate(4deg)", "rotate(0deg)"] }, { duration: 2.8, repeat: Infinity, easing: "ease-in-out" });
      animate([p.leftEye, p.rightEye], { transform: ["scaleY(1)", "scaleY(0.2)", "scaleY(1)"] }, { duration: 4.8, repeat: Infinity, easing: "ease-in-out" });
      animate(p.tail, { transform: ["rotate(0deg)", "rotate(8deg)", "rotate(0deg)"] }, { duration: 2.4, repeat: Infinity, easing: "ease-in-out" });
    } else if (kind === "welcome") {
      animate(p.rightWing, { transform: ["rotate(0deg)", "rotate(20deg)", "rotate(0deg)"] }, { duration: 0.7, repeat: 3, easing: "ease-in-out" });
      animate(p.body, { transform: ["translateY(0px)", "translateY(-4px)", "translateY(0px)"] }, { duration: 1.1, easing: "ease-in-out" });
    } else if (kind === "thinking") {
      animate(p.body, { transform: ["rotate(0deg)", "rotate(-4deg)", "rotate(0deg)"] }, { duration: 0.9, easing: "ease-in-out" });
    } else if (kind === "correct") {
      animate(p.body, { transform: ["translateY(0px)", "translateY(-12px)", "translateY(0px)"] }, { duration: 0.55, easing: "ease-out" });
      animate([p.leftWing, p.rightWing], { transform: ["rotate(0deg)", "rotate(25deg)", "rotate(0deg)"] }, { duration: 0.45, easing: "ease-out" });
    } else if (kind === "incorrect") {
      animate(p.body, { transform: ["rotate(0deg)", "rotate(3deg)", "rotate(-3deg)", "rotate(0deg)"] }, { duration: 0.8, easing: "ease-in-out" });
    } else if (kind === "dance") {
      animate(p.body, { transform: ["translateY(0px) rotate(0deg)", "translateY(-8px) rotate(5deg)", "translateY(0px) rotate(-5deg)", "translateY(-8px) rotate(5deg)", "translateY(0px) rotate(0deg)"] }, { duration: 1.3, easing: "ease-in-out" });
      animate([p.leftWing, p.rightWing], { transform: ["rotate(0deg)", "rotate(30deg)", "rotate(0deg)"] }, { duration: 0.5, repeat: 2, easing: "ease-in-out" });
    }
  }

  function playSuccessFx() {
    if (window.confetti && !JSON.parse(localStorage.getItem(MUTE_KEY) || "false")) {
      window.confetti({ particleCount: 32, spread: 55, startVelocity: 25, ticks: 100, origin: { y: 0.65 }, colors: ["#ffd166", "#7f5cff", "#2ec4b6", "#ff7eb6"] });
    }
    if (window.spSuccessTone) window.spSuccessTone();
    if (ui.lottieCelebration && celebrateAnim) {
      ui.lottieCelebration.classList.add("show");
      celebrateAnim.goToAndPlay(0, true);
      setTimeout(function () {
        ui.lottieCelebration.classList.remove("show");
      }, 1400);
    }
  }

  function openPreview(key) {
    const world = worldData[key];
    if (!world) return;
    currentWorld = key;
    ui.title.textContent = world.title;
    ui.text.textContent = world.prompt;
    ui.status.textContent = "";
    ui.choices.innerHTML = "";
    panel.classList.remove("correct", "wrong");
    localStorage.setItem(LAST_WORLD_KEY, key);
    setMascotState("thinking");
    setSpeech("Let me think with you... choose the best answer.");

    world.options.forEach(function (option) {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "choice-btn";
      btn.textContent = option;
      btn.addEventListener("click", function () {
        if (option === world.answer) {
          btn.classList.add("correct");
          panel.classList.add("correct");
          state.xp += 10;
          if (!state.completed.includes(key)) {
            state.completed.push(key);
            state.xp += 15;
          }
          save();
          ui.status.textContent = "Correct! +10 XP";
          setMascotState(state.xp >= 60 ? "dance" : "correct");
          setSpeech(state.xp >= 60 ? "Amazing! You're leveling up fast!" : "Excellent answer! Keep going!");
          playSuccessFx();
        } else {
          btn.classList.add("wrong");
          panel.classList.remove("correct");
          panel.classList.add("wrong");
          ui.status.textContent = "Try again: " + world.hint;
          setMascotState("incorrect");
          setSpeech("Good try. " + world.hint);
          animate(btn, { transform: ["translateX(0px)", "translateX(-5px)", "translateX(5px)", "translateX(0px)"] }, { duration: 0.4, easing: "ease-in-out" });
        }
      });
      ui.choices.appendChild(btn);
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
    setSpeech("Welcome back! Let's continue your quest.");
  }

  function wireUi() {
    ui.worldCards.forEach(function (card) {
      card.addEventListener("click", function () {
        const world = card.getAttribute("data-world");
        if (world === "alphabet") {
          localStorage.setItem(LAST_WORLD_KEY, "alphabet");
          setMascotState("welcome");
          setSpeech("Let's fly to Alphabet Forest!");
          window.location.href = "alphabet-forest.html";
          return;
        }
        openPreview(world);
      });
    });
    ui.continueBtn.addEventListener("click", goContinue);
    ui.exploreBtn.addEventListener("click", function () {
      document.getElementById("worlds").scrollIntoView({ behavior: "smooth", block: "start" });
      setMascotState("welcome");
      setSpeech("Pick your next learning world!");
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
        renderStats();
        ui.status.textContent = "Progress reset successfully.";
        setSpeech("All reset! Let's begin from the start.");
      });
    }
  }

  function init() {
    renderStats();
    initLottie();
    wireUi();
    setMascotState("idle");
    setTimeout(function () {
      setMascotState("welcome");
    }, 350);
  }

  init();
})();
