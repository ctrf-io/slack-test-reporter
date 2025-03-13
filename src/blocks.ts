import { formatString, MESSAGES, EMOJIS, BLOCK_TYPES, TEXT_TYPES, LIMITS, NOTICES } from "./constants";
import { CtrfTest, CtrfEnvironment } from "./types/ctrf";

export function createTestResultBlocks(summary: any, buildInfo: string): any[] {
    const { passed, failed, skipped, pending, other, tests } = summary;
    const resultText = failed > 0 ? formatString(MESSAGES.RESULT_FAILED, failed) : MESSAGES.RESULT_PASSED;
    const durationInSeconds = (summary.stop - summary.start) / 1000;
    const durationText = durationInSeconds < 1 
      ? MESSAGES.DURATION_LESS_THAN_ONE 
      : formatString(MESSAGES.DURATION_FORMAT, new Date(durationInSeconds * 1000).toISOString().substr(11, 8));
    const testSummary = `${EMOJIS.TEST_TUBE} ${tests} | ${EMOJIS.CHECK_MARK} ${passed} | ${EMOJIS.X_MARK} ${failed} | ${EMOJIS.FAST_FORWARD} ${skipped} | ${EMOJIS.HOURGLASS} ${pending} | ${EMOJIS.QUESTION} ${other}`;
  
    return [{
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
    }];
  }
  
  export function createFailedTestBlocks(failedTests: CtrfTest[], buildInfo: string): any[] {
    const blocks: any[] = [
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
      }
    ];
  
    const limitedFailedTests = failedTests.slice(0, LIMITS.MAX_FAILED_TESTS);
  
    limitedFailedTests.forEach(test => {
      const failSummary = test.message && test.message.length > LIMITS.CHAR_LIMIT
        ? test.message.substring(0, LIMITS.CHAR_LIMIT - NOTICES.TRIMMED_MESSAGE.length) + NOTICES.TRIMMED_MESSAGE
        : test.message || MESSAGES.NO_MESSAGE_PROVIDED;
  
      blocks.push({
        type: BLOCK_TYPES.HEADER,
        text: {
          type: TEXT_TYPES.PLAIN_TEXT,
          text: `${EMOJIS.X_MARK} ${test.name}`,
          emoji: true
        }
      });
  
      blocks.push({
        type: BLOCK_TYPES.SECTION,
        text: {
          type: TEXT_TYPES.MRKDWN,
          text: `${failSummary}`
        }
      });
    });
  
    if (failedTests.length > LIMITS.MAX_FAILED_TESTS) {
      blocks.push({
        type: BLOCK_TYPES.SECTION,
        text: {
          type: TEXT_TYPES.MRKDWN,
          text: formatString(NOTICES.MAX_TESTS_EXCEEDED, LIMITS.MAX_FAILED_TESTS, failedTests.length - LIMITS.MAX_FAILED_TESTS)
        }
      });
    }
  
    return blocks;
  }
  
  export function createAiTestBlocks(failedTests: CtrfTest[], buildInfo: string): any[] {
    const blocks: any[] = [
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
          text: `*Total Failed Tests:* ${failedTests.length}`
        }
      },
      {
        type: BLOCK_TYPES.DIVIDER
      }
    ];
  
    const limitedFailedTests = failedTests.slice(0, LIMITS.MAX_FAILED_TESTS);
  
    limitedFailedTests.forEach(test => {
      const aiSummary = `${test.ai}`;
  
      blocks.push({
        type: BLOCK_TYPES.HEADER,
        text: {
          type: TEXT_TYPES.PLAIN_TEXT,
          text: `${EMOJIS.X_MARK} ${test.name}`,
          emoji: true
        }
      });
  
      blocks.push({
        type: BLOCK_TYPES.SECTION,
        text: {
          type: TEXT_TYPES.MRKDWN,
          text: `${formatString(MESSAGES.AI_SUMMARY, aiSummary)}`
        }
      });
    });
  
    if (failedTests.length > LIMITS.MAX_FAILED_TESTS) {
      blocks.push({
        type: BLOCK_TYPES.SECTION,
        text: {
          type: TEXT_TYPES.MRKDWN,
          text: formatString(NOTICES.MAX_TESTS_EXCEEDED, LIMITS.MAX_FAILED_TESTS, failedTests.length - LIMITS.MAX_FAILED_TESTS)
        }
      });
    }
  
    return blocks;
  }
  
  export function createMessageBlocks(options: {
    title: string;
    prefix?: string | null;
    suffix?: string | null;
    buildInfo: string;
    missingEnvProperties: string[];
    customBlocks: any[];
  }): any[] {
    const { 
      title, 
      prefix = null, 
      suffix = null, 
      missingEnvProperties, 
      customBlocks = [] 
    } = options;
  
    const blocks: any[] = [];
  
    blocks.push({
      type: BLOCK_TYPES.HEADER,
      text: {
        type: TEXT_TYPES.PLAIN_TEXT,
        text: title,
        emoji: true
      }
    });
  
    if (prefix) {
      blocks.push({
        type: BLOCK_TYPES.SECTION,
        text: {
          type: TEXT_TYPES.MRKDWN,
          text: prefix
        }
      });
    }
  
    if (customBlocks.length > 0) {
      blocks.push(...customBlocks);
    }
  
    if (suffix) {
      blocks.push({
        type: BLOCK_TYPES.SECTION,
        text: {
          type: TEXT_TYPES.MRKDWN,
          text: suffix
        }
      });
    }
  
    if (missingEnvProperties.length > 0) {
      blocks.push({
        type: BLOCK_TYPES.SECTION,
        text: {
          type: TEXT_TYPES.MRKDWN,
          text: formatString(MESSAGES.MISSING_ENV_WARNING, missingEnvProperties.join(', '))
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
  
  export function createSlackMessage(blocks: any[], color: string, title: string, environment?: CtrfEnvironment, additionalInfo?: string): object {
    const notification: string[] = [];
    notification.push(title);
  
    if (environment) {
      const { buildName, buildNumber } = environment;
      if (buildName && buildNumber) {
        notification.push(`${buildName} #${buildNumber}`);
      }
    }
  
    if (additionalInfo) {
      notification.push(additionalInfo);
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
  }
  
  export function createFlakyTestBlocks(flakyTests: CtrfTest[], buildInfo: string): any[] {
    const flakyTestsText = flakyTests.map(test => `- ${test.name}`).join('\n');
    
    return [
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
      }
    ];
  }
  
  export function createSingleAiTestBlocks(testName: string, aiSummary: string, buildInfo: string): any[] {
    const formattedAiSummary = formatString(MESSAGES.AI_SUMMARY, aiSummary);
    
    return [
      {
        type: BLOCK_TYPES.SECTION,
        text: {
          type: TEXT_TYPES.MRKDWN,
          text: `${formatString(MESSAGES.TEST_NAME, testName)}\n${MESSAGES.STATUS_FAILED}`
        }
      },
      {
        type: BLOCK_TYPES.SECTION,
        text: {
          type: TEXT_TYPES.MRKDWN,
          text: formattedAiSummary
        }
      }
    ];
  }
  
  export function createSingleFailedTestBlocks(testName: string, message: string | undefined, buildInfo: string): any[] {
    const enrichedMessage = message && message.length > LIMITS.CHAR_LIMIT
      ? message.substring(0, LIMITS.CHAR_LIMIT - NOTICES.TRIMMED_MESSAGE.length) + NOTICES.TRIMMED_MESSAGE
      : (message || MESSAGES.NO_MESSAGE_PROVIDED);
  
    const failSummaryText = `*Message:* ${enrichedMessage}`;
    
    return [
      {
        type: BLOCK_TYPES.SECTION,
        text: {
          type: TEXT_TYPES.MRKDWN,
          text: formatString(MESSAGES.TEST_NAME, testName)
        }
      },
      {
        type: BLOCK_TYPES.SECTION,
        text: {
          type: TEXT_TYPES.MRKDWN,
          text: failSummaryText
        }
      },
      {
        type: BLOCK_TYPES.SECTION,
        text: {
          type: TEXT_TYPES.MRKDWN,
          text: buildInfo
        }
      }
    ];
  }