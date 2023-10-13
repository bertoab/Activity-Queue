// Independent functions that can be used across Model, ViewModel, and View.
const helperLibrary = {
  isObject(arg) {
    return typeof arg === 'object' &&
    !Array.isArray(arg) &&
    arg !== null
  }
};

const Model = (function () {
  // Manage local storage (writing, reading, lookups using UUIDs, gather queryed Activity/Group info)
  const STORAGE_KEY = "activities";
  /**
   * Set (or clear) local storage
   * @param {Object} activities - Object of activities to save locally. If non-object then an empty object is saved. 
   */
  const setStore = (activities) => {
    if (!helperLibrary.isObject(activities)) {
      localStorage.setItem(STORAGE_KEY, {});
      return;
    }
    localStorage.setItem(STORAGE_KEY, activities);
  }
  /**
   * Read local storage and return it's contents, or throw error if contents corrupted.
   * @returns {Object} - Multi-level Object containing arrays of Activities with year, month, and day from "schedule" property as keys (or "loose" if some or all of these properties are omitted).
   */
  const getStore = () => {
    let data = localStorage.getItem(STORAGE_KEY);
    if (data === null) // uninitialized local storage
      data = {};
    else if (!helperLibrary.isObject(data))
      throw TypeError("Local storage data is non-object")
    return data;
  }

  // runtime parameters
  let activitiesBySchedule, groupsIdMap,
    groupActivitiesMap;

  activitiesBySchedule = getStore();
  //...groupsIdMap = Object.fromEntries(...));
  //...groupActivitiesMap = ...

  return {
    // newActivity(activity) {},
    // updateActivity(activity, priorSchedule) {},
    // deleteActivity(id) {},
    // fetchActivitiesBySchedule(schedule) {}
  };
})();

const ViewModel  = (argumentModel) => (function (m) {
  const model = m;
  const state = {};
  const context = {};
  let updateView;
  /**
   * Overwrite the application state based on properties of "updatedState"; allowed to overwrite some or all state properties. If "updatedState.contentContainers" exists, DOM will be re-rendered.
   * @param {{functionMapping?: Object, itemMapping?: Object, contentContainers?: Array<Object>}} updatedState 
   */
  function updateState(updatedState) {
    const properties = Object.keys(updatedState);
    if (properties.includes("functionMapping")) {
      if (!helperLibrary.isObject(updatedState.functionMapping))
        throw new TypeError("unexpected state property type");
      state.functionMapping = updatedState.functionMapping;
    }
    if (properties.includes("itemMapping")) {
      if (!helperLibrary.isObject(updatedState.itemMapping))
        throw new TypeError("unexpected state property type");
      state.itemMapping = updatedState.itemMapping;
    }
    if (properties.includes("contentContainers")) {
      state.contentContainers = updatedState.contentContainers;
    }
  }
  /**
   * Overwrite the application context based on properties of "updatedContext"; allowed to overwrite some or all context properties.
   * @param {{type?: "main" | "modal", title?: string, content?: Array<Object>}} updatedContext - An object containing string keys that are application context properties and appropriate values
   */
  function updateContext(updatedContext) {
    const properties = Object.keys(updatedContext);
    if (properties.indexOf("type") !== -1) {
      if (typeof updatedContext.type !== 'string')
        throw new TypeError("unexpected context property type");
      context.type = updatedContext.type;
    }
    if (properties.indexOf("title") !== -1) {
      if (typeof updatedContext.title !== 'string')
        throw new TypeError("unexpected context property type");
      context.title = updatedContext.title;
    }
    if (properties.indexOf("content") !== -1) {
      //TODO: "content" validation
      context.content = updatedContext.content;
    }

    if (typeof updateView === 'function')
      updateView();
  }
  /**
   * Return a context object for an error. The context is a modal type with the title "Error" and the passed message as the content.
   * @param {string} message - The error message to be displayed
   * @returns {{type: "modal", title: "Error", content: message}}
   */
  function errorContext(message) {
    if (typeof message !== 'string')
      throw new TypeError("unexpected parameter type");
    return {
      type: "modal",
      title: "Error",
      content: [{
        type: "table",
        columnNames: ["Message(s)"],
        data: [[message]]
      }]
    };
  }

  /**
   * Search for all members of "expectedInputStringArray" within "str". The first occurring member within "expectedInputStringArray" is removed from "str".
   * @param {string} str - The string to be searched
   * @param {Array<string>} expectedInputStringArray - An array of strings to be searched for in "str"
   * @returns {[string, Array<string>]} - A tuple; index 0 contains "str" after the first matched string has been removed & index 1 contains an array of each matched string
   */
  function searchForMatches(str, expectedInputStringArray) {
    if (!Array.isArray(expectedInputStringArray))
      throw new TypeError("unexpected parameter type");

    str = str.toUpperCase();
    expectedInputStringArray.sort( (a, b) => b.length - a.length ); // highest length first
    expectedInputStringArray = expectedInputStringArray.filter( val => str.includes(val) ); // remove strings not present in str
    expectedInputStringArray.sort( (a, b) => str.indexOf(a) - str.indexOf(b) ); // earliest occurrence in str first
    str = str.replace(expectedInputStringArray[0], ""); // remove earliest occurring string from str

    return [str, expectedInputStringArray];
  }

  const mainMenu = {
    state: {
      contentContainers: [{
        type: "table",
        title: undefined,
        columnNames: ["Options"],
        data: [["Add task"], ["View history"], ["View archived"]],
        functions: [() => document.getElementById("modal-container").style.display = "flex", () => alert("You selected: View history"), () => alert("You selected: View archived")],
        isLiteralData: true,
        startingVisualIndex: 1,
        currentPageIndex: 0,
        maxPageItems: 15
      }],
      functionMapping: {
        "1": () => document.getElementById("modal-container").style.display = "flex",
        "2": () => alert("You selected: View history"),
        "3": () => alert("You selected: View archived"),
      }
    },
    context: {
      type: "main",
      title: "Main Menu",
      content: [
        {
          type: "table",
          title: undefined,
          columnNames: ["Index", "Options"],
          currentPage: "1",
          lastPageNumber: "1",
          data: [["1", "Add task"], ["2", "View history"], ["3", "View archived"]]
        }
      ]
    }
  };
  // initialize state to main menu context
  updateContext(mainMenu.context);
  updateState(mainMenu.state);

  return {
    context: context,
    state: state,
    mainMenu: mainMenu, // for testing
    /**
     * Parse user input for a corresponding user function acronym string, and execute; accessible user functions are determined by current application state.
     * @param {Event} event - The Event object passed from the fired event listener
     */
    validateUserFunction(event) {
      let inputArray = event.target.value.split(",").map(str => str.trim()); // split raw input by "," delimiter and trim trailing whitespace
      if (event.key === 'Enter') { // validate for a user function
        let matchedFunctions;
        [inputArray[0], matchedFunctions] = searchForMatches(inputArray[0], Object.keys(state.functionMapping));
        if (matchedFunctions.length !== 0) {
          if (inputArray[0] === "")
            inputArray.shift();
          else { // ensure remaining string of inputArray[0] contains digits (0-9)
            for (let i = 0; i < inputArray[0].length; i++)
              if (inputArray[0].charCodeAt(i) < 48 || inputArray[0].charCodeAt(i) > 57)
                return updateContext(errorContext("Invalid Input"));
          }
          state.functionMapping[matchedFunctions[0]](...inputArray);
        } // else check for user functions not involving acronym strings and if not available, alert user of invalid user function acronym input
      }
    },
    setUpdateView(func) {
      if (typeof updateView === 'undefined')
        func();
      updateView = func;
    }
  };
})(argumentModel);

