// Independent functions that can be used across Model, ViewModel, and View.
const helperLibrary = {
  isObject(arg) {
    return typeof arg === 'object' &&
    !Array.isArray(arg) &&
    arg !== null
  }
};

/**
 * @typedef {{
 * year?: number,
 * month?: number,
 * day?: number,
 * hour?: number,
 * minute?: number
 * }} Schedule
 *
 * @typedef {{
 * id: string,
 * creation: string,
 * name?: string,
 * checked_off?: boolean,
 * schedule?: Schedule
 * }} Activity
 */

const Model = (function () {
  /**
   * @typedef {Object} DaysToActivitiesMap
   * @property {Array<Activity>} $day $day is an integer between 1 - 31
   * @property {Array<Activity>} loose Activities without a valid schedule.day property
   *
   * @typedef {Object} MonthsAndDaysToActivitiesTree
   * @property {DaysToActivitiesMap} $month $month is an integer between 1 - 12
   * @property {Array<Activity>} loose Activities without a valid schedule.month property
   *
   * @typedef {Object} ScheduleToActivitiesTree Multi-level object containing arrays of Activities with year, month, and day from "schedule" property as keys (or "loose" if some or all of these properties are omitted)
   * @property {MonthsAndDaysToActivitiesTree} $year A 4 digit integer
   * @property {Array<Activity>} loose Activities without a valid schedule.year property
   */

  const ACTIVITIES_STORAGE_KEY = "activities";
  const uniqueIds = new Set();
  // Manage local storage
  /**
   * Set (or clear) local storage
   * @param {ScheduleToActivitiesTree?} schedulePropertiesMappedToActivityObjects - If non-object then an empty object is saved.
   */
  const setActivitiesStore = (schedulePropertiesMappedToActivityObjects) => {
    if (!helperLibrary.isObject(schedulePropertiesMappedToActivityObjects)) {
      localStorage.setItem(ACTIVITIES_STORAGE_KEY, JSON.stringify({}));
      return;
    }
    localStorage.setItem(ACTIVITIES_STORAGE_KEY, JSON.stringify(schedulePropertiesMappedToActivityObjects));
  }
  /**
   * Read local storage and return its contents, or throw error if contents corrupted.
   * @returns {ScheduleToActivitiesTree}
   */
  const getActivitiesStore = () => {
    let loadedData = JSON.parse(localStorage.getItem(ACTIVITIES_STORAGE_KEY));
    if (loadedData === null) // uninitialized local storage
      return {};
    else if (!helperLibrary.isObject(loadedData))
      throw new TypeError("Local storage data is non-object")
    return loadedData;
  }
  // Manage data structures
  /**
   * Traverse through "scheduleTree" and collect any Activities. Traverses from earliest scheduled Activity to latest (then "loose").
   * @param {ScheduleToActivitiesTree} scheduleTree
   * @returns {Array<Activity>}
   */
  function flattenScheduleTreeToActivitiesArray (scheduleTree) {
    let activitiesArray = [];
    recurseAndPushActivities(scheduleTree, activitiesArray);
    return activitiesArray;

    /** Iterate over values of "obj", recursing if another object is found or pushing values to "arr" if an array is found. */
    function recurseAndPushActivities(obj, arr) {
      Object.values(obj).map( (value) => {
        if (helperLibrary.isObject(value)) {
          recurseAndPushActivities(value, arr);
        }
        if (Array.isArray(value)) {
          arr.push(...value);
        }
      });
    }
  }
  /**
   * Insert an Activity into a ScheduleToActivitiesTree.
   * Ensure all branches of tree exist before insertion.
   * @param {ScheduleToActivitiesTree} tree
   * @param {Activity} activity
   * @returns {number} - length of array that Activity was added into
   */
  function insertActivityIntoScheduleTree(tree, activity) {
    /**
     * Ensure an array exists in obj[key].
     * If it doesn't, create an empty one.
     */
    const ensureArrayExists = (obj, key) => {
      if (!Array.isArray(obj[key]))
        obj[key] = [];
    }
    /**
     * Ensure an object exists in obj[key].
     * If it doesn't, create it and apply
     * default preset value.
     */
    const ensureObjectExists = (obj, key) => {
      if (!helperLibrary.isObject(obj[key]))
        obj[key] = { loose: [] };
    }

    // if activity.schedule.year is undefined (or activity.schedule),
    // then insert in top-level "loose" array; no further traversal to be done
    if (typeof activity.schedule === 'undefined' ||
        !helperLibrary.isObject(activity.schedule) ||
        typeof activity.schedule.year === 'undefined') {
          ensureArrayExists(tree, "loose");
          return tree.loose.push(activity);
        }

    // Traversing tree[schedule.year]
    const schedule = activity.schedule;
    ensureObjectExists(tree, schedule.year)
    // check if year is last valid schedule property
    if (typeof schedule.month === 'undefined') {
      ensureArrayExists(tree[schedule.year], "loose");
      return tree[schedule.year].loose.push(activity);
    }
    // Traversing tree[schedule.year][schedule.month]
    ensureObjectExists(tree[schedule.year], schedule.month);
    // check if month is last valid schedule property
    if (typeof schedule.day === 'undefined') {
      ensureArrayExists(tree[schedule.year][schedule.month], "loose");
      return tree[schedule.year][schedule.month].loose.push(activity);
    }
    // Traversing tree[schedule.year][schedule.month][schedule.day]
    ensureArrayExists(tree[schedule.year][schedule.month], schedule.day)
    // assume day is last valid schedule property
    return tree[schedule.year][schedule.month][schedule.day].push(activity);
  }
  // Manage UUIDs
  /**
   * Return a string id that is unique among all those currently in localStorage. Uses private "uniqueIds" Set object to track used ids.
   * @returns {string}
   */
  function getUniqueId() {
    let id = crypto.randomUUID();
    while (uniqueIds.has(id))
      id = crypto.randomUUID();
    uniqueIds.add(id);
    return id;
  }

  // runtime parameters
  let schedulePropertiesMappedToActivityObjects, groupIdsMappedToGroupObjects,
    groupIdsMappedToActivityIds;

  schedulePropertiesMappedToActivityObjects = getActivitiesStore();
  //...groupIdsMappedToGroupObjects = Object.fromEntries(...));
  //...groupIdsMappedToActivityIds = ...

  return {
    // newActivity(activity) {},
    // updateActivity(activity, priorSchedule) {},
    // deleteActivity(id) {},
    // fetchActivitiesBySchedule(schedule) {}
    debug: {
      setActivitiesStore: setActivitiesStore,
      getActivitiesStore: getActivitiesStore,
      ACTIVITIES_STORAGE_KEY: ACTIVITIES_STORAGE_KEY
    }
  };
})();

