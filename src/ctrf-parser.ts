import { type CtrfReport } from './types/ctrf.js'
import { stripAnsiFromErrors } from './utils/common.js'
import { merge, parse, type CTRFReport } from 'ctrf'
import { globSync } from 'glob'
import fs from 'fs'

/**
 * Parse a CTRF file
 * @param pattern - The pattern to read the CTRF reports from
 * @returns The parsed CTRF report
 */
export function parseCtrfFile(pattern: string): CtrfReport {
  console.log(`Reading CTRF reports from ${pattern}`)
  const files = globSync(pattern)

  if (files.length === 0) {
    throw new Error(`CTRF report not found at: ${pattern}`)
  }

  const reports: CTRFReport[] = files
    .map(file => {
      try {
        const content = fs.readFileSync(file, 'utf8')
        return parse(content)
      } catch (error) {
        console.warn(`Failed to read or parse file '${file}':`, error)
        return null
      }
    })
    .filter((report): report is CTRFReport => report !== null)

  if (reports.length === 0) {
    throw new Error(`No valid CTRF reports found matching: ${pattern}`)
  }

  const merged: CtrfReport =
    reports.length > 1
      ? (merge(reports) as CtrfReport)
      : (reports[0] as CtrfReport)
  const processedReport = stripAnsiFromErrors(merged)
  console.log(`Read ${reports.length} CTRF reports`)
  return processedReport
}
