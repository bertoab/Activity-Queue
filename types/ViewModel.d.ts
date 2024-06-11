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
    functionMapping: FunctionMapping;
    itemMapping: ItemMapping;
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
     * Set State.functionMapping to configure
     * FunctionBar user functions.
     */
    function useFunctionState(functionMapping: FunctionMapping): void;
    /**
     * Set State.itemMapping to configure
     * FunctionBar items for user functions.
     */
    function useItemState(itemMapping: ItemMapping): void;
    /**
     * Overwrite the application State based on
     * properties of "StateChangeObject";
     * allowed to overwrite all State properties
     * except "itemMapping" and "functionMapping".
     * Application DOMContext will be regenerated
     * and the DOM will be re-rendered.
     * @param StateChangeObject - An object containing string keys that are application State properties and appropriate values
     */
    function updateState(StateChangeObject: {type: ValidContextType, title?: string, content: Array<StateContainer>}): void;

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
     * Use first and second indices of each inner
     * array of "data" property to create a key
     * (first index) to value (second index)
     * association for an ItemMapping.
     */
    function createItemMappingFromContainerData(data: Container["data"]): ItemMapping;
    /**
     * Generate a deep copy of "data" using JSON
     * API (all "data" values must be JSON
     * compatible). Conditionally prefix datum
     * with a string index as deteremined by
     * "startingVisualIndex".
     * @param startingVisualIndex - If non-string value, "data" is returned without any copy or changes.
     */
    function generateContainerDataIndices (data: Container["data"], startingVisualIndex: StateContainer["startingVisualIndex"]): DOMContainer["data"];
    /**
     * Conditionally modify "data" property and
     * State.itemMapping as according to
     * parameters. Translations for non-literal
     * datum will be done by interpreting the 0th
     * index as a string ID value for an Activity;
     * Model is used to fetch corresponding object
     * for property information.
     */
    function configureTableContainerData(data: Container["data"], isLiteralData: StateContainer.isLiteralData, startingVisualIndex: StateContainer.startingVisualIndex, propertyNames: TableStateContainer.propertyNames): TableDOMContainer["data"];
    /**
     * Use "stateContainer" to create a
     * DOMContainer, and update
     * State.functionMapping and State.itemMapping.
     */
    function initializeDOMContainer(stateContainer: StateContainer): DOMContainer;
    /**
     * Return a State object for an error.
     * The State is a modal type with
     * the title "Error" and the passed
     * message as the content.
     * @param message - The error message to be displayed
     */
    function errorState(message: string): State;
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
