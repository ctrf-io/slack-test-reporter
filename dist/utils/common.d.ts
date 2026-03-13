import { type CtrfReport } from '../types/ctrf';
/**
 * Create a regex for ANSI escape codes
 * @param onlyFirst - Whether to match only the first occurrence
 * @returns A regex for ANSI escape codes
 */
export declare function ansiRegex({ onlyFirst, }?: {
    onlyFirst?: boolean;
}): RegExp;
/**
 * Strip ANSI escape codes from a message
 * @param message - The message to strip ANSI escape codes from
 * @returns The message with ANSI escape codes stripped
 */
export declare function stripAnsi(message: string): string;
/**
 * Strip ANSI escape codes from errors in a report
 * @param report - The report to strip ANSI escape codes from
 * @returns The report with ANSI escape codes stripped from errors
 */
export declare function stripAnsiFromErrors(report: CtrfReport | null): CtrfReport;
//# sourceMappingURL=common.d.ts.map