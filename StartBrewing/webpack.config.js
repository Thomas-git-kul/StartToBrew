// webpack.config.js
const createExpoWebpackConfigAsync = require("@expo/webpack-config");
const path = require("path");

module.exports = async function (env, argv) {
  const config = await createExpoWebpackConfigAsync(env, argv);

  // Allow loading .ttf fonts from react-native-vector-icons
  config.module.rules.push({
    test: /\.ttf$/,
    include: path.resolve(__dirname, "node_modules/react-native-vector-icons"),
    type: "asset/resource",
    generator: {
      filename: "static/media/[name].[hash][ext]",
    },
  });

  return config;
};
