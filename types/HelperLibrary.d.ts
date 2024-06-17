/**
 * Independent functions that can be used across
 * Model, ViewModel, and View.
 */
export declare namespace HelperLibrary {
  /**
   * Return a flag indicating whether "arg" is
   * of "object" type.
   */
  function isObject(arg: any): boolean;
  /**
   * Return a flag indicating whether all
   * characters in "str" are valid English
   * uppercase alphabetical letters ("A"-"Z").
   */
  function validateAllCharsUppercaseAlphabeticalLetters(str: string): boolean;
  /**
   * Return a flag indicating whether all characters
   * in "str" are valid decimal digits ("0"-"9").
   */
  function validateAllCharsDecimalDigits(str: string): boolean;
}