import {
  formatResultsMessage,
  formatAiTestSummary,
  formatFailedTestSummary,
  formatFlakyTestsMessage,
  formatConsolidatedAiTestSummary,
  formatConsolidatedFailedTestSummary,
  formatCustomMarkdownMessage,
  formatCustomBlockKitMessage,
  formatGlobalAiSummary,
} from './message-formatter.js'
import { SlackClient } from './client/index.js'
import { type Options, type SlackMessage } from './types/reporter.js'
import {
  type CtrfEnvironment,
  type CtrfReport,
  type CtrfTest,
} from './types/ctrf.js'
import { stripAnsiFromErrors } from './utils/common.js'
import { compileTemplate } from './handlebars/core.js'
import { LIMITS, NOTICES, formatString } from './constants.js'

function resolveOptions(options: Options): Options {
  return {
    ...options,
    threadTs: options.threadTs || process.env.SLACK_THREAD_TS,
    autoThread: options.autoThread ?? process.env.SLACK_AUTO_THREAD === 'true',
    maxRetries:
      options.maxRetries ?? parseInt(process.env.SLACK_MAX_RETRIES || '3', 10),
    dryRun: options.dryRun ?? process.env.SLACK_DRY_RUN === 'true',
  }
}

/**
 * Internal utility to handle the logic of sending a summary message and then threading individual details.
 */
async function dispatchThreadedReports(
  client: SlackClient,
  report: CtrfReport,
  options: Options,
  logs: boolean,
  summaryTitle: string,
  testFormatter: (
    test: CtrfTest,
    env: CtrfEnvironment | undefined,
    opts: Options
  ) => SlackMessage | null,
  headerFormatter?: (rep: CtrfReport, opts: Options) => SlackMessage | null
): Promise<string | undefined> {
  let parentTs: string | undefined
  const threadTs = options.threadTs
  const autoThread = options.autoThread === true
  const maxReports = options.maxReports ?? LIMITS.MAX_FAILED_TESTS

  if (!threadTs && autoThread) {
    let summaryMsg: SlackMessage | null = null

    if (headerFormatter) {
      summaryMsg = headerFormatter(report, options)
    }

    if (!summaryMsg && report.results.summary.failed > 1) {
      summaryMsg = {
        text: `*${options.title || summaryTitle}*: ${report.results.summary.failed} tests failed. See thread for details.`,
      }
    }

    if (summaryMsg) {
      parentTs = await client.sendMessage(summaryMsg)
      if (logs) console.log(`${summaryTitle} header sent to Slack.`)
    }
  }

  const failedTests = report.results.tests.filter(t => t.status === 'failed')
  const limitedTests = failedTests.slice(0, maxReports)

  let firstTimestamp: string | undefined
  for (const test of limitedTests) {
    const message = testFormatter(test, report.results.environment, options)
    if (message !== null) {
      const ts = await client.sendMessage({
        ...message,
        thread_ts: parentTs || threadTs,
      })
      if (logs) console.log(`${summaryTitle} detail sent to Slack.`)
      if (!firstTimestamp) firstTimestamp = ts
    } else {
      if (logs) console.log(`No ${summaryTitle} detected. No message sent`)
    }
  }

  if (failedTests.length > maxReports) {
    const noticeMsg = {
      text: formatString(
        NOTICES.MAX_TESTS_EXCEEDED,
        maxReports,
        failedTests.length - maxReports
      ),
      thread_ts: parentTs || threadTs,
    }
    await client.sendMessage(noticeMsg)
  }

  return parentTs || firstTimestamp
}

/**
 * Send the test results to Slack
 * @param report - The CTRF report
 * @param options - The options for the message
 * @param logs - Whether to log the message
 * @returns The message timestamp if returnTs is true and using OAuth, otherwise void
 */
export async function sendTestResultsToSlack(
  report: CtrfReport,
  options: Options = {},
  logs: boolean = false
): Promise<string | void> {
  const resolvedOptions = resolveOptions(options)
  if (
    resolvedOptions.onFailOnly !== undefined &&
    resolvedOptions.onFailOnly &&
    report.results.summary.failed === 0
  ) {
    if (logs) console.log('No failed tests. Message not sent.')
    return
  }

  const client = new SlackClient(resolvedOptions)
  const message = formatResultsMessage(report, resolvedOptions)
  const ts = await client.sendMessage(message)

  if (logs) console.log('Test results message sent to Slack.')

  if (resolvedOptions.returnTs) return ts
}

/**
 * Send the failed test results to Slack
 * @param report - The CTRF report
 * @param options - The options for the message
 * @param logs - Whether to log the message
 * @returns The message timestamp if returnTs is true and using OAuth, otherwise void
 */
export async function sendFailedResultsToSlack(
  report: CtrfReport,
  options: Options = {},
  logs: boolean = false
): Promise<string | void> {
  if (report.results.summary.failed === 0) {
    return
  }

  report = stripAnsiFromErrors(report)
  const resolvedOptions = resolveOptions(options)
  const client = new SlackClient(resolvedOptions)

  if (
    resolvedOptions.consolidated !== undefined &&
    resolvedOptions.consolidated
  ) {
    const message = formatConsolidatedFailedTestSummary(
      report.results.tests,
      report.results.environment,
      resolvedOptions
    )
    if (message !== null) {
      const ts = await client.sendMessage(message)
      if (logs) console.log('Failed test summary sent to Slack.')
      if (resolvedOptions.returnTs) return ts
    } else {
      if (logs) console.log('No failed test summary detected. No message sent.')
    }
  } else {
    const ts = await dispatchThreadedReports(
      client,
      report,
      resolvedOptions,
      logs,
      'Failed test report',
      formatFailedTestSummary
    )
    if (resolvedOptions.returnTs) return ts
  }
}

