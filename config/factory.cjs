const {merge} = require('webpack-merge')
const common = require('./webpack.common.cjs')
const prod = require('./webpack.prod.cjs')
const dev = require('./webpack.dev.cjs')
const env = require('./env.cjs')
const localPort = env.parsed.APP_PORT
const envType = env.parsed.APP_ENV_TYPE
const envRoot = env.parsed.APP_ENV_ROOT
const entryRoot = `${envRoot}.${envType}`

const generateDevConfig = (dirPath, scssOptions) =>
  merge(common(dirPath, {envType, envRoot}), dev(dirPath, scssOptions, localPort))

const generateProdConfig = (dirPath, scssOptions) =>
  merge(common(dirPath, {envType, envRoot}), prod(dirPath, scssOptions))

exports.generateDevConfig = generateDevConfig
exports.generateProdConfig = generateProdConfig
