/**
 * Strips ANSI escape codes from the given message.
 *
 * @example
 * In Handlebars:
 * {{stripAnsi "Hello \u001b[31mRed\u001b[0m"}}
 * Returns: "Hello Red"
 *
 * @param {string} message - The string potentially containing ANSI escape codes.
 * @returns {string} The string with all ANSI escape codes removed.
 */
export declare function stripAnsiHelper(): void;
/**
 * Converts ANSI-formatted text into HTML, strips ANSI codes, and replaces newlines with `<br>`.
 * Ideal for rendering multi-line console messages in a human-friendly HTML format.
 *
 * @example
 * In Handlebars:
 * {{formatMessage "Line1\nLine2"}}
 * Returns HTML with each line separated by a <br>.
 *
 * @param {string} text - The text to format, possibly containing ANSI codes.
 * @returns {string} An HTML-formatted string, with ANSI codes removed and line breaks replaced.
 */
export declare function formatMessageHelper(): void;
//# sourceMappingURL=ansi.d.ts.map