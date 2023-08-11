/**
 * @jest-environment jsdom
 */

let script;
let model, viewModel, view;
/**
 * Create a pair of "pass" and "fail" jest mock functions to track callback executions within tests
 * @returns {[jest.fn, jest.fn]}
 */
const createPassFailFunctions = () => [jest.fn(), jest.fn()];

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
  describe('validateUserFunction', () => {
    /**
     * Create an Event-like object used to invoke ViewModel's "validateUserFunction"
     * @param {string} startingInput
     */
    const createSyntheticKeyboardEvent = function(startingInput) {
      return {
        key: "Enter",
        target: { value: startingInput }
      }
    };

    test("when multiple user function acronym strings are present, only match the first one", () => {
      // run 1 (setup)
      const [pass, fail] = createPassFailFunctions();

      viewModel.state.functionMapping = {
        "A": pass,
        "B": fail,
        "C": fail
      };
      
      const event = createSyntheticKeyboardEvent("DEABC");
      viewModel.validateUserFunction(event); // PASS

      // run 2
      event.target.value = "ABC";
      viewModel.validateUserFunction(event); // PASS

      // run 3
      event.target.value = "BA";
      viewModel.validateUserFunction(event); // FAIL

      // assertions
      expect(pass.mock.calls).toHaveLength(2);
      expect(fail.mock.calls).toHaveLength(1);
    });
    test("match user function acronym strings in a case-insensitive manner", () => {
      // run 1 (setup)
      const [pass, fail] = createPassFailFunctions();

      viewModel.state.functionMapping = {
        "A": pass,
        "B": pass,
        "C": pass,
        "GH": pass,
        "DEF": pass,
        "Z": fail
      };

      const event = createSyntheticKeyboardEvent("lJhcFaZ");
      viewModel.validateUserFunction(event);

      // run 2
      event.target.value = "bZ";
      viewModel.validateUserFunction(event); // PASS

      // run 3
      event.target.value = "mKC";
      viewModel.validateUserFunction(event); // PASS

      // run 4
      event.target.value = "deBZ";
      viewModel.validateUserFunction(event); // PASS

      // run 5
      event.target.value = "jnGh";
      viewModel.validateUserFunction(event); // PASS

      // run 6
      event.target.value = "zABC";
      viewModel.validateUserFunction(event); // FAIL

      // assertions
      expect(pass.mock.calls).toHaveLength(5);
      expect(fail.mock.calls).toHaveLength(1);
    });
    test("when user function acronym strings are 2+ letters in length, match them before those of lesser length", () => {
      // run 1 (setup)
      const [pass, fail] = createPassFailFunctions();

      viewModel.state.functionMapping = {
        "A": fail,
        "ABC": pass,
        "BC": pass,
        "GH": fail,
        "GHIJ": pass,
        "DEF": pass
      };

      const event = createSyntheticKeyboardEvent("ABC"); // PASS
      viewModel.validateUserFunction(event);

      // run 2
      event.target.value = "LMOBCA"; // PASS
      viewModel.validateUserFunction(event);

      // run 3
      event.target.value = "GHIJK"; // PASS
      viewModel.validateUserFunction(event);

      // run 4
      event.target.value = "GBDEF"; // PASS
      viewModel.validateUserFunction(event);

      // run 5
      event.target.value = "AHBC"; // FAIL
      viewModel.validateUserFunction(event);
      
      // run 6
      event.target.value = "GHABC"; // FAIL
      viewModel.validateUserFunction(event);

      // assertions
      expect(pass.mock.calls).toHaveLength(4);
      expect(fail.mock.calls).toHaveLength(2);
    });
    test("when a user function acronym string is matched and a single integer index is present, user function is called with integer index as sole parameter", () => {
      // run 1 (setup)
      const pass = jest.fn();

      viewModel.state.functionMapping = {
        "A": pass
      };

      const event = createSyntheticKeyboardEvent("A1");
      viewModel.validateUserFunction(event);

      // run 2
      event.target.value = "A12";
      viewModel.validateUserFunction(event);

      // run 3
      event.target.value = "A9";
      viewModel.validateUserFunction(event);

      // run 4
      event.target.value = "A0";
      viewModel.validateUserFunction(event);

      // assertions
      expect(pass.mock.calls).toEqual([["1"], ["12"], ["9"], ["0"]]);
    });
    test.todo("when a user function acronym string is matched and two integer indexes (separated by a comma) are present, user function is called with first integer index as first argument, and second integer index as second argument");
    test.todo("when a user function acronym string is matched and a single integer index is present but there are extra alphabetical characters in the string, the function is not executed and an 'Invalid Input' alert is shown via context update");
    test.todo("when a user function acronym string is matched and a single integer index is present with a non-conventional format (hexadecimal, binary, or decimal exponentation notation), an alert 'Invalid Input' is shown via context update");
  });
});
describe('View', () => {});