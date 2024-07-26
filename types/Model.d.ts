export declare namespace Model {
  interface DaysToActivitiesMap {
    /** $day is an integer between 1 - 31 */
    [$day: number]: Array<Activity>;
    loose: Array<Activity>;
  }
  interface MonthsAndDaysToActivitiesTree {
    /** $month is an integer between 1 - 12 */
    [$month: number]: DaysToActivitiesMap;
    /** Activities without a valid schedule.month property */
    loose: Array<Activity>;
  }
  /**
   * Multi-level object containing arrays of
   * Activities with year, month, and day from
   * "schedule" property as keys (or "loose" if
   * some or all of these properties are omitted)
   * */
  interface ScheduleToActivitiesTree {
    /** A 4 digit integer */
    [$year: number]: MonthsAndDaysToActivitiesTree;
    /** Activities without a valid schedule.year property */
    loose: Array<Activity>;
  }

  interface Schedule {
    year?: number;
    month?: number;
    day?: number;
    hour?: number;
    minute?: number;
  }
  interface Activity {
    id: string;
    creation: string;
    name?: string;
    checked_off?: boolean;
    schedule?: Schedule;
  }
  /**
   * An object used to describe changes to an existing
   * Activity. All properties are optional.
   */
  interface ActivityDiff extends Activity {
   id?: Activity["id"];
   creation?: Activity["creation"];
  }
  /**
   * Object describing properties and values
   * used to filter Array<Activity>
   */
  interface ActivityFilter {
    checked_off?: boolean;
  }
  /**
   * Object describing properties and values
   * used to sort Array<Activity>
   */
  interface ActivitySort {
    /**
     * When this property is "true", the array
     * will be sorted with the Activity that has
     * the "schedule" property occurring chronologically
     * earliest starting at index 0.
     */
    scheduleAscending?: true;
  }
  namespace Private {
    // Manage local storage
    /**
     * Set (or clear) local storage
     * @param scheduleTree - If non-object then an empty object is saved.
     */
    function setActivitiesStore(scheduleTree?: ScheduleToActivitiesTree): void;
    /**
     * Read local storage and return its contents,
     * or throw error if contents corrupted.
     */
    function getActivitiesStore(): ScheduleToActivitiesTree;

    // Manage ScheduleToActivitiesTree (and similar) structures
    /**
     * Traverse through "scheduleTree" and collect
     * any Activity objects. Array is returned
     * unsorted (order is determined by recursive
     * Object.values calls).
     */
    function flattenScheduleTreeToActivitiesArray(scheduleTree: ScheduleToActivitiesTree): Array<Activity>;
    /**
     * Find and return a reference to a position
     * within "scheduleTree" as described in "schedule".
     * If a reference leading up to and including
     * the final position as described in "schedule"
     * is not defined within "scheduleTree",
     * behavior depends on value of "fillGaps".
     * @param fillGaps - If non-undefined value, then causes function to create empty objects/arrays where they are missing in "scheduleTree" (otherwise, a TypeError is thrown for property access on undefined)
     */
    function findPositionInScheduleTree(scheduleTree: ScheduleToActivitiesTree, schedule?: Schedule, fillGaps?: true): Array<Activity> | DaysToActivitiesMap | MonthsAndDaysToActivitiesTree | ScheduleToActivitiesTree | undefined;
    /**
     * Traverse the "scheduleTree" parameter using fields
     * found in the "schedule" parameter to return a
     * corresponding Activity array. If a branch of "scheduleTree"
     * is missing along the way, behavior depends on value of "fillGaps".
     * @param fillGaps - If non-undefined value, then causes function to create empty arrays/objects where they are missing in "scheduleTree" (otherwise, a TypeError is thrown for property retrieval on undefined)
     * @returns a reference encapsulated within "scheduleTree"
     */
    function findSpecificActivityArrayInScheduleTree(scheduleTree: ScheduleToActivitiesTree, schedule?: Schedule, fillGaps?: true): Array<Activity>;
    /**
     * Insert an Activity into a ScheduleToActivitiesTree.
     * Ensure all branches of tree exist before insertion.
     * @returns length of array that Activity was added into
     */
    function insertActivityIntoScheduleTree(tree: ScheduleToActivitiesTree, activity: Activity): number;
    /**
     * Update the "schedule" property of an Activity, and
     * move its relational storage location within runtime
     * parameter, "scheduleTreeToActivityArray". Does not
     * trigger a LocalStorage save.
     */
    function moveActivityLocation(activity: Activity, newSchedule: Schedule): void;

    // Manage Activity properties
    /**
     * Return an integer representing the number of
     * valid subsequential levels found within "schedule".
     * Validates that type of each property is "number".
     * @returns
     * - 0 = none
     * - 1 = year
     * - 2 = month
     * - 3 = day
     * - 4 = hour
     * - 5 = minute
     */
    function findScheduleDepth(schedule: Schedule): number;
    /**
     * Return a Date object representing closest chronological
     * approximation to properties of "schedule". Assumes
     * invalid "schedule" object to evaluate to Unix epoch.
     */
    function dateFromSchedule(schedule: Schedule): Date;

    // Manage Array<Activity> structure
    /**
     * Filter "activityArray" and return a new array
     * of the Activities passing the filter criteria.
     * Will not replace any value for a property being
     * tested on an Activity where it is "undefined".
     * @param filter - Object specifying properties and values to use for filtering
     * @param testForInequality - If the value is "true", then causes function to exclusively include Activities containing properties that do not equal those in "filter". For all other values, the function will exclusively include Activities containing properties that equal those in "filter".
     */
    function filterActivityArray(activityArray: Array<Activity>, filter: ActivityFilter, testForInequality?: true): Array<Activity>;
    /**
     * Compare the "schedule" parameters. Returns
     * -1 if the first is earlier than the second.
     * If the second is earlier, returns 1.
     * If they are chronologically equivalent and first has
     * a greater depth than the second, returns 1.
     * If the second has a greater depth in this case, returns -1.
     * Otherwise, 0 is returned.
     */
    function compareSchedules(first: Schedule, second: Schedule): number;

    // Manage UUIDs
    /**
     * Return a string id that is unique among
     * all those currently in localStorage. Uses
     * "uniqueIds" runtime parameter.
     */
    function getUniqueId(): string;
    /**
     * Read Activity objects from "activityArray".
     * Add their "id" property and their object
     * reference to runtime parameters.
     */
    function loadActivityIdsFromArray(activityArray: Array<Activity>): void;
    /**
     * Read LocalStorage to populate data for
     * runtime parameters.
     */
    function initializeRuntimeParameters(): void;
    /**
     * Delete all cached runtime parameter data.
     */
    function clearRuntimeParameters(): void;
  }
  /**
   * Set string key to be used for fetching Activity
   * data structures from LocalStorage API.
   */
  function setActivitiesStorageKey(newKey: string): void;
  /**
   * Get string key used for fetching Activity data
   * structures from LocalStorage API.
   */
  function getActivitiesStorageKey(): string;
  /**
   * Use "id" to lookup and return a reference to
   * an Activity object within runtime parameters.
   */
  function getActivity(id: Activity["id"]): Activity;
  /**
   * Add a new Activity to local storage as well as
   * runtime parameters.
   */
  function newActivity(activity: Activity): void;
  /**
   * Update an existing Activity within local storage
   * as well as runtime parameters.
   */
  function updateActivity(id: Activity["id"], diff: ActivityDiff): void;
  /**
   * Delete an Activity object from local storage as
   * well as runtime parameters.
   * @param id - "id" property of Activity to be deleted
   */
  function deleteActivity(id: Activity["id"]): void;
  /**
   * Return an array of Activity "id" values using
   * the Model. The array is sorted and filtered
   * according to parameters.
   */
  function getActivityIdArray(sort?: ActivitySort, filter?: ActivityFilter): Array<Activity.id>;
}