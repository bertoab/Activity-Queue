import { Model } from "./Model";

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
     * Used to describe non-literal data to be
     * fetched from the Model.
     */
    dataScope?: Model.ActivityScope;
    /**
     * Synchronize "data" property with the most
     * updated information provided by Model.
     * Must only be defined where "isLiteralData"
     * property is not a value of "true".
     */
    synchronizeData?: () => void;
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
     * If "StateChangeObject" is "undefined", will
     * only synchronize current StateContainers'
     * "data" property with Model. Otherwise, if
     * "StateChangeObject" is an object, will
     * conditionally overwrite the application
     * State based on properties of "StateChangeObject";
     * allowed to overwrite all State properties
     * except "itemMapping" and "functionMapping".
     * On every call, application DOMContext will
     * be regenerated and the DOM will be re-rendered.
     * @param StateChangeObject - Either an object containing string keys that are application State properties and appropriate values, or a value of "undefined".
     */
    function updateState(StateChangeObject: {type: ValidContextType, title?: string, content: Array<StateContainer>} | undefined): void;

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
    /**
     * Parse "input" to generate a Schedule value.
     * All Schedule fields can be entered explicitly
     * using "DDMMYYHHMM" format: day, month, year (suffix;
     * assumes 21st century), hour (assumes 24-hour),
     * minute. Otherwise, there are various formats to
     * enter partial information. Only one partial format
     * can be parsed for each call. Where a date value is
     * absent, the current day according to system time
     * is assumed.
     *
     * Dates: (no time values are assumed)
     * - DDMM : specify day ("DD") and month ("MM"), each in 2-digit format (single digit values must be zero-padded)
     * - XX"D" : specify number of days in the future ("XX"; up to 2 digits) from current system date; must be followed by "D" literal character
     * - XX"N" : specify number of months in the future ("XX"; up to 2 digits) from current system date; must be followed by "N" literal character
     * - XX"Y" : specify number of years in the future ("XX"; up to 2 digits) from current system date; must be followed by "Y" literal character
     *
     * Times: (all relative to current system date)
     * - HHMM["A"|"P"] : 12-hour time format with hour ("HH") and month ("MM") each in 2-digit format; single-digit values must be zero-padded; must be followed by literal "A" (for AM) or "P" (for PM) character
     * - XX"H" : specify number of hours in the future ("XX") from current system time
     * - XX"M" : specify number of minutes in the future ("XX") from current system time
     */
    function parseDateTime(input: string): Model.Schedule | undefined;

    // Activity manipulation
    /**
     * Parse a property name and value, then return
     * a user-readable string representation.
     */
    function getUserReadableActivityValue(property: keyof Model.Activity, value: Model.Activity[keyof Model.Activity]): string;

    // User functions
    /**
     * Toggle the storage key used for LocalStorage
     * Activity data between default and development
     * values. Induces a reset of Model's runtime parameters.
     */
    function toggleActivitiesStorageEnvironment(): void;
    /**
     * Initiate the creation of a new Activity object
     * through means of the Model. Will have a default
     * "checked_off" property value of "false". Induces
     * synchronization with Model.
     * @param nameInput - Must not be an empty string ("")
     */
    function addActivity(nameInput: string, dateTimeInput?: string): void;
    /**
     * Remove an Activity object from both runtime
     * parameters as well as LocalStorage. Induce
     * synchronization with Model.
     * @param itemInput - A visual item index to a valid Activity within State.itemMapping
     */
    function removeActivity(itemInput: string): void;
    /**
     * Duplicate an Activity. Change the created
     * Activity's "schedule" property to the
     * current system date and set its "origin"
     * property.
     */
    function copyActivityIntoToday(itemInput: string): void;
    /**
     * Toggle the "checked_off" property of an Activity.
     * The Activity must have a reference (its "id"
     * property) within "State.itemMapping". If the
     * value of the current "checked_off" property is
     * "undefined", a default value of "true" will be
     * applied.
     */
    function toggleActivityCheckedOff(itemInput: string): void;

    // User functions (bound to StateContainer)
    /**
     * These user functions operate directly on
     * the properties of a StateContainer object.
     * Therefore, "this" must be bound for expected
     * results.
     */
    /**
     * Assert that all currently supported "ActivityScope"
     * properties are defined at least sufficiently
     * enough for dependent functions to execute.
     * Not designed for use as a standalone user function.
     */
    function assertValidScope(this: StateContainer): void;
    /**
     * Attempt to update pagination properties
     * of "this" to the next page.
     */
    function nextPage(this: StateContainer): void;
    /**
     * Attempt to update pagination properties
     * of "this" to the previous page.
     */
    function prevPage(this: StateContainer): void;
    /**
     * Reset the "dataScope.filter.schedule" property
     * of the bound StateContainer.
     */
    function resetScopeFilterSchedule(this: StateContainer): void;
    /**
     * Parse a "schedule" value to set the
     * "dataScope.filter.schedule.before" property
     * of the bound StateContainer. Depends on
     * "assertValidScope" user fn.
     */
    function setScopeFilterScheduleBefore(this: StateContainer, scheduleInput: string): void;
    /**
     * Parse a "schedule" value to set the
     * "dataScope.filter.schedule.after" property
     * of the bound StateContainer. Depends on
     * "assertValidScope" user fn.
     */
    function setScopeFilterScheduleAfter(this: StateContainer, scheduleInput: string): void;
    /**
     * Toggle the "dataScope.filter.schedule.includeMatch"
     * property of the bound StateContainer. Depends on
     * "assertValidScope" user fn.
     */
    function toggleScopeFilterScheduleMatch(this: StateContainer): void;
    /**
     * Toggle the "dataScope.filter.checked_off"
     * property of the bound StateContainer. Depends on
     * "assertValidScope" user fn.
     */
    function toggleScopeFilterCheckedOff(this: StateContainer): void;
    /**
     * Toggle the "dataScope.sort.scheduleAscending"
     * property of the bound StateContainer. Depends on
     * "assertValidScope" user fn.
     */
    function toggleScopeSortAscendingOrder(this: StateContainer): void;

    // Generate State/DOMContext objects
    /**
     * Use first and second indices of each inner
     * array of "data" property to create a key
     * (first index) to value (second index)
     * association for an ItemMapping.
     */
    function createItemMappingFromContainerData(data: Container["data"]): ItemMapping;
    /**
     * Return a shallow-copy, subset array of "data"
     * and set user-facing pagination properties on
     * "DOMContainer".
     */
    function configureContainerPagination(DOMContainer: DOMContainer, data: StateContainer["data"], currentPageIndex: StateContainer["currentPageIndex"], maxPageItems: StateContainer["maxPageItems"]): DOMContainer["data"];
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
    /**
     * Generate a TableStateContainer based on Activity
     * data, organized according to "initialScope".
     * Applies default Container configurations.
     */
    function createActivitiesTableStateContainer(initialScope?: Model.ActivityScope): TableStateContainer;
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
