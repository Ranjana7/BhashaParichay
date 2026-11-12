(function initLanguageChooser() {
  const medalsHost = document.getElementById("languageMedals");
  if (!medalsHost) return;

  const sanskritOrder = ["alphabet", "animals", "numbers", "colours", "words", "sentences", "stories", "culture"];
  const sanskritTotals = {
    alphabet: 9,
    animals: 3,
    numbers: 3,
    colours: 3,
    words: 3,
    sentences: 3,
    stories: 3,
    culture: 3
  };

  function getSanskritLevelOneComplete() {
    if (!window.SPProgressStore || typeof window.SPProgressStore.getProgressSnapshot !== "function") return false;
    const snapshot = window.SPProgressStore.getProgressSnapshot(sanskritOrder, sanskritTotals);
    const activities = snapshot && snapshot.alphabet && Array.isArray(snapshot.alphabet.activities)
      ? snapshot.alphabet.activities
      : [];
    return activities.length > 0 && activities.every(function (activity) { return Boolean(activity && activity.isComplete); });
  }

  function getLanguageLevelOneComplete(languageConfig) {
    if (!languageConfig || !Array.isArray(languageConfig.worlds) || !languageConfig.worlds.length) return false;
    const levelOneKey = languageConfig.levelOneWorld || languageConfig.worlds[0].key;
    const levelOne = languageConfig.worlds.find(function (world) { return world.key === levelOneKey; });
    if (!levelOne) return false;
    const key = languageConfig.storagePrefix + ".world." + levelOne.key + ".progress";
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return false;
      const progress = JSON.parse(raw);
      return Array.isArray(progress.completedLessons) && progress.completedLessons.length >= levelOne.lessons.length;
    } catch (_error) {
      return false;
    }
  }

  const langData = window.BHASHA_LANGUAGES || {};
  const spanish = langData.spanish || null;
  const portuguese = langData.portuguese || null;

  const medals = [
    {
      id: "sanskrit-level-1",
      title: "Sanskrit Level 1 Complete",
      description: "Complete all Alphabet Forest activities.",
      earned: getSanskritLevelOneComplete()
    },
    {
      id: "spanish-level-1",
      title: "Spanish Level 1 Complete",
      description: "Complete Greeting Garden in SpanishParichay.",
      earned: getLanguageLevelOneComplete(spanish)
    },
    {
      id: "portuguese-level-1",
      title: "Portuguese Level 1 Complete",
      description: "Complete Greeting Grove in PortugueseParichay.",
      earned: getLanguageLevelOneComplete(portuguese)
    }
  ];

  medalsHost.innerHTML = "";
  medals.forEach(function (medal) {
    const card = document.createElement("article");
    card.className = "medal-card" + (medal.earned ? " earned" : " pending");
    card.innerHTML =
      '<p class="medal-icon" aria-hidden="true">' + (medal.earned ? "🏅" : "⚪") + "</p>" +
      '<h3>' + medal.title + "</h3>" +
      '<p>' + medal.description + "</p>";
    medalsHost.appendChild(card);
  });
})();
