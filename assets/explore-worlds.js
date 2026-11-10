(function initExploreWorlds() {
  const HOME_KEY = "sanskritParichay.home.progress";
  const LESSON_KEY = "sanskritParichay.alphabetForest.progress";
  const LAST_WORLD_KEY = "sanskritParichay.lastWorld";
  const grid = document.getElementById("exploreWorldGrid");
  if (!grid) return;

  const worldsData = window.SANSKRIT_WORLDS || {};
  const motion = window.Motion || {};
  const animate = motion.animate || function () {};
  const worldOrder = [
    { key: "alphabet", title: "Alphabet Forest", subtitle: "Letters, sounds, and foundational games", lessons: 6, iconClass: "forest", cardClass: "world-alphabet", link: "alphabet-forest.html" },
    { key: "words", title: "Word Wonderland", subtitle: "Nouns and meanings", lessons: 3, iconClass: "word", cardClass: "world-word", link: "learning-world.html?world=words" },
    { key: "animals", title: "Animal Jungle", subtitle: "Animal vocabulary", lessons: 3, iconClass: "jungle", cardClass: "world-jungle", link: "learning-world.html?world=animals" },
    { key: "numbers", title: "Number Galaxy", subtitle: "Counting and number words", lessons: 3, iconClass: "galaxy", cardClass: "world-galaxy", link: "learning-world.html?world=numbers" },
    { key: "colours", title: "Colour Kingdom", subtitle: "Color words", lessons: 3, iconClass: "colour", cardClass: "world-colour", link: "learning-world.html?world=colours" },
    { key: "sentences", title: "Sentence Castle", subtitle: "Sentence building", lessons: 3, iconClass: "sentence", cardClass: "world-sentence", link: "learning-world.html?world=sentences" },
    { key: "stories", title: "Story Island", subtitle: "Story comprehension", lessons: 3, iconClass: "story", cardClass: "world-story", link: "learning-world.html?world=stories" },
    { key: "culture", title: "Sanskrit and Culture", subtitle: "Greetings, values, and culture", lessons: 3, iconClass: "culture", cardClass: "world-culture", link: "learning-world.html?world=culture" }
  ];

  const status = document.getElementById("exploreStatus");
  const home = readJson(HOME_KEY, { xp: 0, completed: [] });
  const alphabet = readJson(LESSON_KEY, { lessonIndex: 0, done: {}, stars: 0 });

  function readJson(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (_error) {
      return fallback;
    }
  }

  function alphabetCompleted() {
    const done = alphabet.done || {};
    return Boolean(done.hear && done.picture && done.arrange && done.flash && done.feed && done.trace && done.hunt);
  }

  function isUnlocked(worldKey) {
    if (worldKey === "alphabet") return true;
    const order = worldOrder.map(function (w) { return w.key; });
    const idx = order.indexOf(worldKey);
    if (idx <= 0) return true;
    const previous = order[idx - 1];
    if (previous === "alphabet") return alphabetCompleted();
    return Array.isArray(home.completed) && home.completed.includes(previous);
  }

  function worldProgress(worldKey, totalLessons) {
    if (worldKey === "alphabet") {
      const lessonIndex = Number(alphabet.lessonIndex || 0);
      const completed = alphabetCompleted() ? totalLessons : Math.max(0, Math.min(totalLessons - 1, lessonIndex));
      return { completed: completed, total: totalLessons };
    }
    const key = "sanskritParichay.world." + worldKey + ".progress";
    const p = readJson(key, { completedLessons: [] });
    const completed = Array.isArray(p.completedLessons) ? p.completedLessons.length : 0;
    return { completed: Math.min(totalLessons, completed), total: totalLessons };
  }

  grid.innerHTML = "";
  worldOrder.forEach(function (world) {
    const unlocked = isUnlocked(world.key);
    const progress = worldProgress(world.key, world.lessons);
    const card = document.createElement("article");
    card.className = "world-card " + world.cardClass + (unlocked ? "" : " locked");
    card.innerHTML =
      '<span class="world-icon ' + world.iconClass + '"><i></i><i></i><i></i></span>' +
      '<span class="world-title">' + world.title + "</span>" +
      '<span class="world-text">' + world.subtitle + "</span>" +
      '<span class="world-text">Lessons: ' + progress.completed + "/" + progress.total + "</span>" +
      '<div class="hero-actions">' +
      '<button class="button ' + (unlocked ? "primary" : "ghost") + '" type="button">' + (unlocked ? "Play / Continue" : "Locked") + "</button>" +
      "</div>";
    const actionButton = card.querySelector("button");
    actionButton.disabled = !unlocked;
    actionButton.addEventListener("click", function () {
      localStorage.setItem(LAST_WORLD_KEY, world.key);
      window.location.href = world.link;
    });
    grid.appendChild(card);
    animate(card, { opacity: [0, 1], transform: ["translateY(18px)", "translateY(0px)"] }, { duration: 0.45, easing: "ease-out", delay: worldOrder.indexOf(world) * 0.05 });
    const iconLeaves = card.querySelectorAll(".world-icon i");
    animate(iconLeaves, { transform: ["translateY(0px)", "translateY(-3px)", "translateY(0px)"] }, { duration: 2.6, repeat: Infinity, easing: "ease-in-out", delay: function (i) { return i * 0.2; } });
  });

  if (status) {
    status.textContent = "World progress is saved locally on this device.";
  }
})();
