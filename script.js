// Variables for each function bar input
const mainLine = document.getElementById("main-cmd");
const modalLine = document.getElementById("modal-cmd");

// Render main menu options
const tableDiv = document.createElement("div");
const cols = ["Options"];
const data = [ ["Add task"], ["View history"], ["View archived"]]
tableDiv.innerHTML = generateTable(cols, data);
document.getElementsByClassName("main-container")[0].appendChild(tableDiv.firstChild);

// Listener to validate and execute on main function bar input
mainLine.addEventListener("keypress", function(e) {
  if (e.key === 'Enter') {
    const index = parseInt(mainLine.value); // asserts that we have an integer; TODO: change this into a more tailored validation function
    switch (index) {
      case 1:
        document.getElementById("modal-container").style.display = "flex";
        break;
      case 2:
        alert("You selected: View history");
        break;
      case 3:
        alert("You selected: View archived");
        break;
      default:
        alert("Invalid index");
        break;
    }
  }
});

// Listener to validate and execute on modal function bar input
modalLine.addEventListener("keypress", function(e) {
  if (e.key === 'Enter') {
    var index = parseInt(modalLine.value); // asserts that we have an integer; TODO: change this into a more tailored validation function
    switch (index) {
      case 1:
        document.getElementById("name-field").focus();
        break;
      case 2:
        document.getElementById("group-field").focus();
        break;
      case 3:
        document.getElementById("priority-field").focus();
        break;
      default:
        alert("Invalid index");
    }
  }
});

// Generates an HTML string for an indexed-table based on an array of arrays, where the length of the inner arrays correspond to the number of columns for the table (excluding the "Index" column)
function generateTable(cols, data) {
  let tableHTML = `<table>
    <thead>
      <tr>
        <th>Index</th>`;
  for (let i = 0; i < cols.length; i++) {
    tableHTML += `<th>${cols[i]}</th>`;
  }
  tableHTML += `</tr>
    </thead>
    <tbody>`;
  for (let i = 0; i < data.length; i++) {
    tableHTML += `<tr>
        <td>${i + 1}</td>`; // write the index into the first column of each data row
    for (let j = 0; j < data[i].length; j++) {
      tableHTML += `<td>${data[i][j]}</td>`;
    }
    tableHTML += `</tr>`;
  }
  tableHTML += `</tbody>
  </table>`;
  return tableHTML;
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