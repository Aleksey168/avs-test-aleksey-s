import * as path from 'path';
import HtmlWebpackPlugin from 'html-webpack-plugin';
import CopyWebpackPlugin from 'copy-webpack-plugin';
import TerserPlugin from 'terser-webpack-plugin';
import { CleanWebpackPlugin } from 'clean-webpack-plugin';
import { Configuration } from 'webpack';

const isDevelopment = process.env.NODE_ENV !== 'prod';

const config: Configuration = {
  mode: isDevelopment ? 'development' : 'production',
  resolve: {
    extensions: ['.tsx', '.ts', '.js'],
    alias: {
      '@addons': 'three/examples/jsm',
    },
  },
  entry: path.resolve(__dirname, 'src/app.ts'),
  output: {
    path: path.resolve(__dirname, 'build'),
    filename: 'scene3d.js',
    library: {
      type: 'module',
    },
  },
  ...(isDevelopment && {
    devtool: 'inline-source-map',
    devServer: {
      static: path.join(__dirname, 'build'),
      port: 9000,
      client: {
        overlay: {
          errors: true,
          warnings: false,
        },
      },
      hot: false,
      liveReload: true,
    },
  }),
  plugins: [
    new HtmlWebpackPlugin({
      filename: 'index.html',
      template: './src/index.html',
    }),
    new CopyWebpackPlugin({
      patterns: [
        {
          from: 'static',
        },
      ],
    }),
    ...(!isDevelopment ? [new CleanWebpackPlugin()] : []),
  ],
  module: {
    rules: [
      {
        test: /\.(ts|tsx)$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
    ],
  },
  ...(isDevelopment
    ? {}
    : {
        optimization: {
          minimize: true,
          minimizer: [
            new TerserPlugin({
              parallel: true,
            }),
          ],
        },
      }),
  experiments: {
    outputModule: true,
  },
};

export default config; 