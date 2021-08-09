module.exports = {
  extends: 'standard',
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
