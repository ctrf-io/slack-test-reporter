#!/usr/bin/env node
import yargs from 'yargs/yargs'
import { hideBin } from 'yargs/helpers'
import { parseCtrfFile } from './ctrf-parser.js'
import {
  sendAISummaryToSlack,
  sendFailedResultsToSlack,
  sendFlakyResultsToSlack,
  sendTestResultsToSlack,
  sendCustomMarkdownTemplateToSlack,
  sendCustomBlockKitTemplateToSlack,
} from './slack-reporter.js'
import fs from 'fs'
import { type Options } from './types/reporter.js'

const sharedOptions = {
  title: {
    alias: 't',
    type: 'string',
    description: 'Title of notification',
  },
  prefix: {
    alias: 'p',
    type: 'string',
    description: 'Custom text to add as a prefix to the message',
    default: '',
  },
  suffix: {
    alias: 's',
    type: 'string',
    description: 'Custom text to add as a suffix to the message',
    default: '',
  },
  threadTs: {
    alias: 'tt',
    type: 'string',
    description: 'Thread timestamp to reply to an existing thread',
  },
  returnTs: {
    alias: 'rt',
    type: 'boolean',
    description: 'Output the message timestamp (only works with OAuth token)',
    default: false,
  },
} as const

const slackOptions = {
  oauthToken: {
    alias: 'o',
    type: 'string',
    description: 'Slack API Bot Token (xoxb-...). Requires --channel-id.',
    implies: 'channel-id',
  },
  channelId: {
    alias: 'ch',
    type: 'string',
    description: 'Slack Channel ID (required if oauth-token is provided)',
  },
  webhookUrl: {
    alias: 'w',
    type: 'string',
    description: 'Slack Incoming Webhook URL',
    conflicts: ['oauth-token', 'channel-id'],
  },
} as const

