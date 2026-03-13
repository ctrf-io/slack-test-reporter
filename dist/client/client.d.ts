import { ChatPostMessageResponse, WebClient } from '@slack/web-api';
import { IncomingWebhook } from '@slack/webhook';
import { type Options, type SlackMessage } from '../types/reporter.js';
/**
 * Create a Slack API client for more advanced operations
 * @param token - Slack API token
 * @returns A WebClient instance
 */
export declare const createSlackClient: (token?: string) => WebClient;
/**
 * Create a Slack webhook for sending messages
 * @param url - Slack webhook URL
 * @returns An IncomingWebhook instance
 */
export declare const createSlackWebhook: (url?: string) => IncomingWebhook;
/**
 * Send a message to Slack using a webhook URL
 * @param message - The message payload to send to Slack
 * @param options - Options including threadTs and replyBroadcast
 * @returns A promise that resolves when the message is sent
 */
export declare const sendSlackMessage: (message: SlackMessage, options: Options) => Promise<void>;
/**
 * Send a message to a Slack channel using the Web API
 * @param channel - Channel ID or name
 * @param message - Message text or blocks
 * @param options - Options including threadTs and replyBroadcast
 * @returns A promise that resolves with the API response
 */
export declare const postMessage: (channel: string, message: string | SlackMessage, options: Options) => Promise<ChatPostMessageResponse>;
/**
 * Update an existing Slack message
 * @param channel - Channel ID
 * @param ts - Timestamp of the message to update
 * @param message - New message content
 * @param options - Options including oauthToken
 * @returns A promise that resolves with the API response
 */
export declare const updateMessage: (channel: string, ts: string, message: string | SlackMessage, options: Options) => Promise<ChatPostMessageResponse>;
/**
 * Add a reaction to a Slack message
 * @param channel - Channel ID
 * @param ts - Timestamp of the message to react to
 * @param emoji - Emoji name (without colons)
 * @param options - Options including oauthToken
 */
export declare const addReaction: (channel: string, ts: string, emoji: string, options: Options) => Promise<void>;
//# sourceMappingURL=client.d.ts.map