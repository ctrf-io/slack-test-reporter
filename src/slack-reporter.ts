import {
  formatResultsMessage,
  formatAiTestSummary,
  formatFailedTestSummary,
  formatFlakyTestsMessage,
  formatConsolidatedAiTestSummary,
  formatConsolidatedFailedTestSummary,
  formatCustomMarkdownMessage,
  formatCustomBlockKitMessage,
} from './message-formatter.js'
import {
  sendSlackMessage,
  postMessage,
  updateMessage,
  addReaction,
} from './client/index.js'
import { type Options, type SlackMessage } from './types/reporter.js'
import { type CtrfReport } from './types/ctrf.js'
import { stripAnsiFromErrors } from './utils/common.js'
import { compileTemplate } from './handlebars/core.js'

/**
 * Internal utility to dispatch a message to Slack via Webhook or OAuth
 */
async function dispatchMessage(
  message: SlackMessage,
  options: Options,
  logs: boolean,
  successMsg: string
): Promise<string | undefined> {
  const threadTs = options.threadTs || process.env.SLACK_THREAD_TS

  if (options.webhookUrl !== undefined) {
    await sendSlackMessage(message, {
      webhookUrl: options.webhookUrl,
      threadTs: threadTs,
      replyBroadcast: options.replyBroadcast,
    })
    if (logs) console.log(successMsg)
    return undefined
  } else if (
    options.oauthToken !== undefined &&
    options.channelId !== undefined
  ) {
    let response: any
    if (options.updateTs) {
      response = await updateMessage(
        options.channelId,
        options.updateTs,
        message,
        {
          oauthToken: options.oauthToken,
        }
      )
    } else {
      response = await postMessage(options.channelId, message, {
        oauthToken: options.oauthToken,
        threadTs: threadTs,
        replyBroadcast: options.replyBroadcast,
      })
    }
    if (logs) console.log(successMsg)
    return response.ts as string
      }
    return undefined
}

/**
 * Add a status reaction to a message based on report results
 */
