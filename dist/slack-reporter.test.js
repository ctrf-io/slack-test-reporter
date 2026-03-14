import { expect, describe, it, vi, beforeEach } from 'vitest';
import { sendFailedResultsToSlack, sendTestResultsToSlack, sendAISummaryToSlack, sendFlakyResultsToSlack, } from './slack-reporter.js';
import { SlackClient } from './client/index.js';
vi.mock('./client/index.js', () => ({
    SlackClient: vi.fn().mockImplementation(() => ({
        sendMessage: vi.fn().mockResolvedValue('123.456'),
        addReaction: vi.fn().mockResolvedValue(undefined),
    })),
}));
const mockReport = {
    results: {
        tool: { name: 'vitest' },
        summary: {
            passed: 1,
            failed: 2,
            skipped: 0,
            pending: 0,
            other: 0,
            tests: 3,
            start: 0,
            stop: 0,
        },
        tests: [
            { name: 'test1', status: 'passed', duration: 0 },
            {
                name: 'test2',
                status: 'failed',
                duration: 0,
                message: 'error1',
                ai: 'ai-summary',
            },
            {
                name: 'test3',
                status: 'failed',
                duration: 0,
                message: 'error2',
                ai: 'ai-summary-2',
            },
        ],
        environment: {},
    },
};
const mockSingleFailureReport = {
    results: {
        tool: { name: 'vitest' },
        summary: {
            passed: 1,
            failed: 1,
            skipped: 0,
            pending: 0,
            other: 0,
            tests: 2,
            start: 0,
            stop: 0,
        },
        tests: [
            { name: 'test1', status: 'passed', duration: 0 },
            { name: 'test2', status: 'failed', duration: 0, message: 'error1' },
        ],
        environment: {},
    },
};
const mockFlakyReport = {
    results: {
        tool: { name: 'vitest' },
        summary: {
            passed: 1,
            failed: 0,
            skipped: 0,
            pending: 0,
            other: 0,
            tests: 1,
            start: 0,
            stop: 0,
        },
        tests: [{ name: 'test1', status: 'passed', duration: 0, flaky: true }],
        environment: {},
    },
};
describe('slack-reporter', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });
    describe('sendTestResultsToSlack', () => {
        it('should send a single message and add reaction', async () => {
            await sendTestResultsToSlack(mockReport, {
                oauthToken: 't',
                channelId: 'c',
                react: true,
            });
            const clientInstance = vi.mocked(SlackClient).mock.results[0]?.value;
            expect(clientInstance.sendMessage).toHaveBeenCalledTimes(1);
            expect(clientInstance.addReaction).toHaveBeenCalledWith('123.456', 'x');
        });
        it('should use custom emojis for reactions', async () => {
            await sendTestResultsToSlack(mockReport, {
                oauthToken: 't',
                channelId: 'c',
                react: true,
                failedEmoji: 'fire',
            });
            const clientInstance = vi.mocked(SlackClient).mock.results[0]?.value;
            expect(clientInstance.addReaction).toHaveBeenCalledWith('123.456', 'fire');
        });
    });
    describe('sendFailedResultsToSlack', () => {
        it('should perform auto-threading when multiple failures and no threadTs', async () => {
            await sendFailedResultsToSlack(mockReport, {
                oauthToken: 't',
                channelId: 'c',
                autoThread: true,
            });
            const clientInstance = vi.mocked(SlackClient).mock.results[0]?.value;
            // 1 summary header + 2 failure details = 3 calls
            expect(clientInstance.sendMessage).toHaveBeenCalledTimes(3);
            // First call is the summary header
            expect(clientInstance.sendMessage).toHaveBeenNthCalledWith(1, expect.objectContaining({
                text: expect.stringContaining('2 tests failed'),
            }));
            // Subsequent calls should use the parent TS from the first call
            expect(clientInstance.sendMessage).toHaveBeenNthCalledWith(2, expect.objectContaining({ thread_ts: '123.456' }));
        });
        it('should not send summary header for exactly 1 failure', async () => {
            await sendFailedResultsToSlack(mockSingleFailureReport, {
                oauthToken: 't',
                channelId: 'c',
                autoThread: true,
            });
            const clientInstance = vi.mocked(SlackClient).mock.results[0]?.value;
            // Should only send 1 message (the failure detail), NO summary header
            expect(clientInstance.sendMessage).toHaveBeenCalledTimes(1);
            expect(clientInstance.sendMessage).not.toHaveBeenCalledWith(expect.objectContaining({
                text: expect.stringContaining('tests failed'),
            }));
        });
        it('should not auto-thread if disabled', async () => {
            await sendFailedResultsToSlack(mockReport, {
                oauthToken: 't',
                channelId: 'c',
                autoThread: false,
            });
            const clientInstance = vi.mocked(SlackClient).mock.results[0]?.value;
            // Just the 2 failure details
            expect(clientInstance.sendMessage).toHaveBeenCalledTimes(2);
            expect(clientInstance.sendMessage).not.toHaveBeenCalledWith(expect.objectContaining({
                text: expect.stringContaining('See thread for details'),
            }));
        });
    });
    describe('sendAISummaryToSlack', () => {
        it('should perform auto-threading for AI summaries', async () => {
            await sendAISummaryToSlack(mockReport, {
                oauthToken: 't',
                channelId: 'c',
                autoThread: true,
            });
            const clientInstance = vi.mocked(SlackClient).mock.results[0]?.value;
            // 1 header + 2 AI summaries
            expect(clientInstance.sendMessage).toHaveBeenCalledTimes(3);
        });
    });
    describe('sendFlakyResultsToSlack', () => {
        it('should send flaky test results', async () => {
            await sendFlakyResultsToSlack(mockFlakyReport, {
                oauthToken: 't',
                channelId: 'c',
            });
            const clientInstance = vi.mocked(SlackClient).mock.results[0]?.value;
            expect(clientInstance.sendMessage).toHaveBeenCalledTimes(1);
        });
    });
    describe('logging control', () => {
        it('should not log to console when logs is false', async () => {
            const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => { });
            await sendTestResultsToSlack(mockReport, { oauthToken: 't', channelId: 'c' }, false);
            expect(consoleSpy).not.toHaveBeenCalledWith('Test results message sent to Slack.');
            consoleSpy.mockRestore();
        });
    });
    describe('options and environment variables', () => {
        it('should respect dry-run mode in reporter', async () => {
            const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => { });
            await sendTestResultsToSlack(mockReport, { dryRun: true });
            const clientInstance = vi.mocked(SlackClient).mock.results[0]?.value;
            expect(clientInstance.sendMessage).toHaveBeenCalled();
            consoleSpy.mockRestore();
        });
    });
});
//# sourceMappingURL=slack-reporter.test.js.map