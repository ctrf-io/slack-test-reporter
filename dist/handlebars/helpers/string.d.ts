/**
 * Converts a given string to uppercase.
 *
 * @example
 * In Handlebars:
 * {{uppercase "hello world"}}
 * Returns: "HELLO WORLD"
 *
 * @param {string} str - The input string to be converted.
 * @returns {string} The uppercase version of the input string.
 */
export declare function uppercaseHelper(): void;
/**
 * Escapes special Markdown characters in the given string.
 * This is useful to ensure that characters like `*`, `_`, `(`, `)`, etc.
 * don't inadvertently format the output as Markdown.
 *
 * @example
 * In Handlebars:
 * {{escapeMarkdown "Hello *world*"}}
 * Returns: "Hello \\*world\\*"
 *
 * @param {string} str - The input string containing Markdown characters.
 * @returns {string} The string with Markdown characters escaped.
 */
export declare function escapeMarkdownHelper(): void;
/**
 * Splits the given text into an array of lines, omitting any empty lines.
 * Useful for processing multiline strings and iterating over each line in a template.
 *
 * @example
 * In Handlebars:
 * {{#each (splitLines "Line one\n\nLine two\nLine three")}}
 *   {{this}}
 * {{/each}}
 *
 * Returns an array: ["Line one", "Line two", "Line three"]
 *
 * @param {string} str - The input string containing one or more lines.
 * @returns {string[]} An array of non-empty lines.
 */
export declare function splitLinesHelper(): void;
/**
 * Extracts the text from one string and returns a new string
 *
 * @example
 * In Handlebars:
 * {{slice "d9a40a70dd26e3b309e9d106adaca2417d4ffb1e" 0 7}}
 * Returns: "d9a40a7"
 *
 * @param {string} str - The input string containing one or more lines.
 * @param {number} start - The index of the first character to include in the returned substring.
 * @param {number} end - The index of the first character to exclude from the returned substring.

 * @returns {string[]} A new string containing the extracted section of the string.
 */
export declare function sliceStringHelper(): void;
/**
 * Converts timestamp to a human-readable format with a short month.
 *
 * @example
 * convertTimestamp("2025-01-19T15:06:45Z") // "Jan 19, 25, 3:06 PM"
 *
 * @param {string} timestamp - The ISO 8601 timestamp to convert.
 * @returns {string} A human-readable string representation of the timestamp.
 */
export declare function convertTimestamp(): void;
//# sourceMappingURL=string.d.ts.map