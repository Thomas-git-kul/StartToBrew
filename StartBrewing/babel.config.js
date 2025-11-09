module.exports = function (api) {
  const isTest = api.env('test'); // <-- call this first
  api.cache(true); // <-- safe now

  return {
    presets: [
      [
        'babel-preset-expo',
        // only apply NativeWind when NOT in test
        !isTest ? { jsxImportSource: 'nativewind' } : {},
      ],
      // only load nativewind/babel when NOT testing
      ...(!isTest ? ['nativewind/babel'] : []),
    ],
    plugins: [
      // optional Expo/React Native plugins, safely guarded
      !isTest && 'react-native-reanimated/plugin',
      // !isTest && 'expo-router/babel',
    ].filter(Boolean),
  };
};