import { formatResultsMessage } from '../src/message-formatter'
import { BLOCK_TYPES, TITLES } from '../src/constants'

const mockCtrfReport = {
  results: {
    summary: {
      passed: 5,
      failed: 2,
      skipped: 1,
      pending: 1,
      other: 1,
      tests: 10,
      start: 1706644023000,
      stop: 1706644048000,
    },
    environment: {
      buildName: 'ctrf',
      buildNumber: '123',
      buildUrl: 'https://ctrf.io/',
    },
  },
}

describe('Message Formatter', () => {
  describe('formatResultsMessage', () => {
    it('should format test results message with default options', () => {
      const result = formatResultsMessage(mockCtrfReport as any)

      expect(result).toBeDefined()
      // @ts-expect-error - accessing properties for testing
      expect(result.attachments).toBeDefined()
      // @ts-expect-error - accessing properties for testing
      expect(result.attachments.length).toBeGreaterThan(0)
      // @ts-expect-error - accessing properties for testing
      expect(result.attachments[0].blocks).toBeDefined()

      // @ts-expect-error - accessing properties for testing
      const titleBlock = result.attachments[0].blocks.find(
        (block: any) =>
          block.type === BLOCK_TYPES.HEADER &&
          block.text?.text?.includes(TITLES.TEST_RESULTS)
      )
      expect(titleBlock).toBeDefined()
    })

    it('should format test results message with custom title', () => {
      const customTitle = 'Custom Test Results'

      const result = formatResultsMessage(mockCtrfReport as any, {
        title: customTitle,
      })

      // @ts-expect-error - accessing properties for testing
      const titleBlock = result.attachments[0].blocks.find(
        (block: any) =>
          block.type === 'header' && block.text?.text?.includes(customTitle)
      )
      expect(titleBlock).toBeDefined()
    })

    it('should include build information when environment is provided', () => {
      const result = formatResultsMessage(mockCtrfReport as any)

      // @ts-expect-error - accessing properties for testing
      const buildInfoText = result.attachments[0].blocks
        .filter((block: any) => block.type === 'section')
        .map((block: any) => block.text?.text)
        .join(' ')

      expect(buildInfoText).toContain('ctrf')
      expect(buildInfoText).toContain('123')
      expect(buildInfoText).toContain('https://ctrf.io/')
    })
  })
})
