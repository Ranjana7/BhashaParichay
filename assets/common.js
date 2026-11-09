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

  function isIndicVoice(voice) {
    if (!voice || !voice.lang) return false;
    const v = voice.lang.toLowerCase();
    return v.startsWith("sa") || v.startsWith("hi") || v.startsWith("mr") || v.startsWith("ne");
  }

  function getVoiceCount() {
    if (!hasSpeechSupport()) return 0;
    return window.speechSynthesis.getVoices().length;
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
    window.speechSynthesis.getVoices();
    const bestVoice = getBestVoice(lang || "sa-IN");
    const shouldUseTransliteration = !bestVoice || !isIndicVoice(bestVoice);
    const speechText = shouldUseTransliteration ? (transliteration || text) : text;
    const utterance = new SpeechSynthesisUtterance(speechText);
    utterance.lang = shouldUseTransliteration ? "en-US" : ((bestVoice && bestVoice.lang) || lang || "en-US");
    utterance.rate = 0.75;
    utterance.pitch = 1;
    if (bestVoice) utterance.voice = bestVoice;

    let started = false;
    utterance.onstart = function onSpeechStart() {
      started = true;
    };
    utterance.onerror = function onSpeechError() {
      if (fallbackEl) fallbackEl.textContent = "Audio blocked here. Please tap once on page and try again.";
    };

    window.speechSynthesis.cancel();
    window.speechSynthesis.resume();
    window.speechSynthesis.speak(utterance);
    setTimeout(function checkSpeechStarted() {
      if (!started && fallbackEl) {
        fallbackEl.textContent = "No speech voice started. Check device volume and try Chrome/Edge.";
      }
    }, 1200);
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

  window.spSuccessTone = function spSuccessTone() {
    if (window.SP_STATE.muted) return;
    if (!window.AudioContext && !window.webkitAudioContext) return;
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    const ctx = new AudioCtx();
    const now = ctx.currentTime;

    function tone(frequency, start, duration) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(frequency, start);
      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.exponentialRampToValueAtTime(0.12, start + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(start);
      osc.stop(start + duration + 0.01);
    }

    tone(660, now, 0.11);
    tone(880, now + 0.12, 0.12);
    tone(990, now + 0.26, 0.12);
    setTimeout(function closeCtx() {
      ctx.close();
    }, 520);
  };

  if (hasSpeechSupport()) {
    window.speechSynthesis.onvoiceschanged = function onVoicesChanged() {
      renderMute();
    };
  }

  window.spGetAudioDebug = function spGetAudioDebug() {
    return {
      muted: window.SP_STATE.muted,
      speechSupported: hasSpeechSupport(),
      voiceCount: getVoiceCount()
    };
  };

  if (toggle) {
    toggle.addEventListener("click", function onToggleMute() {
      window.SP_STATE.muted = !window.SP_STATE.muted;
      localStorage.setItem(MUTE_KEY, String(window.SP_STATE.muted));
      renderMute();
    });
  }

  renderMute();
})();
