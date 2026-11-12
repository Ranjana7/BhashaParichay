(function initMultilingualHome() {
  const root = document.getElementById("languageHome");
  if (!root) return;
  const languageKey = root.getAttribute("data-language");
  const languages = window.BHASHA_LANGUAGES || {};
  const language = languages[languageKey];
  if (!language) return;

  const STORAGE_PREFIX = language.storagePrefix;
  const WORLD_UNLOCKS_KEY = STORAGE_PREFIX + ".worldUnlocks.v1";
  const LAST_WORLD_KEY = STORAGE_PREFIX + ".lastWorld";

  const ui = {
    title: document.getElementById("languageTitle"),
    subtitle: document.getElementById("languageSubtitle"),
    worldGrid: document.getElementById("languageWorldGrid"),
    stars: document.getElementById("languageStars"),
    gems: document.getElementById("languageGems"),
    medals: document.getElementById("languageMedalStatus")
  };

  if (ui.title) ui.title.textContent = language.title;
  if (ui.subtitle) ui.subtitle.textContent = "Choose a world and start your " + language.languageName + " adventure.";

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
    const unlockStars = 20;
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

  function renderWorldCards(rewards, unlockedSet) {
    if (!ui.worldGrid) return;
    ui.worldGrid.innerHTML = "";
    language.worlds.forEach(function (world) {
      const unlocked = unlockedSet.has(world.key);
      const card = document.createElement("button");
      card.type = "button";
      card.className = "world-card " + (unlocked ? "world-alphabet" : "locked");
      card.innerHTML =
        '<span class="world-icon">' + world.icon + "</span>" +
        '<span class="world-title">' + world.title + "</span>" +
        '<span class="world-text">' + world.subtitle + "</span>" +
        '<span class="world-text">' + (unlocked ? "Let's Explore!" : "Collect 20 stars + 1 gem to unlock") + "</span>";
      card.disabled = !unlocked;
      card.addEventListener("click", function () {
        localStorage.setItem(LAST_WORLD_KEY, world.key);
        window.location.href = "world.html?world=" + encodeURIComponent(world.key);
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
})();
