(function initMyProgress() {
  const LAST_WORLD_KEY = "sanskritParichay.lastWorld";
  const worldList = document.getElementById("progressWorldList");
  if (!worldList) return;

  const worldMeta = [
    { key: "alphabet", title: "Alphabet Forest", total: 9, link: "alphabet-forest.html" },
    { key: "words", title: "Word Wonderland", total: 3, link: "learning-world.html?world=words" },
    { key: "animals", title: "Animal Jungle", total: 3, link: "learning-world.html?world=animals" },
    { key: "numbers", title: "Number Galaxy", total: 3, link: "learning-world.html?world=numbers" },
    { key: "colours", title: "Colour Kingdom", total: 3, link: "learning-world.html?world=colours" },
    { key: "sentences", title: "Sentence Castle", total: 3, link: "learning-world.html?world=sentences" },
    { key: "stories", title: "Story Island", total: 3, link: "learning-world.html?world=stories" },
    { key: "culture", title: "Sanskrit and Culture", total: 3, link: "learning-world.html?world=culture" }
  ];
  const worldOrder = worldMeta.map(function (world) { return world.key; });
  const worldTotals = Object.fromEntries(worldMeta.map(function (world) { return [world.key, world.total]; }));

  if (typeof window.spSyncProgressModel === "function") {
    window.spSyncProgressModel(worldOrder, worldTotals);
  }
  const snapshot = typeof window.spGetProgressSnapshot === "function"
    ? window.spGetProgressSnapshot(worldOrder, worldTotals)
    : {
        currentWorld: "alphabet",
        alphabet: { learningCompletedCount: 0, practiceCompletedCount: 0, unlocked: false },
        worlds: {},
        totals: {
          worldsExplored: 1,
          learningActivitiesCompleted: 0,
          practiceActivitiesCompleted: 0,
          stars: 0
        }
      };

  const starsNode = document.getElementById("progressStars");
  const worldsExploredNode = document.getElementById("progressWorldsExplored");
  const learningActivitiesNode = document.getElementById("progressLearningActivities");
  const practiceActivitiesNode = document.getElementById("progressPracticeActivities");
  const currentWorldNode = document.getElementById("progressCurrentWorld");
  const forestLearningSummary = document.getElementById("forestLearningSummary");
  const forestPracticeSummary = document.getElementById("forestPracticeSummary");
  const forestLearningFill = document.getElementById("forestLearningFill");
  const forestPracticeFill = document.getElementById("forestPracticeFill");

  if (starsNode) starsNode.textContent = String(snapshot.totals.stars || 0);
  if (worldsExploredNode) worldsExploredNode.textContent = String(snapshot.totals.worldsExplored || 0);
  if (learningActivitiesNode) learningActivitiesNode.textContent = String(snapshot.totals.learningActivitiesCompleted || 0);
  if (practiceActivitiesNode) practiceActivitiesNode.textContent = String(snapshot.totals.practiceActivitiesCompleted || 0);
  if (currentWorldNode) {
    const active = worldMeta.find(function (world) { return world.key === snapshot.currentWorld; }) || worldMeta[0];
    currentWorldNode.textContent = active.title;
  }

  const learningCount = Number(snapshot.alphabet.learningCompletedCount || 0);
  const practiceCount = Number(snapshot.alphabet.practiceCompletedCount || 0);
  if (forestLearningSummary) forestLearningSummary.textContent = learningCount + " of 2 completed";
  if (forestPracticeSummary) forestPracticeSummary.textContent = practiceCount + " of 7 completed";
  if (forestLearningFill) forestLearningFill.style.width = ((learningCount / 2) * 100).toFixed(1) + "%";
  if (forestPracticeFill) forestPracticeFill.style.width = ((practiceCount / 7) * 100).toFixed(1) + "%";

  worldList.innerHTML = "";
  worldMeta.forEach(function (world) {
    const row = document.createElement("button");
    row.type = "button";
    const unlocked = typeof window.spIsWorldUnlocked === "function" ? window.spIsWorldUnlocked(world.key, worldOrder) : true;
    row.className = "path-node " + (unlocked ? "unlocked" : "locked");
    let completed = 0;
    if (world.key === "alphabet") {
      completed = Math.max(0, Math.min(world.total, learningCount + practiceCount));
    } else if (snapshot.worlds[world.key]) {
      completed = snapshot.worlds[world.key].completedLessonsCount;
    }

    if (completed >= world.total) {
      row.classList.remove("unlocked");
      row.classList.add("completed");
    }

    row.innerHTML =
      '<span class="path-title">' + world.title + "</span>" +
      '<span class="path-state">' + (unlocked ? "Completed lessons: " + Math.min(world.total, completed) + "/" + world.total : "Locked") + "</span>";
    row.addEventListener("click", function () {
      if (!unlocked) return;
      localStorage.setItem(LAST_WORLD_KEY, world.key);
      window.location.href = world.link;
    });
    worldList.appendChild(row);
  });

  const continueBtn = document.getElementById("continueLearningBtn");
  if (continueBtn) {
    continueBtn.addEventListener("click", function () {
      const last = localStorage.getItem(LAST_WORLD_KEY) || snapshot.currentWorld || "alphabet";
      const selected = worldMeta.find(function (world) { return world.key === last; }) || worldMeta[0];
      window.location.href = selected.link;
    });
  }
})();
