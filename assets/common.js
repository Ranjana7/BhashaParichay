(function initCommon() {
  const MUTE_KEY = "sanskritParichay.muted";
  const toggle = document.getElementById("muteToggle");

  if (!window.SP_STATE) {
    window.SP_STATE = { muted: false };
  }

  const fromStorage = localStorage.getItem(MUTE_KEY);
  if (fromStorage === "true") {
    window.SP_STATE.muted = true;
  }

  function renderMute() {
    if (!toggle) return;
    if (window.SP_STATE.muted) {
      toggle.textContent = "🔇 Sound: Off";
      toggle.setAttribute("aria-pressed", "true");
    } else {
      toggle.textContent = "🔊 Sound: On";
      toggle.setAttribute("aria-pressed", "false");
    }
  }

  function hasSpeechSupport() {
    return "speechSynthesis" in window && "SpeechSynthesisUtterance" in window;
  }

  function getBestVoice(preferredLang) {
    if (!hasSpeechSupport()) return null;
    const voices = window.speechSynthesis.getVoices();
    if (!voices || voices.length === 0) return null;

    const normalized = (preferredLang || "").toLowerCase();
    const candidates = voices.filter(function (v) {
      return v.lang && v.lang.toLowerCase().startsWith(normalized);
    });
    if (candidates.length > 0) return candidates[0];

    const hiVoice = voices.find(function (v) {
      return v.lang && v.lang.toLowerCase().startsWith("hi");
    });
    if (hiVoice) return hiVoice;

    const enVoice = voices.find(function (v) {
      return v.lang && v.lang.toLowerCase().startsWith("en");
    });
    return enVoice || voices[0];
  }

  window.spSpeak = function spSpeak(text, lang, fallbackEl, transliteration) {
    if (window.SP_STATE.muted) {
      if (fallbackEl) fallbackEl.textContent = "Sound is muted. Tap Sound: Off to unmute.";
      return false;
    }

    if (!hasSpeechSupport()) {
      if (fallbackEl) fallbackEl.textContent = "Audio unavailable on this browser/device.";
      return false;
    }

    if (fallbackEl) fallbackEl.textContent = "";
    const bestVoice = getBestVoice(lang || "sa-IN");
    const speechText = bestVoice && bestVoice.lang && bestVoice.lang.toLowerCase().startsWith("en")
      ? (transliteration || text)
      : text;
    const utterance = new SpeechSynthesisUtterance(speechText);
    utterance.lang = (bestVoice && bestVoice.lang) || lang || "en-US";
    utterance.rate = 0.75;
    utterance.pitch = 1;
    if (bestVoice) utterance.voice = bestVoice;

    utterance.onerror = function onSpeechError() {
      if (fallbackEl) fallbackEl.textContent = "Audio blocked here. Please tap once on page and try again.";
    };

    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
    return true;
  };

  window.spApplause = function spApplause() {
    if (window.SP_STATE.muted) return;
    if (!window.AudioContext && !window.webkitAudioContext) return;
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    const ctx = new AudioCtx();
    const now = ctx.currentTime;

    function clap(at, frequency) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(frequency, at);
      gain.gain.setValueAtTime(0.0001, at);
      gain.gain.exponentialRampToValueAtTime(0.18, at + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, at + 0.14);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(at);
      osc.stop(at + 0.16);
    }

    clap(now, 740);
    clap(now + 0.08, 880);
    clap(now + 0.16, 980);
    setTimeout(function closeCtx() {
      ctx.close();
    }, 500);
  };

  if (hasSpeechSupport()) {
    window.speechSynthesis.onvoiceschanged = function onVoicesChanged() {
      renderMute();
    };
  }

  if (toggle) {
    toggle.addEventListener("click", function onToggleMute() {
      window.SP_STATE.muted = !window.SP_STATE.muted;
      localStorage.setItem(MUTE_KEY, String(window.SP_STATE.muted));
      renderMute();
    });
  }

  renderMute();
})();
