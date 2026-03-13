/**
 * Filters an array of tests to only those that have failed, then limits the result to a specified number.
 *
 * @example
 * In Handlebars:
 * {{#each (limitFailedTests tests 5)}}{{this.name}}{{/each}}
 *
 * This will loop through up to 5 failed tests.
 *
 * @param {CtrfTest[]} tests - An array of CtrfTest objects.
 * @param {number} limit - The maximum number of failed tests to return.
 * @returns {CtrfTest[]} An array of failed tests up to the specified limit.
 */
export declare function LimitFailedTests(): void;
/**
 * Checks if a number `a` is greater than number `b`.
 *
 * @example
 * In Handlebars:
 * {{#if (moreThan 10 5)}}Greater{{else}}Not Greater{{/if}}
 *
 * @param {number} a - The first number.
 * @param {number} b - The second number.
 * @returns {boolean} True if `a` > `b`, false otherwise.
 */
export declare function moreThanHelper(): void;
/**
 * Counts how many tests are flaky.
 *
 * @example
 * In Handlebars:
 * Flaky tests count: {{countFlaky tests}}
 *
 * @param {CtrfTest[]} tests - An array of CtrfTest objects.
 * @returns {number} The number of flaky tests.
 */
export declare function countFlakyHelper(): void;
/**
 * Determines if there are any flaky tests in the given array.
 *
 * @example
 * In Handlebars:
 * {{#if (anyFlakyTests tests)}}Some tests are flaky{{else}}No flaky tests{{/if}}
 *
 * @param {CtrfTest[]} tests - An array of CtrfTest objects.
 * @returns {boolean} True if any test is flaky, false otherwise.
 */
export declare function anyFlakyTestsHelper(): void;
/**
 * Determines if there are any failed tests in the given array.
 *
 * @example
 * In Handlebars:
 * {{#if (anyFailedTests tests)}}Some tests failed{{else}}No failures{{/if}}
 *
 * @param {CtrfTest[]} tests - An array of CtrfTest objects.
 * @returns {boolean} True if any test has failed, false otherwise.
 */
export declare function anyFailedTestsHelper(): void;
/**
 * Determines if there are any skipped, pending, or "other" tests in the given array.
 *
 * @example
 * In Handlebars:
 * {{#if (anySkippedTests tests)}}Some tests were skipped{{else}}No skips{{/if}}
 *
 * @param {CtrfTest[]} tests - An array of CtrfTest objects.
 * @returns {boolean} True if any test is skipped/pending/other, false otherwise.
 */
export declare function anySkippedTestsHelper(): void;
/**
 * Formats a test duration given a start and stop time (in milliseconds) into a human-readable format.
 * Returns values like "1ms", "250ms", "1.2s", or "1m30s".
 *
 * @example
 * In Handlebars:
 * Duration: {{formatDuration test.startTime test.endTime}}
 *
 * @param {number} start - The start time in milliseconds.
 * @param {number} stop - The stop time in milliseconds.
 * @returns {string} A formatted duration string.
 */
export declare function formatDurationStartStopToHumanHelper(): void;
/**
 * Formats a duration given in milliseconds into a human-readable format.
 * Similar to `formatDuration` but takes only one parameter.
 *
 * @example
 * In Handlebars:
 * {{formatDurationMs testDuration}}
 *
 * @param {number} duration - The duration in milliseconds.
 * @returns {string} A formatted duration string.
 */
export declare function formatDurationMsToHumanHelper(): void;
/**
 * Checks if two values are equal.
 *
 * @example
 * In Handlebars:
 * {{#if (eq test.status "failed")}}This test failed{{/if}}
 *
 * @param {unknown} arg1 - The first value to compare.
 * @param {unknown} arg2 - The second value to compare.
 * @returns {boolean} True if values are strictly equal, false otherwise.
 */
export declare function equalsHelper(): void;
/**
 * Sorts tests by their flaky rate in descending order.
 *
 * @example
 * In Handlebars:
 * {{#each (sortTestsByFlakyRate tests)}}{{this.name}} - Flaky Rate: {{this.extra.flakyRate}}{{/each}}
 *
 * @param {CtrfTest[]} tests - An array of CtrfTest objects.
 * @returns {CtrfTest[]} A sorted array of tests that have a flaky rate, from highest to lowest.
 */
export declare function sortTestsByFlakyRateHelper(): void;
/**
 * Sorts tests by their fail rate in descending order.
 *
 * @example
 * In Handlebars:
 * {{#each (sortTestsByFailRate tests)}}{{this.name}} - Fail Rate: {{this.extra.failRate}}{{/each}}
 *
 * @param {CtrfTest[]} tests - An array of CtrfTest objects.
 * @returns {CtrfTest[]} A sorted array of tests that have a fail rate, from highest to lowest.
 */
export declare function sortTestsByFailRateHelper(): void;
/**
 * Formats a numeric rate (e.g. fail rate, flaky rate) to a fixed number of decimal places.
 *
 * @example
 * In Handlebars:
 * {{formatRate 0.12345 2}} -> "0.12"
 *
 * @param {number} rate - The numeric rate to format.
 * @param {number} fractionDigits - The number of decimal places.
 * @returns {string} The formatted rate as a string.
 */
export declare function formatRateHelper(): void;
//# sourceMappingURL=ctrf.d.ts.map