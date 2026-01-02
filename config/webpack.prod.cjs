const webpack = require('webpack');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const CssMinimizerPlugin = require('css-minimizer-webpack-plugin');
const TerserPlugin = require('terser-webpack-plugin');
const banner = require('./banner.cjs');
const parser = require('./parser.cjs');
const buildMode = 'production';
// const buildMode = 'development'; // 개발모드로 설정시 압축제거됨. 배포시 production으로 변경할 것

module.exports = (dirPath, scssOptions) => ({
  mode: buildMode,
  // devtool: 'source-map',
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
    preset: 'minimal'
  },
  module: {
    rules: [
      {
        test: /\.s[ac]ss$/i,
        exclude: parser.excludeRegExp,
        use: [
          MiniCssExtractPlugin.loader,
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
    /*
    new webpack.BannerPlugin({
      banner
    }),
    */
    new MiniCssExtractPlugin({
      // filename: '[name].[contenthash].chunk.css'
      filename: 'assets/css/[name].css'
    })
  ].concat(parser.getEjsFile({dir: 'src/views', type: buildMode, dirPath})),
  optimization: {
    minimizer: [], // 빈배열로 설정시 압축 제거
    // minimize: true,
    // minimizer: [
    //   new TerserPlugin({
    //     extractComments: false,
    //     terserOptions: {
    //       compress: {drop_console: true} // console.log 제거
    //     }
    //   }),
    //   new CssMinimizerPlugin({
    //     minimizerOptions: {
    //       preset: [
    //         'default',
    //         {
    //           normalizeCharset: true,
    //           discardComments: {
    //             removeAll: true // 모든 CSS 주석 제거
    //           }
    //         }
    //       ]
    //     }
    //   })
    // ],
    splitChunks: {
      chunks: 'all',
      maxInitialRequests: Infinity,
      minSize: 0,
      cacheGroups: {
        // js
        vendors: {
          test: /[\\/]node_modules[\\/]/,
          name: 'vendors',
          priority: 1,
          reuseExistingChunk: true
        },
        swiper: {
          test: /[\\/]node_modules[\\/](swiper)[\\/]/,
          name: 'swiper',
          priority: 2,
          reuseExistingChunk: true
        },
        lodash: {
          test: /[\\/]node_modules[\\/](lodash)[\\/]/,
          name: 'lodash',
          priority: 2,
          reuseExistingChunk: true
        }

        // css 파일분리 원하는경우 작성!
        /*
        modules: {
          name: 'modules',
          test: /modules\.s?css$/,
          chunks: 'all',
          priority: -10,
          enforce: true
        },
        contents: {
          name: 'contents',
          test: /contents\.s?css$/,
          chunks: 'all',
          priority: -10,
          enforce: true
        }
        */
      }
    }
  }
});
