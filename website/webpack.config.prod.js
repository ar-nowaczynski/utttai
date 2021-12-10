const { merge } = require('webpack-merge');
const path = require('path');
const webpackConfig = require('./webpack.config');
const CopyWebpackPlugin = require('copy-webpack-plugin');

module.exports = merge(webpackConfig, {
  mode: 'production',

  output: {
    path: path.join(__dirname, 'dist'),
    filename: 'app.js',
    publicPath: '/',
  },

  plugins: [
    new CopyWebpackPlugin({
      patterns: [{ from: 'assets/' }],
    }),
  ],
});
