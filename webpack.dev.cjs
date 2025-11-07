const path = require('path');
const factory = require('./config/factory.cjs');
const dirPath = path.resolve(__dirname);
const scssOptions = {
  sourceMap: true,
  additionalData: ``
};
module.exports = factory.generateDevConfig(dirPath, scssOptions);
