const { merge } = require('webpack-merge');
const path = require('path');
const webpackConfig = require('./webpack.config');

module.exports = merge(webpackConfig, {
  mode: 'development',

  output: {
    path: path.join(__dirname, 'dist'),
    filename: 'bundle.dev.js',
  },

  devtool: 'source-map',

  devServer: {
    port: 3040,
    hot: true,
    historyApiFallback: true, // Allows accessing React Routes via browser URL
    static: [
      {
        directory: path.join(__dirname, 'assets/'),
        publicPath: '/',
      },
    ],
  },
});
