import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { validate } from "ctrf";
import { parseCtrfFile } from "../src/ctrf-parser";
import { formatResultsMessage } from "../src/message-formatter";

it("preserves CTRF 0.3.0 diagnostics, provenance and retry worker metadata", () => {
	const input = JSON.parse(
		fs.readFileSync(
			new URL("./fixtures/ctrf-0.3.0.json", import.meta.url),
			"utf8",
		),
	);
	expect(validate(input).valid).toBe(true);
	const directory = fs.mkdtempSync(path.join(os.tmpdir(), "ctrf-compat-"));
	try {
		const file = path.join(directory, "report.json");
		fs.writeFileSync(file, JSON.stringify(input));
		const parsed = parseCtrfFile(file);
		expect(parsed).toEqual(input);
		expect(JSON.stringify(formatResultsMessage(parsed))).toContain(
			"Test Results",
		);
		expect(parsed).toEqual(input);
	} finally {
		fs.rmSync(directory, { recursive: true, force: true });
	}
});

it("merges 0.3.0 reports with direct lineage and all run errors", () => {
	const one = JSON.parse(
		fs.readFileSync(
			new URL("./fixtures/ctrf-0.3.0.json", import.meta.url),
			"utf8",
		),
	);
	const two = structuredClone(one);
	two.reportId = "33333333-3333-4333-8333-333333333333";
	two.results.errors[0].message = "second teardown failed";
	const directory = fs.mkdtempSync(
		path.join(os.tmpdir(), "ctrf-merge-compat-"),
	);
	try {
		fs.writeFileSync(path.join(directory, "one.json"), JSON.stringify(one));
		fs.writeFileSync(path.join(directory, "two.json"), JSON.stringify(two));
		const merged = parseCtrfFile(path.join(directory, "*.json"));
		expect(merged.specVersion).toBe("0.3.0");
		expect(validate(merged).valid).toBe(true);
		expect(merged.results.summary.tests).toBe(2);
		expect(merged.results.errors).toEqual(
			expect.arrayContaining([...one.results.errors, ...two.results.errors]),
		);
		expect(
			merged.provenance?.inputs.map((input) => input.reportId).sort(),
		).toEqual([one.reportId, two.reportId].sort());
		expect(
			merged.results.tests.map((test) => test.retryAttempts?.[0]?.threadId),
		).toEqual(["worker-1", "worker-1"]);
	} finally {
		fs.rmSync(directory, { recursive: true, force: true });
	}
});