const ViewModel  = (argumentModel) => (function (m) {
  const model = m;
  const state = {};
  const context = {};
  let updateView;
  // Change application state/context
  /**
   * Overwrite the application state based on properties of "stateChangeObject"; allowed to overwrite some or all state properties. If "stateChangeObject.contentContainers" exists, DOM will be re-rendered.
   * @param {{functionMapping?: Object, itemMapping?: Object, contentContainers?: Array<Object>}} stateChangeObject - An object containing string keys that are application state properties and appropriate values
   */
  function updateState(stateChangeObject) {
    const properties = Object.keys(stateChangeObject);
    if (properties.includes("functionMapping")) {
      if (!helperLibrary.isObject(stateChangeObject.functionMapping))
        throw new TypeError("unexpected state property type");
      state.functionMapping = stateChangeObject.functionMapping;
    }
    if (properties.includes("itemMapping")) {
      if (!helperLibrary.isObject(stateChangeObject.itemMapping))
        throw new TypeError("unexpected state property type");
      state.itemMapping = stateChangeObject.itemMapping;
    }
    if (properties.includes("contentContainers")) {
      state.contentContainers = stateChangeObject.contentContainers;
    }
  }
  /**
   * Overwrite the application context based on properties of "contextChangeObject"; allowed to overwrite some or all context properties.
   * @param {{type?: "main" | "modal", title?: string, content?: Array<Object>}} contextChangeObject - An object containing string keys that are application context properties and appropriate values
   */
  function updateContext(contextChangeObject) {
    const properties = Object.keys(contextChangeObject);
    if (properties.indexOf("type") !== -1) {
      if (typeof contextChangeObject.type !== 'string')
        throw new TypeError("unexpected context property type");
      context.type = contextChangeObject.type;
    }
    if (properties.indexOf("title") !== -1) {
      if (typeof contextChangeObject.title !== 'string')
        throw new TypeError("unexpected context property type");
      context.title = contextChangeObject.title;
    }
    if (properties.indexOf("content") !== -1) {
      //TODO: "content" validation
      context.content = contextChangeObject.content;
    }

    if (typeof updateView === 'function')
      updateView();
  }
  // Generate contexts
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
  // FunctionBar
  /**
   * Search for all members of "strsToMatch" within "str". The first occurring member of "strsToMatch" is removed from "str". Assumes all strings in "strsToMatch" are uppercase.
   * @param {string} str - The string to be searched
   * @param {Array<string>} strsToMatch - An array of strings to be searched for in "str"
   * @returns {[string, Array<string>]} - A tuple; index 0 contains "str" after the first matched string has been removed & index 1 contains an array of each matched string
   */
  function removeFirstMatchAndReturnOrderedMatches(str, strsToMatch) {
    if (!Array.isArray(strsToMatch))
      throw new TypeError("unexpected parameter type");

    str = str.toUpperCase();
    strsToMatch.sort( (a, b) => b.length - a.length ); // highest length first
    strsToMatch = strsToMatch.filter( val => str.includes(val) ); // remove strings not present in str
    strsToMatch.sort( (a, b) => str.indexOf(a) - str.indexOf(b) ); // earliest occurrence in str first
    str = str.replace(strsToMatch[0], ""); // remove earliest occurring string from str

    return [str, strsToMatch];
  }
  // Hard-coded state/context objects
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

  // Public definitions
  return {
    context: context,
    debug: {
      state: state,
      mainMenu: mainMenu
    },
    /**
     * Check for "Enter" keypress, then trim and split input string by comma (",") delimiter, then remove first matched acronym string (from state.functionMapping) in the input, then ensure remaining characters in first delimited string are digits, then execute matched user function with split input string array as arguments
     * @param {Event} event - The Event object passed from the fired event listener
     */
    handleFunctionBarKeypressEventAndExecuteUserFunction(event) {
      let inputArray = event.target.value.split(",").map(str => str.trim()); // split raw input by "," delimiter and trim trailing whitespace
      if (event.key === 'Enter') { // validate for a user function
        let matchedFunctions;
        [inputArray[0], matchedFunctions] = removeFirstMatchAndReturnOrderedMatches(inputArray[0], Object.keys(state.functionMapping));
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
    /**
     * Set the function used by the ViewModel to request a DOM update. If it has not been defined previously, then it will be executed (for initial DOM render).
     * @param {Function} func 
     */
    setUpdateView(func) {
      if (typeof updateView === 'undefined')
        func();
      updateView = func;
    }
  };
})(argumentModel);

const View = (argumentViewModel) => (function (vm) {
  const viewModel = vm;
  viewModel.setUpdateView(render);
  
  /**
   * Create a styled "h2"
   * @param {string} value - The title string to display in the heading
   * @returns {HTMLElement} - The "h2" element
   */
  function createHeading(value) {
    if (typeof value !== 'string')
      throw new TypeError("unexpected parameter type"); //TODO: implement support for Array<HTMLElement>
    const headerDiv = document.createElement("h2");
    headerDiv.innerText = value;
    return headerDiv;
  }
  /**
   * Return a div containing an HTML table element based on an array of arrays, accepting a single-layer array for the columns and a two-layer array for the data 
   * @param {Array<string>} cols - An array of strings to name the table columns
   * @param {Array<Array<string>>} data - A two-layer array containing strings within; for a symmetric, gap-less table, the length of every inner array should be equal to that of "cols"
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
    const container = document.createElement("div");
    if (typeof title === 'string')
      container.appendChild(createHeading(title));
    container.insertAdjacentHTML("beforeend", tableHTML);
    return container;
  }
  /**
   * Return an HTML div element containing parameter information, based on an array of arrays detailing their names, visual string indexes, and CSS id attributes
   * @param {Array<Array<string>} parameterData - Two-layer array; the inner arrays must contain either a single string value or 3 values, where the first index is a string corresponding to the name of the parameter, the second index is a string that is the visual index value of the parameter, and the third index is a string that is the id CSS attribute of the input element for the parameter
   * @returns {HTMLElement}
   */
  function parametersContainer(parameterData) {
    // validate argument
    if (!Array.isArray(parameterData))
      throw new TypeError("unexpected parameter type");
    for (const element of parameterData) {
      if (!Array.isArray(element) || element.length === 2 || element.length > 3)
        throw new TypeError("unexpected parameter type");
    };

    const container = document.createElement("div");
    container.classList.add("parameters-container");
    for (const parameter of parameterData) {
      const parameterDiv = document.createElement("div");
      parameterDiv.classList.add("parameter");
      const label = document.createElement("p");
      label.innerText = parameter.length === 3 ? `${parameter[1]}. ${parameter[0]}` : label.innerText = parameter[0];
      parameterDiv.appendChild(label);
      if (parameter.length === 3) {
        const input = document.createElement("input");
        input.type = "text";
        input.setAttribute("id", parameter[2]);
        parameterDiv.appendChild(input);
      }
      container.appendChild(parameterDiv);
    }
    return container;
  }
  /**
   * Accept "content" property of application context and return the appropriately formatted HTMLElement to display as the main content
   * @param {Array} content
   * @returns {HTMLElement}
   */
  function createContentDiv(content) {
    //TODO: iterate "content" to support multiple containers in one context
    const container = content[0];
    if (container.type === "table")
      return tableContainer(container.columnNames, container.data, container.title);
    if (container.type === "parameters")
      return parametersContainer(container.data);
    throw new TypeError("unexpected parameter type");
  }
  /**
   * Create HTML elements for the FunctionBar component and attach a "keypress" listener to validate and execute on input (via a ViewModel callback function)
   * @returns {HTMLElement} - The "div" element, containing the "input" element
   */
  function createFunctionBarAndAttachKeyPressHandler() {
    // Create necessary HTMLElements
    const div = document.createElement("div");
    div.classList.add("function-bar");
    const input = document.createElement("input");
    input.type = "text";
    div.appendChild(input);
    // Set up event listener
    input.addEventListener("keypress", viewModel.handleFunctionBarKeypressEventAndExecuteUserFunction);
  
    return div;
  }

  /**
   * Draw the current application context to the screen. Remove all elements from the current context div (determined by "type" context property) before drawing
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
    contextDiv.appendChild(createHeading(viewModel.context.title));
    contextDiv.appendChild(createContentDiv(viewModel.context.content));
    const funcBar = createFunctionBarAndAttachKeyPressHandler(); // define as variable to set cursor focus
    contextDiv.appendChild(funcBar);
    funcBar.firstChild.focus();
  }

})(argumentViewModel);


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

// Define module exports else initialize application when run as main script
if (typeof exports === 'object') {
  exports.Model = Model;
  exports.ViewModel = ViewModel;
  exports.View = View;
} else {
  const viewModel = ViewModel(Model);
  const view = View(viewModel);
}