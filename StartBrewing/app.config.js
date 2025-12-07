export default ({ config }) => ({
  ...config,
  name: process.env.APP_TITLE || config.name,
  icon: "./assets/icon.png",
  web: {
    ...config.web,
    bundler: 'metro',
    output: "static",
    favicon: config.web?.favicon || "./assets/favicon.png",
    manifest: config.web?.manifest || {
      name: process.env.APP_TITLE || config.name,
      short_name: "MyApp",
      start_url: ".",
      display: "standalone",
      background_color: "#ffffff",
      theme_color: "#000000"
    },
    serviceWorker: true
  },
  extra: {
    apiUrl: process.env.API_URL || 'https://fallback.example.com',
    appTitle: process.env.APP_TITLE || config.name
  },
  plugins: [
    "expo-font"
  ]
});
