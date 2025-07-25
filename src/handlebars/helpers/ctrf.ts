import Handlebars from 'handlebars'
import { type CtrfTest } from '../../types'

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
export function LimitFailedTests(): void {
  Handlebars.registerHelper(
    'limitFailedTests',
    (tests: CtrfTest[], limit: number) => {
      return tests.filter(test => test.status === 'failed').slice(0, limit)
    }
  )
}

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
export function moreThanHelper(): void {
  Handlebars.registerHelper('moreThan', (a: number, b: number) => a > b)
}

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
export function countFlakyHelper(): void {
  Handlebars.registerHelper('countFlaky', tests => {
    return tests.filter((test: { flaky: boolean }) => test.flaky).length
  })
}

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
export function anyFlakyTestsHelper(): void {
  Handlebars.registerHelper('anyFlakyTests', (tests: CtrfTest[]) => {
    return tests.some(test => test.flaky)
  })
}

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
export function anyFailedTestsHelper(): void {
  Handlebars.registerHelper('anyFailedTests', (tests: CtrfTest[]) => {
    return tests.some(test => test.status === 'failed')
  })
}

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
export function anySkippedTestsHelper(): void {
  Handlebars.registerHelper('anySkippedTests', (tests: CtrfTest[]) => {
    return tests.some(
      test =>
        test.status === 'skipped' ||
        test.status === 'pending' ||
        test.status === 'other'
    )
  })
}

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
export function formatDurationStartStopToHumanHelper(): void {
  Handlebars.registerHelper('formatDuration', (start: number, stop: number) => {
    if (start === 0 && stop === 0) {
      return 'not captured'
    }

    if (isNaN(start) || isNaN(stop)) {
      return 'not captured'
    }

    const durationMs = stop - start
    if (durationMs < 1) {
      return `1ms`
    } else if (durationMs < 1000) {
      return `${Math.floor(durationMs)}ms`
    } else if (durationMs < 60000) {
      return `${(durationMs / 1000).toFixed(1)}s`
    } else {
      const minutes = Math.floor(durationMs / 60000)
      const seconds = Math.floor((durationMs % 60000) / 1000)
      return `${minutes}m${seconds}s`
    }
  })
}

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
export function formatDurationMsToHumanHelper(): void {
  Handlebars.registerHelper('formatDurationMs', (duration: number) => {
    if (isNaN(duration)) {
      return 'not captured'
    }

    if (duration < 1) {
      return `1ms`
    } else if (duration < 1000) {
      return `${Math.floor(duration)}ms`
    } else if (duration < 60000) {
      return `${(duration / 1000).toFixed(1)}s`
    } else {
      const minutes = Math.floor(duration / 60000)
      const seconds = Math.floor((duration % 60000) / 1000)
      return `${minutes}m${seconds}s`
    }
  })
}

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
export function equalsHelper(): void {
  Handlebars.registerHelper('eq', (arg1: unknown, arg2: unknown) => {
    return arg1 === arg2
  })
}

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
export function sortTestsByFlakyRateHelper(): void {
  Handlebars.registerHelper('sortTestsByFlakyRate', (tests: CtrfTest[]) => {
    const testsCopy = tests.slice()

    const flakyTests = testsCopy.filter(
      test =>
        test.extra !== undefined &&
        typeof test.extra.flakyRate === 'number' &&
        test.extra.flakyRate > 0
    )

    flakyTests.sort(
      (a, b) => (b.extra?.flakyRate ?? 0) - (a.extra?.flakyRate ?? 0)
    )

    return flakyTests
  })
}

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
export function sortTestsByFailRateHelper(): void {
  Handlebars.registerHelper('sortTestsByFailRate', (tests: CtrfTest[]) => {
    const testsCopy = tests.slice()

    const failedTests = testsCopy.filter(
      test =>
        test.extra !== undefined &&
        typeof test.extra.failRate === 'number' &&
        test.extra.failRate > 0
    )

    failedTests.sort(
      (a, b) => (b.extra?.failRate ?? 0) - (a.extra?.failRate ?? 0)
    )

    return failedTests
  })
}

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
export function formatRateHelper(): void {
  Handlebars.registerHelper(
    'formatRate',
    (rate: number, fractionDigits: number) => {
      return rate.toFixed(fractionDigits)
    }
  )
}
