import {
  type CtrfEnvironment,
  type CtrfReport,
  type CtrfTest,
} from './types/ctrf'
import { type Options } from './types/reporter'
import {
  BLOCK_TYPES,
  COLORS,
  MESSAGES,
  TEST_STATUS,
  TEXT_TYPES,
  TITLES,
} from './constants'
import {
  createTestResultBlocks,
  createMessageBlocks,
  createFlakyTestBlocks,
  createSingleAiTestBlocks,
  createAiTestBlocks,
  createFailedTestBlocks,
  createSingleFailedTestBlocks,
} from './blocks'

/**
 * Format the results message
 * @param ctrf - The CTRF report
 * @param options - The options for the message
 * @returns The formatted message
 */
export const formatResultsMessage = (
  ctrf: CtrfReport,
  options?: Options
): object => {
  const { summary, environment, tests = [] } = ctrf.results
  const { failed } = summary
  const { title, prefix, suffix } = normalizeOptions(
    TITLES.TEST_RESULTS,
    options
  )
  const { buildInfo, missingEnvProperties } = handleBuildInfo(environment)

  const flakyCount = tests.filter((test) => test.flaky).length

  const customBlocks = createTestResultBlocks(summary, buildInfo, flakyCount)

  const blocks = createMessageBlocks({
    title,
    prefix,
    suffix,
    missingEnvProperties,
    customBlocks,
  })

  const message = failed > 0 ? `Failed: ${failed}` : 'Passed'

  return createSlackMessage(
    blocks,
    failed > 0 ? COLORS.FAILED : COLORS.PASSED,
    title,
    environment,
    message
  )
}

/**
 * Format the flaky tests message
 * @param ctrf - The CTRF report
 * @param options - The options for the message
 * @returns The formatted message
 */
export const formatFlakyTestsMessage = (
  ctrf: CtrfReport,
  options?: Options
): object | null => {
  const { environment, tests } = ctrf.results
  const flakyTests = tests.filter((test) => test.flaky)
  const { title, prefix, suffix } = normalizeOptions(
    TITLES.FLAKY_TESTS,
    options
  )
  const { buildInfo, missingEnvProperties } = handleBuildInfo(environment)

  if (flakyTests.length === 0) {
    return null
  }

  const customBlocks = createFlakyTestBlocks(flakyTests, buildInfo)

  const blocks = createMessageBlocks({
    title,
    prefix,
    suffix,
    missingEnvProperties,
    customBlocks,
  })

  return createSlackMessage(
    blocks,
    COLORS.FLAKY,
    title,
    environment,
    'Flaky tests detected'
  )
}

/**
 * Format the AI test summary message
 * @param test - The test
 * @param environment - The environment
 * @param options - The options for the message
 * @returns The formatted message
 */
export const formatAiTestSummary = (
  test: CtrfTest,
  environment: CtrfEnvironment | undefined,
  options?: Options
): object | null => {
  const { name, ai, status } = test
  const { title, prefix, suffix } = normalizeOptions(
    TITLES.AI_TEST_SUMMARY,
    options
  )
  const { missingEnvProperties } = handleBuildInfo(environment)

  if (ai === undefined || status === TEST_STATUS.PASSED) {
    return null
  }

  const customBlocks = createSingleAiTestBlocks(name, ai)

  const blocks = createMessageBlocks({
    title,
    prefix,
    suffix,
    missingEnvProperties,
    customBlocks,
  })

  return createSlackMessage(blocks, COLORS.AI, title, environment, name)
}

/**
 * Format the consolidated AI test summary message
 * @param tests - The tests
 * @param environment - The environment
 * @param options - The options for the message
 * @returns The formatted message
 */
export const formatConsolidatedAiTestSummary = (
  tests: CtrfTest[],
  environment: CtrfEnvironment | undefined,
  options?: Options
): object | null => {
  const failedTests = tests.filter(
    (test) => test.ai !== undefined && test.status === TEST_STATUS.FAILED
  )
  const { title, prefix, suffix } = normalizeOptions(
    TITLES.AI_TEST_REPORTER,
    options
  )
  const { buildInfo, missingEnvProperties } = handleBuildInfo(environment)

  if (failedTests.length === 0) {
    return null
  }

  const customBlocks = createAiTestBlocks(failedTests, buildInfo)

  const blocks = createMessageBlocks({
    title,
    prefix,
    suffix,
    missingEnvProperties,
    customBlocks,
  })

  return createSlackMessage(blocks, COLORS.AI, title, environment)
}

export const formatConsolidatedFailedTestSummary = (
  tests: CtrfTest[],
  environment: CtrfEnvironment | undefined,
  options?: Options
): object | null => {
  const failedTests = tests.filter((test) => test.status === TEST_STATUS.FAILED)
  const defaultTitle = options?.title ?? TITLES.FAILED_TEST_REPORT
  const { title, prefix, suffix } = normalizeOptions(defaultTitle, options)
  const { buildInfo, missingEnvProperties } = handleBuildInfo(environment)

  if (failedTests.length === 0) {
    return null
  }

  const customBlocks = createFailedTestBlocks(failedTests, buildInfo)

  const blocks = createMessageBlocks({
    title,
    prefix,
    suffix,
    missingEnvProperties,
    customBlocks,
  })

  return createSlackMessage(blocks, COLORS.FAILED, title, environment)
}

