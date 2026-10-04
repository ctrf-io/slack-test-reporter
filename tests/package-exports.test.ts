import { execFileSync } from "node:child_process";
import { describe, expect, it } from "vitest";
import {
	sendAISummaryToSlack,
	sendCustomBlockKitTemplateToSlack,
	sendCustomMarkdownTemplateToSlack,
	sendFailedResultsToSlack,
	sendFlakyResultsToSlack,
	sendTestResultsToSlack,
	type CtrfReport,
	type Options,
} from "slack-ctrf";

describe("package exports", () => {
	it("supports ESM imports of all public functions from the package root", () => {
		for (const send of [
			sendAISummaryToSlack,
			sendCustomBlockKitTemplateToSlack,
			sendCustomMarkdownTemplateToSlack,
			sendFailedResultsToSlack,
			sendFlakyResultsToSlack,
			sendTestResultsToSlack,
		]) {
			expect(typeof send).toBe("function");
		}
	});

	it("loads the built package in Node without a test runner", () => {
		const output = execFileSync(
			process.execPath,
			[
				"--input-type=module",
				"-e",
				'import { sendTestResultsToSlack } from "slack-ctrf"; console.log(typeof sendTestResultsToSlack)',
			],
			{ encoding: "utf8" },
		);
		expect(output.trim()).toBe("function");
	});

	it("starts the built CLI and displays help", () => {
		const output = execFileSync(process.execPath, ["dist/cli.js", "--help"], {
			encoding: "utf8",
		});
		expect(output).toContain("results");
		expect(output).toContain("custom");
	});

	it("accepts the public report and options types", async () => {
		const report: CtrfReport = {
			results: {
				tool: { name: "vitest" },
				summary: {
					tests: 1,
					passed: 1,
					failed: 0,
					skipped: 0,
					pending: 0,
					other: 0,
					start: 0,
					stop: 1,
				},
				tests: [{ name: "passing test", status: "passed", duration: 1 }],
			},
		};
		const options: Options = { onFailOnly: true };
		await expect(
			sendTestResultsToSlack(report, options),
		).resolves.toBeUndefined();
	});
});
