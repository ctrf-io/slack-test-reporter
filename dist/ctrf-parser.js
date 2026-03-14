import { stripAnsiFromErrors } from './utils/common.js';
import { mergeReports, readReportsFromGlobPattern } from 'ctrf';
/**
 * Parse a CTRF file
 * @param pattern - The pattern to read the CTRF reports from
 * @returns The parsed CTRF report
 */
export function parseCtrfFile(pattern) {
    console.error(`Reading CTRF reports from ${pattern}`);
    const reports = readReportsFromGlobPattern(pattern);
    if (reports.length === 0) {
        throw new Error(`CTRF report not found at: ${pattern}`);
    }
    const report = reports.length > 1
        ? mergeReports(reports)
        : reports[0];
    const processedReport = stripAnsiFromErrors(report);
    console.error(`Read ${reports.length} CTRF reports`);
    return processedReport;
}
//# sourceMappingURL=ctrf-parser.js.map