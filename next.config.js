const withMarkdoc = require('@markdoc/next.js')

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

module.exports = withMarkdoc()({
  pageExtensions: ['js', "ts", "tsx", 'md']
})