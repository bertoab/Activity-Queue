const inputField = document.getElementById("input-field");
const modalField = document.getElementById("parameter-index");

// Generate menu options
const tempDiv = document.createElement("div");
const cols = ["Options"];
const data = [ ["Add task"], ["View history"], ["View archived"]]
tempDiv.innerHTML = generateTable(cols, data);
document.getElementsByClassName("main-container")[0].appendChild(tempDiv.firstChild);

inputField.addEventListener("keypress", function(e) { // validate and execute on main function bar input
  if (e.key === 'Enter') {
    const index = parseInt(inputField.value); // asserts that we have an integer; TODO: change this into a more tailored validation function
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

modalField.addEventListener("keypress", function(e) { // validate and execute on modal function bar input
  if (e.key === 'Enter') {
    var index = parseInt(document.getElementById("parameter-index").value); // asserts that we have an integer; TODO: change this into a more tailored validation function
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

// a function that generates an indexed-table based on an array of arrays, where the length of the inner arrays correspond to the number of columns for the table (excluding the "Index" column)
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
        <td>${i + 1}</td>`;
    for (let j = 0; j < data[i].length; j++) {
      tableHTML += `<td>${data[i][j]}</td>`;
    }
    tableHTML += `</tr>`;
  }
  tableHTML += `</tbody>
  </table>`;
  return tableHTML;
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