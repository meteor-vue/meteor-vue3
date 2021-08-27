import { checkNpmVersions } from 'meteor/tmeasday:check-npm-versions'

checkNpmVersions({
  vue: '^3.1.0',
  '@vue/compiler-sfc': '^3.1.0',
}, 'vuejs:vue3')

const { VueCompiler } = require('./compiler')

Plugin.registerCompiler({
  extensions: ['vue'],
  filenames: ['.vueignore'],
}, () => new VueCompiler())
