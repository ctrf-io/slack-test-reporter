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
  updateTs?: string
  react?: boolean
  autoThread?: boolean
  failedEmoji?: string
  passedEmoji?: string
}

export interface SlackMessage {
  text?: string
  blocks?: any[]
  attachments?: any[]
  thread_ts?: string
  reply_broadcast?: boolean
  mrkdwn?: boolean
}
