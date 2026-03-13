import { type CtrfEnvironment, type CtrfReport, type CtrfTest } from './types/ctrf.js';
import { type Options } from './types/reporter.js';
/**
 * Format the results message
 * @param ctrf - The CTRF report
 * @param options - The options for the message
 * @returns The formatted message
 */
export declare const formatResultsMessage: (ctrf: CtrfReport, options?: Options) => object;
/**
 * Format the flaky tests message
 * @param ctrf - The CTRF report
 * @param options - The options for the message
 * @returns The formatted message
 */
export declare const formatFlakyTestsMessage: (ctrf: CtrfReport, options?: Options) => object | null;
/**
 * Format the AI test summary message
 * @param test - The test
 * @param environment - The environment
 * @param options - The options for the message
 * @returns The formatted message
 */
export declare const formatAiTestSummary: (test: CtrfTest, environment: CtrfEnvironment | undefined, options?: Options) => object | null;
/**
 * Format the consolidated AI test summary message
 * @param tests - The tests
 * @param environment - The environment
 * @param options - The options for the message
 * @returns The formatted message
 */
export declare const formatConsolidatedAiTestSummary: (tests: CtrfTest[], environment: CtrfEnvironment | undefined, options?: Options) => object | null;
export declare const formatConsolidatedFailedTestSummary: (tests: CtrfTest[], environment: CtrfEnvironment | undefined, options?: Options) => object | null;
export declare const formatFailedTestSummary: (test: CtrfTest, environment: CtrfEnvironment | undefined, options?: Options) => object | null;
export declare const formatCustomMarkdownMessage: (report: CtrfReport, templateContent: string, environment: CtrfEnvironment | undefined, options?: Options) => object | null;
export declare const formatCustomBlockKitMessage: (report: CtrfReport, blockKit: any) => object | null;
export declare function createSlackMessage(blocks: unknown[], color: string, title: string, environment?: CtrfEnvironment, additionalInfo?: string): object;
//# sourceMappingURL=message-formatter.d.ts.map