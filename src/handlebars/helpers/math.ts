import Handlebars from 'handlebars'

/**
 * Adds multiple numbers together and returns the sum.
 *
 * @example
 * // In Handlebars:
 * // {{add 1 2 3}}
 * // Returns: 6
 *
 * @param {...number} args - The numbers to be added.
 * @returns {number} The sum of all provided numbers.
 */
export function addHelper(): void {
  Handlebars.registerHelper('add', function (...args) {
    args.pop()
    return args.reduce(
      (sum: number, value: number) => sum + (value ?? 0),
      0
    ) as number
  })
}

/**
 * Register a helper to subtract two numbers
 */
export function subtractHelper(): void {
  Handlebars.registerHelper('subtract', function (a: number, b: number) {
    return a - b
  })
}
