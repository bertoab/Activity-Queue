/** @type {import("./types").HelperLibrary} */
const helperLibrary = {
  isObject(arg) {
    return typeof arg === 'object' &&
    !Array.isArray(arg) &&
    arg !== null
  },
  validateAllCharsUppercaseAlphabeticalLetters(str) {
    const FIRST_VALID_CHAR = 65; // "A"
    const LAST_VALID_CHAR = 90; // "Z"
    for (let i = 0; i < str.length; i++) {
      if (str.charCodeAt(i) < FIRST_VALID_CHAR ||
          str.charCodeAt(i) > LAST_VALID_CHAR)
        return false;
    }
    return true;
  },
  validateAllCharsDecimalDigits(str) {
    const FIRST_VALID_CHAR = 48; // "0"
    const LAST_VALID_CHAR = 57; // "9"
    for (let i = 0; i < str.length; i++) {
      if (str.charCodeAt(i) < FIRST_VALID_CHAR ||
          str.charCodeAt(i) > LAST_VALID_CHAR)
        return false;
    }
    return true;
  }
};
/** @type {import("./types").Model} */
const Model = (function () {
  // Storage Keys
  let activities_storage_key = "activities";
  // Manage local storage
  /** @type {import("./types").Model.Private.setActivitiesStore} */
  const setActivitiesStore = (scheduleTree) => {
    if (!helperLibrary.isObject(scheduleTree)) {
      localStorage.setItem(activities_storage_key, JSON.stringify({}));
      return;
    }
    localStorage.setItem(activities_storage_key, JSON.stringify(scheduleTree));
  }
  /** @type {import("./types").Model.Private.getActivitiesStore} */
  const getActivitiesStore = () => {
    let loadedData = JSON.parse(localStorage.getItem(activities_storage_key));
    if (loadedData === null) // uninitialized local storage
      return {};
    else if (!helperLibrary.isObject(loadedData))
      throw new TypeError("Local storage data is non-object")
    return loadedData;
  }
  // Manage ScheduleToActivitiesTree (and similar) structures
  /** @type {import("./types").Model.Private.flattenScheduleTreeToActivitiesArray} */
  function flattenScheduleTreeToActivitiesArray (scheduleTree) {
    let activitiesArray = [];
    recurseAndPushActivities(scheduleTree, activitiesArray);
    return activitiesArray;

    /** Iterate over values of "obj", 
     * recursing if another object is
     * found or pushing values to "arr"
     * if an array is found.
     */
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
  /** @type {import("./types").Model.Private.findPositionInScheduleTree} */
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
  /** @type {import("./types").Model.Private.findSpecificActivityArrayInScheduleTree} */
  function findSpecificActivityArrayInScheduleTree(scheduleTree, schedule, fillGaps) {
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
  /** @type {import("./types").Model.Private.insertActivityIntoScheduleTree} */
  function insertActivityIntoScheduleTree(tree, activity) {
    return findSpecificActivityArrayInScheduleTree(tree, activity.schedule, true).push(activity);
  }
  /** @type {import("./types").Model.Private.moveActivityLocation} */
  function moveActivityLocation(activity, newSchedule) {
    // find Activity's current array index
    let activityArrayInScheduleTree = findSpecificActivityArrayInScheduleTree(scheduleTreeToActivityArray, activity.schedule);
    /**
     * worst case time complexity of next interpreted line: O(m),
     * where m is the total number of Activities in the corresponding
     * Activity array within "scheduleTreeToActivityArray"
     */
    let activityIndex = activityArrayInScheduleTree.findIndex( searchActivity => searchActivity.id === activity.id );
    activityArrayInScheduleTree.splice(activityIndex, 1); // worst case time complexity: O(m)
    activity.schedule = newSchedule;
    insertActivityIntoScheduleTree(scheduleTreeToActivityArray, activity);
  }
  // Manage Activity properties
  /** @type {import("./types").Model.Private.findScheduleDepth} */
  function findScheduleDepth(schedule) {
    if (typeof schedule === 'undefined' ||
        !helperLibrary.isObject(schedule) ||
        typeof schedule.year !== 'number') {
      return 0;
    }
    if (typeof schedule.month !== 'number')
      return 1;
    if (typeof schedule.day !== 'number')
      return 2;
    if (typeof schedule.hour !== 'number')
      return 3;
    if (typeof schedule.minute !== 'number')
      return 4;
    // all "schedule" properties present
    return 5;
  }
  /** @type {import("./types").Model.Private.dateFromSchedule} */
  function dateFromSchedule(schedule) {
    let depth = findScheduleDepth(schedule);
    if (depth === 0) {
      return new Date(0); // Unix epoch
    }
    let params = new Array(depth);
    depth--; // offset to properly align with "FIELDS"
    const FIELDS = ["year", "month", "day", "hour", "minute"];
    while (depth >= 0) {
      let scheduleValue = schedule[FIELDS[depth]];
      if (depth === 1) {
        scheduleValue--; // offset for difference in month-integer mapping
      }
      params[depth] = scheduleValue;
      depth--;
    }
    // "January" placeholder value to prevent unexpected Unix epoch timestamp
    if (params.length === 1)
      params.push(0);
    return new Date(...params);
  }
  // Manage Array<Activity> structure
  /** @type {import("./types").Model.Private.applyActivityNumberLikeFilter} */
  function applyActivityNumberLikeFilter(arr, targetProperty, filter, compareFn) {
    if (!helperLibrary.isObject(filter))
      return arr;
    if (typeof compareFn !== 'function')
      compareFn = (a, b) => a - b;
    const satisfiesBeforeFilterCondition = (testValue) => {
      const comparisonResult = compareFn(testValue, filter.before);
      if (comparisonResult < 0 || (comparisonResult === 0 && filter.includeMatch === true))
        return true;
      else
        return false;
    }
    const satisfiesAfterFilterCondition = (testValue) => {
      const comparisonResult = compareFn(testValue, filter.after);
      if (comparisonResult > 0 || (comparisonResult === 0 && filter.includeMatch === true))
        return true;
      else
        return false;
    }
    // loop to filter Activities
    const filteredArr = [];
    for (const activity of arr) {
      let failedBeforeCondition = false, failedAfterCondition = false;
      if (typeof filter.before !== 'undefined' && (!satisfiesBeforeFilterCondition(activity[targetProperty])))
        failedBeforeCondition = true;
      if (typeof filter.after !== 'undefined' && (!satisfiesAfterFilterCondition(activity[targetProperty])))
        failedAfterCondition = true;
      if (!failedBeforeCondition && !failedAfterCondition)
        filteredArr.push(activity);
    }
    return filteredArr;
  }
  /** @type {import("./types").Model.Private.filterActivityArray} */
  function filterActivityArray(activityArray, filter, testForInequality) {
    let filterTest; // configured to return "true" if an Activity's property passes the filter
    if (testForInequality === true) {
      filterTest = (param1, param2) => param1 !== param2;
    } else {
      filterTest = (param1, param2) => param1 === param2;
    }
    const successfullyFiltered = [];
    for (const activity of activityArray) {
      validateActivity: { // define named block to break when a filter test fails
        for (const filterProperty in filter) {
          if (!filterTest(activity[filterProperty], filter[filterProperty]))
            break validateActivity;
        }
        successfullyFiltered.push(activity);
      }
    }
    return successfullyFiltered;
  }
  /** @type {import("./types").Model.Private.compareSchedules} */
  function compareSchedules(first, second) {
    // Compare chronological order of "schedule" property
    const firstDate = dateFromSchedule(first);
    const secondDate = dateFromSchedule(second);
    if (firstDate.valueOf() < secondDate.valueOf())
      return -1;
    if (firstDate.valueOf() > secondDate.valueOf())
      return 1;
    // Chronologically equivalent: compare "schedule" property depth
    const firstDepth = findScheduleDepth(first);
    const secondDepth = findScheduleDepth(second);
    if (firstDepth < secondDepth)
      return -1;
    if (firstDepth > secondDepth)
      return 1;
    // Equivalent "schedule" property
    return 0;
  }
  // Manage UUIDs
  /** @type {import("./types").Model.Private.getUniqueId} */
  function getUniqueId() {
    let id = crypto.randomUUID();
    while (uniqueIds.has(id))
      id = crypto.randomUUID();
    uniqueIds.add(id);
    return id;
  }
  /** @type {import("./types").Model.Private.loadActivityIdsFromArray} */
  function loadActivityIdsFromArray(activityArray) {
    for (const activity of activityArray) {
      const id = activity.id;
      uniqueIds.add(id);
      idToActivityReference[id] = activity;
    }
  }

  // runtime parameters
  /**
   * Used to track all UUIDs across all types
   * of program-specific data structures.
   * Intended to validate uniqueness when
   * new IDs are assigned.
   */
  let uniqueIds = new Set();
  /**
   * Used as a source of truth for "up-to-date" direct
   * information about Activity objects in LocalStorage.
   * Changes at the same time that operations affecting
   * saved data occur. Intended to reduce number of
   * LocalStorage calls for single Activity reading
   * operations.
   * @type {Object<string, Activity>}
   */
  let idToActivityReference = {};
  /**
   * Used as a source of truth for "up-to-date" relational
   * information about Activity objects in LocalStorage,
   * based on the "schedule" property structure.
   * Changes at the same time that operations affecting
   * saved data occur. Intended to reduce number of
   * LocalStorage calls for reading operations.
   * @type {ScheduleToActivitiesTree}
   */
  let scheduleTreeToActivityArray;
  /**
   * Used as a source of truth for "up-to-date" direct
   * information about Group objects in LocalStorage.
   * Changes at the same time that operations affecting
   * saved data occur. Intended to reduce number of
   * LocalStorage calls for reading operations.
   */
  let idToGroupReference;
  /**
   * Used to quickly find Activity members
   * of Group objects. Uses string "id" properties
   * of both data structures.
   */
  let groupIdToActivityIdArray;
  /** @type {import("./types").Model.Private.initializeRuntimeParameters} */
  function initializeRuntimeParameters() {
    // load Activity data
    scheduleTreeToActivityArray = getActivitiesStore();
    loadActivityIdsFromArray(flattenScheduleTreeToActivitiesArray(scheduleTreeToActivityArray));
  }
  /** @type {import("./types").Model.Private.clearRuntimeParameters} */
  function clearRuntimeParameters() {
    uniqueIds.clear();
    idToActivityReference = {};
    scheduleTreeToActivityArray = undefined;
  }

  initializeRuntimeParameters();

  //...idToGroupReference = Object.fromEntries(...));
  //...groupIdToActivityIdArray = ...

  return {
    setActivitiesStorageKey(newKey) {
      if (typeof newKey !== 'string')
        throw new TypeError(`"newKey" is not a string`);
      activities_storage_key = newKey;
      clearRuntimeParameters();
      initializeRuntimeParameters();
    },
    getActivitiesStorageKey() {
      return activities_storage_key;
    },
    getActivity(id) {
      return idToActivityReference[id];
    },
    newActivity(activity) {
      activity.id = getUniqueId();
      // update runtime parameters
      insertActivityIntoScheduleTree(scheduleTreeToActivityArray, activity);
      idToActivityReference[activity.id] = activity;
      // save local storage
      setActivitiesStore(scheduleTreeToActivityArray);
    },
    updateActivity(id, diff) {
      //TODO: more "diff" validation
      if (!helperLibrary.isObject(diff))
        throw new TypeError(`"diff" is not an object`);
      const activity = idToActivityReference[id];
      if (helperLibrary.isObject(diff.schedule)) {
        moveActivityLocation(activity, diff.schedule);
        delete diff.schedule;
      }
      Object.assign(activity, diff); // ...properties that can be updated in-place
      // save local storage
      setActivitiesStore(scheduleTreeToActivityArray);
    },
    duplicateActivity(id, diff) {
      const orig = this.getActivity(id);
      const copy = JSON.parse(JSON.stringify(orig)); // deep copy
      delete copy.id;
      this.newActivity(copy);
      if (helperLibrary.isObject(diff))
        this.updateActivity(copy.id, diff);
      return copy.id;
    },
    deleteActivity(id) {
      // find Activity object in ScheduleToActivitiesTree
      let allActivitiesArray = flattenScheduleTreeToActivitiesArray(scheduleTreeToActivityArray);
      /**
       * worst case time complexity of next interpreted line: O(n),
       * where n is the total number of Activities
       * in "scheduleTreeToActivityArray"
       */
      let activity = allActivitiesArray.find( searchActivity => searchActivity.id === id );
      // find Activity's array index
      let activityArrayInScheduleTree = findSpecificActivityArrayInScheduleTree(scheduleTreeToActivityArray, activity.schedule);
      /**
       * worst case time complexity of next interpreted line: O(m),
       * where m is the total number of Activities in the corresponding
       * Activity array within "scheduleTreeToActivityArray"
       */
      let activityIndex = activityArrayInScheduleTree.findIndex( searchActivity => searchActivity.id === activity.id );
      // delete Activity from runtime parameters
      uniqueIds.delete(id);
      activityArrayInScheduleTree.splice(activityIndex, 1); // worst case time complexity: O(m)
      delete idToActivityReference[id];
       // save local storage
      setActivitiesStore(scheduleTreeToActivityArray);
    },
    getActivityIdArray(scope) {
      let activities = flattenScheduleTreeToActivitiesArray(scheduleTreeToActivityArray);
      if (typeof scope === 'undefined') {
        activities = activities.sort( (a, b) => compareSchedules(b.schedule, a.schedule) );
      } else if (helperLibrary.isObject(scope)) {
        // sorting
        if (!helperLibrary.isObject(scope.sort) || scope.sort.scheduleAscending !== true)
          activities = activities.sort( (a, b) => compareSchedules(b.schedule, a.schedule) );
        else
          activities = activities.sort( (a, b) => compareSchedules(a.schedule, b.schedule) );
        // filtering
        if (helperLibrary.isObject(scope.filter)) {
          if (typeof scope.filter.checked_off === 'boolean')
            activities = activities.filter( activity => activity.checked_off === scope.filter.checked_off );
          if (helperLibrary.isObject(scope.filter.creation))
            activities = applyActivityNumberLikeFilter(activities, "creation", scope.filter.creation);
          if (helperLibrary.isObject(scope.filter.schedule))
            activities = applyActivityNumberLikeFilter(activities, "schedule", scope.filter.schedule, compareSchedules);
        }
      } else {
        throw new TypeError(`"scope" is not an object or undefined`);
      }
      return activities.map( activity => activity.id );
    },
    // fetchActivitiesBySchedule(schedule) {},
    compareSchedules: compareSchedules,
    dateFromSchedule: dateFromSchedule,
    debug: {
      setActivitiesStore: setActivitiesStore,
      getActivitiesStore: getActivitiesStore,
      ACTIVITIES_STORAGE_KEY: activities_storage_key
    }
  };
})();

/** @type {(argumentModel: import("./types").Model) => import("./types").ViewModel} */
const ViewModel  = (argumentModel) => (function (m) {
  const model = m;
  const State = {};
  const DOMContext = {};
  let updateView;
  // Manage application State/DOMContext
  /** @type {import("./types").ViewModel.Private.useFunctionState} */
  function useFunctionState(functionMapping) {
    State.functionMapping = functionMapping;
  }
  /** @type {import("./types").ViewModel.Private.useItemState} */
  function useItemState(itemMapping) {
    State.itemMapping = itemMapping;
  }
  /** @type {import("./types").ViewModel.Private.updateState} */
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
  /** @type {import("./types").ViewModel.Private.removeFirstMatchAndReturnOrderedMatches} */
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
  /** @type {import("./types").ViewModel.Private.parseDateTime} */
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
        if (hourInput < 1 || hourInput > 12 ||
            calculatedHour > 23 || minuteInput >= 60)
          throw new Error("cannot parse values in input string");
        schedule = {
          day: now.getDate(),
          month: now.getMonth() + 1,
          year: now.getFullYear(),
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
          schedule.minutes = now.getMinutes();
        }
      }
    }
    return schedule;
  }
  // Activity manipulation
  /** @type {import("./types").ViewModel.Private.getUserReadableActivityValue} */
  function getUserReadableActivityValue(property, value) {
    if (["id", "name", "checked_off"].includes(property)) // properties already user-readable
      return String(value);
    switch (property) {
      case "creation":
        value = new Date(value).toDateString();
        break;
      case "schedule":
        value = model.dateFromSchedule(value).toDateString();
        break;
      default:
        throw new Error("unknown Activity property");
    }
    return value;
  }
  // User functions
  /** @type {import("./types").ViewModel.Private.toggleActivitiesStorageEnvironment} */
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
  /** @type {import("./types").ViewModel.Private.addActivity} */
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
  /** @type {import("./types").ViewModel.Private.removeActivity} */
  function removeActivity(itemInput) {
    const id = State.itemMapping[itemInput];
    model.deleteActivity(id);
    updateState();
  }
  /** @type {import("./types").ViewModel.Private.toggleActivityCheckedOff} */
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
  /** @type {import("./types").ViewModel.Private.copyActivityIntoToday} */
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
  // User functions (bound to StateContainer)
  /** @type {import("./types").ViewModel.Private.assertValidScope} */
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
  /** @type {import("./types").ViewModel.Private.nextPage} */
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
  /** @type {import("./types").ViewModel.Private.prevPage} */
  function prevPage() {
    if (typeof this.currentPageIndex === 'undefined'
        || this.currentPageIndex === 0
        || typeof this.maxPageItems === 'undefined')
      //TODO: display a message saying "You are on the first page"
      return;
    this.currentPageIndex--;
    updateState();
  }
  /** @type {import("./types").ViewModel.Private.resetScopeFilterSchedule} */
  function resetScopeFilterSchedule() {
    assertValidScope.call(this);
    this.dataScope.filter.schedule = {};
    updateState();
  }
  /** @type {import("./types").ViewModel.Private.setScopeFilterScheduleBefore} */
  function setScopeFilterScheduleBefore(scheduleInput) {
    if (typeof scheduleInput !== 'string')
      throw new TypeError(`"scheduleInput" is not a string`);
    assertValidScope.call(this);
    this.dataScope.filter.schedule.before = parseDateTime(scheduleInput);
    updateState();
  }
  // Generate State/DOMContext objects
  /** @type {import("./types").ViewModel.Private.createItemMappingFromContainerData} */
  function createItemMappingFromContainerData(data) {
    const mapping = {};
    for (const datum of data)
    { mapping[datum[0]] = datum[1] }
    return mapping;
  }
  /** @type {import("./types").ViewModel.Private.configureContainerPagination} */
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
  /** @type {import("./types").ViewModel.Private.generateContainerDataIndices} */
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
  /** @type {import("./types").ViewModel.Private.configureTableContainerData} */
  function configureTableContainerData(data, isLiteralData, startingVisualIndex, propertyNames) {
    if (isLiteralData !== true) {
      const idIndex = typeof startingVisualIndex === 'undefined' ? 0 : 1;
      for (const datum of data) {
        const id = datum[idIndex];
        const activity = Model.getActivity(id);
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
  /** @type {import("./types").ViewModel.Private.initializeDOMContainer} */
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
  /** @type {import("./types").ViewModel.Private.errorState} */
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
  /** @type {import("./types").ViewModel.Private.createActivitiesTableStateContainer} */
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
      "A": addActivity,
      "T": toggleActivityCheckedOff,
      "CHENV": toggleActivitiesStorageEnvironment,
      "D": removeActivity,
      "C": copyActivityIntoToday
    };
    return stateContainer;
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
        data: [["Add task"], ["View history"], ["View archived"], ["View All Activities"]],
        functions: {
          "1": () => document.getElementById("modal-container").style.display = "flex",
          "2": () => alert("You selected: View history"),
          "3": () => alert("You selected: View archived"),
          "4": () => updateState({
            content: [ createActivitiesTableStateContainer() ]
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

/** @type {(argumentViewModel: import("./types").ViewModel) => import("./types").View} */
const View = (argumentViewModel) => (function (vm) {
  const viewModel = vm;
  
  /** @type {import("./types").View.Private.createHeading} */
  function createHeading(value) {
    if (typeof value !== 'string')
      throw new TypeError("unexpected parameter type"); //TODO: implement support for Array<HTMLElement>
    const headerDiv = document.createElement("h2");
    headerDiv.innerText = value;
    return headerDiv;
  }
  /** @type {import("./types").View.Private.createTableContainer} */
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
  /** @type {import("./types").View.Private.createParametersContainer} */
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
  /** @type {import("./types").View.Private.createPaginationInfo} */
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
  /** @type {import("./types").View.Private.createContentDiv} */
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
  /** @type {import("./types").View.Private.createPaginationInfo} */
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

  /** @type {import("./types").View.Private.render} */
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

/**
 * Define module exports else initialize
 * application when run as main script
 */
if (typeof exports === 'object') {
  exports.Model = Model;
  exports.ViewModel = ViewModel;
  exports.View = View;
} else {
  const viewModel = ViewModel(Model);
  const view = View(viewModel);
}