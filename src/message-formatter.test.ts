import { expect, describe, it } from 'vitest'
import { formatResultsMessage } from './message-formatter'
import { BLOCK_TYPES, TITLES } from './constants'
import { CtrfReport } from './types/ctrf'

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
      const result = formatResultsMessage(mockCtrfReport as CtrfReport)

      expect(result).toBeDefined()
      expect(result.attachments).toBeDefined()
      expect(result.attachments!.length).toBeGreaterThan(0)
      expect(result.attachments![0]!.blocks).toBeDefined()

      const titleBlock = result.attachments![0]!.blocks!.find(
        (block: any) =>
          block.type === BLOCK_TYPES.HEADER &&
          block.text?.text?.includes(TITLES.TEST_RESULTS)
      )
      expect(titleBlock).toBeDefined()
    })

    it('should format test results message with custom title', () => {
      const customTitle = 'Custom Test Results'

      const result = formatResultsMessage(mockCtrfReport as CtrfReport, {
        title: customTitle,
      })

      const titleBlock = result.attachments![0]!.blocks!.find(
        (block: any) =>
          block.type === 'header' && block.text?.text?.includes(customTitle)
      )
      expect(titleBlock).toBeDefined()
    })

    it('should include build information when environment is provided', () => {
      const result = formatResultsMessage(mockCtrfReport as CtrfReport)

      const buildInfoText = result.attachments![0]!.blocks!
        .filter((block: any) => block.type === 'section')
        .map((block: any) => block.text?.text)
        .join(' ')

      expect(buildInfoText).toContain('ctrf')
      expect(buildInfoText).toContain('123')
      expect(buildInfoText).toContain('https://ctrf.io/')
    })
  })
})
