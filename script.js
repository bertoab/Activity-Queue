/**
 * Creates HTML elements for the FunctionBar component, attaches the appropriate listener to validate and execute on input based on FunctionMapping and ItemMapping parameters, and returns the div HTMLElement.
 * @param {Object} ItemMapping - the keys must be case-insensitive expected user input strings, and the values must be valid parameters for functions in "FunctionMapping"
 * @param {Object} FunctionMapping - the keys must be case-insensitive expected user input strings, and the values must be functions with uses relevant to the current state of context
 */
const FunctionBar = function(FunctionMapping, ItemMapping) {
  // Create necessary HTMLElements
  const div = document.createElement("div");
  div.classList.add("function-bar");
  const input = document.createElement("input");
  input.type = "text";
  div.appendChild(input);

  // Set up event listener
  const expectedFunctionInputs = Object.keys(FunctionMapping);
  //const MaxExpectedFunctionInputLength = Math.max(expectedFunctionInputs.map((str) => str.length));
  const expectedItemInputs = typeof ItemMapping === 'object' ? Object.keys(ItemMapping) : undefined;

  function searchForMatches(str, expectedInputStringArray) {
    if (!Array.isArray(expectedInputStringArray))
      return alert("Error: not an array!");

    const matched = [];
    let searchIndex;
    str = str.toLowerCase();
    expectedInputStringArray = expectedInputStringArray.map(expectedInputString => expectedInputString.toLowerCase());
    expectedInputStringArray.forEach(expectedInput => {
      searchIndex = str.indexOf(expectedInput);
      if (searchIndex != -1) {
        str = str.substring(searchIndex + expectedInput.length);
        matched.push(expectedInput);
      }
    });
    return [str, matched];
  }

  input.addEventListener("keypress", function(e) {
    let userInput = input.value, matchedFunctions, matchedItems;
    if (e.key === 'Enter') { // validate for a function
      [userInput, matchedFunctions] = searchForMatches(userInput, expectedFunctionInputs);
      if (matchedFunctions.length !== 0) {
        if(expectedItemInputs) {
          [userInput, matchedItems] = searchForMatches(userInput, expectedItemInputs);
          FunctionMapping[matchedFunctions[0]](...matchedItems);
        } else {
          FunctionMapping[matchedFunctions[0]]();
        }
      }
    }
  });

  return div;
}

// Render main menu options
const cols = ["Index", "Options"];
const data = [ ["Add task"], ["View history"], ["View archived"] ].map((element, index) => [index + 1, element]);
document.getElementById("main-body").appendChild(contentTable(cols, data));

// Render FunctionBars using function 
const MainDefaultFunctionMap = {
  "1": () => document.getElementById("modal-container").style.display = "flex",
  "2": () => alert("You selected: View history"),
  "3": () => alert("You selected: View archived")
};
document.getElementById("main").appendChild(FunctionBar(MainDefaultFunctionMap));

const ModalDefaultFunctionMap = {
  "1": () => document.getElementById("name-field").focus(),
  "2": () => document.getElementById("group-field").focus(),
  "3": () => document.getElementById("priority-field").focus()
};
document.getElementsByClassName("modal")[0].appendChild(FunctionBar(ModalDefaultFunctionMap));

// Returns an HTML table element based on an array of arrays, where the length of the inner arrays correspond to the number of columns for the table (excluding the "Index" column)
function contentTable(cols, data) {
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
  const temp = document.createElement("div");
  temp.innerHTML = tableHTML;
  return temp.firstChild;
}

// Manage local storage (writing, reading)
const STORAGE_KEY = "activities";
/**
 * Set (or clear) local storage
 * @param {Array<Object>} activities - Array of activities to save locally. If non-array then an empty array is saved. 
 */
function setStore(activities) {
  if (!Array.isArray(activities)) {
    localStorage.setItem(STORAGE_KEY, []);
    return
  }
  localStorage.setItem(STORAGE_KEY, activities);
}
/**
 * Read local storage and return it's contents, or empty array if contents corrupted.
 * @returns {Array<Object>} - Array of activities sorted in order determined by last user-set sort mode.
 */
function getStore() {
  let data = localStorage.getItem(STORAGE_KEY);
  if (data === null) // uninitialized local storage
    data = [];
  if (!Array.isArray(data))
    throw TypeError("Local storage data is non-array")
  return data;
}

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