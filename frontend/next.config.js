module.exports = {
  webpack: (config) => {
    config.experiments = { topLevelAwait: true, layers: true }
    return config
  },
}