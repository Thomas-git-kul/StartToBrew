export default ({ config }) => ({
  ...config,
  name: process.env.APP_TITLE || config.name,
  web: {
    favicon: "./assets/favicon.png",
    manifest: {
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
  }
});
