import {
  type CtrfEnvironment,
  type CtrfReport,
  type CtrfTest,
} from './types/ctrf'
import { type Options } from './types/reporter'
import { COLORS, MESSAGES, TEST_STATUS, TITLES } from './constants'
import {
  createTestResultBlocks,
  createMessageBlocks,
  createFlakyTestBlocks,
  createSingleAiTestBlocks,
  createAiTestBlocks,
  createFailedTestBlocks,
  createSingleFailedTestBlocks,
} from './blocks'

export const formatResultsMessage = (
  ctrf: CtrfReport,
  options?: Options
): object => {
  const { summary, environment } = ctrf.results
  const { failed } = summary
  const { title, prefix, suffix } = normalizeOptions(
    TITLES.TEST_RESULTS,
    options
  )
  const { buildInfo, missingEnvProperties } = handleBuildInfo(environment)

  const customBlocks = createTestResultBlocks(summary, buildInfo)

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
  const { buildInfo, missingEnvProperties } = handleBuildInfo(environment)

  if (!ai || status === TEST_STATUS.PASSED) {
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

export const formatConsolidatedAiTestSummary = (
  tests: CtrfTest[],
  environment: CtrfEnvironment | undefined,
  options?: Options
): object | null => {
  const failedTests = tests.filter(
    (test) => test.ai && test.status === TEST_STATUS.FAILED
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
  const defaultTitle = options?.title
    ? options.title
    : TITLES.FAILED_TEST_REPORT
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

export function createSlackMessage(
  blocks: any[],
  color: string,
  title: string,
  environment?: CtrfEnvironment,
  additionalInfo?: string
): object {
  const notification: string[] = []
  notification.push(title)

  if (environment) {
    const { buildName, buildNumber } = environment
    if (buildName && buildNumber) {
      notification.push(`${buildName} #${buildNumber}`)
    }
  }

  if (additionalInfo) {
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

function handleBuildInfo(environment: CtrfEnvironment | undefined): {
  buildInfo: string
  missingEnvProperties: string[]
} {
  const missingEnvProperties: string[] = []

  if (!environment) {
    return {
      buildInfo: MESSAGES.NO_BUILD_INFO,
      missingEnvProperties: ['buildName', 'buildNumber', 'buildUrl'],
    }
  }

  const { buildName, buildNumber, buildUrl } = environment

  if (!buildName) missingEnvProperties.push('buildName')
  if (!buildNumber) missingEnvProperties.push('buildNumber')
  if (!buildUrl) missingEnvProperties.push('buildUrl')

  if (buildName && buildNumber) {
    const buildText = buildUrl
      ? `<${buildUrl}|${buildName} #${buildNumber}>`
      : `${buildName} #${buildNumber}`

    return {
      buildInfo: `${MESSAGES.BUILD_PREFIX}${buildText}`,
      missingEnvProperties,
    }
  } else if (buildName || buildNumber) {
    return {
      buildInfo: `${MESSAGES.BUILD_PREFIX} ${buildName || ''} ${buildNumber || ''}`,
      missingEnvProperties,
    }
  }

  return {
    buildInfo: MESSAGES.NO_BUILD_INFO,
    missingEnvProperties,
  }
}

function normalizeOptions(
  defaultTitle: string,
  options?: Options
): { title: string; prefix: string | null; suffix: string | null } {
  const { title = defaultTitle, prefix = null, suffix = null } = options || {}
  return { title, prefix, suffix }
}
