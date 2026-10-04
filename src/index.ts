import {
	sendTestResultsToSlack,
	sendFailedResultsToSlack,
	sendFlakyResultsToSlack,
	sendAISummaryToSlack,
	sendCustomMarkdownTemplateToSlack,
	sendCustomBlockKitTemplateToSlack,
} from "./slack-reporter.js";

export {
	sendTestResultsToSlack,
	sendFailedResultsToSlack,
	sendFlakyResultsToSlack,
	sendAISummaryToSlack,
	sendCustomMarkdownTemplateToSlack,
	sendCustomBlockKitTemplateToSlack,
};

export type * from "./types/index.js";
