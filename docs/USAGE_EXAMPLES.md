# Usage Examples

This document provides comprehensive examples of how to use slack-ctrf in various scenarios, including CLI usage, GitHub Actions integration, and programmatic usage.

## CLI Usage Examples

### Basic Test Results Notification

```bash
# Send test results summary to Slack
npx slack-ctrf results "ctrf/*.json"

# With custom title
npx slack-ctrf results "ctrf/*.json" --title "My Test Results"

# With prefix and suffix
npx slack-ctrf results "ctrf/*.json" --prefix "🚀 Build #123" --suffix "View details at: https://example.com"
```

### Failed Tests Only

```bash
# Send only failed test results
npx slack-ctrf failed "ctrf/*.json"

# Consolidated failed tests report
npx slack-ctrf failed "ctrf/*.json" --consolidated

# Only send if there are failures
npx slack-ctrf failed "ctrf/*.json" --on-fail-only
```

### Flaky Tests Detection

```bash
# Send flaky test results
npx slack-ctrf flaky "ctrf/*.json"

# With custom title
npx slack-ctrf flaky "ctrf/*.json" --title "Flaky Tests Report"
```

### AI-Powered Test Analysis

```bash
# Send AI analysis of test results
npx slack-ctrf ai "ctrf/*.json"

# Consolidated AI analysis
npx slack-ctrf ai "ctrf/*.json" --consolidated

# With custom AI prompt
npx slack-ctrf ai "ctrf/*.json" --ai-prompt "Analyze these test results and provide insights"
```

### Custom Templates

```bash
# Use custom Markdown template
npx slack-ctrf custom "ctrf/*.json" "templates/markdown-template.hbs" --markdown

# Use custom Block Kit template
npx slack-ctrf custom "ctrf/*.json" "templates/blockkit-template.hbs" --blockkit
```

### Authentication Options

#### Using Webhook URL

```bash
# Set webhook URL as environment variable
export SLACK_WEBHOOK_URL='https://hooks.slack.com/services/your/webhook/url'
npx slack-ctrf results "ctrf/*.json"

# Or pass as parameter
npx slack-ctrf results "ctrf/*.json" --webhook-url "https://hooks.slack.com/services/your/webhook/url"
```

#### Using OAuth Token

```bash
# Set OAuth token and channel ID as environment variables
export SLACK_OAUTH_TOKEN='xoxb-your-bot-token'
export SLACK_CHANNEL_ID='C0123456789'
npx slack-ctrf results "ctrf/*.json"

# Or pass as parameters
npx slack-ctrf results "ctrf/*.json" --oauth-token "xoxb-your-bot-token" --channel-id "C0123456789"
```

## GitHub Actions Integration

### Basic Setup

```yaml
name: Test and Notify Slack

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

env:
  SLACK_WEBHOOK_URL: ${{ secrets.SLACK_WEBHOOK_URL }}

jobs:
  test-and-notify:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run tests
        run: npm test

      - name: Send test results to Slack
        run: npx slack-ctrf results "ctrf/*.json"
        if: always()
```

### Advanced Workflow with Multiple Notifications

```yaml
name: Comprehensive Test Reporting

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

env:
  SLACK_WEBHOOK_URL: ${{ secrets.SLACK_WEBHOOK_URL }}

jobs:
  test-and-report:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Build project
        run: npm run build

      - name: Run tests
        run: npm test

      # Send comprehensive test summary
      - name: Send test results summary
        run: npx slack-ctrf results "ctrf/*.json" --title "Test Results - ${{ github.ref_name }}"
        if: always()

      # Send failed tests if any
      - name: Send failed tests report
        run: npx slack-ctrf failed "ctrf/*.json" --title "Failed Tests - ${{ github.ref_name }}" --on-fail-only
        if: always()

      # Send flaky tests detection
      - name: Send flaky tests report
        run: npx slack-ctrf flaky "ctrf/*.json" --title "Flaky Tests Detection"
        if: always()

      # AI analysis for failed tests
      - name: AI analysis of failures
        run: npx slack-ctrf ai "ctrf/*.json" --consolidated --title "AI Test Analysis"
        if: failure()
```

