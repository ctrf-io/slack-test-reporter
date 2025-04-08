import * as handlebars from 'handlebars'
import { registerAllHelpers } from './helpers'
import { type CtrfReport } from '../types'
require('handlebars-helpers-ctrf')({ handlebars })

/**
 * Generates markdown content from a Handlebars template and provided data.
 *
 * @param templateSource - The source string of the Handlebars template.
 * @param data - The data to populate the template with.
 * @returns The generated markdown string.
 */
export function generateMarkdown(
  templateSource: string,
  report: CtrfReport
): string {
  return compileTemplate(templateSource, report)
}

/**
 * Compiles a Handlebars template with the provided data.
 *
 * - Registers all necessary Handlebars helpers before compiling.
 * - Uses the provided template source to generate markdown output.
 *
 * @param templateSource - The source string of the Handlebars template.
 * @param data - The `TemplateData` object containing the data for the template.
 * @returns The compiled markdown string based on the template and data.
 */
export function compileTemplate(
  templateSource: string,
  data: CtrfReport
): string {
  registerAllHelpers()
  const context = { ctrf: data.results }
  const template = handlebars.compile(templateSource, {
    preventIndent: true,
  })

  return template(context)
}
