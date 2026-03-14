import { formatResultsMessage, formatAiTestSummary, formatFailedTestSummary, formatFlakyTestsMessage, formatConsolidatedAiTestSummary, formatConsolidatedFailedTestSummary, formatCustomMarkdownMessage, formatCustomBlockKitMessage, } from './message-formatter.js';
import { SlackClient } from './client/index.js';
import { stripAnsiFromErrors } from './utils/common.js';
import { compileTemplate } from './handlebars/core.js';
/**
 * Resolve options by merging provided options with environment variables and defaults
 */
function resolveOptions(options) {
    return {
        ...options,
        title: options.title || process.env.SLACK_TITLE,
        failedEmoji: options.failedEmoji || process.env.SLACK_FAILED_EMOJI,
        passedEmoji: options.passedEmoji || process.env.SLACK_PASSED_EMOJI,
        threadTs: options.threadTs || process.env.SLACK_THREAD_TS,
        autoThread: options.autoThread ?? process.env.SLACK_AUTO_THREAD !== 'false',
        maxRetries: options.maxRetries ?? parseInt(process.env.SLACK_MAX_RETRIES || '3', 10),
        dryRun: options.dryRun ?? process.env.SLACK_DRY_RUN === 'true',
    };
}
/**
 * Add a status reaction to a message based on report results
 */
async function addStatusReaction(client, report, ts, options, logs) {
    if (!options.react || !ts || options.updateTs) {
        return;
    }
    const failedEmoji = options.failedEmoji || 'x';
    const passedEmoji = options.passedEmoji || 'white_check_mark';
    const emoji = report.results.summary.failed > 0 ? failedEmoji : passedEmoji;
    try {
        await client.addReaction(ts, emoji);
    }
    catch (err) {
        if (logs) {
            console.log(`Failed to add reaction: ${err instanceof Error ? err.message : String(err)}`);
        }
    }
}
/**
 * Internal utility to handle the logic of sending a summary message and then threading individual details.
 */
async function dispatchThreadedReports(client, report, options, logs, summaryTitle, testFormatter) {
    let parentTs;
    const threadTs = options.threadTs;
    const autoThread = options.autoThread !== false;
    // Send a summary message first to act as the parent if auto-threading is desired
    // and no threadTs was provided.
    if (!threadTs && autoThread && report.results.summary.failed > 1) {
        const summaryMsg = {
            text: `*${options.title || summaryTitle}*: ${report.results.summary.failed} tests failed. See thread for details.`,
        };
        parentTs = await client.sendMessage(summaryMsg);
        if (logs)
            console.log(`${summaryTitle} header sent to Slack.`);
        if (parentTs) {
            await addStatusReaction(client, report, parentTs, options, logs);
        }
    }
    let firstTimestamp;
    for (const test of report.results.tests) {
        if (test.status === 'failed') {
            const message = testFormatter(test, report.results.environment, options);
            if (message !== null) {
                const ts = await client.sendMessage({
                    ...message,
                    thread_ts: parentTs || threadTs,
                });
                if (logs)
                    console.log(`${summaryTitle} detail sent to Slack.`);
                if (!firstTimestamp)
                    firstTimestamp = ts;
            }
            else {
                if (logs)
                    console.log(`No ${summaryTitle} detected. No message sent`);
            }
        }
    }
    return parentTs || firstTimestamp;
}
/**
 * Send the test results to Slack
 * @param report - The CTRF report
 * @param options - The options for the message
 * @param logs - Whether to log the message
 * @returns The message timestamp if returnTs is true and using OAuth, otherwise void
 */
export async function sendTestResultsToSlack(report, options = {}, logs = false) {
    const resolvedOptions = resolveOptions(options);
    if (resolvedOptions.onFailOnly !== undefined &&
        resolvedOptions.onFailOnly &&
        report.results.summary.failed === 0) {
        if (logs)
            console.log('No failed tests. Message not sent.');
        return;
    }
    const client = new SlackClient(resolvedOptions);
    const message = formatResultsMessage(report, resolvedOptions);
    const ts = await client.sendMessage(message);
    if (logs)
        console.log('Test results message sent to Slack.');
    if (ts) {
        await addStatusReaction(client, report, ts, resolvedOptions, logs);
    }
    if (resolvedOptions.returnTs)
        return ts;
}
/**
 * Send the failed test results to Slack
 * @param report - The CTRF report
 * @param options - The options for the message
 * @param logs - Whether to log the message
 * @returns The message timestamp if returnTs is true and using OAuth, otherwise void
 */
