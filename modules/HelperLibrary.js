/** @type {import("../types").HelperLibrary} */
export const helperLibrary = {
  isObject(arg) {
    return typeof arg === 'object' &&
    !Array.isArray(arg) &&
    arg !== null
  },
  validateAllCharsUppercaseAlphabeticalLetters(str) {
    const FIRST_VALID_CHAR = 65; // "A"
    const LAST_VALID_CHAR = 90; // "Z"
    for (let i = 0; i < str.length; i++) {
      if (str.charCodeAt(i) < FIRST_VALID_CHAR ||
          str.charCodeAt(i) > LAST_VALID_CHAR)
        return false;
    }
    return true;
  },
  validateAllCharsDecimalDigits(str) {
    const FIRST_VALID_CHAR = 48; // "0"
    const LAST_VALID_CHAR = 57; // "9"
    for (let i = 0; i < str.length; i++) {
      if (str.charCodeAt(i) < FIRST_VALID_CHAR ||
          str.charCodeAt(i) > LAST_VALID_CHAR)
        return false;
    }
    return true;
  }
};
