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
   * Traverse through "scheduleTree" and collect any Activities. Traverses from earliest scheduled Activity to latest (then "loose"). Sorted with event occurring earliest in time at the beginning of the array. If any non-undefined value is present for the "latestFirst" parameter, the sorting order is reversed.
   * @param {ScheduleToActivitiesTree} scheduleTree
   * @param {undefined | true} latestFirst
   * @returns {Array<Activity>}
   */
  function flattenScheduleTreeToActivitiesArray (scheduleTree, latestFirst) {
    let activitiesArray = [];
    recurseAndPushActivities(scheduleTree, activitiesArray);
    return typeof latestFirst === 'undefined' ? activitiesArray : activitiesArray.reverse();

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
   * Find and return a reference to a position within "scheduleTree" as described in "schedule". If a reference leading up to and including the final position as described in "schedule" is not defined within "scheduleTree", behavior depends on value of "fillGaps".
   * @param {ScheduleToActivitiesTree} scheduleTree
   * @param {Schedule | undefined} schedule
   * @param {true | undefined} fillGaps - If non-undefined value, then causes function to create empty objects/arrays where they are missing in "scheduleTree" (otherwise, a TypeError is thrown for property access on undefined)
   * @returns {Array<Activity> | DaysToActivitiesMap | MonthsAndDaysToActivitiesTree | ScheduleToActivitiesTree | undefined}
   */
  function findPositionInScheduleTree(scheduleTree, schedule, fillGaps) {
    // validate schedule, schedule["year"], and scheduleTree[schedule.year]
    if (typeof schedule === 'undefined' ||
        !helperLibrary.isObject(schedule) ||
        typeof schedule.year === 'undefined') {
      return scheduleTree;
    }
    if (typeof scheduleTree[schedule.year] === 'undefined'
        && typeof fillGaps !== 'undefined') {
      scheduleTree[schedule.year] = {};
    }
    // validate schedule["month"] and scheduleTree[schedule.year][schedule.month]
    if (typeof schedule.month === 'undefined') {
      return scheduleTree[schedule.year];
    }
    if (typeof scheduleTree[schedule.year][schedule.month] === 'undefined'
        && typeof fillGaps !== 'undefined') {
      scheduleTree[schedule.year][schedule.month] = {};
    }
    // validate schedule["day"] and scheduleTree[schedule.year][schedule.month][schedule.day]
    if (typeof schedule.day === 'undefined') {
      return scheduleTree[schedule.year][schedule.month];
    }
    if (typeof scheduleTree[schedule.year][schedule.month][schedule.day] === 'undefined'
        && typeof fillGaps !== 'undefined') {
      scheduleTree[schedule.year][schedule.month][schedule.day] = []; // array is expected here, rather than tree
    }
    return scheduleTree[schedule.year][schedule.month][schedule.day];
  }
  /**
   * Traverse the "scheduleTree" parameter using fields found in the "schedule" parameter to return a corresponding Activity array. If a branch of "scheduleTree" is missing along the way, behavior depends on value of "fillGaps".
   * @param {ScheduleToActivitiesTree} scheduleTree
   * @param {Schedule | undefined} schedule
   * @param {true | undefined} fillGaps - If non-undefined value, then causes function to create empty arrays/objects where they are missing in "scheduleTree" (otherwise, a TypeError is thrown for property retrieval on undefined)
   * @returns {Array<Activity>} a reference encapsulated within "scheduleTree"
   */
  function findActivityArray(scheduleTree, schedule, fillGaps) {
    const treePosition = findPositionInScheduleTree(scheduleTree, schedule, fillGaps);
    if (Array.isArray(treePosition)) {
      return treePosition;
    }
    if (helperLibrary.isObject(treePosition)) {
      if (typeof treePosition["loose"] === 'undefined' && typeof fillGaps !== 'undefined')
        treePosition["loose"] = [];
      return treePosition["loose"];
    }
    throw new TypeError("Position in scheduleTree is invalid type");
  }
  /**
   * Insert an Activity into a ScheduleToActivitiesTree.
   * Ensure all branches of tree exist before insertion.
   * @param {ScheduleToActivitiesTree} tree
   * @param {Activity} activity
   * @returns {number} - length of array that Activity was added into
   */
  function insertActivityIntoScheduleTree(tree, activity) {
    return findActivityArray(tree, activity.schedule, true).push(activity);
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

  // load Activity data, then iterate and record each id
  // this helps ensure uniqueness in runtime-generated UUIDs
  schedulePropertiesMappedToActivityObjects = getActivitiesStore();
  flattenScheduleTreeToActivitiesArray(schedulePropertiesMappedToActivityObjects).map( Activity => uniqueIds.add(Activity.id) );

  //...groupIdsMappedToGroupObjects = Object.fromEntries(...));
  //...groupIdsMappedToActivityIds = ...

  return {
    /**
     * Add a new Activity to local storage as well as the "schedulePropertiesMappedToActivityObjects" runtime parameter
     * @param {Activity} activity 
     */
    newActivity(activity) {
      activity.id = getUniqueId();
      // update runtime parameter
      insertActivityIntoScheduleTree(schedulePropertiesMappedToActivityObjects, activity);
      // save local storage
      setActivitiesStore(schedulePropertiesMappedToActivityObjects);
    },
    // updateActivity(activity, priorSchedule) {},
    /**
     * Delete an Activity object from local storage as well as the "schedulePropertiesMappedToActivityObjects" runtime parameter
     * @param {string} id - "id" property of Activity to be deleted
     */
    deleteActivity(id) {
      // find Activity object in ScheduleToActivitiesTree
      let allActivitiesArray = flattenScheduleTreeToActivitiesArray(schedulePropertiesMappedToActivityObjects);
      let activity = allActivitiesArray.find( searchActivity => searchActivity.id === id ); // worst case time complexity: O(n), where n is the total number of Activities in "schedulePropertiesMappedToActivityObjects"
      // find Activity's array index
      let activityArrayInScheduleTree = findActivityArray(schedulePropertiesMappedToActivityObjects, activity.schedule);
      let activityIndex = activityArrayInScheduleTree.findIndex( searchActivity => searchActivity.id === activity.id ); // worst case time complexity: O(m), where m is the total number of Activities in the corresponding Activity array within "schedulePropertiesMappedToActivityObjects"
      // delete Activity
      activityArrayInScheduleTree.splice(activityIndex, 1); // worst case time complexity: O(m)
       // save local storage
      setActivitiesStore(schedulePropertiesMappedToActivityObjects);
    },
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
  const State = {};
  const DOMContext = {};
  let updateView;
  // Change application State/DOMContext
  /**
   * Overwrite the application State based on properties of "StateChangeObject"; allowed to overwrite some or all State properties. If "StateChangeObject.contentContainers" exists, DOM will be re-rendered.
   * @param {{functionMapping?: Object, itemMapping?: Object, contentContainers?: Array<Object>}} StateChangeObject - An object containing string keys that are application State properties and appropriate values
   */
  function updateState(StateChangeObject) {
    const properties = Object.keys(StateChangeObject);
    if (properties.includes("functionMapping")) {
      if (!helperLibrary.isObject(StateChangeObject.functionMapping))
        throw new TypeError("unexpected State property type");
      State.functionMapping = StateChangeObject.functionMapping;
    }
    if (properties.includes("itemMapping")) {
      if (!helperLibrary.isObject(StateChangeObject.itemMapping))
        throw new TypeError("unexpected State property type");
      State.itemMapping = StateChangeObject.itemMapping;
    }
    if (properties.includes("contentContainers")) {
      State.contentContainers = StateChangeObject.contentContainers;
    }
  }
  /**
   * Overwrite the application DOMContext based on properties of "DOMContextChangeObject"; allowed to overwrite some or all DOMContext properties.
   * @param {{type?: "main" | "modal", title?: string, content?: Array<Object>}} DOMContextChangeObject - An object containing string keys that are application DOMContext properties and appropriate values
   */
  function updateDOMContext(DOMContextChangeObject) {
    const properties = Object.keys(DOMContextChangeObject);
    if (properties.indexOf("type") !== -1) {
      if (typeof DOMContextChangeObject.type !== 'string')
        throw new TypeError("unexpected DOMContext property type");
      DOMContext.type = DOMContextChangeObject.type;
    }
    if (properties.indexOf("title") !== -1) {
      if (typeof DOMContextChangeObject.title !== 'string')
        throw new TypeError("unexpected DOMContext property type");
      DOMContext.title = DOMContextChangeObject.title;
    }
    if (properties.indexOf("content") !== -1) {
      //TODO: "content" validation
      DOMContext.content = DOMContextChangeObject.content;
    }

    if (typeof updateView === 'function')
      updateView();
  }
  // Generate DOMContexts
  /**
   * Return a DOMContext object for an error. The DOMContext is a modal type with the title "Error" and the passed message as the content.
   * @param {string} message - The error message to be displayed
   * @returns {{type: "modal", title: "Error", content: message}}
   */
  function errorDOMContext(message) {
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
  // Hard-coded State/DOMContext objects
  const mainMenu = {
    State: {
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
    DOMContext: {
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
  // initialize State to main menu DOMContext
  updateDOMContext(mainMenu.DOMContext);
  updateState(mainMenu.State);

  // Public definitions
  return {
    DOMContext: DOMContext,
    debug: {
      State: State,
      mainMenu: mainMenu
    },
    /**
     * Check for "Enter" keypress, then trim and split input string by comma (",") delimiter, then remove first matched acronym string (from State.functionMapping) in the input, then ensure remaining characters in first delimited string are digits, then execute matched user function with split input string array as arguments
     * @param {Event} event - The Event object passed from the fired event listener
     */
    handleFunctionBarKeypressEventAndExecuteUserFunction(event) {
      let inputArray = event.target.value.split(",").map(str => str.trim()); // split raw input by "," delimiter and trim trailing whitespace
      if (event.key === 'Enter') { // validate for a user function
        let matchedFunctions;
        [inputArray[0], matchedFunctions] = removeFirstMatchAndReturnOrderedMatches(inputArray[0], Object.keys(State.functionMapping));
        if (matchedFunctions.length !== 0) {
          if (inputArray[0] === "")
            inputArray.shift();
          else { // ensure remaining string of inputArray[0] contains digits (0-9)
            for (let i = 0; i < inputArray[0].length; i++)
              if (inputArray[0].charCodeAt(i) < 48 || inputArray[0].charCodeAt(i) > 57)
                return updateDOMContext(errorDOMContext("Invalid Input"));
          }
          State.functionMapping[matchedFunctions[0]](...inputArray);
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
   * Accept "content" property of application DOMContext and return the appropriately formatted HTMLElement to display as the main content
   * @param {Array} content
   * @returns {HTMLElement}
   */
  function createContentDiv(content) {
    //TODO: iterate "content" to support multiple containers in one DOMContext
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
   * Draw the current application DOMContext to the screen. Remove all elements from the current DOMContext div (determined by "type" DOMContext property) before drawing
   */
  function render() {
    // select DOMContext div
    let DOMContextDiv;
    if (viewModel.DOMContext.type === "main") {
      DOMContextDiv = document.getElementById("main");
      document.getElementById("modal-container").style.display = "none";
    } else if (viewModel.DOMContext.type === "modal") {
      DOMContextDiv = document.getElementById("modal");
      document.getElementById("modal-container").style.display = "flex";
    }
    if (DOMContextDiv === undefined)
      throw new Error("DOMContext div not selectable");
    // remove existing components
    while (DOMContextDiv.firstChild)
      DOMContextDiv.removeChild(DOMContextDiv.firstChild);
    // draw
    DOMContextDiv.appendChild(createHeading(viewModel.DOMContext.title));
    DOMContextDiv.appendChild(createContentDiv(viewModel.DOMContext.content));
    const funcBar = createFunctionBarAndAttachKeyPressHandler(); // define as variable to set cursor focus
    DOMContextDiv.appendChild(funcBar);
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