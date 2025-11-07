const path = require('path');
const fs = require('fs');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyPlugin = require('copy-webpack-plugin');
const {htmlWebpackPluginTemplateCustomizer} = require('template-ejs-loader');
const env = require('./env.cjs');
const localPort = env.parsed.APP_PORT;
const appRoot = env.parsed.APP_ENV_ROOT;
const excludeRegExp = /(node_modules|public)/;
// const buildPath = env.parsed.APP_ENV_URL ? `dist/${env.parsed.APP_ENV_URL}` : 'dist'
const buildPath = '../dist';
const pathRegExp = /(views\/pages\/index.ejs)|(views\/pages\/guide\/)/;

const stringifyValues = (object) => {
  return Object.entries(object).reduce((acc, curr) => ({...acc, [`${curr[0]}`]: JSON.stringify(curr[1])}), {});
};
const getEjsFile = ({dir, type, dirPath}, files_) => {
  files_ = files_ || [];
  fs.readdirSync(dir).forEach((file) => {
    const name = dir + '/' + file;
    if (/layout\/|components\//.test(name)) {
      return false;
    }
    if (fs.statSync(name).isDirectory()) {
      getEjsFile({dir: name, type, dirPath}, files_);
    } else if (/.ejs$/.test(file)) {
      const parts = name.split('src/');
      // console.log(parts, appRoot);
      files_.push(
        new HtmlWebpackPlugin({
          chunks: [pathRegExp.test(parts[1]) ? 'no-style' : appRoot],
          filename: `${parts[1].replace('views/pages', 'html').replace('.ejs', '')}.html`,
          minify: false,
          template: htmlWebpackPluginTemplateCustomizer({
            templatePath: `${dirPath}/src/${parts[1]}`,
            htmlLoaderOption: {
              minimize: false
            },
            templateEjsLoaderOption: {
              data: {
                ...env.parsed,
                srcPath: `${dirPath}/src`,
                publicPath: type === 'development' ? `http://localhost:${localPort}` : `${dirPath}/public`
              }
            }
          })
        })
      );
    }
  });
  return files_;
};

const createCopyPattern = (patterns) => {
  const resultPatterns = [];

  patterns.forEach((pattern) => {
    const fromPath = `src/${pattern}`;
    if (fs.existsSync(fromPath)) {
      resultPatterns.push({
        from: fromPath,
        to: pattern
      });
    }
  });

  if (resultPatterns.length > 0) {
    return [
      new CopyPlugin({
        patterns: resultPatterns
      })
    ];
  }
  return resultPatterns;
};

exports.excludeRegExp = excludeRegExp;
exports.buildPath = buildPath;
exports.createCopyPattern = createCopyPattern;
exports.stringifyValues = stringifyValues;
exports.getEjsFile = getEjsFile;
