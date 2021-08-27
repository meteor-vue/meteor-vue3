module.exports = {
  extends: 'standard-with-typescript',
  parserOptions: {
    project: './tsconfig.json',
  },
  env: {
    browser: true,
  },
  globals: {
    Package: true,
    Npm: true,
    Meteor: true,
    Tracker: true,
    MultiFileCachingCompiler: true,
    Babel: true,
  },
  rules: {
    'comma-dangle': ['error', 'always-multiline'],
  },
}
