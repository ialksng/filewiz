/**
 * Calculate Word and Character Count Statistics
 * @param {string} text
 * @returns {object}
 */
export function analyzeText(text = '') {
  const trimmed = text.trim();
  if (!trimmed) {
    return {
      words: 0,
      characters: 0,
      charactersNoSpaces: 0,
      sentences: 0,
      paragraphs: 0,
      readingTimeMinutes: 0
    };
  }

  const words = trimmed.split(/\s+/).filter(Boolean).length;
  const characters = text.length;
  const charactersNoSpaces = text.replace(/\s/g, '').length;
  const sentences = trimmed.split(/[.!?]+/).filter(s => s.trim().length > 0).length;
  const paragraphs = trimmed.split(/\n+/).filter(p => p.trim().length > 0).length;
  const readingTimeMinutes = Math.ceil(words / 200); // 200 wpm average

  return {
    words,
    characters,
    charactersNoSpaces,
    sentences,
    paragraphs,
    readingTimeMinutes
  };
}

/**
 * Format and Validate JSON
 * @param {string} jsonString
 * @param {number} indent
 * @returns {{ valid: boolean, formatted?: string, error?: string }}
 */
export function formatJson(jsonString, indent = 2) {
  try {
    const parsed = JSON.parse(jsonString);
    return {
      valid: true,
      formatted: JSON.stringify(parsed, null, indent),
      error: null
    };
  } catch (err) {
    return {
      valid: false,
      formatted: null,
      error: err.message
    };
  }
}

/**
 * Base64 Encoder and Decoder
 */
export function encodeBase64(text) {
  return btoa(unescape(encodeURIComponent(text)));
}

export function decodeBase64(base64) {
  return decodeURIComponent(escape(atob(base64)));
}

/**
 * URL Encoder and Decoder
 */
export function encodeUrl(url) {
  return encodeURIComponent(url);
}

export function decodeUrl(encodedUrl) {
  return decodeURIComponent(encodedUrl);
}

/**
 * Generate Secure Cryptographic UUID (v4)
 */
export function generateUuid() {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
  if (!globalThis.crypto?.getRandomValues) throw new Error('Secure random generation is not available in this browser.');
  const bytes = globalThis.crypto.getRandomValues(new Uint8Array(16));
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  return [...bytes].map((byte, index) => `${[4, 6, 8, 10].includes(index) ? '-' : ''}${byte.toString(16).padStart(2, '0')}`).join('');
}

/**
 * Generate Secure Random Password
 * @param {object} options
 */
export function generatePassword(options = {}) {
  const {
    length = 16,
    uppercase = true,
    lowercase = true,
    numbers = true,
    symbols = true
  } = options;

  let chars = '';
  if (lowercase) chars += 'abcdefghijklmnopqrstuvwxyz';
  if (uppercase) chars += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  if (numbers) chars += '0123456789';
  if (symbols) chars += '!@#$%^&*()_+-=[]{}|;:,.<>?';

  if (!chars) chars = 'abcdefghijklmnopqrstuvwxyz0123456789';

  let password = '';
  const randomValues = new Uint32Array(length * 2);
  if (!globalThis.crypto?.getRandomValues) throw new Error('Secure random generation is not available in this browser.');
  globalThis.crypto.getRandomValues(randomValues);
  const limit = Math.floor(0x1_0000_0000 / chars.length) * chars.length;
  while (password.length < length) {
    for (const value of randomValues) {
      if (value >= limit) continue;
      password += chars[value % chars.length];
      if (password.length === length) break;
    }
    if (password.length < length) globalThis.crypto.getRandomValues(randomValues);
  }

  return password;
}
