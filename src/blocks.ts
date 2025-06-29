import {
  formatString,
  MESSAGES,
  EMOJIS,
  BLOCK_TYPES,
  TEXT_TYPES,
  LIMITS,
  NOTICES,
} from './constants'
import { type Summary, type CtrfTest } from './types/ctrf'

/**
 * Create blocks for test result summary
 * @param summary - The summary of the test results
 * @param buildInfo - The build information
 * @param flakyCount - The number of flaky tests
 * @returns The blocks for the test result summary
 */
export function createTestResultBlocks(
  summary: Summary,
  buildInfo: string,
  flakyCount: number = 0
): any[] {
  const { passed, failed, skipped, pending, other, tests } = summary
  const resultText =
    failed > 0
      ? formatString(MESSAGES.RESULT_FAILED, failed)
      : MESSAGES.RESULT_PASSED
  const durationInSeconds = (summary.stop - summary.start) / 1000
  const durationText =
    durationInSeconds < 1
      ? MESSAGES.DURATION_LESS_THAN_ONE
      : formatString(
          MESSAGES.DURATION_FORMAT,
          new Date(durationInSeconds * 1000).toISOString().substring(11, 19)
        )

  let testSummary = `${EMOJIS.TEST_TUBE} ${tests} | ${EMOJIS.CHECK_MARK} ${passed} | ${EMOJIS.X_MARK} ${failed}`

  if (skipped > 0) {
    testSummary += ` | ${EMOJIS.FAST_FORWARD} ${skipped}`
  }

  if (pending > 0) {
    testSummary += ` | ${EMOJIS.HOURGLASS} ${pending}`
  }

  if (other > 0) {
    testSummary += ` | ${EMOJIS.QUESTION} ${other}`
  }

  if (flakyCount > 0) {
    testSummary += ` | ${EMOJIS.FALLEN_LEAF} ${flakyCount}`
  }

  const block: any = {
    type: BLOCK_TYPES.SECTION,
    text: {
      type: TEXT_TYPES.MRKDWN,
      text: `${testSummary}\n${resultText} | ${durationText}\n${buildInfo}`,
    },
  }

  const skipChart = process.env.CTRF_SKIP_CHART === 'true'
  if (!skipChart) {
    block.accessory = {
      type: BLOCK_TYPES.IMAGE,
      image_url: createChartImage(summary),
      alt_text: 'Pie Chart',
    }
  }

  return [block]
}

export function createChartImage(summary: Summary): string {
  const { passed, failed, skipped, pending, other, tests } = summary
  const percentage = tests > 0 ? Math.round((passed / tests) * 100) : 0

  const values = [passed, failed, skipped, pending, other]
  const colors = ['#36c96d', '#e74c3c', '#d3d3d3', '#f1c40f', '#9b59b6']

  const filtered = values
    .map((v, i) => ({ value: v, color: colors[i] }))
    .filter(entry => entry.value > 0)

  const chartUrl = `https://quickchart.io/chart?w=150&h=150&c=${encodeURIComponent(
    JSON.stringify({
      type: 'doughnut',
      data: {
        datasets: [
          {
            data: filtered.map(e => e.value),
            backgroundColor: filtered.map(e => e.color),
            borderWidth: 0,
          },
        ],
      },
      options: {
        plugins: {
          datalabels: {
            display: true,
            color: '#000000',
            font: {
              family: 'lato',
              size: 12,
              weight: 'bold',
            },
          },
          legend: { display: false },
          tooltip: { enabled: false },
          doughnutlabel: {
            labels: [
              {
                text: `${percentage}%`,
                font: { size: 22, weight: 'bold', family: 'lato' },
              },
            ],
          },
        },
      },
    })
  )}`

  return chartUrl
}

/**
 * Create blocks for failed tests
 * @param failedTests - The failed tests
 * @param buildInfo - The build information
 * @returns The blocks for the failed tests
 */
