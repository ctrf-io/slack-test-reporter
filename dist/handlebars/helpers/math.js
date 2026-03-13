import Handlebars from 'handlebars';
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
export function addHelper() {
    Handlebars.registerHelper('add', function (...args) {
        args.pop();
        return args.reduce((sum, value) => sum + (value ?? 0), 0);
    });
}
/**
 * Register a helper to subtract two numbers
 */
export function subtractHelper() {
    Handlebars.registerHelper('subtract', function (a, b) {
        return a - b;
    });
}
//# sourceMappingURL=math.js.map