async function addStatusReaction(
  report: CtrfReport,
  ts: string,
  options: Options
): Promise<void> {
  if (
    !options.react ||
    !options.oauthToken ||
    !options.channelId ||
    !ts ||
    options.updateTs // Don't react if updating an existing message, usually
  ) {
    return
  }

  const emoji = report.results.summary.failed > 0 ? 'x' : 'white_check_mark'
  try {
    await addReaction(options.channelId, ts, emoji, {
      oauthToken: options.oauthToken,
    })
  } catch (error) {
    // Fail silently for reactions to not break the reporter
  }
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
  if (
    options.onFailOnly !== undefined &&
    options.onFailOnly &&
    report.results.summary.failed === 0
  ) {
    if (logs) console.log('No failed tests. Message not sent.')
    return
  }

  const message = formatResultsMessage(report, options)
  const ts = await dispatchMessage(
    message,
    options,
    logs,
    'Test results message sent to Slack.'
  )

  if (ts) {
    await addStatusReaction(report, ts, options)
  }

  if (options.returnTs) return ts
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

  if (options.consolidated !== undefined && options.consolidated) {
    const message = formatConsolidatedFailedTestSummary(
      report.results.tests,
      report.results.environment,
      options
    )
    if (message !== null) {
      const ts = await dispatchMessage(
        message,
        options,
        logs,
        'Failed test summary sent to Slack.'
      )
      if (ts) {
        await addStatusReaction(report, ts, options)
      }
      if (options.returnTs) return ts
    } else {
      if (logs) console.log('No failed test summary detected. No message sent.')
    }
  } else {
    let parentTs: string | undefined
    const threadTs = options.threadTs || process.env.SLACK_THREAD_TS

    // Send a summary message first to act as the parent if auto-threading is desired
    // and no threadTs was provided.
    if (!threadTs && report.results.summary.failed > 1) {
      const summaryMsg = {
        text: `*${options.title || 'Test Failures'}*: ${report.results.summary.failed} tests failed. See thread for details.`,
      }
      parentTs = await dispatchMessage(
        summaryMsg,
        options,
        logs,
        'Failure summary sent to Slack.'
      )
      if (parentTs) {
        await addStatusReaction(report, parentTs, options)
      }
    }

    let firstTimestamp: string | undefined
    for (const test of report.results.tests) {
      if (test.status === 'failed') {
        const message = formatFailedTestSummary(
          test,
          report.results.environment,
          options
        )
        if (message !== null) {
          const ts = await dispatchMessage(
            message,
            { ...options, threadTs: parentTs || threadTs },
            logs,
            'Failed test summary sent to Slack.'
          )
          if (!firstTimestamp) firstTimestamp = ts
        } else {
          if (logs)
            console.log('No failed test summary detected. No message sent')
        }
      }
    }
    if (options.returnTs) return parentTs || firstTimestamp
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
  const message = formatFlakyTestsMessage(report, options)
  if (message !== null) {
    const ts = await dispatchMessage(
      message,
      options,
      logs,
      'Flaky tests message sent to Slack.'
    )
    if (ts) {
      await addStatusReaction(report, ts, options)
    }
    if (options.returnTs) return ts
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
  if (options.consolidated !== undefined && options.consolidated) {
    const message = formatConsolidatedAiTestSummary(
      report.results.tests,
      report.results.environment,
      options
    )
    if (message !== null) {
      const ts = await dispatchMessage(
        message,
        options,
        logs,
        'AI test summary sent to Slack.'
      )
      if (ts) {
        await addStatusReaction(report, ts, options)
      }
      if (options.returnTs) return ts
    } else {
      if (logs) console.log('No AI summary detected. No message sent.')
    }
  } else {
    let parentTs: string | undefined
    const threadTs = options.threadTs || process.env.SLACK_THREAD_TS

    if (!threadTs && report.results.summary.failed > 1) {
      const summaryMsg = {
        text: `*AI Test Summary*: Analysis for ${report.results.summary.failed} failures below.`,
      }
      parentTs = await dispatchMessage(
        summaryMsg,
        options,
        logs,
        'AI summary header sent to Slack.'
      )
      if (parentTs) {
        await addStatusReaction(report, parentTs, options)
      }
    }

    let firstTimestamp: string | undefined
    for (const test of report.results.tests) {
      if (test.status === 'failed') {
        const message = formatAiTestSummary(
          test,
          report.results.environment,
          options
        )
        if (message !== null) {
          const ts = await dispatchMessage(
            message,
            { ...options, threadTs: parentTs || threadTs },
            logs,
            'AI test summary sent to Slack.'
          )
          if (!firstTimestamp) firstTimestamp = ts
        } else {
          if (logs) console.log('No AI summary detected. No message sent')
        }
      }
    }
    if (options.returnTs) return parentTs || firstTimestamp
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
  if (
    options.onFailOnly !== undefined &&
    options.onFailOnly &&
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
    options
  )

  if (message !== null) {
    const ts = await dispatchMessage(
      message,
      options,
      logs,
      'Custom template message sent to Slack.'
    )
    if (ts) {
      await addStatusReaction(report, ts, options)
    }
    if (options.returnTs) return ts
  } else {
    if (logs) console.log('No custom message detected. No message sent.')
  }
}

/**
 * Send a custom Block Kit JSON template to Slack
 * @param report - The CTRF report
 * @param blockKitJson - The Block Kit JSON template content
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
  if (
    options.onFailOnly !== undefined &&
    options.onFailOnly &&
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
    const ts = await dispatchMessage(
      message,
      options,
      logs,
      'Custom Block Kit message sent to Slack.'
    )
    if (ts) {
      await addStatusReaction(report, ts, options)
    }
    if (options.returnTs) return ts
  } else {
    if (logs)
      console.log('No custom Block Kit message detected. No message sent.')
  }
}


