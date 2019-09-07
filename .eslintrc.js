module.exports = {
  env: {
    commonjs: true,
    es6: true,
    node: true,
  },
  extends: 'eslint:recommended',
  globals: {
    Atomics: 'readonly',
    SharedArrayBuffer: 'readonly',
  },
  parserOptions: {
    ecmaVersion: 2018,
  },
  rules: {
    quotes: [1, 'single'],
    'quote-props': [2, 'as-needed'],
    semi: [2, 'never'],
    'comma-dangle': [1, 'always-multiline'],
    'eol-last': [2, 'always'],
  },
}
