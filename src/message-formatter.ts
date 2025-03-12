import { CtrfEnvironment, CtrfReport, CtrfTest } from './types/ctrf';
import { Options } from './types/reporter';
import { BLOCK_TYPES, COLORS, EMOJIS, LIMITS, MESSAGES, NOTICES, TEST_STATUS, TEXT_TYPES, TITLES, formatString } from './constants';

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
  }, {
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
  const { title = TITLES.AI_TEST_SUMMARY, prefix = null, suffix = null } = options || {};
  const { buildInfo, missingEnvProperties } = handleBuildInfo(environment);
  const aiSummaryText = formatString(MESSAGES.AI_SUMMARY, ai);

  if (!ai || status === TEST_STATUS.PASSED) { return null }

  const customBlocks = [
    {
      type: BLOCK_TYPES.SECTION,
      text: {
        type: TEXT_TYPES.MRKDWN,
        text: `${formatString(MESSAGES.TEST_NAME, name)}\n${MESSAGES.STATUS_FAILED}`
      }
    },
    {
      type: BLOCK_TYPES.SECTION,
      text: {
        type: TEXT_TYPES.MRKDWN,
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
  const failedTests = tests.filter(test => test.ai && test.status === TEST_STATUS.FAILED);
  const { title = TITLES.AI_TEST_REPORTER, prefix = null, suffix = null } = options || {};
  const { buildInfo, missingEnvProperties } = handleBuildInfo(environment);

  if (failedTests.length === 0) {
    return null;
  }

  const customBlocks: any[] = [{
    type: BLOCK_TYPES.SECTION,
    text: {
      type: TEXT_TYPES.MRKDWN,
      text: buildInfo
    }
  }, {
    type: BLOCK_TYPES.SECTION,
    text: {
      type: TEXT_TYPES.MRKDWN,
      text: `*Total Failed Tests:* ${failedTests.length}`
    }
  }, {
    type: BLOCK_TYPES.DIVIDER
  }];

  const limitedFailedTests = failedTests.slice(0, LIMITS.MAX_FAILED_TESTS);

  limitedFailedTests.forEach(test => {
    const aiSummary = `${test.ai}`;

    customBlocks.push({
      type: BLOCK_TYPES.HEADER,
      text: {
        type: TEXT_TYPES.PLAIN_TEXT,
        text: `${EMOJIS.X_MARK} ${test.name}`,
        emoji: true
      }
    });

    customBlocks.push({
      type: BLOCK_TYPES.SECTION,
      text: {
        type: TEXT_TYPES.MRKDWN,
        text: `${formatString(MESSAGES.AI_SUMMARY, aiSummary)}`
      }
    });
  });

  if (failedTests.length > LIMITS.MAX_FAILED_TESTS) {
    customBlocks.push({
      type: BLOCK_TYPES.SECTION,
      text: {
        type: TEXT_TYPES.MRKDWN,
        text: formatString(NOTICES.MAX_TESTS_EXCEEDED, LIMITS.MAX_FAILED_TESTS, failedTests.length - LIMITS.MAX_FAILED_TESTS)
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
        color: COLORS.AI,
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
  const failedTests = tests.filter(test => test.status === TEST_STATUS.FAILED);
  const { title = options?.title ? options.title : TITLES.FAILED_TEST_REPORT, prefix = null, suffix = null } = options || {};
  const { buildInfo, missingEnvProperties } = handleBuildInfo(environment);

  if (failedTests.length === 0) {
    return null;
  }

  const customBlocks: any[] = [
    {
      type: BLOCK_TYPES.SECTION,
      text: {
        type: TEXT_TYPES.MRKDWN,
        text: buildInfo
      }
    },
    {
      type: BLOCK_TYPES.SECTION,
      text: {
        type: TEXT_TYPES.MRKDWN,
        text: formatString(MESSAGES.TOTAL_FAILED_TESTS, failedTests.length)
      }
    },
    {
      type: BLOCK_TYPES.DIVIDER
    }]

  const limitedFailedTests = failedTests.slice(0, LIMITS.MAX_FAILED_TESTS);

  limitedFailedTests.forEach(test => {
    const failSummary = test.message && test.message.length > LIMITS.CHAR_LIMIT
      ? test.message.substring(0, LIMITS.CHAR_LIMIT - NOTICES.TRIMMED_MESSAGE.length) + NOTICES.TRIMMED_MESSAGE
      : test.message || MESSAGES.NO_MESSAGE_PROVIDED;

    customBlocks.push({
      type: BLOCK_TYPES.HEADER,
      text: {
        type: TEXT_TYPES.PLAIN_TEXT,
        text: `${EMOJIS.X_MARK} ${test.name}`,
        emoji: true
      }
    });

    customBlocks.push({
      type: BLOCK_TYPES.SECTION,
      text: {
        type: TEXT_TYPES.MRKDWN,
        text: `${failSummary}`
      }
    });
  });

  if (failedTests.length > LIMITS.MAX_FAILED_TESTS) {
    customBlocks.push({
      type: BLOCK_TYPES.SECTION,
      text: {
        type: TEXT_TYPES.MRKDWN,
        text: formatString(NOTICES.MAX_TESTS_EXCEEDED, LIMITS.MAX_FAILED_TESTS, failedTests.length - LIMITS.MAX_FAILED_TESTS)
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
        color: COLORS.FAILED,
        blocks: blocks
      }
    ]
  };
};

export const formatFailedTestSummary = (test: CtrfTest, environment: CtrfEnvironment | undefined, options?: Options): object | null => {
  const { name, message, status } = test;
  const { buildInfo, missingEnvProperties } = handleBuildInfo(environment);
  const { title = TITLES.FAILED_TEST_SUMMARY, prefix = null, suffix = null } = options || {};

  if (status !== TEST_STATUS.FAILED) {
    return null;
  }

  const enrichedMessage = message && message.length > LIMITS.CHAR_LIMIT
    ? message.substring(0, LIMITS.CHAR_LIMIT - NOTICES.TRIMMED_MESSAGE.length) + NOTICES.TRIMMED_MESSAGE
    : (message || MESSAGES.NO_MESSAGE_PROVIDED);

  const failSummaryText = `*Message:* ${enrichedMessage}`;

  const customBlocks: any[] = [
    {
      type: BLOCK_TYPES.SECTION,
      text: {
        type: TEXT_TYPES.MRKDWN,
        text: `${formatString(MESSAGES.TEST_NAME, name)}`
      }
    },
    {
      type: BLOCK_TYPES.SECTION,
      text: {
        type: TEXT_TYPES.MRKDWN,
        text: `${failSummaryText}`
      }
    },
    {
      type: BLOCK_TYPES.SECTION,
      text: {
        type: TEXT_TYPES.MRKDWN,
        text: `${buildInfo}`
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
        color: COLORS.FAILED,
        blocks: blocks
      }
    ]
  };
};

function handleBuildInfo(environment: CtrfEnvironment | undefined): { buildInfo: string, missingEnvProperties: string[] } {
  const missingEnvProperties: string[] = [];

  if (!environment) {
    return {
      buildInfo: MESSAGES.NO_BUILD_INFO,
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
      buildInfo: `${MESSAGES.BUILD_PREFIX}${buildText}`,
      missingEnvProperties
    };
  } else if (buildName || buildNumber) {
    return {
      buildInfo: `${MESSAGES.BUILD_PREFIX} ${buildName || ''} ${buildNumber || ''}`,
      missingEnvProperties
    };
  }

  return {
    buildInfo: MESSAGES.NO_BUILD_INFO,
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
      type: BLOCK_TYPES.HEADER,
      text: {
        type: TEXT_TYPES.PLAIN_TEXT,
        text: mergedOptions.title,
        emoji: true
      }
    });
  }

  if (mergedOptions.prefixBlock && mergedOptions.prefix) {
    blocks.push({
      type: BLOCK_TYPES.SECTION,
      text: {
        type: TEXT_TYPES.MRKDWN,
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
      type: BLOCK_TYPES.SECTION,
      text: {
        type: TEXT_TYPES.MRKDWN,
        text: mergedOptions.suffix
      }
    });
  }

  if (mergedOptions.missingEnvPropertiesBlock && mergedOptions.missingEnvProperties.length > 0) {
    blocks.push({
      type: BLOCK_TYPES.SECTION,
      text: {
        type: TEXT_TYPES.MRKDWN,
        text: formatString(MESSAGES.MISSING_ENV_WARNING, mergedOptions.missingEnvProperties.join(', '))
      }
    });
  }

  blocks.push({
    type: BLOCK_TYPES.CONTEXT,
    elements: [
      {
        type: TEXT_TYPES.MRKDWN,
        text: MESSAGES.FOOTER_TEXT
      }
    ]
  });

  return blocks;
}