module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      'react-native-reanimated/plugin',
      [
        'module-resolver',
        {
          root: ['./'],
          alias: {
            '@': './frontend/src',
            '@components': './frontend/src/components',
            '@screens': './frontend/src/screens',
            '@services': './frontend/src/services',
            '@hooks': './frontend/src/hooks',
            '@utils': './frontend/src/utils',
            '@styles': './frontend/src/styles',
            '@store': './frontend/src/store',
            '@navigation': './frontend/src/navigation',
            '@assets': './frontend/src/assets',
          },
        },
      ],
    ],
  };
};
