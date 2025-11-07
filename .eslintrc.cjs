module.exports = {
  root: true,
  env: {
    browser: true,
    node: true,
    es6: true
  },
  extends: ['eslint:recommended', 'plugin:prettier/recommended'],
  plugins: ['prettier'],
  parserOptions: {
    parser: '@babel/eslint-parser',
    ecmaVersion: 'latest',
    sourceType: 'module',
    allowImportExportEverywhere: true,
    requireConfigFile: false
  },
  rules: {
    'no-unused-vars': 'warn'
  },
  globals: {
    APP_NODE_ENV: true,
    APP_ENV_ROOT: true,
    APP_ENV_TYPE: true,
    APP_ENV_URL: true
  }
}
