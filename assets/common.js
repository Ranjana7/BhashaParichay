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

  window.spSpeak = function spSpeak(text, lang, fallbackEl) {
    if (window.SP_STATE.muted) {
      if (fallbackEl) fallbackEl.textContent = "Sound is muted. Tap Sound: Off to unmute.";
      return false;
    }

    if (!("speechSynthesis" in window)) {
      if (fallbackEl) fallbackEl.textContent = "Audio unavailable on this browser/device.";
      return false;
    }

    if (fallbackEl) fallbackEl.textContent = "";
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang || "sa-IN";
    utterance.rate = 0.8;
    utterance.pitch = 1;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
    return true;
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
