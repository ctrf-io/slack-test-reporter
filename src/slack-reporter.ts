import {
  formatResultsMessage,
  formatAiTestSummary,
  formatFailedTestSummary,
  formatFlakyTestsMessage,
  formatConsolidatedAiTestSummary,
  formatConsolidatedFailedTestSummary,
  formatCustomMarkdownMessage
} from './message-formatter'
import { sendSlackMessage } from './client'
import { type Options } from './types/reporter'
import { type CtrfReport } from './types/ctrf'
import { stripAnsiFromErrors } from './utils/common'
import { compileTemplate } from './handlebars/core'

/**
 * Send the test results to Slack
 * @param report - The CTRF report
 * @param options - The options for the message
 * @param logs - Whether to log the message
 */
export async function sendTestResultsToSlack(
  report: CtrfReport,
  options: Options = {},
  logs: boolean = false
): Promise<void> {
  if (options.token !== undefined) {
    process.env.SLACK_WEBHOOK_URL = options.token
  }

  if (
    options.onFailOnly !== undefined &&
    options.onFailOnly &&
    report.results.summary.failed === 0
  ) {
    logs && console.log('No failed tests. Message not sent.')
    return
  }

  const message = formatResultsMessage(report, options)

  await sendSlackMessage(message)
  logs && console.log('Test results message sent to Slack.')
}

/**
 * Send the failed test results to Slack
 * @param report - The CTRF report
 * @param options - The options for the message
 * @param logs - Whether to log the message
 */
export async function sendFailedResultsToSlack(
  report: CtrfReport,
  options: Options = {},
  logs: boolean = false
): Promise<void> {
  if (options.token !== undefined) {
    process.env.SLACK_WEBHOOK_URL = options.token
  }

  if (report.results.summary.failed === 0) {
    return
  }

  report = stripAnsiFromErrors(report)

  if (options.consolidated !== undefined && options.consolidated) {
    const message = formatConsolidatedFailedTestSummary(
      report.results.tests,
      report.results.environment,
      options
    )
    if (message !== null) {
      await sendSlackMessage(message)
      logs && console.log('Failed test summary sent to Slack.')
    } else {
      logs && console.log('No failed test summary detected. No message sent.')
    }
  } else {
    for (const test of report.results.tests) {
      if (test.status === 'failed') {
        const message = formatFailedTestSummary(
          test,
          report.results.environment,
          options
        )
        if (message !== null) {
          await sendSlackMessage(message)
          logs && console.log('Failed test summary sent to Slack.')
        } else {
          logs &&
            console.log('No failed test summary detected. No message sent')
        }
      }
    }
  }
}

/**
 * Send the flaky test results to Slack
 * @param report - The CTRF report
 * @param options - The options for the message
 * @param logs - Whether to log the message
 */
export async function sendFlakyResultsToSlack(
  report: CtrfReport,
  options: Options = {},
  logs: boolean = false
): Promise<void> {
  if (options.token !== undefined) {
    process.env.SLACK_WEBHOOK_URL = options.token
  }

  const message = formatFlakyTestsMessage(report, options)
  if (message !== null) {
    await sendSlackMessage(message)
    logs && console.log('Flaky tests message sent to Slack.')
  } else {
    logs && console.log('No flaky tests detected. No message sent.')
  }
}

/**
 * Send the AI test summary to Slack
 * @param report - The CTRF report
 * @param options - The options for the message
 * @param logs - Whether to log the message
 */
export async function sendAISummaryToSlack(
  report: CtrfReport,
  options: Options = {},
  logs: boolean = false
): Promise<void> {
  if (options.token !== undefined) {
    process.env.SLACK_WEBHOOK_URL = options.token
  }

  if (options.consolidated !== undefined && options.consolidated) {
    const message = formatConsolidatedAiTestSummary(
      report.results.tests,
      report.results.environment,
      options
    )
    if (message !== null) {
      await sendSlackMessage(message)
      logs && console.log('AI test summary sent to Slack.')
    } else {
      logs && console.log('No AI summary detected. No message sent.')
    }
  } else {
    for (const test of report.results.tests) {
      if (test.status === 'failed') {
        const message = formatAiTestSummary(
          test,
          report.results.environment,
          options
        )
        if (message !== null) {
          await sendSlackMessage(message)
          logs && console.log('AI test summary sent to Slack.')
        } else {
          logs && console.log('No AI summary detected. No message sent')
        }
      }
    }
  }
}

/**
 * Send a message to Slack using a custom Handlebars template
 * @param report - The CTRF report
 * @param templateContent - The Handlebars template content
 * @param options - The options for the message
 * @param logs - Whether to log the message
 */
export async function sendCustomMardownTemplateToSlack(
  report: CtrfReport,
  templateContent: string,
  options: Options = {},
  logs: boolean = false
): Promise<void> {
  if (options.token !== undefined) {
    process.env.SLACK_WEBHOOK_URL = options.token
  }

  report = stripAnsiFromErrors(report)

  const compiledContent = compileTemplate(templateContent, report)

  const message = formatCustomMarkdownMessage(
    report,
    compiledContent,
    report.results.environment,
    options
  )

  if (message !== null) {
    await sendSlackMessage(message)
    logs && console.log('Custom template message sent to Slack.')
  } else {
    logs && console.log('No custom message detected. No message sent.')
  }
}
