import { generateCodeFrame } from '@vue/compiler-sfc'
import chalk from 'chalk'

export function formatError (err, source, file) {
  const loc = err.loc
  if (!loc) {
    return
  }
  const locString = `:${loc.start.line}:${loc.start.column}`
  const filePath = chalk.gray(`at ${file}${locString}`)
  const codeframe = generateCodeFrame(source, loc.start.offset, loc.end.offset)
  return `\n${chalk.red(
    `VueCompilerError: ${err.message}`,
  )}\n${filePath}\n${chalk.yellow(codeframe)}\n`
}
