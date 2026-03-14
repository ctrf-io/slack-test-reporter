import { ChatPostMessageResponse, WebClient } from '@slack/web-api'
import { IncomingWebhook } from '@slack/webhook'
import { type Options, type SlackMessage } from '../types/reporter.js'

export interface ISlackClient {
  sendMessage(message: SlackMessage): Promise<string | undefined>
  addReaction(ts: string, emoji: string): Promise<void>
}

export class SlackClient implements ISlackClient {
  private webClient?: WebClient
  private webhook?: IncomingWebhook
  private options: Options

  constructor(options: Options) {
    this.options = options

    if (options.webhookUrl) {
      this.webhook = new IncomingWebhook(options.webhookUrl)
    } else if (options.oauthToken) {
      this.webClient = new WebClient(options.oauthToken)
    }
  }

  async sendMessage(message: SlackMessage): Promise<string | undefined> {
    if (this.webhook) {
      const payload: any = { ...message }
      if (this.options.threadTs || process.env.SLACK_THREAD_TS) {
        payload.thread_ts = this.options.threadTs || process.env.SLACK_THREAD_TS
      }
      if (this.options.replyBroadcast) {
        payload.reply_broadcast = this.options.replyBroadcast
      }
      await this.webhook.send(payload)
      return undefined
    }

    if (this.webClient && this.options.channelId) {
      let response: any
      const threadTs = this.options.threadTs || process.env.SLACK_THREAD_TS

      if (this.options.updateTs) {
        response = await this.webClient.chat.update({
          channel: this.options.channelId,
          ts: this.options.updateTs,
          ...message,
        } as any)
      } else {
        response = await this.webClient.chat.postMessage({
          channel: this.options.channelId,
          ...message,
          thread_ts: threadTs || message.thread_ts,
          reply_broadcast:
            this.options.replyBroadcast || message.reply_broadcast,
        } as any)
      }
      return response.ts as string
    }

    throw new Error(
      'Slack configuration is missing. Provide either webhook-url or oauth-token and channel-id.'
    )
  }

  async addReaction(ts: string, emoji: string): Promise<void> {
    if (this.webClient && this.options.channelId) {
      try {
        await this.webClient.reactions.add({
          channel: this.options.channelId,
          timestamp: ts,
          name: emoji.replace(/:/g, ''),
        })
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error)
        if (!errorMsg.includes('already_reacted')) {
          throw new Error(`Failed to add reaction: ${errorMsg}`)
        }
      }
    }
  }
}
