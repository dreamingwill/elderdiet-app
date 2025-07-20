module.exports = function(api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      // 确保路径别名在所有环境中都能正常工作
      ['module-resolver', {
        root: ['.'],
        alias: {
          '@': './',
        },
        extensions: [
          '.ios.js',
          '.android.js',
          '.js',
          '.ts',
          '.tsx',
          '.json',
        ],
      }],
    ],
  };
}; 