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
      description: "Coming soon: medal will unlock when Spanish Level 1 exists.",
      earned: false
    },
    {
      id: "portuguese-level-1",
      title: "Portuguese Level 1 Complete",
      description: "Coming soon: medal will unlock when Portuguese Level 1 exists.",
      earned: false
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
