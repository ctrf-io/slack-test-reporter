import { CtrfEnvironment, CtrfReport, CtrfTest } from '../types/ctrf';
import { Options } from '../types/reporter';
import { BLOCK_TYPES, COLORS, EMOJIS, MESSAGES, TEXT_TYPES, TITLES, formatString } from './constants';

export const formatResultsMessage = (ctrf: CtrfReport, options?: Options): object => {
  const { summary, environment } = ctrf.results;
  const { passed, failed, skipped, pending, other, tests } = summary;
  const { title = TITLES.TEST_RESULTS, prefix = null, suffix = null } = options || {};
  const { buildInfo, missingEnvProperties } = handleBuildInfo(environment);
  const resultText = failed > 0 ? formatString(MESSAGES.RESULT_FAILED, failed) : MESSAGES.RESULT_PASSED;
  const durationInSeconds = (summary.stop - summary.start) / 1000;
  const durationText = durationInSeconds < 1 ? MESSAGES.DURATION_LESS_THAN_ONE : formatString(MESSAGES.DURATION_FORMAT, new Date(durationInSeconds * 1000).toISOString().substr(11, 8));
  const testSummary = `${EMOJIS.TEST_TUBE} ${tests} | ${EMOJIS.CHECK_MARK} ${passed} | ${EMOJIS.X_MARK} ${failed} | ${EMOJIS.FAST_FORWARD} ${skipped} | ${EMOJIS.HOURGLASS} ${pending} | ${EMOJIS.QUESTION} ${other}`;

  const customBlocks = [{
    type: BLOCK_TYPES.SECTION,
    text: {
      type: TEXT_TYPES.MRKDWN,
      text: testSummary
    }
  },{
    type: BLOCK_TYPES.SECTION,
    text: {
      type: TEXT_TYPES.MRKDWN,
      text: `${resultText} | ${durationText}\n${buildInfo}`
    }
  }]

  const blocks = blockBuilder([], {
    title: title,
    prefix: prefix,
    prefixBlock: prefix ? true : false,
    suffix: suffix,
    suffixBlock: suffix ? true : false,
    customBlocks: customBlocks,
    buildInfo: buildInfo,
    missingEnvProperties: missingEnvProperties,
    missingEnvPropertiesBlock: missingEnvProperties.length > 0 ? true : false
  });

  const notification: string[] = [];
  notification.push(title);

  if (environment) {
    const { buildName, buildNumber } = environment;
    if (buildName && buildNumber) {
      notification.push(`${buildName} #${buildNumber}`)
    }
  }

  const message = failed > 0
    ? `Failed: ${failed}`
    : 'Passed';

  notification.push(message)

  return {
    attachments: [
      {
        fallback: notification.join('\n'),
        color: failed > 0 ? COLORS.FAILED : COLORS.PASSED,
        blocks: blocks
      }
    ]
  };
};

export const formatFlakyTestsMessage = (ctrf: CtrfReport, options?: Options): object | null => {
  const { environment, tests } = ctrf.results;
  const flakyTests = tests.filter(test => test.flaky);
  const { title = TITLES.FLAKY_TESTS, prefix = null, suffix = null } = options || {};
  const { buildInfo, missingEnvProperties } = handleBuildInfo(environment);
  const flakyTestsText = flakyTests.map(test => `- ${test.name}`).join('\n');

  if (flakyTests.length === 0) {
    return null;
  }

  const customBlocks = [
    {
      type: BLOCK_TYPES.SECTION,
      text: {
        type: TEXT_TYPES.MRKDWN,
        text: `${MESSAGES.FLAKY_TESTS_DETECTED}\n${buildInfo}`
      }
    },
    {
      type: BLOCK_TYPES.SECTION,
      text: {
        type: TEXT_TYPES.MRKDWN,
        text: `*Flaky Tests*\n${flakyTestsText}`
      }
    }];

  const blocks = blockBuilder([], {
    title: title,
    prefix: prefix,
    prefixBlock: prefix ? true : false,
    suffix: suffix,
    suffixBlock: suffix ? true : false,
    customBlocks: customBlocks,
    buildInfo: buildInfo,
    missingEnvProperties: missingEnvProperties,
    missingEnvPropertiesBlock: missingEnvProperties.length > 0 ? true : false
  });

  const notification: string[] = []
  notification.push(title)

  if (environment) {
    const { buildName, buildNumber } = environment;
    if (buildName && buildNumber) {
      notification.push(`${buildName} #${buildNumber}`)
    }
  }

  notification.push('Flaky tests detected')

  return {
    attachments: [
      {
        fallback: notification.join('\n'),
        color: COLORS.FLAKY,
        blocks: blocks
      }
    ]
  };
};

