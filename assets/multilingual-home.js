(function initMultilingualHome() {
  const root = document.getElementById("languageHome");
  if (!root) return;

  const languageKey = root.getAttribute("data-language");
  const languages = window.BHASHA_LANGUAGES || {};
  const language = languages[languageKey];
  if (!language) return;

  const prefersReducedMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const motion = window.Motion || {};
  const animate = motion.animate || function () {};

  const STORAGE_PREFIX = language.storagePrefix;
  const WORLD_UNLOCKS_KEY = STORAGE_PREFIX + ".worldUnlocks.v1";
  const LAST_WORLD_KEY = STORAGE_PREFIX + ".lastWorld";
  const BONUS_REWARDS_KEY = STORAGE_PREFIX + ".homeBonus.v1";
  const CHALLENGE_KEY = STORAGE_PREFIX + ".dailyChallenge.progress.v1";
  const WORLD_URL_KEY = "bhashaParichay.ui.lastLanguage";

  const ui = {
    title: document.getElementById("languageTitle"),
    subtitle: document.getElementById("languageSubtitle"),
    greeting: document.getElementById("languageGreeting"),
    mascotSpeech: document.getElementById("mascotSpeech"),
    worldGrid: document.getElementById("languageWorldGrid"),
    stars: document.getElementById("languageStars"),
    gems: document.getElementById("languageGems"),
    medals: document.getElementById("languageMedalStatus"),
    playNowBtn: document.getElementById("playNowBtn"),
    continueBtn: document.getElementById("continueBtn"),
    challengeBtn: document.getElementById("challengeBtn"),
    challengeSubtitle: document.getElementById("challengeSubtitle"),
    challengeMeta: document.getElementById("challengeMeta"),
    challengeProgressFill: document.getElementById("challengeProgressFill"),
    challengeProgressText: document.getElementById("challengeProgressText"),
    previewTitle: document.getElementById("previewTitle"),
    previewText: document.getElementById("previewText"),
    previewChoices: document.getElementById("previewChoices"),
    previewStatus: document.getElementById("previewStatus"),
    challengeActionBtn: document.getElementById("challengeActionBtn"),
    previewPanel: document.getElementById("previewPanel")
  };

  const greetings = {
    sanskrit: {
      greeting: "Namaste, Little Explorer!",
      intro: "Hi! I'm Mithu! Let's explore Sanskrit through magical adventures!"
    },
    spanish: {
      greeting: "¡Hola, pequeño explorador!",
      intro: "¡Hola! I'm Mithu! Let's explore Spanish through magical adventures!"
    },
    portuguese: {
      greeting: "Olá, pequeno explorador!",
      intro: "Olá! I'm Mithu! Let's discover Portuguese through exciting games and adventures!"
    }
  };

  const phrase = greetings[language.key] || greetings.sanskrit;

  function readJson(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (_error) {
      return fallback;
    }
  }

  function writeJson(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
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

  function getBonusRewards() {
    const bonus = readJson(BONUS_REWARDS_KEY, { stars: 0, gems: 0 });
    return {
      stars: Math.max(0, Math.floor(Number(bonus.stars || 0))),
      gems: Math.max(0, Math.floor(Number(bonus.gems || 0)))
    };
  }

  function setBonusRewards(starsDelta, gemsDelta) {
    const bonus = getBonusRewards();
    bonus.stars = Math.max(0, bonus.stars + Math.floor(Number(starsDelta || 0)));
    bonus.gems = Math.max(0, bonus.gems + Math.floor(Number(gemsDelta || 0)));
    writeJson(BONUS_REWARDS_KEY, bonus);
  }

  function rewardsFromProgress() {
    const totals = language.worlds.reduce(function (acc, world) {
      const progress = readJson(STORAGE_PREFIX + ".world." + world.key + ".progress", {
        stars: 0,
        gems: 0,
        completedLessons: []
      });
      acc.stars += Math.max(0, Number(progress.stars || 0));
      acc.gems += Math.max(0, Number(progress.gems || 0));
      return acc;
    }, { stars: 0, gems: 0 });
    const bonus = getBonusRewards();
    return {
      stars: totals.stars + bonus.stars,
      gems: totals.gems + bonus.gems
    };
  }

  function getUnlockState() {
    const initial = { unlocked: [language.worlds[0].key], spentStars: 0, spentGems: 0 };
    const raw = readJson(WORLD_UNLOCKS_KEY, initial);
    const unlocked = Array.isArray(raw.unlocked) && raw.unlocked.length ? raw.unlocked : [language.worlds[0].key];
    return {
      unlocked: unlocked,
      spentStars: Math.max(0, Math.floor(Number(raw.spentStars || 0))),
      spentGems: Math.max(0, Math.floor(Number(raw.spentGems || 0)))
    };
  }

  function saveUnlockState(state) {
    writeJson(WORLD_UNLOCKS_KEY, state);
  }

  function syncUnlocks() {
    const state = getUnlockState();
    const rewards = rewardsFromProgress();
    let availableStars = Math.max(0, rewards.stars - state.spentStars);
    let availableGems = Math.max(0, rewards.gems - state.spentGems);
    const unlockStars = 50;
    const unlockGems = 1;

    for (let i = 1; i < language.worlds.length; i += 1) {
      const prev = language.worlds[i - 1].key;
      const current = language.worlds[i].key;
      if (!state.unlocked.includes(prev)) break;
      if (state.unlocked.includes(current)) continue;
      if (availableStars < unlockStars || availableGems < unlockGems) break;
      state.unlocked.push(current);
      state.spentStars += unlockStars;
      state.spentGems += unlockGems;
      availableStars -= unlockStars;
      availableGems -= unlockGems;
      break;
    }

    saveUnlockState(state);
    return {
      unlocked: state.unlocked.slice(),
      availableStars: Math.max(0, rewards.stars - state.spentStars),
      availableGems: Math.max(0, rewards.gems - state.spentGems)
    };
  }

  function isLevelOneComplete() {
    const levelOneKey = language.levelOneWorld;
    const world = language.worlds.find(function (item) { return item.key === levelOneKey; });
    if (!world) return false;
    const progress = readJson(STORAGE_PREFIX + ".world." + levelOneKey + ".progress", { completedLessons: [] });
    return Array.isArray(progress.completedLessons) && progress.completedLessons.length >= world.lessons.length;
  }

  function goToWorld(worldKey) {
    localStorage.setItem(LAST_WORLD_KEY, worldKey);
    const target = "world.html?world=" + encodeURIComponent(worldKey);
    if (prefersReducedMotion) {
      window.location.href = target;
      return;
    }
    document.body.classList.add("page-transitioning");
    setTimeout(function () {
      window.location.href = target;
    }, 220);
  }

  function renderWorldCards(unlockedSet) {
    if (!ui.worldGrid) return;
    ui.worldGrid.innerHTML = "";
    language.worlds.forEach(function (world) {
      const unlocked = unlockedSet.has(world.key);
      const card = document.createElement("button");
      card.type = "button";
      card.className = "world-card " + (world.cardClass || "world-alphabet") + (unlocked ? "" : " locked");
      const art = world.illustration
        ? '<span class="world-icon world-photo"><img src="' + world.illustration + '" alt="' + world.title + ' illustration"></span>'
        : '<span class="world-icon"><i></i><i></i><i></i></span>';
      card.innerHTML =
        art +
        '<span class="world-title">' + world.title + "</span>" +
        '<span class="world-text">' + world.subtitle + "</span>" +
        '<span class="world-text">' + (unlocked ? "Let's Explore!" : "Collect 50 stars + 1 gem to unlock") + "</span>";
      card.disabled = !unlocked;
      card.addEventListener("click", function () {
        goToWorld(world.key);
      });
      ui.worldGrid.appendChild(card);
    });
  }

  function buildChallengeSteps() {
    const steps = [];
    language.worlds.forEach(function (world) {
      (world.lessons || []).forEach(function (lesson) {
        if (lesson.match && Array.isArray(lesson.match.options)) {
          steps.push({
            title: "Challenge: Match",
            prompt: lesson.match.prompt,
            options: lesson.match.options.slice(0, 3),
            answer: lesson.match.answer
          });
        }
        if (lesson.listen && Array.isArray(lesson.listen.options)) {
          steps.push({
            title: "Challenge: Listen",
            prompt: lesson.listen.prompt,
            options: lesson.listen.options.slice(0, 3),
            answer: lesson.listen.answer
          });
        }
      });
    });
    return steps.slice(0, 5);
  }

  const challengeSteps = buildChallengeSteps();
  const daily = (function loadDailyProgress() {
    const today = londonDateKey();
    const data = readJson(CHALLENGE_KEY, null);
    if (!data || data.date !== today) {
      return { date: today, started: false, stepIndex: 0, completed: false, rewardClaimed: false };
    }
    return {
      date: today,
      started: Boolean(data.started),
      stepIndex: Math.max(0, Math.floor(Number(data.stepIndex || 0))),
      completed: Boolean(data.completed),
      rewardClaimed: Boolean(data.rewardClaimed)
    };
  })();

  function saveDailyProgress() {
    writeJson(CHALLENGE_KEY, daily);
  }

  function renderChallengeProgress() {
    if (!ui.challengeProgressFill || !ui.challengeProgressText) return;
    const completeCount = Math.min(challengeSteps.length, daily.stepIndex);
    const percent = challengeSteps.length ? Math.round((completeCount / challengeSteps.length) * 100) : 0;
    ui.challengeProgressFill.style.width = String(percent) + "%";
    ui.challengeProgressText.textContent = "Progress: " + completeCount + "/" + challengeSteps.length;
  }

  function renderChallengeIdle() {
    renderChallengeProgress();
    if (!ui.previewTitle || !ui.previewText || !ui.previewChoices || !ui.previewStatus) return;
    ui.previewChoices.innerHTML = "";
    ui.previewStatus.textContent = "";
    if (!challengeSteps.length) {
      ui.previewTitle.textContent = "Challenge of the Day";
      ui.previewText.textContent = "Challenge will appear once enough lessons are available.";
      return;
    }
    if (daily.completed) {
      ui.previewTitle.textContent = "Challenge of the Day Complete";
      ui.previewText.textContent = "Great job! Come back tomorrow for a new challenge.";
      ui.previewStatus.textContent = daily.rewardClaimed ? "Today's 2 gems are already collected." : "";
      return;
    }
    if (!daily.started) {
      ui.previewTitle.textContent = "Challenge of the Day";
      ui.previewText.textContent = "Complete five mini questions to earn +2 gems.";
      return;
    }
    renderChallengeStep();
  }

  function completeChallengeStep() {
    daily.stepIndex += 1;
    if (daily.stepIndex >= challengeSteps.length) {
      daily.stepIndex = challengeSteps.length;
      daily.completed = true;
      if (!daily.rewardClaimed) {
        setBonusRewards(0, 2);
        daily.rewardClaimed = true;
      }
      saveDailyProgress();
      const synced = syncUnlocks();
      if (ui.stars) ui.stars.textContent = String(synced.availableStars);
      if (ui.gems) ui.gems.textContent = String(synced.availableGems);
      renderChallengeIdle();
      if (ui.previewStatus) ui.previewStatus.textContent = "🎉 +2 gems awarded!";
      return;
    }
    saveDailyProgress();
    renderChallengeStep();
  }

  function renderChallengeStep() {
    renderChallengeProgress();
    const step = challengeSteps[daily.stepIndex];
    if (!step || !ui.previewTitle || !ui.previewText || !ui.previewChoices || !ui.previewStatus) return;
    ui.previewTitle.textContent = step.title;
    ui.previewText.textContent = step.prompt;
    ui.previewChoices.innerHTML = "";
    ui.previewStatus.textContent = "";
    step.options.forEach(function (option) {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "button ghost";
      button.textContent = option;
      button.addEventListener("click", function () {
        if (option === step.answer) {
          ui.previewStatus.textContent = "Great job!";
          completeChallengeStep();
        } else {
          ui.previewStatus.textContent = "Try again!";
        }
      });
      ui.previewChoices.appendChild(button);
    });
  }

  function startChallenge() {
    if (!challengeSteps.length) return;
    daily.started = true;
    saveDailyProgress();
    renderChallengeStep();
    if (ui.previewPanel) {
      const header = document.querySelector(".site-header");
      const offset = header ? Math.ceil(header.getBoundingClientRect().height) + 8 : 88;
      const top = Math.max(0, window.scrollY + ui.previewPanel.getBoundingClientRect().top - offset);
      window.scrollTo({ top: top, behavior: "smooth" });
    }
  }

  document.body.classList.add("lang-theme-" + (language.languageTheme || language.key));
  localStorage.setItem(WORLD_URL_KEY, language.key);

  if (ui.title) ui.title.textContent = language.title;
  if (ui.subtitle) ui.subtitle.textContent = language.welcomeLine || ("Choose a world and start your " + language.languageName + " adventure.");
  if (ui.greeting) ui.greeting.textContent = phrase.greeting;
  if (ui.mascotSpeech) ui.mascotSpeech.textContent = phrase.intro;
  if (ui.challengeSubtitle) ui.challengeSubtitle.textContent = "Play a little extra and collect more stars and gems!";
  if (ui.challengeMeta) ui.challengeMeta.textContent = "Finish the challenge to earn 2 gems once per day on this device.";

  const synced = syncUnlocks();
  if (ui.stars) ui.stars.textContent = String(synced.availableStars);
  if (ui.gems) ui.gems.textContent = String(synced.availableGems);
  if (ui.medals) {
    ui.medals.textContent = isLevelOneComplete()
      ? language.languageName + " Level 1 Complete 🏅"
      : language.languageName + " Level 1 medal: keep learning!";
  }
  renderWorldCards(new Set(synced.unlocked));
  renderChallengeIdle();

  if (ui.playNowBtn) {
    ui.playNowBtn.addEventListener("click", function (event) {
      event.preventDefault();
      goToWorld(language.worlds[0].key);
    });
  }
  if (ui.continueBtn) {
    ui.continueBtn.addEventListener("click", function () {
      const lastWorld = localStorage.getItem(LAST_WORLD_KEY) || language.worlds[0].key;
      const unlocked = new Set(syncUnlocks().unlocked);
      goToWorld(unlocked.has(lastWorld) ? lastWorld : language.worlds[0].key);
    });
  }
  if (ui.challengeBtn) {
    ui.challengeBtn.hidden = !challengeSteps.length;
    ui.challengeBtn.addEventListener("click", startChallenge);
  }

  if (!prefersReducedMotion) {
    const cards = Array.prototype.slice.call(document.querySelectorAll(".world-card"));
    if (cards.length) {
      animate(
        cards,
        { opacity: [0, 1], transform: ["translateY(9px)", "translateY(0px)"] },
        { duration: 0.36, easing: "ease-out", delay: function (i) { return Math.min(0.25, i * 0.035); } }
      );
    }
  }
})();
