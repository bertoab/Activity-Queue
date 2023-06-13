/**
 * @jest-environment jsdom
 */

let script; // imports to be defined here

beforeAll(() => {
	// set up DOM
	document.body.innerHTML =
  `
  <div id="main">
  </div>
  <div id="modal-container" style="display:none;">
    <div id="modal">
    </div>
  </div>
  `;
	
	// load module
	script = require('./script'); // side-effect (DOM modification)
});

describe('contentTable', () => {
  describe('input validation', () => {
    test('throw error when called with no arguments', () => {
      expect(() => script.contentTable()).toThrow(TypeError);
    });
    test('throw error when called with only one argument', () => {
      expect(() => script.contentTable(null)).toThrow(TypeError);
      expect(() => script.contentTable(423)).toThrow(TypeError);
      expect(() => script.contentTable("any")).toThrow(TypeError);
      expect(() => script.contentTable(["any"])).toThrow(TypeError);
      expect(() => script.contentTable({})).toThrow(TypeError);
    });
    test('throw error when called with two non-array arguments', () => {
      expect(() => script.contentTable(NaN, null)).toThrow(TypeError);
      expect(() => script.contentTable("any", "one")).toThrow(TypeError);
      expect(() => script.contentTable(243, {})).toThrow(TypeError);
      expect(() => script.contentTable({}, 243)).toThrow(TypeError);
    });
    test('throw error when called with one array and one non-array argument', () => {
      expect(() => script.contentTable(["any", "two"], "one")).toThrow(TypeError);
      expect(() => script.contentTable("one", ["any"])).toThrow(TypeError);
    });
  });
});

describe('FunctionBar', () => {
  describe('input validation', () => {
    test('throw error when called with no arguments', () => {
      expect(() => script.FunctionBar()).toThrow(TypeError);
    });
    test('throw error when called with non-object first and/or second argument', () => {
      expect(() => script.FunctionBar({}, [])).toThrow(TypeError);
      expect(() => script.FunctionBar([], {})).toThrow(TypeError);
      expect(() => script.FunctionBar("", "")).toThrow(TypeError);
      expect(() => script.FunctionBar("")).toThrow(TypeError);
      expect(() => script.FunctionBar(43242)).toThrow(TypeError);
      expect(() => script.FunctionBar(null)).toThrow(TypeError);
    });
  });
});