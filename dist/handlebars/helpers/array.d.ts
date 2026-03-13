/**
 * Iterates over a subsection (slice) of an array and renders a block for each item.
 *
 * This helper takes an array, a start index, and an end index, then slices the array
 * and renders the given block with each item in that sliced section. Useful for
 * pagination or limiting displayed items.
 *
 * @example
 * // In Handlebars:
 * // {{#slice items 0 3}}
 * //   <li>{{this}}</li>
 * // {{/slice}}
 * //
 * // Renders the first three items of the array as list items.
 *
 * @param {any[]} array - The array to be sliced.
 * @param {number} start - The start index for the slice.
 * @param {number} end - The end index for the slice.
 * @param {Handlebars.HelperOptions} options - Handlebars options object, including the block to render.
 * @returns {string} A concatenated string of all rendered items within the slice.
 */
export declare function sliceArrayHelper(): void;
/**
 * Reverses an array.
 *
 * @example
 * reverseArray([1, 2, 3]) // [3, 2, 1]
 *
 * @param {Array} arr - The array to reverse.
 * @returns {Array} A new array that is the reverse of the input array.
 */
export declare function reverseArray(): void;
//# sourceMappingURL=array.d.ts.map