const viewModel = ViewModel(Model);

const View = (argumentViewModel) => (function (vm) {
  const viewModel = vm;
  viewModel.setUpdateView(render);
  
  /**
   * Creates a styled "div" for a header
   * @param {string} value - The title string to display in the header
   * @returns {HTMLElement} - The "div" element
   */
  function createHeader(value) {
    if (typeof value !== 'string')
      throw new TypeError("unexpected parameter type"); //TODO: implement support for Array<HTMLElement>
    const headerDiv = document.createElement("div");
    headerDiv.classList.add("header");
    headerDiv.innerText = value;
    return headerDiv;
  }
  /**
   * Returns an HTML table element based on an array of arrays, accepting a single-layer array for the columns and a two-layer array for the data 
   * @param {Array<string>} cols - an array of strings to name the table columns
   * @param {Array<Array<string>>} data - a two-layer array containing strings within; for a symmetric, gap-less table, the length of every inner array should be equal to that of "cols"
   * @returns {HTMLElement}
   */
  function tableContainer(cols, data, title) {
    if (!Array.isArray(cols) || !Array.isArray(data))
      throw new TypeError("One or both arguments are non-array");
    let tableHTML = `<table>
      <thead>
        <tr>`;
    for (let i = 0; i < cols.length; i++) {
      tableHTML += `<th>${cols[i]}</th>`;
    }
    tableHTML += `</tr>
      </thead>
      <tbody>`;
    for (let i = 0; i < data.length; i++) {
      for (let j = 0; j < data[i].length; j++) {
        tableHTML += `<td>${data[i][j]}</td>`;
      }
      tableHTML += `</tr>`;
    }
    tableHTML += `</tbody>
    </table>`;
    const div = document.createElement("div");
    if (typeof title === 'string') {
      const heading = document.createElement("div");
      heading.classList.add("header");
      heading.innerText = title;
      div.appendChild(heading);
    }
    div.insertAdjacentHTML("beforeend", tableHTML);
    return div;
  }
  /**
   * Returns an HTML div element containing parameter information, based on an array of arrays detailing their names, visual indexes, and CSS id attributes
   * @param {Array<Array<string>} parametersArray - two-layer array; the inner arrays must contain either a single string value or 3 values, where the first index is a string corresponding to the name of the parameter, the second index is a string that is the visual index value of the parameter, and the third index is a string that is the id CSS attribute of the input element for the parameter
   * @returns {HTMLElement}
   */
  function parametersContainer(parametersArray) {
    // validate argument
    if (!Array.isArray(parametersArray))
      throw new TypeError("unexpected parameter type");
    for (const element of parametersArray) {
      if (!Array.isArray(element) || element.length === 2 || element.length > 3)
        throw new TypeError("unexpected parameter type");
    };

    const container = document.createElement("div");
    container.classList.add("parameters-container");
    for (const parameterDetails of parametersArray) {
      const parameterDiv = document.createElement("div");
      parameterDiv.classList.add("parameter");
      const label = document.createElement("p");
      label.innerText = parameterDetails.length === 3 ? `${parameterDetails[1]}. ${parameterDetails[0]}` : label.innerText = parameterDetails[0];
      parameterDiv.appendChild(label);
      if (parameterDetails.length === 3) {
        const input = document.createElement("input");
        input.type = "text";
        input.setAttribute("id", parameterDetails[2]);
        parameterDiv.appendChild(input);
      }
      container.appendChild(parameterDiv);
    }
    return container;
  }
  /**
   * Accepts "content" property of application context and returns the appropriately formatted HTMLElement to display as the main content
   * @param {Array} content
   * @returns {HTMLElement}
   */
  function prepareContent(content) {
    //TODO: iterate "content" to support multiple containers in one context
    const container = content[0];
    if (container.type === "table")
      return tableContainer(container.columnNames, container.data, container.title);
    if (container.type === "parameters")
      return parametersContainer(container.data);
    throw new TypeError("unexpected parameter type");
  }
  /**
   * Creates HTML elements for the FunctionBar component and attaches a "keypress" listener to validate and execute on input via a ViewModel callback function.
   * @returns {HTMLElement} - The "div" element, containing the "input" element
   */
  function FunctionBar() {
    // Create necessary HTMLElements
    const div = document.createElement("div");
    div.classList.add("function-bar");
    const input = document.createElement("input");
    input.type = "text";
    div.appendChild(input);
    // Set up event listener
    input.addEventListener("keypress", viewModel.validateUserFunction);
  
    return div;
  }

  /**
   * Draw the current application context to the screen. Removes all elements from the current context div (determined by "type" context property) before drawing
   */
  function render() {
    // select context div
    let contextDiv;
    if (viewModel.context.type === "main") {
      contextDiv = document.getElementById("main");
      document.getElementById("modal-container").style.display = "none";
    } else if (viewModel.context.type === "modal") {
      contextDiv = document.getElementById("modal");
      document.getElementById("modal-container").style.display = "flex";
    }
    if (contextDiv === undefined)
      throw new Error("context div not selectable");
    // remove existing components
    while (contextDiv.firstChild)
      contextDiv.removeChild(contextDiv.firstChild);
    // draw
    contextDiv.appendChild(createHeader(viewModel.context.title));
    contextDiv.appendChild(prepareContent(viewModel.context.content));
    const funcBar = FunctionBar(); // define as variable to set cursor focus
    contextDiv.appendChild(funcBar);
    funcBar.firstChild.focus();
  }

})(argumentViewModel);

