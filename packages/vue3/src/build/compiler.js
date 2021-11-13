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

  normalizeTemplate(template) {
    // In order to prevent Prettier from reporting error,
    // one more temporary variable had to be used to reconstruct follow code:
    // const indent = template.match(/^\n?(\s+)/)?.[1]
    const temp = template.match(/^\n?(\s+)/)
    const indent = temp && temp[1]
  
    if (indent) {
      return template
        .split('\n')
        .map(str => str.replace(indent, ''))
        .join('\n')
    }

    return template
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

    if (descriptor.script || descriptor.scriptSetup) {
      const scriptResult = compileScript(descriptor, {
        id: scopeId,
        isProd,
      })
      compileResult.source += scriptResult.content.replace(/export default/, 'const __script__ = ')
      compileResult.sourceMap = scriptResult.map
    }

    if (descriptor.template) {
      let template 

      const lang = descriptor.template.attrs.lang

      // if a template language is set (for example pug) 
      // check if there's a compiler and compile the template
      if(lang) {
        const templateCompiler = global.vue.lang[lang]
        
        if (templateCompiler) {
          const result = templateCompiler({
            source: this.normalizeTemplate(descriptor.template.content),
            inputFile: this.inputFile,
            basePath: descriptor.template.map.file,
          })

          template = result.template
        } else {
          throw new Error(`Compiler missing for ${lang}`)
        }
      } else {
        template = descriptor.template.content
      }

      const templateResult = compileTemplate({
        id: scopeId,
        filename,
        source: template,
        scoped: hasScoped,
        isProd,
        inMap: descriptor.template.map,
        compilerOptions: {
          scopeId: hasScoped ? `data-v-${scopeId}` : undefined,
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
      
      // compile sass, scss, etc first to css      
      if (style.lang) {
        const styleCompiler = global.vue.lang[style.lang]
        
        if (styleCompiler) {   
          // expect this compiler to return css    
          style.content = styleCompiler({
            data: style.content,
            filename,
          })
        } else {
          throw new Error(`Compiler missing for ${style.lang}`)
        }
      }

      // compile css styles so scope etc is applied
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
