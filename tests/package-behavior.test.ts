import { readFileSync } from "node:fs";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
	type CtrfReport,
	sendCustomBlockKitTemplateToSlack,
	sendCustomMarkdownTemplateToSlack,
	sendTestResultsToSlack,
} from "slack-ctrf";

const report = (): CtrfReport =>
	JSON.parse(readFileSync("ctrf-report.json", "utf8"));

afterEach(() => vi.unstubAllGlobals());

describe("built package with upgraded dependencies", () => {
	it.each(["markdown", "blockkit"])(
		"preserves missing and numeric durations in custom %s templates",
		async (format) => {
			const fetch = vi.fn().mockImplementation(async () => new Response("ok"));
			vi.stubGlobal("fetch", fetch);
			const text =
				"Duration: {{formatDurationMs ctrf.summary.duration}}; test: {{formatDurationMs ctrf.tests.0.duration}}";
			const template =
				format === "markdown"
					? text
					: JSON.stringify({
							blocks: [{ type: "section", text: { type: "mrkdwn", text } }],
						});
			const send =
				format === "markdown"
					? sendCustomMarkdownTemplateToSlack
					: sendCustomBlockKitTemplateToSlack;
			await send(report(), template, {
				webhookUrl: "https://example.test/webhook",
			});
			expect(fetch).toHaveBeenCalledOnce();
			const [, init] = fetch.mock.calls[0] ?? [];
			expect(init.body).toContain("Duration: not captured; test: 1.2s");
		},
	);

	it("sends results through the webhook client", async () => {
		const fetch = vi.fn().mockImplementation(async () => new Response("ok"));
		vi.stubGlobal("fetch", fetch);
		await sendTestResultsToSlack(report(), {
			webhookUrl: "https://example.test/webhook",
		});
		expect(fetch).toHaveBeenCalledOnce();
		const [url, init] = fetch.mock.calls[0] ?? [];
		expect(url).toBe("https://example.test/webhook");
		expect(JSON.parse(init.body).attachments[0].blocks.length).toBeGreaterThan(
			0,
		);
	});

	it("sends results through the OAuth client", async () => {
		const fetch = vi.fn().mockResolvedValue(
			new Response(JSON.stringify({ ok: true }), {
				headers: { "content-type": "application/json" },
			}),
		);
		vi.stubGlobal("fetch", fetch);
		await sendTestResultsToSlack(report(), {
			oauthToken: "test-token",
			channelId: "C123",
		});
		expect(fetch).toHaveBeenCalledOnce();
		const [url, init] = fetch.mock.calls[0] ?? [];
		expect(String(url)).toContain("chat.postMessage");
		const payload = new URLSearchParams(init.body);
		expect(payload.get("channel")).toBe("C123");
		expect(
			JSON.parse(payload.get("attachments") ?? "[]")[0].blocks.length,
		).toBeGreaterThan(0);
	});

	it("renders Handlebars templates from the built ESM package", async () => {
		const fetch = vi.fn().mockImplementation(async () => new Response("ok"));
		vi.stubGlobal("fetch", fetch);
		const options = { webhookUrl: "https://example.test/webhook" };
		await sendCustomMarkdownTemplateToSlack(
			report(),
			"Passed: {{ctrf.summary.passed}}",
			options,
		);
		await sendCustomBlockKitTemplateToSlack(
			report(),
			'{"blocks":[{"type":"section","text":{"type":"mrkdwn","text":"Passed: {{ctrf.summary.passed}}"}}]}',
			options,
		);
		expect(fetch).toHaveBeenCalledTimes(2);
		for (const [, init] of fetch.mock.calls) {
			expect(init.body).toContain(`Passed: ${report().results.summary.passed}`);
			expect(init.body).not.toContain("{{");
		}
	});
});
