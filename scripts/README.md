# E2E Test Script

This directory contains the End-to-End (E2E) test script for `slack-ctrf`.

## Purpose

The E2E test script (`e2e-test.js`) validates all major functionality of the slack-ctrf package by sending actual messages to a real Slack workspace. It tests:

- All CLI commands (`results`, `failed`, `flaky`, `ai`, `custom`)
- Various options and configurations
- Different template formats (Block Kit and Markdown)
- Error handling and edge cases

## Prerequisites

Before running the E2E tests, ensure you have:

1. **Slack Configuration**: Set up either:
   - **Webhook URL**: `export SLACK_WEBHOOK_URL='https://hooks.slack.com/services/your/webhook/url'`
   - **OAuth Token**: Both `export SLACK_OAUTH_TOKEN='xoxb-your-token'` and `export SLACK_CHANNEL_ID='C0123456789'`

2. **CTRF Report**: A valid CTRF report file at `ctrf-report.json` in the project root

3. **Built Project**: The project should be built (`npm run build`)

## Usage

Run the comprehensive E2E test suite:

```bash
npm run e2e
```

## What It Tests

The script performs the following tests:

1. **Basic Results** - Standard test results summary
2. **Results with Prefix/Suffix** - Custom text additions
3. **OnFailOnly Option** - Conditional notifications
4. **Failed Tests** - Failed test reporting
5. **Failed Tests (Consolidated)** - Single message for all failures
6. **Flaky Tests** - Flaky test detection and reporting
7. **AI Summaries** - AI-generated test summaries
8. **AI Summaries (Consolidated)** - Single message for all AI summaries
9. **Custom Markdown Template** - Custom Handlebars markdown templates
10. **Custom Block Kit Template** - Custom Handlebars Block Kit templates
11. **Environment Variables** - Configuration options via env vars

## Safety Features

- **Environment Validation**: Checks for required Slack credentials before starting
- **File Validation**: Verifies CTRF report and template files exist
- **Rate Limiting**: Adds delays between requests to avoid Slack rate limits
- **Error Handling**: Gracefully handles expected failures (e.g., no failed tests to report)
- **Colored Output**: Clear visual feedback during execution

## Expected Behavior

- Tests that depend on specific test states (failed, flaky, AI summaries) may not send messages if the CTRF report doesn't contain relevant data
- The script will continue even if some tests fail, allowing you to see which functionality works
- All successful tests will send actual messages to your configured Slack workspace

## Monitoring Results

After running the E2E tests, check your Slack channel to verify:
- Messages were received correctly
- Formatting appears as expected
- All tested features are working properly

This provides comprehensive validation that your slack-ctrf installation and configuration are working correctly in a real-world scenario. 