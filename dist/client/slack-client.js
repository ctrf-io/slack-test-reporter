import { WebClient } from '@slack/web-api';
import { IncomingWebhook } from '@slack/webhook';
export class SlackClient {
    webClient;
    webhook;
    options;
    constructor(options) {
        this.options = options;
        if (options.webhookUrl) {
            this.webhook = new IncomingWebhook(options.webhookUrl);
        }
        else if (options.oauthToken) {
            this.webClient = new WebClient(options.oauthToken);
        }
    }
    async sendMessage(message) {
        if (this.webhook) {
            const payload = { ...message };
            if (this.options.threadTs || process.env.SLACK_THREAD_TS) {
                payload.thread_ts = this.options.threadTs || process.env.SLACK_THREAD_TS;
            }
            if (this.options.replyBroadcast) {
                payload.reply_broadcast = this.options.replyBroadcast;
            }
            await this.webhook.send(payload);
            return undefined;
        }
        if (this.webClient && this.options.channelId) {
            let response;
            const threadTs = this.options.threadTs || process.env.SLACK_THREAD_TS;
            if (this.options.updateTs) {
                response = await this.webClient.chat.update({
                    channel: this.options.channelId,
                    ts: this.options.updateTs,
                    ...message,
                });
            }
            else {
                response = await this.webClient.chat.postMessage({
                    channel: this.options.channelId,
                    ...message,
                    thread_ts: threadTs || message.thread_ts,
                    reply_broadcast: this.options.replyBroadcast || message.reply_broadcast,
                });
            }
            return response.ts;
        }
        throw new Error('Slack configuration is missing. Provide either webhook-url or oauth-token and channel-id.');
    }
    async addReaction(ts, emoji) {
        if (this.webClient && this.options.channelId) {
            try {
                await this.webClient.reactions.add({
                    channel: this.options.channelId,
                    timestamp: ts,
                    name: emoji.replace(/:/g, ''),
                });
            }
            catch (error) {
                const errorMsg = error instanceof Error ? error.message : String(error);
                if (!errorMsg.includes('already_reacted')) {
                    throw new Error(`Failed to add reaction: ${errorMsg}`);
                }
            }
        }
    }
}
//# sourceMappingURL=slack-client.js.map