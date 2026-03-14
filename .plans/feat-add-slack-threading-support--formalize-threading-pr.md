# Slack Threading Support and Refactoring

**Branch:** feat/add-slack-threading-support
**Jira:** N/A (Internal PR)
**Status:** Awaiting approval

## Task Description

Refactor the Slack reporting logic to cleanly support threading, auto-threading for multi-message reports, customizable reactions, and message updates. The current implementation is functional but duplicated across multiple functions. This refactor will introduce a `SlackClient` abstraction to separate messaging concerns from reporting logic, significantly improving testability and maintainability.

## Agreed Approach

**Option B — Considered evolution**
- Introduce a `SlackClient` abstraction in `src/client/slack-client.ts` to handle Webhook vs. OAuth logic, message dispatching, updates, and reactions in a single place.
- Implement "Auto-Threading" as the default behavior for multi-message reports (`failed` and `ai`), with a `--no-auto-thread` flag to disable it.
- Support customizable emojis via `--failed-emoji` and `--passed-emoji`.
- Ensure all logic is unit-tested without network calls, following the "Developer Confidence" testing standard.

## Spec

### In scope
- **Auto-Threading**: Automatically thread individual failure details under a summary message when multiple failures occur.
- **Customizable Reactions**: Use `--react` to add emojis based on test results, with `--failed-emoji` and `--passed-emoji` for configuration.
- **Reply Broadcasting**: Add `--reply-broadcast` flag for threaded replies to be sent to the main channel.
- **Message Updates**: Support `--update-ts` to replace existing message content.
- **Environment Support**: Fallback to `SLACK_THREAD_TS` environment variable, with CLI flags taking precedence.
- **Refactoring**: Move Slack API logic into a `SlackClient` class/interface.

### Out of scope
- Integration tests hitting real Slack APIs.
- Searching for existing threads via Slack API.

### Acceptance Criteria
- [ ] Multiple failure reports are threaded under a single summary message by default.
- [ ] Auto-threading can be disabled via `--no-auto-thread`.
- [ ] Reactions (❌/✅) are correctly applied to the main message or summary header when `--react` is used.
- [ ] Emojis are configurable via CLI flags and default to `:x:` and `:white_check_mark:`.
- [ ] CLI flags for `thread-ts` override the `SLACK_THREAD_TS` environment variable.
- [ ] All new logic is verified with 100% unit test coverage using mocked clients.

## Technical Plan

### Implementation
- [ ] Task 1 — Define `SlackClient` interface and implementation in `src/client/slack-client.ts`.
- [ ] Task 2 — Update `Options` and `SlackMessage` interfaces in `src/types/reporter.d.ts` to include new fields.
- [ ] Task 3 — Update `src/client/index.ts` to export the new client.
- [ ] Task 4 — Refactor `src/slack-reporter.ts` to use the new `SlackClient` and implement auto-threading logic.
- [ ] Task 5 — Update `src/cli.ts` to add all new CLI options and pass them through `handleCommand`.
- [ ] Task 6 — Update `README.md` with documentation for the new features and environment variables.

### Tests
- [ ] Test for Task 1 — Verify `SlackClient` correctly branches between Webhook and OAuth and builds correct payloads.
- [ ] Test for Task 4 — Verify `sendFailedResultsToSlack` and `sendAISummaryToSlack` correctly handle auto-threading (summary first, then replies).
- [ ] Test for Task 4 — Verify `addStatusReaction` logic uses the correct emojis (default and custom).
- [ ] Test for Task 5 — Verify CLI correctly prioritizes flags over environment variables.

### Risks / Dependencies
- **Risk**: Breaking change if users were relying on the specific output format of the CLI when returning timestamps (already handled by JSON output).
- **Dependency**: Requires `esbuild` for bundling the final standalone file.

## Verification Strategy

- **Unit Tests**: Use `vitest` to run the new tests, ensuring no network calls are made.
- **Coverage**: Verify 100% logic coverage for the new threading and reaction functions.
- **E2E (Manual)**: Run the bundled `dist/slack-ctrf.bundle.js` against a mock CTRF report and observe the console logs (simulating Slack responses).
