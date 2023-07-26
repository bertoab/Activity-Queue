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
    test.todo("when user function acronym strings are 2+ letters in length, match them before those of lesser length");
    test.todo("when a user function acronym string and a single integer index content item are matched, user function is called with corresponding content item value")
    test.todo("when a user function acronym string and two integer index content items (separated by a comma) are matched, user function is called with first matched content item value as first argument, and second matched content item value as second argument")
  });
});
describe('View', () => {});