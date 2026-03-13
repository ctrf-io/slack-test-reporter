// src/client/client.ts
import { ChatPostMessageResponse, WebClient } from '@slack/web-api'
import { IncomingWebhook } from '@slack/webhook'
import { type Options, type SlackMessage } from '../types/reporter.js'

/**
 * Create a Slack API client for more advanced operations
 * @param token - Slack API token
 * @returns A WebClient instance
 */
export const createSlackClient = (token?: string): WebClient => {
  const apiToken = token ?? process.env.SLACK_OAUTH_TOKEN

  if (apiToken === undefined) {
    throw new Error('Slack API token is required')
  }

  return new WebClient(apiToken)
}

/**
 * Create a Slack webhook for sending messages
 * @param url - Slack webhook URL
 * @returns An IncomingWebhook instance
 */
export const createSlackWebhook = (url?: string): IncomingWebhook => {
  const webhookUrl = url ?? process.env.SLACK_WEBHOOK_URL

  if (webhookUrl === undefined) {
    throw new Error('Slack webhook URL is required')
  }

  return new IncomingWebhook(webhookUrl)
}

/**
 * Send a message to Slack using a webhook URL
 * @param message - The message payload to send to Slack
 * @param options - Options including threadTs and replyBroadcast
 * @returns A promise that resolves when the message is sent
 */
export const sendSlackMessage = async (
  message: SlackMessage,
  options: Options
): Promise<void> => {
  try {
    const webhook = createSlackWebhook(options.webhookUrl)
    const payload: any = { ...message }
    if (options.threadTs) {
      payload.thread_ts = options.threadTs
    }
    // Webhooks don't support reply_broadcast in a standard way, but we include it for completeness
    if (options.replyBroadcast) {
      payload.reply_broadcast = options.replyBroadcast
    }
    await webhook.send(payload)
  } catch (error) {
    throw new Error(
      `Failed to send Slack message: ${error instanceof Error ? error.message : String(error)}`
    )
  }
}

/**
 * Send a message to a Slack channel using the Web API
 * @param channel - Channel ID or name
 * @param message - Message text or blocks
 * @param options - Options including threadTs and replyBroadcast
 * @returns A promise that resolves with the API response
 */
export const postMessage = async (
  channel: string,
  message: string | SlackMessage,
  options: Options
): Promise<ChatPostMessageResponse> => {
  try {
    const client = createSlackClient(options.oauthToken)

    const threadTs = options.threadTs
    const replyBroadcast = options.replyBroadcast

    if (typeof message === 'string') {
      return await client.chat.postMessage({
        channel,
        text: message,
        thread_ts: threadTs,
        reply_broadcast: replyBroadcast,
       } as any)
    } else {
      return await client.chat.postMessage({
        channel,
        ...message,
        thread_ts: threadTs || message.thread_ts,
        reply_broadcast: replyBroadcast || message.reply_broadcast,
      } as any)
    }
  } catch (error) {
    throw new Error(
      `Failed to post message: ${error instanceof Error ? error.message : String(error)}`
    )
  }
}

/**
 * Update an existing Slack message
 * @param channel - Channel ID
 * @param ts - Timestamp of the message to update
 * @param message - New message content
 * @param options - Options including oauthToken
 * @returns A promise that resolves with the API response
 */
export const updateMessage = async (
  channel: string,
  ts: string,
  message: string | SlackMessage,
  options: Options
): Promise<ChatPostMessageResponse> => {
  try {
    const client = createSlackClient(options.oauthToken)

    if (typeof message === 'string') {
      return (await client.chat.update({
        channel,
        ts,
        text: message,
      } as any)) as any
    } else {
      return (await client.chat.update({
        channel,
        ts,
        ...message,
     } as any)) as any
    }
  } catch (error) {
    throw new Error(
      `Failed to update message: ${error instanceof Error ? error.message : String(error)}`
    )
  }
}

/**
 * Add a reaction to a Slack message
 * @param channel - Channel ID
 * @param ts - Timestamp of the message to react to
 * @param emoji - Emoji name (without colons)
 * @param options - Options including oauthToken
 */
export const addReaction = async (
  channel: string,
  ts: string,
  emoji: string,
  options: Options
): Promise<void> => {
  try {
    const client = createSlackClient(options.oauthToken)
    await client.reactions.add({
      channel,
      timestamp: ts,
      name: emoji,
    })
  } catch (error) {
    // If reaction already exists, we can ignore it
    const errorMsg = error instanceof Error ? error.message : String(error)
    if (!errorMsg.includes('already_reacted')) {
      throw new Error(`Failed to add reaction: ${errorMsg}`)
    }
  }
}

