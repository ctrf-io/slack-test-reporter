import { expect, describe, it } from 'vitest'
import {
  formatResultsMessage,
  formatGlobalAiSummary,
  formatConsolidatedAiTestSummary,
} from './message-formatter'
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

      const buildInfoText = result
        .attachments![0]!.blocks!.filter(
          (block: any) => block.type === 'section'
        )
        .map((block: any) => block.text?.text)
        .join(' ')

      expect(buildInfoText).toContain('ctrf')
      expect(buildInfoText).toContain('123')
      expect(buildInfoText).toContain('https://ctrf.io/')
    })
  })

  describe('formatGlobalAiSummary', () => {
    it('should return null if no global AI summary is present', () => {
      const result = formatGlobalAiSummary(mockCtrfReport as CtrfReport)
      expect(result).toBeNull()
    })

    it('should format global AI summary when present in results', () => {
      const reportWithAi = {
        ...mockCtrfReport,
        results: {
          ...mockCtrfReport.results,
          ai: 'Global AI Summary Text',
        },
      }
      const result = formatGlobalAiSummary(reportWithAi as CtrfReport)
      expect(result).toBeDefined()
      const text = result!
        .attachments![0]!.blocks!.map((b: any) => b.text?.text || '')
        .join(' ')
      expect(text).toContain('Executive Summary')
      expect(text).toContain('Global AI Summary Text')
    })

    it('should format structured JSON AI summary when present', () => {
      const structuredAi = {
        summary: 'Total suite failure overview',
        code_issues: 'Fix line 42',
        recommendations: 'Restart server',
      }
      const reportWithAi = {
        ...mockCtrfReport,
        results: {
          ...mockCtrfReport.results,
          ai: JSON.stringify(structuredAi),
        },
      }
      const result = formatGlobalAiSummary(reportWithAi as CtrfReport)
      expect(result).toBeDefined()
      const blocks = result!.attachments![0]!.blocks!

      const overallBlock = blocks.find((b: any) =>
        b.text?.text?.includes('📝 Overall Summary')
      )
      const codeBlock = blocks.find((b: any) =>
        b.text?.text?.includes('💻 Code Issues')
      )
      const recBlock = blocks.find((b: any) =>
        b.text?.text?.includes('💡 Recommendations')
      )

      expect(overallBlock).toBeDefined()
      expect(overallBlock!.text!.text).toContain('Total suite failure overview')
      expect(codeBlock).toBeDefined()
      expect(codeBlock!.text!.text).toContain('Fix line 42')
      expect(recBlock).toBeDefined()
      expect(recBlock!.text!.text).toContain('Restart server')
    })
  })

  describe('formatConsolidatedAiTestSummary', () => {
    it('should include global summary at the top if present', () => {
      const reportWithAi = {
        results: {
          ...mockCtrfReport.results,
          ai: 'Global Analysis',
          tests: [{ name: 'test1', status: 'failed', ai: 'Test 1 Analysis' }],
        },
      }
      const result = formatConsolidatedAiTestSummary(reportWithAi as any)
      expect(result).toBeDefined()
      const text = result!
        .attachments![0]!.blocks!.map((b: any) => b.text?.text || '')
        .join(' ')
      expect(text).toContain('Executive Summary')
      expect(text).toContain('Global Analysis')
      expect(text).toContain('Test 1 Analysis')
    })
  })
})
