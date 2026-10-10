import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { parseCtrfFile } from "./ctrf-parser.js";
const identityReport = () => ({
	reportFormat: "CTRF",
	specVersion: "0.2.0",
	reportId: "11111111-1111-4111-8111-111111111111",
	runId: "run",
	results: {
		tool: { name: "fixture" },
		environment: { shardId: "one" },
		summary: {
			tests: 1,
			passed: 1,
			failed: 0,
			skipped: 0,
			pending: 0,
			other: 0,
			start: 1,
			stop: 2,
		},
		tests: [
			{
				name: "same",
				testId: "logical",
				executionId: "execution",
				attemptId: "final-attempt",
				status: "passed",
				duration: 1,
				retries: 1,
				flaky: true,
				retryAttempts: [
					{
						attempt: 1,
						attemptId: "attempt",
						status: "failed",
						attachments: [
							{
								name: "log",
								path: "prior.txt",
								contentType: "text/plain",
								attachmentId: "prior-ref",
							},
						],
					},
				],
				attachments: [
					{
						name: "log",
						path: "final.txt",
						contentType: "text/plain",
						attachmentId: "final-ref",
					},
				],
			},
		],
	},
});

describe("identity preservation", () => {
	it("preserves every identity layer without changing existing display names", () => {
		const directory = fs.mkdtempSync(path.join(os.tmpdir(), "ctrf-preserve-"));
		try {
			const input = identityReport();
			const filename = path.join(directory, "report.json");
			fs.writeFileSync(filename, JSON.stringify(input));
			const output = parseCtrfFile(filename);
			expect(output).toEqual(input);
		} finally {
			fs.rmSync(directory, { recursive: true, force: true });
		}
	});
});
it("merges coordinated runs without mislabelling a multi-shard document", () => {
	const directory = fs.mkdtempSync(path.join(os.tmpdir(), "ctrf-shards-"));
	try {
		const one = identityReport();
		const two = identityReport();
		two.results.environment.shardId = "two";
		const other = two.results.tests[0];
		if (!other) throw new Error("Missing fixture test");
		other.executionId = "another-execution";
		fs.writeFileSync(path.join(directory, "one.json"), JSON.stringify(one));
		fs.writeFileSync(path.join(directory, "two.json"), JSON.stringify(two));
		const output = parseCtrfFile(path.join(directory, "*.json"));
		expect(output.runId).toBe("run");
		expect(output.reportId).not.toBe(one.reportId);
		expect(output.results.environment?.shardId).toBeUndefined();
		expect(
			new Set(output.results.tests.map((test) => test.executionId)).size,
		).toBe(2);
	} finally {
		fs.rmSync(directory, { recursive: true, force: true });
	}
});