export const formatAiTestSummary = (test: CtrfTest, environment: CtrfEnvironment | undefined, options?: Options): object | null => {
  const { name, ai, status } = test


  if (!ai || status === "passed") { return null }

  let title = options?.title ? options?.title : `AI Test summary`;
  let prefix = options?.prefix ? options.prefix : null;
  let suffix = options?.suffix ? options.suffix : null;

  const { buildInfo, missingEnvProperties } = handleBuildInfo(environment);

  const aiSummaryText = `*:sparkles: AI Summary:* ${ai}`;

  const customBlocks = [
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: `*Test Name:* ${name}\n${MESSAGES.STATUS_FAILED}`
      }
    },
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: `${aiSummaryText}`
      }
    }
  ];

  const blocks = blockBuilder([], {
    title: title,
    prefix: prefix,
    prefixBlock: prefix ? true : false,
    suffix: suffix,
    suffixBlock: suffix ? true : false,
    customBlocks: customBlocks,
    buildInfo: buildInfo,
    missingEnvProperties: missingEnvProperties,
    missingEnvPropertiesBlock: missingEnvProperties.length > 0 ? true : false
  });

  const notification: string[] = []
  notification.push(title)

  if (environment) {
    const { buildName, buildNumber } = environment;
    if (buildName && buildNumber) {
      notification.push(`${buildName} #${buildNumber}`)
    }
  }

  notification.push(name)

  return {
    attachments: [
      {
        fallback: notification.join('\n'),
        color: COLORS.AI,
        blocks: blocks
      }
    ]
  };
};

export const formatConsolidatedAiTestSummary = (
  tests: CtrfTest[],
  environment: CtrfEnvironment | undefined,
  options?: Options
): object | null => {

  const color = '#800080';
  const MAX_FAILED_TESTS = 20;
  const failedTests = tests.filter(test => test.ai && test.status === "failed");

  if (failedTests.length === 0) {
    return null;
  }

  const title = options?.title ? options.title : `:sparkles: AI Test Reporter`;
  let prefix = options?.prefix ? options.prefix : null;
  let suffix = options?.suffix ? options.suffix : null;

  const { buildInfo, missingEnvProperties } = handleBuildInfo(environment);

  const customBlocks: any[] = [{
    type: "section",
    text: {
      type: "mrkdwn",
      text: buildInfo
    }
  }, {
    type: "section",
    text: {
      type: "mrkdwn",
      text: `*Total Failed Tests:* ${failedTests.length}`
    }
  }, {
    type: "divider"
  }];

  const limitedFailedTests = failedTests.slice(0, MAX_FAILED_TESTS);

  limitedFailedTests.forEach(test => {
    const aiSummary = `${test.ai}`;

    customBlocks.push({
      type: "header",
      text: {
        type: "plain_text",
        text: `:x: ${test.name}`,
        emoji: true
      }
    });

    customBlocks.push({
      type: "section",
      text: {
        type: "mrkdwn",
        text: `*:sparkles: AI Summary:* ${aiSummary}`
      }
    });
  });

  if (failedTests.length > MAX_FAILED_TESTS) {
    customBlocks.push({
      type: "section",
      text: {
        type: "mrkdwn",
        text: `:information_source: Only the first ${MAX_FAILED_TESTS} failed tests are displayed. ${failedTests.length - MAX_FAILED_TESTS} additional failed tests were not included.`
      }
    });
  }

  const blocks = blockBuilder([], {
    title: title,
    prefix: prefix,
    prefixBlock: prefix ? true : false,
    suffix: suffix,
    suffixBlock: suffix ? true : false,
    customBlocks: customBlocks,
    missingEnvProperties: missingEnvProperties,
    missingEnvPropertiesBlock: missingEnvProperties.length > 0 ? true : false
  });

  const notification: string[] = []
  notification.push(title)

  if (environment) {
    const { buildName, buildNumber } = environment;
    if (buildName && buildNumber) {
      notification.push(`${buildName} #${buildNumber}`)
    }
  }

  return {
    attachments: [
      {
        fallback: notification.join('\n'),
        color: color,
        blocks: blocks
      }
    ]
  };
};

