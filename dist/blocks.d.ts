import { type Summary, type CtrfTest } from './types/ctrf.js';
import { type SlackBlock } from './types/reporter.js';
/**
 * Create blocks for test result summary
 * @param summary - The summary of the test results
 * @param buildInfo - The build information
 * @param flakyCount - The number of flaky tests
 * @returns The blocks for the test result summary
 */
export declare function createTestResultBlocks(summary: Summary, buildInfo: string, flakyCount?: number): SlackBlock[];
export declare function createChartImage(summary: Summary): string;
/**
 * Create blocks for failed tests
 * @param failedTests - The failed tests
 * @param buildInfo - The build information
 * @returns The blocks for the failed tests
 */
export declare function createFailedTestBlocks(failedTests: CtrfTest[], buildInfo: string): SlackBlock[];
/**
 * Create blocks for AI tests
 * @param failedTests - The failed tests
 * @param buildInfo - The build information
 * @returns The blocks for the AI tests
 */
export declare function createAiTestBlocks(failedTests: CtrfTest[], buildInfo: string): SlackBlock[];
/**
 * Create blocks for a all messages
 * @param options - The options for the message
 * @returns The blocks for the message
 */
export declare function createMessageBlocks(options: {
    title: string;
    prefix?: string | null;
    suffix?: string | null;
    missingEnvProperties: string[];
    customBlocks: SlackBlock[];
}): SlackBlock[];
/**
 * Create blocks for flaky tests
 * @param flakyTests - The flaky tests
 * @param buildInfo - The build information
 * @returns The blocks for the flaky tests
 */
export declare function createFlakyTestBlocks(flakyTests: CtrfTest[], buildInfo: string): SlackBlock[];
/**
 * Create blocks for a single AI test
 * @param testName - The name of the test
 * @param aiSummary - The summary of the AI test
 * @returns The blocks for the single AI test
 */
export declare function createSingleAiTestBlocks(testName: string, aiSummary: string): SlackBlock[];
/**
 * Create blocks for a single failed test
 * @param testName - The name of the test
 * @param message - The message of the test
 * @param buildInfo - The build information
 * @returns The blocks for the single failed test
 */
export declare function createSingleFailedTestBlocks(testName: string, message: string | undefined, buildInfo: string): SlackBlock[];
//# sourceMappingURL=blocks.d.ts.map