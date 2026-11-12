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
  const WORLD_URL_KEY = "bhashaParichay.ui.lastLanguage";

  const ui = {
    title: document.getElementById("languageTitle"),
    subtitle: document.getElementById("languageSubtitle"),
    worldGrid: document.getElementById("languageWorldGrid"),
    stars: document.getElementById("languageStars"),
    gems: document.getElementById("languageGems"),
    medals: document.getElementById("languageMedalStatus")
  };

  document.body.classList.add("lang-theme-" + (language.languageTheme || language.key));
  localStorage.setItem(WORLD_URL_KEY, language.key);
  if (ui.title) ui.title.textContent = language.title;
  if (ui.subtitle) ui.subtitle.textContent = language.welcomeLine || ("Choose a world and start your " + language.languageName + " adventure.");

  function readJson(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (_error) {
      return fallback;
    }
  }

  function rewardsFromProgress() {
    return language.worlds.reduce(function (acc, world) {
      const progress = readJson(STORAGE_PREFIX + ".world." + world.key + ".progress", {
        stars: 0,
        gems: 0,
        completedLessons: []
      });
      acc.stars += Math.max(0, Number(progress.stars || 0));
      acc.gems += Math.max(0, Number(progress.gems || 0));
      return acc;
    }, { stars: 0, gems: 0 });
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
    localStorage.setItem(WORLD_UNLOCKS_KEY, JSON.stringify(state));
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
      availableGems: Math.max(0, rewards.gems - state.spentGems),
      lifetimeStars: rewards.stars,
      lifetimeGems: rewards.gems
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

  function renderWorldCards(rewards, unlockedSet) {
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

  const synced = syncUnlocks();
  if (ui.stars) ui.stars.textContent = String(synced.availableStars);
  if (ui.gems) ui.gems.textContent = String(synced.availableGems);
  if (ui.medals) {
    ui.medals.textContent = isLevelOneComplete()
      ? language.languageName + " Level 1 Complete 🏅"
      : language.languageName + " Level 1 medal: keep learning!";
  }
  renderWorldCards(synced, new Set(synced.unlocked));

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
