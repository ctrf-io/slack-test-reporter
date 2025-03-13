import {
  stripAnsi,
  getTestName,
  stripAnsiFromErrors,
} from '../../src/utils/common'

describe('Common Utilities', () => {
  describe('stripAnsi', () => {
    it('should remove ANSI escape codes from strings', () => {
      const ansiString = '\u001B[31mError: Test failed\u001B[0m'
      const expected = 'Error: Test failed'

      const result = stripAnsi(ansiString)

      expect(result).toBe(expected)
    })

    it('should handle strings without ANSI codes', () => {
      const plainString = 'This is a plain string'

      const result = stripAnsi(plainString)

      expect(result).toBe(plainString)
    })

    it('should throw an error for non-string inputs', () => {
      // @ts-expect-error - testing invalid input
      expect(() => stripAnsi(123)).toThrow(TypeError)
      // @ts-expect-error - testing invalid input
      expect(() => stripAnsi(null)).toThrow(TypeError)
      // @ts-expect-error - testing invalid input
      expect(() => stripAnsi(undefined)).toThrow(TypeError)
    })
  })

  describe('getTestName', () => {
    it('should return test name with suite name when useSuiteName is true and suite exists', () => {
      const test = {
        name: 'should pass',
        suite: 'LoginTests',
        status: 'passed',
        duration: 100,
      }

      const result = getTestName(test as any, true)

      expect(result).toBe('LoginTests:should pass')
    })

    it('should return only test name when useSuiteName is false', () => {
      const test = {
        name: 'should pass',
        suite: 'LoginTests',
        status: 'passed',
        duration: 100,
      }

      const result = getTestName(test as any, false)

      expect(result).toBe('should pass')
    })

    it('should return only test name when suite does not exist', () => {
      const test = {
        name: 'should pass',
        status: 'passed',
        duration: 100,
      }

      const result = getTestName(test as any, true)

      expect(result).toBe('should pass')
    })
  })

  describe('stripAnsiFromErrors', () => {
    it('should strip ANSI codes from test messages and traces', () => {
      const report = {
        results: {
          tests: [
            {
              name: 'test1',
              status: 'failed',
              duration: 100,
              message: '\u001B[31mError: Test failed\u001B[0m',
              trace: '\u001B[33mAt line 42\u001B[0m',
            },
            {
              name: 'test2',
              status: 'passed',
              duration: 50,
            },
          ],
        },
      }

      const result = stripAnsiFromErrors(report as any)

      expect(result.results.tests[0].message).toBe('Error: Test failed')
      expect(result.results.tests[0].trace).toBe('At line 42')
    })

    it('should return the report as is when there are no tests', () => {
      const report = {
        results: {
          summary: {
            passed: 0,
            failed: 0,
          },
        },
      }

      const result = stripAnsiFromErrors(report as any)

      expect(result).toEqual(report)
    })

    it('should return null when report is null', () => {
      const result = stripAnsiFromErrors(null)

      expect(result).toBeNull()
    })
  })
})
