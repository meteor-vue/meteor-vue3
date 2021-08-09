// Forked from https://github.com/meteor-svelte/meteor-svelte/blob/2ecd24c50ee98629c0502cf1c28562505a0b5afe/SvelteCompiler.js#L192

import { SourceMapGenerator, SourceMapConsumer } from 'source-map'

export async function combineSourceMaps (babelMap, vueMap) {
  const result = new SourceMapGenerator()

  const babelConsumer = await new SourceMapConsumer(babelMap)
  const vueConsumer = await new SourceMapConsumer(vueMap)

  babelConsumer.eachMapping(mapping => {
    // Ignore mappings that don't have a source
    if (!mapping.source) {
      return
    }

    const position = vueConsumer.originalPositionFor({
      line: mapping.originalLine,
      column: mapping.originalColumn,
    })

    // Ignore mappings that don't map to the original HTML
    if (!position.source) {
      return
    }

    result.addMapping({
      source: position.source,
      original: {
        line: position.line,
        column: position.column,
      },
      generated: {
        line: mapping.generatedLine,
        column: mapping.generatedColumn,
      },
    })
  })

  // Only one file
  result.setSourceContent(
    vueMap.sources[0],
    vueMap.sourcesContent[0],
  )

  babelConsumer.destroy()
  vueConsumer.destroy()

  return result.toJSON()
}

export async function appendSourceMaps (additionalMap, initialMap, lineOffset) {
  const initialConsumer = await new SourceMapConsumer(initialMap)
  const additionalConsumer = await new SourceMapConsumer(additionalMap)

  const result = SourceMapGenerator.fromSourceMap(initialConsumer)

  additionalConsumer.eachMapping(mapping => {
    // Ignore mappings that don't have a source
    if (!mapping.source) {
      return
    }

    result.addMapping({
      source: mapping.source,
      original: {
        line: mapping.originalLine,
        column: mapping.originalColumn,
      },
      generated: {
        line: mapping.generatedLine + lineOffset,
        column: mapping.generatedColumn,
      },
    })
  })

  // Only one file
  result.setSourceContent(
    initialMap.sources[0],
    initialMap.sourcesContent[0],
  )

  initialConsumer.destroy()
  additionalConsumer.destroy()

  return result.toJSON()
}
