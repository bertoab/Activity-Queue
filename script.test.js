/**
 * @jest-environment jsdom
 */

let script;
let model, viewModel, view;
let STORAGE_KEY;

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
  script = require('./script');
  model = script.Model;
  STORAGE_KEY = model.debug.ACTIVITIES_STORAGE_KEY;
  viewModel = script.ViewModel(model);
  view = script.View(viewModel); // side-effect (DOM modification)
});

describe('Model', () => {
  describe('data management', () => {
    /**
     * Reset LocalStorage content. If "newContent" is a string, content is set to that value. Otherwise it is set to null.
     */
    const resetStorage = function(newContent) {
      if (typeof newContent === 'string')
        return localStorage.setItem(STORAGE_KEY, newContent)
      return localStorage.removeItem(STORAGE_KEY);
    }
    /**
     * Read content of LocalStorage, parse as a JSON string, and return parsed result.
     */
    const getParsedStorage = function() {
      return JSON.parse(localStorage.getItem(STORAGE_KEY));
    }
    describe('setActivitiesStore', () => {
      test("when passed a non-object parameter, ignore it and set storage to an empty object JSON string", () => {
        // setup
        resetStorage();
        // run 1
        let testParameter = undefined;
        model.debug.setActivitiesStore(testParameter);
        expect(getParsedStorage()).toEqual({});
        // run 2
        testParameter = null;
        model.debug.setActivitiesStore(testParameter);
        expect(getParsedStorage()).toEqual({});
        // run 3
        testParameter = NaN;
        model.debug.setActivitiesStore(testParameter);
        expect(getParsedStorage()).toEqual({});
        // run 4
        testParameter = 12;
        model.debug.setActivitiesStore(testParameter);
        expect(getParsedStorage()).toEqual({});
        // run 5
        testParameter = 298930839013901;
        model.debug.setActivitiesStore(testParameter);
        expect(getParsedStorage()).toEqual({});
        // run 6
        testParameter = true;
        model.debug.setActivitiesStore(testParameter);
        expect(getParsedStorage()).toEqual({});
        // run 7
        testParameter = false;
        model.debug.setActivitiesStore(testParameter);
        expect(getParsedStorage()).toEqual({});
        // run 8
        testParameter = Symbol();
        model.debug.setActivitiesStore(testParameter);
        expect(getParsedStorage()).toEqual({});
        // run 9
        testParameter = "{ helloWorld: 'Hello World' }";
        model.debug.setActivitiesStore(testParameter);
        expect(getParsedStorage()).toEqual({});
        // run 10
        testParameter = `[ "helloWorld", "Hello World" ]`;
        model.debug.setActivitiesStore(testParameter);
        expect(getParsedStorage()).toEqual({});
        // run 11
        testParameter = `123`;
        model.debug.setActivitiesStore(testParameter);
        expect(getParsedStorage()).toEqual({});
      });
      test("when passed an object parameter, set storage to JSON stringified version of it", () => {
        // setup
        resetStorage();
        // run 1
        let testObject = {
          prop1: "string",
          prop2: 321,
          prop3: false,
          prop4: { prop1: null },
          prop5: [ true, 3, "another string"],
        }
        model.debug.setActivitiesStore(testObject);
        expect(getParsedStorage()).toEqual(testObject);
        // run 2
        testObject = {};
        model.debug.setActivitiesStore(testObject);
        expect(getParsedStorage()).toEqual(testObject);
      });
    });
    describe('getActivitiesStore', () => {
      test("when storage content successfully parses to non-object, throw a TypeError", () => {
        // run 1
        resetStorage("345");
        expect(model.debug.getActivitiesStore).toThrow(TypeError);
        // run 2
        resetStorage("[]");
        expect(model.debug.getActivitiesStore).toThrow(TypeError);
        // run 3
        resetStorage(`"hello world"`);
        expect(model.debug.getActivitiesStore).toThrow(TypeError);
        // run 4
        resetStorage("true");
        expect(model.debug.getActivitiesStore).toThrow(TypeError);
      });
      test("when storage is uninitialized, return an empty object", () => {
        // run 1
        resetStorage();
        expect(model.debug.getActivitiesStore()).toEqual({});
      });
      test("when storage cannot be parsed as JSON, throw a SyntaxError", () => {
        // run 1
        resetStorage("'hello world'");
        expect(model.debug.getActivitiesStore).toThrow(SyntaxError);
        // run 2
        resetStorage("\\ \'");
        expect(model.debug.getActivitiesStore).toThrow(SyntaxError);
        // run 3
        resetStorage("hello world");
        expect(model.debug.getActivitiesStore).toThrow(SyntaxError);
        // run 4
        resetStorage("undefined");
        expect(model.debug.getActivitiesStore).toThrow(SyntaxError);
        // run 5
        resetStorage(`{ "almost": "a correct object }`);
        expect(model.debug.getActivitiesStore).toThrow(SyntaxError);
      });
      test("when storage content successfully parses as an object, return it", () => {
        // run 1
        let testObject = {
          prop1: "string",
          prop2: 321,
          prop3: false,
          prop4: { prop1: null },
          prop5: [ true, 3, "another string"],
        }; // these are the ONLY types able to be stringified by JSON; property keys or values that are not any of these will be silently ignored by JSON parsing function
        resetStorage(JSON.stringify(testObject));
        expect(model.debug.getActivitiesStore()).toEqual(testObject)
      });
    });
    describe('flattenScheduleTreeToActivitiesArray', () => {
      test.todo("when passed a valid ScheduleToActivitiesTree, return array of all Activities within");
      test.todo("when passed a non-object, throw a TypeError");
    });
  });
});
describe('ViewModel', () => {
  describe('handleFunctionBarKeypressEventAndExecuteUserFunction', () => {
    /**
     * Create an Event-like object used to invoke ViewModel's "handleFunctionBarKeypressEventAndExecuteUserFunction"
     * @param {string} startingInput
     */
    const createSyntheticKeyboardEvent = function(startingInput) {
      return {
        key: "Enter",
        target: { value: startingInput }
      }
    };
    /**
     * Assert that an errorDOMContext is set in application State. Then, reset State to mainMenuDOMContext with testMapping as DOMContext's functionMapping.
     * @param {string} expectedErrorMessage
     * @param {object} testMapping The functionMapping object to be applied after resetting DOMContext
     */
    const assertErrorDOMContextAndReset = function(expectedErrorMessage, testMapping) {
      expect(viewModel.DOMContext).toEqual(expect.objectContaining({
        type: "modal",
        title: "Error",
        content: [{
            type: "table",
            columnNames: ["Message(s)"],
            data: [[expectedErrorMessage]]
          }]
      }));
      Object.assign(viewModel.debug.State, viewModel.debug.mainMenu.State);
      Object.assign(viewModel.DOMContext, viewModel.debug.mainMenu.DOMContext);
      viewModel.debug.State.functionMapping = testMapping;
    };

    test("when multiple user function acronym strings and/or extra alphabetical characters are present, execute none and change DOMContext to errorModal", () => {
      // setup
      const fail = jest.fn();
      const errorMessage = "Invalid Input";
      const testFunctionMapping = {
        "A": fail,
        "B": fail,
        "C": fail
      };
      viewModel.debug.State.functionMapping = testFunctionMapping;
      // run 1
      const event = createSyntheticKeyboardEvent("AB");
      viewModel.handleFunctionBarKeypressEventAndExecuteUserFunction(event);
      assertErrorDOMContextAndReset(errorMessage, testFunctionMapping);
      // run 2
      event.target.value = "ABC";
      viewModel.handleFunctionBarKeypressEventAndExecuteUserFunction(event);
      assertErrorDOMContextAndReset(errorMessage, testFunctionMapping);
      // run 3
      event.target.value = "C A";
      viewModel.handleFunctionBarKeypressEventAndExecuteUserFunction(event);
      assertErrorDOMContextAndReset(errorMessage, testFunctionMapping);

      // assertions
      expect(fail.mock.calls).toHaveLength(0);
    });
    test("match user function acronym strings in a case-insensitive manner", () => {
      // setup
      const pass = jest.fn();
      viewModel.debug.State.functionMapping = {
        "A": pass,
        "B": pass,
        "C": pass,
        "GH": pass,
        "DEF": pass,
      };
      // run 1
      const event = createSyntheticKeyboardEvent("a");
      viewModel.handleFunctionBarKeypressEventAndExecuteUserFunction(event);
      // run 2
      event.target.value = "B";
      viewModel.handleFunctionBarKeypressEventAndExecuteUserFunction(event);
      // run 3
      event.target.value = "Gh";
      viewModel.handleFunctionBarKeypressEventAndExecuteUserFunction(event);
      // run 4
      event.target.value = "Def";
      viewModel.handleFunctionBarKeypressEventAndExecuteUserFunction(event);
      // run 5
      event.target.value = "gH";
      viewModel.handleFunctionBarKeypressEventAndExecuteUserFunction(event);
      // run 6
      event.target.value = "c";
      viewModel.handleFunctionBarKeypressEventAndExecuteUserFunction(event);

      // assertions
      expect(pass.mock.calls).toHaveLength(6);
    });
    test("when user function acronym strings are 2+ letters in length, match them before those of lesser length", () => {
      // setup
      const pass = jest.fn(), fail = jest.fn();
      viewModel.debug.State.functionMapping = {
        "A": fail,
        "ABC": pass,
        "GH": fail,
        "GHIJ": pass,
        "DE": fail,
        "DEF": pass
      };
      // run 1
      const event = createSyntheticKeyboardEvent("ABC"); // PASS
      viewModel.handleFunctionBarKeypressEventAndExecuteUserFunction(event);
      // run 2
      event.target.value = "GHIJ"; // PASS
      viewModel.handleFunctionBarKeypressEventAndExecuteUserFunction(event);
      // run 3
      event.target.value = "DEF"; // PASS
      viewModel.handleFunctionBarKeypressEventAndExecuteUserFunction(event);

      // assertions
      expect(pass.mock.calls).toHaveLength(3);
      expect(fail.mock.calls).toHaveLength(0);
    });
    test("when a user function acronym string is matched and a single integer index is present, user function is called with integer index as sole parameter", () => {
      // setup
      const pass = jest.fn();
      viewModel.debug.State.functionMapping = {
        "A": pass
      };
      // run 1
      const event = createSyntheticKeyboardEvent("A1");
      viewModel.handleFunctionBarKeypressEventAndExecuteUserFunction(event);
      // run 2
      event.target.value = "A12";
      viewModel.handleFunctionBarKeypressEventAndExecuteUserFunction(event);
      // run 3
      event.target.value = "A9";
      viewModel.handleFunctionBarKeypressEventAndExecuteUserFunction(event);
      // run 4
      event.target.value = "A0";
      viewModel.handleFunctionBarKeypressEventAndExecuteUserFunction(event);

      // assertions
      expect(pass.mock.calls).toEqual([["1"], ["12"], ["9"], ["0"]]);
    });
    test("when a user function acronym string is matched and two integer indexes (separated by a comma) are present, user function is called with first integer index as first argument, and second integer index as second argument", () => {
      // setup
      const pass = jest.fn();
      viewModel.debug.State.functionMapping = {
        "A": pass
      };
      // run 1
      const event = createSyntheticKeyboardEvent("A1,1");
      viewModel.handleFunctionBarKeypressEventAndExecuteUserFunction(event);
      // run 2
      event.target.value = "A1,9";
      viewModel.handleFunctionBarKeypressEventAndExecuteUserFunction(event);
      // run 3
      event.target.value = "A31,29";
      viewModel.handleFunctionBarKeypressEventAndExecuteUserFunction(event);
      // run 4
      event.target.value = "A0,12";
      viewModel.handleFunctionBarKeypressEventAndExecuteUserFunction(event);

      // assertions
      expect(pass.mock.calls).toEqual([["1", "1"], ["1", "9"], ["31", "29"], ["0", "12"]]);
    });
    test.todo("when a user function acronym string is matched and a single integer index is present but there are extra alphabetical characters in the string, the function is not executed and an 'Invalid Input' alert is shown via DOMContext update");
    test.todo("when a user function acronym string is matched and a single integer index is present with a non-conventional format (hexadecimal, binary, or decimal exponentation notation), an alert 'Invalid Input' is shown via DOMContext update");
  });
});
describe('View', () => {});