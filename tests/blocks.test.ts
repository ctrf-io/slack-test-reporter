import {
  createTestResultBlocks,
  createFailedTestBlocks,
  createAiTestBlocks,
  createMessageBlocks,
  createFlakyTestBlocks,
  createSingleAiTestBlocks,
  createSingleFailedTestBlocks,
} from '../src/blocks'
import { BLOCK_TYPES, TEXT_TYPES, EMOJIS, MESSAGES } from '../src/constants'
import { CtrfTest } from '../src/types/ctrf'

describe('Blocks', () => {
  const mockBuildInfo =
    'Build: test-build | #123 | https://example.com/build/123'

  describe('createTestResultBlocks', () => {
    it('should create blocks for passed tests', () => {
      const mockSummary = {
        passed: 10,
        failed: 0,
        skipped: 2,
        pending: 1,
        other: 0,
        tests: 13,
        start: 1706644023000,
        stop: 1706644048000, // 25 seconds later
      }

      const blocks = createTestResultBlocks(mockSummary, mockBuildInfo)

      expect(blocks).toHaveLength(2)
      expect(blocks[0].type).toBe(BLOCK_TYPES.SECTION)
      expect(blocks[0].text.type).toBe(TEXT_TYPES.MRKDWN)
      expect(blocks[0].text.text).toContain(`${EMOJIS.TEST_TUBE} 13`)
      expect(blocks[0].text.text).toContain(`${EMOJIS.CHECK_MARK} 10`)
      expect(blocks[0].text.text).not.toContain(EMOJIS.FALLEN_LEAF)

      expect(blocks[1].type).toBe(BLOCK_TYPES.SECTION)
      expect(blocks[1].text.type).toBe(TEXT_TYPES.MRKDWN)
      expect(blocks[1].text.text).toContain(MESSAGES.RESULT_PASSED)
      expect(blocks[1].text.text).toContain(mockBuildInfo)
      expect(blocks[1].text.text).toContain('00:00:25') // Duration formatted
    })

    it('should create blocks for failed tests', () => {
      const mockSummary = {
        passed: 8,
        failed: 2,
        skipped: 1,
        pending: 0,
        other: 0,
        tests: 11,
        start: 1706644023000,
        stop: 1706644024000, // 1 second later
      }

      const blocks = createTestResultBlocks(mockSummary, mockBuildInfo)

      expect(blocks).toHaveLength(2)
      expect(blocks[0].text.text).toContain(`${EMOJIS.X_MARK} 2`)
      expect(blocks[1].text.text).toContain('*Result:* 2 failed tests')
      expect(blocks[1].text.text).toContain('00:00:01') // Duration formatted
    })

    it('should handle duration less than one second', () => {
      const mockSummary = {
        passed: 5,
        failed: 0,
        skipped: 0,
        pending: 0,
        other: 0,
        tests: 5,
        start: 1706644023000,
        stop: 1706644023500, // 0.5 seconds later
      }

      const blocks = createTestResultBlocks(mockSummary, mockBuildInfo)

      expect(blocks[1].text.text).toContain(MESSAGES.DURATION_LESS_THAN_ONE)
    })

    it('should include flaky tests count when provided', () => {
      const mockSummary = {
        passed: 8,
        failed: 2,
        skipped: 1,
        pending: 0,
        other: 0,
        tests: 11,
        start: 1706644023000,
        stop: 1706644024000,
      }

      const flakyCount = 3
      const blocks = createTestResultBlocks(
        mockSummary,
        mockBuildInfo,
        flakyCount
      )

      expect(blocks[0].text.text).toContain(
        `${EMOJIS.FALLEN_LEAF} ${flakyCount}`
      )
    })
  })

  describe('createFailedTestBlocks', () => {
    const mockFailedTests: CtrfTest[] = [
      {
        name: 'Test 1',
        status: 'failed',
        message: 'Expected true to be false',
        duration: 100,
      },
      {
        name: 'Test 2',
        status: 'failed',
        message: 'Cannot read property of undefined',
        duration: 200,
      },
    ]

    it('should create blocks for failed tests', () => {
      const blocks = createFailedTestBlocks(mockFailedTests, mockBuildInfo)

      expect(blocks.length).toBeGreaterThan(0)

      const totalFailedBlock = blocks.find(
        block =>
          block.type === BLOCK_TYPES.SECTION &&
          block.text?.text?.includes('Total Failed Tests')
      )
      expect(totalFailedBlock).toBeDefined()

      const blockTexts = blocks
        .filter(block => block.type === BLOCK_TYPES.SECTION)
        .map(block => block.text.text)
        .join('\n')

      expect(blockTexts).toContain(mockBuildInfo)

      const allBlockText = blocks
        .filter(block => block.text?.text)
        .map(block => block.text.text)
        .join('\n')

      expect(allBlockText).toContain('Test 1')
      expect(allBlockText).toContain('Expected true to be false')
      expect(allBlockText).toContain('Test 2')
      expect(allBlockText).toContain('Cannot read property of undefined')
    })

    it('should handle empty failed tests array', () => {
      const blocks = createFailedTestBlocks([], mockBuildInfo)

      expect(blocks.length).toBeGreaterThan(0)

      const totalFailedBlock = blocks.find(
        block =>
          block.type === BLOCK_TYPES.SECTION &&
          block.text?.text?.includes('*Total Failed Tests:* 0')
      )
      expect(totalFailedBlock).toBeDefined()

      const buildInfoBlock = blocks.find(
        block =>
          block.type === BLOCK_TYPES.SECTION &&
          block.text?.text?.includes(mockBuildInfo)
      )
      expect(buildInfoBlock).toBeDefined()
    })
  })

  describe('createMessageBlocks', () => {
    it('should create message blocks with title', () => {
      const options = {
        title: 'Test Results',
        missingEnvProperties: [],
        customBlocks: [],
      }

      const blocks = createMessageBlocks(options)

      expect(blocks.length).toBeGreaterThan(0)
      expect(blocks[0].type).toBe(BLOCK_TYPES.HEADER)
      expect(blocks[0].text.text).toContain('Test Results')
    })

    it('should include prefix and suffix when provided', () => {
      const options = {
        title: 'Test Results',
        prefix: 'Prefix message',
        suffix: 'Suffix message',
        missingEnvProperties: [],
        customBlocks: [],
      }

      const blocks = createMessageBlocks(options)

      const blockTexts = blocks
        .filter(block => block.type === BLOCK_TYPES.SECTION)
        .map(block => block.text.text)
        .join('\n')

      expect(blockTexts).toContain('Prefix message')
      expect(blockTexts).toContain('Suffix message')
    })

    it('should include missing environment properties warning', () => {
      const options = {
        title: 'Test Results',
        missingEnvProperties: ['BUILD_NAME', 'BUILD_URL'],
        customBlocks: [],
      }

      const blocks = createMessageBlocks(options)

      const blockTexts = blocks
        .filter(block => block.type === BLOCK_TYPES.SECTION)
        .map(block => block.text.text)
        .join('\n')

      expect(blockTexts).toContain('Missing environment properties')
      expect(blockTexts).toContain('BUILD_NAME')
      expect(blockTexts).toContain('BUILD_URL')
    })

    it('should include custom blocks', () => {
      const customBlock = {
        type: BLOCK_TYPES.SECTION,
        text: {
          type: TEXT_TYPES.MRKDWN,
          text: 'Custom block content',
        },
      }

      const options = {
        title: 'Test Results',
        missingEnvProperties: [],
        customBlocks: [customBlock],
      }

      const blocks = createMessageBlocks(options)

      const foundCustomBlock = blocks.find(
        block =>
          block.type === BLOCK_TYPES.SECTION &&
          block.text?.text === 'Custom block content'
      )

      expect(foundCustomBlock).toBeDefined()
    })
  })

  describe('createSingleFailedTestBlocks', () => {
    it('should create blocks for a single failed test', () => {
      const testName = 'Failed Test Name'
      const errorMessage = 'Test error message'

      const blocks = createSingleFailedTestBlocks(
        testName,
        errorMessage,
        mockBuildInfo
      )

      expect(blocks.length).toBeGreaterThan(0)

      const blockTexts = blocks
        .filter(block => block.type === BLOCK_TYPES.SECTION)
        .map(block => block.text.text)
        .join('\n')

      expect(blockTexts).toContain(testName)
      expect(blockTexts).toContain(errorMessage)
      expect(blockTexts).toContain(mockBuildInfo)
    })

    it('should handle undefined error message', () => {
      const testName = 'Failed Test Name'

      const blocks = createSingleFailedTestBlocks(
        testName,
        undefined,
        mockBuildInfo
      )

      expect(blocks.length).toBeGreaterThan(0)

      const blockTexts = blocks
        .filter(block => block.type === BLOCK_TYPES.SECTION)
        .map(block => block.text.text)
        .join('\n')

      expect(blockTexts).toContain(testName)
      expect(blockTexts).toContain(mockBuildInfo)
    })
  })

  describe('createAiTestBlocks', () => {
    it('should create blocks for AI test analysis', () => {
      const mockFailedTests: CtrfTest[] = [
        {
          name: 'Test 1',
          status: 'failed',
          message: 'Expected true to be false',
          duration: 100,
        },
      ]

      const blocks = createAiTestBlocks(mockFailedTests, mockBuildInfo)
      expect(blocks.length).toBeGreaterThan(0)
    })
  })

  describe('createFlakyTestBlocks', () => {
    it('should create blocks for flaky tests', () => {
      const mockFlakyTests: CtrfTest[] = [
        {
          name: 'Flaky Test 1',
          status: 'failed',
          message: 'Sometimes fails',
          duration: 100,
        },
      ]

      const blocks = createFlakyTestBlocks(mockFlakyTests, mockBuildInfo)
      expect(blocks.length).toBeGreaterThan(0)
    })
  })

  describe('createSingleAiTestBlocks', () => {
    it('should create blocks for single AI test analysis', () => {
      const testName = 'Test Name'
      const aiSummary = 'AI analysis of the test failure'

      const blocks = createSingleAiTestBlocks(testName, aiSummary)
      expect(blocks.length).toBeGreaterThan(0)

      const blockTexts = blocks
        .filter(block => block.type === BLOCK_TYPES.SECTION)
        .map(block => block.text.text)
        .join('\n')

      expect(blockTexts).toContain(testName)
      expect(blockTexts).toContain(aiSummary)
    })
  })
})
