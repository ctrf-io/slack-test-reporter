import fs from 'fs'
import { CtrfReport, CtrfTest } from '../../types/ctrf'

export function ansiRegex({ onlyFirst = false } = {}) {
    const pattern = [
        '[\\u001B\\u009B][[\\]()#;?]*(?:(?:(?:(?:;[-a-zA-Z\\d\\/#&.:=?%@~_]+)*|[a-zA-Z\\d]+(?:;[-a-zA-Z\\d\\/#&.:=?%@~_]*)*)?\\u0007)',
        '(?:(?:\\d{1,4}(?:;\\d{0,4})*)?[\\dA-PR-TZcf-ntqry=><~]))',
    ].join('|')

    return new RegExp(pattern, onlyFirst ? undefined : 'g')
}

export function stripAnsi(message: string) {
    if (typeof message !== 'string') {
        throw new TypeError(`Expected a \`string\`, got \`${typeof message}\``)
    }

    let sanitizedMessage = message.replace(ansiRegex(), '')

    sanitizedMessage = sanitizedMessage.replace(/[^\x00-\x7F]/g, '')

    return sanitizedMessage
}

export function stripAnsiFromErrors(report: CtrfReport | null): any {
    if (!report?.results?.tests) {
        return report
    }

    report.results.tests.forEach((test) => {
        if (test.message) {
            test.message = stripAnsi(test.message)
        }
        if (test.trace) {
            test.trace = stripAnsi(test.trace)
        }
    })

    return report
}

export function getTestName(test: CtrfTest, useSuiteName: boolean): string {
    if (useSuiteName && test.suite) {
        return `${test.suite}:${test.name}`
    }
    return test.name
} 