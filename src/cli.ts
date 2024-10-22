#!/usr/bin/env node
import yargs from 'yargs/yargs';
import { hideBin } from 'yargs/helpers';
import { parseCtrfFile } from './ctrf-parser';
import { formatResultsMessage, formatFlakyTestsMessage, formatAiTestSummary, formatConsolidatedAiTestSummary, formatConsolidatedFailedTestSummary, formatFailedTestSummary } from './message-formatter';
import { sendSlackMessage } from './slack-notify';
import { stripAnsiFromErrors } from './utils/common';

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
        .option('title', {
          alias: 't',
          type: 'string',
          description: 'Title of notification',
          default: "Test Results",
        });
    },
    async (argv) => {
      try {
        const ctrfData = parseCtrfFile(argv.path as string);
        if (argv.onFailOnly && ctrfData.results.summary.failed === 0) {
          console.log('No failed tests. Message not sent.');
          return;
        }
        const message = formatResultsMessage(ctrfData, {title: argv.title});
        await sendSlackMessage(message);
        console.log('Results message sent to Slack.');
      } catch (error: any) {
        console.error('Error:', error.message);
      }
    }
  )
  .command(
    'failed <path>',
    'Send failed test results to Slack',
    (yargs) => {
      return yargs.positional('path', {
        describe: 'Path to the CTRF file',
        type: 'string',
        demandOption: true,
      })
      .option('title', {
        alias: 't',
        type: 'string',
        description: 'Title of notification',
        default: ":x: Failed Test",
      })
      .option('consolidated', {
        alias: 'c',
        type: 'boolean',
        description: 'Consolidate all failure summaries into a single message',
        default: false,
      });
    },
    async (argv) => {
      try {
        const ctrfData = stripAnsiFromErrors(parseCtrfFile(argv.path as string))
        if (argv.consolidated) {
            const message = formatConsolidatedFailedTestSummary(ctrfData.results.tests, ctrfData.results.environment, {title: argv.title})
            if (message) {
              await sendSlackMessage(message);
              console.log('Failed test summary sent to Slack.');
            } else {
              console.log('No failed test summary detected. No message sent.');
            }
        } else {
        for (const test of ctrfData.results.tests) {
          if (test.status === "failed") {
            const message = formatFailedTestSummary(test, ctrfData.results.environment, {title: argv.title});
            if (message) {
              await sendSlackMessage(message);
              console.log('Failed test summary sent to Slack.');
            } else {
              console.log('No failed test summary detected. No message sent');
            }
          }
        }
      }
      } catch (error: any) {
        console.error('Error:', error.message);
      }
    })
  .command(
    'flaky <path>',
    'Send flaky test results to Slack',
    (yargs) => {
      return yargs.positional('path', {
        describe: 'Path to the CTRF file',
        type: 'string',
        demandOption: true,
      })
      .option('title', {
        alias: 't',
        type: 'string',
        description: 'Title of notification',
        default: "Flaky Tests",
      });
    },
    async (argv) => {
      try {
        const ctrfData = parseCtrfFile(argv.path as string);
        const message = formatFlakyTestsMessage(ctrfData, {title: argv.title});
        if (message) {
          await sendSlackMessage(message);
          console.log('Flaky tests message sent to Slack.');
        } else {
          console.log('No flaky tests detected. No message sent.');
        }
      } catch (error: any) {
        console.error('Error:', error.message);
      }
    }
  )
  .command(
    'ai <path>',
    'Send ai failed test summary for each failed test to Slack',
    (yargs) => {
      return yargs.positional('path', {
        describe: 'Path to the CTRF file',
        type: 'string',
        demandOption: true,
      })
      .option('title', {
        alias: 't',
        type: 'string',
        description: 'Title of notification',
        default: "AI Summary",
      })
      .option('consolidated', {
        alias: 'c',
        type: 'boolean',
        description: 'Consolidate all failure summaries into a single message',
        default: false,
      });
    },
    async (argv) => {
      try {
        const ctrfData = parseCtrfFile(argv.path as string);
        if (argv.consolidated) {
            const message = formatConsolidatedAiTestSummary(ctrfData.results.tests, ctrfData.results.environment, {title: argv.title})
            if (message) {
              await sendSlackMessage(message);
              console.log('AI test summary sent to Slack.');
            } else {
              console.log('No AI summary detected. No message sent.');
            }
        } else {
        for (const test of ctrfData.results.tests) {
          if (test.status === "failed") {
            const message = formatAiTestSummary(test, ctrfData.results.environment, {title: argv.title});
            if (message) {
              await sendSlackMessage(message);
              console.log('AI test summary sent to Slack.');
            } else {
              console.log('No AI summary detected. No message sent');
            }
          }
        }
      }
      } catch (error: any) {
        console.error('Error:', error.message);
      }
    }
  )
  .help()
  .argv;