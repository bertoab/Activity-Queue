/**
 * @jest-environment jsdom
 */

let script;
let model, viewModel, view;

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
  viewModel = script.ViewModel(model);
  view = script.View(viewModel); // side-effect (DOM modification)
});

describe('Model', () => {
  describe('data management', () => {
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
     * Assert that an errorContext is set in application state. Then, reset state to mainMenuContext with testMapping as context's functionMapping.
     * @param {string} expectedErrorMessage
     * @param {object} testMapping The functionMapping object to be applied after resetting context
     */
    const assertErrorContextAndReset = function(expectedErrorMessage, testMapping) {
      expect(viewModel.context).toEqual(expect.objectContaining({
        type: "modal",
        title: "Error",
        content: [{
            type: "table",
            columnNames: ["Message(s)"],
            data: [[expectedErrorMessage]]
          }]
      }));
      Object.assign(viewModel.debug.state, viewModel.debug.mainMenu.state);
      Object.assign(viewModel.context, viewModel.debug.mainMenu.context);
      viewModel.debug.state.functionMapping = testMapping;
    };

    test("when multiple user function acronym strings and/or extra alphabetical characters are present, execute none and change context to errorModal", () => {
      // setup
      const fail = jest.fn();
      const errorMessage = "Invalid Input";
      const testFunctionMapping = {
        "A": fail,
        "B": fail,
        "C": fail
      };
      viewModel.debug.state.functionMapping = testFunctionMapping;
      // run 1
      const event = createSyntheticKeyboardEvent("AB");
      viewModel.handleFunctionBarKeypressEventAndExecuteUserFunction(event);
      assertErrorContextAndReset(errorMessage, testFunctionMapping);
      // run 2
      event.target.value = "ABC";
      viewModel.handleFunctionBarKeypressEventAndExecuteUserFunction(event);
      assertErrorContextAndReset(errorMessage, testFunctionMapping);
      // run 3
      event.target.value = "C A";
      viewModel.handleFunctionBarKeypressEventAndExecuteUserFunction(event);
      assertErrorContextAndReset(errorMessage, testFunctionMapping);

      // assertions
      expect(fail.mock.calls).toHaveLength(0);
    });
    test("match user function acronym strings in a case-insensitive manner", () => {
      // setup
      const pass = jest.fn();
      viewModel.debug.state.functionMapping = {
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
      viewModel.debug.state.functionMapping = {
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
      viewModel.debug.state.functionMapping = {
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
      viewModel.debug.state.functionMapping = {
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
    test.todo("when a user function acronym string is matched and a single integer index is present but there are extra alphabetical characters in the string, the function is not executed and an 'Invalid Input' alert is shown via context update");
    test.todo("when a user function acronym string is matched and a single integer index is present with a non-conventional format (hexadecimal, binary, or decimal exponentation notation), an alert 'Invalid Input' is shown via context update");
  });
});
describe('View', () => {});