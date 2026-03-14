#!/usr/bin/env node
import yargs from 'yargs/yargs';
import { hideBin } from 'yargs/helpers';
import { parseCtrfFile } from './ctrf-parser.js';
import { sendAISummaryToSlack, sendFailedResultsToSlack, sendFlakyResultsToSlack, sendTestResultsToSlack, sendCustomMarkdownTemplateToSlack, sendCustomBlockKitTemplateToSlack, } from './slack-reporter.js';
import fs from 'fs';
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
    replyBroadcast: {
        alias: 'rb',
        type: 'boolean',
        description: 'Also send threaded reply to the channel (requires OAuth token)',
        default: false,
    },
    updateTs: {
        alias: 'ut',
        type: 'string',
        description: 'Timestamp of a message to update (requires OAuth token)',
    },
    react: {
        alias: 'r',
        type: 'boolean',
        description: 'Add a reaction to the parent message based on test results (requires OAuth token)',
        default: false,
    },
    autoThread: {
        alias: 'at',
        type: 'boolean',
        description: 'Automatically thread individual failure details under a summary message',
        default: true,
    },
    failedEmoji: {
        type: 'string',
        description: 'Emoji to use for failed tests reaction',
        default: 'x',
    },
    passedEmoji: {
        type: 'string',
        description: 'Emoji to use for passed tests reaction',
        default: 'white_check_mark',
    },
    dryRun: {
        alias: 'dr',
        type: 'boolean',
        description: 'Print the Slack message payload instead of sending it',
        default: false,
    },
};
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
};
const consolidatedOption = {
    consolidated: {
        alias: 'c',
        type: 'boolean',
        description: 'Consolidate all failure summaries into a single message',
        default: false,
    },
};
function getActionConfig() {
    const config = {};
    const mapping = {
        command: process.env.INPUT_COMMAND,
        path: process.env.INPUT_PATH,
        templatePath: process.env.INPUT_TEMPLATE_PATH,
        title: process.env.INPUT_TITLE,
        prefix: process.env.INPUT_PREFIX,
        suffix: process.env.INPUT_SUFFIX,
        threadTs: process.env.INPUT_THREAD_TS,
        replyBroadcast: process.env.INPUT_REPLY_BROADCAST,
        updateTs: process.env.INPUT_UPDATE_TS,
        react: process.env.INPUT_REACT,
        onFailOnly: process.env.INPUT_ON_FAIL_ONLY,
        consolidated: process.env.INPUT_CONSOLIDATED,
        autoThread: process.env.INPUT_AUTO_THREAD,
        oauthToken: process.env.INPUT_SLACK_TOKEN,
        channelId: process.env.INPUT_CHANNEL_ID,
        webhookUrl: process.env.INPUT_WEBHOOK_URL,
        maxRetries: process.env.INPUT_MAX_RETRIES,
        dryRun: process.env.INPUT_DRY_RUN,
    };
    for (const [key, value] of Object.entries(mapping)) {
        if (value !== undefined && value !== '') {
            if (value === 'true') {
                config[key] = true;
            }
            else if (value === 'false') {
                config[key] = false;
            }
            else if (!isNaN(Number(value)) && key === 'maxRetries') {
                config[key] = Number(value);
            }
            else {
                config[key] = value;
            }
        }
    }
    return config;
}
function setGithubOutput(key, value) {
    const outputPath = process.env.GITHUB_OUTPUT;
    if (outputPath && value) {
        fs.appendFileSync(outputPath, `${key}=${value}\n`);
    }
}
const y = yargs(hideBin(process.argv))
    .options(slackOptions)
    .config(getActionConfig())
    .command('results <path>', 'Send test results summary to Slack', yargs => {
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
        .options(sharedOptions);
}, async (argv) => {
    await handleCommand(sendTestResultsToSlack, argv, {
        onFailOnly: argv.onFailOnly,
    });
})
    .command('failed <path>', 'Send failed test results to Slack', yargs => {
    return yargs
        .positional('path', {
        describe: 'Path to the CTRF file',
        type: 'string',
        demandOption: true,
    })
        .options(sharedOptions)
        .option(consolidatedOption);
}, async (argv) => {
    await handleCommand(sendFailedResultsToSlack, argv, {
        consolidated: argv.consolidated,
    });
})
    .command('flaky <path>', 'Send flaky test results to Slack', yargs => {
    return yargs
        .positional('path', {
        describe: 'Path to the CTRF file',
        type: 'string',
        demandOption: true,
    })
        .options(sharedOptions);
}, async (argv) => {
    await handleCommand(sendFlakyResultsToSlack, argv);
})
    .command('ai <path>', 'Send ai failed test summary for each failed test to Slack', yargs => {
    return yargs
        .positional('path', {
        describe: 'Path to the CTRF file',
        type: 'string',
        demandOption: true,
    })
        .options(sharedOptions)
        .option(consolidatedOption);
}, async (argv) => {
    await handleCommand(sendAISummaryToSlack, argv, {
        consolidated: argv.consolidated,
    });
})
    .command('custom <path> <templatePath>', 'Send a message to Slack using a custom Handlebars template', yargs => {
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
            argv.blockkit = false;
        }
        return true;
    });
}, async (argv) => {
    try {
        const report = parseCtrfFile(argv.path);
        const slackConfig = getEffectiveSlackConfig(argv);
        if (!fs.existsSync(argv.templatePath)) {
            console.error('Error: Template file not found:', argv.templatePath);
            process.exit(1);
        }
        const templateContent = fs.readFileSync(argv.templatePath, 'utf-8');
        const options = {
            title: argv.title,
            prefix: argv.prefix,
            suffix: argv.suffix,
            onFailOnly: argv.onFailOnly,
            threadTs: argv.threadTs,
            returnTs: argv.returnTs,
            replyBroadcast: argv.replyBroadcast,
            updateTs: argv.updateTs,
            react: argv.react,
            autoThread: argv.autoThread,
            failedEmoji: argv.failedEmoji,
            passedEmoji: argv.passedEmoji,
            dryRun: argv.dryRun,
            ...slackConfig,
        };
        let timestamp;
        if (argv.blockkit) {
            timestamp = await sendCustomBlockKitTemplateToSlack(report, templateContent, options, !argv.returnTs);
        }
        else {
            timestamp = await sendCustomMarkdownTemplateToSlack(report, templateContent, options, !argv.returnTs);
        }
        if (argv.returnTs && timestamp) {
            console.log(JSON.stringify({ ts: timestamp }));
        }
        if (timestamp) {
            setGithubOutput('ts', timestamp);
        }
    }
    catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        console.error('Error:', message);
        process.exit(1);
    }
})
    .check(argv => {
    const token = argv.oauthToken ?? process.env.SLACK_OAUTH_TOKEN;
    const channelId = argv.channelId ?? process.env.SLACK_CHANNEL_ID;
    const webhookUrl = argv.webhookUrl ?? process.env.SLACK_WEBHOOK_URL;
    const usingOAuthToken = Boolean(token);
    const usingWebhook = Boolean(webhookUrl);
    if (usingOAuthToken && usingWebhook) {
        throw new Error('Cannot provide both Slack OAuth Token and Webhook URL.');
    }
    if (usingOAuthToken) {
        if (channelId === undefined) {
            throw new Error('Missing required argument: --channel-id (or SLACK_CHANNEL_ID env var) must be provided when using --oauth-token (or SLACK_OAUTH_TOKEN env var)');
        }
        return true;
    }
    if (usingWebhook) {
        return true;
    }
    throw new Error('Please provide either webhook-url (or SLACK_WEBHOOK_URL env var), OR both oauth-token (or SLACK_OAUTH_TOKEN env var) and --channel-id (or SLACK_CHANNEL_ID env var).');
})
    .help();
