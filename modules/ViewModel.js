import { helperLibrary } from './HelperLibrary.js';

/** @type {(argumentModel: import("../types").Model) => import("../types").ViewModel} */
export const ViewModel  = (argumentModel) => (function (m) {
  const model = m;
  const State = {};
  const DOMContext = {};
  // the next 3 defined constant references are used to customize and cache localization options for formatting date/time strings
  const dateFormatOptions = {
    weekday: "long",
    year: "2-digit",
    month: "numeric",
    day: "numeric",
  };
  const dateFormat = new Intl.DateTimeFormat(undefined, dateFormatOptions);
  const dateTimeFormat = new Intl.DateTimeFormat(undefined, Object.assign({
    hour12: true,
    hour: "numeric",
    minute: "numeric"
  }, dateFormatOptions));
  let updateView;
  // Manage application State/DOMContext
  /** @type {import("../types").ViewModel.Private.useFunctionState} */
  function useFunctionState(functionMapping) {
    State.functionMapping = functionMapping;
  }
  /** @type {import("../types").ViewModel.Private.useItemState} */
  function useItemState(itemMapping) {
    State.itemMapping = itemMapping;
  }
  /** @type {import("../types").ViewModel.Private.updateState} */
  function updateState(StateChangeObject) {
    if (helperLibrary.isObject(StateChangeObject)) { // change State
      if (typeof StateChangeObject.functionMapping !== 'undefined' ||
          typeof StateChangeObject.itemMapping !== 'undefined') {
        throw new TypeError("unexpected State property. Try calling useItemState and/or useItemMapping instead.");
      }
      Object.assign(State, StateChangeObject);
    } else if (typeof StateChangeObject === 'undefined') {
      for (const stateContainer of State.content) {
        if (stateContainer.isLiteralData !== 'true')
          stateContainer.synchronizeData();
      }
    }
    // prepare and initiate render
    const stateAsDOMContext = {
      type: State.type,
      title: State.title,
      content: [ initializeDOMContainer(State.content[0]) ]
    };
    Object.assign(DOMContext, stateAsDOMContext);
    if (typeof updateView === 'function')
      updateView();
    return;
  }
  // FunctionBar Input utilities
  /** @type {import("../types").ViewModel.Private.removeFirstMatchAndReturnOrderedMatches} */
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
  /** @type {import("../types").ViewModel.Private.parseDateTime} */
  function parseDateTime(input) {
    if (typeof input === 'undefined' || input.length === 0)
      return;
    if (input.length < 2 ||
        (input.length > 5 && input.length !== 10))
      throw new Error("unknown format for input string");
    let schedule;
    const now = new Date();
    switch (input.length) {
      case 10:
        if (!helperLibrary.validateAllCharsDecimalDigits(input))
          throw new Error("cannot parse values in input string");
        schedule = {
          day: Number.parseInt(input.substring(0, 2)),
          month: Number.parseInt(input.substring(2, 4)),
          year: Number.parseInt("20" + input.substring(4, 6)),
          hour: Number.parseInt(input.substring(6, 8)),
          minute: Number.parseInt(input.substring(8, 10))
        };
        break;
      case 5:
        const timeOfDayChar = input.charAt(4).toUpperCase();
        if (!["A", "P"].includes(timeOfDayChar) ||
            !helperLibrary.validateAllCharsDecimalDigits(input.substring(0, 4)))
          throw new Error("cannot parse values in input string");
        const hourOffset = timeOfDayChar === "A" ? 0 : 12;
        let hourInput = Number.parseInt(input.substring(0, 2));
        if (hourInput === 12)
          hourInput = 0; // account for "hourOffset" to mitigate weird behavior for "12PM" and "12AM"
        const calculatedHour = hourOffset + hourInput;
        const minuteInput = Number.parseInt(input.substring(2, 4));
        if (hourInput < 0 || hourInput > 12 ||
            calculatedHour > 23 || minuteInput >= 60)
          throw new Error("cannot parse values in input string");
        let target = new Date(now);
        target.setHours(calculatedHour);
        target.setMinutes(minuteInput);
        if (target.getTime() < now.getTime()) { // if entered time already past for today, select following day
          target.setDate(target.getDate() + 1);
        }
        schedule = {
          day: target.getDate(),
          month: target.getMonth() + 1,
          year: target.getFullYear(),
          hour: calculatedHour,
          minute: minuteInput
        };
        break;
      case 4:
        if (!helperLibrary.validateAllCharsDecimalDigits(input))
          throw new Error("cannot parse values in input string");
        const dayInput = Number.parseInt(input.substring(0, 2));
        const monthInput = Number.parseInt(input.substring(2));
        if (dayInput < 1 || dayInput > 31 ||
            monthInput < 1 || monthInput > 12)
          throw new Error("cannot parse values in input string");
        schedule = {
          day: dayInput,
          month: monthInput,
          year: now.getFullYear()
        };
        break;
      default: { // input.length is 3 or 2
        const lastCharIndex = input.length - 1;
        if (!helperLibrary.validateAllCharsDecimalDigits(input.substring(0, lastCharIndex)))
          throw new Error("cannot parse values in input string");
        let isTimeSpecified = false;
        const inputNumber = Number.parseInt(input.substring(0, lastCharIndex));
        switch (input.charAt(lastCharIndex).toUpperCase()) {
          case "D":
            now.setDate(now.getDate() + inputNumber);
            break;
          case "N":
            now.setMonth(now.getMonth() + inputNumber);
            break;
          case "Y":
            now.setFullYear(now.getFullYear() + inputNumber);
            break;
          case "H":
            now.setHours(now.getHours() + inputNumber);
            isTimeSpecified = true;
            break;
          case "M":
            now.setMinutes(now.getMinutes() + inputNumber);
            isTimeSpecified = true;
            break;
          default:
            throw new Error("cannot parse values in input string");
        }
        schedule = {
          day: now.getDate(),
          month: now.getMonth() + 1,
          year: now.getFullYear()
        };
        if (isTimeSpecified) {
          schedule.hour = now.getHours();
          schedule.minute = now.getMinutes();
        }
      }
    }
    return schedule;
  }
  // Activity manipulation
  /** @type {import("../types").ViewModel.Private.getUserReadableActivityValue} */
  function getUserReadableActivityValue(property, value) {
    if (["id", "name", "checked_off"].includes(property)) // properties already user-readable
      return String(value);
    switch (property) {
      case "creation":
        value = new Date(value).toDateString();
        break;
      case "schedule":
        const date = model.dateFromSchedule(value);
        if (typeof value !== 'undefined' && typeof value.hour !== 'undefined' && typeof value.minute !== 'undefined') {
          value = dateTimeFormat.format(date);
        } else {
          value = dateFormat.format(date);
        }
        break;
      default:
        throw new Error("unknown Activity property");
    }
    return value;
  }
  // User functions
  /** @type {import("../types").ViewModel.Private.toggleActivitiesStorageEnvironment} */
  function toggleActivitiesStorageEnvironment() {
    const validKeys = ["activities", "development"];
    const currentKey = model.getActivitiesStorageKey();
    if (!validKeys.includes(currentKey))
      throw new Error(`unexpected local storage key for Activities: ${currentKey}`);
    let newKey;
    if (currentKey === "activities")
      newKey = "development";
    else
      newKey = "activities";
    model.setActivitiesStorageKey(newKey);
    updateState();
  }
  /** @type {import("../types").ViewModel.Private.addActivity} */
  function addActivity(nameInput, dateTimeInput) {
    if (typeof nameInput !== 'string' || nameInput.trim() === "")
      throw new Error("invalid user function parameter");
    const activity = {
      name: nameInput,
      creation: Date.now(),
      schedule: parseDateTime(dateTimeInput),
      checked_off: false
    };
    model.newActivity(activity);
    updateState();
  }
  /** @type {import("../types").ViewModel.Private.removeActivity} */
  function removeActivity(itemInput) {
    const id = State.itemMapping[itemInput];
    model.deleteActivity(id);
    updateState();
  }
  /** @type {import("../types").ViewModel.Private.toggleActivityCheckedOff} */
  function toggleActivityCheckedOff(itemInput) {
    const id = State.itemMapping[itemInput];
    const currentCheckedOffValue = model.getActivity(id)["checked_off"];
    let newCheckedOffValue;
    if (typeof currentCheckedOffValue === 'undefined')
      newCheckedOffValue = true;
    else
      newCheckedOffValue = !currentCheckedOffValue;
    model.updateActivity(id, { checked_off: newCheckedOffValue });
    updateState();
  }
  /** @type {import("../types").ViewModel.Private.copyActivityIntoToday} */
  function copyActivityIntoToday(itemInput) {
    const id = State.itemMapping[itemInput];
    const now = new Date();
    const todaySchedule = {
      year: now.getFullYear(),
      month: now.getMonth() + 1,
      day: now.getDate()
    };
    model.duplicateActivity(id, { schedule: todaySchedule, origin: id });
    updateState();
  }
  function updateActivitySchedule(itemInput, dateTimeInput) {
    const id = State.itemMapping[itemInput];
    const newSchedule = parseDateTime(dateTimeInput);
    model.updateActivity(id, {
      schedule: newSchedule
    });
    updateState();
  }
  // User functions (bound to StateContainer)
  /** @type {import("../types").ViewModel.Private.assertValidScope} */
  function assertValidScope() {
    if (!helperLibrary.isObject(this.dataScope))
      this.dataScope = {};
    if (!helperLibrary.isObject(this.dataScope.filter))
      this.dataScope.filter = {
        schedule: {},
        creation: {}
      };
    if (!helperLibrary.isObject(this.dataScope.sort))
      this.dataScope.sort = {};
  }
  /** @type {import("../types").ViewModel.Private.nextPage} */
  function nextPage() {
    if (typeof this.maxPageItems === 'undefined')
      //TODO: display a message saying "You are on the last page"
      return;
    let maxPageIndex;
    if (this.data.length % this.maxPageItems === 0)
      maxPageIndex = (this.data.length / this.maxPageItems) - 1;
    else
      maxPageIndex = Math.floor(this.data.length / this.maxPageItems);
    let nextPageIndex;
    if (typeof this.currentPageIndex === 'number')
      nextPageIndex = this.currentPageIndex + 1;
    else
      nextPageIndex = 1;
    if (nextPageIndex > maxPageIndex)
      //TODO: display a message saying "You are on the last page"
      return;
    this.currentPageIndex = nextPageIndex;
    updateState();
  }
  /** @type {import("../types").ViewModel.Private.prevPage} */
  function prevPage() {
    if (typeof this.currentPageIndex === 'undefined'
        || this.currentPageIndex === 0
        || typeof this.maxPageItems === 'undefined')
      //TODO: display a message saying "You are on the first page"
      return;
    this.currentPageIndex--;
    updateState();
  }
  /** @type {import("../types").ViewModel.Private.resetScopeFilterSchedule} */
  function resetScopeFilterSchedule() {
    assertValidScope.call(this);
    this.dataScope.filter.schedule = {};
    updateState();
  }
  /** @type {import("../types").ViewModel.Private.setScopeFilterScheduleBefore} */
  function setScopeFilterScheduleBefore(scheduleInput) {
    if (typeof scheduleInput !== 'string')
      throw new TypeError(`"scheduleInput" is not a string`);
    assertValidScope.call(this);
    this.dataScope.filter.schedule.before = parseDateTime(scheduleInput);
    updateState();
  }
  /** @type {import("../types").ViewModel.Private.setScopeFilterScheduleAfter} */
  function setScopeFilterScheduleAfter(scheduleInput) {
    if (typeof scheduleInput !== 'string')
      throw new TypeError(`"scheduleInput" is not a string`);
    assertValidScope.call(this);
    this.dataScope.filter.schedule.after = parseDateTime(scheduleInput);
    updateState();
  }
  /** @type {import("../types").ViewModel.Private.toggleScopeFilterScheduleMatch} */
  function toggleScopeFilterScheduleIncludeMatch() {
    assertValidScope.call(this);
    const currValue = this.dataScope.filter.schedule.includeMatch;
    const newValue = currValue === true ? false : true;
    this.dataScope.filter.schedule.includeMatch = newValue;
    updateState();
  }
  /** @type {import("../types").ViewModel.Private.toggleScopeFilterCheckedOff} */
  function toggleScopeFilterCheckedOff() {
    assertValidScope.call(this);
    const currValue = this.dataScope.filter.checked_off;
    const newValue = currValue === true ? false : true;
    this.dataScope.filter.checked_off = newValue;
    updateState();
  }
  /** @type {import("../types").ViewModel.Private.toggleScopeSortAscendingOrder} */
  function toggleScopeSortAscendingOrder() {
    assertValidScope.call(this);
    const currValue = this.dataScope.sort.scheduleAscending;
    const newValue = currValue === true ? false : true;
    this.dataScope.sort.scheduleAscending = newValue;
    updateState();
  }
  // Generate State/DOMContext objects
  /** @type {import("../types").ViewModel.Private.createItemMappingFromContainerData} */
  function createItemMappingFromContainerData(data) {
    const mapping = {};
    for (const datum of data)
    { mapping[datum[0]] = datum[1] }
    return mapping;
  }
  /** @type {import("../types").ViewModel.Private.configureContainerPagination} */
  function configureContainerPagination(DOMContainer, data, currentPageIndex, maxPageItems) {
    // validate params...
    if (typeof currentPageIndex === 'undefined') {
      currentPageIndex = 0;
    }
    if (currentPageIndex > 0) {
      if (typeof maxPageItems === 'undefined')
        throw new RangeError(`cannot select page with index ${currentPageIndex}; "maxPageItems" is undefined`);
    } else if (currentPageIndex < 0) {
      throw new RangeError(`cannot select page with negative index: ${currentPageIndex}`);
    } else {
      if (typeof maxPageItems === 'undefined')
        maxPageItems = data.length;
    }
    // calculate and slice selected portion of "data"
    let maxPageIndex;
    if (data.length === 0)
      maxPageIndex = 0;
    else if (data.length % maxPageItems === 0)
      maxPageIndex = (data.length / maxPageItems) - 1;
    else
      maxPageIndex = Math.floor(data.length / maxPageItems);
    if (currentPageIndex > maxPageIndex)
      throw new RangeError(`cannot select page with index ${currentPageIndex}; calculated maximum is ${maxPageIndex}`);
    const firstItemIndex = maxPageItems * currentPageIndex;
    // set DOMContainer props
    DOMContainer.currentPageNumber = String(currentPageIndex + 1);
    DOMContainer.lastPageNumber = String(maxPageIndex + 1);
    return data.slice(firstItemIndex, firstItemIndex + maxPageItems);
  }
  /** @type {import("../types").ViewModel.Private.generateContainerDataIndices} */
  function generateContainerDataIndices(data, startingVisualIndex) {
    if (typeof startingVisualIndex !== 'string')
      return data;
    data = JSON.parse(JSON.stringify(data)); // deep copy. all values must be JSON compatible!
    if (helperLibrary.validateAllCharsDecimalDigits(startingVisualIndex)) {
      let currentIndexPrefix = Number.parseInt(startingVisualIndex);
      for (const datum of data)
        { datum.unshift(currentIndexPrefix++); }
    }
    const startingChar = startingVisualIndex.charAt(0);
    if (helperLibrary.validateAllCharsUppercaseAlphabeticalLetters(startingChar)) { // uppercase alphabetical letters: "A" - "Z"
      let currentCharCode = startingChar.charCodeAt();
      for (const datum of data) {
        datum.unshift(String.fromCharCode(currentCharCode));
        const nextCode = currentCharCode + 1; // will behave unexpectedly where this value becomes > 90
        currentCharCode = nextCode;
      }
    }
    return data;
  }
  /** @type {import("../types").ViewModel.Private.configureTableContainerData} */
  function configureTableContainerData(data, isLiteralData, startingVisualIndex, propertyNames) {
    if (isLiteralData !== true) {
      const idIndex = typeof startingVisualIndex === 'undefined' ? 0 : 1;
      for (const datum of data) {
        const id = datum[idIndex];
        const activity = model.getActivity(id);
        const selectedActivityProperties = [];
        let offset = idIndex; // prevent truncation of item index string
        for (const propertyName of propertyNames)
          { selectedActivityProperties.push( getUserReadableActivityValue(propertyName, activity[propertyName]) ) }
        for (const activityPropertyValue of selectedActivityProperties)
          { datum[offset++] = activityPropertyValue }
      }
    }
    return data;
  }
  /** @type {import("../types").ViewModel.Private.initializeDOMContainer} */
  function initializeDOMContainer(stateContainer) {
    const DOMContainer = {
      type: stateContainer.type,
      title: stateContainer.title,
    };
    useFunctionState(stateContainer.functions); // side effect
    DOMContainer.data = configureContainerPagination(DOMContainer, stateContainer.data, stateContainer.currentPageIndex, stateContainer.maxPageItems);
    DOMContainer.data = generateContainerDataIndices(DOMContainer.data, stateContainer.startingVisualIndex);
    if (typeof stateContainer.startingVisualIndex === 'string')
      useItemState(createItemMappingFromContainerData(DOMContainer.data)); // side effect
    switch (DOMContainer.type) {
      case "table":
        DOMContainer.columnNames = stateContainer.columnNames;
        DOMContainer.data = configureTableContainerData(
          DOMContainer.data, stateContainer.isLiteralData,
          stateContainer.startingVisualIndex, stateContainer.propertyNames);
        break;
      default:
        break;
    }
    return DOMContainer;
  }
  /** @type {import("../types").ViewModel.Private.errorState} */
  function errorState(message) {
    if (typeof message !== 'string')
      throw new TypeError("unexpected parameter type");
    return {
      type: "modal",
      title: "Error",
      content: [{
        type: "table",
        columnNames: ["Message(s)"],
        data: [[message]],
        isLiteralData: true
      }]
    };
  }
  /** @type {import("../types").ViewModel.Private.createActivitiesTableStateContainer} */
  function createActivitiesTableStateContainer(initialScope) {
    const stateContainer = {
      type: "table",
      title: "Activities",
      data: model.getActivityIdArray(initialScope).map( id => [id] ),
      isLiteralData: false,
      dataScope: initialScope,
      synchronizeData() {
        this.data = model.getActivityIdArray(this.dataScope).map( id => [id] )
      },
      currentPageIndex: 0,
      maxPageItems: 15,
      startingVisualIndex: "1",
      columnNames: ["Index", "Name", "Schedule Date", "Checked Off"],
      propertyNames: ["name", "schedule", "checked_off"],
    };
    stateContainer.functions = {
      "N": nextPage.bind(stateContainer),
      "P": prevPage.bind(stateContainer),
      "RS": resetScopeFilterSchedule.bind(stateContainer),
      "FB": setScopeFilterScheduleBefore.bind(stateContainer),
      "FA": setScopeFilterScheduleAfter.bind(stateContainer),
      "FM": toggleScopeFilterScheduleIncludeMatch.bind(stateContainer),
      "FC": toggleScopeFilterCheckedOff.bind(stateContainer),
      "S": toggleScopeSortAscendingOrder.bind(stateContainer),
      "A": addActivity,
      "T": toggleActivityCheckedOff,
      "CHENV": toggleActivitiesStorageEnvironment,
      "D": removeActivity,
      "C": copyActivityIntoToday,
      "ES": updateActivitySchedule
    };
    return stateContainer;
  }
  /** @type {import("../types").ViewModel.Private.createToCurrentDateUncheckedActivitiesTableStateContainer} */
  function createToCurrentDateUncheckedActivitiesTableStateContainer() {
    const today = new Date();
    const scope = {
      filter: {
        schedule: {
          before: {
            year: today.getFullYear(),
            month: today.getMonth() + 1,
            day: today.getDate() + 1
          },
        },
        checked_off: false
      }
    };
    return createActivitiesTableStateContainer(scope);
  }
  /** @type {import("../types").ViewModel.Private.createFutureUncheckedActivitiesTableStateContainer} */
  function createFutureUncheckedActivitiesTableStateContainer() {
    const today = new Date();
    const scope = {
      filter: {
        schedule: {
          after: {
            year: today.getFullYear(),
            month: today.getMonth() + 1,
            day: today.getDate() + 1
          },
          includeMatch: true,
        },
        checked_off: false
      },
      sort: { scheduleAscending: true }
    };
    return createActivitiesTableStateContainer(scope);
  }
  // Hard-coded State/DOMContext objects
  const mainMenu = {
    State: {
      type: "main",
      title: "Main Menu",
      content: [{
        type: "table",
        title: undefined,
        columnNames: ["Index", "Options"],
        data: [["View All Activities"], ["View Unchecked Activities Due By Today"], ["View Future Unchecked Activities"]],
        functions: {
          "1": () => updateState({
            content: [ createActivitiesTableStateContainer({ sort: { scheduleAscending: true } }) ]
          }),
          "2": () => updateState({
            content: [ createToCurrentDateUncheckedActivitiesTableStateContainer() ]
          }),
          "3": () => updateState({
            content: [ createFutureUncheckedActivitiesTableStateContainer() ]
          })
        },
        isLiteralData: true,
        startingVisualIndex: "1",
        currentPageIndex: 0,
        maxPageItems: 15
      }]
    }
  };
  // Initialize application to main menu State/DOMContext
  updateState(mainMenu.State);

  // Public definitions
  return {
    DOMContext: DOMContext,
    debug: {
      State: State,
      mainMenu: mainMenu
    },
    handleFunctionBarKeypressEventAndExecuteUserFunction(event) {
      let inputArray = event.target.value.split(",").map(str => str.trim()); // split raw input by "," delimiter and trim trailing whitespace
      if (event.key === 'Enter') { // validate for a user function
        let matchedFunctions;
        [inputArray[0], matchedFunctions] = removeFirstMatchAndReturnOrderedMatches(inputArray[0], Object.keys(State.functionMapping));
        if (matchedFunctions.length !== 0) {
          if (inputArray[0] === "")
            inputArray.shift();
          else { // ensure remaining string of inputArray[0] contains digits (0-9)
            if (!helperLibrary.validateAllCharsDecimalDigits(inputArray[0]))
              return updateState(errorState("Invalid Input"));
          }
          State.functionMapping[matchedFunctions[0]](...inputArray);
        } // else check for user functions not involving acronym strings and if not available, alert user of invalid user function acronym input
      }
    },
    setUpdateView(func) {
      if (typeof updateView === 'undefined')
        func();
      updateView = func;
    }
  };
})(argumentModel);
