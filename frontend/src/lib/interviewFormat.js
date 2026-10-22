/**
 * Small formatting helpers used by the live interview screens.
 */

const pad = (n) => String(n).padStart(2, '0');

/**
 * Formats a number of seconds as `MM:SS`.
 * @param {number} totalSeconds
 * @returns {string}
 */
export function formatTimer(totalSeconds) {
  const mins = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;
  return `${pad(mins)}:${pad(secs)}`;
}

/**
 * Counts the words in a block of text.
 * @param {string} text
 * @returns {number}
 */
export function countWords(text) {
  const trimmed = text.trim();
  return trimmed ? trimmed.split(/\s+/).length : 0;
}
