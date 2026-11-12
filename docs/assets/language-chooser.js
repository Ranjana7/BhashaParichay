(function initLanguageChooser() {
  const medalsHost = document.getElementById("languageMedals");
  if (!medalsHost) return;

  const speech = document.getElementById("languageChooserSpeech");
  const mithu = document.getElementById("languageHeroMithu");
  const prefersReducedMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const medalSeenKey = "bhashaParichay.medals.seen.v2";

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

  function getSanskritSnapshot() {
    if (!window.SPProgressStore || typeof window.SPProgressStore.getProgressSnapshot !== "function") return null;
    return window.SPProgressStore.getProgressSnapshot(sanskritOrder, sanskritTotals);
  }

  function isSanskritAlphabetComplete(snapshot) {
    const activities = snapshot && snapshot.alphabet && Array.isArray(snapshot.alphabet.activities)
      ? snapshot.alphabet.activities
      : [];
    return activities.length > 0 && activities.every(function (activity) { return Boolean(activity && activity.isComplete); });
  }

  function isSanskritWorldComplete(snapshot, worldKey) {
    if (!snapshot || !snapshot.worlds || !snapshot.worlds[worldKey]) return false;
    return Boolean(snapshot.worlds[worldKey].isComplete);
  }

  function isLanguageWorldComplete(languageConfig, worldIndex) {
    if (!languageConfig || !Array.isArray(languageConfig.worlds) || !languageConfig.worlds[worldIndex]) return false;
    const world = languageConfig.worlds[worldIndex];
    const key = languageConfig.storagePrefix + ".world." + world.key + ".progress";
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return false;
      const progress = JSON.parse(raw);
      return Array.isArray(progress.completedLessons) && progress.completedLessons.length >= world.lessons.length;
    } catch (_error) {
      return false;
    }
  }

  function readSeenMedals() {
    try {
      const raw = localStorage.getItem(medalSeenKey);
      const parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch (_error) {
      return [];
    }
  }

  function writeSeenMedals(ids) {
    localStorage.setItem(medalSeenKey, JSON.stringify(ids));
  }

  const sanskritSnapshot = getSanskritSnapshot();
  const langData = window.BHASHA_LANGUAGES || {};
  const spanish = langData.spanish || null;
  const portuguese = langData.portuguese || null;

  const medals = [
    {
      id: "sanskrit-star",
      family: "sanskrit",
      title: "Sanskrit Star",
      description: "Complete Alphabet Forest.",
      art: "🪔",
      earned: isSanskritAlphabetComplete(sanskritSnapshot)
    },
    {
      id: "akshara-ace",
      family: "sanskrit",
      title: "Akshara Ace",
      description: "Complete Animal Jungle.",
      art: "🐘",
      earned: isSanskritWorldComplete(sanskritSnapshot, "animals")
    },
    {
      id: "sanskrit-champ",
      family: "sanskrit",
      title: "Sanskrit Champ",
      description: "Complete Number Galaxy.",
      art: "🌟",
      earned: isSanskritWorldComplete(sanskritSnapshot, "numbers")
    },
    {
      id: "hola-hero",
      family: "spanish",
      title: "Hola Hero",
      description: "Complete Greeting Garden.",
      art: "🌞",
      earned: isLanguageWorldComplete(spanish, 0)
    },
    {
      id: "fiesta-star",
      family: "spanish",
      title: "Fiesta Star",
      description: "Complete Colour Carnival.",
      art: "🎉",
      earned: isLanguageWorldComplete(spanish, 1)
    },
    {
      id: "spanish-champ",
      family: "spanish",
      title: "Spanish Champ",
      description: "Complete Number Rocket.",
      art: "🚀",
      earned: isLanguageWorldComplete(spanish, 2)
    },
    {
      id: "ola-hero",
      family: "portuguese",
      title: "Olá Hero",
      description: "Complete Greeting Grove.",
      art: "🌊",
      earned: isLanguageWorldComplete(portuguese, 0)
    },
    {
      id: "palavra-star",
      family: "portuguese",
      title: "Palavra Star",
      description: "Complete Color Parade.",
      art: "💬",
      earned: isLanguageWorldComplete(portuguese, 1)
    },
    {
      id: "portuguese-champ",
      family: "portuguese",
      title: "Portuguese Champ",
      description: "Complete Number Ship.",
      art: "⛵",
      earned: isLanguageWorldComplete(portuguese, 2)
    }
  ];

  medalsHost.innerHTML = "";
  medals.forEach(function (medal) {
    const card = document.createElement("article");
    card.className = "medal-card medal-" + medal.family + (medal.earned ? " earned" : " pending");
    card.setAttribute("data-medal-id", medal.id);
    card.innerHTML =
      '<div class="medal-art" aria-hidden="true">' + medal.art + "</div>" +
      '<h3 class="medal-title">' + medal.title + "</h3>" +
      "<p>" + medal.description + "</p>";
    medalsHost.appendChild(card);
  });

  const earnedIds = medals.filter(function (medal) { return medal.earned; }).map(function (medal) { return medal.id; });
  const seenIds = readSeenMedals();
  const seenSet = new Set(seenIds);
  const newlyEarned = earnedIds.filter(function (id) { return !seenSet.has(id); });
  writeSeenMedals(earnedIds);

  if (!newlyEarned.length) return;
  newlyEarned.forEach(function (id) {
    const card = medalsHost.querySelector('[data-medal-id="' + id + '"]');
    if (card) card.classList.add("unlocking");
  });

  if (speech) {
    const medalNames = medals
      .filter(function (medal) { return newlyEarned.includes(medal.id); })
      .map(function (medal) { return medal.title; });
    speech.textContent = "Hooray! You unlocked " + medalNames.join(", ") + "!";
  }
  if (mithu) {
    mithu.classList.remove("state-idle");
    mithu.classList.add("state-dancing");
  }

  const msg = document.createElement("p");
  msg.className = "medal-celebration";
  msg.textContent = "Mithu: Dance time! Flowers and sparkles for your new medal!";
  medalsHost.parentElement.appendChild(msg);

  if (!prefersReducedMotion && window.confetti) {
    window.confetti({ particleCount: 65, spread: 74, startVelocity: 28, origin: { y: 0.7 } });
  }
})();
