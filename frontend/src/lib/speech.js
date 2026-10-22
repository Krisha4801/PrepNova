/**
 * Browser speech helpers (Web Speech API).
 */

/**
 * Returns the SpeechRecognition constructor if the browser supports it.
 * @returns {typeof SpeechRecognition | null}
 */
export function getSpeechRecognition() {
  return window.SpeechRecognition || window.webkitSpeechRecognition || null;
}

/**
 * Reads `text` aloud. If speech is already playing, it is cancelled instead.
 * Does nothing when the browser has no speech synthesis support.
 * @param {string} text
 */
export function toggleSpeech(text) {
  if (!('speechSynthesis' in window)) return;

  if (window.speechSynthesis.speaking) {
    window.speechSynthesis.cancel();
    return;
  }

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = 1.0;
  utterance.pitch = 1.0;
  window.speechSynthesis.speak(utterance);
}
