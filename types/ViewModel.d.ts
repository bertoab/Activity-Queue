export declare namespace ViewModel {
  /**
   * Valid values of "type" property for Container.
   * Indicates the format of "data" and other Container
   * properties.
   */
  type ValidContainerType = "table";
  /**
   * Valid values of "type" property of State or
   * DOMContext. Defines the DOM output div.
   * The default value is "main".
   */
  type ValidContextType = "main" | "modal";
  /**
   * Maps keys as literal strings to be parsed from
   * user input (via FunctionBar) to a value which
   * is a corresponding function to execute. Keys
   * must be uppercase alphabetical characters.
   */
  interface FunctionMapping {
    [x: string]: Function;
  }
  /**
   * Maps keys as literal strings to be parsed from
   * user input (via FunctionBar) to a value which
   * references (or is itself) a corresponding item
   * for the program or a user function to act upon.
   * Keys must be integers or uppercase alphabetical
   * characters.
   */
  interface ItemMapping {
    [x: string]: any;
  }
  /**
   * Holds back-end or front-end information about
   * a specific content segment of application state.
   */
  interface Container {
    type: ValidContainerType;
    title?: string;
    data: Array<Array<string>>;
  }
  /**
   * Holds information used to generate a DOMContainer
   * and determine FunctionBar behavior.
   * Manipulated by ViewModel.
   */
  interface StateContainer extends Container {
    functions: FunctionMapping;
    items: ItemMapping;
    /**
     * Determine whether "data" property has literal
     * values for building "data" property in
     * DOMContainer, or if lookups using Model are
     * required. A non-true value indicates that
     * "data" is non-literal.
     */
    isLiteralData?: true;
    /**
     * Define the literal index of the first item
     * in "data". Can be any integer or a single
     * alphabetical character. May also be used to
     * assign "data" references in "itemMapping".
     */
    startingVisualIndex?: string;
    /**
     * An integer defining the programmatic index
     * (starting at 0) of the current page as set
     * to be rendered in DOMContainer. A non-number
     * value indicates that the DOMContainer should
     * be rendered on the first (index = 0) page.
     */
    currentPageIndex?: number;
    /**
     * An integer defining the maximum number of
     * "data" items on a single DOMContainer page.
     * A non-number value indicates that there
     * should be no limit of items per page.
     */
    maxPageItems?: number;
  }
  /**
   * Holds information ready to be rendered in the DOM.
   * Parsed by View to display content.
   */
  interface DOMContainer extends Container {
    /**
     * A string representation of the current page,
     * as intended to be rendered to the DOM.
     */
    currentPageNumber?: string;
    /**
     * A string representation of the last possible
     * page, as intended to be rendered to the DOM.
     */
    lastPageNumber?: string;
  }
  interface TableContainer {
    /**
     * Contains the string names of each column to
     * be rendered to the DOM.
     */
    columnNames: Array<string>;
  }
  interface TableStateContainer extends StateContainer, TableContainer {
    /**
     * Contains the string keys of each property
     * to access for objects looked up in cases
     * where "isLiteralData" is non-true (false).
     * Must be correctly defined if "isLiteralData"
     * is a non-true value. Indices and length
     * must match with those of "columnNames".
     */
    propertyNames?: Array<string>;
  }
  type TableDOMContainer = DOMContainer & TableContainer;
  /**
   * Back-end information used to keep track of
   * current content and available user interactions.
   */
  interface State {
    type: ValidContextType;
    title?: string;
    content: Array<StateContainer>;
  }
  /**
   * Front-end information used to render current
   * content to the DOM.
   */
  interface DOMContext {
    type: ValidContextType;
    title?: string;
    content: Array<DOMContainer>;
  }
  namespace Private {
    // Manage application State/DOMContext
    /**
     * Overwrite the application State based on
     * properties of "StateChangeObject";
     * allowed to overwrite some or all State properties.
     * If "StateChangeObject.contentContainers" exists,
     * DOM will be re-rendered.
     * @param StateChangeObject - An object containing string keys that are application State properties and appropriate values
     */
    function updateState(StateChangeObject: {functionMapping?: FunctionMapping, itemMapping?: ItemMapping, contentContainers?: Array<StateContainer>}): void;
    /**
     * Overwrite the application DOMContext based on
     * properties of "DOMContextChangeObject";
     * allowed to overwrite some or all DOMContext properties.
     * @param DOMContextChangeObject - An object containing string keys that are application DOMContext properties and appropriate values
     */
    function updateDOMContext(DOMContextChangeObject: {type?: ValidContextType, title?: string, content?: Array<DOMContainer>}): void;

    // FunctionBar input utilities
    /**
     * Search for all members of "strsToMatch"
     * within "str". The first occurring member
     * of "strsToMatch" is removed from "str".
     * Assumes all strings in "strsToMatch" are uppercase.
     * @param str - The string to be searched
     * @param strsToMatch - An array of strings to be searched for in "str"
     * @returns A tuple; index 0 contains "str" after the first matched string has been removed & index 1 contains an array of each matched string
     */
    function removeFirstMatchAndReturnOrderedMatches(str: string, strsToMatch: Array<string>): [string, Array<string>];

    // Generate State/DOMContext objects
    /**
     * Return a DOMContext object for an error.
     * The DOMContext is a modal type with
     * the title "Error" and the passed
     * message as the content.
     * @param message - The error message to be displayed
     */
    function errorDOMContext(message: string): {type: "modal", title: "Error", message: string};
  }
  /**
   * Check for "Enter" keypress, then trim and split
   * input string by comma (",") delimiter, then remove
   * first matched acronym string (from State.functionMapping)
   * in the input, then ensure remaining characters
   * in first delimited string are digits,
   * then execute matched user function with
   * split input string array as arguments
   * @param event - The Event object passed from the fired event listener
   */
  function handleFunctionBarKeypressEventAndExecuteUserFunction(event: Event): void;
  /**
   * Set the function used by the ViewModel to request a DOM update. If it has not been defined previously, then it will be executed (for initial DOM render).
   */
  function setUpdateView(func: Function): void;
}