const view = View(viewModel);

// Linked list implementation
class Node {
  constructor(value) {
    this.value = value;
    this.next = null;
  }
}
class LinkedList {
  constructor() {
    this.head = null;
    this.tail = null;
  }

  addToTail(value) {
    const newNode = new Node(value);
    if (!this.head) {
      this.head = newNode;
    } else {
      this.tail.next = newNode;
    }
    this.tail = newNode;
  }

  addToHead(value) {
    const newNode = new Node(value);
    if (!this.head) {
      this.tail = newNode;
    } else {
      newNode.next = this.head;
    }
    this.head = newNode;
  }

  removeTail() {
    if (!this.head) return null;
    if (this.head === this.tail) {
      const value = this.head.value;
      this.head = null;
      this.tail = null;
      return value;
    }
    let current = this.head;
    while (current.next !== this.tail) {
      current = current.next;
    }
    const value = this.tail.value;
    current.next = null;
    this.tail = current;
    return value;
  }

  removeHead() {
    if (!this.head) return null;
    const value = this.head.value;
    this.head = this.head.next;
    if (!this.head) {
      this.tail = null;
    }
    return value;
  }

  search(value) {
    let current = this.head;
    while (current) {
      if (current.value === value) return current;
      current = current.next;
    }
    return null;
  }

  indexOf(value) {
    let current = this.head;
    let index = 0;
    while (current) {
      if (current.value === value) return index;
      current = current.next;
      index++;
    }
    return -1;
  }
}

// Support module
if (typeof exports === 'object') {
  exports.Model = Model;
  exports.ViewModel = ViewModel;
  exports.View = View;
}