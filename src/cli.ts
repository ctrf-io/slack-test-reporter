#!/usr/bin/env node
import yargs from 'yargs/yargs'
import { hideBin } from 'yargs/helpers'
import { parseCtrfFile } from './ctrf-parser'
import {
  sendAISummaryToSlack,
  sendFailedResultsToSlack,
  sendFlakyResultsToSlack,
  sendTestResultsToSlack,
  sendCustomMarkdownTemplateToSlack,
  sendCustomBlockKitTemplateToSlack,
} from './slack-reporter'
import fs from 'fs'

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
  .command(
    'results <path>',
    'Send test results summary to Slack',
    (yargs) => {
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
    async (argv) => {
      try {
        const report = parseCtrfFile(argv.path)
        await sendTestResultsToSlack(
          report,
          {
            title: argv.title,
            prefix: argv.prefix,
            suffix: argv.suffix,
            onFailOnly: argv.onFailOnly,
          },
          true
        )
      } catch (error: any) {
        console.error('Error:', error.message)
      }
    }
  )
  .command(
    'failed <path>',
    'Send failed test results to Slack',
    (yargs) => {
      return yargs
        .positional('path', {
          describe: 'Path to the CTRF file',
          type: 'string',
          demandOption: true,
        })
        .options(sharedOptions)
        .option(consolidatedOption)
    },
    async (argv) => {
      try {
        const report = parseCtrfFile(argv.path)
        await sendFailedResultsToSlack(
          report,
          {
            title: argv.title,
            prefix: argv.prefix,
            suffix: argv.suffix,
            consolidated: argv.consolidated,
          },
          true
        )
      } catch (error: any) {
        console.error('Error:', error.message)
      }
    }
  )
  .command(
    'flaky <path>',
    'Send flaky test results to Slack',
    (yargs) => {
      return yargs
        .positional('path', {
          describe: 'Path to the CTRF file',
          type: 'string',
          demandOption: true,
        })
        .options(sharedOptions)
    },
    async (argv) => {
      try {
        const report = parseCtrfFile(argv.path)
        await sendFlakyResultsToSlack(
          report,
          { title: argv.title, prefix: argv.prefix, suffix: argv.suffix },
          true
        )
      } catch (error: any) {
        console.error('Error:', error.message)
      }
    }
  )
  .command(
    'ai <path>',
    'Send ai failed test summary for each failed test to Slack',
    (yargs) => {
      return yargs
        .positional('path', {
          describe: 'Path to the CTRF file',
          type: 'string',
          demandOption: true,
        })
        .options(sharedOptions)
        .option(consolidatedOption)
    },
    async (argv) => {
      try {
        const report = parseCtrfFile(argv.path)
        await sendAISummaryToSlack(
          report,
          {
            title: argv.title,
            prefix: argv.prefix,
            suffix: argv.suffix,
            consolidated: argv.consolidated,
          },
          true
        )
      } catch (error: any) {
        console.error('Error:', error.message)
      }
    }
  )
  .command(
    'custom <path> <templatePath>',
    'Send a message to Slack using a custom Handlebars template',
    (yargs) => {
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
        .check((argv) => {
          if (argv.markdown) {
            argv.blockkit = false
          }
          return true
        })
    },
    async (argv) => {
      try {
        const report = parseCtrfFile(argv.path)

        if (!fs.existsSync(argv.templatePath)) {
          throw new Error(`Template file not found: ${argv.templatePath}`)
        }

        const templateContent = fs.readFileSync(argv.templatePath, 'utf-8')

        if (argv.blockkit) {
          await sendCustomBlockKitTemplateToSlack(
            report,
            templateContent,
            {
              onFailOnly: argv.onFailOnly,
            },
            true
          )
        } else {
          await sendCustomMarkdownTemplateToSlack(
            report,
            templateContent,
            {
              title: argv.title,
              prefix: argv.prefix,
              suffix: argv.suffix,
              onFailOnly: argv.onFailOnly,
            },
            true
          )
        }
      } catch (error: any) {
        console.error('Error:', error.message)
      }
    }
  )
  .help().argv
