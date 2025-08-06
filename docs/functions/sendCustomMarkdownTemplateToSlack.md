[**CTRF v0.0.29-next.0**](../README.md)

***

[CTRF](../README.md) / sendCustomMarkdownTemplateToSlack

# Function: sendCustomMarkdownTemplateToSlack()

> **sendCustomMarkdownTemplateToSlack**(`report`, `templateContent`, `options`, `logs`): `Promise`\<`void`\>

Defined in: [slack-reporter.ts:229](https://github.com/ctrf-io/slack-ctrf/blob/main/src/slack-reporter.ts#L229)

Send a message to Slack using a custom Handlebars template

## Parameters

### report

[`CtrfReport`](../interfaces/CtrfReport.md)

The CTRF report

### templateContent

`string`

The Handlebars template content

### options

[`Options`](../interfaces/Options.md) = `{}`

The options for the message

### logs

`boolean` = `false`

Whether to log the message

## Returns

`Promise`\<`void`\>
