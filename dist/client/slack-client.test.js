import { expect, describe, it, vi, beforeEach } from 'vitest';
import { SlackClient } from './slack-client.js';
import { WebClient } from '@slack/web-api';
import { IncomingWebhook } from '@slack/webhook';
vi.mock('@slack/web-api', () => ({
    WebClient: vi.fn().mockImplementation(() => ({
        chat: {
            postMessage: vi
                .fn()
                .mockResolvedValue({ ok: true, ts: '1234567890.123456' }),
            update: vi.fn().mockResolvedValue({ ok: true, ts: '1234567890.123456' }),
        },
        reactions: {
            add: vi.fn().mockResolvedValue({ ok: true }),
        },
    })),
}));
vi.mock('@slack/webhook', () => ({
    IncomingWebhook: vi.fn().mockImplementation(() => ({
        send: vi.fn().mockResolvedValue({ text: 'ok' }),
    })),
}));
describe('SlackClient', () => {
    const oauthOptions = {
        oauthToken: 'xoxb-token',
        channelId: 'C12345',
    };
    const webhookOptions = {
        webhookUrl: 'https://hooks.slack.com/services/xxx',
    };
    beforeEach(() => {
        vi.clearAllMocks();
    });
    describe('sendMessage', () => {
        it('should send message via webhook when webhookUrl is provided', async () => {
            const client = new SlackClient(webhookOptions);
            await client.sendMessage({ text: 'hello' });
            const webhookInstance = vi.mocked(IncomingWebhook).mock.results[0]
                ?.value;
            expect(webhookInstance.send).toHaveBeenCalledWith(expect.objectContaining({ text: 'hello' }));
        });
        it('should send message via web API when oauthToken is provided', async () => {
            const client = new SlackClient(oauthOptions);
            const ts = await client.sendMessage({ text: 'hello' });
            expect(ts).toBe('1234567890.123456');
            const webClientInstance = vi.mocked(WebClient).mock.results[0]
                ?.value;
            expect(webClientInstance.chat.postMessage).toHaveBeenCalledWith(expect.objectContaining({
                channel: 'C12345',
                text: 'hello',
            }));
        });
        it('should include thread_ts in webhook payload if provided in options', async () => {
            const client = new SlackClient({ ...webhookOptions, threadTs: '111.222' });
            await client.sendMessage({ text: 'hello' });
            const webhookInstance = vi.mocked(IncomingWebhook).mock.results[0]
                ?.value;
            expect(webhookInstance.send).toHaveBeenCalledWith(expect.objectContaining({ thread_ts: '111.222' }));
        });
        it('should use update API when updateTs is provided', async () => {
            const client = new SlackClient({ ...oauthOptions, updateTs: '999.888' });
            await client.sendMessage({ text: 'updated' });
            const webClientInstance = vi.mocked(WebClient).mock.results[0]
                ?.value;
            expect(webClientInstance.chat.update).toHaveBeenCalledWith(expect.objectContaining({
                channel: 'C12345',
                ts: '999.888',
                text: 'updated',
            }));
        });
        it('should respect dry-run mode', async () => {
            const client = new SlackClient({ ...oauthOptions, dryRun: true });
            const ts = await client.sendMessage({ text: 'dry run' });
            expect(ts).toBe('dry-run-ts');
            const webClientInstance = vi.mocked(WebClient).mock.results[0]
                ?.value;
            expect(webClientInstance.chat.postMessage).not.toHaveBeenCalled();
        });
    });
    describe('addReaction', () => {
        it('should add reaction via web API', async () => {
            const client = new SlackClient(oauthOptions);
            await client.addReaction('123.456', 'rocket');
            const webClientInstance = vi.mocked(WebClient).mock.results[0]
                ?.value;
            expect(webClientInstance.reactions.add).toHaveBeenCalledWith({
                channel: 'C12345',
                timestamp: '123.456',
                name: 'rocket',
            });
        });
        it('should strip colons from emoji name', async () => {
            const client = new SlackClient(oauthOptions);
            await client.addReaction('123.456', ':fire:');
            const webClientInstance = vi.mocked(WebClient).mock.results[0]
                ?.value;
            expect(webClientInstance.reactions.add).toHaveBeenCalledWith(expect.objectContaining({ name: 'fire' }));
        });
    });
    describe('constructor', () => {
        it('should fallback to environment variables', () => {
            process.env.SLACK_TITLE = 'Env Title';
            process.env.SLACK_THREAD_TS = 'env.ts';
            process.env.SLACK_DRY_RUN = 'true';
            const client = new SlackClient({});
            // Accessing private options for testing
            expect(client.options.title).toBe('Env Title');
            expect(client.options.threadTs).toBe('env.ts');
            expect(client.options.dryRun).toBe(true);
            delete process.env.SLACK_TITLE;
            delete process.env.SLACK_THREAD_TS;
            delete process.env.SLACK_DRY_RUN;
        });
    });
    describe('retry logic', () => {
        it('should retry on rate limit error', async () => {
            const client = new SlackClient({ ...oauthOptions, maxRetries: 2 });
            const webClientInstance = vi.mocked(WebClient).mock.results[0]
                ?.value;
            webClientInstance.chat.postMessage
                .mockRejectedValueOnce({ code: 'ratelimited', retryAfter: '0.01' })
                .mockResolvedValueOnce({ ok: true, ts: 'retry.ts' });
            const ts = await client.sendMessage({ text: 'retry me' });
            expect(ts).toBe('retry.ts');
            expect(webClientInstance.chat.postMessage).toHaveBeenCalledTimes(2);
        });
        it('should fail after max retries', async () => {
            const client = new SlackClient({ ...oauthOptions, maxRetries: 2 });
            const webClientInstance = vi.mocked(WebClient).mock.results[0]
                ?.value;
            const timeoutError = new Error('request_timeout');
            timeoutError.code = 'request_timeout';
            webClientInstance.chat.postMessage.mockRejectedValue(timeoutError);
            await expect(client.sendMessage({ text: 'fail' })).rejects.toThrow('Slack API failure: request_timeout');
            expect(webClientInstance.chat.postMessage).toHaveBeenCalledTimes(2);
        });
    });
});
//# sourceMappingURL=slack-client.test.js.map