/**
 * Send the flaky test results to Slack
 * @param report - The CTRF report
 * @param options - The options for the message
 * @param logs - Whether to log the message
 * @returns The message timestamp if returnTs is true and using OAuth, otherwise void
 */
export async function sendFlakyResultsToSlack(
  report: CtrfReport,
  options: Options = {},
  logs: boolean = false
): Promise<string | void> {
  const resolvedOptions = resolveOptions(options)
  const message = formatFlakyTestsMessage(report, resolvedOptions)
  if (message !== null) {
    const client = new SlackClient(resolvedOptions)
    const ts = await client.sendMessage(message)
    if (logs) console.log('Flaky tests message sent to Slack.')
    if (resolvedOptions.returnTs) return ts
  } else {
    if (logs) console.log('No flaky tests detected. No message sent.')
  }
}

/**
 * Send the AI test summary to Slack
 * @param report - The CTRF report
 * @param options - The options for the message
 * @param logs - Whether to log the message
 * @returns The message timestamp if returnTs is true and using OAuth, otherwise void
 */
export async function sendAISummaryToSlack(
  report: CtrfReport,
  options: Options = {},
  logs: boolean = false
): Promise<string | void> {
  const resolvedOptions = resolveOptions(options)
  const client = new SlackClient(resolvedOptions)

  if (
    resolvedOptions.consolidated !== undefined &&
    resolvedOptions.consolidated
  ) {
    const message = formatConsolidatedAiTestSummary(report, resolvedOptions)
    if (message !== null) {
      const ts = await client.sendMessage(message)
      if (logs) console.log('AI test summary sent to Slack.')
      if (resolvedOptions.returnTs) return ts
    } else {
      if (logs) console.log('No AI summary detected. No message sent.')
    }
  } else {
    const ts = await dispatchThreadedReports(
      client,
      report,
      resolvedOptions,
      logs,
      'AI test summary',
      formatAiTestSummary,
      formatGlobalAiSummary
    )
    if (resolvedOptions.returnTs) return ts
  }
}

/**
 * Send a message to Slack using a custom Handlebars template
 * @param report - The CTRF report
 * @param templateContent - The Handlebars template content
 * @param options - The options for the message
 * @param logs - Whether to log the message
 * @returns The message timestamp if returnTs is true and using OAuth, otherwise void
 */
export async function sendCustomMarkdownTemplateToSlack(
  report: CtrfReport,
  templateContent: string,
  options: Options = {},
  logs: boolean = false
): Promise<string | void> {
  const resolvedOptions = resolveOptions(options)
  if (
    resolvedOptions.onFailOnly !== undefined &&
    resolvedOptions.onFailOnly &&
    report.results.summary.failed === 0
  ) {
    if (logs) console.log('No failed tests. Message not sent.')
    return
  }
  report = stripAnsiFromErrors(report)

  const compiledContent = compileTemplate(templateContent, report)

  const message = formatCustomMarkdownMessage(
    report,
    compiledContent,
    report.results.environment,
    resolvedOptions
  )

  if (message !== null) {
    const client = new SlackClient(resolvedOptions)
    const ts = await client.sendMessage(message)
    if (logs) console.log('Custom template message sent to Slack.')
    if (resolvedOptions.returnTs) return ts
  } else {
    if (logs) console.log('No custom message detected. No message sent.')
  }
}

/**
 * Send a custom Block Kit JSON template to Slack
 * @param report - The CTRF report
 * @param templateContent - The Handlebars template content
 * @param options - The options for the message
 * @param logs - Whether to log the message
 * @returns The message timestamp if returnTs is true and using OAuth, otherwise void
 */
export async function sendCustomBlockKitTemplateToSlack(
  report: CtrfReport,
  templateContent: string,
  options: Options = {},
  logs: boolean = false
): Promise<string | void> {
  const resolvedOptions = resolveOptions(options)
  if (
    resolvedOptions.onFailOnly !== undefined &&
    resolvedOptions.onFailOnly &&
    report.results.summary.failed === 0
  ) {
    if (logs) console.log('No failed tests. Message not sent.')
    return
  }

  report = stripAnsiFromErrors(report)

  const compiledContent = compileTemplate(templateContent, report)

  const blockKit = JSON.parse(compiledContent)

  if (blockKit.blocks.length === 0) {
    if (logs) console.log('No blocks detected. No message sent.')
    return
  }

  const message = formatCustomBlockKitMessage(report, blockKit)

  if (message !== null) {
    const client = new SlackClient(resolvedOptions)
    const ts = await client.sendMessage(message)
    if (logs) console.log('Custom Block Kit message sent to Slack.')
    if (resolvedOptions.returnTs) return ts
  } else {
    if (logs)
      console.log('No custom Block Kit message detected. No message sent.')
  }
}
