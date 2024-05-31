#!/usr/bin/env node
import yargs from 'yargs/yargs';
import { hideBin } from 'yargs/helpers';
import { parseCtrfFile } from './ctrf-parser';
import { formatResultsMessage, formatFailedTestsMessage, formatFlakyTestsMessage } from './message-formatter';
import { sendSlackMessage } from './slack-notify';

const argv = yargs(hideBin(process.argv))
    .command(
        'results <path>',
        'Send test results summary to Slack',
        (yargs) => {
            return yargs.positional('path', {
                describe: 'Path to the CTRF file',
                type: 'string',
                demandOption: true,
            });
        },
        async (argv) => {
            try {
                const ctrfData = parseCtrfFile(argv.path as string);
                const message = formatResultsMessage(ctrfData);
                await sendSlackMessage(message);
                console.log('Results message sent to Slack.');
            } catch (error: any) {
                console.error('Error:', error.message);
            }
        }
    )
    .command(
        'fail-details <path>',
        'Send failed test results to Slack',
        (yargs) => {
            return yargs.positional('path', {
                describe: 'Path to the CTRF file',
                type: 'string',
                demandOption: true,
            });
        },
        async (argv) => {
            try {
                const ctrfData = parseCtrfFile(argv.path as string);
                const message = formatFailedTestsMessage(ctrfData);
                // await sendSlackMessage(message);
                console.log('Coming soon!');
            } catch (error: any) {
                console.error('Error:', error.message);
            }
        }
    )
    .command(
        'flaky-details <path>',
        'Send flaky test results to Slack',
        (yargs) => {
            return yargs.positional('path', {
                describe: 'Path to the CTRF file',
                type: 'string',
                demandOption: true,
            });
        },
        async (argv) => {
            try {
                const ctrfData = parseCtrfFile(argv.path as string);
                const message = formatFlakyTestsMessage(ctrfData);
                // await sendSlackMessage(message);
                console.log('Coming soon!');
            } catch (error: any) {
                console.error('Error:', error.message);
            }
        }
    )
    .help()
    .argv;
