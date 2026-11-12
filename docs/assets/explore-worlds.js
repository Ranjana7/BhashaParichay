(function initExploreWorlds() {
  const LAST_WORLD_KEY = "sanskritParichay.lastWorld";
  const grid = document.getElementById("exploreWorldGrid");
  if (!grid) return;

  const worldsData = window.SANSKRIT_WORLDS || {};
  const motion = window.Motion || {};
  const animate = motion.animate || function () {};
  const orderKeys = Array.isArray(window.SP_WORLD_ORDER) && window.SP_WORLD_ORDER.length
    ? window.SP_WORLD_ORDER.slice()
    : ["alphabet", "animals", "numbers", "colours", "words", "sentences", "stories", "culture"];
  const worldMeta = window.SP_WORLD_META && typeof window.SP_WORLD_META === "object" ? window.SP_WORLD_META : {};
  const worldTotalsConfig = window.SP_WORLD_TOTALS && typeof window.SP_WORLD_TOTALS === "object" ? window.SP_WORLD_TOTALS : {};
  const iconImageByWorld = {
    alphabet: { src: "assets/illustrations/vocab/forest.svg", alt: "Alphabet Forest illustration" },
    animals: { src: "assets/illustrations/vocab/elephant.svg", alt: "Animal Jungle illustration" },
    numbers: { src: "assets/illustrations/vocab/moon.svg", alt: "Number Galaxy illustration" },
    colours: { src: "assets/illustrations/vocab/lotus.svg", alt: "Colour Kingdom illustration" },
    words: { src: "assets/illustrations/vocab/family.svg", alt: "Word Wonderland illustration" },
    sentences: { src: "assets/illustrations/vocab/chariot.svg", alt: "Sentence Castle illustration" },
    stories: { src: "assets/illustrations/vocab/river.svg", alt: "Story Island illustration" },
    culture: { src: "assets/illustrations/vocab/yoga.svg", alt: "Sanskrit and Culture illustration" }
  };
  const cardClassByWorld = {
    alphabet: "world-alphabet",
    animals: "world-jungle",
    numbers: "world-galaxy",
    colours: "world-colour",
    words: "world-word",
    sentences: "world-sentence",
    stories: "world-story",
    culture: "world-culture"
  };
  const worldOrder = orderKeys.map(function (key) {
    const worldDef = worldsData[key];
    const meta = worldMeta[key] || {};
    return {
      key: key,
      title: meta.title || (worldDef && worldDef.title) || key,
      subtitle: (worldDef && worldDef.subtitle) || "Let's explore together!",
      lessons: Number(worldTotalsConfig[key] || (worldDef && Array.isArray(worldDef.lessons) ? worldDef.lessons.length : 3)),
      iconImage: iconImageByWorld[key] || iconImageByWorld.alphabet,
      cardClass: cardClassByWorld[key] || "world-alphabet",
      link: meta.url || (key === "alphabet" ? "alphabet-forest.html" : ("learning-world.html?world=" + key))
    };
  });

  const status = document.getElementById("exploreStatus");
  const worldTotals = {};
  worldOrder.forEach(function (world) { worldTotals[world.key] = world.lessons; });
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
    if (isUnlocked(worldKey)) return "Hooray! Your next adventure is ready!";
    const rewards = typeof window.spGetRewards === "function"
      ? window.spGetRewards(orderKeys, worldTotals)
      : { stars: 0, gems: 0 };
    const stars = Math.max(0, Math.floor(Number(rewards.stars || 0)));
    const gems = Math.max(0, Math.floor(Number(rewards.gems || 0)));
    const starsRemaining = Math.max(0, 50 - stars);
    const gemsRemaining = Math.max(0, 1 - gems);
    if (starsRemaining > 0 && gemsRemaining > 0) {
      return starsRemaining + " stars and " + gemsRemaining + " gem" + (gemsRemaining === 1 ? "" : "s") + " needed";
    }
    if (starsRemaining > 0) return starsRemaining + " more star" + (starsRemaining === 1 ? "" : "s") + " needed";
    if (gemsRemaining > 0) return gemsRemaining + " more gem" + (gemsRemaining === 1 ? "" : "s") + " needed";
    return "Ready to unlock!";
  }

  grid.innerHTML = "";
  worldOrder.forEach(function (world) {
    const unlocked = isUnlocked(world.key);
    const progress = worldProgress(world.key, world.lessons);
    const card = document.createElement("article");
    card.className = "world-card " + world.cardClass + (unlocked ? "" : " locked");
    card.innerHTML =
      '<span class="world-icon world-photo"><img src="' + world.iconImage.src + '" alt="' + world.iconImage.alt + '"></span>' +
      '<span class="world-title">' + world.title + "</span>" +
      '<span class="world-text">' + world.subtitle + "</span>" +
      '<span class="world-text">' + (progress.completed > 0 ? "Continue Learning" : "Start Adventure") + "</span>" +
      (!unlocked ? '<span class="world-text world-lock-note">' + unlockHint(world.key) + "</span>" : "") +
      '<div class="hero-actions">' +
      '<button class="button ' + (unlocked ? "primary" : "ghost") + '" type="button">' + (unlocked ? (progress.completed > 0 ? "Continue Learning" : "Let\'s Explore!") : "Locked") + "</button>" +
      "</div>";
    const actionButton = card.querySelector("button");
    actionButton.disabled = !unlocked;
    actionButton.addEventListener("click", function () {
      localStorage.setItem(LAST_WORLD_KEY, world.key);
      window.location.href = world.link;
    });
    grid.appendChild(card);
    animate(card, { opacity: [0, 1], transform: ["translateY(18px)", "translateY(0px)"] }, { duration: 0.45, easing: "ease-out", delay: worldOrder.indexOf(world) * 0.05 });
  });

  if (status) {
    status.textContent = "World progress is saved locally on this device.";
  }
})();