export async function sendFailedResultsToSlack(report, options = {}, logs = false) {
    if (report.results.summary.failed === 0) {
        return;
    }
    report = stripAnsiFromErrors(report);
    const resolvedOptions = resolveOptions(options);
    const client = new SlackClient(resolvedOptions);
    if (resolvedOptions.consolidated !== undefined && resolvedOptions.consolidated) {
        const message = formatConsolidatedFailedTestSummary(report.results.tests, report.results.environment, resolvedOptions);
        if (message !== null) {
            const ts = await client.sendMessage(message);
            if (logs)
                console.log('Failed test summary sent to Slack.');
            if (ts) {
                await addStatusReaction(client, report, ts, resolvedOptions, logs);
            }
            if (resolvedOptions.returnTs)
                return ts;
        }
        else {
            if (logs)
                console.log('No failed test summary detected. No message sent.');
        }
    }
    else {
        const ts = await dispatchThreadedReports(client, report, resolvedOptions, logs, 'Failed test report', formatFailedTestSummary);
        if (resolvedOptions.returnTs)
            return ts;
    }
}
/**
 * Send the flaky test results to Slack
 * @param report - The CTRF report
 * @param options - The options for the message
 * @param logs - Whether to log the message
 * @returns The message timestamp if returnTs is true and using OAuth, otherwise void
 */
export async function sendFlakyResultsToSlack(report, options = {}, logs = false) {
    const resolvedOptions = resolveOptions(options);
    const message = formatFlakyTestsMessage(report, resolvedOptions);
    if (message !== null) {
        const client = new SlackClient(resolvedOptions);
        const ts = await client.sendMessage(message);
        if (logs)
            console.log('Flaky tests message sent to Slack.');
        if (ts) {
            await addStatusReaction(client, report, ts, resolvedOptions, logs);
        }
        if (resolvedOptions.returnTs)
            return ts;
    }
    else {
        if (logs)
            console.log('No flaky tests detected. No message sent.');
    }
}
/**
 * Send the AI test summary to Slack
 * @param report - The CTRF report
 * @param options - The options for the message
 * @param logs - Whether to log the message
 * @returns The message timestamp if returnTs is true and using OAuth, otherwise void
 */
export async function sendAISummaryToSlack(report, options = {}, logs = false) {
    const resolvedOptions = resolveOptions(options);
    const client = new SlackClient(resolvedOptions);
    if (resolvedOptions.consolidated !== undefined && resolvedOptions.consolidated) {
        const message = formatConsolidatedAiTestSummary(report.results.tests, report.results.environment, resolvedOptions);
        if (message !== null) {
            const ts = await client.sendMessage(message);
            if (logs)
                console.log('AI test summary sent to Slack.');
            if (ts) {
                await addStatusReaction(client, report, ts, resolvedOptions, logs);
            }
            if (resolvedOptions.returnTs)
                return ts;
        }
        else {
            if (logs)
                console.log('No AI summary detected. No message sent.');
        }
    }
    else {
        const ts = await dispatchThreadedReports(client, report, resolvedOptions, logs, 'AI test summary', formatAiTestSummary);
        if (resolvedOptions.returnTs)
            return ts;
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
export async function sendCustomMarkdownTemplateToSlack(report, templateContent, options = {}, logs = false) {
    const resolvedOptions = resolveOptions(options);
    if (resolvedOptions.onFailOnly !== undefined &&
        resolvedOptions.onFailOnly &&
        report.results.summary.failed === 0) {
        if (logs)
            console.log('No failed tests. Message not sent.');
        return;
    }
    report = stripAnsiFromErrors(report);
    const compiledContent = compileTemplate(templateContent, report);
    const message = formatCustomMarkdownMessage(report, compiledContent, report.results.environment, resolvedOptions);
    if (message !== null) {
        const client = new SlackClient(resolvedOptions);
        const ts = await client.sendMessage(message);
        if (logs)
            console.log('Custom template message sent to Slack.');
        if (ts) {
            await addStatusReaction(client, report, ts, resolvedOptions, logs);
        }
        if (resolvedOptions.returnTs)
            return ts;
    }
    else {
        if (logs)
            console.log('No custom message detected. No message sent.');
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
export async function sendCustomBlockKitTemplateToSlack(report, templateContent, options = {}, logs = false) {
    const resolvedOptions = resolveOptions(options);
    if (resolvedOptions.onFailOnly !== undefined &&
        resolvedOptions.onFailOnly &&
        report.results.summary.failed === 0) {
        if (logs)
            console.log('No failed tests. Message not sent.');
        return;
    }
    report = stripAnsiFromErrors(report);
    const compiledContent = compileTemplate(templateContent, report);
    const blockKit = JSON.parse(compiledContent);
    if (blockKit.blocks.length === 0) {
        if (logs)
            console.log('No blocks detected. No message sent.');
        return;
    }
    const message = formatCustomBlockKitMessage(report, blockKit);
    if (message !== null) {
        const client = new SlackClient(resolvedOptions);
        const ts = await client.sendMessage(message);
        if (logs)
            console.log('Custom Block Kit message sent to Slack.');
        if (ts) {
            await addStatusReaction(client, report, ts, resolvedOptions, logs);
        }
        if (resolvedOptions.returnTs)
            return ts;
    }
    else {
        if (logs)
            console.log('No custom Block Kit message detected. No message sent.');
    }
}
//# sourceMappingURL=slack-reporter.js.map