export const formatFailedTestSummary = (
  test: CtrfTest,
  environment: CtrfEnvironment | undefined,
  options?: Options
): object | null => {
  const { name, message, status } = test
  const { title, prefix, suffix } = normalizeOptions(
    TITLES.FAILED_TEST_SUMMARY,
    options
  )
  const { buildInfo, missingEnvProperties } = handleBuildInfo(environment)

  if (status !== TEST_STATUS.FAILED) {
    return null
  }

  const customBlocks = createSingleFailedTestBlocks(name, message, buildInfo)

  const blocks = createMessageBlocks({
    title,
    prefix,
    suffix,
    missingEnvProperties,
    customBlocks,
  })

  return createSlackMessage(blocks, COLORS.FAILED, title, environment, name)
}

export const formatCustomMarkdownMessage = (
  report: CtrfReport,
  templateContent: string,
  environment: CtrfEnvironment | undefined,
  options?: Options
): object | null => {
  const { title, prefix, suffix } = normalizeOptions('', options)
  const { missingEnvProperties } = handleBuildInfo(environment)

  const customBlocks = [
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: templateContent,
      },
    },
  ]

  const blocks = createMessageBlocks({
    title,
    prefix,
    suffix,
    customBlocks,
    missingEnvProperties,
  })

  return createSlackMessage(
    blocks,
    report.results.summary.failed > 0 ? COLORS.FAILED : COLORS.PASSED,
    title,
    environment
  )
}

export const formatCustomBlockKitMessage = (
  report: CtrfReport,
  blockKit: any
): object | null => {
  blockKit.blocks.push({
    type: BLOCK_TYPES.CONTEXT,
    elements: [
      {
        type: TEXT_TYPES.MRKDWN,
        text: MESSAGES.FOOTER_TEXT,
      },
    ],
  })

  return createSlackMessage(
    blockKit.blocks,
    report.results.summary.failed > 0 ? COLORS.FAILED : COLORS.PASSED,
    '',
    report.results.environment,
    'Test Results'
  )
}

export function createSlackMessage(
  blocks: any[],
  color: string,
  title: string,
  environment?: CtrfEnvironment,
  additionalInfo?: string
): object {
  const notification: string[] = []
  notification.push(title)

  if (environment !== undefined) {
    const { buildName, buildNumber } = environment
    if (buildName !== undefined && buildNumber !== undefined) {
      notification.push(`${buildName} #${buildNumber}`)
    }
  }

  if (additionalInfo !== undefined) {
    notification.push(additionalInfo)
  }

  return {
    attachments: [
      {
        fallback: notification.join('\n'),
        color,
        blocks,
      },
    ],
  }
}

/**
 * Handle the build info
 * @param environment - The environment
 * @returns The build info
 */
function handleBuildInfo(environment: CtrfEnvironment | undefined): {
  buildInfo: string
  missingEnvProperties: string[]
} {
  const missingEnvProperties: string[] = []

  // Extract build info from process.env or environment as fallback
  const buildName =
    process.env.BUILD_NAME ?? environment?.buildName ?? undefined
  const buildNumber =
    process.env.BUILD_NUMBER ?? environment?.buildNumber ?? undefined
  const buildUrl = process.env.BUILD_URL ?? environment?.buildUrl ?? undefined

  // If no environment and no process.env values, return early
  if (
    environment === undefined &&
    buildName === undefined &&
    buildNumber === undefined &&
    buildUrl === undefined
  ) {
    return {
      buildInfo: MESSAGES.NO_BUILD_INFO,
      missingEnvProperties: ['buildName', 'buildNumber', 'buildUrl'],
    }
  }
  if (buildName === undefined) missingEnvProperties.push('buildName')
  if (buildNumber === undefined) missingEnvProperties.push('buildNumber')
  if (buildUrl === undefined) missingEnvProperties.push('buildUrl')

  if (buildName !== undefined && buildNumber !== undefined) {
    const buildText =
      buildUrl !== undefined
        ? `<${buildUrl}|${buildName} #${buildNumber}>`
        : `${buildName} #${buildNumber}`

    return {
      buildInfo: `${MESSAGES.BUILD_PREFIX}${buildText}`,
      missingEnvProperties,
    }
  } else if (buildName !== undefined || buildNumber !== undefined) {
    return {
      buildInfo: `${MESSAGES.BUILD_PREFIX} ${buildName ?? ''} ${buildNumber ?? ''}`,
      missingEnvProperties,
    }
  }

  return {
    buildInfo: MESSAGES.NO_BUILD_INFO,
    missingEnvProperties,
  }
}

/**
 * Normalize the options
 * @param defaultTitle - The default title
 * @param options - The options
 * @returns The normalized options
 */
function normalizeOptions(
  defaultTitle: string,
  options?: Options
): { title: string; prefix: string | null; suffix: string | null } {
  const { title = defaultTitle, prefix = null, suffix = null } = options ?? {}
  return { title, prefix, suffix }
}
