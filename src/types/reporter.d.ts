export interface Options {
  onFailOnly?: boolean
  title?: string
  prefix?: string
  suffix?: string
  consolidated?: boolean
  oauthToken?: string
  channelId?: string
  webhookUrl?: string
  token?: string
  threadTs?: string
  returnTs?: boolean
  replyBroadcast?: boolean
  autoThread?: boolean
  maxRetries?: number
  dryRun?: boolean
  maxReports?: number
  react?: boolean
  failedEmoji?: string
  passedEmoji?: string
}

export interface SlackBlock {
  type: string
  text?: {
    type: string
    text: string
    emoji?: boolean
  }
  accessory?: {
    type: string
    image_url: string
    alt_text: string
  }
  elements?: Array<{
    type: string
    text: string
  }>
}

export interface SlackMessage {
  text?: string
  blocks?: SlackBlock[]
  attachments?: Array<{
    fallback?: string
    color?: string
    blocks?: SlackBlock[]
  }>
  thread_ts?: string
  reply_broadcast?: boolean
  mrkdwn?: boolean
}
