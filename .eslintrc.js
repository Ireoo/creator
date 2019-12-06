module.exports = {
  root: true,
  parser: 'babel-eslint',
  parserOptions: {
    sourceType: 'module',
    "experimentalDecorators": true,
    "babel/new-cap": 1,
    ecmaFeatures: {
      jsx: true,
    }
  },
  env: {
    browser: true,
    node: true
  },
  extends: [
    'standard',
    'plugin:flowtype/recommended'
  ],
  globals: {
    __static: true
  },
  plugins: [
    'html',
    'flowtype-errors',
    'flowtype'
  ],
  'rules': {
    // allow paren-less arrow functions
    'arrow-parens': 0,
    // allow async-await
    'generator-star-spacing': 0,
    // allow debugger during development
    'generic-spacing': 'always',
    'space-before-generic-bracket': 'always',
    'no-debugger': process.env.NODE_ENV === 'production' ? 2 : 0,
    'comma-dangle': ['error', 'always-multiline'],
    'space-before-function-paren': ['error', 'never'],
    'flowtype-errors/show-errors': 2,
    'no-unused-expressions': 0,
    'no-unused-vars': 0,
    "flowtype/no-types-missing-file-annotation": 0
  }
}