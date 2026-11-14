(function initShlokaGarden() {
  const btn = document.getElementById("challengeBtn");
  const panel = document.getElementById("previewPanel");
  if (!btn || !panel) return;

  const STORAGE_PREFIX = window.SP_STORAGE_PREFIX || "sanskritParichay";
  const SHLOKA_KEY = STORAGE_PREFIX + ".shlokaGarden.progress";
  const SHLOKA_REWARD_KEY = STORAGE_PREFIX + ".shlokaGarden.dailyReward";
  const motion = window.Motion || {};
  const animate = motion.animate || function () {};
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

  const ui = {
    title: document.getElementById("previewTitle"),
    text: document.getElementById("previewText"),
    meta: document.getElementById("challengeMeta"),
    progressFill: document.getElementById("challengeProgressFill"),
    progressText: document.getElementById("challengeProgressText"),
    choices: document.getElementById("previewChoices"),
    status: document.getElementById("previewStatus"),
    actionBtn: document.getElementById("challengeActionBtn"),
    subtitle: document.getElementById("challengeSubtitle"),
    mascot: document.getElementById("mascot"),
    mascotSpeech: document.getElementById("mascotSpeech"),
    gems: document.getElementById("homeGems")
  };

  const shloka = {
    id: "sahana-vavatu",
    title: "Sahana Vavatu",
    pronunciationVideo: "../assets/media/shlokas/sahana-vavatu-pronunciation.mp4",
    meaningVideo: "../assets/media/shlokas/sahana-vavatu-meaning.mp4",
    sceneImages: [
      "../assets/illustrations/shloka/sahana-scene-1.png",
      "../assets/illustrations/shloka/sahana-scene-2.png",
      "../assets/illustrations/shloka/sahana-scene-3.png",
      "../assets/illustrations/shloka/sahana-scene-4.png"
    ],
    lines: [
      { sanskrit: "सह नाववतु ।", transliteration: "Saha navavatu", meaning: "May we be protected together." },
      { sanskrit: "सह नौ भुनक्तु ।", transliteration: "Saha nau bhunaktu", meaning: "May we be nourished together." },
      { sanskrit: "सह वीर्यं करवावहै ।", transliteration: "Saha viryam karavavahai", meaning: "May we work with great energy together." },
      { sanskrit: "तेजस्विनावधीतमस्तु मा विद्विषावहै ।", transliteration: "Tejasvinavadhitamastu ma vidvishavahai", meaning: "May our learning shine; may we never dislike one another." },
      { sanskrit: "ॐ शान्तिः शान्तिः शान्तिः ॥", transliteration: "Om shantih shantih shantih", meaning: "Om, peace, peace, peace." }
    ],
    cues: [
      { start: 0, end: 6.5, lineIndex: 0 },
      { start: 6.5, end: 12.5, lineIndex: 1 },
      { start: 12.5, end: 18.5, lineIndex: 2 },
      { start: 18.5, end: 25.5, lineIndex: 3 },
      { start: 25.5, end: 28.2, lineIndex: 4 }
    ]
  };

  const state = loadState();
  const runtime = {
    video: null,
    subtitleLine: null,
    subtitleTranslit: null,
    subtitleMeaning: null,
    sceneNodes: [],
    currentCueIndex: -1,
    guidedMode: false,
    guidedPauseUntil: 0,
    repeatTarget: 5,
    repeatCount: 0,
    recognition: null,
    recitationText: "",
    reciteStatus: null,
    reciteStartBtn: null,
    reciteStopBtn: null
  };

  function londonDateKey() {
    const parts = new Intl.DateTimeFormat("en-GB", {
      timeZone: "Europe/London",
      year: "numeric",
      month: "2-digit",
      day: "2-digit"
    }).formatToParts(new Date());
    const get = function (type) {
      return (parts.find(function (p) { return p.type === type; }) || {}).value || "";
    };
    return get("year") + "-" + get("month") + "-" + get("day");
  }

  function loadState() {
    const base = {
      watched: false,
      practicedLines: {},
      recited: false,
      completed: [],
      lastRewardDate: ""
    };
    try {
      const parsed = JSON.parse(localStorage.getItem(SHLOKA_KEY) || "{}");
      const reward = JSON.parse(localStorage.getItem(SHLOKA_REWARD_KEY) || "{}");
      base.watched = Boolean(parsed.watched);
      base.practicedLines = parsed.practicedLines && typeof parsed.practicedLines === "object" ? parsed.practicedLines : {};
      base.recited = Boolean(parsed.recited);
      base.completed = Array.isArray(parsed.completed) ? parsed.completed : [];
      base.lastRewardDate = typeof reward.date === "string" ? reward.date : "";
      return base;
    } catch (_error) {
      return base;
    }
  }

  function saveState() {
    localStorage.setItem(SHLOKA_KEY, JSON.stringify({
      watched: state.watched,
      practicedLines: state.practicedLines,
      recited: state.recited,
      completed: state.completed
    }));
    localStorage.setItem(SHLOKA_REWARD_KEY, JSON.stringify({ date: state.lastRewardDate }));
  }

  function setMascotSpeech(text) {
    if (ui.mascotSpeech) ui.mascotSpeech.textContent = text;
  }

  function danceMithu() {
    if (!ui.mascot) return;
    animate(ui.mascot, {
      transform: [
        "translateY(0px) rotate(0deg)",
        "translateY(-9px) rotate(6deg)",
        "translateY(0px) rotate(-6deg)",
        "translateY(0px) rotate(0deg)"
      ]
    }, { duration: 1.2, easing: "ease-in-out" });
  }

  function launchCelebration() {
    danceMithu();
    if (typeof window.spFlowerRain === "function") {
      window.spFlowerRain(panel, { density: 28, durationMs: 2800 });
    }
    if (window.confetti) {
      window.confetti({
        particleCount: 90,
        spread: 68,
        startVelocity: 26,
        ticks: 105,
        origin: { y: 0.68 },
        colors: ["#ffd166", "#ff8fab", "#73d2de", "#95d95e"]
      });
    }
  }

  function isCompleted() {
    return state.completed.indexOf(shloka.id) !== -1;
  }

  function computeProgress() {
    let score = 0;
    if (state.watched) score += 1;
    const lineCount = shloka.lines.length;
    const practicedCount = shloka.lines.reduce(function (acc, _line, index) {
      return acc + (state.practicedLines[index] ? 1 : 0);
    }, 0);
    score += practicedCount / lineCount;
    if (state.recited) score += 1;
    if (isCompleted()) score += 1;
    const percent = Math.round((score / 4) * 100);
    return Math.max(0, Math.min(100, percent));
  }

  function renderProgress() {
    const percent = computeProgress();
    if (ui.progressFill) ui.progressFill.style.width = percent + "%";
    if (ui.progressText) {
      ui.progressText.textContent = isCompleted()
        ? "Practice progress: Complete 🌸"
        : "Practice progress: " + percent + "%";
    }
  }

  function resolvePath(path) {
    if (typeof window.spResolveAssetPath === "function") return window.spResolveAssetPath(path);
    return path;
  }

  function markLinePracticed(index) {
    state.practicedLines[index] = true;
    saveState();
    renderProgress();
  }

  function setSubtitleFromCue(timeSec) {
    const cueIndex = shloka.cues.findIndex(function (cue) {
      return timeSec >= cue.start && timeSec < cue.end;
    });
    if (cueIndex === -1) return;
    if (runtime.currentCueIndex !== cueIndex) {
      runtime.currentCueIndex = cueIndex;
      const cue = shloka.cues[cueIndex];
      const line = shloka.lines[cue.lineIndex];
      if (runtime.subtitleLine) runtime.subtitleLine.textContent = line.sanskrit;
      if (runtime.subtitleTranslit) runtime.subtitleTranslit.textContent = line.transliteration;
      if (runtime.subtitleMeaning) runtime.subtitleMeaning.textContent = line.meaning;
      highlightScene(cue.lineIndex);
      markLinePracticed(cue.lineIndex);
      if (runtime.guidedMode) {
        const remaining = cue.end - timeSec;
        if (remaining < 0.18) {
          runtime.video.pause();
          runtime.guidedPauseUntil = Date.now() + 1600;
          if (ui.status) ui.status.textContent = "Now repeat this line aloud with Mithu.";
          window.setTimeout(function () {
            if (runtime.video && runtime.guidedMode && Date.now() >= runtime.guidedPauseUntil) {
              runtime.video.play().catch(function () {});
            }
          }, 1650);
        }
      }
    }
  }

  function highlightScene(lineIndex) {
    if (!runtime.sceneNodes.length) return;
    const sceneIndex = Math.min(3, Math.max(0, lineIndex % 4));
    runtime.sceneNodes.forEach(function (node, index) {
      node.classList.toggle("active", index === sceneIndex);
    });
  }

  function updateGemCounter() {
    if (!ui.gems || typeof window.spGetRewards !== "function") return;
    const pathOrder = Array.isArray(window.SP_WORLD_ORDER) && window.SP_WORLD_ORDER.length
      ? window.SP_WORLD_ORDER
      : ["alphabet", "animals", "numbers", "colours", "words", "sentences", "stories", "culture"];
    const totals = window.SP_WORLD_TOTALS || {
      alphabet: 9, animals: 3, numbers: 3, colours: 3, words: 3, sentences: 3, stories: 3, culture: 3
    };
    const rewards = window.spGetRewards(pathOrder, totals);
    ui.gems.textContent = String(Number(rewards.gems || 0));
  }

  function rewardOncePerDay() {
    const today = londonDateKey();
    if (state.lastRewardDate === today) return false;
    if (window.SPProgressStore && typeof window.SPProgressStore.awardDailyChallengeGems === "function") {
      window.SPProgressStore.awardDailyChallengeGems(today);
    }
    state.lastRewardDate = today;
    saveState();
    updateGemCounter();
    return true;
  }

  function completePractice() {
    if (!isCompleted()) state.completed.push(shloka.id);
    const rewarded = rewardOncePerDay();
    saveState();
    renderProgress();
    panel.classList.remove("wrong");
    panel.classList.add("correct");
    const rewardText = rewarded ? " You also earned 2 Gems for today." : "";
    if (ui.status) ui.status.textContent = "🌸 Shloka complete! Replay anytime and keep shining." + rewardText;
    setMascotSpeech("Wonderful! You completed Sahana Vavatu. I am so proud of you!");
    launchCelebration();
  }

  function stopRecitation() {
    if (runtime.recognition) {
      runtime.recognition.onresult = null;
      runtime.recognition.onend = null;
      runtime.recognition.onerror = null;
      runtime.recognition.stop();
      runtime.recognition = null;
    }
    if (runtime.reciteStartBtn) runtime.reciteStartBtn.disabled = false;
    if (runtime.reciteStopBtn) runtime.reciteStopBtn.hidden = true;
  }

  function evaluateRecitation(recitedText) {
    const text = (recitedText || "").toLowerCase();
    const hints = ["saha", "navavatu", "bhunaktu", "karavavahai", "tejasvi", "vidvishavahai", "shantih"];
    const matches = hints.reduce(function (acc, token) {
      return acc + (text.indexOf(token) !== -1 ? 1 : 0);
    }, 0);
    state.recited = true;
    saveState();
    renderProgress();
    if (matches >= 3) {
      return "Wonderful! You remembered so much!";
    }
    if (text.length >= 6) {
      return "Great effort! Let's practise that line again!";
    }
    return "Lovely try! Listen once more and recite with Mithu again.";
  }

  async function startRecitation() {
    panel.classList.remove("wrong");
    if (ui.status) ui.status.textContent = "";
    runtime.recitationText = "";
    if (runtime.reciteStartBtn) runtime.reciteStartBtn.disabled = true;
    if (runtime.reciteStopBtn) runtime.reciteStopBtn.hidden = false;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(function (track) { track.stop(); });
    } catch (_error) {
      if (ui.status) ui.status.textContent = "Microphone permission is needed for recitation practice.";
      stopRecitation();
      return;
    }

    if (!SpeechRecognition) {
      if (ui.status) {
        ui.status.textContent = "Recitation mode is available, but automatic Sanskrit recognition is limited on this browser. Please listen and repeat with Mithu.";
      }
      setMascotSpeech("I heard your effort! Let's keep practising together.");
      state.recited = true;
      saveState();
      renderProgress();
      stopRecitation();
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = "sa-IN";
    recognition.interimResults = true;
    recognition.continuous = true;
    runtime.recognition = recognition;

    recognition.onresult = function (event) {
      let combined = "";
      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        combined += event.results[i][0].transcript + " ";
      }
      runtime.recitationText = (runtime.recitationText + " " + combined).trim();
      if (runtime.reciteStatus) runtime.reciteStatus.textContent = runtime.recitationText.slice(-160);
    };

    recognition.onerror = function () {
      if (ui.status) ui.status.textContent = "Great effort! Let's practise that line again!";
    };

    recognition.onend = function () {
      const feedback = evaluateRecitation(runtime.recitationText);
      if (ui.status) ui.status.textContent = feedback + " (Practice mode only: recognition may miss Sanskrit sounds.)";
      setMascotSpeech(feedback);
      stopRecitation();
    };

    recognition.start();
    if (ui.status) ui.status.textContent = "Listening... recite the full shloka, then tap Stop.";
  }

  function setVideoSource(sourcePath) {
    if (!runtime.video) return;
    const resolved = resolvePath(sourcePath);
    if (runtime.video.getAttribute("src") !== resolved) {
      runtime.video.setAttribute("src", resolved);
      runtime.video.load();
    }
  }

  function startGuidedJourney() {
    setVideoSource(shloka.pronunciationVideo);
    runtime.repeatCount = 0;
    runtime.guidedMode = true;
    runtime.currentCueIndex = -1;
    state.watched = true;
    saveState();
    renderProgress();
    if (ui.status) ui.status.textContent = "Watch, listen, repeat each line, then enjoy full recitation repeats.";
    setMascotSpeech("Tap each line, listen carefully, and repeat with joy!");
    runtime.video.currentTime = 0;
    runtime.video.play().catch(function () {});
  }

  function playMeaningVideo() {
    setVideoSource(shloka.meaningVideo);
    runtime.guidedMode = false;
    runtime.currentCueIndex = -1;
    if (runtime.subtitleLine) runtime.subtitleLine.textContent = "Meaning video";
    if (runtime.subtitleTranslit) runtime.subtitleTranslit.textContent = "Sahana Vavatu";
    if (runtime.subtitleMeaning) runtime.subtitleMeaning.textContent = "Watch the meaning reference from your provided source.";
    if (ui.status) ui.status.textContent = "Meaning reference video playing.";
    runtime.video.currentTime = 0;
    runtime.video.play().catch(function () {});
  }

  function bindVideo(videoEl) {
    runtime.video = videoEl;
    videoEl.addEventListener("timeupdate", function () {
      if (videoEl.getAttribute("src") && videoEl.getAttribute("src").indexOf("sahana-vavatu-pronunciation") !== -1) {
        setSubtitleFromCue(videoEl.currentTime);
      }
    });
    videoEl.addEventListener("ended", function () {
      if (!runtime.guidedMode) return;
      runtime.repeatCount += 1;
      if (runtime.repeatCount < runtime.repeatTarget) {
        runtime.currentCueIndex = -1;
        runtime.video.currentTime = 0;
        if (ui.status) {
          ui.status.textContent = "Beautiful! Full recitation repeat " + runtime.repeatCount + "/" + runtime.repeatTarget + ".";
        }
        runtime.video.play().catch(function () {});
      } else {
        runtime.guidedMode = false;
        if (ui.status) ui.status.textContent = "Great practice! Now try 🎤 Recite with Mithu.";
      }
    });
  }

  function scrollIntoView() {
    const header = document.querySelector(".site-header");
    const headerHeight = header ? Math.ceil(header.getBoundingClientRect().height) : 82;
    panel.style.scrollMarginTop = headerHeight + 10 + "px";
    panel.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function renderGarden() {
    panel.classList.remove("wrong");
    ui.title.textContent = "Shloka Garden · " + shloka.title;
    ui.text.textContent = "Watch, listen, repeat, understand meaning, and practise full recitation with Mithu.";
    ui.meta.textContent = "Sources: pronunciation video, meaning video, and scene artwork from your /mantras folder. Voice is never uploaded or stored.";
    if (ui.subtitle) ui.subtitle.textContent = "Learn one shloka with video, meaning, and joyful recitation practice.";
    if (ui.actionBtn) ui.actionBtn.style.display = "none";

    ui.choices.innerHTML = [
      '<div class="shloka-garden">',
      '  <div class="shloka-video-wrap">',
      '    <video id="shlokaVideo" class="shloka-video" playsinline controls preload="metadata"></video>',
      '    <div class="shloka-subtitle">',
      '      <p id="shlokaSubtitleLine" class="line"></p>',
      '      <p id="shlokaSubtitleTranslit" class="translit"></p>',
      '      <p id="shlokaSubtitleMeaning" class="meaning"></p>',
      '    </div>',
      '  </div>',
      '  <div class="shloka-scenes" id="shlokaScenes"></div>',
      '  <div class="shloka-actions">',
      '    <button type="button" class="button primary" id="startShlokaJourneyBtn">▶ Start Learning Journey (about 2½ min)</button>',
      '    <button type="button" class="button ghost" id="playMeaningVideoBtn">🎬 Watch Meaning Video</button>',
      '    <button type="button" class="button challenge" id="reciteWithMithuBtn">🎤 Recite with Mithu</button>',
      '    <button type="button" class="button ghost" id="stopReciteBtn" hidden>⏹ Stop Recitation</button>',
      '    <button type="button" class="button secondary" id="completeShlokaBtn">🌸 Mark Practice Complete</button>',
      '  </div>',
      '  <p class="footer-note recite-privacy-note">Practice mode note: automatic Sanskrit speech recognition may be limited by browser/device. Feedback is encouraging guidance, not strict scoring.</p>',
      '  <p id="reciteLiveText" class="footer-note" aria-live="polite"></p>',
      '  <div class="shloka-lines" id="shlokaLineCards"></div>',
      '</div>'
    ].join("");

    runtime.subtitleLine = document.getElementById("shlokaSubtitleLine");
    runtime.subtitleTranslit = document.getElementById("shlokaSubtitleTranslit");
    runtime.subtitleMeaning = document.getElementById("shlokaSubtitleMeaning");
    runtime.reciteStatus = document.getElementById("reciteLiveText");
    runtime.reciteStartBtn = document.getElementById("reciteWithMithuBtn");
    runtime.reciteStopBtn = document.getElementById("stopReciteBtn");
    runtime.currentCueIndex = -1;

    const scenesHost = document.getElementById("shlokaScenes");
    runtime.sceneNodes = [];
    shloka.sceneImages.forEach(function (scenePath, index) {
      const img = document.createElement("img");
      img.className = "shloka-scene" + (index === 0 ? " active" : "");
      img.alt = "Shloka scene " + (index + 1);
      img.src = resolvePath(scenePath);
      scenesHost.appendChild(img);
      runtime.sceneNodes.push(img);
    });

    const lineCards = document.getElementById("shlokaLineCards");
    shloka.lines.forEach(function (line, index) {
      const card = document.createElement("button");
      card.type = "button";
      card.className = "shloka-line-card";
      card.innerHTML = '<span class="sa">' + line.sanskrit + '</span><span class="tr">' + line.transliteration + "</span><span class=\"en\">" + line.meaning + "</span>";
      card.addEventListener("click", function (event) {
        event.stopPropagation();
        setVideoSource(shloka.pronunciationVideo);
        runtime.guidedMode = false;
        const cue = shloka.cues[index] || shloka.cues[0];
        runtime.video.currentTime = cue.start;
        runtime.video.play().catch(function () {});
        if (runtime.subtitleLine) runtime.subtitleLine.textContent = line.sanskrit;
        if (runtime.subtitleTranslit) runtime.subtitleTranslit.textContent = line.transliteration;
        if (runtime.subtitleMeaning) runtime.subtitleMeaning.textContent = line.meaning;
        if (ui.status) ui.status.textContent = "Line replay started. Repeat after the audio.";
        setMascotSpeech("Lovely! Repeat this line with me.");
        markLinePracticed(index);
        highlightScene(index);
      });
      lineCards.appendChild(card);
    });

    const video = document.getElementById("shlokaVideo");
    bindVideo(video);
    setVideoSource(shloka.pronunciationVideo);
    if (runtime.subtitleLine) runtime.subtitleLine.textContent = shloka.lines[0].sanskrit;
    if (runtime.subtitleTranslit) runtime.subtitleTranslit.textContent = shloka.lines[0].transliteration;
    if (runtime.subtitleMeaning) runtime.subtitleMeaning.textContent = shloka.lines[0].meaning;

    const startBtn = document.getElementById("startShlokaJourneyBtn");
    startBtn.addEventListener("click", function (event) {
      event.stopPropagation();
      startGuidedJourney();
    }, true);

    const meaningBtn = document.getElementById("playMeaningVideoBtn");
    meaningBtn.addEventListener("click", function (event) {
      event.stopPropagation();
      playMeaningVideo();
    }, true);

    runtime.reciteStartBtn.addEventListener("click", function (event) {
      event.stopPropagation();
      startRecitation();
    }, true);

    runtime.reciteStopBtn.addEventListener("click", function (event) {
      event.stopPropagation();
      stopRecitation();
      if (ui.status) ui.status.textContent = evaluateRecitation(runtime.recitationText) + " (Practice mode only.)";
    }, true);

    const completeBtn = document.getElementById("completeShlokaBtn");
    completeBtn.addEventListener("click", function (event) {
      event.stopPropagation();
      completePractice();
    }, true);

    if (isCompleted()) {
      if (ui.status) ui.status.textContent = "🌸 Completed earlier! You can replay and practise again anytime.";
      setMascotSpeech("Welcome back! Let's enjoy Sahana Vavatu once more.");
    } else {
      if (ui.status) ui.status.textContent = "Tap Start Learning Journey to begin line-by-line practice.";
      setMascotSpeech("Let's begin Shloka Garden with Sahana Vavatu!");
    }

    renderProgress();
  }

  btn.textContent = "Shloka Garden";
  btn.addEventListener("click", function (event) {
    event.preventDefault();
    event.stopImmediatePropagation();
    renderGarden();
    scrollIntoView();
  }, true);

  if (ui.actionBtn) {
    ui.actionBtn.addEventListener("click", function (event) {
      event.preventDefault();
      event.stopImmediatePropagation();
    }, true);
  }

  renderGarden();
})();
