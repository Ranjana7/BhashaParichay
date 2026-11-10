(function initMyProgress() {
  const HOME_KEY = "sanskritParichay.home.progress";
  const LAST_WORLD_KEY = "sanskritParichay.lastWorld";
  const worldList = document.getElementById("progressWorldList");
  if (!worldList) return;

  const worldMeta = [
    { key: "alphabet", title: "Alphabet Forest", total: 6, link: "alphabet-forest.html" },
    { key: "words", title: "Word Wonderland", total: 3, link: "learning-world.html?world=words" },
    { key: "animals", title: "Animal Jungle", total: 3, link: "learning-world.html?world=animals" },
    { key: "numbers", title: "Number Galaxy", total: 3, link: "learning-world.html?world=numbers" },
    { key: "colours", title: "Colour Kingdom", total: 3, link: "learning-world.html?world=colours" },
    { key: "sentences", title: "Sentence Castle", total: 3, link: "learning-world.html?world=sentences" },
    { key: "stories", title: "Story Island", total: 3, link: "learning-world.html?world=stories" },
    { key: "culture", title: "Sanskrit and Culture", total: 3, link: "learning-world.html?world=culture" }
  ];

  function readJson(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (_error) {
      return fallback;
    }
  }

  const home = readJson(HOME_KEY, { xp: 0, completed: [] });
  const alphabetStatus = typeof window.spGetAlphabetUnlockStatus === "function"
    ? window.spGetAlphabetUnlockStatus()
    : { stars: 0, unlocked: false, learningCompletedCount: 0, practiceCompletedCount: 0 };
  const starsNode = document.getElementById("progressStars");
  const xpNode = document.getElementById("progressXp");
  if (starsNode) starsNode.textContent = String(Number(alphabetStatus.stars || 0));
  if (xpNode) xpNode.textContent = String(Number(home.xp || 0));

  function alphabetProgress() {
    if (alphabetStatus.unlocked) return 6;
    return Math.max(0, Math.min(5, alphabetStatus.learningCompletedCount + Math.min(2, alphabetStatus.practiceCompletedCount)));
  }

  worldList.innerHTML = "";
  worldMeta.forEach(function (world) {
    const row = document.createElement("button");
    row.type = "button";
    row.className = "path-node unlocked";
    let completed = 0;
    if (world.key === "alphabet") {
      completed = alphabetProgress();
    } else {
      const key = "sanskritParichay.world." + world.key + ".progress";
      const p = readJson(key, { completedLessons: [] });
      completed = Array.isArray(p.completedLessons) ? p.completedLessons.length : 0;
    }
    if (completed >= world.total) {
      row.classList.remove("unlocked");
      row.classList.add("completed");
    }
    row.innerHTML =
      '<span class="path-title">' + world.title + "</span>" +
      '<span class="path-state">Completed lessons: ' + Math.min(world.total, completed) + "/" + world.total + "</span>";
    row.addEventListener("click", function () {
      localStorage.setItem(LAST_WORLD_KEY, world.key);
      window.location.href = world.link;
    });
    worldList.appendChild(row);
  });

  const continueBtn = document.getElementById("continueLearningBtn");
  if (continueBtn) {
    continueBtn.addEventListener("click", function () {
      const last = localStorage.getItem(LAST_WORLD_KEY) || "alphabet";
      const selected = worldMeta.find(function (w) { return w.key === last; }) || worldMeta[0];
      window.location.href = selected.link;
    });
  }
})();
