# Slack Notification and Publish Test Results

> Send test result notifications from popular testing frameworks to Slack.

⭐ **If you find this project useful, consider giving it a GitHub star** ⭐

It means a lot to us and helps us grow this open source library.

## Features

- **Send Test Results to Slack**: Automatically send test results to a Slack channel.
- **Conditional Notifications**: Use the `--onFailOnly` option to send notifications only if tests fail.

## Usage

You'll need a CTRF report generated by your testing framework. [CTRF reporters](https://www.ctrf.io/docs/category/reporters) are available for most testing frameworks and easy to install.

### Send Test Results to Slack

To send the test results summary to Slack:

```sh
npx slack-ctrf results /path/to/ctrf-report.json
```

### Send Only on Failures

To send the test results summary to Slack only if there are failed tests, use the `--onFailOnly` option:

```sh
npx slack-ctrf results /path/to/ctrf-file.json --onFailOnly
```

or using the alias:

```sh
npx slack-ctrf results /path/to/ctrf-file.json -f
```

## Options

- `--onFailOnly, -f`: Send notification only if there are failed tests.

## What is CTRF?

CTRF is a universal JSON test report schema that addresses the lack of a standardized format for JSON test reports.

**Consistency Across Tools:** Different testing tools and frameworks often produce reports in varied formats. CTRF ensures a uniform structure, making it easier to understand and compare reports, regardless of the testing tool used.

**Language and Framework Agnostic:** It provides a universal reporting schema that works seamlessly with any programming language and testing framework.

**Facilitates Better Analysis:** With a standardized format, programatically analyzing test outcomes across multiple platforms becomes more straightforward.

## Support Us

If you find this project useful, consider giving it a GitHub star ⭐ It means a lot to us.
