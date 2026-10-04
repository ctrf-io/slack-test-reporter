import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { parseCtrfFile } from "./ctrf-parser.js";

describe("CTRF parsing with the upgraded reference implementation", () => {
	let directory: string;
	beforeEach(() => {
		directory = mkdtempSync(join(tmpdir(), "slack-ctrf-"));
	});
	afterEach(() => rmSync(directory, { recursive: true, force: true }));

	const writeReport = (path: string, name: string) =>
		writeFileSync(
			path,
			JSON.stringify({
				results: {
					tool: { name: "vitest" },
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
						},
					],
				},
			}),
		);

	it("parses a report and strips ANSI codes", () => {
		const path = join(directory, "report.json");
		writeReport(path, "first");
		const report = parseCtrfFile(path);
		expect(report.results.summary.failed).toBe(1);
		expect(report.results.tests[0]?.message).toBe("Failure");
	});

	it("merges reports matched by a glob", () => {
		writeReport(join(directory, "first.json"), "first");
		writeReport(join(directory, "second.json"), "second");
		const report = parseCtrfFile(join(directory, "*.json"));
		expect(report.results.summary.tests).toBe(2);
		expect(report.results.summary.failed).toBe(2);
		expect(report.results.tests.map((test) => test.name).sort()).toEqual([
			"first",
			"second",
		]);
	});
});
