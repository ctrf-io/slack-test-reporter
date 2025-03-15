import { type CtrfReport } from '../types/ctrf'

/**
 * Create a regex for ANSI escape codes
 * @param onlyFirst - Whether to match only the first occurrence
 * @returns A regex for ANSI escape codes
 */
export function ansiRegex({
  onlyFirst = false,
}: { onlyFirst?: boolean } = {}): RegExp {
  const pattern = [
    '[\\u001B\\u009B][[\\]()#;?]*(?:(?:(?:(?:;[-a-zA-Z\\d\\/#&.:=?%@~_]+)*|[a-zA-Z\\d]+(?:;[-a-zA-Z\\d\\/#&.:=?%@~_]*)*)?\\u0007)',
    '(?:(?:\\d{1,4}(?:;\\d{0,4})*)?[\\dA-PR-TZcf-ntqry=><~]))',
  ].join('|')

  return new RegExp(pattern, onlyFirst ? undefined : 'g')
}

/**
 * Strip ANSI escape codes from a message
 * @param message - The message to strip ANSI escape codes from
 * @returns The message with ANSI escape codes stripped
 */
export function stripAnsi(message: string): string {
  if (typeof message !== 'string') {
    throw new TypeError(`Expected a \`string\`, got \`${typeof message}\``)
  }

  let sanitizedMessage = message.replace(ansiRegex(), '')

  // eslint-disable-next-line no-control-regex
  sanitizedMessage = sanitizedMessage.replace(/[^\x00-\x7F]/g, '')

  return sanitizedMessage
}

/**
 * Strip ANSI escape codes from errors in a report
 * @param report - The report to strip ANSI escape codes from
 * @returns The report with ANSI escape codes stripped from errors
 */
export function stripAnsiFromErrors(report: CtrfReport | null): any {
  if (report?.results?.tests === undefined) {
    return report
  }

  report.results.tests.forEach((test) => {
    if (test.message !== undefined) {
      test.message = stripAnsi(test.message)
    }
    if (test.trace !== undefined) {
      test.trace = stripAnsi(test.trace)
    }
  })

  return report
}
