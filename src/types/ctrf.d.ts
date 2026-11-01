import type {
	CTRFReport,
	Results as SharedResults,
	Test,
	Environment,
} from "ctrf";

export type { Summary, Tool, Step, TestStatus as CtrfTestState } from "ctrf";

// Derive Slack's public input types from CTRF, keeping only the differences
// needed by existing callers. Rendering does not convert these legacy fields.
export interface CtrfReport
	extends Omit<CTRFReport, "reportFormat" | "specVersion" | "results"> {
	reportFormat?: string;
	specVersion?: string;
	results: Results;
}

export interface Results extends Omit<SharedResults, "tests" | "environment"> {
	tests: CtrfTest[];
	environment?: CtrfEnvironment;
}

export interface CtrfTest extends Omit<Test, "suite"> {
	suite?: Test["suite"] | string;
	/** Legacy nested attempts; current CTRF uses retryAttempts. */
	attempts?: CtrfTest[];
}

export interface CtrfEnvironment extends Omit<Environment, "buildNumber"> {
	buildNumber?: Environment["buildNumber"] | string;
}
