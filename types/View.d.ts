import { ViewModel } from "./ViewModel";

export declare namespace View {
  namespace Private {
    /**
     * Create a styled "h2"
     * @param value - The title string to display in the heading
     * @returns The "h2" element
     */
    function createHeading(value: string): HTMLElement;
    /**
     * Return a div containing an HTML table element based on
     * an array of arrays, accepting a single-layer array for
     * the columns and a two-layer array for the data 
     * @param cols - An array of strings to name the table columns
     * @param data - A two-layer array containing strings within; for a symmetric, gap-less table, the length of every inner array should be equal to that of "cols"
     */
    function createTableContainer(cols: Array<string>, data: Array<Array<string>>, title?: string): HTMLElement;
    /**
     * Return an HTML div element containing parameter information,
     * based on an array of arrays detailing their names,
     * visual string indexes, and CSS id attributes
     * @param parameterData - Two-layer array; the inner arrays must contain either a single string value or 3 values, where the first index is a string corresponding to the name of the parameter, the second index is a string that is the visual index value of the parameter, and the third index is a string that is the id CSS attribute of the input element for the parameter
     */
    function createParametersContainer(parameterData: Array<Array<string>>): HTMLElement;
    /**
     * Return a div containing pagination information.
     * If a given parameter is not of 'string' type,
     * a default value of "1" will be used.
     */
    function createPaginationInfo(currentPage?: string, lastPossiblePage?: string): HTMLElement;
    /**
     * Accept "content" property of application DOMContext
     * and return the appropriately formatted HTMLElement
     * to display as the main content
     */
    function createContentDiv(content: Array<ViewModel.DOMContainer>): HTMLElement;
    /**
     * Create HTML elements for the FunctionBar component
     * and attach a "keypress" listener to validate and
     * execute on input (via a ViewModel callback function)
     * @returns The "div" element, containing the "input" element
     */
    function createFunctionBarAndAttachKeyPressHandler(): HTMLElement;
    /**
     * Draw the current application DOMContext
     * to the screen. Remove all elements from
     * the current DOMContext div (determined by
     * "type" DOMContext property) before drawing
     */
    function render(): void;
  }
}