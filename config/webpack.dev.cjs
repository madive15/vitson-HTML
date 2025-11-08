const ESLintPlugin = require('eslint-webpack-plugin');
const StylelintPlugin = require('stylelint-webpack-plugin');
const parser = require('./parser.cjs');
const buildMode = 'development';

module.exports = (dirPath, scssOptions, localPort) => ({
  mode: buildMode,
  devtool: 'inline-source-map',
  devServer: {
    host: '0.0.0.0',
    port: localPort,
    hot: true,
    watchFiles: ['src/**/*.ejs', 'src/**/*.scss']
  },
  stats: {
    /**
     * 'errors-only' 에러가 발생할 때만 출력
     * 'errors-warnings' 에러와 경고가 발생할 때만 출력
     * 'minimal' 에러와 새로운 컴파일이 발생할 때만 출력
     * 'none'	출력 없음
     * 'normal'	표준 출력
     * 'verbose' 모두 출력
     * 'detailed' chunkModules과 chunkRootModules을 제외하고 출력
     * 'summary' webpack 버전, 경고 횟수, 에러 횟수를 출력
     */
    preset: 'summary'
  },
  module: {
    rules: [
      {
        test: /\.s[ac]ss$/i,
        exclude: parser.excludeRegExp,
        use: [
          'style-loader',
          'css-loader',
          'postcss-loader',
          {
            loader: 'sass-loader',
            options: scssOptions
          }
        ]
      }
    ]
  },
  plugins: [
    new ESLintPlugin({extensions: ['js', 'ts']})
    /**
     * StylelintPlugin 필요시 주석해제
     */
    // new StylelintPlugin()
  ].concat(parser.getEjsFile({dir: 'src/views', type: buildMode, dirPath}))
});