const consolidatedOption = {
  consolidated: {
    alias: 'c',
    type: 'boolean',
    description: 'Consolidate all failure summaries into a single message',
    default: false,
  },
} as const

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const argv = yargs(hideBin(process.argv))
  .options(slackOptions)
  .command(
    'results <path>',
    'Send test results summary to Slack',
    yargs => {
      return yargs
        .positional('path', {
          describe: 'Path to the CTRF file',
          type: 'string',
          demandOption: true,
        })
        .option('onFailOnly', {
          alias: 'f',
          type: 'boolean',
          description: 'Send message only if there are failed tests',
          default: false,
        })
        .options(sharedOptions)
    },
    async argv => {
      try {
        const report = parseCtrfFile(argv.path)
        const slackConfig = getEffectiveSlackConfig(argv)
        const timestamp = await sendTestResultsToSlack(
          report,
          {
            title: argv.title,
            prefix: argv.prefix,
            suffix: argv.suffix,
            onFailOnly: argv.onFailOnly,
            threadTs: argv.threadTs,
            returnTs: argv.returnTs,
            ...slackConfig,
          },
          true
        )
        if (argv.returnTs && timestamp) {
          console.log(JSON.stringify({ ts: timestamp }))
        }
      } catch (error: any) {
        console.error('Error:', error.message)
        process.exit(1)
      }
    }
  )
  .command(
    'failed <path>',
    'Send failed test results to Slack',
    yargs => {
      return yargs
        .positional('path', {
          describe: 'Path to the CTRF file',
          type: 'string',
          demandOption: true,
        })
        .options(sharedOptions)
        .option(consolidatedOption)
    },
    async argv => {
      try {
        const report = parseCtrfFile(argv.path)
        const slackConfig = getEffectiveSlackConfig(argv)
        const timestamp = await sendFailedResultsToSlack(
          report,
          {
            title: argv.title,
            prefix: argv.prefix,
            suffix: argv.suffix,
            consolidated: argv.consolidated,
            threadTs: argv.threadTs,
            returnTs: argv.returnTs,
            ...slackConfig,
          },
          true
        )
        if (argv.returnTs && timestamp) {
          console.log(JSON.stringify({ ts: timestamp }))
        }
      } catch (error: any) {
        console.error('Error:', error.message)
        process.exit(1)
      }
    }
  )
  .command(
    'flaky <path>',
    'Send flaky test results to Slack',
    yargs => {
      return yargs
        .positional('path', {
          describe: 'Path to the CTRF file',
          type: 'string',
          demandOption: true,
        })
        .options(sharedOptions)
    },
    async argv => {
      try {
        const report = parseCtrfFile(argv.path)
        const slackConfig = getEffectiveSlackConfig(argv)
        const timestamp = await sendFlakyResultsToSlack(
          report,
          {
            title: argv.title,
            prefix: argv.prefix,
            suffix: argv.suffix,
            threadTs: argv.threadTs,
            returnTs: argv.returnTs,
            ...slackConfig,
          },
          true
        )
        if (argv.returnTs && timestamp) {
          console.log(JSON.stringify({ ts: timestamp }))
        }
      } catch (error: any) {
        console.error('Error:', error.message)
        process.exit(1)
      }
    }
  )
  .command(
    'ai <path>',
    'Send ai failed test summary for each failed test to Slack',
    yargs => {
      return yargs
        .positional('path', {
          describe: 'Path to the CTRF file',
          type: 'string',
          demandOption: true,
        })
        .options(sharedOptions)
        .option(consolidatedOption)
    },
    async argv => {
      try {
        const report = parseCtrfFile(argv.path)
        const slackConfig = getEffectiveSlackConfig(argv)
        const timestamp = await sendAISummaryToSlack(
          report,
          {
            title: argv.title,
            prefix: argv.prefix,
            suffix: argv.suffix,
            consolidated: argv.consolidated,
            threadTs: argv.threadTs,
            returnTs: argv.returnTs,
            ...slackConfig,
          },
          true
        )
        if (argv.returnTs && timestamp) {
          console.log(JSON.stringify({ ts: timestamp }))
        }
      } catch (error: any) {
        console.error('Error:', error.message)
        process.exit(1)
      }
    }
  )
  .command(
    'custom <path> <templatePath>',
    'Send a message to Slack using a custom Handlebars template',
    yargs => {
      return yargs
        .positional('path', {
          describe: 'Path to the CTRF file',
          type: 'string',
          demandOption: true,
        })
        .positional('templatePath', {
          describe: 'Path to the Handlebars template file',
          type: 'string',
          demandOption: true,
        })
        .options(sharedOptions)
        .option('onFailOnly', {
          alias: 'f',
          type: 'boolean',
          description: 'Send message only if there are failed tests',
          default: false,
        })
        .options({
          markdown: {
            alias: 'm',
            type: 'boolean',
            description: 'template is slack flavored markdown',
            default: false,
          },
          blockkit: {
            alias: 'b',
            type: 'boolean',
            description: 'template is Block Kit JSON format',
            default: true,
          },
        })
        .group(['markdown', 'blocks'], 'Template Format:')
        .check(argv => {
          if (argv.markdown) {
            argv.blockkit = false
          }
          return true
        })
    },
    async argv => {
      try {
        const report = parseCtrfFile(argv.path)
        const slackConfig = getEffectiveSlackConfig(argv)

        if (!fs.existsSync(argv.templatePath)) {
          console.error('Error: Template file not found:', argv.templatePath)
          process.exit(1)
        }

        const templateContent = fs.readFileSync(argv.templatePath, 'utf-8')

        if (argv.blockkit) {
          const timestamp = await sendCustomBlockKitTemplateToSlack(
            report,
            templateContent,
            {
              onFailOnly: argv.onFailOnly,
              threadTs: argv.threadTs,
              returnTs: argv.returnTs,
              ...slackConfig,
            },
            true
          )
          if (argv.returnTs && timestamp) {
            console.log(JSON.stringify({ ts: timestamp }))
          }
        } else {
          const timestamp = await sendCustomMarkdownTemplateToSlack(
            report,
            templateContent,
            {
              title: argv.title,
              prefix: argv.prefix,
              suffix: argv.suffix,
              onFailOnly: argv.onFailOnly,
              threadTs: argv.threadTs,
              returnTs: argv.returnTs,
              ...slackConfig,
            },
            true
          )
          if (argv.returnTs && timestamp) {
            console.log(JSON.stringify({ ts: timestamp }))
          }
        }
      } catch (error: any) {
        console.error('Error:', error.message)
        process.exit(1)
      }
    }
  )
  .check(argv => {
    const token = argv.oauthToken ?? process.env.SLACK_OAUTH_TOKEN
    const channelId = argv.channelId ?? process.env.SLACK_CHANNEL_ID
    const webhookUrl = argv.webhookUrl ?? process.env.SLACK_WEBHOOK_URL

    const usingOAuthToken = Boolean(token)
    const usingWebhook = Boolean(webhookUrl)

    if (usingOAuthToken && usingWebhook) {
      throw new Error('Cannot provide both Slack OAuth Token and Webhook URL.')
    }

    if (usingOAuthToken) {
      if (channelId === undefined) {
        throw new Error(
          'Missing required argument: --channel-id (or SLACK_CHANNEL_ID env var) must be provided when using --oauth-token (or SLACK_OAUTH_TOKEN env var)'
        )
      }
      return true
    }

    if (usingWebhook) {
      return true
    }

    throw new Error(
      'Please provide either webhook-url (or SLACK_WEBHOOK_URL env var), OR both oauth-token (or SLACK_OAUTH_TOKEN env var) and --channel-id (or SLACK_CHANNEL_ID env var).'
    )
  })
  .help().argv

function getEffectiveSlackConfig(argv: any): Options {
  const token = argv.oauthToken ?? process.env.SLACK_OAUTH_TOKEN
  const channelId = argv.channelId ?? process.env.SLACK_CHANNEL_ID
  const webhookUrl = argv.webhookUrl ?? process.env.SLACK_WEBHOOK_URL
  return { oauthToken: token, channelId, webhookUrl }
}
