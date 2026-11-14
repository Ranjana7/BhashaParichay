(function initLanguageChooser() {
  const medalsHost = document.getElementById("languageMedals");
  if (!medalsHost) return;

  const speech = document.getElementById("languageChooserSpeech");
  const mithu = document.getElementById("languageHeroMithu");
  const languageCards = Array.prototype.slice.call(document.querySelectorAll(".language-card[data-language]"));
  const prefersReducedMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const motionApi = window.Motion || {};
  const motionAnimate = typeof motionApi.animate === "function" ? motionApi.animate : null;
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

  function safeAnimate(element, keyframes, options) {
    if (!motionAnimate || !element || prefersReducedMotion) return;
    try {
      motionAnimate(element, keyframes, options || {});
    } catch (_error) {
      return;
    }
  }

  function animateLanguageCards() {
    languageCards.forEach(function (card, index) {
      safeAnimate(
        card,
        { opacity: [0, 1], transform: ["translateY(14px) scale(0.97)", "translateY(0px) scale(1)"] },
        { duration: 0.55, delay: index * 0.09, easing: "ease-out" }
      );

      const portal = card.querySelector(".language-portal");
      const portalRing = card.querySelector(".portal-ring");
      const portalCore = card.querySelector(".portal-core");
      const portalWord = card.querySelector(".portal-word");

      safeAnimate(
        portal,
        { transform: ["translateY(0px)", "translateY(-3px)", "translateY(0px)"] },
        { duration: 3 + index * 0.5, repeat: Infinity, easing: "ease-in-out" }
      );
      safeAnimate(
        portalRing,
        { rotate: [0, 0.9, 0, -0.9, 0] },
        { duration: 4.2 + index * 0.4, repeat: Infinity, easing: "ease-in-out" }
      );
      safeAnimate(
        portalCore,
        { translateY: [0, -3, 0], rotate: [0, 1, 0, -1, 0] },
        { duration: 3.1 + index * 0.35, repeat: Infinity, easing: "ease-in-out" }
      );
      safeAnimate(
        portalWord,
        { opacity: [0.88, 1, 0.88], translateY: [0, -1.5, 0] },
        { duration: 2.6 + index * 0.2, repeat: Infinity, easing: "ease-in-out" }
      );

      card.addEventListener("pointerenter", function () {
        safeAnimate(card, { transform: ["translateY(0px)", "translateY(-4px)"] }, { duration: 0.18, easing: "ease-out" });
      });
      card.addEventListener("pointerleave", function () {
        safeAnimate(card, { transform: ["translateY(-4px)", "translateY(0px)"] }, { duration: 0.2, easing: "ease-out" });
      });
    });
  }

  function setupLanguageLocks() {
    languageCards.forEach(function (card) {
      const languageKey = String(card.getAttribute("data-language") || "").toLowerCase();
      if (!languageKey) return;
      if (!card.hasAttribute("data-original-href")) {
        card.setAttribute("data-original-href", card.getAttribute("href") || "");
      }
      const originalHref = card.getAttribute("data-original-href") || "";
      const forceEnabled = languageKey === "sanskrit";
      const forceLocked = languageKey === "spanish" || languageKey === "portuguese";
      const availability = typeof window.spGetLanguageAvailability === "function"
        ? window.spGetLanguageAvailability(languageKey)
        : { enabled: true, comingSoon: false };
      const isEnabled = forceEnabled ? true : (availability.enabled && !forceLocked);
      const note = card.querySelector(".world-text");
      const lockBadge = card.querySelector(".language-lock-badge") || document.createElement("span");
      lockBadge.className = "language-lock-badge";
      lockBadge.textContent = "🔒 Coming Soon";
      if (!lockBadge.parentElement) card.appendChild(lockBadge);
      if (isEnabled) {
        card.classList.remove("is-language-locked");
        card.removeAttribute("aria-disabled");
        card.removeAttribute("title");
        card.setAttribute("href", originalHref);
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

  const medals = [
    {
      id: "akshara-ace",
      family: "sanskrit",
      title: "Akshara Ace",
      description: "Complete Sanskrit Level 1 (Alphabet Forest).",
      art: "🪔",
      earned: isSanskritAlphabetComplete(sanskritSnapshot)
    }
  ];

  const upcomingMedalNote = {
    id: "language-medals-coming-soon",
    family: "comingsoon",
    title: "More medals coming soon",
    description: "Spanish and Portuguese medals will unlock when those adventures open.",
    art: "🔜",
    earned: false,
    isComingSoon: true
  };

  medalsHost.innerHTML = "";
  medals.concat(upcomingMedalNote).forEach(function (medal) {
    const card = document.createElement("article");
    card.className = "medal-card medal-" + medal.family + (medal.earned ? " earned" : " pending") + (medal.isComingSoon ? " coming-soon" : "");
    card.setAttribute("data-medal-id", medal.id);
    card.innerHTML =
      '<div class="medal-art" aria-hidden="true">' + medal.art + "</div>" +
      '<h3 class="medal-title">' + medal.title + "</h3>" +
      "<p>" + medal.description + "</p>";
    medalsHost.appendChild(card);
  });

  const medalCards = Array.prototype.slice.call(medalsHost.querySelectorAll(".medal-card"));
  medalCards.forEach(function (card, index) {
    safeAnimate(
      card,
      { opacity: [0, 1], transform: ["translateY(16px) scale(0.96)", "translateY(0px) scale(1)"] },
      { duration: 0.56, delay: index * 0.1, easing: "ease-out" }
    );
    const art = card.querySelector(".medal-art");
    if (!card.classList.contains("coming-soon")) {
      safeAnimate(art, { rotate: [0, 5, 0, -5, 0] }, { duration: 2.9 + index * 0.3, repeat: Infinity, easing: "ease-in-out" });
    }
    card.addEventListener("pointerenter", function () {
      safeAnimate(card, { transform: ["translateY(0px) scale(1)", "translateY(-5px) scale(1.02)"] }, { duration: 0.2, easing: "ease-out" });
      safeAnimate(art, { transform: ["scale(1)", "scale(1.08) rotate(4deg)"] }, { duration: 0.2, easing: "ease-out" });
    });
    card.addEventListener("pointerleave", function () {
      safeAnimate(card, { transform: ["translateY(-5px) scale(1.02)", "translateY(0px) scale(1)"] }, { duration: 0.2, easing: "ease-out" });
      safeAnimate(art, { transform: ["scale(1.08) rotate(4deg)", "scale(1) rotate(0deg)"] }, { duration: 0.2, easing: "ease-out" });
    });
  });

  animateLanguageCards();

  const earnedIds = medals.filter(function (medal) { return medal.earned; }).map(function (medal) { return medal.id; });
  const seenIds = readSeenMedals();
  const seenSet = new Set(seenIds);
  const newlyEarned = earnedIds.filter(function (id) { return !seenSet.has(id); });
  writeSeenMedals(earnedIds);

  if (!newlyEarned.length) return;
  newlyEarned.forEach(function (id) {
    const card = medalsHost.querySelector('[data-medal-id="' + id + '"]');
    if (!card) return;
    card.classList.add("unlocking");
    const art = card.querySelector(".medal-art");
    safeAnimate(card, { transform: ["scale(1)", "scale(1.06)", "scale(1)"] }, { duration: 0.7, easing: "ease-out" });
    safeAnimate(art, { rotate: [0, -12, 12, -8, 0], scale: [1, 1.12, 1] }, { duration: 0.8, easing: "ease-out" });
    if (!prefersReducedMotion && typeof window.confetti === "function") {
      const rect = card.getBoundingClientRect();
      window.confetti({
        particleCount: 36,
        spread: 62,
        scalar: 0.75,
        origin: {
          x: (rect.left + rect.width / 2) / window.innerWidth,
          y: (rect.top + rect.height / 2) / window.innerHeight
        }
      });
    }
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
