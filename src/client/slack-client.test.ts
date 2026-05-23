import { expect, describe, it, vi, beforeEach } from 'vitest'
import { SlackClient } from './slack-client.js'
import { WebClient } from '@slack/web-api'
import { IncomingWebhook } from '@slack/webhook'

vi.mock('@slack/web-api', () => ({
  WebClient: vi.fn().mockImplementation(() => ({
    chat: {
      postMessage: vi
        .fn()
        .mockResolvedValue({ ok: true, ts: '1234567890.123456' }),
      update: vi.fn().mockResolvedValue({ ok: true, ts: '999.888' }),
    },
  })),
}))

vi.mock('@slack/webhook', () => ({
  IncomingWebhook: vi.fn().mockImplementation(() => ({
    send: vi.fn().mockResolvedValue({ text: 'ok' }),
  })),
}))

describe('SlackClient', () => {
  const oauthOptions = {
    oauthToken: 'xoxb-token',
    channelId: 'C12345',
  }

  const webhookOptions = {
    webhookUrl: 'https://hooks.slack.com/services/xxx',
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('sendMessage', () => {
    it('should send message via webhook when webhookUrl is provided', async () => {
      const client = new SlackClient(webhookOptions)
      await client.sendMessage({ text: 'hello' })

      const webhookInstance = vi.mocked(IncomingWebhook).mock.results[0]
        ?.value as any
      expect(webhookInstance.send).toHaveBeenCalledWith(
        expect.objectContaining({ text: 'hello' })
      )
    })

    it('should send message via web API when oauthToken is provided', async () => {
      const client = new SlackClient(oauthOptions)
      const ts = await client.sendMessage({ text: 'hello' })

      expect(ts).toBe('1234567890.123456')
      const webClientInstance = vi.mocked(WebClient).mock.results[0]
        ?.value as any
      expect(webClientInstance.chat.postMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          channel: 'C12345',
          text: 'hello',
        })
      )
    })

    it('should include thread_ts in webhook payload if provided in options', async () => {
      const client = new SlackClient({ ...webhookOptions, threadTs: '111.222' })
      await client.sendMessage({ text: 'hello' })

      const webhookInstance = vi.mocked(IncomingWebhook).mock.results[0]
        ?.value as any
      expect(webhookInstance.send).toHaveBeenCalledWith(
        expect.objectContaining({ thread_ts: '111.222' })
      )
    })

    it('should use chat.update when updateTs is provided', async () => {
      const client = new SlackClient({ ...oauthOptions, updateTs: '999.888' })
      const ts = await client.sendMessage({ text: 'updated content' })

      expect(ts).toBe('999.888')
      const webClientInstance = vi.mocked(WebClient).mock.results[0]
        ?.value as any
      expect(webClientInstance.chat.update).toHaveBeenCalledWith(
        expect.objectContaining({
          channel: 'C12345',
          ts: '999.888',
          text: 'updated content',
        })
      )
      expect(webClientInstance.chat.postMessage).not.toHaveBeenCalled()
    })

    it('should print update payload in dry-run mode when updateTs is set', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
      const client = new SlackClient({
        ...oauthOptions,
        updateTs: '999.888',
        dryRun: true,
      })
      const ts = await client.sendMessage({ text: 'dry update' })

      expect(ts).toBe('999.888')
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('[Dry Run] Update Message'),
        expect.any(String)
      )
      consoleSpy.mockRestore()
    })

    it('should respect dry-run mode', async () => {
      const client = new SlackClient({ ...oauthOptions, dryRun: true })
      const ts = await client.sendMessage({ text: 'dry run' })

      expect(ts).toBe('dry-run-ts')
      const webClientInstance = vi.mocked(WebClient).mock.results[0]
        ?.value as any
      expect(webClientInstance.chat.postMessage).not.toHaveBeenCalled()
    })
  })

  describe('constructor', () => {
    it('should use provided options', () => {
      const options = {
        title: 'Provided Title',
        threadTs: 'provided.ts',
        dryRun: true,
      }
      const client = new SlackClient(options)
      // Accessing private options for testing
      expect((client as any).options.title).toBe('Provided Title')
      expect((client as any).options.threadTs).toBe('provided.ts')
      expect((client as any).options.dryRun).toBe(true)
    })
  })

  describe('retry logic', () => {
    it('should retry on rate limit error', async () => {
      const client = new SlackClient({ ...oauthOptions, maxRetries: 2 })
      const webClientInstance = vi.mocked(WebClient).mock.results[0]
        ?.value as any

      webClientInstance.chat.postMessage
        .mockRejectedValueOnce({ code: 'ratelimited', retryAfter: '0.01' })
        .mockResolvedValueOnce({ ok: true, ts: 'retry.ts' })

      const ts = await client.sendMessage({ text: 'retry me' })
      expect(ts).toBe('retry.ts')
      expect(webClientInstance.chat.postMessage).toHaveBeenCalledTimes(2)
    })

    it('should fail after max retries', async () => {
      const client = new SlackClient({ ...oauthOptions, maxRetries: 2 })
      const webClientInstance = vi.mocked(WebClient).mock.results[0]
        ?.value as any

      const timeoutError = new Error('request_timeout')
      ;(timeoutError as any).code = 'request_timeout'

      webClientInstance.chat.postMessage.mockRejectedValue(timeoutError)

      await expect(client.sendMessage({ text: 'fail' })).rejects.toThrow(
        'Slack API failure: request_timeout'
      )
      expect(webClientInstance.chat.postMessage).toHaveBeenCalledTimes(2)
    })
  })
})
