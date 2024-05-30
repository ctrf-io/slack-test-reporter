import { CtrfReport } from '../types/ctrf';

export const formatResultsMessage = (ctrf: CtrfReport): string => {
    const { summary } = ctrf.results;
    return `Test Summary:\nTotal: ${summary.tests}\nPassed: ${summary.passed}\nFailed: ${summary.failed}\nSkipped: ${summary.skipped}\nPending: ${summary.pending}\nOther: ${summary.other}\nStart: ${new Date(summary.start).toLocaleString()}\nStop: ${new Date(summary.stop).toLocaleString()}`;
};

export const formatFailedTestsMessage = (ctrf: CtrfReport): string => {
    const failedTests = ctrf.results.tests.filter(test => test.status === 'failed');
    if (failedTests.length === 0) return 'No failed tests.';

    const message = failedTests.map(test => `Test: ${test.name}\nMessage: ${test.message}\n`).join('\n');
    return `Failed Tests:\n${message}`;
};

export const formatFlakyTestsMessage = (ctrf: CtrfReport): string => {
    const flakyTests = ctrf.results.tests.filter(test => test.flaky);
    if (flakyTests.length === 0) return 'No flaky tests.';

    const message = flakyTests.map(test => `Test: ${test.name}\nRetries: ${test.retries}\n`).join('\n');
    return `Flaky Tests:\n${message}`;
};
