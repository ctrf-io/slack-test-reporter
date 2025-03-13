// src/client/client.ts
import { type ChatPostMessageResponse, WebClient } from '@slack/web-api'
import { IncomingWebhook } from '@slack/webhook'

/**
 * Create a Slack API client for more advanced operations
 * @param token - Slack API token
 * @returns A WebClient instance
 */
export const createSlackClient = (token?: string): WebClient => {
  const apiToken = token ?? process.env.SLACK_API_TOKEN

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
 * @returns A promise that resolves when the message is sent
 */
export const sendSlackMessage = async (message: object): Promise<void> => {
  try {
    const webhook = createSlackWebhook()
    await webhook.send(message)
  } catch (error) {
    throw new Error(
      `Failed to send Slack message: ${error instanceof Error ? error.message : String(error)}`
    )
  }
}

/**
 * Send a message to a Slack channel using the Web API
 * @param client - Slack WebClient instance
 * @param channel - Channel ID or name
 * @param message - Message text or blocks
 * @returns A promise that resolves with the API response
 */
export const postMessage = async (
  client: WebClient,
  channel: string,
  message: string | object
): Promise<ChatPostMessageResponse> => {
  try {
    return await client.chat.postMessage({
      channel,
      ...(typeof message === 'string' ? { text: message } : message),
    })
  } catch (error) {
    throw new Error(
      `Failed to post message: ${error instanceof Error ? error.message : String(error)}`
    )
  }
}
