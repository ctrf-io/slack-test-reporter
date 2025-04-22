import {
  formatResultsMessage,
  formatAiTestSummary,
  formatFailedTestSummary,
  formatFlakyTestsMessage,
  formatConsolidatedAiTestSummary,
  formatConsolidatedFailedTestSummary,
  formatCustomMarkdownMessage,
  formatCustomBlockKitMessage,
} from './message-formatter'
import { sendSlackMessage, postMessage } from './client'
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
  if (
    options.onFailOnly !== undefined &&
    options.onFailOnly &&
    report.results.summary.failed === 0
  ) {
    logs && console.log('No failed tests. Message not sent.')
    return
  }

  const message = formatResultsMessage(report, options)

  if (options.webhookUrl !== undefined) {
    await sendSlackMessage(message, {
      webhookUrl: options.webhookUrl,
    })
    logs && console.log('Test results message sent to Slack.')
  } else if (
    options.oauthToken !== undefined &&
    options.channelId !== undefined
  ) {
    await postMessage(options.channelId, message, {
      oauthToken: options.oauthToken,
    })
    logs && console.log('Test results message sent to Slack.')
  }
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
      if (options.webhookUrl !== undefined) {
        await sendSlackMessage(message, {
          webhookUrl: options.webhookUrl,
        })
      } else if (
        options.oauthToken !== undefined &&
        options.channelId !== undefined
      ) {
        await postMessage(options.channelId, message, {
          oauthToken: options.oauthToken,
        })
      }
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
          if (options.webhookUrl !== undefined) {
            await sendSlackMessage(message, {
              webhookUrl: options.webhookUrl,
            })
            logs && console.log('Failed test summary sent to Slack.')
          } else if (
            options.oauthToken !== undefined &&
            options.channelId !== undefined
          ) {
            await postMessage(options.channelId, message, {
              oauthToken: options.oauthToken,
            })
            logs && console.log('Failed test summary sent to Slack.')
          }
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
  const message = formatFlakyTestsMessage(report, options)
  if (message !== null) {
    if (options.webhookUrl !== undefined) {
      await sendSlackMessage(message, {
        webhookUrl: options.webhookUrl,
      })
    } else if (
      options.oauthToken !== undefined &&
      options.channelId !== undefined
    ) {
      await postMessage(options.channelId, message, {
        oauthToken: options.oauthToken,
      })
    }
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
  if (options.consolidated !== undefined && options.consolidated) {
    const message = formatConsolidatedAiTestSummary(
      report.results.tests,
      report.results.environment,
      options
    )
    if (message !== null) {
      if (options.webhookUrl !== undefined) {
        await sendSlackMessage(message, {
          webhookUrl: options.webhookUrl,
        })
      } else if (
        options.oauthToken !== undefined &&
        options.channelId !== undefined
      ) {
        await postMessage(options.channelId, message, {
          oauthToken: options.oauthToken,
        })
      }
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
          if (options.webhookUrl !== undefined) {
            await sendSlackMessage(message, {
              webhookUrl: options.webhookUrl,
            })
          } else if (
            options.oauthToken !== undefined &&
            options.channelId !== undefined
          ) {
            await postMessage(options.channelId, message, {
              oauthToken: options.oauthToken,
            })
          }
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
export async function sendCustomMarkdownTemplateToSlack(
  report: CtrfReport,
  templateContent: string,
  options: Options = {},
  logs: boolean = false
): Promise<void> {
  if (
    options.onFailOnly !== undefined &&
    options.onFailOnly &&
    report.results.summary.failed === 0
  ) {
    logs && console.log('No failed tests. Message not sent.')
    return
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
    if (options.webhookUrl !== undefined) {
      await sendSlackMessage(message, {
        webhookUrl: options.webhookUrl,
      })
    } else if (
      options.oauthToken !== undefined &&
      options.channelId !== undefined
    ) {
      await postMessage(options.channelId, message, {
        oauthToken: options.oauthToken,
      })
    }
    logs && console.log('Custom template message sent to Slack.')
  } else {
    logs && console.log('No custom message detected. No message sent.')
  }
}

/**
 * Send a custom Block Kit JSON template to Slack
 * @param report - The CTRF report
 * @param blockKitJson - The Block Kit JSON template content
 * @param options - The options for the message
 * @param logs - Whether to log the message
 */
export async function sendCustomBlockKitTemplateToSlack(
  report: CtrfReport,
  templateContent: string,
  options: Options = {},
  logs: boolean = false
): Promise<void> {
  if (
    options.onFailOnly !== undefined &&
    options.onFailOnly &&
    report.results.summary.failed === 0
  ) {
    logs && console.log('No failed tests. Message not sent.')
    return
  }

  report = stripAnsiFromErrors(report)

  const compiledContent = compileTemplate(templateContent, report)

  const blockKit = JSON.parse(compiledContent)

  if (blockKit.blocks.length === 0) {
    logs && console.log('No blocks detected. No message sent.')
    return
  }

  const message = formatCustomBlockKitMessage(report, blockKit)

  if (message !== null) {
    if (options.webhookUrl !== undefined) {
      await sendSlackMessage(message, {
        webhookUrl: options.webhookUrl,
      })
    } else if (
      options.oauthToken !== undefined &&
      options.channelId !== undefined
    ) {
      await postMessage(options.channelId, message, {
        oauthToken: options.oauthToken,
      })
    }
    logs && console.log('Custom Block Kit message sent to Slack.')
  } else {
    logs &&
      console.log('No custom Block Kit message detected. No message sent.')
  }
}
