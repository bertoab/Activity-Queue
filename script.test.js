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

    test.todo("when multiple user function acronym strings are present, only match the first one");
    test.todo("match user function acronym strings in a case-insensitive manner");
    test.todo("when user function acronym strings are 2+ letters in length, match them before those of lesser length");
    test.todo("when a user function acronym string and a single integer index content item are matched, user function is called with corresponding content item value")
    test.todo("when a user function acronym string and two integer index content items are matched, user function is called with first matched content item value as first argument, and second matched content item value as second argument")
  });
});
describe('View', () => {});