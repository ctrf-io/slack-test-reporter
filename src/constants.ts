export const COLORS = {
  PASSED: '#36a64f',
  FAILED: '#FF0000',
  FLAKY: '#FFA500',
  AI: '#800080',
}

export const EMOJIS = {
  TEST_TUBE: ':test_tube:',
  CHECK_MARK: ':white_check_mark:',
  X_MARK: ':x:',
  FAST_FORWARD: ':fast_forward:',
  HOURGLASS: ':hourglass_flowing_sand:',
  QUESTION: ':question:',
  SPARKLES: ':sparkles:',
  WARNING: ':warning:',
  INFO: ':information_source:',
  FALLEN_LEAF: ':fallen_leaf:',
  GREEN_HEART: ':green_heart:',
}

export const TITLES = {
  TEST_RESULTS: 'Test Results',
  FLAKY_TESTS: 'Flaky Tests',
  AI_TEST_SUMMARY: 'AI Test summary',
  AI_TEST_REPORTER: `${EMOJIS.SPARKLES} AI Test Reporter`,
  FAILED_TEST_REPORT: `${EMOJIS.X_MARK} Failed Test Report`,
  FAILED_TEST_SUMMARY: 'Failed Test summary',
}

export const MESSAGES = {
  RESULT_PASSED: '*Result:* Passed',
  RESULT_FAILED: '*Result:* {0} failed tests',
  DURATION_LESS_THAN_ONE: '*Duration:* <1s',
  DURATION_FORMAT: '*Duration:* {0}',
  STATUS_FAILED: '*Status:* Failed',
  NO_MESSAGE_PROVIDED: 'No message provided',
  NO_BUILD_INFO: '*Build:* No build information provided',
  FLAKY_TESTS_DETECTED: `${EMOJIS.FALLEN_LEAF} *Flaky tests detected*`,
  AI_SUMMARY: `*${EMOJIS.SPARKLES} AI Summary:* {0}`,
  TEST_NAME: '*Test Name:* {0}',
  TOTAL_FAILED_TESTS: '*Total Failed Tests:* {0}',
  MESSAGE_PREFIX: '*Message:* ',
  BUILD_PREFIX: '*Build:* ',
  MISSING_ENV_WARNING: `${EMOJIS.WARNING} Missing environment properties: {0}. Add these to your CTRF report for a better experience.`,
  FOOTER_TEXT: `<https://github.com/ctrf-io/slack-ctrf|Slack Test Reporter> by <https://ctrf.io|CTRF ${EMOJIS.GREEN_HEART}>`,
}

export const LIMITS = {
  MAX_FAILED_TESTS: 20,
  CHAR_LIMIT: 2950,
}

export const NOTICES = {
  TRIMMED_MESSAGE: `\n${EMOJIS.WARNING} Message trimmed as too long for Slack`,
  MAX_TESTS_EXCEEDED: `${EMOJIS.INFO} Only the first {0} failed tests are displayed. {1} additional failed tests were not included.`,
}

export const TEST_STATUS = {
  PASSED: 'passed',
  FAILED: 'failed',
}

export const BLOCK_TYPES = {
  SECTION: 'section',
  IMAGE: 'image',
  HEADER: 'header',
  CONTEXT: 'context',
  DIVIDER: 'divider',
}

export const TEXT_TYPES = {
  MRKDWN: 'mrkdwn',
  PLAIN_TEXT: 'plain_text',
}

export function formatString(template: string, ...args: any[]): string {
  return template.replace(/{(\d+)}/g, (match, index) => {
    return typeof args[index] !== 'undefined' ? args[index] : match
  })
}
