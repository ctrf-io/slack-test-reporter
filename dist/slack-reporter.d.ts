import { type Options } from './types/reporter.js';
import { type CtrfReport } from './types/ctrf.js';
/**
 * Send the test results to Slack
 * @param report - The CTRF report
 * @param options - The options for the message
 * @param logs - Whether to log the message
 * @returns The message timestamp if returnTs is true and using OAuth, otherwise void
 */
export declare function sendTestResultsToSlack(report: CtrfReport, options?: Options, logs?: boolean): Promise<string | void>;
/**
 * Send the failed test results to Slack
 * @param report - The CTRF report
 * @param options - The options for the message
 * @param logs - Whether to log the message
 * @returns The message timestamp if returnTs is true and using OAuth, otherwise void
 */
export declare function sendFailedResultsToSlack(report: CtrfReport, options?: Options, logs?: boolean): Promise<string | void>;
/**
 * Send the flaky test results to Slack
 * @param report - The CTRF report
 * @param options - The options for the message
 * @param logs - Whether to log the message
 * @returns The message timestamp if returnTs is true and using OAuth, otherwise void
 */
export declare function sendFlakyResultsToSlack(report: CtrfReport, options?: Options, logs?: boolean): Promise<string | void>;
/**
 * Send the AI test summary to Slack
 * @param report - The CTRF report
 * @param options - The options for the message
 * @param logs - Whether to log the message
 * @returns The message timestamp if returnTs is true and using OAuth, otherwise void
 */
export declare function sendAISummaryToSlack(report: CtrfReport, options?: Options, logs?: boolean): Promise<string | void>;
/**
 * Send a message to Slack using a custom Handlebars template
 * @param report - The CTRF report
 * @param templateContent - The Handlebars template content
 * @param options - The options for the message
 * @param logs - Whether to log the message
 * @returns The message timestamp if returnTs is true and using OAuth, otherwise void
 */
export declare function sendCustomMarkdownTemplateToSlack(report: CtrfReport, templateContent: string, options?: Options, logs?: boolean): Promise<string | void>;
/**
 * Send a custom Block Kit JSON template to Slack
 * @param report - The CTRF report
 * @param blockKitJson - The Block Kit JSON template content
 * @param options - The options for the message
 * @param logs - Whether to log the message
 * @returns The message timestamp if returnTs is true and using OAuth, otherwise void
 */
export declare function sendCustomBlockKitTemplateToSlack(report: CtrfReport, templateContent: string, options?: Options, logs?: boolean): Promise<string | void>;
//# sourceMappingURL=slack-reporter.d.ts.map