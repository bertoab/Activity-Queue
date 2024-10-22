import { helperLibrary } from './HelperLibrary.js';

/** @type {import("../types").Model} */
export const Model = (function () {
  // Storage Keys
  let activities_storage_key = "activities";
  // Manage local storage
  /** @type {import("../types").Model.Private.setActivitiesStore} */
  const setActivitiesStore = (scheduleTree) => {
    if (!helperLibrary.isObject(scheduleTree)) {
      localStorage.setItem(activities_storage_key, JSON.stringify({}));
      return;
    }
    localStorage.setItem(activities_storage_key, JSON.stringify(scheduleTree));
  }
  /** @type {import("../types").Model.Private.getActivitiesStore} */
  const getActivitiesStore = () => {
    let loadedData = JSON.parse(localStorage.getItem(activities_storage_key));
    if (loadedData === null) // uninitialized local storage
      return {};
    else if (!helperLibrary.isObject(loadedData))
      throw new TypeError("Local storage data is non-object")
    return loadedData;
  }
  // Manage ScheduleToActivitiesTree (and similar) structures
  /** @type {import("../types").Model.Private.flattenScheduleTreeToActivitiesArray} */
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
  /** @type {import("../types").Model.Private.findPositionInScheduleTree} */
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
  /** @type {import("../types").Model.Private.findSpecificActivityArrayInScheduleTree} */
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
  /** @type {import("../types").Model.Private.insertActivityIntoScheduleTree} */
  function insertActivityIntoScheduleTree(tree, activity) {
    return findSpecificActivityArrayInScheduleTree(tree, activity.schedule, true).push(activity);
  }
  /** @type {import("../types").Model.Private.moveActivityLocation} */
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
  /** @type {import("../types").Model.Private.findScheduleDepth} */
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
  /** @type {import("../types").Model.Private.dateFromSchedule} */
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
  /** @type {import("../types").Model.Private.applyActivityNumberLikeFilter} */
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
  /** @type {import("../types").Model.Private.filterActivityArray} */
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
  /** @type {import("../types").Model.Private.compareSchedules} */
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
  /** @type {import("../types").Model.Private.getUniqueId} */
  function getUniqueId() {
    let id = crypto.randomUUID();
    while (uniqueIds.has(id))
      id = crypto.randomUUID();
    uniqueIds.add(id);
    return id;
  }
  /** @type {import("../types").Model.Private.loadActivityIdsFromArray} */
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
  /** @type {import("../types").Model.Private.initializeRuntimeParameters} */
  function initializeRuntimeParameters() {
    // load Activity data
    scheduleTreeToActivityArray = getActivitiesStore();
    loadActivityIdsFromArray(flattenScheduleTreeToActivitiesArray(scheduleTreeToActivityArray));
  }
  /** @type {import("../types").Model.Private.clearRuntimeParameters} */
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
});
