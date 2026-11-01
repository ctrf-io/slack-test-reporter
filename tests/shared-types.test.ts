import { afterEach, describe, expect, it, vi } from "vitest";
import type { CTRFReport, Test, Environment } from "ctrf";
import {
	type CtrfReport,
	type CtrfTest,
	type CtrfEnvironment,
	type CtrfTestState,
	type Results,
	type Summary,
	type Tool,
	type Step,
	sendTestResultsToSlack,
	sendFailedResultsToSlack,
	sendFlakyResultsToSlack,
	sendAISummaryToSlack,
	sendCustomMarkdownTemplateToSlack,
	sendCustomBlockKitTemplateToSlack,
} from "slack-ctrf";

function currentReport(): CTRFReport {
	return {
		reportFormat: "CTRF",
		specVersion: "0.2.0",
		results: {
			tool: { name: "consumer" },
			summary: {
				tests: 2,
				passed: 1,
				failed: 1,
				skipped: 0,
				pending: 0,
				other: 0,
				start: 0,
				stop: 100,
			},
			environment: { buildName: "Build", buildNumber: 42 },
			tests: [
				{
					name: "failure",
					status: "failed",
					duration: 1,
					suite: ["parent", "child"],
					message: "failure message",
					ai: "AI explanation",
					labels: { owner: "team" },
					attachments: [
						{ name: "log", path: "failure.log", contentType: "text/plain" },
					],
					extra: { preserved: { nested: true } },
				},
				{ name: "flaky", status: "passed", duration: 1, flaky: true },
			],
		},
	};
}

function legacyReport(): CtrfReport {
	const current = currentReport();
	return {
		results: {
			...current.results,
			environment: { buildName: "Build", buildNumber: "legacy-42" },
			tests: current.results.tests.map((test) => ({
				...test,
				suite: "legacy suite",
				attempts: [{ name: "prior", status: "failed", duration: 1 }],
			})),
		},
	};
}

afterEach(() => vi.unstubAllGlobals());

describe("shared CTRF types at the built package boundary", () => {
	// test:compile checks these assignments against dist/index.d.ts, so a stale
	// package declaration cannot hide behind tests importing source types.
	it("keeps existing public type names and accepts shared nested types", () => {
		const report: CtrfReport = currentReport();
		const results: Results = report.results;
		const summary: Summary = results.summary;
		const tool: Tool = results.tool;
		const test: CtrfTest = {
			name: "typed test",
			status: "passed",
			duration: 1,
			suite: ["current"],
		} satisfies Test;
		const environment: CtrfEnvironment = {
			buildNumber: 42,
		} satisfies Environment;
		const state: CtrfTestState = test.status;
		const step: Step = { name: "step", status: state };
		expect(summary.tests).toBe(2);
		expect(tool.name).toBe("consumer");
		expect(environment.buildNumber).toBe(42);
		expect(step.status).toBe("passed");
	});

	for (const [kind, fixture] of [
		["current", currentReport],
		["legacy", legacyReport],
	] as const) {
		it.each([
			["results", sendTestResultsToSlack],
			["failed", sendFailedResultsToSlack],
			["flaky", sendFlakyResultsToSlack],
			["ai", sendAISummaryToSlack],
		] as const)(
			`sends ${kind} reports through %s without converting fields`,
			async (_action, send) => {
				const request = vi
					.fn<typeof fetch>()
					.mockResolvedValue(new Response("ok"));
				vi.stubGlobal("fetch", request);
				const report = fixture();
				const original = structuredClone(report);
				await send(report, { webhookUrl: "https://example.test/webhook" });
				expect(request).toHaveBeenCalledOnce();
				expect(report).toEqual(original);
				const body = String(request.mock.calls[0]?.[1]?.body);
				expect(body).toContain(
					kind === "current" ? "Build #42" : "Build #legacy-42",
				);
			},
		);

		it.each(["markdown", "blockkit"])(
			`renders ${kind} reports in custom %s templates`,
			async (format) => {
				const request = vi
					.fn<typeof fetch>()
					.mockImplementation(async () => new Response("ok"));
				vi.stubGlobal("fetch", request);
				const text = "Suite: {{ctrf.tests.0.suite}}";
				const report = fixture();
				const original = structuredClone(report);
				const options = { webhookUrl: "https://example.test/webhook" };
				if (format === "markdown") {
					await sendCustomMarkdownTemplateToSlack(report, text, options);
				} else {
					await sendCustomBlockKitTemplateToSlack(
						report,
						JSON.stringify({
							blocks: [{ type: "section", text: { type: "mrkdwn", text } }],
						}),
						options,
					);
				}
				expect(request).toHaveBeenCalledOnce();
				expect(String(request.mock.calls[0]?.[1]?.body)).toContain(
					kind === "current" ? "Suite: parent,child" : "Suite: legacy suite",
				);
				expect(report).toEqual(original);
			},
		);
	}
});
