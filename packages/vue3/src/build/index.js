import { checkNpmVersions } from 'meteor/tmeasday:check-npm-versions'
import { VueCompiler } from './compiler'

checkNpmVersions({
  vue: '^3.1.0',
  '@vue/compiler-sfc': '^3.1.0',
}, 'vuejs:vue3')

Plugin.registerCompiler({
  extensions: ['vue'],
  filenames: ['.vueignore'],
}, () => new VueCompiler())
