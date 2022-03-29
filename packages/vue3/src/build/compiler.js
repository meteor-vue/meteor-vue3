import { parse, compileScript, compileTemplate, compileStyleAsync } from '@vue/compiler-sfc'
import hash from 'hash-sum'
import { genHotReloadCode } from './hmr'
import path from 'path'
import { appendSourceMaps, combineSourceMaps } from './source-map'
import { formatError } from './error'

export class VueCompiler extends MultiFileCachingCompiler {
  constructor () {
    super({
      compilerName: 'vue3-components',
      defaultCacheSize: 1024 * 1024 * 10,
    })
  }

  getCacheKey (inputFile) {
    return [
      inputFile.getSourceHash(),
      inputFile.getPathInPackage(),
    ]
  }

  async compileOneFile (inputFile) {
    const contents = inputFile.getContentsAsString()
    const filename = inputFile.getPathInPackage()
    const { errors, descriptor } = parse(contents, {
      filename,
    })
    if (errors.length) {
      for (const error of errors) {
        console.error(formatError(error, contents, filename))
      }
      throw new Error(`Parsing failed for ${inputFile.getDisplayPath()} (${errors.length} error(s))`)
    }

    const compileResult = {
      source: '',
      sourceMap: null,
      styles: [],
    }
    const referencedImportPaths = []

    const isProd = process.env.NODE_ENV === 'production'
    const hasScoped = descriptor.styles.some((s) => s.scoped)
    const scopeId = hash(filename)

    let scriptResult;
    if (descriptor.script || descriptor.scriptSetup) {
      scriptResult = compileScript(descriptor, {
        id: scopeId,
        isProd,
      })
      compileResult.source += scriptResult.content.replace(/export default/, 'const __script__ = ')
      compileResult.sourceMap = scriptResult.map
    }

    if (descriptor.template) {
      const templateResult = compileTemplate({
        id: scopeId,
        filename,
        source: descriptor.template.content,
        scoped: hasScoped,
        isProd,
        inMap: descriptor.template.map,
        compilerOptions: {
          scopeId: hasScoped ? `data-v-${scopeId}` : undefined,
          bindingMetadata: scriptResult ? scriptResult.bindings : undefined,
        },
      })
      if (templateResult.errors && templateResult.errors.length) {
        for (const error of templateResult.errors) {
          console.error(formatError(error, contents, filename))
        }
        throw new Error(`Compiling template failed for ${inputFile.getDisplayPath()} (${templateResult.errors.length} error(s))`)
      }
      if (!compileResult.source) {
        compileResult.source = 'const __script__ = {};'
      } else {
        compileResult.source += '\n'
      }
      const lines = compileResult.source.split('\n').length
      compileResult.source += templateResult.code
        .replace(/export function render/, '__script__.render = function')
        .replace(/export const render/, '__script__.render')

      if (templateResult.map) {
        if (compileResult.sourceMap) {
          compileResult.sourceMap = await appendSourceMaps(templateResult.map, compileResult.sourceMap, lines - 1)
        } else {
          compileResult.sourceMap = templateResult.map
        }
      }
    }

    // Scope id
    if (hasScoped) {
      compileResult.source += `\n__script__.__scopeId = 'data-v-${scopeId}'`
    }

    // HMR
    if (process.env.NODE_ENV !== 'production' && inputFile.hmrAvailable()) {
      compileResult.source += genHotReloadCode(scopeId)
    }

    // File (devtools)
    if (process.env.NODE_ENV !== 'production') {
      compileResult.source += `\n__script__.__file = ${JSON.stringify(path.resolve(process.cwd(), filename))}`
    }

    // Default export
    compileResult.source += '\nexport default __script__'

    const babelOptions = Babel.getDefaultOptions()
    babelOptions.babelrc = true
    babelOptions.sourceMaps = true
    babelOptions.filename = babelOptions.sourceFileName = filename
    const transpiled = Babel.compile(compileResult.source, babelOptions, {
      cacheDirectory: this._diskCache,
    })
    compileResult.source = transpiled.code
    if (transpiled.map && compileResult.sourceMap) {
      compileResult.sourceMap = await combineSourceMaps(transpiled.map, compileResult.sourceMap)
    }

    for (const style of descriptor.styles) {
      const styleResult = await compileStyleAsync({
        id: scopeId,
        filename,
        source: style.content,
        scoped: style.scoped,
        isProd,
        inMap: style.map,
      })

      compileResult.styles.push({
        source: styleResult.code,
        sourceMap: styleResult.map,
      })
    }

    return {
      compileResult,
      referencedImportPaths,
    }
  }

  addCompileResult (inputFile, result) {
    if (result.source) {
      inputFile.addJavaScript({
        path: inputFile.getPathInPackage() + '.js',
        sourcePath: inputFile.getPathInPackage(),
        data: result.source,
        sourceMap: result.sourceMap,
      })
    }

    for (const style of result.styles) {
      inputFile.addStylesheet({
        path: inputFile.getPathInPackage(),
        sourcePath: inputFile.getPathInPackage(),
        data: style.source,
        sourceMap: style.sourceMap,
        lazy: false,
      })
    }
  }

  compileResultSize (result) {
    const styleSize = result.styles.reduce((total, style) => total + style.source.length + (style.sourceMap ? style.sourceMap.length : 0), 0)
    return result.source.length + (result.sourceMap ? result.sourceMap.length : 0) + styleSize
  }
}
