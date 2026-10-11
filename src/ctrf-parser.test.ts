import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { CtrfReport } from "./types/ctrf.js";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { parseCtrfFile } from "./ctrf-parser.js";

describe("CTRF parsing with the upgraded reference implementation", () => {
	let directory: string;
	beforeEach(() => {
		directory = mkdtempSync(join(tmpdir(), "slack-ctrf-"));
	});
	afterEach(() => rmSync(directory, { recursive: true, force: true }));

	const writeReport = (file: string, name: string, shardId?: string) => {
		const report: CtrfReport = {
			...(shardId
				? { reportId: `report-${shardId}`, runId: "shared-run" }
				: {}),
			results: {
				tool: { name: "vitest" },
				...(shardId ? { environment: { shardId } } : {}),
				summary: {
					tests: 1,
					passed: 0,
					failed: 1,
					skipped: 0,
					pending: 0,
					other: 0,
					start: 0,
					stop: 1,
				},
				tests: [
					{
						name,
						status: "failed",
						duration: 1,
						message: "\u001b[31mFailure\u001b[0m",
						...(shardId
							? {
									testId: "logical",
									executionId: `execution-${shardId}`,
									attemptId: `final-${shardId}`,
									retryAttempts: [
										{
											attempt: 1,
											attemptId: `prior-${shardId}`,
											status: "failed" as const,
											duration: 1,
											attachments: [
												{
													name: "log",
													path: "prior.txt",
													contentType: "text/plain",
													attachmentId: `prior-ref-${shardId}`,
												},
											],
										},
									],
									attachments: [
										{
											name: "log",
											path: "final.txt",
											contentType: "text/plain",
											attachmentId: `final-ref-${shardId}`,
										},
									],
								}
							: {}),
					},
				],
			},
		};
		writeFileSync(file, JSON.stringify(report));
		return report;
	};

	it.each([undefined, "one"])(
		"parses a report and strips ANSI codes (shard %s)",
		(shardId) => {
			const path = join(directory, "report.json");
			const input = writeReport(path, "first", shardId);
			const report = parseCtrfFile(path);
			expect(report.results.summary.failed).toBe(1);
			expect(report.results.tests[0]?.message).toBe("Failure");
			expect(report).toEqual({
				...input,
				results: {
					...input.results,
					tests: [{ ...input.results.tests[0], message: "Failure" }],
				},
			});
		},
	);

	it("merges reports matched by a glob", () => {
		const first = writeReport(join(directory, "first.json"), "same", "one");
		const second = writeReport(join(directory, "second.json"), "same", "two");
		const report = parseCtrfFile(join(directory, "*.json"));
		expect(report.runId).toBe("shared-run");
		expect(report.reportId).not.toBe(first.reportId);
		expect(report.reportId).not.toBe(second.reportId);
		expect(report.results.environment?.shardId).toBeUndefined();
		expect(report.results.tests).toEqual(
			expect.arrayContaining(
				[first, second].map((source) => ({
					...source.results.tests[0],
					message: "Failure",
				})),
			),
		);
		expect(
			new Set(report.results.tests.map((test) => test.executionId)).size,
		).toBe(2);
		expect(report.results.summary.tests).toBe(2);
		expect(report.results.summary.failed).toBe(2);
		expect(report.results.tests.map((test) => test.name).sort()).toEqual([
			"same",
			"same",
		]);
	});
});
