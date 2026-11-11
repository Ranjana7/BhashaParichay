(function initLearningWorld() {
  const params = new URLSearchParams(window.location.search);
  const worldKey = params.get("world");
  const worlds = window.SANSKRIT_WORLDS || {};
  const world = worlds[worldKey];
  if (!world) {
    window.location.href = "explore-worlds.html";
    return;
  }

  const HOME_KEY = "sanskritParichay.home.progress";
  const WORLD_KEY = "sanskritParichay.world." + worldKey + ".progress";
  const LAST_WORLD_KEY = "sanskritParichay.lastWorld";
  const TOTAL = 3;
  const WORLD_ORDER = Array.isArray(window.SP_WORLD_ORDER) && window.SP_WORLD_ORDER.length
    ? window.SP_WORLD_ORDER.slice()
    : ["alphabet", "animals", "numbers", "colours", "words", "sentences", "stories", "culture"];
  const WORLD_TOTALS = window.SP_WORLD_TOTALS && typeof window.SP_WORLD_TOTALS === "object"
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
  const motion = window.Motion || {};
  const animate = motion.animate || function () {};
  const prefersReducedMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const messages = window.SP_MESSAGES || {};
  const worldWelcome = (messages.worldWelcome && messages.worldWelcome[worldKey]) || ("Namaste! Let's learn " + world.title + ".");
  const praisePool = (messages.alphabetForest && messages.alphabetForest.correct) || ["Wonderful! Let's keep going!"];
  const retryPool = (messages.alphabetForest && messages.alphabetForest.incorrect) || ["Not quite! Have another look!"];
  const completePool = (messages.alphabetForest && messages.alphabetForest.completed) || ["Wow! You did it! Let's celebrate!"];
  const messageCursor = {};

  const ui = {
    worldTitle: document.getElementById("worldTitle"),
    worldSubtitle: document.getElementById("worldSubtitle"),
    worldLessonName: document.getElementById("worldLessonName"),
    worldLessonIndex: document.getElementById("worldLessonIndex"),
    worldLessonObjective: document.getElementById("worldLessonObjective"),
    worldPrevLessonBtn: document.getElementById("worldPrevLessonBtn"),
    worldNextLessonBtn: document.getElementById("worldNextLessonBtn"),
    worldContinueBtn: document.getElementById("worldContinueBtn"),
    worldBackBtn: document.getElementById("worldBackBtn"),
    worldIllustration: document.getElementById("worldIllustration"),
    worldIllustrationSparkle: document.getElementById("worldIllustrationSparkle"),
    worldLessonPath: document.getElementById("worldLessonPath"),
    worldStars: document.getElementById("worldStars"),
    worldGems: document.getElementById("worldGems"),
    worldDone: document.getElementById("worldDone"),
    worldProgressFill: document.getElementById("worldProgressFill"),
    worldProgressText: document.getElementById("worldProgressText"),
    focusCards: document.getElementById("focusCards"),
    matchPrompt: document.getElementById("matchPrompt"),
    matchChoices: document.getElementById("matchChoices"),
    matchStatus: document.getElementById("matchStatus"),
    listenPrompt: document.getElementById("listenPrompt"),
    playListenBtn: document.getElementById("playListenBtn"),
    listenChoices: document.getElementById("listenChoices"),
    listenStatus: document.getElementById("listenStatus"),
    buildPrompt: document.getElementById("buildPrompt"),
    buildTiles: document.getElementById("buildTiles"),
    buildAnswer: document.getElementById("buildAnswer"),
    checkBuildBtn: document.getElementById("checkBuildBtn"),
    resetBuildBtn: document.getElementById("resetBuildBtn"),
    buildStatus: document.getElementById("buildStatus"),
    worldReviewList: document.getElementById("worldReviewList"),
    lessonMascot: document.getElementById("lessonMascot"),
    worldMascotSpeech: document.getElementById("worldMascotSpeech")
  };

  const safe = {
    lessonIndex: 0,
    stars: 0,
    completedLessons: [],
    done: { match: false, listen: false, build: false },
    practiceCompleted: { match: false, listen: false, build: false },
    rewardedActivities: {}
  };

  const state = {
    progress: loadProgress(),
    buildSelected: []
  };
  let worldSparkleAnim = null;

  function pickMessage(key, list) {
    if (!Array.isArray(list) || !list.length) return "";
    const previous = messageCursor[key] || "";
    const options = list.length > 1 ? list.filter(function (item) { return item !== previous; }) : list;
    const selected = options[Math.floor(Math.random() * options.length)] || list[0];
    messageCursor[key] = selected;
    return selected;
  }

  function loadProgress() {
    try {
      const raw = localStorage.getItem(WORLD_KEY);
      if (!raw) return JSON.parse(JSON.stringify(safe));
      const p = JSON.parse(raw);
      return {
        lessonIndex: Number(p.lessonIndex || 0),
        stars: Number(p.stars || 0),
        completedLessons: Array.isArray(p.completedLessons) ? p.completedLessons : [],
        done: {
          match: Boolean(p.done && p.done.match),
          listen: Boolean(p.done && p.done.listen),
          build: Boolean(p.done && p.done.build)
        },
        practiceCompleted: {
          match: Boolean((p.practiceCompleted && p.practiceCompleted.match) || (p.done && p.done.match)),
          listen: Boolean((p.practiceCompleted && p.practiceCompleted.listen) || (p.done && p.done.listen)),
          build: Boolean((p.practiceCompleted && p.practiceCompleted.build) || (p.done && p.done.build))
        },
        rewardedActivities: p.rewardedActivities && typeof p.rewardedActivities === "object" ? p.rewardedActivities : {}
      };
    } catch (error) {
      return JSON.parse(JSON.stringify(safe));
    }
  }

  function saveProgress() {
    localStorage.setItem(WORLD_KEY, JSON.stringify(state.progress));
    if (typeof window.spSyncProgressModel === "function") {
      window.spSyncProgressModel(WORLD_ORDER, WORLD_TOTALS);
    }
  }

  function currentLesson() {
    return world.lessons[Math.max(0, Math.min(world.lessons.length - 1, state.progress.lessonIndex))];
  }

  function setSpeech(text) {
    if (ui.worldMascotSpeech) ui.worldMascotSpeech.textContent = text;
  }

  function setMascot(kind) {
    const body = ui.lessonMascot.querySelector(".mithu-body");
    const wingL = ui.lessonMascot.querySelector(".mithu-wing-left");
    const wingR = ui.lessonMascot.querySelector(".mithu-wing-right");
    const eyeL = ui.lessonMascot.querySelector(".mithu-eye-left");
    const eyeR = ui.lessonMascot.querySelector(".mithu-eye-right");
    if (!body) return;

    if (kind === "idle") {
      animate(body, { transform: ["translateY(0px)", "translateY(-2px)", "translateY(0px)"] }, { duration: 2.2, repeat: Infinity, easing: "ease-in-out" });
      animate([eyeL, eyeR], { transform: ["scaleY(1)", "scaleY(0.2)", "scaleY(1)"] }, { duration: 4.2, repeat: Infinity, easing: "ease-in-out" });
    } else if (kind === "thinking") {
      animate(body, { transform: ["rotate(0deg)", "rotate(-4deg)", "rotate(0deg)"] }, { duration: 0.8, easing: "ease-in-out" });
    } else if (kind === "flying") {
      animate(ui.lessonMascot, { transform: ["translateX(0px) translateY(0px)", "translateX(12px) translateY(-6px)", "translateX(0px) translateY(0px)"] }, { duration: 0.8, easing: "ease-in-out" });
      animate([wingL, wingR], { transform: ["rotate(0deg)", "rotate(30deg)", "rotate(0deg)"] }, { duration: 0.35, repeat: 2, easing: "ease-in-out" });
    } else if (kind === "listening") {
      animate(body, { transform: ["rotate(0deg)", "rotate(2deg)", "rotate(0deg)"] }, { duration: 0.8, easing: "ease-in-out" });
    } else if (kind === "encouraging") {
      animate(body, { transform: ["translateY(0px)", "translateY(-4px)", "translateY(0px)"] }, { duration: 0.6, easing: "ease-in-out" });
    } else if (kind === "eating") {
      animate(body, { transform: ["translateY(0px)", "translateY(-3px)", "translateY(0px)", "translateY(-2px)", "translateY(0px)"] }, { duration: 0.8, easing: "ease-in-out" });
    } else if (kind === "correct") {
      animate(body, { transform: ["translateY(0px)", "translateY(-10px)", "translateY(0px)"] }, { duration: 0.5, easing: "ease-out" });
      animate([wingL, wingR], { transform: ["rotate(0deg)", "rotate(28deg)", "rotate(0deg)"] }, { duration: 0.45, easing: "ease-out" });
    } else if (kind === "wrong") {
      animate(body, { transform: ["rotate(0deg)", "rotate(3deg)", "rotate(-3deg)", "rotate(0deg)"] }, { duration: 0.7, easing: "ease-in-out" });
    } else if (kind === "dance") {
      animate(body, { transform: ["translateY(0px) rotate(0deg)", "translateY(-7px) rotate(5deg)", "translateY(0px) rotate(-5deg)", "translateY(0px) rotate(0deg)"] }, { duration: 1.1, repeat: 2, easing: "ease-in-out" });
    }
  }

  function confetti() {
    if (window.SP_STATE && window.SP_STATE.muted) return;
    if (window.confetti) {
      window.confetti({ particleCount: 52, spread: 64, startVelocity: 30, ticks: 95, origin: { y: 0.68 } });
    }
    if (window.spApplause) window.spApplause();
  }

  function initWorldIllustration() {
    if (!ui.worldIllustration) return;
    if (!prefersReducedMotion) {
      animate(
        ui.worldIllustration.querySelectorAll(".world-clouds ellipse"),
        { transform: ["translateX(0px)", "translateX(10px)", "translateX(0px)"] },
        { duration: 5.8, repeat: Infinity, easing: "ease-in-out", delay: function (i) { return i * 0.12; } }
      );
      animate(
        ui.worldIllustration.querySelectorAll(".world-sparkles circle"),
        { opacity: [0.42, 1, 0.48], transform: ["scale(0.8)", "scale(1.15)", "scale(0.85)"] },
        { duration: 2.8, repeat: Infinity, easing: "ease-in-out", delay: function (i) { return i * 0.22; } }
      );
    }
    if (window.lottie && ui.worldIllustrationSparkle) {
      worldSparkleAnim = window.lottie.loadAnimation({
        container: ui.worldIllustrationSparkle,
        renderer: "svg",
        loop: true,
        autoplay: true,
        path: "assets/lottie/sparkle.json"
      });
    }
  }

  function pulseWorldIllustration() {
    if (!ui.worldIllustration || prefersReducedMotion) return;
    animate(ui.worldIllustration, { transform: ["scale(1)", "scale(1.018)", "scale(1)"] }, { duration: 0.5, easing: "ease-in-out" });
  }

  function updateHomeCompletion() {
    try {
      const raw = localStorage.getItem(HOME_KEY);
      const home = raw ? JSON.parse(raw) : { xp: 0, completed: [] };
      if (!home.completed.includes(worldKey)) {
        home.completed.push(worldKey);
        home.xp = Number(home.xp || 0) + 30;
      }
      localStorage.setItem(HOME_KEY, JSON.stringify(home));
      if (typeof window.spSyncProgressModel === "function") {
        window.spSyncProgressModel(WORLD_ORDER, WORLD_TOTALS);
      }
    } catch (error) {
      // Keep local world progress even if home aggregate update fails.
    }
  }

  function doneCount() {
    return Object.values(state.progress.done).filter(Boolean).length;
  }

  function getNextWorldKey() {
    const index = WORLD_ORDER.indexOf(worldKey);
    if (index < 0 || index >= WORLD_ORDER.length - 1) return null;
    return WORLD_ORDER[index + 1];
  }

  function getNextWorldUrl() {
    const nextWorld = getNextWorldKey();
    if (!nextWorld) return "index.html#worlds";
    if (nextWorld === "alphabet") return "alphabet-forest.html";
    return "learning-world.html?world=" + nextWorld;
  }

  function rewardKey(activityId) {
    return String(state.progress.lessonIndex) + ":" + String(activityId);
  }

  function rewardIfFirstTime(activityId) {
    const key = rewardKey(activityId);
    if (state.progress.rewardedActivities[key]) return false;
    state.progress.rewardedActivities[key] = true;
    state.progress.stars += 2;
    return true;
  }

  function renderHeader() {
    const lesson = currentLesson();
    ui.worldTitle.textContent = world.title;
    ui.worldSubtitle.textContent = worldWelcome;
    ui.worldLessonName.textContent = lesson.title;
    ui.worldLessonIndex.textContent = "Lesson " + (state.progress.lessonIndex + 1) + " / " + world.lessons.length;
    ui.worldLessonObjective.textContent = lesson.objective;
    if (ui.worldPrevLessonBtn) ui.worldPrevLessonBtn.disabled = state.progress.lessonIndex === 0;
    ui.worldStars.textContent = String(state.progress.stars);
    if (ui.worldGems) {
      const rewards = typeof window.spGetRewards === "function"
        ? window.spGetRewards(WORLD_ORDER, WORLD_TOTALS)
        : { gems: 0 };
      ui.worldGems.textContent = String(Number(rewards.gems || 0));
    }
    ui.worldDone.textContent = String(doneCount());
    ui.worldProgressFill.style.width = Math.round((doneCount() / TOTAL) * 100) + "%";

    const lessonDone = doneCount() >= TOTAL;
    const isLast = state.progress.lessonIndex >= world.lessons.length - 1;
    if (lessonDone && !isLast) {
      ui.worldNextLessonBtn.disabled = false;
      ui.worldNextLessonBtn.textContent = "Unlock Next Lesson";
      ui.worldProgressText.textContent = "Great! Unlock the next lesson.";
      pulseWorldIllustration();
      ui.worldContinueBtn.textContent = "Continue Adventure";
    } else if (lessonDone && isLast) {
      ui.worldNextLessonBtn.disabled = true;
      ui.worldNextLessonBtn.textContent = "World Completed";
      ui.worldProgressText.textContent = "Hooray! Your next adventure is ready!";
      if (!state.progress.completedLessons.includes(state.progress.lessonIndex)) {
        state.progress.completedLessons.push(state.progress.lessonIndex);
      }
      updateHomeCompletion();
      setMascot("dance");
      setSpeech(pickMessage("activity-complete", completePool));
      pulseWorldIllustration();
      const nextWorldKey = getNextWorldKey();
      const canContinue = nextWorldKey && typeof window.spIsWorldUnlocked === "function"
        ? window.spIsWorldUnlocked(nextWorldKey, WORLD_ORDER)
        : Boolean(nextWorldKey);
      ui.worldContinueBtn.textContent = canContinue ? "Continue Adventure" : "Back to Home";
      ui.worldContinueBtn.dataset.targetUrl = canContinue ? getNextWorldUrl() : "index.html#worlds";
      if (canContinue) confetti();
    } else {
      ui.worldNextLessonBtn.disabled = true;
      ui.worldNextLessonBtn.textContent = "Next Lesson (complete all activities)";
      ui.worldProgressText.textContent = "Finish all activities in this lesson.";
      ui.worldContinueBtn.textContent = "Continue Adventure";
      ui.worldContinueBtn.dataset.targetUrl = "index.html#worlds";
    }
  }

  function renderLessonPath() {
    ui.worldLessonPath.innerHTML = "";
    for (let i = 0; i < world.lessons.length; i += 1) {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "path-node";
      const title = document.createElement("span");
      title.className = "path-title";
      title.textContent = (i + 1) + ". " + world.lessons[i].title;
      const status = document.createElement("span");
      status.className = "path-state";

      const unlocked = i === 0 || state.progress.completedLessons.includes(i - 1) || i <= state.progress.lessonIndex;
      const completed = state.progress.completedLessons.includes(i);
      if (completed) {
        btn.classList.add("completed");
        status.textContent = "Completed";
      } else if (unlocked) {
        btn.classList.add("unlocked");
        status.textContent = "Unlocked";
      } else {
        btn.classList.add("locked");
        status.textContent = "Locked";
      }

      btn.appendChild(title);
      btn.appendChild(status);
      btn.addEventListener("click", function () {
        if (!unlocked) return;
        state.progress.lessonIndex = i;
        state.progress.done = { match: false, listen: false, build: false };
        saveProgress();
        renderAll();
        setMascot("thinking");
        setSpeech("Let's begin " + world.lessons[i].title + ".");
      });
      ui.worldLessonPath.appendChild(btn);
    }
  }

  function renderFocus() {
    const lesson = currentLesson();
    ui.focusCards.innerHTML = "";
    lesson.focus.forEach(function (item) {
      const card = document.createElement("div");
      card.className = "choice-btn";
      card.innerHTML =
        "<strong>" + item.dev + "</strong><br><span>" + item.translit + " · " + item.meaning + "</span>";
      card.addEventListener("click", function () {
        window.spSpeak(item.dev, "hi-IN");
      });
      ui.focusCards.appendChild(card);
    });
  }

  function renderMatch() {
    const lesson = currentLesson();
    ui.matchPrompt.textContent = lesson.match.prompt;
    ui.matchChoices.innerHTML = "";
    ui.matchStatus.textContent = state.progress.done.match ? "Completed for this lesson." : "";
    lesson.match.options.forEach(function (opt) {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "choice-btn";
      btn.textContent = opt;
      if (state.progress.done.match) {
        btn.disabled = true;
        if (opt === lesson.match.answer) btn.classList.add("correct");
      }
      btn.addEventListener("click", function () {
        if (state.progress.done.match) return;
        if (opt === lesson.match.answer) {
          btn.classList.add("correct");
          state.progress.done.match = true;
          state.progress.practiceCompleted.match = true;
          rewardIfFirstTime("match");
          saveProgress();
          renderHeader();
          ui.matchStatus.textContent = "✅ Completed for this lesson.";
          setMascot("correct");
          setSpeech(pickMessage("correct", praisePool));
          confetti();
          pulseWorldIllustration();
          renderMatch();
        } else {
          btn.classList.add("wrong");
          ui.matchStatus.textContent = "Oops! Let's try that again.";
          setMascot("wrong");
          setSpeech(pickMessage("wrong", retryPool));
        }
      });
      ui.matchChoices.appendChild(btn);
    });
  }

  function renderListen() {
    const lesson = currentLesson();
    ui.listenPrompt.textContent = "Listen and choose: " + lesson.listen.dev;
    ui.listenChoices.innerHTML = "";
    ui.listenStatus.textContent = state.progress.done.listen ? "Completed for this lesson." : "";
    ui.playListenBtn.disabled = state.progress.done.listen;
    lesson.listen.options.forEach(function (opt) {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "choice-btn";
      btn.textContent = opt;
      if (state.progress.done.listen) {
        btn.disabled = true;
        if (opt === lesson.listen.answer) btn.classList.add("correct");
      }
      btn.addEventListener("click", function () {
        if (state.progress.done.listen) return;
        if (opt === lesson.listen.answer) {
          btn.classList.add("correct");
          state.progress.done.listen = true;
          state.progress.practiceCompleted.listen = true;
          rewardIfFirstTime("listen");
          saveProgress();
          renderHeader();
          ui.listenStatus.textContent = "✅ Completed for this lesson.";
          setMascot("correct");
          setSpeech(pickMessage("correct", praisePool));
          confetti();
          pulseWorldIllustration();
          renderListen();
        } else {
          btn.classList.add("wrong");
          ui.listenStatus.textContent = "Not quite! Listen once more and try again.";
          setMascot("wrong");
          setSpeech(pickMessage("wrong", retryPool));
        }
      });
      ui.listenChoices.appendChild(btn);
    });
  }

  function renderBuild() {
    const lesson = currentLesson();
    const b = lesson.build;
    state.buildSelected = [];
    ui.buildPrompt.textContent = "Build Sanskrit for: " + b.meaning;
    ui.buildAnswer.textContent = "";
    ui.buildStatus.textContent = state.progress.done.build ? "Completed for this lesson." : "";
    ui.checkBuildBtn.disabled = state.progress.done.build;
    ui.resetBuildBtn.disabled = state.progress.done.build;
    ui.buildTiles.innerHTML = "";

    b.tiles
      .slice()
      .sort(function () {
        return Math.random() - 0.5;
      })
      .forEach(function (tile) {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "tile-btn";
        btn.textContent = tile;
        if (state.progress.done.build) btn.disabled = true;
        btn.addEventListener("click", function () {
          if (state.progress.done.build) return;
          if (btn.disabled) return;
          btn.disabled = true;
          state.buildSelected.push(tile);
          ui.buildAnswer.textContent = state.buildSelected.join(" ");
        });
        ui.buildTiles.appendChild(btn);
      });
  }

  function checkBuildAnswer() {
    const lesson = currentLesson();
    const guess = state.buildSelected.join("").replace(/\s+/g, "");
    const answer = lesson.build.answer.replace(/\s+/g, "");
    if (guess === answer) {
      state.progress.done.build = true;
      state.progress.practiceCompleted.build = true;
      rewardIfFirstTime("build");
      saveProgress();
      renderHeader();
      ui.buildStatus.textContent = "✅ Completed for this lesson.";
      setMascot("correct");
      setSpeech(pickMessage("correct", praisePool));
      confetti();
      pulseWorldIllustration();
      renderBuild();
    } else {
      ui.buildStatus.textContent = "Almost there! Try the tile order again.";
      setMascot("wrong");
      setSpeech(pickMessage("wrong", retryPool));
      animate(ui.buildTiles, { transform: ["translateX(0px)", "translateX(-5px)", "translateX(5px)", "translateX(0px)"] }, { duration: 0.35, easing: "ease-in-out" });
    }
  }

  function setupMascotFollowOnScroll() {
    if (!ui.lessonMascot) return;
    const pageWrap = document.querySelector(".page-wrap");
    const homeContainer = ui.lessonMascot.parentElement;
    const homeNextSibling = ui.lessonMascot.nextElementSibling;
    let mascotRail = null;
    const sections = Array.from(document.querySelectorAll("#main-content > section.panel"));
    let activeSectionId = "";
    if (!sections.length) return;

    function getMascotRail() {
      if (!pageWrap) return null;
      if (mascotRail && mascotRail.isConnected) return mascotRail;
      mascotRail = pageWrap.querySelector(".mascot-rail");
      if (mascotRail) return mascotRail;
      mascotRail = document.createElement("aside");
      mascotRail.className = "mascot-rail";
      mascotRail.setAttribute("aria-hidden", "true");
      pageWrap.appendChild(mascotRail);
      return mascotRail;
    }

    function placeMascotDesktop() {
      if (!pageWrap || !ui.lessonMascot) return;
      const rail = getMascotRail();
      if (rail && ui.lessonMascot.parentElement !== rail) {
        rail.appendChild(ui.lessonMascot);
      }
      pageWrap.classList.add("with-mascot");
      ui.lessonMascot.classList.remove("lesson-mascot-mobile");
      ui.lessonMascot.classList.add("is-journey-guide");
      ui.lessonMascot.style.top = "";
      ui.lessonMascot.style.right = "";
    }

    function placeMascotCompact() {
      if (!ui.lessonMascot || !homeContainer) return;
      if (ui.lessonMascot.parentElement !== homeContainer) {
        if (homeNextSibling && homeNextSibling.parentElement === homeContainer) {
          homeContainer.insertBefore(ui.lessonMascot, homeNextSibling);
        } else {
          homeContainer.appendChild(ui.lessonMascot);
        }
      }
      if (pageWrap) pageWrap.classList.remove("with-mascot");
      ui.lessonMascot.classList.add("lesson-mascot-mobile");
      ui.lessonMascot.classList.remove("is-journey-guide");
      ui.lessonMascot.style.top = "";
      ui.lessonMascot.style.right = "";
      ui.lessonMascot.style.transform = "";
    }

    function findActiveSection() {
      const anchorY = window.innerHeight * 0.34;
      let bestSection = null;
      let bestScore = -Infinity;
      sections.forEach(function (section) {
        const rect = section.getBoundingClientRect();
        if (rect.bottom < 0 || rect.top > window.innerHeight) return;
        let score;
        if (rect.top <= anchorY && rect.bottom >= anchorY) score = 10000 - Math.abs(anchorY - rect.top);
        else score = -Math.abs((rect.top + rect.height * 0.5) - anchorY);
        if (score > bestScore) {
          bestScore = score;
          bestSection = section;
        }
      });
      return bestSection;
    }

    function sectionMessage(section) {
      if (!section) return worldWelcome;
      const heading = section.querySelector("h2");
      const title = heading ? (heading.textContent || "").trim() : "";
      if (!title) return "Let's keep exploring this lesson together!";
      if (title.indexOf("Lesson Path") === 0) return "Choose your lesson path and let's continue!";
      if (title.indexOf("Focus Cards") === 0) return "Let's review these key words before the games.";
      if (title.indexOf("Activity 1") === 0) return "Match carefully. You can do it!";
      if (title.indexOf("Activity 2") === 0) return "Listen closely, then choose the right answer.";
      if (title.indexOf("Activity 3") === 0) return "Build the phrase step by step. I'll cheer you on!";
      if (title.indexOf("Adventure Notes") === 0) return "Wonderful progress! Here are your learning notes.";
      return "Now we are in " + title + ".";
    }

    function moveMascotToSection(section, compact) {
      if (compact || !section || !pageWrap || !ui.lessonMascot) {
        ui.lessonMascot.style.transform = "";
        return;
      }
      const rail = getMascotRail();
      if (!rail) return;
      let sectionTop = 0;
      let node = section;
      while (node && node !== pageWrap) {
        sectionTop += node.offsetTop || 0;
        node = node.offsetParent;
      }
      const sectionHeight = Math.max(section.offsetHeight || 0, section.getBoundingClientRect().height || 0);
      const mascotHeight = Math.ceil(ui.lessonMascot.getBoundingClientRect().height || 220);
      const railHeight = Math.max(rail.offsetHeight || 0, pageWrap.scrollHeight || 0);
      const targetTop = sectionTop + sectionHeight * 0.18;
      const maxTop = Math.max(0, railHeight - mascotHeight - 8);
      const clampedTop = Math.max(0, Math.min(maxTop, targetTop));
      const nextY = Math.round(clampedTop);
      const currentY = Number(ui.lessonMascot.dataset.railY || "0");
      if (Math.abs(nextY - currentY) > 1) {
        ui.lessonMascot.dataset.railY = String(nextY);
        ui.lessonMascot.style.transform = "translate3d(0," + nextY + "px,0)";
      }
    }

    function update() {
      const compact = window.matchMedia("(max-width: 980px)").matches;
      if (compact) placeMascotCompact();
      else placeMascotDesktop();
      const section = findActiveSection();
      const nextId = section ? (section.id || "") : "";
      ui.lessonMascot.setAttribute("data-active-section", nextId || "active");
      moveMascotToSection(section, compact);
      if (nextId && nextId !== activeSectionId) {
        activeSectionId = nextId;
        setSpeech(sectionMessage(section));
        if (!prefersReducedMotion) {
          setMascot("flying");
          window.setTimeout(function () { setMascot("idle"); }, 260);
        }
      }
    }

    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    update();
  }

  function renderReview() {
    ui.worldReviewList.innerHTML = "";
    const notes = [
      "Tip: Tap words again to hear and remember them.",
      "Try each activity slowly first, then challenge yourself!",
      "Collect stars by finishing all three lesson activities."
    ];
    notes.forEach(function (note) {
      const li = document.createElement("li");
      li.textContent = note;
      ui.worldReviewList.appendChild(li);
    });
  }

  function renderAll() {
    localStorage.setItem(LAST_WORLD_KEY, worldKey);
    renderHeader();
    renderLessonPath();
    renderFocus();
    renderMatch();
    renderListen();
    renderBuild();
    renderReview();
  }

  function wire() {
    ui.playListenBtn.addEventListener("click", function () {
      const lesson = currentLesson();
      setMascot("listening");
      setSpeech("Listen carefully and choose.");
      window.spSpeak(lesson.listen.dev, "hi-IN", ui.listenStatus, lesson.listen.dev);
    });
    ui.checkBuildBtn.addEventListener("click", checkBuildAnswer);
    ui.resetBuildBtn.addEventListener("click", renderBuild);
    ui.worldNextLessonBtn.addEventListener("click", function () {
      if (doneCount() < TOTAL) return;
      if (!state.progress.completedLessons.includes(state.progress.lessonIndex)) {
        state.progress.completedLessons.push(state.progress.lessonIndex);
      }
      if (state.progress.lessonIndex < world.lessons.length - 1) {
        state.progress.lessonIndex += 1;
        state.progress.done = { match: false, listen: false, build: false };
        saveProgress();
        renderAll();
        setMascot("thinking");
        setSpeech("Fantastic! A new lesson is ready!");
      }
    });
    if (ui.worldPrevLessonBtn) {
      ui.worldPrevLessonBtn.addEventListener("click", function () {
        if (state.progress.lessonIndex <= 0) return;
        state.progress.lessonIndex -= 1;
        state.progress.done = { match: false, listen: false, build: false };
        saveProgress();
        renderAll();
        setMascot("flying");
        setSpeech("Let's revisit this lesson together!");
      });
    }
    if (ui.worldContinueBtn) {
      ui.worldContinueBtn.addEventListener("click", function () {
        window.location.href = ui.worldContinueBtn.dataset.targetUrl || "index.html#worlds";
      });
    }
    if (ui.worldBackBtn) {
      ui.worldBackBtn.addEventListener("click", function () {
        window.location.href = "index.html#worlds";
      });
    }
  }

  renderAll();
  initWorldIllustration();
  wire();
  setMascot("idle");
  setSpeech(worldWelcome);
  setupMascotFollowOnScroll();
})();
