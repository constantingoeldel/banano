module.exports = {
  webpack: (config) => {
    config.experiments.topLevelAwait = true,
      config.experiments.layers = true
    return config
  },
  experimental: {
    outputStandalone: true,
  },
}