// Trigger the CLI
if (process.env.INPUT_COMMAND && process.argv.length < 3) {
    const command = process.env.INPUT_COMMAND;
    const path = process.env.INPUT_PATH;
    if (path) {
        // If it's a custom command, we need the template path too
        const templatePath = process.env.INPUT_TEMPLATE_PATH;
        const args = templatePath ? [command, path, templatePath] : [command, path];
        y.parse(args);
    }
    else {
        y.parse();
    }
}
else {
    y.parse();
}
/**
 * Handle command execution with shared logic
 */
async function handleCommand(reporterFn, argv, extraOptions = {}) {
    try {
        const report = parseCtrfFile(argv.path);
        const slackConfig = getEffectiveSlackConfig(argv);
        const options = {
            title: argv.title,
            prefix: argv.prefix,
            suffix: argv.suffix,
            threadTs: argv.threadTs,
            returnTs: argv.returnTs,
            replyBroadcast: argv.replyBroadcast,
            updateTs: argv.updateTs,
            react: argv.react,
            autoThread: argv.autoThread,
            failedEmoji: argv.failedEmoji,
            passedEmoji: argv.passedEmoji,
            dryRun: argv.dryRun,
            ...extraOptions,
            ...slackConfig,
        };
        const timestamp = await reporterFn(report, options, !argv.returnTs);
        if (argv.returnTs && timestamp) {
            console.log(JSON.stringify({ ts: timestamp }));
        }
        if (timestamp) {
            setGithubOutput('ts', timestamp);
        }
    }
    catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        console.error('Error:', message);
        process.exit(1);
    }
}
function getEffectiveSlackConfig(argv) {
    const token = argv.oauthToken ?? process.env.SLACK_OAUTH_TOKEN;
    const channelId = argv.channelId ?? process.env.SLACK_CHANNEL_ID;
    const webhookUrl = argv.webhookUrl ?? process.env.SLACK_WEBHOOK_URL;
    return { oauthToken: token, channelId, webhookUrl };
}
//# sourceMappingURL=cli.js.map