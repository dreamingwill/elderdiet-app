// Learn more https://docs.expo.io/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// 添加路径别名解析
const extraNodeModules = {
  '@': path.resolve(__dirname),
};

config.resolver.extraNodeModules = extraNodeModules;

module.exports = config; 