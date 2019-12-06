"use strict";

process.env.BABEL_ENV = "renderer";

const path = require("path");
const { dependencies } = require("./package.json");
const webpack = require("webpack");

const BabiliWebpackPlugin = require("babili-webpack-plugin");
const CopyWebpackPlugin = require("copy-webpack-plugin");
const ExtractTextPlugin = require("extract-text-webpack-plugin");
const HtmlWebpackPlugin = require("html-webpack-plugin");

/**
 * List of node_modules to include in webpack bundle
 *
 * Required for specific packages like Vue UI libraries
 * that provide pure *.vue files that need compiling
 * https://simulatedgreg.gitbooks.io/electron-vue/content/en/webpack-configurations.html#white-listing-externals
 */
let whiteListedModules = [];

let webConfig = {
  devtool: "#cheap-module-eval-source-map",
  entry: {
    app: ["babel-polyfill", path.join(__dirname, "src/renderer/main.js")]
  },
  externals: [
    ...Object.keys(dependencies || {}).filter(
      d => !whiteListedModules.includes(d)
    ),
    {
      "electron-store": 'require("electron-store")'
    }
  ],
  module: {
    rules: [
      {
        test: /\.css$/,
        use: ExtractTextPlugin.extract({
          fallback: "style-loader",
          use: "css-loader"
        })
      },
      {
        test: /\.html$/,
        use: "vue-html-loader"
      },
      {
        test: /\.js$/,
        use: "babel-loader",
        exclude: /node_modules/
      },
      {
        test: /\.node$/,
        use: "node-loader"
      },
      {
        test: /\.vue$/,
        use: {
          loader: "vue-loader",
          options: {
            extractCSS: process.env.NODE_ENV === "production",
            loaders: {
              css: ["vue-style-loader", "css-loader"],
              stylus: [
                "vue-style-loader",
                "css-loader",
                {
                  loader: "stylus-loader",
                  options: {
                    import: [
                      path.join(__dirname, "src/renderer/style/variable.styl"),
                      path.join(__dirname, "src/renderer/style/function.styl"),
                      path.join(__dirname, "src/renderer/style/global.styl")
                    ],
                    preferPathResolver: "webpack"
                  }
                }
              ]
            }
          }
        }
      },
      {
        test: /\.(png|jpe?g|gif|svg)(\?.*)?$/,
        use: {
          loader: "url-loader",
          query: {
            limit: 10000,
            name: "imgs/[name]-[hash].[ext]"
          }
        }
      },
      {
        test: /\.(mp4|webm|ogg|mp3|wav|flac|aac)(\?.*)?$/,
        loader: "url-loader",
        options: {
          limit: 10000,
          name: "media/[name]-[hash].[ext]"
        }
      },
      {
        test: /\.(woff2?|eot|ttf|otf)(\?.*)?$/,
        use: {
          loader: "url-loader",
          query: {
            limit: 10000,
            name: "fonts/[name]-[hash].[ext]"
          }
        }
      }
    ]
  },
  node: {
    __dirname: process.env.NODE_ENV !== "production",
    __filename: process.env.NODE_ENV !== "production",
    fs: "empty",
    child_process: "empty",
    electron: "empty"
  },
  plugins: [
    new ExtractTextPlugin("styles.css"),
    new HtmlWebpackPlugin({
      filename: "index.html",
      template: path.resolve(__dirname, "src/index.ejs"),
      minify: {
        collapseWhitespace: true,
        removeAttributeQuotes: true,
        removeComments: true
      },
      nodeModules:
        process.env.NODE_ENV !== "production"
          ? path.resolve(__dirname, "node_modules")
          : false,
      css: ["font-awesome/css/font-awesome.css", "intro.js/introjs.css"],
      inject: true,
      cache: false
    }),
    new webpack.HotModuleReplacementPlugin(),
    new webpack.NoEmitOnErrorsPlugin(),
    new webpack.DefinePlugin({ 'process.env.NODE_ENV': '"production"' })
  ],
  output: {
    filename: "[name].js",
    libraryTarget: "window",
    path: path.join(__dirname, "dist/web")
  },
  resolve: {
    alias: {
      "@": path.join(__dirname, "src/renderer"),
      lib: path.join(__dirname, "src/renderer/lib"),
      components: path.join(__dirname, "src/renderer/components"),
      pages: path.join(__dirname, "src/renderer/pages"),
      mixin: path.join(__dirname, "src/renderer/mixin"),
      type: path.join(__dirname, "src/type"),
      vue$: "vue/dist/vue.esm.js"
    },
    extensions: [".js", ".vue", ".json", ".css", ".node"]
  },
  target: "web"
};

/**
 * Adjust webConfig for development settings
 */
if (process.env.NODE_ENV !== "production") {
  webConfig.plugins.push(
    new webpack.DefinePlugin({
      __static: `"${path.join(__dirname, "static").replace(/\\/g, "\\\\")}"`
    })
  );
}

/**
 * Adjust webConfig for production settings
 */
if (process.env.NODE_ENV === "production") {
  webConfig.devtool = "";

  webConfig.plugins.push(
    new BabiliWebpackPlugin(),
    new CopyWebpackPlugin([
      {
        from: path.join(__dirname, "static"),
        to: path.join(__dirname, "dist/web/static"),
        ignore: [".*"]
      }
    ]),
    new webpack.DefinePlugin({
      "process.env.NODE_ENV": '"production"'
    }),
    new webpack.LoaderOptionsPlugin({
      minimize: true
    })
  );
}

module.exports = webConfig;
