/** @type {(argumentViewModel: import("../types").ViewModel) => import("../types").View} */
export const View = (argumentViewModel) => (function (vm) {
  const viewModel = vm;
  /** @type {import("../types").View.Private.createHeading} */
  function createHeading(value) {
    if (typeof value !== 'string')
      throw new TypeError("unexpected parameter type"); //TODO: implement support for Array<HTMLElement>
    const headerDiv = document.createElement("h2");
    headerDiv.innerText = value;
    return headerDiv;
  }
  /** @type {import("../types").View.Private.createTableContainer} */
  function createTableContainer(cols, data, title) {
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
  /** @type {import("../types").View.Private.createParametersContainer} */
  function createParametersContainer(parameterData) {
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
  /** @type {import("../types").View.Private.createPaginationInfo} */
  function createPaginationInfo(currentPage, lastPossiblePage) {
    if (typeof currentPage !== 'string')
      currentPage = "1";
    if (typeof lastPossiblePage !== 'string')
      lastPossiblePage = "1";
    const paginationDiv = document.createElement("div");
    paginationDiv.classList.add("paginationInfo");
    const infoSpan = document.createElement("span");
    const text = `Page ${currentPage} of ${lastPossiblePage}`;
    infoSpan.innerText = text;
    paginationDiv.appendChild(infoSpan);
    return paginationDiv;
  }
  /** @type {import("../types").View.Private.createContentDiv} */
  function createContentDiv(content) {
    //TODO: iterate "content" to support multiple containers in one DOMContext
    const container = content[0];
    let containerDOMElement;
    if (container.type === "table") {
      containerDOMElement = createTableContainer(container.columnNames, container.data, container.title);
    } else if (container.type === "parameters") {
      containerDOMElement = createParametersContainer(container.data);
    } else {
      throw new TypeError("unexpected parameter type");
    }
    if (typeof container.currentPageNumber === 'string' && typeof container.lastPageNumber === 'string')
      containerDOMElement.appendChild(createPaginationInfo(container.currentPageNumber, container.lastPageNumber));
    return containerDOMElement;
  }
  /** @type {import("../types").View.Private.createPaginationInfo} */
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

  /** @type {import("../types").View.Private.render} */
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

  viewModel.setUpdateView(render); // also triggers initial render
})(argumentViewModel);
