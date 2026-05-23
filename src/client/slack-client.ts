import { WebClient } from '@slack/web-api'
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
  private readonly maxRetries: number

  constructor(options: Options) {
    this.options = options
    this.maxRetries = options.maxRetries ?? 3

    if (options.webhookUrl) {
      this.webhook = new IncomingWebhook(options.webhookUrl)
    } else if (options.oauthToken) {
      this.webClient = new WebClient(options.oauthToken)
    }
  }

  private async withRetry<T>(operation: () => Promise<T>): Promise<T> {
    let lastError: any
    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        return await operation()
      } catch (error: any) {
        lastError = error
        const isRateLimited = error?.code === 'ratelimited'
        const isTransient =
          error?.code === 'request_timeout' || error?.code === 'network_error'

        if (attempt < this.maxRetries && (isRateLimited || isTransient)) {
          const delay = isRateLimited
            ? (parseInt(error?.retryAfter) || 1) * 1000
            : attempt * 1000
          await new Promise(resolve => setTimeout(resolve, delay))
          continue
        }
        break
      }
    }
    throw this.formatError(lastError)
  }

  private formatError(error: any): Error {
    const slackError = error?.data?.error || error?.error
    if (slackError && typeof slackError === 'string') {
      if (slackError === 'channel_not_found') {
        return new Error(
          `Slack error: Channel "${this.options.channelId}" not found. Ensure the bot is invited to the channel.`
        )
      }
      if (slackError === 'invalid_auth') {
        return new Error('Slack error: Invalid OAuth token provided.')
      }
      if (slackError === 'not_in_channel') {
        return new Error(
          `Slack error: Bot is not in channel "${this.options.channelId}". Please invite the bot to the channel.`
        )
      }
      return new Error(`Slack API error: ${slackError}`)
    }

    const message = error instanceof Error ? error.message : String(error)
    return new Error(`Slack API failure: ${message}`)
  }

  async sendMessage(message: SlackMessage): Promise<string | undefined> {
    if (this.options.dryRun) {
      console.log(
        '[Dry Run] Slack Message Payload:',
        JSON.stringify(message, null, 2)
      )
      return 'dry-run-ts'
    }

    return this.withRetry(async () => {
      if (this.webhook) {
        const payload: any = { ...message }
        if (this.options.threadTs) {
          payload.thread_ts = this.options.threadTs
        }
        if (this.options.replyBroadcast) {
          payload.reply_broadcast = this.options.replyBroadcast
        }
        await this.webhook.send(payload)
        return undefined
      }

      if (this.webClient && this.options.channelId) {
        const response = await this.webClient.chat.postMessage({
          channel: this.options.channelId,
          ...message,
          thread_ts: this.options.threadTs || message.thread_ts,
          reply_broadcast:
            this.options.replyBroadcast || message.reply_broadcast,
        } as any)
        return response.ts as string
      }

      throw new Error(
        'Slack configuration is missing. Provide either webhook-url or oauth-token and channel-id.'
      )
    })
  }

  async addReaction(ts: string, emoji: string): Promise<void> {
    const name = emoji.replace(/^:|:$/g, '')

    if (this.options.dryRun) {
      console.log(`[Dry Run] Add reaction :${name}: to message ${ts}`)
      return
    }

    if (!this.webClient || !this.options.channelId) {
      return
    }

    await this.withRetry(async () => {
      await this.webClient!.reactions.add({
        channel: this.options.channelId!,
        timestamp: ts,
        name,
      })
    })
  }
}
