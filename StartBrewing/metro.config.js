const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");

const config = getDefaultConfig(__dirname);

// Add font configuration
config.resolver.assetExts.push("ttf");

const modifiedConfig = withNativeWind(config, { input: "./global.css" });

module.exports = modifiedConfig;