### Using OAuth Token in GitHub Actions

```yaml
name: Test with OAuth Token

on:
  push:
    branches: [main]

env:
  SLACK_OAUTH_TOKEN: ${{ secrets.SLACK_OAUTH_TOKEN }}
  SLACK_CHANNEL_ID: ${{ secrets.SLACK_CHANNEL_ID }}

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'

      - name: Install and test
        run: |
          npm ci
          npm test

      - name: Send results to specific channel
        run: npx slack-ctrf results "ctrf/*.json" --title "Production Tests"
        if: always()
```

## Programmatic Usage

### Basic Integration

```javascript
import { sendTestResultsToSlack } from 'slack-ctrf'
import { parseCtrfFile } from 'slack-ctrf'

// Parse CTRF report
const report = parseCtrfFile('path/to/ctrf-report.json')

// Send to Slack using webhook
await sendTestResultsToSlack(report, {
  title: 'My Test Results',
  webhookUrl: process.env.SLACK_WEBHOOK_URL,
})

// Send to Slack using OAuth token
await sendTestResultsToSlack(report, {
  title: 'My Test Results',
  oauthToken: process.env.SLACK_OAUTH_TOKEN,
  channelId: process.env.SLACK_CHANNEL_ID,
})
```

### Failed Tests Notification

```javascript
import { sendFailedResultsToSlack, parseCtrfFile } from 'slack-ctrf'

const report = parseCtrfFile('path/to/ctrf-report.json')

// Send only if there are failures
if (report.results.failed > 0) {
  await sendFailedResultsToSlack(report, {
    title: 'Test Failures Detected',
    prefix: '🚨 Alert:',
    webhookUrl: process.env.SLACK_WEBHOOK_URL,
    onFailOnly: true,
  })
}
```

### Flaky Tests Detection

```javascript
import { sendFlakyResultsToSlack, parseCtrfFile } from 'slack-ctrf'

const report = parseCtrfFile('path/to/ctrf-report.json')

await sendFlakyResultsToSlack(report, {
  title: 'Flaky Tests Report',
  webhookUrl: process.env.SLACK_WEBHOOK_URL,
})
```

### AI-Powered Analysis

```javascript
import { sendAISummaryToSlack, parseCtrfFile } from 'slack-ctrf'

const report = parseCtrfFile('path/to/ctrf-report.json')

await sendAISummaryToSlack(report, {
  title: 'AI Test Analysis',
  aiPrompt: 'Analyze these test results and provide actionable insights',
  consolidated: true,
  webhookUrl: process.env.SLACK_WEBHOOK_URL,
})
```

### Custom Templates

```javascript
import {
  sendCustomMarkdownTemplateToSlack,
  sendCustomBlockKitTemplateToSlack,
} from 'slack-ctrf'
import fs from 'fs'

const report = parseCtrfFile('path/to/ctrf-report.json')

// Custom Markdown template
const markdownTemplate = fs.readFileSync(
  'templates/custom-markdown.hbs',
  'utf8'
)
await sendCustomMarkdownTemplateToSlack(report, markdownTemplate, {
  title: 'Custom Report',
  webhookUrl: process.env.SLACK_WEBHOOK_URL,
})

// Custom Block Kit template
const blockKitTemplate = fs.readFileSync(
  'templates/custom-blockkit.hbs',
  'utf8'
)
await sendCustomBlockKitTemplateToSlack(report, blockKitTemplate, {
  title: 'Custom Block Kit Report',
  webhookUrl: process.env.SLACK_WEBHOOK_URL,
})
```

## Environment Variables

### Required Environment Variables

```bash
# For Webhook authentication
export SLACK_WEBHOOK_URL='https://hooks.slack.com/services/T00000000/B00000000/XXXXXXXXXXXXXXXXXXXXXXXX'

# For OAuth Token authentication
export SLACK_OAUTH_TOKEN='xoxb-xxxx'
export SLACK_CHANNEL_ID='C0000000000'
```
