// const path = require('path')
// const webpack = require('webpack')

// module.exports = {
//   entry: './frontend-js/main.js',
//   output: {
//     filename: 'main-bundled.js',
//     path: path.resolve(__dirname, 'public')
//   },
//   // mode: "production",
//   mode: "development",
//   module: {
//     rules: [
//       {
//         test: /\.js$/,
//         exclude: /node_modules/,
//         use: {
//           loader: 'babel-loader',
//           options: {
//             presets: ['@babel/preset-env'],
//               sourceType: 'module'
//           }
//         }
//       }
//     ]
//   }
// }

// new code
const path = require('path')

module.exports = {
  entry: './frontend-js/main.js',
  output: {
    filename: 'main-bundled.js',
    path: path.resolve(__dirname, 'public')
  },
  mode: "development",
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: [
              ['@babel/preset-env', {
                targets: {
                  browsers: ['last 2 versions', '> 1%']
                },
                modules: 'commonjs',  // Transform ES6 imports to CommonJS
                useBuiltIns: 'usage',
                corejs: 3
              }]
            ]
          }
        }
      }
    ]
  }
}