export const formatConsolidatedFailedTestSummary = (
  tests: CtrfTest[],
  environment: CtrfEnvironment | undefined,
  options?: Options
): object | null => {

  const color = '#FF0000';
  const MAX_FAILED_TESTS = 20;
  const charLimit = 2950;
  const trimmedNotice = "\n:warning: Message trimmed as too long for Slack";
  const failedTests = tests.filter(test => test.status === "failed");
  let prefix = options?.prefix ? options.prefix : null;
  let suffix = options?.suffix ? options.suffix : null;

  if (failedTests.length === 0) {
    return null;
  }

  const title = options?.title ? options.title : `:x: Failed Test Report`;

  const { buildInfo, missingEnvProperties } = handleBuildInfo(environment);

  const customBlocks: any[] = []

  customBlocks.push(
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: buildInfo
      }
    })

  customBlocks.push(
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: `*Total Failed Tests:* ${failedTests.length}`
      }
    })

  customBlocks.push(
    {
      type: "divider"
    })

  const limitedFailedTests = failedTests.slice(0, MAX_FAILED_TESTS);

  limitedFailedTests.forEach(test => {
    const failSummary = test.message && test.message.length > charLimit
      ? test.message.substring(0, charLimit - trimmedNotice.length) + trimmedNotice
      : test.message || "No message provided";

    customBlocks.push({
      type: "header",
      text: {
        type: "plain_text",
        text: `:x: ${test.name}`,
        emoji: true
      }
    });

    customBlocks.push({
      type: "section",
      text: {
        type: "mrkdwn",
        text: `${failSummary}`
      }
    });
  });

  if (failedTests.length > MAX_FAILED_TESTS) {
    customBlocks.push({
      type: "section",
      text: {
        type: "mrkdwn",
        text: `:information_source: Only the first ${MAX_FAILED_TESTS} failed tests are displayed. ${failedTests.length - MAX_FAILED_TESTS} additional failed tests were not included.`
      }
    });
  }

  const blocks = blockBuilder([], {
    title: title,
    prefix: prefix,
    prefixBlock: prefix ? true : false,
    suffix: suffix,
    suffixBlock: suffix ? true : false,
    customBlocks: customBlocks,
    missingEnvProperties: missingEnvProperties,
    missingEnvPropertiesBlock: missingEnvProperties.length > 0 ? true : false
  });

  const notification: string[] = []
  notification.push(title)

  if (environment) {
    const { buildName, buildNumber } = environment;
    if (buildName && buildNumber) {
      notification.push(`${buildName} #${buildNumber}`)
    }
  }

  return {
    attachments: [
      {
        fallback: notification.join('\n'),
        color: color,
        blocks: blocks
      }
    ]
  };
};

export const formatFailedTestSummary = (test: CtrfTest, environment: CtrfEnvironment | undefined, options?: Options): object | null => {
  const { name, message, status } = test;
  const { buildInfo, missingEnvProperties } = handleBuildInfo(environment);

  if (status !== "failed") {
    return null;
  }

  const charLimit = 2950;
  const trimmedNotice = "\n:warning: Message trimmed as too long for Slack";
  const color = '#FF0000';

  let title = options?.title ? options?.title : `Failed Test summary`;
  let prefix = options?.prefix ? options.prefix : null;
  let suffix = options?.suffix ? options.suffix : null;


  const enrichedMessage = message && message.length > charLimit
    ? message.substring(0, charLimit - trimmedNotice.length) + trimmedNotice
    : (message || "No message provided");

  const failSummaryText = `*Message:* ${enrichedMessage}`;

  const customBlocks: any[] = []

  customBlocks.push(
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: `*Test Name:* ${name}`
      }
    })

  customBlocks.push(
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: `${failSummaryText}`
      }
    })

  customBlocks.push(
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: `${buildInfo}`
      }
    })

  const blocks = blockBuilder([], {
    title: title,
    prefix: prefix,
    prefixBlock: prefix ? true : false,
    suffix: suffix,
    suffixBlock: suffix ? true : false,
    customBlocks: customBlocks,
    missingEnvProperties: missingEnvProperties,
    missingEnvPropertiesBlock: missingEnvProperties.length > 0 ? true : false
  });

  const notification: string[] = []
  notification.push(title)

  if (environment) {
    const { buildName, buildNumber } = environment;
    if (buildName && buildNumber) {
      notification.push(`${buildName} #${buildNumber}`)
    }
  }

  notification.push(name)

  return {
    attachments: [
      {
        fallback: notification.join('\n'),
        color: color,
        blocks: blocks
      }
    ]
  };
};

