[**CTRF v0.0.29-next.0**](../README.md)

***

[CTRF](../README.md) / sendFlakyResultsToSlack

# Function: sendFlakyResultsToSlack()

> **sendFlakyResultsToSlack**(`report`, `options`, `logs`): `Promise`\<`void`\>

Defined in: [slack-reporter.ts:133](https://github.com/ctrf-io/slack-ctrf/blob/main/src/slack-reporter.ts#L133)

Send the flaky test results to Slack

## Parameters

### report

[`CtrfReport`](../interfaces/CtrfReport.md)

The CTRF report

### options

[`Options`](../interfaces/Options.md) = `{}`

The options for the message

### logs

`boolean` = `false`

Whether to log the message

## Returns

`Promise`\<`void`\>