export function createFailedTestBlocks(
  failedTests: CtrfTest[],
  buildInfo: string
): any[] {
  const blocks: any[] = [
    {
      type: BLOCK_TYPES.SECTION,
      text: {
        type: TEXT_TYPES.MRKDWN,
        text: buildInfo,
      },
    },
    {
      type: BLOCK_TYPES.SECTION,
      text: {
        type: TEXT_TYPES.MRKDWN,
        text: formatString(MESSAGES.TOTAL_FAILED_TESTS, failedTests.length),
      },
    },
    {
      type: BLOCK_TYPES.DIVIDER,
    },
  ]

  const limitedFailedTests = failedTests.slice(0, LIMITS.MAX_FAILED_TESTS)

  limitedFailedTests.forEach(test => {
    const failSummary =
      test.message !== undefined && test.message.length > LIMITS.CHAR_LIMIT
        ? test.message.substring(
            0,
            LIMITS.CHAR_LIMIT - NOTICES.TRIMMED_MESSAGE.length
          ) + NOTICES.TRIMMED_MESSAGE
        : (test.message ?? MESSAGES.NO_MESSAGE_PROVIDED)

    blocks.push({
      type: BLOCK_TYPES.HEADER,
      text: {
        type: TEXT_TYPES.PLAIN_TEXT,
        text: `${EMOJIS.X_MARK} ${test.name}`,
        emoji: true,
      },
    })

    blocks.push({
      type: BLOCK_TYPES.SECTION,
      text: {
        type: TEXT_TYPES.MRKDWN,
        text: `${failSummary.trim() !== '' ? '```' + failSummary + '```' : failSummary}`,
      },
    })
  })

  if (failedTests.length > LIMITS.MAX_FAILED_TESTS) {
    blocks.push({
      type: BLOCK_TYPES.SECTION,
      text: {
        type: TEXT_TYPES.MRKDWN,
        text: formatString(
          NOTICES.MAX_TESTS_EXCEEDED,
          LIMITS.MAX_FAILED_TESTS,
          failedTests.length - LIMITS.MAX_FAILED_TESTS
        ),
      },
    })
  }

  return blocks
}

/**
 * Create blocks for AI tests
 * @param failedTests - The failed tests
 * @param buildInfo - The build information
 * @returns The blocks for the AI tests
 */
export function createAiTestBlocks(
  failedTests: CtrfTest[],
  buildInfo: string
): any[] {
  const blocks: any[] = [
    {
      type: BLOCK_TYPES.SECTION,
      text: {
        type: TEXT_TYPES.MRKDWN,
        text: buildInfo,
      },
    },
    {
      type: BLOCK_TYPES.SECTION,
      text: {
        type: TEXT_TYPES.MRKDWN,
        text: `*Total Failed Tests:* ${failedTests.length}`,
      },
    },
    {
      type: BLOCK_TYPES.DIVIDER,
    },
  ]

  const limitedFailedTests = failedTests.slice(0, LIMITS.MAX_FAILED_TESTS)

  limitedFailedTests.forEach(test => {
    const aiSummary = `${test.ai}`

    blocks.push({
      type: BLOCK_TYPES.HEADER,
      text: {
        type: TEXT_TYPES.PLAIN_TEXT,
        text: `${EMOJIS.X_MARK} ${test.name}`,
        emoji: true,
      },
    })

    blocks.push({
      type: BLOCK_TYPES.SECTION,
      text: {
        type: TEXT_TYPES.MRKDWN,
        text: `${formatString(MESSAGES.AI_SUMMARY, aiSummary)}`,
      },
    })
  })

  if (failedTests.length > LIMITS.MAX_FAILED_TESTS) {
    blocks.push({
      type: BLOCK_TYPES.SECTION,
      text: {
        type: TEXT_TYPES.MRKDWN,
        text: formatString(
          NOTICES.MAX_TESTS_EXCEEDED,
          LIMITS.MAX_FAILED_TESTS,
          failedTests.length - LIMITS.MAX_FAILED_TESTS
        ),
      },
    })
  }

  return blocks
}

/**
 * Create blocks for a all messages
 * @param options - The options for the message
 * @returns The blocks for the message
 */