function handleBuildInfo(environment: CtrfEnvironment | undefined): { buildInfo: string, missingEnvProperties: string[] } {
  const missingEnvProperties: string[] = [];

  if (!environment) {
    return {
      buildInfo: "*Build:* No build information provided",
      missingEnvProperties: ['buildName', 'buildNumber', 'buildUrl']
    };
  }

  const { buildName, buildNumber, buildUrl } = environment;

  if (!buildName) missingEnvProperties.push('buildName');
  if (!buildNumber) missingEnvProperties.push('buildNumber');
  if (!buildUrl) missingEnvProperties.push('buildUrl');

  if (buildName && buildNumber) {
    const buildText = buildUrl
      ? `<${buildUrl}|${buildName} #${buildNumber}>`
      : `${buildName} #${buildNumber}`;

    return {
      buildInfo: `*Build:* ${buildText}`,
      missingEnvProperties
    };
  } else if (buildName || buildNumber) {
    return {
      buildInfo: `*Build:* ${buildName || ''} ${buildNumber || ''}`,
      missingEnvProperties
    };
  }

  return {
    buildInfo: "*Build:* No build information provided",
    missingEnvProperties
  };
}

interface BlockBuilderOptions {
  title: string;
  prefix?: string | null;
  suffix?: string | null;
  buildInfo: string;
  missingEnvProperties: string[];
  titleBlock?: boolean;
  prefixBlock?: boolean;
  suffixBlock?: boolean;
  missingEnvPropertiesBlock?: boolean;
  customBlocks?: any[];
}

function blockBuilder(blocks: any[], options: Partial<BlockBuilderOptions>): any[] {
  const defaultOptions: BlockBuilderOptions = {
    title: "Test Results",
    prefix: null,
    suffix: null,
    buildInfo: "",
    missingEnvProperties: [],
    titleBlock: true,
    prefixBlock: false,
    suffixBlock: false,
    missingEnvPropertiesBlock: true,
    customBlocks: []
  };

  const mergedOptions = { ...defaultOptions, ...options };

  if (mergedOptions.titleBlock) {
    blocks.push({
      type: "header",
      text: {
        type: "plain_text",
        text: mergedOptions.title,
        emoji: true
      }
    });
  }

  if (mergedOptions.prefixBlock && mergedOptions.prefix) {
    blocks.push({
      type: "section",
      text: {
        type: "mrkdwn",
        text: mergedOptions.prefix
      }
    });
  }

  const customBlocks = mergedOptions.customBlocks || [];
  if (customBlocks.length > 0) {
    blocks.push(...customBlocks);
  }

  if (mergedOptions.suffixBlock && mergedOptions.suffix) {
    blocks.push({
      type: "section",
      text: {
        type: "mrkdwn",
        text: mergedOptions.suffix
      }
    });
  }

  if (mergedOptions.missingEnvPropertiesBlock && mergedOptions.missingEnvProperties.length > 0) {
    blocks.push({
      type: "section",
      text: {
        type: "mrkdwn",
        text: `:warning: Missing environment properties: ${mergedOptions.missingEnvProperties.join(', ')}. Add these to your test for a better experience.`
      }
    });
  }

  blocks.push({
    type: "context",
    elements: [
      {
        type: "mrkdwn",
        text: "<https://github.com/ctrf-io/slack-ctrf|Slack Test Reporter> by <https://ctrf.io|CTRF  :green_heart:>"
      }
    ]
  });

  return blocks;
}