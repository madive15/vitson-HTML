const webpack = require('webpack')
const path = require('path')
const env = require('./env.cjs')
const parser = require('./parser.cjs')

module.exports = (dirPath, {envType, envRoot}) => ({
  entry: {
    [envRoot]: `./src/${envRoot}.${envType}`
  },
  output: {
    filename: 'assets/scripts/[name].bundle.js',
    assetModuleFilename: '[file]',
    path: path.resolve(__dirname, parser.buildPath),
    clean: true,
    // 기본적으로 포함된 형식은 'array-push'(web/WebWorker), 'commonjs'(node.js), 'module'(ESM)이지만 다른 형식은 플러그인에 의해 추가될 수 있음)
    chunkFormat: 'array-push'
  },
  resolve: {
    alias: {
      '@': path.resolve(dirPath, 'src/'),
      // '#': path.resolve(__dirname, 'scss-modules/')
    },
    extensions: ['.ts', '.js']
  },
  module: {
    rules: [
      {
        test: /\.ejs$/i,
        exclude: parser.excludeRegExp,
        use: ['html-loader', 'template-ejs-loader']
      },
      {
        test: /\.(png|jpg|jpeg|gif)$/i,
        exclude: parser.excludeRegExp,
        type: 'asset/resource',
        generator: {
          // filename: 'assets/images/[hash][ext][query]'
          filename: 'assets/images/[name][ext]'
        }
      },
      {
        test: /\.(mp4|ogg)$/i,
        exclude: parser.excludeRegExp,
        type: 'asset/resource',
        generator: {
          filename: 'assets/medias/[name][ext]'
        }
      },
      {
        test: /\.(svg)$/i,
        exclude: parser.excludeRegExp,
        type: 'asset/inline'
      },
      {
        test: /\.(woff|woff2|eot|ttf|otf)$/i,
        exclude: parser.excludeRegExp,
        type: 'asset/resource',
        generator: {
          filename: 'assets/fonts/[name][ext]'
        }
      },
      {
        test: /\.(m?js|ts)$/,
        exclude: parser.excludeRegExp,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env', '@babel/preset-typescript'],
            plugins: ['@babel/plugin-transform-runtime']
          }
        }
      }
    ]
  },
  plugins: [
    new webpack.DefinePlugin({
      ...parser.stringifyValues(env.parsed)
    })
  ].concat(parser.createCopyPattern(['assets/datas']))
})