export function createMessageBlocks(options: {
  title: string
  prefix?: string | null
  suffix?: string | null
  missingEnvProperties: string[]
  customBlocks: any[]
}): any[] {
  const {
    title,
    prefix = null,
    suffix = null,
    missingEnvProperties,
    customBlocks = [],
  } = options

  const blocks: any[] = []

  if (title !== '' && title !== null) {
    blocks.push({
      type: BLOCK_TYPES.HEADER,
      text: {
        type: TEXT_TYPES.PLAIN_TEXT,
        text: title,
        emoji: true,
      },
    })
  }

  if (prefix !== '' && prefix !== null) {
    blocks.push({
      type: BLOCK_TYPES.SECTION,
      text: {
        type: TEXT_TYPES.MRKDWN,
        text: prefix,
      },
    })
  }

  if (customBlocks.length > 0) {
    blocks.push(...customBlocks)
  }

  if (suffix !== '' && suffix !== null) {
    blocks.push({
      type: BLOCK_TYPES.SECTION,
      text: {
        type: TEXT_TYPES.MRKDWN,
        text: suffix,
      },
    })
  }
  if (!(process.env.CTRF_SKIP_WARNINGS === 'true')) {
    if (missingEnvProperties.length > 0) {
      blocks.push({
        type: BLOCK_TYPES.SECTION,
        text: {
          type: TEXT_TYPES.MRKDWN,
          text: formatString(
            MESSAGES.MISSING_ENV_WARNING,
            missingEnvProperties.join(', ')
          ),
        },
      })
    }
  }

  if (!(process.env.CTRF_SKIP_FOOTER === 'true')) {
    blocks.push({
      type: BLOCK_TYPES.CONTEXT,
      elements: [
        {
          type: TEXT_TYPES.MRKDWN,
          text: MESSAGES.FOOTER_TEXT,
        },
      ],
    })
  }

  return blocks
}

/**
 * Create blocks for flaky tests
 * @param flakyTests - The flaky tests
 * @param buildInfo - The build information
 * @returns The blocks for the flaky tests
 */
export function createFlakyTestBlocks(
  flakyTests: CtrfTest[],
  buildInfo: string
): any[] {
  const flakyTestsText = flakyTests.map(test => `- ${test.name}`).join('\n')

  return [
    {
      type: BLOCK_TYPES.SECTION,
      text: {
        type: TEXT_TYPES.MRKDWN,
        text: `${MESSAGES.FLAKY_TESTS_DETECTED}\n${buildInfo}`,
      },
    },
    {
      type: BLOCK_TYPES.SECTION,
      text: {
        type: TEXT_TYPES.MRKDWN,
        text: `*Flaky Tests*\n${flakyTestsText}`,
      },
    },
  ]
}

/**
 * Create blocks for a single AI test
 * @param testName - The name of the test
 * @param aiSummary - The summary of the AI test
 * @returns The blocks for the single AI test
 */
export function createSingleAiTestBlocks(
  testName: string,
  aiSummary: string
): any[] {
  const formattedAiSummary = formatString(MESSAGES.AI_SUMMARY, aiSummary)

  return [
    {
      type: BLOCK_TYPES.SECTION,
      text: {
        type: TEXT_TYPES.MRKDWN,
        text: `${formatString(MESSAGES.TEST_NAME, testName)}\n${MESSAGES.STATUS_FAILED}`,
      },
    },
    {
      type: BLOCK_TYPES.SECTION,
      text: {
        type: TEXT_TYPES.MRKDWN,
        text: formattedAiSummary,
      },
    },
  ]
}

/**
 * Create blocks for a single failed test
 * @param testName - The name of the test
 * @param message - The message of the test
 * @param buildInfo - The build information
 * @returns The blocks for the single failed test
 */
export function createSingleFailedTestBlocks(
  testName: string,
  message: string | undefined,
  buildInfo: string
): any[] {
  const enrichedMessage =
    message !== undefined && message.length > LIMITS.CHAR_LIMIT
      ? message.substring(
          0,
          LIMITS.CHAR_LIMIT - NOTICES.TRIMMED_MESSAGE.length
        ) + NOTICES.TRIMMED_MESSAGE
      : (message ?? MESSAGES.NO_MESSAGE_PROVIDED)

  const failSummaryText = `*Message:*\n${enrichedMessage.trim() !== '' ? '```' + enrichedMessage + '```' : enrichedMessage}`

  return [
    {
      type: BLOCK_TYPES.SECTION,
      text: {
        type: TEXT_TYPES.MRKDWN,
        text: formatString(MESSAGES.TEST_NAME, testName),
      },
    },
    {
      type: BLOCK_TYPES.SECTION,
      text: {
        type: TEXT_TYPES.MRKDWN,
        text: failSummaryText,
      },
    },
    {
      type: BLOCK_TYPES.SECTION,
      text: {
        type: TEXT_TYPES.MRKDWN,
        text: buildInfo,
      },
    },
  ]
}
