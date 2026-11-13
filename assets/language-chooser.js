(function initLanguageChooser() {
  const medalsHost = document.getElementById("languageMedals");
  if (!medalsHost) return;

  const speech = document.getElementById("languageChooserSpeech");
  const mithu = document.getElementById("languageHeroMithu");
  const languageCards = Array.prototype.slice.call(document.querySelectorAll(".language-card[data-language]"));
  const prefersReducedMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const medalSeenKey = "bhashaParichay.medals.seen.v3";
  const lockedMessage = typeof window.spGetLockedLanguageMessage === "function"
    ? window.spGetLockedLanguageMessage()
    : "More magical adventures are coming soon!";

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

  function setupLanguageLocks() {
    languageCards.forEach(function (card) {
      const languageKey = String(card.getAttribute("data-language") || "").toLowerCase();
      if (!languageKey) return;
      const forceLocked = languageKey === "spanish" || languageKey === "portuguese";
      const availability = typeof window.spGetLanguageAvailability === "function"
        ? window.spGetLanguageAvailability(languageKey)
        : { enabled: true, comingSoon: false };
      const isEnabled = availability.enabled && !forceLocked;
      const note = card.querySelector(".world-text");
      const lockBadge = card.querySelector(".language-lock-badge") || document.createElement("span");
      lockBadge.className = "language-lock-badge";
      lockBadge.textContent = "🔒 Coming Soon";
      if (!lockBadge.parentElement) card.appendChild(lockBadge);
      if (isEnabled) {
        card.classList.remove("is-language-locked");
        card.removeAttribute("aria-disabled");
        card.removeAttribute("title");
        lockBadge.hidden = true;
        if (note) note.textContent = "Open " + card.querySelector(".world-title").textContent + "Parichay";
        return;
      }
      card.classList.add("is-language-locked");
      card.setAttribute("aria-disabled", "true");
      card.setAttribute("title", "Coming Soon");
      card.setAttribute("href", "#");
      lockBadge.hidden = false;
      if (note) note.textContent = "Coming Soon";
      card.addEventListener("keydown", function (event) {
        if (event.key !== "Enter" && event.key !== " ") return;
        event.preventDefault();
        if (speech) speech.textContent = lockedMessage;
      });
      card.addEventListener("click", function (event) {
        event.preventDefault();
        event.stopPropagation();
        if (speech) speech.textContent = lockedMessage;
        if (mithu) {
          mithu.classList.remove("state-idle", "state-dancing");
          mithu.classList.add("state-wave");
        }
      });
    });
  }

  setupLanguageLocks();
  try {
    const params = new URLSearchParams(window.location.search);
    const lockedLang = String(params.get("lockedLanguage") || "").toLowerCase();
    if (lockedLang) {
      const availability = typeof window.spGetLanguageAvailability === "function"
        ? window.spGetLanguageAvailability(lockedLang)
        : { enabled: true };
      if (!availability.enabled && speech) speech.textContent = lockedMessage;
    }
  } catch (_error) {
    // ignore malformed search params
  }

  const sanskritSnapshot = getSanskritSnapshot();
  const langData = window.BHASHA_LANGUAGES || {};
  const spanish = langData.spanish || null;
  const portuguese = langData.portuguese || null;

  const medals = [
    {
      id: "akshara-ace",
      family: "sanskrit",
      title: "Akshara Ace",
      description: "Complete Sanskrit Level 1 (Alphabet Forest).",
      art: "🪔",
      earned: isSanskritAlphabetComplete(sanskritSnapshot)
    },
    {
      id: "hola-hero",
      family: "spanish",
      title: "Hola Hero",
      description: "Complete Spanish Level 1.",
      art: "🌞",
      earned: isLanguageWorldComplete(spanish, 0)
    },
    {
      id: "ola-hero",
      family: "portuguese",
      title: "Olá Hero",
      description: "Complete Portuguese Level 1.",
      art: "🌊",
      earned: isLanguageWorldComplete(portuguese, 0)
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
