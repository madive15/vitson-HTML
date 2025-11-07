const path = require('path');
const factory = require('./config/factory.cjs');
const dirPath = path.resolve(__dirname);
const scssOptions = {
  sourceMap: false,
  additionalData: ``
};
module.exports = factory.generateProdConfig(dirPath, scssOptions);
