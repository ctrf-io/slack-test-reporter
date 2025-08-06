import { type CtrfReport } from './types/ctrf.js'
import { stripAnsiFromErrors } from './utils/common.js'
import { mergeReports, readReportsFromGlobPattern, type Report } from 'ctrf'

/**
 * Parse a CTRF file
 * @param pattern - The pattern to read the CTRF reports from
 * @returns The parsed CTRF report
 */
export function parseCtrfFile(pattern: string): CtrfReport {
  console.log(`Reading CTRF reports from ${pattern}`)
  const reports: CtrfReport[] = readReportsFromGlobPattern(
    pattern
  ) as CtrfReport[]

  if (reports.length === 0) {
    throw new Error(`CTRF report not found at: ${pattern}`)
  }

  const report: CtrfReport =
    reports.length > 1
      ? (mergeReports(reports as Report[]) as CtrfReport)
      : reports[0]!
  const processedReport = stripAnsiFromErrors(report)
  console.log(`Read ${reports.length} CTRF reports`)
  return processedReport
}
