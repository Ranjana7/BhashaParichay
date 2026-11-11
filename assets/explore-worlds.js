(function initExploreWorlds() {
  const LAST_WORLD_KEY = "sanskritParichay.lastWorld";
  const grid = document.getElementById("exploreWorldGrid");
  if (!grid) return;

  const worldsData = window.SANSKRIT_WORLDS || {};
  const motion = window.Motion || {};
  const animate = motion.animate || function () {};
  const worldOrder = [
    { key: "alphabet", title: "Alphabet Forest", subtitle: "Letters, sounds, and foundational games", lessons: 9, iconClass: "forest", cardClass: "world-alphabet", link: "alphabet-forest.html" },
    { key: "words", title: "Word Wonderland", subtitle: "Nouns and meanings", lessons: 3, iconClass: "word", cardClass: "world-word", link: "learning-world.html?world=words" },
    { key: "animals", title: "Animal Jungle", subtitle: "Animal vocabulary", lessons: 3, iconClass: "jungle", cardClass: "world-jungle", link: "learning-world.html?world=animals" },
    { key: "numbers", title: "Number Galaxy", subtitle: "Counting and number words", lessons: 3, iconClass: "galaxy", cardClass: "world-galaxy", link: "learning-world.html?world=numbers" },
    { key: "colours", title: "Colour Kingdom", subtitle: "Color words", lessons: 3, iconClass: "colour", cardClass: "world-colour", link: "learning-world.html?world=colours" },
    { key: "sentences", title: "Sentence Castle", subtitle: "Sentence building", lessons: 3, iconClass: "sentence", cardClass: "world-sentence", link: "learning-world.html?world=sentences" },
    { key: "stories", title: "Story Island", subtitle: "Story comprehension", lessons: 3, iconClass: "story", cardClass: "world-story", link: "learning-world.html?world=stories" },
    { key: "culture", title: "Sanskrit and Culture", subtitle: "Greetings, values, and culture", lessons: 3, iconClass: "culture", cardClass: "world-culture", link: "learning-world.html?world=culture" }
  ];

  const status = document.getElementById("exploreStatus");
  const worldTotals = {};
  worldOrder.forEach(function (world) { worldTotals[world.key] = world.lessons; });
  const orderKeys = worldOrder.map(function (world) { return world.key; });
  if (typeof window.spSyncProgressModel === "function") {
    window.spSyncProgressModel(orderKeys, worldTotals);
  }
  const snapshot = typeof window.spGetProgressSnapshot === "function"
    ? window.spGetProgressSnapshot(orderKeys, worldTotals)
    : null;

  function isUnlocked(worldKey) {
    if (typeof window.spIsWorldUnlocked === "function") {
      return window.spIsWorldUnlocked(worldKey, orderKeys);
    }
    return true;
  }

  function worldProgress(worldKey, totalLessons) {
    if (snapshot) {
      if (worldKey === "alphabet") {
        const completed = Math.max(0, Math.min(totalLessons, Number(snapshot.alphabet.learningCompletedCount || 0) + Number(snapshot.alphabet.practiceCompletedCount || 0)));
        return { completed: completed, total: totalLessons };
      }
      const world = snapshot.worlds[worldKey];
      if (world) {
        return { completed: Math.min(totalLessons, world.completedLessonsCount), total: totalLessons };
      }
    }
    return { completed: 0, total: totalLessons };
  }

  function unlockHint(worldKey) {
    if (worldKey === "alphabet") return "";
    const index = orderKeys.indexOf(worldKey);
    const previous = orderKeys[index - 1] || "alphabet";
    if (previous === "alphabet") {
      const treeComplete = Boolean(snapshot && snapshot.alphabet && snapshot.alphabet.treeComplete);
      const practiceCompleted = Number((snapshot && snapshot.alphabet && snapshot.alphabet.practiceCompletedCount) || 0);
      const remainingPractice = Math.max(0, 2 - practiceCompleted);
      if (treeComplete && remainingPractice <= 0) return "Wonderful! Your next world is ready!";
      if (!treeComplete && remainingPractice <= 0) return "Complete Magical Tree to unlock your next adventure!";
      if (!treeComplete && remainingPractice === 1) return "Complete Magical Tree and 1 more practice game to unlock your next adventure!";
      if (!treeComplete) return "Complete Magical Tree and 2 practice games to unlock your next adventure!";
      return remainingPractice === 1
        ? "1 more practice game to unlock your next adventure!"
        : remainingPractice + " more practice games to unlock your next adventure!";
    }
    const previousWorld = worldOrder.find(function (item) { return item.key === previous; });
    const previousProgress = snapshot && snapshot.worlds && snapshot.worlds[previous] ? snapshot.worlds[previous] : null;
    const remainingPractice = Math.max(0, 2 - Number((previousProgress && previousProgress.practiceCompletedCount) || 0));
    if (remainingPractice <= 0) return "Wonderful! Your next world is ready!";
    return remainingPractice === 1
      ? "1 more practice game in " + (previousWorld ? previousWorld.title : "the previous world") + " to unlock your next adventure!"
      : remainingPractice + " more practice games in " + (previousWorld ? previousWorld.title : "the previous world") + " to unlock your next adventure!";
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
      (!unlocked ? '<span class="world-text world-lock-note">' + unlockHint(world.key) + "</span>" : "") +
      '<div class="hero-actions">' +
      '<button class="button ' + (unlocked ? "primary" : "ghost") + '" type="button">' + (unlocked ? "Continue Adventure" : "Locked") + "</button>" +
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
