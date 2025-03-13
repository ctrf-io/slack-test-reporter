import { formatResultsMessage, formatAiTestSummary, formatFailedTestSummary, formatFlakyTestsMessage, formatConsolidatedAiTestSummary, formatConsolidatedFailedTestSummary } from './message-formatter';
import { sendSlackMessage } from './client';
import { Options } from './types/reporter';
import { CtrfReport } from './types/ctrf';
import { stripAnsiFromErrors } from './utils/common';

export async function sendTestResultsToSlack(
    report: CtrfReport,
    options: Options = {},
    logs: boolean = false
): Promise<void> {
    if (options.token) {
        process.env.SLACK_WEBHOOK_URL = options.token;
    }

    if (options.onFailOnly && report.results.summary.failed === 0) {
        logs && console.log('No failed tests. Message not sent.');
        return;
    }

    const message = formatResultsMessage(report, options);

    await sendSlackMessage(message);
    logs && console.log('Test results message sent to Slack.');
}

export async function sendFailedResultsToSlack(
    report: CtrfReport,
    options: Options = {},
    logs: boolean = false
): Promise<void> {
    if (options.token) {
        process.env.SLACK_WEBHOOK_URL = options.token;
    }

    if (report.results.summary.failed === 0) {
        return;
    }
    
    report = stripAnsiFromErrors(report);

    if (options.consolidated) {
        const message = formatConsolidatedFailedTestSummary(report.results.tests, report.results.environment, options);
        if (message) {
            await sendSlackMessage(message);
            logs && console.log('Failed test summary sent to Slack.');
        } else {
            logs && console.log('No failed test summary detected. No message sent.');
        }
    } else {
        for (const test of report.results.tests) {
            if (test.status === "failed") {
                const message = formatFailedTestSummary(test, report.results.environment, options);
                if (message) {
                    await sendSlackMessage(message);
                    logs && console.log('Failed test summary sent to Slack.');
                } else {
                    logs && console.log('No failed test summary detected. No message sent');
                }
            }
        }
    }
}

export async function sendFlakyResultsToSlack(
    report: CtrfReport,
    options: Options = {},
    logs: boolean = false
): Promise<void> {
    if (options.token) {
        process.env.SLACK_WEBHOOK_URL = options.token;
    }

    const message = formatFlakyTestsMessage(report, options);
    if (message) {
        await sendSlackMessage(message);
        logs && console.log('Flaky tests message sent to Slack.');
    } else {
        logs && console.log('No flaky tests detected. No message sent.');
    }
}

export async function sendAISummaryToSlack(
    report: CtrfReport,
    options: Options = {},
    logs: boolean = false
): Promise<void> {
    if (options.token) {
        process.env.SLACK_WEBHOOK_URL = options.token;
    }

    if (options.consolidated) {
        const message = formatConsolidatedAiTestSummary(report.results.tests, report.results.environment, options);
        if (message) {
            await sendSlackMessage(message);
            logs && console.log('AI test summary sent to Slack.');
        } else {
            logs && console.log('No AI summary detected. No message sent.');
        }
    } else {
        for (const test of report.results.tests) {
            if (test.status === "failed") {
                const message = formatAiTestSummary(test, report.results.environment, options);
                if (message) {
                    await sendSlackMessage(message);
                    logs && console.log('AI test summary sent to Slack.');
                } else {
                    logs && console.log('No AI summary detected. No message sent');
                }
            }
        }
    }
}